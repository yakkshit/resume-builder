import { GoogleGenerativeAI } from "@google/generative-ai";
import { execFile } from "node:child_process";
import { writeFile, readFile, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const maxDuration = 120;
export const runtime = "nodejs";

type Provider = "gemini" | "whisper";

type NdjsonEvent =
  | { type: "status"; stage: string; detail?: string }
  | { type: "result"; transcript: string; duration: number; provider: Provider }
  | { type: "error"; message: string };

const pExecFile = promisify(execFile);

async function probeDurationSeconds(filePath: string): Promise<number> {
  try {
    const { stdout } = await pExecFile("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const n = Number(String(stdout).trim());
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

async function extractAudioToWav(inputPath: string, wavPath: string): Promise<void> {
  await pExecFile("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-f",
    "wav",
    wavPath,
  ]);
}

function pickMedia(form: FormData): Blob | null {
  const v = form.get("media") ?? form.get("file") ?? form.get("audio");
  return v instanceof Blob ? v : null;
}

export async function POST(req: Request) {
  const accept = req.headers.get("accept") || "";
  const wantNdjson = accept.includes("application/x-ndjson");

  const form = await req.formData();

  const work = async (emit?: (ev: NdjsonEvent) => void) => {
    const media = pickMedia(form);
    const googleKey =
      String(form.get("googleApiKey") || "").trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const openaiKey = String(form.get("openaiApiKey") || "").trim() || process.env.OPENAI_API_KEY || "";

    if (!media || media.size === 0) {
      throw new Error("Missing media blob.");
    }

    const mime = media.type || "video/webm";
    const ext = mime.includes("webm") ? "webm" : mime.includes("mp4") ? "mp4" : "bin";
    const tmpIn = path.join(os.tmpdir(), `interview-lab-media-${Date.now()}.${ext}`);
    const tmpWav = path.join(os.tmpdir(), `interview-lab-audio-${Date.now()}.wav`);

    emit?.({ type: "status", stage: "upload_received", detail: `${mime} (${media.size} bytes)` });

    try {
      const inBuf = Buffer.from(await media.arrayBuffer());
      await writeFile(tmpIn, inBuf);

      const duration = await probeDurationSeconds(tmpIn);

      // a) Try Gemini multimodal first if available.
      if (googleKey) {
        emit?.({ type: "status", stage: "gemini_transcribe" });
        try {
          const gen = new GoogleGenerativeAI(googleKey);
          const model = gen.getGenerativeModel({ model: "gemini-2.0-flash" });
          const b64 = inBuf.toString("base64");
          const result = await model.generateContent([
            {
              text: "Transcribe all spoken words in this media. Reply with plain transcript text only, no preamble or markdown.",
            },
            { inlineData: { mimeType: mime, data: b64 } },
          ]);
          const transcript = result.response.text()?.trim() || "";
          if (transcript) return { transcript, duration, provider: "gemini" as const };
        } catch (e) {
          console.error("interview-lab transcribe (gemini multimodal):", e);
          // Continue to Whisper fallback below.
        }
      }

      // b) Whisper fallback (audio only) if key exists.
      if (openaiKey) {
        emit?.({ type: "status", stage: "extract_audio", detail: "ffmpeg → wav (16kHz mono)" });
        await extractAudioToWav(tmpIn, tmpWav);
        const wavBuf = Buffer.from(await readFile(tmpWav));

        emit?.({ type: "status", stage: "whisper_transcribe" });
        const fd = new FormData();
        fd.append("model", "whisper-1");
        fd.append("file", new Blob([wavBuf], { type: "audio/wav" }), "audio.wav");
        const wr = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}` },
          body: fd,
        });
        if (!wr.ok) {
          const errText = await wr.text().catch(() => "");
          throw new Error(`Whisper error: ${wr.status} ${errText.slice(0, 200)}`);
        }
        const data = (await wr.json()) as { text?: string };
        const transcript = typeof data.text === "string" ? data.text.trim() : "";
        if (transcript) return { transcript, duration, provider: "whisper" as const };
        throw new Error("Whisper returned an empty transcript.");
      }

      throw new Error(
        "No transcription provider available. Add GOOGLE_GENERATIVE_AI_API_KEY (Gemini) or OPENAI_API_KEY / openaiApiKey (Whisper).",
      );
    } finally {
      await Promise.allSettled([unlink(tmpIn), unlink(tmpWav)]);
    }
  };

  if (!wantNdjson) {
    try {
      const r = await work();
      return Response.json(r);
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Transcription failed" },
        { status: 500 },
      );
    }
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();

  const emit = async (ev: NdjsonEvent) => {
    await writer.write(enc.encode(`${JSON.stringify(ev)}\n`));
  };

  void (async () => {
    try {
      const r = await work((ev) => void emit(ev));
      await emit({ type: "result", transcript: r.transcript, duration: r.duration, provider: r.provider });
    } catch (e) {
      await emit({ type: "error", message: e instanceof Error ? e.message : "Transcription failed" });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

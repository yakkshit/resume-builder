"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Browser speech APIs (not in all TS lib configs) */
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
};

type SpeechRecCtor = new () => SpeechRecognitionLike;
import {
  Clapperboard,
  Code2,
  Loader2,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  Send,
  Sparkles,
  Square,
  Languages,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentEmpty,
  type LabAttachmentData,
} from "@/components/ai-elements/attachments";
import { getMultiModelDocsUrl } from "@/lib/multi-model-docs";
import { getDefaultInterviewLabModelId, isInterviewLabCompatibleModel } from "@/lib/interview-lab-model-support";

type ChatLine = { role: "user" | "assistant"; content: string };

const JS_START = `function twoSum(nums, target) {
  // Return indices [i, j] such that nums[i] + nums[j] === target
  return [0, 1];
}`;

const PY_START = `def two_sum(nums, target):
    # Return indices [i, j] such that nums[i] + nums[j] == target
    return [0, 1]`;

type ToastMeta = { docsUrl?: string };

type Props = {
  /** Dialog mode: controlled by parent. Embedded: always mounted as an inline card (e.g. chat artifact). */
  variant?: "dialog" | "embedded";
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  model: string;
  openaiTranscriptionApiKey: string;
  vercelOidcToken: string;
  onSwitchToGemini?: () => void;
  onToast?: (
    variant: "default" | "success" | "error" | "warning",
    message: string,
    meta?: ToastMeta,
  ) => void;
};

async function readTextStream(res: Response, onDelta: (t: string) => void): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value, { stream: true });
    full += chunk;
    onDelta(full);
  }
  return full;
}

export function InterviewLabPanel({
  variant = "dialog",
  className,
  open,
  onOpenChange,
  apiKey,
  model,
  openaiTranscriptionApiKey,
  vercelOidcToken,
  onSwitchToGemini,
  onToast,
}: Props) {
  const embedded = variant === "embedded";
  const active = embedded || open;
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState("conversation");
  const [srStatus, setSrStatus] = useState("");
  const convInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [convMessages, setConvMessages] = useState<ChatLine[]>([]);
  const [convInput, setConvInput] = useState("");
  const [convLoading, setConvLoading] = useState(false);
  const convEndRef = useRef<HTMLDivElement>(null);

  const [lang, setLang] = useState<"typescript" | "python">("typescript");
  const [code, setCode] = useState(JS_START);
  const [runStatus, setRunStatus] = useState<null | "running" | "done">(null);
  const [runOut, setRunOut] = useState<string>("");
  const [useSandbox, setUseSandbox] = useState<boolean>(false);
  const [lastRunMode, setLastRunMode] = useState<"vercel-sandbox" | "local-vm" | null>(null);
  const [lastRunMs, setLastRunMs] = useState<number | null>(null);
  const [runProgress, setRunProgress] = useState<number>(0);

  const [liveTranscript, setLiveTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [attachments, setAttachments] = useState<LabAttachmentData[]>([]);
  const [liveCoach, setLiveCoach] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [screenNote, setScreenNote] = useState("");
  const [transcribeBusy, setTranscribeBusy] = useState(false);
  const [transcribeUploadPct, setTranscribeUploadPct] = useState<number>(0);
  const [transcribeStage, setTranscribeStage] = useState<string>("");
  const [serverTranscript, setServerTranscript] = useState<string>("");
  const incompatibleWarnedRef = useRef(false);
  const docsUrl = getMultiModelDocsUrl();
  const compatible = isInterviewLabCompatibleModel(model);

  const toast = useCallback(
    (v: "default" | "success" | "error" | "warning", m: string, meta?: ToastMeta) => onToast?.(v, m, meta),
    [onToast],
  );

  useEffect(() => {
    convEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages, convLoading]);

  useEffect(() => {
    if (lang === "typescript") setCode(JS_START);
    else setCode(PY_START);
  }, [lang]);

  useEffect(() => {
    if (!active) return;
    // default on if token exists (Task 6 requirement)
    setUseSandbox(Boolean(vercelOidcToken.trim()));
  }, [active, vercelOidcToken]);

  useEffect(() => {
    if (!active) {
      incompatibleWarnedRef.current = false;
      setListening(false);
      setRecording(false);
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, [active]);

  useEffect(() => {
    if (embedded || !open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [embedded, open, onOpenChange]);

  useEffect(() => {
    if (!active) return;
    if (tab !== "conversation") return;
    // Focus input for quick start.
    window.setTimeout(() => convInputRef.current?.focus(), 50);
  }, [active, tab, compatible]);

  useEffect(() => {
    if (!active || incompatibleWarnedRef.current) return;
    if (!compatible) {
      incompatibleWarnedRef.current = true;
      toast(
        "warning",
        "Interview Lab uses Google Gemini. Switch your chat model to a Gemini option in Profile settings.",
        { docsUrl },
      );
    }
  }, [active, compatible, docsUrl, toast]);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
      });
    };
  }, [attachments]);

  const sendConversation = async () => {
    const text = convInput.trim();
    if (!text || convLoading) return;
    if (!compatible) {
      toast("warning", "Select a Gemini model to start interviewing.", { docsUrl });
      return;
    }
    if (!apiKey.trim()) {
      toast("error", "Add your API key in chat settings (Gemini) to use Interview Lab.");
      return;
    }
    const next: ChatLine[] = [...convMessages, { role: "user", content: text }];
    setConvMessages(next);
    setConvInput("");
    setConvLoading(true);
    setSrStatus("Sending interview message…");
    let assistantSoFar = "";
    setConvMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/interview-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: model.trim() || undefined,
          mode: "conversation",
          messages: next.map((x) => ({ role: x.role, content: x.content })),
        }),
      });
      if (res.status === 422) {
        const j = (await res.json().catch(() => ({}))) as { message?: string; docsUrl?: string };
        setConvMessages((prev) => prev.slice(0, -1));
        toast("warning", j.message || "Switch to a Gemini model for Interview Lab.", {
          docsUrl: j.docsUrl || getMultiModelDocsUrl(),
        });
        setSrStatus("Model incompatible. Switch to Gemini.");
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || res.statusText);
      }
      await readTextStream(res, (full) => {
        assistantSoFar = full;
        setConvMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { role: "assistant", content: full };
          return copy;
        });
      });
      if (assistantSoFar.trim()) setSrStatus("Interview response received.");
    } catch (e) {
      setConvMessages((prev) => prev.slice(0, -1));
      toast("error", e instanceof Error ? e.message : "Interview request failed");
      setSrStatus("Interview request failed.");
    } finally {
      setConvLoading(false);
    }
  };

  const runCode = async () => {
    setRunStatus("running");
    setRunOut("");
    setLastRunMode(null);
    setLastRunMs(null);
    setRunProgress(12);
    setSrStatus("Running code tests…");
    try {
      const language = lang === "typescript" ? "typescript" : "python";
      const startedAt = performance.now();

      // Prefer Vercel Sandbox if toggled + token exists; else local VM route.
      if (useSandbox && vercelOidcToken.trim()) {
        setRunProgress(28);
        const res = await fetch("/api/interview-lab/sandbox-run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oidcToken: vercelOidcToken.trim(),
            language,
            code,
          }),
        });
        setRunProgress(70);
        const j = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          passed?: boolean;
          output?: string;
          error?: string;
          hint?: string;
          ms?: number;
        };
        const elapsed = Math.round(performance.now() - startedAt);
        setLastRunMode("vercel-sandbox");
        setLastRunMs(typeof j.ms === "number" ? Math.round(j.ms) : elapsed);
        if (!res.ok || j.ok === false) {
          toast("warning", j.hint || j.error || "Sandbox run failed — falling back to local VM.");
          // fall through to local VM below
        } else {
          setRunProgress(100);
          const lines: string[] = [];
          lines.push(j.passed ? "All test cases passed." : (j.error || "Some tests failed."));
          if (j.output?.trim()) lines.push("", j.output.trim());
          setRunOut(lines.join("\n"));
          setSrStatus(j.passed ? "All tests passed." : "Some tests failed.");
          return;
        }
      }

      setRunProgress(45);
      const res = await fetch("/api/code-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      setRunProgress(85);
      const data = (await res.json()) as {
        passed?: boolean;
        error?: string;
        feedback?: { summary?: string; strengths?: string[]; improvements?: string[] };
      };
      setLastRunMode("local-vm");
      setLastRunMs(Math.round(performance.now() - startedAt));
      const lines: string[] = [];
      if (data.passed) lines.push("All test cases passed.");
      else lines.push(data.error || "Run finished.");
      if (data.feedback) {
        lines.push("", data.feedback.summary || "");
        if (data.feedback.strengths?.length) lines.push("\nStrengths:\n- " + data.feedback.strengths.join("\n- "));
        if (data.feedback.improvements?.length)
          lines.push("\nImprove:\n- " + data.feedback.improvements.join("\n- "));
      }
      setRunProgress(100);
      setRunOut(lines.join("\n"));
      setSrStatus(data.passed ? "All tests passed." : "Some tests failed.");
    } catch (e) {
      setRunOut(e instanceof Error ? e.message : "Network error");
      setSrStatus("Code run failed.");
    } finally {
      setRunStatus("done");
      window.setTimeout(() => setRunProgress(0), 900);
    }
  };

  const startScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      toast("success", "Screen shared — optional: record a short clip for your session log.");
    } catch {
      toast("warning", "Screen share was cancelled or not supported.");
    }
  };

  const stopScreen = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const toggleRecordClip = () => {
    const stream = mediaStreamRef.current;
    if (!stream) {
      toast("warning", "Start screen share first, then record a clip.");
      return;
    }
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const id = `clip-${Date.now()}`;
        setAttachments((a) => [
          ...a,
          { id, filename: `screen-${id}.webm`, mediaType: mime, url },
        ]);
        toast("success", "Clip saved to attachments.");
      };
      rec.start(200);
      recorderRef.current = rec;
      setRecording(true);
      window.setTimeout(() => {
        if (recorderRef.current === rec && rec.state === "recording") {
          rec.stop();
          setRecording(false);
        }
      }, 20000);
    } catch {
      toast("error", "Could not start recording.");
    }
  };

  const toggleSpeech = () => {
    const w = typeof window !== "undefined" ? (window as Window & { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor }) : null;
    const SR = w?.SpeechRecognition ?? w?.webkitSpeechRecognition;
    if (!SR) {
      toast("warning", "Speech recognition is not available in this browser.");
      return;
    }
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (ev: SpeechRecognitionEventLike) => {
      let t = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        t += ev.results[i][0].transcript;
      }
      if (t.trim()) setLiveTranscript((prev) => (prev ? `${prev} ${t.trim()}` : t.trim()));
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    try {
      r.start();
      recRef.current = r;
      setListening(true);
    } catch {
      toast("error", "Could not start microphone listening.");
    }
  };

  const askLiveCoach = async () => {
    if (!apiKey.trim()) {
      toast("error", "Add your API key in chat settings.");
      return;
    }
    if (!compatible) {
      toast("warning", "Select a Gemini model to use the Live coach.", { docsUrl });
      return;
    }
    const clipNote =
      attachments.length > 0
        ? `The user attached ${attachments.length} screen recording clip(s) in the lab (filenames: ${attachments.map((a) => a.filename).join(", ")}).`
        : "";
    const body = [
      liveTranscript.trim() && `Transcript (speech / notes):\n${liveTranscript.trim()}`,
      screenNote.trim() && `What I'm doing on screen / IDE:\n${screenNote.trim()}`,
      clipNote,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!body.trim()) {
      toast("warning", "Add transcript, screen notes, or a recording first.");
      return;
    }

    setLiveLoading(true);
    setLiveCoach("");
    try {
      const res = await fetch("/api/interview-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: model.trim() || undefined,
          mode: "live",
          messages: [{ role: "user", content: body }],
        }),
      });
      if (res.status === 422) {
        const j = (await res.json().catch(() => ({}))) as { message?: string; docsUrl?: string };
        toast("warning", j.message || "Switch to a Gemini model for Interview Lab.", {
          docsUrl: j.docsUrl || getMultiModelDocsUrl(),
        });
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || res.statusText);
      }
      await readTextStream(res, setLiveCoach);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Coach request failed");
    } finally {
      setLiveLoading(false);
    }
  };

  const transcribeLastClip = async () => {
    const webm = attachments.filter((a) => a.mediaType?.includes("webm") && a.url);
    if (!webm.length) {
      toast("warning", "Record a screen clip first (WebM).");
      return;
    }
    if (!apiKey.trim() && !openaiTranscriptionApiKey.trim()) {
      toast(
        "error",
        "Add your Google API key in the model menu, or an OpenAI key under sidebar → Integrations → Clip transcription.",
      );
      return;
    }
    const last = webm[webm.length - 1]!;
    setTranscribeBusy(true);
    setTranscribeUploadPct(0);
    setTranscribeStage("Preparing upload…");
    setServerTranscript("");
    try {
      const blob = await fetch(last.url!).then((r) => r.blob());
      const fd = new FormData();
      fd.append("media", blob, last.filename || "clip.webm");
      if (apiKey.trim()) fd.append("googleApiKey", apiKey.trim());
      if (openaiTranscriptionApiKey.trim()) fd.append("openaiApiKey", openaiTranscriptionApiKey.trim());

      const xhr = new XMLHttpRequest();
      const url = "/api/interview-lab/transcribe";
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Accept", "application/x-ndjson");

      let consumed = 0;
      let transcriptLocal = "";
      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        setTranscribeUploadPct(Math.round((ev.loaded / ev.total) * 100));
        if (ev.loaded < ev.total) setTranscribeStage("Uploading…");
      };

      xhr.onprogress = () => {
        const text = xhr.responseText || "";
        const chunk = text.slice(consumed);
        consumed = text.length;
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const ev = JSON.parse(line) as
              | { type: "status"; stage: string; detail?: string }
              | { type: "result"; transcript: string; duration: number; provider: "gemini" | "whisper" }
              | { type: "error"; message: string };
            if (ev.type === "status") {
              setTranscribeStage(ev.detail ? `${ev.stage}: ${ev.detail}` : ev.stage);
            } else if (ev.type === "result") {
              setTranscribeStage(`Done (${ev.provider}, ${ev.duration.toFixed(1)}s)`);
              transcriptLocal = ev.transcript;
              setServerTranscript(ev.transcript);
            } else if (ev.type === "error") {
              setTranscribeStage("Error");
              throw new Error(ev.message);
            }
          } catch {
            // ignore partial/incomplete lines
          }
        }
      };

      const done = await new Promise<{ ok: boolean; status: number; statusText: string }>((resolve) => {
        xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, statusText: xhr.statusText });
        xhr.onerror = () => resolve({ ok: false, status: 0, statusText: "Network error" });
        xhr.onabort = () => resolve({ ok: false, status: 0, statusText: "Aborted" });
        xhr.send(fd);
      });

      if (!done.ok) throw new Error(done.statusText || `HTTP ${done.status}`);
      if (transcriptLocal.trim()) {
        setLiveTranscript((prev) => (prev ? `${prev}\n\n${transcriptLocal.trim()}` : transcriptLocal.trim()));
        toast("success", "Transcription added to your notes.");
      } else {
        toast("warning", "No transcript returned.");
      }
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setTranscribeBusy(false);
    }
  };

  const header = embedded ? (
    <div className="shrink-0 space-y-1 border-b border-border/50 bg-muted/20 px-4 py-3 text-left sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
          <Clapperboard className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">Interview Lab</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            AI rounds, code checks (Node-style JS/TS + Python feedback), and live voice + screen practice.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full border-border/60"
          onClick={() => setFullscreen((f) => !f)}
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {fullscreen ? "Exit" : "Fullscreen"}
        </Button>
      </div>
    </div>
  ) : (
    <DialogHeader className="shrink-0 space-y-1 border-b border-border/50 bg-muted/20 px-4 py-3 pr-14 text-left sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
          <Clapperboard className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <DialogTitle className="text-base font-semibold tracking-tight sm:text-lg">Interview Lab</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground sm:text-sm">
            AI rounds, code checks (Node-style JS/TS + Python feedback), and live voice + screen practice.
          </DialogDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full border-border/60"
          onClick={() => setFullscreen((f) => !f)}
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {fullscreen ? "Exit" : "Fullscreen"}
        </Button>
      </div>
    </DialogHeader>
  );

  const tabShellClass = cn(
    "flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 sm:px-5",
    !embedded && "max-sm:pb-[5.25rem]",
  );
  const tabListClass = cn(
    "mb-3 grid h-auto w-full shrink-0 grid-cols-3 gap-1 rounded-xl bg-muted/40 p-1",
    !embedded &&
      "max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-[80] max-sm:mb-0 max-sm:rounded-none max-sm:border-t max-sm:border-border/50 max-sm:bg-background/90 max-sm:p-2 max-sm:backdrop-blur",
  );

  const inner = (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {srStatus}
      </p>
      {header}

      <Tabs value={tab} onValueChange={setTab} className={tabShellClass}>
          {!compatible ? (
            <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100/95">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">Interview Lab requires Gemini.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg bg-amber-500 text-amber-950 hover:bg-amber-400"
                    onClick={() => {
                      if (onSwitchToGemini) onSwitchToGemini();
                      else toast("warning", `Switch your model to ${getDefaultInterviewLabModelId()}.`, { docsUrl });
                    }}
                  >
                    Switch to Gemini
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-amber-500/30 bg-transparent text-amber-100 hover:bg-amber-500/10"
                    onClick={() => window.open(docsUrl, "_blank", "noopener,noreferrer")}
                  >
                    Learn more
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-amber-100/85">
                Current model: <span className="font-mono">{model || "(none)"}</span>
              </p>
            </div>
          ) : null}
          <TabsList className={tabListClass}>
            <TabsTrigger value="conversation" className="gap-1.5 rounded-lg text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5" />
              Interview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1.5 rounded-lg text-xs sm:text-sm">
              <Code2 className="h-3.5 w-3.5" />
              Code
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-1.5 rounded-lg text-xs sm:text-sm">
              <Monitor className="h-3.5 w-3.5" />
              Live
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversation" className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
            <ScrollArea className="min-h-0 flex-1 rounded-xl border border-border/40 bg-card/30 px-3 py-3">
              <div className="space-y-4 pr-2">
                {convMessages.length === 0 && (
                  <div className="rounded-xl border border-dashed border-violet-500/25 bg-violet-500/5 px-4 py-6 text-center text-sm text-muted-foreground">
                    <Sparkles className="mx-auto mb-2 h-8 w-8 text-violet-500/80" />
                    Start a realistic multi-round interview. Answer each question; the model will reply with the next
                    prompt.
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {convMessages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                        m.role === "user"
                          ? "ml-6 bg-primary text-primary-foreground"
                          : "mr-4 border border-border/50 bg-background/80",
                      )}
                    >
                      <Badge variant="secondary" className="mb-1 text-[10px]">
                        {m.role === "user" ? "You" : "Interviewer"}
                      </Badge>
                      <p className="whitespace-pre-wrap">{m.content || (convLoading && i === convMessages.length - 1 ? "…" : "")}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {convLoading ? (
                  <div className="mr-4 space-y-2 rounded-2xl border border-border/50 bg-background/80 px-3 py-3">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted/40" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-muted/40" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted/40" />
                  </div>
                ) : null}
                <div ref={convEndRef} />
              </div>
            </ScrollArea>
            <div className="mt-3 flex shrink-0 gap-2">
              <Textarea
                ref={convInputRef}
                value={convInput}
                onChange={(e) => setConvInput(e.target.value)}
                placeholder={compatible ? "Type your answer…" : "Select a Gemini model to start interviewing"}
                disabled={!compatible}
                className={cn(
                  "min-h-[52px] flex-1 resize-none rounded-xl border-border/60 bg-background/90 text-sm",
                  !compatible && "cursor-not-allowed opacity-70",
                )}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
                    e.preventDefault();
                    void sendConversation();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="h-[52px] w-[52px] shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-md"
                disabled={convLoading || !compatible}
                onClick={() => void sendConversation()}
                aria-label="Send"
              >
                {convLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-0 flex min-h-0 flex-1 flex-col gap-3 data-[state=inactive]:hidden">
            <p className="text-xs text-muted-foreground">
              Implement <strong>twoSum</strong> (JS/TS: <code className="rounded bg-muted px-1">twoSum</code>, Python:{" "}
              <code className="rounded bg-muted px-1">two_sum</code>). JavaScript runs in a local VM sandbox; Python
              gets structured feedback. For untrusted or arbitrary code in production, use{" "}
              <a
                href="https://vercel.com/docs/vercel-sandbox"
                className="text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Vercel Sandbox
              </a>{" "}
              or a judge service.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs">Language</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as "typescript" | "python")}>
                <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript / Node-style</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5">
                <Label className="text-[10px] text-muted-foreground">Use Vercel Sandbox</Label>
                <Switch
                  checked={useSandbox}
                  onCheckedChange={(v) => setUseSandbox(v)}
                  aria-label="Toggle Vercel Sandbox execution"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                disabled={runStatus === "running"}
                onClick={() => void runCode()}
              >
                {runStatus === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run tests"}
              </Button>
            </div>
            {runProgress > 0 ? (
              <div className="space-y-2">
                <Progress value={runProgress} className="h-2 rounded-full bg-muted/40" />
                <p className="text-[10px] text-muted-foreground">Running tests…</p>
              </div>
            ) : null}
            {lastRunMode ? (
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                <Badge variant="secondary" className="h-5 rounded-md text-[10px]">
                  {lastRunMode === "vercel-sandbox" ? "Vercel Sandbox" : "Local VM"}
                </Badge>
                {typeof lastRunMs === "number" ? <span>{lastRunMs}ms</span> : null}
              </div>
            ) : null}
            <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[220px] flex-1 font-mono text-xs leading-relaxed sm:min-h-[260px] sm:text-sm md:min-h-0"
                spellCheck={false}
              />
              <ScrollArea className="max-h-56 rounded-xl border border-border/50 bg-muted/20 p-3 text-xs md:max-h-none">
                <pre className="whitespace-pre-wrap font-mono text-muted-foreground">{runOut || "Output appears here."}</pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="live" className="mt-0 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto data-[state=inactive]:hidden">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-border/50 bg-card/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="secondary" className="gap-1.5 rounded-lg" onClick={() => void startScreen()}>
                    <Monitor className="h-3.5 w-3.5" />
                    Share screen
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={stopScreen}>
                    Stop
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={recording ? "destructive" : "outline"}
                    className="gap-1.5 rounded-lg"
                    onClick={toggleRecordClip}
                  >
                    {recording ? <Square className="h-3 w-3 fill-current" /> : null}
                    {recording ? "Stop clip" : "Record clip"}
                  </Button>
                </div>
                <video ref={videoRef} className="aspect-video w-full rounded-lg bg-black object-contain" muted playsInline />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={listening ? "destructive" : "secondary"}
                    className="gap-1.5 rounded-lg"
                    onClick={toggleSpeech}
                  >
                    {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {listening ? "Stop mic" : "Voice to text"}
                  </Button>
                </div>
                <Label className="text-xs">Transcript & notes</Label>
                <Textarea
                  value={liveTranscript}
                  onChange={(e) => setLiveTranscript(e.target.value)}
                  placeholder="Speech appears here — edit freely or type what you're building."
                  className="min-h-[100px] rounded-xl text-sm"
                />
                <Label className="text-xs">What’s on screen (optional)</Label>
                <Textarea
                  value={screenNote}
                  onChange={(e) => setScreenNote(e.target.value)}
                  placeholder="e.g. VS Code — implementing auth middleware…"
                  className="min-h-[72px] rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Session attachments</p>
              {attachments.length === 0 ? (
                <AttachmentEmpty />
              ) : (
                <Attachments variant="grid">
                  {attachments.map((a) => (
                    <Attachment key={a.id} data={a} onRemove={() => {
                      if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
                      setAttachments((x) => x.filter((y) => y.id !== a.id));
                    }}>
                      <AttachmentPreview data={a} />
                      <AttachmentInfo data={a} showMediaType />
                    </Attachment>
                  ))}
                </Attachments>
              )}
              {attachments.some((a) => a.mediaType?.includes("webm")) ? (
                <div className="mt-2 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-xl border-border/60 sm:w-auto"
                    disabled={transcribeBusy}
                    onClick={() => void transcribeLastClip()}
                  >
                    {transcribeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                    Transcribe latest clip (server)
                  </Button>
                  {transcribeBusy || serverTranscript || transcribeStage ? (
                    <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground/90">Transcription</span>
                        {transcribeBusy ? <span>{transcribeUploadPct}%</span> : null}
                      </div>
                      <p className="mt-1">{transcribeStage || "…"}</p>
                      {serverTranscript ? (
                        <Textarea
                          value={serverTranscript}
                          onChange={(e) => setServerTranscript(e.target.value)}
                          className="mt-2 min-h-[84px] rounded-xl text-sm"
                          placeholder="Transcript appears here…"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              disabled={liveLoading}
              onClick={() => void askLiveCoach()}
            >
              {liveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Get AI coach feedback
            </Button>
            {liveCoach ? (
              <ScrollArea className="max-h-48 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm">
                <p className="whitespace-pre-wrap leading-relaxed">{liveCoach}</p>
              </ScrollArea>
            ) : null}
          </TabsContent>
        </Tabs>
    </>
  );

  if (embedded) {
    return (
      <div
        className={cn(
          "flex w-full max-w-[min(980px,100%)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-background via-background to-muted/20 shadow-inner",
          fullscreen
            ? "fixed inset-0 z-[55] h-[100dvh] max-h-[100dvh] rounded-none"
            : "min-h-[min(480px,70vh)] max-h-[min(76vh,820px)]",
          className,
        )}
      >
        {inner}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden border-border/60 bg-gradient-to-b from-background via-background to-muted/20 p-0 shadow-2xl duration-300",
          "max-sm:fixed max-sm:inset-0 max-sm:left-0 max-sm:top-0 max-sm:z-[60] max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          fullscreen
            ? "fixed inset-0 left-0 top-0 z-[60] h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none sm:rounded-none"
            : "h-[min(88dvh,820px)] max-h-[100dvh] w-[min(96vw,920px)] max-w-[96vw] sm:max-w-[920px]",
        )}
      >
        {inner}
      </DialogContent>
    </Dialog>
  );
}

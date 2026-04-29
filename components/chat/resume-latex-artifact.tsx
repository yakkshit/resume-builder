"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { FileCode2, Eye, Copy, Check, FileDown, Printer, Loader2 } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatArtifactWindow } from "@/components/chat/chat-artifact-chrome";
import { cn } from "@/lib/utils";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";

const LS_RESUME = "chatResumeLatex";
const LS_COVER = "chatCoverLetterLatex";

const DEFAULT_LATEX = String.raw`% Edit your resume in LaTeX — math segments render in Preview
\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage{hyperref}

\begin{document}
\section*{Your Name}
\texttt{you@email.com} \quad \texttt{+1-555-0100}

\section*{Summary}
Experienced engineer focused on shipping reliable systems.

\section*{Experience}
\textbf{Acme Corp} \hfill 2022 -- Present \\
\textit{Senior Engineer} --- Led migration to microservices.

\end{document}
`;

const DEFAULT_COVER_LATEX = String.raw`% Cover letter — edit and compile externally or use Download PDF when configured
\documentclass[11pt]{letter}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}

\begin{document}
\begin{letter}{Hiring Manager \\ Company Inc. \\ City, ST}

\opening{Dear Hiring Manager,}

I am writing to express my interest in the role. My background aligns with your needs, and I would welcome the opportunity to contribute.

\closing{Sincerely,}
Your Name

\end{letter}
\end{document}
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Best-effort KaTeX for math-like fragments; full TeX compilation is not available in-browser. */
function buildLatexPreviewHtml(source: string): string {
  const s = source || "";
  const segments: { html: string; display: boolean }[] = [];
  const re = /\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$([^$\n]+)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      segments.push({ html: `<pre class="latex-src">${escapeHtml(s.slice(last, m.index))}</pre>`, display: false });
    }
    const body = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? "").trim();
    const display = Boolean(m[1] || m[3]);
    try {
      const frag = katex.renderToString(body, {
        displayMode: display,
        throwOnError: false,
        output: "html",
        trust: false,
      });
      segments.push({ html: `<div class="katex-wrap ${display ? "block" : "inline"}">${frag}</div>`, display });
    } catch (_err) {
      segments.push({ html: `<pre class="latex-err">${escapeHtml(body)}</pre>`, display: false });
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) {
    segments.push({ html: `<pre class="latex-src">${escapeHtml(s.slice(last))}</pre>`, display: false });
  }
  if (segments.length === 0) {
    return `<pre class="latex-src">${escapeHtml(s)}</pre>`;
  }
  return segments.map((x) => x.html).join("");
}

const CHAT_ARTIFACT = cn(
  "overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1e1e24]/95 to-[#151518]/98",
  "shadow-[0_24px_64px_-28px_rgba(77,165,252,0.2)] backdrop-blur-md",
);
const CHAT_ARTIFACT_HEADER = "flex flex-row items-center gap-3 border-b border-white/10 bg-white/[0.04] py-3 px-4";

export function ResumeLatexArtifact({
  initialLatex,
  kind = "resume",
}: {
  initialLatex?: string;
  kind?: "resume" | "cover-letter";
}) {
  const lsKey = kind === "cover-letter" ? LS_COVER : LS_RESUME;
  const defaultBody = kind === "cover-letter" ? DEFAULT_COVER_LATEX : DEFAULT_LATEX;
  const titleLabel = kind === "cover-letter" ? "Cover letter LaTeX" : "Résumé LaTeX";
  const texBasename = kind === "cover-letter" ? "cover-letter.tex" : "resume.tex";

  const [latex, setLatex] = useState(() => {
    if (typeof initialLatex === "string" && initialLatex.trim()) return initialLatex;
    const stored = typeof window !== "undefined" ? tryLocalStorageGet(lsKey) : null;
    if (stored && stored.trim()) return stored;
    return defaultBody;
  });
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (typeof initialLatex === "string" && initialLatex.trim()) {
      setLatex(initialLatex);
    }
  }, [initialLatex]);

  const persist = useCallback(
    (next: string) => {
      setLatex(next);
      tryLocalStorageSet(lsKey, next);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(kind === "cover-letter" ? "chat-cover-letter-latex-updated" : "chat-resume-latex-updated"),
        );
      }
    },
    [kind, lsKey],
  );

  const previewHtml = useMemo(() => buildLatexPreviewHtml(latex), [latex]);

  const copy = () => {
    void navigator.clipboard.writeText(latex);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const downloadTex = () => {
    const blob = new Blob([latex], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = texBasename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPrintablePdf = () => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    const safe = escapeHtml(latex);
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(titleLabel)}</title>
      <style>
        body{font-family:ui-monospace,monospace;font-size:11px;padding:16px;color:#111}
        h1{font-size:14px;margin:0 0 12px;font-family:system-ui,sans-serif}
        pre{white-space:pre-wrap;word-break:break-word;border:1px solid #ccc;padding:12px;border-radius:8px;background:#fafafa}
        @media print{body{padding:0}pre{border:none}}
      </style></head><body>
      <h1>${escapeHtml(titleLabel)} — print to PDF</h1>
      <p style="font-family:system-ui,sans-serif;font-size:12px;margin:0 0 12px">Use your browser’s print dialog and choose “Save as PDF”.</p>
      <pre>${safe}</pre>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`);
    w.document.close();
  };

  const downloadCompiledPdf = async () => {
    setPdfBusy(true);
    try {
      const res = await fetch("/api/latex-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex }),
      });
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = kind === "cover-letter" ? "cover-letter.pdf" : "resume.pdf";
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      let detail = "";
      try {
        const j = (await res.json()) as { message?: string; code?: string };
        detail = j?.message || j?.code || "";
      } catch {
        detail = await res.text().catch(() => "");
      }
      console.warn("[ResumeLatexArtifact] PDF compile failed", res.status, detail);
      openPrintablePdf();
    } catch (e) {
      console.error("[ResumeLatexArtifact] PDF compile request error", e);
      openPrintablePdf();
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={cn(CHAT_ARTIFACT_HEADER, "justify-between gap-2")}
      contentClassName="space-y-0 p-3 pt-0"
      title={
        <CardTitle className="flex items-center gap-2 text-sm text-white">
          <FileCode2 className="h-4 w-4 text-[#4da5fc]" />
          {titleLabel}
        </CardTitle>
      }
      trailing={
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
            onClick={downloadTex}
          >
            <FileDown className="h-3.5 w-3.5" />
            .tex
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
            onClick={() => void downloadCompiledPdf()}
            disabled={pdfBusy}
            title="Compile via LaTeXOnline.cc (free); if compile fails or source is too long, opens print-to-PDF"
          >
            {pdfBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
            onClick={openPrintablePdf}
            title="Open a print dialog — choose Save as PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
            onClick={copy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-[11px] leading-relaxed text-[#8a8a8f]">
        Edits are saved locally and sent with each chat request as context. Preview renders math with KaTeX; full TeX
        layout is shown as source.         PDF uses the free{" "}
        <a className="text-[#4da5fc] underline" href="https://github.com/aslushnikov/latex-online" target="_blank" rel="noreferrer">
          LaTeXOnline.cc
        </a>{" "}
        service (URL compile; very large files may need Print → Save as PDF).
      </p>
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="gap-2 text-xs sm:text-sm">
            <FileCode2 className="h-3.5 w-3.5" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 text-xs sm:text-sm">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-3">
          <Textarea
            value={latex}
            onChange={(e) => persist(e.target.value)}
            spellCheck={false}
            className="min-h-[280px] resize-y font-mono text-xs leading-relaxed text-[#e8e8ed] sm:min-h-[320px] sm:text-sm"
            placeholder="Paste or write LaTeX…"
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-3">
          <ScrollArea className="h-[min(360px,50vh)] rounded-xl border border-white/10 bg-[#0c0c10]/90 p-3">
            {/* KaTeX output is trusted HTML from this library with throwOnError: false */}
            <div
              className={cn(
                "latex-preview prose prose-invert max-w-none text-sm",
                "[&_.latex-src]:whitespace-pre-wrap [&_.latex-src]:font-mono [&_.latex-src]:text-[11px] [&_.latex-src]:text-[#b8b8c0]",
                "[&_.katex-wrap.block]:my-3 [&_.katex-wrap.block]:text-center",
                "[&_.latex-err]:text-rose-300",
              )}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </ChatArtifactWindow>
  );
}

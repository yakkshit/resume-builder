"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Mic2,
  Plug,
  Server,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getMultiModelDocsUrl } from "@/lib/multi-model-docs";
import { getDefaultInterviewLabModelId, isInterviewLabCompatibleModel } from "@/lib/interview-lab-model-support";
import { copyToClipboard } from "@/lib/clipboard";
import { setVercelOidcToken } from "@/lib/session-secrets";
import type { ChatSettings } from "./chat-store";

type ToastVariant = "default" | "success" | "error" | "warning";

type Props = {
  settings: ChatSettings;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
  onToast?: (variant: ToastVariant, message: string) => void;
};

export function SidebarIntegrationsAccordion({ settings, onSettingsChange, onToast }: Props) {
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [copied, setCopied] = useState<null | string>(null);

  const docsHref =
    settings.integrationsDocsUrlOverride.trim() || getMultiModelDocsUrl();
  const labOk = isInterviewLabCompatibleModel(settings.model);
  const defaultGemini = getDefaultInterviewLabModelId();
  const modelLabel = settings.model?.trim() || "(none)";

  const copyCmd = async (cmd: string) => {
    const ok = await copyToClipboard(cmd);
    if (ok) {
      setCopied(cmd);
      onToast?.("success", "Copied to clipboard");
      window.setTimeout(() => setCopied((prev) => (prev === cmd ? null : prev)), 1400);
    } else {
      onToast?.("error", "Could not copy");
    }
  };

  const testSandbox = async () => {
    setSandboxBusy(true);
    try {
      const res = await fetch("/api/interview-lab/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oidcToken: settings.vercelOidcToken.trim() || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        hint?: string;
        error?: string;
      };
      if (j.ok) onToast?.("success", "Vercel Sandbox responded — echo command succeeded.");
      else onToast?.("warning", j.hint || j.error || "Sandbox check failed.");
    } catch {
      onToast?.("error", "Could not reach sandbox API.");
    } finally {
      setSandboxBusy(false);
    }
  };

  return (
    <div className="border-b border-white/10 px-3 py-2 sm:px-4">
      <p className="mb-2 flex items-center gap-1.5 rounded-xl border border-white/10 bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
        <Plug className="h-3.5 w-3.5 text-cyan-300" />
        Integrations
      </p>
      <Accordion type="multiple" className="w-full" defaultValue={["chat-api"]}>
        <AccordionItem value="chat-api" className="border-white/10">
          <AccordionTrigger className="min-h-[44px] py-2.5 text-left text-xs font-semibold hover:no-underline [&>svg]:text-muted-foreground">
            <span className="flex flex-1 flex-wrap items-center gap-2 pr-2">
              <KeyRound className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
              {"Chat & Interview Lab"}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={labOk ? "ok" : "bad"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="inline-flex"
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-6 rounded-md px-2 text-[10px] font-semibold",
                      labOk
                        ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                        : "border border-amber-500/40 bg-amber-500/15 text-amber-100",
                    )}
                  >
                    <span className="mr-1 inline-flex">
                      {labOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    </span>
                    {labOk ? `Compatible — ${modelLabel}` : `Incompatible — ${modelLabel}`}
                  </Badge>
                </motion.span>
              </AnimatePresence>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3 pt-0 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              The same <span className="text-foreground/90">API key</span> you set in the composer (model menu → API key)
              powers Google Gemini chat and <span className="text-foreground/90">Interview Lab</span>. It is kept in
              memory only for this session.
            </p>
            {!labOk ? (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-amber-100/95">
                <p>
                  Your selected model is not Gemini. Switch to <span className="font-mono">{defaultGemini}</span> to use
                  Interview Lab.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      type="button"
                      size="sm"
                      className="h-11 w-full rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-400 sm:h-9 sm:w-auto"
                      onClick={() => {
                        onSettingsChange({ model: defaultGemini });
                        onToast?.("success", `Switched model to ${defaultGemini}`);
                      }}
                    >
                      <ArrowRightLeft className="mr-1 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      Switch to Gemini
                    </Button>
                  </motion.div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-11 w-full rounded-xl border-amber-500/30 bg-transparent text-amber-100 hover:bg-amber-500/10 sm:h-9 sm:w-auto"
                    onClick={() => window.open(docsHref, "_blank", "noopener,noreferrer")}
                  >
                    Learn more
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground sm:min-w-[7rem]">
                Docs URL
              </Label>
              <Input
                value={settings.integrationsDocsUrlOverride}
                onChange={(e) => onSettingsChange({ integrationsDocsUrlOverride: e.target.value })}
                placeholder="Override (optional) — else .env NEXT_PUBLIC_MULTI_MODEL_*"
                className="h-8 flex-1 rounded-lg border-white/15 bg-black/25 text-xs placeholder:text-muted-foreground/50"
              />
            </div>
            <a
              href={docsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-white/10 hover:text-cyan-50"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {"Model & provider reference"}
            </a>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sandbox" className="border-white/10">
          <AccordionTrigger className="min-h-[44px] py-2.5 text-left text-xs font-semibold hover:no-underline [&>svg]:text-muted-foreground">
            <span className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 shrink-0 text-violet-300" />
              Vercel Sandbox
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3 pt-0 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              Run isolated interview / judge code on Vercel&apos;s VMs. Install{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-[10px]">@vercel/sandbox</code>, then{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-[10px]">vercel link</code> and{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-[10px]">vercel env pull</code> for{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-[10px]">VERCEL_OIDC_TOKEN</code>.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "pnpm add @vercel/sandbox",
                "vercel link",
                "vercel env pull",
                "npx plugins add vercel/vercel-plugin",
              ].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => void copyCmd(cmd)}
                  className={cn(
                    "group flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[11px] text-foreground/90 shadow-sm transition-colors hover:bg-white/10",
                    copied === cmd && "border-emerald-500/40 bg-emerald-500/10",
                  )}
                  aria-label={`Copy command: ${cmd}`}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">{cmd}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                  </span>
                </button>
              ))}
            </div>
            <p>
              Optional CLI:{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-[10px]">npx plugins add vercel/vercel-plugin</code>{" "}
              — follow{" "}
              <a
                href="https://vercel.com/docs/vercel-sandbox"
                className="text-cyan-300 underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                current Vercel docs
              </a>
              .
            </p>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                OIDC token / PAT (session only)
              </Label>
              <Input
                type="password"
                autoComplete="off"
                value={settings.vercelOidcToken}
                onChange={(e) => {
                  const v = e.target.value;
                  setVercelOidcToken(v);
                  onSettingsChange({ vercelOidcToken: v });
                }}
                placeholder="Paste token to test from this browser, or rely on server env"
                className="h-8 rounded-lg border-white/15 bg-black/25 text-xs placeholder:text-muted-foreground/50"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={sandboxBusy}
              className="h-11 w-full rounded-xl text-xs sm:h-9 sm:w-auto"
              onClick={() => void testSandbox()}
            >
              {sandboxBusy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing…
                </span>
              ) : (
                "Test Sandbox connection"
              )}
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="transcription" className="border-white/10">
          <AccordionTrigger className="min-h-[44px] py-2.5 text-left text-xs font-semibold hover:no-underline [&>svg]:text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mic2 className="h-3.5 w-3.5 shrink-0 text-sky-300" />
              Clip transcription
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3 pt-0 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              In Interview Lab → Live, recorded clips can be sent to the server:{" "}
              <span className="text-foreground/90">Gemini</span> uses your chat Google key; optionally add an{" "}
              <span className="text-foreground/90">OpenAI</span> key for Whisper if you prefer.
            </p>
            <p>Browser speech-to-text still works without any server keys.</p>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                OpenAI API key (optional, session only)
              </Label>
              <Input
                type="password"
                autoComplete="off"
                value={settings.openaiTranscriptionApiKey}
                onChange={(e) => onSettingsChange({ openaiTranscriptionApiKey: e.target.value })}
                placeholder="sk-… for Whisper fallback"
                className="h-8 rounded-lg border-white/15 bg-black/25 text-xs placeholder:text-muted-foreground/50"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

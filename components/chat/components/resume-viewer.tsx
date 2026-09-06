"use client";

/**
 * ResumeViewer — Chat inline component that embeds the REAL resume builder
 * (ResumeEditor + PDF Preview) from the homepage, sharing the same
 * localStorage "resumeData" key so changes are immediately reflected.
 * Use syncWithGlobalResume=false for older chat bubbles so each stays a snapshot.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { SetStateAction } from "react";
import dynamic from "next/dynamic";
import { FileText, Eye, Edit, Undo2, Redo2 } from "lucide-react";
import { ArtifactTrafficLights, type ArtifactPanelMode } from "@/components/chat/chat-artifact-chrome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import ResumeEditor from "@/components/resume-coverletter/resume-editor";
import { defaultResumeData } from "@/lib/default-resume-data";
import type { ResumeData, Template } from "@/lib/types";
import { resumeTemplates } from "@/components/pdf-templates";
import { sanitizeResumeData } from "@/lib/sanitize-resume-data";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
import { deepMerge } from "@/lib/utils";
import { normalizeResumePayloadToFlat } from "@/lib/normalize-sections-resume";

// PDF viewer loaded dynamically (client-only, heavy)
const PdfPreviewClient = dynamic(
  () => import("@/components/resume-coverletter/pdf-viewer"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Loading preview…</div> }
);

const TEMPLATE_OPTIONS = (Object.keys(resumeTemplates) as Template[]).map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

function stripBoldMarkersDeep(input: any): any {
  if (typeof input === "string") return input.replace(/\*\*/g, "");
  if (!input || typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(stripBoldMarkersDeep);
  const out: any = {};
  for (const [k, v] of Object.entries(input)) out[k] = stripBoldMarkersDeep(v);
  return out;
}

function stripProfilePictureDeep(input: any): any {
  if (!input || typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(stripProfilePictureDeep);
  const out: any = {};
  for (const [k, v] of Object.entries(input)) {
    if (k === "profilePicture") continue;
    out[k] = stripProfilePictureDeep(v);
  }
  return out;
}

const PROFILE_CONTEXT_TOGGLE_ID = "ai-chat-use-profile-context";
const PROFILE_STORE_ID = "ai-chat-profile";

function normalizeUrlLike(s: string): string {
  const v = (s || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function getGithubFromBasicInfo(basicInfo: any): string {
  const links = Array.isArray(basicInfo?.portfolioLinks) ? basicInfo.portfolioLinks : [];
  for (const l of links) {
    if (!l || typeof l !== "object") continue;
    const platform = String((l as any).platform || "").toLowerCase();
    const url = String((l as any).url || "");
    if (platform.includes("github") || /github\.com/i.test(url)) return url;
  }
  return "";
}

function setGithubOnBasicInfo(basicInfo: any, github: string) {
  if (!basicInfo || typeof basicInfo !== "object") return;
  const gh = normalizeUrlLike(github);
  const links = Array.isArray(basicInfo.portfolioLinks) ? [...basicInfo.portfolioLinks] : [];
  const idx = links.findIndex((l) => {
    const platform = String(l?.platform || "").toLowerCase();
    const url = String(l?.url || "");
    return platform.includes("github") || /github\.com/i.test(url);
  });
  if (!gh) {
    if (idx >= 0) links.splice(idx, 1);
    basicInfo.portfolioLinks = links;
    return;
  }
  const entry = { platform: "GitHub", url: gh };
  if (idx >= 0) links[idx] = entry;
  else links.push(entry);
  basicInfo.portfolioLinks = links;
}

function applyIdentitySourceRule(nextResume: any, currentResume: any): any {
  const out = nextResume && typeof nextResume === "object" ? nextResume : {};
  if (!out.basicInfo || typeof out.basicInfo !== "object") out.basicInfo = {};
  const currentBasic = currentResume?.basicInfo && typeof currentResume.basicInfo === "object" ? currentResume.basicInfo : {};

  const toggleRaw = tryLocalStorageGet(PROFILE_CONTEXT_TOGGLE_ID);
  const useProfile = toggleRaw !== "false";

  const fields = ["name", "email", "phone", "location", "linkedin", "website"] as const;
  /** Values already merged from assistant JSON — must not be replaced by pre-merge state alone. */
  const pick = (fromMerged: string, profileVal: string, previous: string) =>
    profileVal || fromMerged || previous || "";

  if (useProfile) {
    let profile: any = {};
    try {
      const raw = tryLocalStorageGet(PROFILE_STORE_ID);
      profile = raw ? JSON.parse(raw) : {};
    } catch {
      profile = {};
    }
    for (const f of fields) {
      const pv = typeof profile?.[f] === "string" ? profile[f].trim() : "";
      const fromMerged =
        typeof (out.basicInfo as any)[f] === "string" ? String((out.basicInfo as any)[f]).trim() : "";
      const previous = typeof (currentBasic as any)?.[f] === "string" ? String((currentBasic as any)[f]).trim() : "";
      (out.basicInfo as any)[f] = pick(fromMerged, pv, previous);
    }
    const picRaw = typeof profile?.profilePicture === "string" ? profile.profilePicture.trim() : "";
    if (
      picRaw &&
      (picRaw.startsWith("data:image/") || picRaw.startsWith("https://") || picRaw.startsWith("http://"))
    ) {
      (out.basicInfo as any).profilePicture = picRaw;
    }
    const gh = typeof profile?.github === "string" ? profile.github.trim() : "";
    setGithubOnBasicInfo(
      out.basicInfo,
      gh || getGithubFromBasicInfo(out.basicInfo) || getGithubFromBasicInfo(currentBasic),
    );
  } else {
    for (const f of fields) {
      const fromMerged =
        typeof (out.basicInfo as any)[f] === "string" ? String((out.basicInfo as any)[f]).trim() : "";
      const previous = typeof (currentBasic as any)?.[f] === "string" ? String((currentBasic as any)[f]).trim() : "";
      (out.basicInfo as any)[f] = fromMerged || previous || "";
    }
    setGithubOnBasicInfo(
      out.basicInfo,
      getGithubFromBasicInfo(out.basicInfo) || getGithubFromBasicInfo(currentBasic),
    );
  }

  const diskPic =
    typeof (currentBasic as any)?.profilePicture === "string"
      ? String((currentBasic as any).profilePicture).trim()
      : "";
  if (
    diskPic &&
    (!(out.basicInfo as any).profilePicture ||
      typeof (out.basicInfo as any).profilePicture !== "string" ||
      !(out.basicInfo as any).profilePicture.trim())
  ) {
    (out.basicInfo as any).profilePicture = diskPic;
  }
  return out;
}

export function ResumeViewer({
  data = {},
  syncWithGlobalResume = true,
}: {
  data?: Record<string, any>;
  /** When false, show only this message’s resume JSON; do not read/write shared storage or follow global events. */
  syncWithGlobalResume?: boolean;
}) {
  const toasterRef = useRef<ToasterRef>(null);

  const showToast = (variant: 'success' | 'error', msg: string) => {
    toasterRef.current?.show({
      title: variant === 'success' ? 'Success' : 'Error',
      message: msg,
      variant,
      position: 'bottom-right'
    });
  };

  const [resumeData, setResumeDataState] = useState<ResumeData>(() => {
    let current: ResumeData = defaultResumeData as ResumeData;
    if (syncWithGlobalResume && typeof window !== "undefined") {
      const saved = tryLocalStorageGet("resumeData");
      if (saved) {
        try {
          current = JSON.parse(saved);
        } catch {
          /* ignore */
        }
      }
    }

    // Deep merge AI generated payload into current state
    if (data) {
      const payload = data.resumeData ? data.resumeData : (Object.keys(data).length > 0 && !data.template ? data : null);
      if (payload) {
        const beforeMerge = sanitizeResumeData(current);
        const flatPayload = normalizeResumePayloadToFlat(payload) ?? payload;
        const cleanedPayload = stripBoldMarkersDeep(stripProfilePictureDeep(flatPayload));
        current = deepMerge(current, cleanedPayload) as ResumeData;
        current = applyIdentitySourceRule(current, beforeMerge);
        current = sanitizeResumeData(current);
        if (syncWithGlobalResume && typeof window !== "undefined") {
          tryLocalStorageSet("resumeData", JSON.stringify(current));
        }
      }
    }
    return sanitizeResumeData(current);
  });

  const [template, setTemplate] = useState<Template>(() => {
    if (data?.template && typeof data.template === "string" && Object.keys(resumeTemplates).includes(data.template)) {
      return data.template as Template;
    }
    if (syncWithGlobalResume && typeof window !== "undefined") {
      const saved = tryLocalStorageGet("resumeTemplate");
      if (saved) return saved as Template;
    }
    return "modern";
  });

  const [activeTab, setActiveTab] = useState("preview");
  /** macOS-style chrome: expanded = full editor; compact = slim strip; hidden = title bar only */
  const [panelMode, setPanelMode] = useState<ArtifactPanelMode>("expanded");

  /** Local undo/redo for editor + merged assistant updates (not for cross-tab reload). */
  const resumeHistRef = useRef<{ list: ResumeData[]; i: number }>({ list: [], i: 0 });
  const [undoRedoTick, setUndoRedoTick] = useState(0);

  const pushResumeHistory = useCallback((prev: ResumeData, safe: ResumeData) => {
    let h = resumeHistRef.current;
    if (h.list.length === 0) {
      resumeHistRef.current = { list: [sanitizeResumeData(prev)], i: 0 };
      h = resumeHistRef.current;
    }
    const newList = [...h.list.slice(0, h.i + 1), safe].slice(-50);
    resumeHistRef.current = { list: newList, i: newList.length - 1 };
  }, []);

  const setResumeData = useCallback((action: SetStateAction<ResumeData>) => {
    setResumeDataState((prev) => {
      const next = typeof action === "function" ? (action as (p: ResumeData) => ResumeData)(prev) : action;
      const safe = sanitizeResumeData(next);
      pushResumeHistory(prev, safe);
      return safe;
    });
  }, [pushResumeHistory]);

  void undoRedoTick;
  const canUndo = resumeHistRef.current.i > 0;
  const canRedo = resumeHistRef.current.i < resumeHistRef.current.list.length - 1;

  const undoResume = () => {
    const h = resumeHistRef.current;
    if (h.i <= 0) return;
    const newI = h.i - 1;
    resumeHistRef.current = { ...h, i: newI };
    setResumeDataState(h.list[newI]);
    setUndoRedoTick((t) => t + 1);
  };

  const redoResume = () => {
    const h = resumeHistRef.current;
    if (h.i >= h.list.length - 1) return;
    const newI = h.i + 1;
    resumeHistRef.current = { ...h, i: newI };
    setResumeDataState(h.list[newI]);
    setUndoRedoTick((t) => t + 1);
  };

  /** Only re-apply assistant JSON when it actually changes — new object refs from extractComponents used to retrigger every render and overwrite edits (incl. profile identity merge). */
  const lastAppliedPayloadJson = useRef<string | null>(null);

  /** String identity of assistant resume payload — effect deps on this, not `data` ref, so parent re-renders do not re-merge. */
  let assistantPayloadSignature = "";
  if (data && typeof data === "object") {
    const raw = (data as any).resumeData
      ? (data as any).resumeData
      : Object.keys(data).length > 0 && !(data as any).template
        ? data
        : null;
    if (raw && typeof raw === "object") {
      const norm = normalizeResumePayloadToFlat(raw) ?? raw;
      assistantPayloadSignature = JSON.stringify(norm);
    }
  }

  // Apply new assistant payloads even after initial mount. Always merge onto the latest
  // disk snapshot so manual editor edits are preserved when the model returns a CV block.
  // Important: do not dispatchCustomEvent from inside a setState updater — listeners call
  // setState on other ResumeViewer instances and React forbids that during reconciliation.
  useEffect(() => {
    if (!assistantPayloadSignature) return;

    const payloadJson = assistantPayloadSignature;
    if (lastAppliedPayloadJson.current === payloadJson) return;
    lastAppliedPayloadJson.current = payloadJson;

    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    let base: ResumeData = defaultResumeData as ResumeData;
    if (syncWithGlobalResume) {
      try {
        const stored = tryLocalStorageGet("resumeData");
        if (stored) base = sanitizeResumeData(JSON.parse(stored));
      } catch {
        /* keep default */
      }
    } else {
      base = mergeResumeDataWithDefault(payload);
    }

    const beforeMerge = sanitizeResumeData(base);
    const flatPayload = normalizeResumePayloadToFlat(payload) ?? payload;
    const cleanedPayload = stripBoldMarkersDeep(stripProfilePictureDeep(flatPayload));
    let next = syncWithGlobalResume ? (deepMerge(beforeMerge, cleanedPayload) as ResumeData) : mergeResumeDataWithDefault(cleanedPayload);
    if (syncWithGlobalResume) {
      next = applyIdentitySourceRule(next, beforeMerge);
    }
    const safe = sanitizeResumeData(next);

    setResumeData(safe);
    if (syncWithGlobalResume) {
      try {
        tryLocalStorageSet("resumeData", JSON.stringify(safe));
      } catch {
        // ignore
      }
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent("resume-storage-updated"));
      });
    }
  }, [assistantPayloadSignature, syncWithGlobalResume]);

  // Sync logic if another window updates it (canonical chat resume only)
  useEffect(() => {
    if (!syncWithGlobalResume) return;

    const reloadFromDisk = () => {
      try {
        const stored = tryLocalStorageGet("resumeData");
        if (stored) {
          const parsed = sanitizeResumeData(JSON.parse(stored));
          resumeHistRef.current = { list: [parsed], i: 0 };
          setResumeDataState(parsed);
          setUndoRedoTick((t) => t + 1);
        }
      } catch {
        /* ignore */
      }
      try {
        const savedTpl = tryLocalStorageGet("resumeTemplate");
        if (savedTpl && Object.keys(resumeTemplates).includes(savedTpl)) {
          setTemplate(savedTpl as Template);
        }
      } catch {
        /* ignore */
      }
    };

    // `storage` fires only across tabs; our app also dispatches a same-tab event when it mutates storage.
    const onStorage = () => reloadFromDisk();
    const onResumeUpdated = () => reloadFromDisk();

    window.addEventListener("storage", onStorage);
    window.addEventListener("resume-storage-updated", onResumeUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resume-storage-updated", onResumeUpdated as EventListener);
    };
  }, [syncWithGlobalResume]);

  useEffect(() => {
    if (!syncWithGlobalResume) return;
    tryLocalStorageSet("resumeData", JSON.stringify(resumeData));
  }, [resumeData, syncWithGlobalResume]);

  useEffect(() => {
    if (!syncWithGlobalResume) return;
    tryLocalStorageSet("resumeTemplate", template);
  }, [template, syncWithGlobalResume]);

  return (
    <div className="w-full rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
      <Toaster ref={toasterRef} />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-b border-border/50 bg-white/80 dark:bg-neutral-950/80 gap-3 sm:gap-0">
        <div className="flex items-center gap-4 min-w-0">
          <ArtifactTrafficLights variant="light" panelMode={panelMode} setPanelMode={setPanelMode} />
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5 opacity-80 truncate">
            <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
            CV Document Editor
          </span>
        </div>
        
        {panelMode !== "hidden" ? (
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto justify-end">
            <TabsList className="h-8 rounded-full bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/5 shadow-inner">
              <TabsTrigger value="preview" className="text-[11px] h-7 px-3 sm:px-4 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5">
                <Eye className="w-3 h-3" /> Preview
              </TabsTrigger>
              <TabsTrigger value="editor" className="text-[11px] h-7 px-3 sm:px-4 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5">
                <Edit className="w-3 h-3" /> Editor
              </TabsTrigger>
            </TabsList>
            {panelMode === "expanded" ? (
              <>
                <Select value={template} onValueChange={(v) => setTemplate(v as Template)}>
                  <SelectTrigger className="h-7 w-[110px] text-[11px] bg-background/50 border-border/60 focus:ring-0 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-[11px]">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                  onClick={undoResume}
                  disabled={!canUndo}
                  title="Undo"
                  aria-label="Undo resume edit"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                  onClick={redoResume}
                  disabled={!canRedo}
                  title="Redo"
                  aria-label="Redo resume edit"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground">Green expands · Yellow shrinks</span>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground sm:ml-auto">Green dot restores the editor</p>
        )}
      </div>

      {panelMode !== "hidden" ? (
        <div className="p-3 bg-white/40 dark:bg-black/20">
          <TabsContent
            value="preview"
            className="m-0 mt-0 data-[state=inactive]:hidden"
            forceMount
          >
            <div className="rounded-xl overflow-hidden border border-border/40 bg-white/80 dark:bg-neutral-950/80 shadow-inner">
              <div
                className={
                  panelMode === "expanded"
                    ? "max-h-[500px] sm:max-h-[600px] overflow-y-auto"
                    : "max-h-[160px] sm:max-h-[200px] overflow-y-auto"
                }
                style={{ scrollbarWidth: "thin" }}
              >
                <PdfPreviewClient resumeData={resumeData} template={template} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="m-0 mt-0">
            <div className="rounded-xl overflow-hidden border border-border/40 bg-white dark:bg-neutral-950 shadow-inner">
              <div
                className={
                  panelMode === "expanded"
                    ? "max-h-[500px] sm:max-h-[600px] overflow-y-auto p-2 sm:p-4"
                    : "max-h-[160px] sm:max-h-[200px] overflow-y-auto p-2 sm:p-4"
                }
                style={{ scrollbarWidth: "thin" }}
              >
                <ResumeEditor resumeData={resumeData} setResumeData={setResumeData} />
              </div>
            </div>
          </TabsContent>
        </div>
      ) : null}
      </Tabs>
    </div>
  );
}

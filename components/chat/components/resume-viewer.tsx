"use client";

/**
 * ResumeViewer — Chat inline component that embeds the REAL resume builder
 * (ResumeEditor + PDF Preview) from the homepage, sharing the same
 * localStorage "resumeData" key so changes are immediately reflected.
 */

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FileText, Download, Eye, Edit, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import { useRef } from "react";

import ResumeEditor from "@/components/resume-coverletter/resume-editor";
import { defaultResumeData } from "@/lib/default-resume-data";
import type { ResumeData, Template } from "@/lib/types";
import { generatePDF } from "@/lib/pdf-generator";
import { resumeTemplates } from "@/components/pdf-templates";
import { sanitizeResumeData } from "@/lib/sanitize-resume-data";

// PDF viewer loaded dynamically (client-only, heavy)
const PdfPreviewClient = dynamic(
  () => import("@/components/resume-coverletter/pdf-viewer"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Loading preview…</div> }
);

const TEMPLATE_OPTIONS = (Object.keys(resumeTemplates) as Template[]).map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

// Deep merge function to handle partial AI updates without destroying existing arrays
function deepMerge<T>(target: T, source: any): T {
  if (!source || typeof source !== "object") return source !== undefined ? source : target;
  if (!target || typeof target !== "object") return source;

  if (Array.isArray(source)) {
    return source as unknown as T;
  }

  const result: any = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (Array.isArray(source[key])) {
        result[key] = source[key];
      } else if (typeof source[key] === "object" && source[key] !== null) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

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

  const toggleRaw = typeof window !== "undefined" ? localStorage.getItem(PROFILE_CONTEXT_TOGGLE_ID) : null;
  const useProfile = toggleRaw !== "false";

  const fields = ["name", "email", "phone", "location", "linkedin", "website"] as const;
  if (useProfile) {
    let profile: any = {};
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(PROFILE_STORE_ID) : null;
      profile = raw ? JSON.parse(raw) : {};
    } catch {
      profile = {};
    }
    for (const f of fields) {
      const pv = typeof profile?.[f] === "string" ? profile[f].trim() : "";
      (out.basicInfo as any)[f] = pv || (currentBasic as any)?.[f] || "";
    }
    const gh = typeof profile?.github === "string" ? profile.github.trim() : "";
    setGithubOnBasicInfo(out.basicInfo, gh || getGithubFromBasicInfo(currentBasic));
  } else {
    for (const f of fields) {
      (out.basicInfo as any)[f] = (currentBasic as any)?.[f] || "";
    }
    setGithubOnBasicInfo(out.basicInfo, getGithubFromBasicInfo(currentBasic));
  }
  return out;
}

export function ResumeViewer({ data = {} }: { data?: Record<string, any> }) {
  const toasterRef = useRef<ToasterRef>(null);
  const lastAppliedPayloadRef = useRef<string>("");

  const showToast = (variant: 'success' | 'error', msg: string) => {
    toasterRef.current?.show({
      title: variant === 'success' ? 'Success' : 'Error',
      message: msg,
      variant,
      position: 'bottom-right'
    });
  };

  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    let current = defaultResumeData;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resumeData");
      if (saved) {
        try { current = JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    
    // Deep merge AI generated payload into current state
    if (data) {
      const payload = data.resumeData ? data.resumeData : (Object.keys(data).length > 0 && !data.template ? data : null);
      if (payload) {
        const beforeMerge = sanitizeResumeData(current);
        // Keep existing profile picture locally; do not let large base64 re-enter storage.
        const existingPicture =
          (current as any)?.basicInfo && typeof (current as any).basicInfo === "object"
            ? (current as any).basicInfo.profilePicture
            : undefined;
        const cleanedPayload = stripBoldMarkersDeep(stripProfilePictureDeep(payload));
        current = deepMerge(current, cleanedPayload);
        current = applyIdentitySourceRule(current, beforeMerge);
        if (existingPicture && (current as any)?.basicInfo && typeof (current as any).basicInfo === "object") {
          (current as any).basicInfo.profilePicture = existingPicture;
        }
        current = sanitizeResumeData(current);
        if (typeof window !== "undefined") {
          localStorage.setItem("resumeData", JSON.stringify(current));
        }
      }
    }
    return sanitizeResumeData(current);
  });

  const [template, setTemplate] = useState<Template>(() => {
    if (data?.template && typeof data.template === 'string' && Object.keys(resumeTemplates).includes(data.template)) {
      return data.template as Template;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resumeTemplate");
      if (saved) return saved as Template;
    }
    return "modern";
  });

  const [activeTab, setActiveTab] = useState("preview");
  const [downloading, setDownloading] = useState(false);

  // Apply new assistant payloads even after initial mount.
  useEffect(() => {
    if (!data || typeof data !== "object") return;
    const payload = (data as any).resumeData
      ? (data as any).resumeData
      : Object.keys(data).length > 0 && !(data as any).template
        ? data
        : null;
    if (!payload || typeof payload !== "object") return;

    let signature = "";
    try {
      signature = JSON.stringify(payload);
    } catch {
      signature = String(Date.now());
    }
    if (signature && lastAppliedPayloadRef.current === signature) return;
    lastAppliedPayloadRef.current = signature;

    setResumeData((prev) => {
      const beforeMerge = sanitizeResumeData(prev);
      const existingPicture =
        (beforeMerge as any)?.basicInfo && typeof (beforeMerge as any).basicInfo === "object"
          ? (beforeMerge as any).basicInfo.profilePicture
          : undefined;

      const cleanedPayload = stripBoldMarkersDeep(stripProfilePictureDeep(payload));
      let next = deepMerge(beforeMerge, cleanedPayload);
      next = applyIdentitySourceRule(next, beforeMerge);
      if (existingPicture && (next as any)?.basicInfo && typeof (next as any).basicInfo === "object") {
        (next as any).basicInfo.profilePicture = existingPicture;
      }
      const safe = sanitizeResumeData(next);
      try {
        localStorage.setItem("resumeData", JSON.stringify(safe));
      } catch {
        // ignore
      }
      return safe;
    });
  }, [data]);

  // Sync logic if another window updates it
  useEffect(() => {
    const reloadFromDisk = () => {
      try {
        const stored = localStorage.getItem("resumeData");
        if (stored) setResumeData(sanitizeResumeData(JSON.parse(stored)));
      } catch {
        /* ignore */
      }
      try {
        const savedTpl = localStorage.getItem("resumeTemplate");
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
  }, []);

  useEffect(() => {
    localStorage.setItem("resumeData", JSON.stringify(resumeData));
  }, [resumeData]);

  useEffect(() => {
    localStorage.setItem("resumeTemplate", template);
  }, [template]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generatePDF(resumeData, template);
      showToast("success", "PDF downloaded successfully");
    } catch {
      showToast("error", "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleReload = () => {
    const stored = localStorage.getItem("resumeData");
    if (stored) {
      try {
        setResumeData(JSON.parse(stored));
        showToast("success", "Reloaded latest resume data");
      } catch {
        showToast("error", "Could not reload resume data");
      }
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
      <Toaster ref={toasterRef} />
      {/* Header bar resembling macOS window */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-b border-border/50 bg-white/80 dark:bg-neutral-950/80 gap-3 sm:gap-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
          </div>
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5 opacity-80">
            <FileText className="w-4 h-4 text-indigo-500" />
            CV Document Editor
          </span>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8 rounded-full bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/5 shadow-inner">
                <TabsTrigger value="preview" className="text-[11px] h-7 px-4 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5">
                  <Eye className="w-3 h-3" /> Preview
                </TabsTrigger>
                <TabsTrigger value="editor" className="text-[11px] h-7 px-4 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5">
                  <Edit className="w-3 h-3" /> Editor
                </TabsTrigger>
              </TabsList>
          </Tabs>
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
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleReload}
            title="Reload disk data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          {/* <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            <Download className="w-3 h-3" />
            {downloading ? "Building…" : "Export"}
          </Button> */}
        </div>
      </div>

      <div className="p-3 bg-white/40 dark:bg-black/20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* <div className="flex justify-center mb-3">
            <TabsList className="h-8 rounded-full bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/5 shadow-inner">
              <TabsTrigger value="preview" className="text-[11px] h-7 px-4 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5">
                <Eye className="w-3 h-3" /> Preview
              </TabsTrigger>
              <TabsTrigger value="editor" className="text-[11px] h-7 px-4 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5">
                <Edit className="w-3 h-3" /> Editor
              </TabsTrigger>
            </TabsList>
          </div> */}

          <TabsContent value="preview" className="m-0">
            <div className="rounded-xl overflow-hidden border border-border/40 bg-white/80 dark:bg-neutral-950/80 shadow-inner">
              <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                <PdfPreviewClient resumeData={resumeData} template={template} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="m-0">
            <div className="rounded-xl overflow-hidden border border-border/40 bg-white dark:bg-neutral-950 shadow-inner">
              <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto p-2 sm:p-4" style={{ scrollbarWidth: "thin" }}>
                <ResumeEditor resumeData={resumeData} setResumeData={setResumeData} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

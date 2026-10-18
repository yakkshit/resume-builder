"use client";

import { useEffect, useState } from "react";
import { FileText, Eye, Edit } from "lucide-react";
import { ArtifactTrafficLights, type ArtifactPanelMode } from "@/components/chat/chat-artifact-chrome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { CoverLetterData, CoverLetterTemplate } from "@/lib/types";
import { defaultCoverLetterData } from "@/lib/default-cover-letter";
import CoverLetterPDFViewer from "@/components/resume-coverletter/cover-letter-pdf-viewer";
import { coverLetterTemplates } from "@/components/pdf-templates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CoverLetterSingleBlockEditor } from "./cover-letter-single-block-editor";

import { sanitizeCoverLetterData } from "@/lib/sanitize-cover-letter-data";

export function CoverLetterViewer({
  data = {},
  persistToLocalStorage = true,
}: {
  data?: Record<string, any>;
  /** When false (e.g. translated view), do not overwrite saved originals. */
  persistToLocalStorage?: boolean;
}) {
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(() => {
    const payload = data?.coverLetterData ?? data?.coverLetter ?? data?.data ?? data;
    if (
      payload &&
      typeof payload === "object" &&
      (payload.head || payload.body || payload.header || payload.content || payload.paragraphs || payload.text)
    ) {
      return sanitizeCoverLetterData(payload);
    }
    let current = defaultCoverLetterData;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("coverLetterData");
      if (raw) {
        try {
          current = sanitizeCoverLetterData(JSON.parse(raw));
        } catch {}
      }
    }
    return current;
  });

  const [template, setTemplate] = useState<CoverLetterTemplate>(() => {
    const t = typeof data?.template === "string" ? data.template : "";
    if (t) return t as CoverLetterTemplate;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("coverLetterTemplate");
      if (raw) return raw as CoverLetterTemplate;
    }
    return "modern";
  });

  const [activeTab, setActiveTab] = useState<"preview" | "editor">("preview");
  const [panelMode, setPanelMode] = useState<ArtifactPanelMode>("expanded");

  useEffect(() => {
    if (!persistToLocalStorage) return;
    localStorage.setItem("coverLetterData", JSON.stringify(coverLetterData));
  }, [coverLetterData, persistToLocalStorage]);

  useEffect(() => {
    if (!persistToLocalStorage) return;
    localStorage.setItem("coverLetterTemplate", template);
  }, [template, persistToLocalStorage]);

  // Sync state when parent supplies new data (e.g. generated or translated view).
  useEffect(() => {
    const payload = data?.coverLetterData ?? data?.coverLetter ?? data?.data ?? data;
    if (payload && typeof payload === "object") {
      const sanitized = sanitizeCoverLetterData(payload);
      setCoverLetterData(sanitized);
    }
    if (typeof data?.template === "string" && data.template.trim()) {
      setTemplate(data.template as CoverLetterTemplate);
    }
  }, [data]);

  const previewMax =
    panelMode === "expanded" ? "max-h-[560px] overflow-hidden" : "max-h-[160px] sm:max-h-[200px] overflow-y-auto";
  const editorMax =
    panelMode === "expanded"
      ? "max-h-[520px] overflow-y-auto"
      : "max-h-[160px] sm:max-h-[200px] overflow-y-auto";

  return (
    <div className="w-full rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "editor")} className="flex flex-col">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/50 bg-white/80 dark:bg-neutral-950/80 gap-2 sm:gap-3 min-h-[48px] overflow-hidden">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <ArtifactTrafficLights variant="light" panelMode={panelMode} setPanelMode={setPanelMode} />
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 opacity-90 truncate select-none">
              <FileText className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
              <span className="truncate">Cover Letter Editor</span>
            </span>
          </div>

          {panelMode !== "hidden" ? (
            <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0 overflow-x-auto no-scrollbar py-0.5">
              <TabsList className="h-8 rounded-lg bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/5 shadow-inner shrink-0">
                <TabsTrigger
                  value="preview"
                  className="text-xs h-7 px-2.5 sm:px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5 font-medium"
                >
                  <Eye className="w-3 h-3 shrink-0" />
                  <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="editor"
                  className="text-xs h-7 px-2.5 sm:px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm transition-all gap-1.5 font-medium"
                >
                  <Edit className="w-3 h-3 shrink-0" />
                  <span>Editor</span>
                </TabsTrigger>
              </TabsList>
              {panelMode === "expanded" ? (
                <Select value={template} onValueChange={(v) => setTemplate(v as CoverLetterTemplate)}>
                  <SelectTrigger
                    className="h-8 w-[130px] sm:w-[150px] text-xs bg-background/70 hover:bg-background border-border/70 focus:ring-0 rounded-lg px-2.5 font-medium shrink-0 transition-colors"
                    aria-label="Select cover letter template"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px] sm:max-h-[320px] overflow-y-auto w-[180px] p-1 shadow-2xl rounded-xl border-border/60 bg-popover/95 backdrop-blur-md">
                    {Object.keys(coverLetterTemplates).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs py-1.5 px-2 rounded-lg cursor-pointer">
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-[10px] text-muted-foreground shrink-0">Green expands · Yellow shrinks</span>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground shrink-0">Green dot restores the editor</p>
          )}
        </div>

        {panelMode !== "hidden" ? (
          <div className="p-3 bg-white/40 dark:bg-black/20">
            <TabsContent value="preview" className="m-0 mt-0">
              <Card className="overflow-hidden border border-border/40 bg-white/80 dark:bg-neutral-950/80 shadow-inner">
                <CardContent className="p-0">
                  <div className={previewMax} style={{ scrollbarWidth: "thin" }}>
                    <CoverLetterPDFViewer coverLetterData={coverLetterData} template={template} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="editor" className="m-0 mt-0">
              <Card className="overflow-hidden border border-border/40 bg-white dark:bg-neutral-950 shadow-inner">
                <CardContent className={`p-3 ${editorMax}`} style={{ scrollbarWidth: "thin" }}>
                  <CoverLetterSingleBlockEditor
                    coverLetterData={coverLetterData}
                    setCoverLetterData={setCoverLetterData}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        ) : null}
      </Tabs>
    </div>
  );
}

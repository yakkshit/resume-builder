"use client";

import { useEffect, useState } from "react";
import { FileText, Eye, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { CoverLetterData, CoverLetterTemplate } from "@/lib/types";
import { defaultCoverLetterData } from "@/lib/default-cover-letter";
import CoverLetterPDFViewer from "@/components/resume-coverletter/cover-letter-pdf-viewer";
import { coverLetterTemplates } from "@/components/pdf-templates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CoverLetterSingleBlockEditor } from "./cover-letter-single-block-editor";

export function CoverLetterViewer({ data = {} }: { data?: Record<string, any> }) {
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(() => {
    let current = defaultCoverLetterData;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("coverLetterData");
      if (raw) {
        try { current = JSON.parse(raw); } catch {}
      }
    }
    const payload = data?.coverLetterData ?? data;
    if (payload && typeof payload === "object") {
      current = {
        ...current,
        ...(typeof payload.head === "string" ? { head: payload.head } : {}),
        ...(typeof payload.body === "string" ? { body: payload.body } : {}),
        ...(typeof payload.footer === "string" ? { footer: payload.footer } : {}),
      };
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

  useEffect(() => {
    localStorage.setItem("coverLetterData", JSON.stringify(coverLetterData));
  }, [coverLetterData]);

  useEffect(() => {
    localStorage.setItem("coverLetterTemplate", template);
  }, [template]);

  return (
    <div className="w-full rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50 bg-white/80 dark:bg-neutral-950/80">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5 opacity-90">
          <FileText className="w-4 h-4 text-indigo-500" />
          Cover Letter Editor
        </span>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Template</Label>
            <Select value={template} onValueChange={(v) => setTemplate(v as CoverLetterTemplate)}>
              <SelectTrigger className="h-9 w-[170px] bg-background/50 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950/90">
                {Object.keys(coverLetterTemplates).map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "editor")}>
            <TabsList className="h-8 rounded-full bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/5">
              <TabsTrigger value="preview" className="text-[11px] h-7 px-4 rounded-full">
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="editor" className="text-[11px] h-7 px-4 rounded-full">
                <Edit className="w-3 h-3 mr-1" />
                Editor
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="p-3 bg-white/40 dark:bg-black/20">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "editor")}>
          <TabsContent value="preview" className="m-0">
            <Card className="overflow-hidden border border-border/40 bg-white/80 dark:bg-neutral-950/80 shadow-inner">
              <CardContent className="p-0">
                <div className="max-h-[560px] overflow-hidden">
                  <CoverLetterPDFViewer coverLetterData={coverLetterData} template={template} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="editor" className="m-0">
            <Card className="overflow-hidden border border-border/40 bg-white dark:bg-neutral-950 shadow-inner">
              <CardContent className="p-3 max-h-[520px] overflow-y-auto">
                <CoverLetterSingleBlockEditor coverLetterData={coverLetterData} setCoverLetterData={setCoverLetterData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

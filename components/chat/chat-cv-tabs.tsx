"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Pencil, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import ResumeEditor from "@/components/resume-coverletter/resume-editor";
import type { ResumeData, Template } from "@/lib/types";
import { sanitizeResumeData } from "@/lib/sanitize-resume-data";
import { resumeTemplates } from "@/components/pdf-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PdfPreviewClient = dynamic(
  () => import("@/components/resume-coverletter/pdf-viewer"),
  { ssr: false }
);

interface ChatCvTabsProps {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
  template: Template;
  setTemplate: (t: Template) => void;
}

export function ChatCvTabs({
  resumeData,
  setResumeData,
  template,
  setTemplate,
}: ChatCvTabsProps) {
  // Assistant/editor responses can sometimes contain malformed resume shapes.
  // Sanitizing here prevents crashes like `skills.map is not a function` in PDF templates/editor.
  const safeResumeData = sanitizeResumeData(resumeData);

  return (
    <div data-no-selection-popover="true">
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-0.5 p-1 sm:gap-0">
          <TabsTrigger value="pdf" className="flex items-center justify-center gap-1 px-1.5 py-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate sm:inline">PDF</span>
            <span className="hidden sm:inline">View</span>
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center justify-center gap-1 px-1.5 py-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <Pencil className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">Editor</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center gap-1 px-1.5 py-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <Settings className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">Template</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pdf" className="mt-3">
          <Card className="overflow-hidden border-2">
            <CardContent className="p-0 min-h-[min(300px,48dvh)] h-[min(520px,62dvh)] max-h-[min(620px,85dvh)]">
              <PdfPreviewClient resumeData={safeResumeData} template={template} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="editor" className="mt-3">
          <Card className="border-2">
            <CardContent className="p-3 sm:p-4 max-h-[min(500px,80dvh)] overflow-y-auto">
              <ResumeEditor resumeData={safeResumeData} setResumeData={setResumeData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-3">
          <Card className="border-2">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">CV Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Template</Label>
                <Select
                  value={template}
                  onValueChange={(v) => setTemplate(v as Template)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(resumeTemplates).map((key) => (
                      <SelectItem key={key} value={key}>
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

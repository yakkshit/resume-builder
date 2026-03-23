"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Pencil, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import ResumeEditor from "@/components/resume-coverletter/resume-editor";
import type { ResumeData, Template } from "@/lib/types";
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
  return (
    <Tabs defaultValue="pdf" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pdf" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          PDF View
        </TabsTrigger>
        <TabsTrigger value="editor" className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Editor
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Template
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pdf" className="mt-3">
        <Card className="overflow-hidden border-2">
          <CardContent className="p-0 h-[450px]">
            <PdfPreviewClient resumeData={resumeData} template={template} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="editor" className="mt-3">
        <Card className="border-2">
          <CardContent className="p-4 max-h-[500px] overflow-y-auto">
            <ResumeEditor resumeData={resumeData} setResumeData={setResumeData} />
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
  );
}

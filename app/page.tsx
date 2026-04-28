"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from "ai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Download,
  Upload,
  FileText,
  Sparkles,
  Key,
  AlertTriangle,
  Youtube,
  MessageSquare,
  Mail,
  HandHeart,
  TableIcon as TableOfContents,
  RotateCw,
} from "lucide-react";
// import PDFViewer from "@/components/resume-coverletter/pdf-viewer";
import ResumeEditor from "@/components/resume-coverletter/resume-editor";
import { defaultResumeData } from "@/lib/default-resume-data";
import type {
  ResumeData,
  Template,
  AIModel,
  Experience,
  Education,
  Project,
  Achievement,
} from "@/lib/types";
import { generatePDF } from "@/lib/pdf-generator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { resumeTemplates } from "@/components/pdf-templates";
import { CHAT_MODELS_BY_PROVIDER, CHAT_MODEL_IDS, DEFAULT_CHAT_MODEL } from "@/lib/chat-models";
import Link from "next/link";
import EnhancedChat from "@/components/resume-coverletter/enhanced-chat";
import { extractResumeJsonFromMessage } from "@/lib/extract-resume-json";
import LoadingScreen from "@/components/resume-coverletter/loading-screen";

// Import the correct components
import InfiniteMarquee from "@/components/ui/infinite-marquee";
import { galleryItems } from "@/lib/gallery-data";
import dynamic from "next/dynamic";

const PdfPreviewClient = dynamic(
  () => import("@/components/resume-coverletter/pdf-viewer"),
  { ssr: false } // important
);

export default function ResumePage() {
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resumeData");
      return saved ? JSON.parse(saved) : defaultResumeData;
    }
    return defaultResumeData;
  });
  const [template, setTemplate] = useState<Template>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resumeTemplate");
      return saved ? (saved as Template) : "modern";
    }
    return "modern";
  });
  const [aiMode, setAiMode] = useState(true);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resumeAiModel");
      if (saved && CHAT_MODEL_IDS.includes(saved as any)) return saved as AIModel;
    }
    return DEFAULT_CHAT_MODEL as AIModel;
  });
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [contextText, setContextText] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("aiContextText") || "";
    }
    return "";
  });
  const [showContextInput, setShowContextInput] = useState(false);

  // Custom model configuration
  const [customEndpoint, setCustomEndpoint] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("customEndpoint") || "";
    }
    return "";
  });
  const [customModel, setCustomModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("customModel") || "";
    }
    return "";
  });
  const [customHeaders, setCustomHeaders] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("customHeaders") || "";
    }
    return "";
  });
  const [customAuth, setCustomAuth] = useState<"bearer" | "api-key" | "custom" | "none">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("customAuth");
      return (saved as "bearer" | "api-key" | "custom" | "none") || "bearer";
    }
    return "bearer";
  });
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const [modelErrorBanner, setModelErrorBanner] = useState<string>("");

  const [input, setInput] = useState('');

  const bodyRef = useRef({ resumeData, aiMode, model: selectedModel, apiKey, contextText, customEndpoint, customModel, customHeaders, customAuth });
  bodyRef.current = { resumeData, aiMode, model: selectedModel, apiKey, contextText, customEndpoint, customModel, customHeaders, customAuth };

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    stop
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
      if (
        error.message &&
        error.message.includes("429") &&
        error.message.includes("quota")
      ) {
        setShowQuotaWarning(true);
        return;
      }

      // Show helpful toast/banner for model/provider errors
      const message = String(error?.message || "");
      const isHuggingFaceProviderIssue = /No Inference Provider available/i.test(message);
      const isKnownModelLoadIssue =
        isHuggingFaceProviderIssue ||
        /Error with Hugging Face model/i.test(message) ||
        /Failed to generate response/i.test(message);

      if (isKnownModelLoadIssue) {
        const suggestion = selectedModel.startsWith("huggingface")
          ? "Try a different provider in Hugging Face or switch to another model."
          : "Please select a different model or provide a valid API key.";
        toast({
          title: "Model unavailable",
          description: `${suggestion}`,
          variant: "destructive",
        });
        setModelErrorBanner(suggestion);
      }
    },

    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, id }) => ({ body: { ...bodyRef.current, messages, id } }),
    }),
  });

  // Save to localStorage whenever resumeData changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
    }
  }, [resumeData]);

  // Save template to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("resumeTemplate", template);
    }
  }, [template]);

  // Save selected AI model to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && CHAT_MODEL_IDS.includes(selectedModel as any)) {
      localStorage.setItem("resumeAiModel", selectedModel);
    }
  }, [selectedModel]);

  // Save context text to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aiContextText", contextText);
    }
  }, [contextText]);

  // Clear model error banner when switching model
  useEffect(() => {
    if (modelErrorBanner) {
      setModelErrorBanner("");
    }
  }, [selectedModel]);

  // Save custom configuration to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customEndpoint", customEndpoint);
    }
  }, [customEndpoint]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customModel", customModel);
    }
  }, [customModel]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customHeaders", customHeaders);
    }
  }, [customHeaders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customAuth", customAuth);
    }
  }, [customAuth]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setResumeData(json);
        toast({
          title: "Resume data loaded",
          description: "Your resume data has been successfully imported.",
        });
      } catch (error) {
        toast({
          title: "Error loading file",
          description: "The file is not a valid JSON resume data file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const downloadResumeData = () => {
    const dataStr = JSON.stringify(resumeData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "resume-data.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Resume data saved",
      description: "Your resume data has been downloaded as JSON.",
    });
  };

  const handleDownloadPDF = async () => {
    try {
      await generatePDF(resumeData, template);
      toast({
        title: "PDF Downloaded",
        description: "Your resume has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error generating PDF",
        description:
          "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const applyAiChanges = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant") as any;
    if (!lastAssistant?.content) return;

    const suggestedChanges = extractResumeJsonFromMessage(lastAssistant.content);

    if (!suggestedChanges) {
      toast({
        title: "No changes found",
        description: "No applicable resume changes were found in the last message. Try asking e.g. “Update my summary” or “Tailor my resume to this job.”",
        variant: "destructive",
      });
      return;
    }

    setResumeData((current) => {
      const next = { ...current };

      if (suggestedChanges.basicInfo && typeof suggestedChanges.basicInfo === "object") {
        const b = suggestedChanges.basicInfo as Record<string, unknown>;
        next.basicInfo = { ...current.basicInfo };
        if (typeof b.summary === "string") next.basicInfo.summary = b.summary;
        if (typeof b.name === "string") next.basicInfo.name = b.name;
        if (typeof b.title === "string") next.basicInfo.title = b.title;
        if (typeof b.email === "string") next.basicInfo.email = b.email;
        if (typeof b.phone === "string") next.basicInfo.phone = b.phone;
        if (typeof b.location === "string") next.basicInfo.location = b.location;
        if (typeof b.linkedin === "string") next.basicInfo.linkedin = b.linkedin;
        if (typeof b.website === "string") next.basicInfo.website = b.website;
        if (Array.isArray(b.languages)) next.basicInfo.languages = b.languages.map(String);
      }

      if (Array.isArray(suggestedChanges.skills)) {
        next.skills = suggestedChanges.skills.map((s) => (typeof s === "string" ? s : String(s)));
      }

      if (Array.isArray(suggestedChanges.experience)) {
        next.experience = suggestedChanges.experience.map((newExp: unknown, i: number) => {
          const e = newExp as Record<string, unknown>;
          const prev = current.experience[i];
          return {
            company: typeof e.company === "string" ? e.company : prev?.company ?? "",
            position: typeof e.position === "string" ? e.position : prev?.position ?? "",
            startDate: typeof e.startDate === "string" ? e.startDate : prev?.startDate ?? "",
            endDate: typeof e.endDate === "string" ? e.endDate : prev?.endDate ?? "",
            description: typeof e.description === "string" ? e.description : prev?.description ?? "",
            highlights: Array.isArray(e.highlights) ? e.highlights.map(String) : prev?.highlights ?? [],
          };
        });
      }

      if (Array.isArray(suggestedChanges.education)) {
        next.education = suggestedChanges.education.map((newEdu: unknown, i: number) => {
          const e = newEdu as Record<string, unknown>;
          const prev = current.education[i];
          return {
            institution: typeof e.institution === "string" ? e.institution : prev?.institution ?? "",
            degree: typeof e.degree === "string" ? e.degree : prev?.degree ?? "",
            field: typeof e.field === "string" ? e.field : prev?.field ?? "",
            startDate: typeof e.startDate === "string" ? e.startDate : prev?.startDate ?? "",
            endDate: typeof e.endDate === "string" ? e.endDate : prev?.endDate ?? "",
            gpa: typeof e.gpa === "string" ? e.gpa : prev?.gpa ?? "",
          };
        });
      }

      if (Array.isArray(suggestedChanges.projects)) {
        next.projects = suggestedChanges.projects.map((newP: unknown, i: number) => {
          const p = newP as Record<string, unknown>;
          const prev = current.projects?.[i];
          return {
            name: typeof p.name === "string" ? p.name : prev?.name ?? "",
            description: typeof p.description === "string" ? p.description : prev?.description ?? "",
            technologies: Array.isArray(p.technologies) ? p.technologies.map(String) : prev?.technologies ?? [],
            link: typeof p.link === "string" ? p.link : prev?.link,
            startDate: typeof p.startDate === "string" ? p.startDate : prev?.startDate,
            endDate: typeof p.endDate === "string" ? p.endDate : prev?.endDate,
          };
        });
      }

      if (Array.isArray(suggestedChanges.achievements)) {
        next.achievements = suggestedChanges.achievements.map((newA: unknown, i: number) => {
          const a = newA as Record<string, unknown>;
          const prev = current.achievements?.[i];
          return {
            title: typeof a.title === "string" ? a.title : prev?.title ?? "",
            description: typeof a.description === "string" ? a.description : prev?.description ?? "",
            date: typeof a.date === "string" ? a.date : prev?.date,
          };
        });
      }

      return next;
    });

    toast({
      title: "AI changes applied",
      description: "The suggested changes have been applied to your resume.",
    });
  };

  // Add a function to ensure data consistency between editor and PDF viewer
  useEffect(() => {
    // This effect ensures that any changes to resumeData (whether from editor or AI)
    // are properly synchronized and saved

    // Save to localStorage whenever resumeData changes
    if (typeof window !== "undefined") {
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
      console.log("Resume data saved to localStorage:", resumeData);
    }
  }, [resumeData]);

  // Custom chat submission handler that supports file uploads
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.();
    setShowQuotaWarning(false);

    // Check if there are attached files
    if (attachedFiles.length > 0) {
      // Process attached files and send to AI model
      const fileData = await processAttachedFiles(attachedFiles);

      // Create a comprehensive message that includes file content
      let enhancedInput = input;
      if (input.trim()) {
        enhancedInput += '\n\n';
      }

      enhancedInput += 'Attached Files:\n';
      for (const file of fileData) {
        if (file.contentType === 'pdf') {
          enhancedInput += `\nPDF: ${file.name} (${file.pages} pages)\nContent:\n${file.content}\n`;
        } else if (file.contentType === 'document') {
          enhancedInput += `\nDocument: ${file.name}\nContent:\n${file.content}\n`;
        } else if (file.contentType === 'image') {
          enhancedInput += `\nImage: ${file.name}\nDescription: ${file.content}\n`;
        } else if (file.contentType === 'json') {
          enhancedInput += `\nJSON: ${file.name}\nData: ${JSON.stringify(file.content, null, 2)}\n`;
        } else if (file.contentType === 'text' || file.contentType === 'csv') {
          enhancedInput += `\nText/CSV: ${file.name}\nContent:\n${file.content}\n`;
        } else if (file.contentType === 'excel') {
          enhancedInput += `\nExcel: ${file.name}\nInfo: ${file.content}\n`;
        } else {
          enhancedInput += `\nFile: ${file.name}\nContent: ${file.content}\n`;
        }
      }

      sendMessage({ text: enhancedInput });
      setInput('');
      setAttachedFiles([]);

      toast({
        title: "Files processed",
        description: `${attachedFiles.length} file(s) have been processed and sent to the AI model.`,
      });

      return;
    }

    sendMessage({ text: input });
    setInput('');
  };

  // Process attached files and convert them to text/data that can be sent to AI
  const processAttachedFiles = async (files: File[]): Promise<any[]> => {
    const processedFiles = [];

    for (const file of files) {
      try {
        if (file.type === "application/json") {
          // For JSON files, parse and send as structured data
          const text = await file.text();
          const data = JSON.parse(text);
          processedFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            content: data,
            contentType: 'json'
          });
        } else if (file.type === "text/plain" || file.type === "text/csv") {
          // For text and CSV files, read and send as text
          const text = await file.text();
          processedFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            content: text,
            contentType: file.type === "text/csv" ? 'csv' : 'text'
          });
        } else if (file.type === "application/pdf") {
          // For PDF files, extract text content using pdfjs-dist
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfjsLib = await import('pdfjs-dist');

            // Set worker source for PDF.js
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            let pageCount = pdf.numPages;

            // Extract text from each page
            for (let i = 1; i <= pageCount; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += `Page ${i}: ${pageText}\n\n`;
            }

            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: fullText.trim(),
              contentType: 'pdf',
              pages: pageCount,
              info: { title: file.name }
            });
          } catch (pdfError) {
            console.error(`PDF parsing error for ${file.name}:`, pdfError);
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: `Error extracting text from PDF "${file.name}". Please ensure it's a valid PDF file.`,
              contentType: 'pdf-error'
            });
          }
        } else if (file.type.includes("word") || file.type.includes("document") ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          // For Word documents, extract text content using mammoth
          try {
            const arrayBuffer = await file.arrayBuffer();
            const mammoth = (await import('mammoth')).default;
            const result = await mammoth.extractRawText({ arrayBuffer });
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: result.value,
              contentType: 'document',
              messages: result.messages
            });
          } catch (docError) {
            console.error(`Document parsing error for ${file.name}:`, docError);
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: `Error extracting text from document "${file.name}". Please ensure it's a valid Word document.`,
              contentType: 'document-error'
            });
          }
        } else if (file.type.startsWith("image/")) {
          // For images, convert to base64 and send for analysis
          try {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            const dataUrl = `data:${file.type};base64,${base64}`;
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: `Image file "${file.name}" attached. Image data available for AI analysis.`,
              contentType: 'image',
              base64: dataUrl,
              dimensions: await getImageDimensions(file)
            });
          } catch (imgError) {
            console.error(`Image processing error for ${file.name}:`, imgError);
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: `Error processing image "${file.name}".`,
              contentType: 'image-error'
            });
          }
        } else if (file.type.includes("excel") || file.type.includes("spreadsheet") ||
          file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel") {
          // For Excel files, provide information about processing
          try {
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: `Excel file "${file.name}" attached. Spreadsheet analysis coming soon. For now, please export as CSV or copy-paste the relevant data.`,
              contentType: 'excel',
              info: 'Spreadsheet data extraction coming soon'
            });
          } catch (excelError) {
            console.error(`Excel processing error for ${file.name}:`, excelError);
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: `Error processing Excel file "${file.name}".`,
              contentType: 'excel-error'
            });
          }
        } else {
          // For other file types, try to read as text
          try {
            const text = await file.text();
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: text,
              contentType: 'text-fallback'
            });
          } catch (textError) {
            processedFiles.push({
              name: file.name,
              type: file.type,
              size: file.size,
              content: `File "${file.name}" attached. Content extraction not supported for this file type.`,
              contentType: 'unsupported'
            });
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        processedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: `Error processing file "${file.name}".`,
          contentType: 'error'
        });
      }
    }

    return processedFiles;
  };

  // Helper function to get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number, height: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Add a debug button to help troubleshoot data synchronization issues
  const debugResumeData = () => {
    console.log("Current resume data:", resumeData);
    toast({
      title: "Resume data logged",
      description:
        "Current resume data has been logged to the console for debugging.",
    });
  };

  // Save custom configuration and show toast
  const saveCustomConfig = () => {
    toast({
      title: "Configuration saved",
      description: "Custom model configuration has been saved successfully.",
    });
  };

  // Clear attached files
  const clearAttachedFiles = () => {
    setAttachedFiles([]);
    if (attachmentRef.current) {
      attachmentRef.current.value = "";
    }
  };

  return (
    <LoadingScreen minLoadingTime={5000}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto py-8 px-2 sm:px-4">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-primary">
              AI-Powered Resume Generator
            </h1>
            <p className="text-muted-foreground">
              Create, customize, and optimize your resume with AI assistance
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Editor & Chat */}
            <div className="space-y-6">
              <Card className="border shadow-md">
                <Tabs defaultValue="editor" className="w-full">
                  <TabsList className="w-full rounded-t-lg rounded-b-none bg-muted/50">
                    <TabsTrigger
                      value="editor"
                      className="flex-1 data-[state=active]:bg-background"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="flex-1 data-[state=active]:bg-background"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Assistant
                      {contextText && contextText.trim() && (
                        <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      {attachedFiles.length > 0 && (
                        <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor" className="p-6 space-y-4 m-0">
                    <div>
                      <ResumeEditor
                        resumeData={resumeData}
                        setResumeData={setResumeData}
                      />
                    </div>
                  </TabsContent>

                  {/* Enhanced chat UI */}
                  <TabsContent value="chat" className="p-6 space-y-4 m-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="ai-mode"
                          checked={aiMode}
                          onCheckedChange={setAiMode}
                        />
                        <Label
                          htmlFor="ai-mode"
                          className="flex items-center gap-2"
                        >
                          <Sparkles size={16} className="text-yellow-500" />
                          Tailor Resume Mode
                        </Label>
                      </div>

                      {attachedFiles.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {attachedFiles.length} file(s) attached
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAttachedFiles}
                            className="h-7 px-2"
                          >
                            Clear Files
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Context Text Input - Only for Google Gemini and Lingo AI */}
                    {(selectedModel.startsWith("gemini") || selectedModel === "lingo-ai") && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="context-text" className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-blue-500" />
                            AI Context of your profile (Optional)
                          </Label>
                          <Button

                            variant="ghost"
                            size="sm"
                            onClick={() => setShowContextInput(!showContextInput)}
                            className="h-6 px-2"
                          >
                            {showContextInput ? "Hide" : "Show"}
                          </Button>
                        </div>
                        {showContextInput && (
                          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                            <Textarea
                              id="context-text"
                              placeholder="Add context that will be used for every AI interaction (e.g., industry preferences, career goals, specific requirements)..."
                              value={contextText}
                              onChange={(e) => setContextText(e.target.value)}
                              className="min-h-[100px] resize-none"
                            />
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                This context will be included in every AI chat to provide better, more consistent responses.
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setContextText("")}
                                  className="h-6 px-2"
                                >
                                  Clear
                                </Button>
                                {contextText && contextText.trim() && (
                                  <div className="flex items-center gap-1 text-xs text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Saved
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* {aiMode && (
                      <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                          <Sparkles size={18} className="text-yellow-500" />
                          Tailor with AI
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Paste a job description below to tailor your resume
                          for specific positions. Our AI will suggest
                          improvements to match the requirements.
                        </p>
                        <div className="mb-2">
                          <Label htmlFor="job-description">
                            Job Description
                          </Label>
                          <Textarea
                            id="job-description"
                            placeholder="Paste the job description here to tailor your resume..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="h-32"
                          />
                        </div>
                      </div>
                    )} */}

                    {showQuotaWarning && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>API Quota Exceeded</AlertTitle>
                        <AlertDescription>
                          The Google AI API quota has been exceeded. The
                          assistant will provide generic advice instead of
                          personalized responses. Consider adding your own API
                          key below or try again later.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* AI Model Selection */}
                    <div className="mb-4">
                      {modelErrorBanner && (
                        <Alert variant="destructive" className="mb-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Model issue</AlertTitle>
                          <AlertDescription>
                            {modelErrorBanner}
                          </AlertDescription>
                        </Alert>
                      )}
                      <Label htmlFor="ai-model">AI Model</Label>
                      <Select
                        value={selectedModel}
                        onValueChange={(value: AIModel) =>
                          setSelectedModel(value)
                        }
                      >
                        <SelectTrigger id="ai-model">
                          <SelectValue placeholder="Select AI model" />
                        </SelectTrigger>
                        <SelectContent className="max-h-96">
                          {Object.entries(CHAT_MODELS_BY_PROVIDER).map(([providerName, ids]) => (
                            <div key={providerName}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {providerName}
                              </div>
                              {(ids as readonly string[]).map((id) => (
                                <SelectItem key={id} value={id}>
                                  {id === "lingo-ai" ? "Lingo AI" : id === "cedz-qwen3-8b" ? "Qwen3 8B" : id === "cedz-llama3-8b" ? "Llama3 8B" : id === "cedz-custom" ? "Custom (set model below)" : id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* API Key Input */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="api-key">
                          {selectedModel.startsWith("cedz") ? "Cedz API URL (optional if set in .env)" :
                            selectedModel.startsWith("gemini") ? "Google" :
                            selectedModel.startsWith("gpt") ? "OpenAI" :
                              selectedModel.startsWith("claude") ? "Anthropic" :
                                selectedModel.startsWith("deepseek") ? "DeepSeek" :
                                  selectedModel.startsWith("llama") || selectedModel.startsWith("mixtral") || selectedModel.startsWith("gemma") ? "Groq" :
                                    selectedModel.startsWith("mistral") ? "Mistral" :
                                      selectedModel.startsWith("meta-llama") ? "Together.ai" :
                                        selectedModel.startsWith("command") ? "Cohere" :
                                          selectedModel.startsWith("fireworks") ? "Fireworks" :
                                            selectedModel.startsWith("huggingface") ? "Hugging Face" :
                                              selectedModel === "lingo-ai" ? "Lingo AI" : "Provider"} API Key
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="h-6 px-2"
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          placeholder={selectedModel.startsWith("cedz") ? "Not needed for Cedz; set base URL above" : `Enter your ${selectedModel.startsWith("gemini") ? "Google" :
                            selectedModel.startsWith("gpt") ? "OpenAI" :
                              selectedModel.startsWith("claude") ? "Anthropic" :
                                selectedModel.startsWith("deepseek") ? "DeepSeek" :
                                  selectedModel.startsWith("llama") || selectedModel.startsWith("mixtral") || selectedModel.startsWith("gemma") ? "Groq" :
                                    selectedModel.startsWith("mistral") ? "Mistral" :
                                      selectedModel.startsWith("meta-llama") ? "Together.ai" :
                                        selectedModel.startsWith("command") ? "Cohere" :
                                          selectedModel.startsWith("fireworks") ? "Fireworks" :
                                            selectedModel.startsWith("huggingface") ? "Hugging Face" :
                                              selectedModel === "lingo-ai" ? "Lingo AI" : "Provider"
                            } API key`}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setApiKey("");
                            toast({
                              title: "API key cleared",
                              description: "API key cleared. You'll need to provide a new one for the selected model.",
                            });
                          }}
                        >
                          <RotateCw size={16} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedModel.startsWith("cedz") ? "Set CEDZ_API_URL in .env or enter the Cedz/Ollama base URL above (e.g. https://xxx.ngrok-free.app)." :
                          selectedModel.startsWith("gemini") ? "Get your API key from Google Ai Studio Platform." :
                          selectedModel.startsWith("huggingface") ? "Get your API key from Hugging Face (huggingface.co/settings/tokens)" :
                            selectedModel === "lingo-ai" ? "Get your Lingo AI API key from cedzlabs.com/resume-builder" :
                              "API key required for this model. Get one from the provider's website."}
                      </p>
                    </div>

                    {/* Cedz API URL (for Cedz models) */}
                    {selectedModel.startsWith("cedz") && (
                      <div className="mb-4">
                        <Label htmlFor="cedz-endpoint">Cedz API base URL</Label>
                        <Input
                          id="cedz-endpoint"
                          placeholder="https://your-ngrok-url.ngrok-free.app"
                          value={customEndpoint}
                          onChange={(e) => setCustomEndpoint(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Set CEDZ_API_URL in .env or enter the base URL here (e.g. https://xxx.ngrok-free.app). No trailing slash.
                        </p>
                        {selectedModel === "cedz-custom" && (
                          <>
                            <Label htmlFor="cedz-model" className="mt-2 block">Model name</Label>
                            <Input
                              id="cedz-model"
                              placeholder="qwen3:8b"
                              value={customModel}
                              onChange={(e) => setCustomModel(e.target.value)}
                              className="mt-1"
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* Custom Model Configuration */}
                    {(selectedModel.startsWith("huggingface") || selectedModel === "local-custom" ||
                      selectedModel === "ollama-local" || selectedModel === "lmstudio-local" ||
                      selectedModel === "openai-like-local") && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2">
                              <Key size={16} className="text-purple-500" />
                              {selectedModel === "huggingface-endpoint" && "Hugging Face Endpoint Configuration"}
                              {selectedModel === "huggingface-model" && "Hugging Face Model Configuration"}
                              {selectedModel === "huggingface-streaming" && "Hugging Face Streaming Configuration"}
                              {selectedModel === "huggingface-provider" && "Hugging Face Provider Configuration"}
                              {selectedModel === "local-custom" && "Custom API Configuration"}
                              {selectedModel === "ollama-local" && "Ollama Configuration"}
                              {selectedModel === "lmstudio-local" && "LM Studio Configuration"}
                              {selectedModel === "openai-like-local" && "OpenAI-like Configuration"}
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowCustomConfig(!showCustomConfig)}
                              className="h-6 px-2"
                            >
                              {showCustomConfig ? "Hide" : "Show"}
                            </Button>
                          </div>

                          {showCustomConfig && (
                            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                              {/* Hugging Face Endpoint - Model Name + Endpoint URL */}
                              {selectedModel === "huggingface-endpoint" && (
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="custom-model">Model Name</Label>
                                    <Input
                                      id="custom-model"
                                      placeholder="meta-llama/Llama-3.1-8B-Instruct"
                                      value={customModel}
                                      onChange={(e) => setCustomModel(e.target.value)}
                                      className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Hugging Face model identifier
                                    </p>
                                  </div>

                                  <div>
                                    <Label htmlFor="custom-endpoint">Endpoint URL</Label>
                                    <Input
                                      id="custom-endpoint"
                                      placeholder="https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.1-8B-Instruct"
                                      value={customEndpoint}
                                      onChange={(e) => setCustomEndpoint(e.target.value)}
                                      className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Your Hugging Face inference endpoint URL
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Hugging Face Model - Only Model Name */}
                              {selectedModel === "huggingface-model" && (
                                <div>
                                  <Label htmlFor="custom-model">Model Name</Label>
                                  <Input
                                    id="custom-model"
                                    placeholder="meta-llama/Llama-3.1-8B-Instruct"
                                    value={customModel}
                                    onChange={(e) => setCustomModel(e.target.value)}
                                    className="mt-1"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Hugging Face model identifier (e.g., meta-llama/Llama-3.1-8B-Instruct, google/gemma-3-270m)
                                  </p>
                                </div>
                              )}

                              {/* Hugging Face Streaming - Only Model Name */}
                              {selectedModel === "huggingface-streaming" && (
                                <div>
                                  <Label htmlFor="custom-model">Model Name</Label>
                                  <Input
                                    id="custom-model"
                                    placeholder="meta-llama/Llama-3.1-8B-Instruct"
                                    value={customModel}
                                    onChange={(e) => setCustomModel(e.target.value)}
                                    className="mt-1"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Hugging Face model identifier (e.g., meta-llama/Llama-3.1-8B-Instruct, google/gemma-3-270m)
                                  </p>
                                </div>
                              )}

                              {/* Hugging Face Provider - Model Name + Provider */}
                              {selectedModel === "huggingface-provider" && (
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="custom-model">Model Name</Label>
                                    <Input
                                      id="custom-model"
                                      placeholder="meta-llama/Llama-3.1-8B-Instruct"
                                      value={customModel}
                                      onChange={(e) => setCustomModel(e.target.value)}
                                      className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Hugging Face model identifier
                                    </p>
                                  </div>

                                  <div>
                                    <Label htmlFor="custom-provider">Provider</Label>
                                    <Input
                                      id="custom-provider"
                                      placeholder="sambanova"
                                      value={customHeaders}
                                      onChange={(e) => setCustomHeaders(e.target.value)}
                                      className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Third-party provider (e.g., sambanova, together, fal-ai, replicate, cohere)
                                    </p>
                                  </div>
                                </div>
                              )}



                              {/* Local Models - Only Base URL/Endpoint */}
                              {(selectedModel === "ollama-local" || selectedModel === "lmstudio-local" || selectedModel === "openai-like-local") && (
                                <div>
                                  <Label htmlFor="custom-endpoint">Base URL</Label>
                                  <Input
                                    id="custom-endpoint"
                                    placeholder={
                                      selectedModel === "ollama-local"
                                        ? "http://127.0.0.1:11434"
                                        : selectedModel === "lmstudio-local"
                                          ? "http://localhost:1234"
                                          : "http://localhost:8000"
                                    }
                                    value={customEndpoint}
                                    onChange={(e) => setCustomEndpoint(e.target.value)}
                                    className="mt-1"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {selectedModel === "ollama-local"
                                      ? "Ollama local endpoint (default: 127.0.0.1:11434)"
                                      : selectedModel === "lmstudio-local"
                                        ? "LM Studio local endpoint (default: localhost:1234)"
                                        : "OpenAI-compatible API endpoint"
                                    }
                                  </p>
                                </div>
                              )}

                              {/* Custom API - Full Configuration */}
                              {selectedModel === "local-custom" && (
                                <>
                                  <div>
                                    <Label htmlFor="custom-endpoint">API Endpoint</Label>
                                    <Input
                                      id="custom-endpoint"
                                      placeholder="http://localhost:8000/v1/chat/completions"
                                      value={customEndpoint}
                                      onChange={(e) => setCustomEndpoint(e.target.value)}
                                      className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Your local or custom API endpoint
                                    </p>
                                  </div>

                                  <div>
                                    <Label htmlFor="custom-model">Model Name</Label>
                                    <Input
                                      id="custom-model"
                                      placeholder="local-model"
                                      value={customModel}
                                      onChange={(e) => setCustomModel(e.target.value)}
                                      className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Model name for your local API
                                    </p>
                                  </div>

                                  <div>
                                    <Label htmlFor="custom-auth">Authentication Method</Label>
                                    <Select value={customAuth} onValueChange={(value: "bearer" | "api-key" | "custom" | "none") => setCustomAuth(value)}>
                                      <SelectTrigger id="custom-auth" className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="bearer">Bearer Token</SelectItem>
                                        <SelectItem value="api-key">API Key Header</SelectItem>
                                        <SelectItem value="custom">Custom Headers</SelectItem>
                                        <SelectItem value="none">No Authentication</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Custom Headers */}
                                  {(customAuth === "custom" || customAuth === "api-key") && (
                                    <div>
                                      <Label htmlFor="custom-headers">Custom Headers (JSON)</Label>
                                      <Textarea
                                        id="custom-headers"
                                        placeholder={customAuth === "api-key"
                                          ? '{"X-API-Key": "your-api-key"}'
                                          : '{"Authorization": "Bearer token", "X-Custom": "value"}'
                                        }
                                        value={customHeaders}
                                        onChange={(e) => setCustomHeaders(e.target.value)}
                                        className="mt-1 min-h-[80px] resize-none"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {customAuth === "api-key"
                                          ? "JSON format for custom API key headers"
                                          : "JSON format for custom authentication headers"
                                        }
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}



                              {/* Save Button */}
                              <div className="flex justify-end">
                                <Button onClick={saveCustomConfig} size="sm">
                                  Save Configuration
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Lingo AI Advertisement Box */}
                    {selectedModel === "lingo-ai" && (
                      <div className="mb-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Lingo AI - Specialized Resume & Job AI
                              </h3>
                              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                For our custom AI model for job recommendations, mock interviews, and job tracking, use Lingo AI.
                                Get your API key from <a href="https://cedzlabs.com/resume-builder" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-300">cedzlabs.com/resume-builder</a>
                              </p>

                              {/* Video Player Accordion */}
                              <div className="mt-4">
                                {/* <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Watch Demo Video
                                  </Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCustomConfig(!showCustomConfig)}
                                    className="h-6 px-2 text-blue-600 dark:text-blue-400"
                                  >
                                    {showCustomConfig ? "Hide" : "Show"}
                                  </Button>
                                </div>
                                
                                {showCustomConfig && (
                                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                      <iframe
                                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                        title="Lingo AI Demo Video"
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 text-center">
                                      Learn how to use Lingo AI for resume optimization and job recommendations
                                    </p>
                                  </div>
                                )} */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tutorial Videos Accordion */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Youtube size={16} className="text-red-500" />
                          Tutorial Videos
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTutorials(!showTutorials)}
                          className="h-6 px-2"
                        >
                          {showTutorials ? "Hide" : "Show"}
                        </Button>
                      </div>

                      {showTutorials && (
                        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                          {/* Model-specific tutorials */}
                          <div className="grid gap-3">
                            {/* Google Gemini Tutorials */}
                            {selectedModel.startsWith("gemini") && (
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Google Gemini Tutorials</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Getting Started with Gemini AI
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Advanced Gemini Prompting Techniques
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Lingo AI Tutorials */}
                            {selectedModel === "lingo-ai" && (
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Lingo AI Tutorials</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Resume Optimization with Lingo AI
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Job Recommendations & Mock Interviews
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Career Tracking & Analytics
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* OpenAI Tutorials */}
                            {selectedModel.startsWith("gpt") && (
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">OpenAI GPT Tutorials</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      GPT-4 Best Practices
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Prompt Engineering with GPT
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Claude Tutorials */}
                            {selectedModel.startsWith("claude") && (
                              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Anthropic Claude Tutorials</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Claude 3.5 Sonnet Deep Dive
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Claude for Creative Writing
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Local Models Tutorials */}
                            {(selectedModel === "ollama-local" || selectedModel === "lmstudio-local" || selectedModel === "openai-like-local") && (
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Local Models Tutorials</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Setting up Ollama Locally
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      LM Studio Configuration Guide
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      OpenAI-compatible API Setup
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Hugging Face Tutorials */}
                            {selectedModel.startsWith("huggingface") && (
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Hugging Face Tutorials</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      {selectedModel === "huggingface-endpoint" && "Custom Endpoint Configuration"}
                                      {selectedModel === "huggingface-model" && "Hugging Face Model Setup"}
                                      {selectedModel === "huggingface-streaming" && "Streaming Model Configuration"}
                                      {selectedModel === "huggingface-provider" && "Third-party Provider Setup"}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Youtube size={14} className="text-red-500" />
                                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                      Model Selection & Best Practices
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* General AI Tutorials */}
                            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-700">
                              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">General AI & Resume Tips</h4>
                              <div className="space-y-2">
                                <div className=
                                  "flex items-center gap-2 text-sm">
                                  <Youtube size={14} className="text-red-500" />
                                  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                                    AI Resume Writing Best Practices
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Youtube size={14} className="text-red-500" />
                                  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                                    Prompt Engineering Fundamentals
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Youtube size={14} className="text-red-500" />
                                  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                                    Career Development with AI
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Chat Component */}
                    <EnhancedChat
                      messages={messages as any}
                      setMessages={setMessages}
                      sendMessage={sendMessage}
                      input={input}
                      handleInputChange={e => setInput(e.target.value)}
                      handleSubmit={handleChatSubmit}
                      isLoading={status === "submitted" || status === "streaming"}
                      isStreaming={status === "streaming"}
                      onStop={stop}
                      applyAiChanges={applyAiChanges}
                      aiMode={aiMode}
                      attachmentRef={attachmentRef}
                      contextText={contextText}
                      onFilesAttached={setAttachedFiles}
                    />
                  </TabsContent>
                </Tabs>
              </Card>

            </div>

            {/* Right Column - Preview & Controls */}
            <div className="space-y-6">

              <div className="h-[500px] md:h-[700px] lg:h-[800px]">
                <PdfPreviewClient resumeData={resumeData} template={template} />
              </div>

              <Card className="p-2 border shadow-md">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Load Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadResumeData}
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Save Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={debugResumeData}
                      className="flex items-center gap-2"
                    >
                      <FileText size={16} />
                      Debug Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2"
                    >
                      <FileText size={16} />
                      Download PDF
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                    <Select
                      value={template}
                      onValueChange={(value: Template) => setTemplate(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(resumeTemplates).map((templateKey) => (
                          <SelectItem key={templateKey} value={templateKey}>
                            {templateKey.charAt(0).toUpperCase() +
                              templateKey.slice(1).replace(/-/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Link href={"/cover-letter"}>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Cover Letter
                      </Button>
                    </Link>
                    <Link href={"/donate"}>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <HandHeart size={16} />
                        Donate
                      </Button>
                    </Link>
                    <Link href={"/feedback"}>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <TableOfContents size={16} />
                        Feedback
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* New Quick Links Card */}
              <Card className="border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Links</CardTitle>
                  <CardDescription>
                    Access helpful resources and tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3"
                    asChild
                  >
                    <Link
                      href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      target="_blank"
                    >
                      <Youtube size={18} className="text-red-500" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Tutorial</span>
                        <span className="text-xs text-muted-foreground">
                          Watch how-to videos
                        </span>
                      </div>
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3"
                    asChild
                  >
                    <Link href="/feedback">
                      <MessageSquare size={18} className="text-blue-500" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Feedback</span>
                        <span className="text-xs text-muted-foreground">
                          Share your thoughts
                        </span>
                      </div>
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3"
                    asChild
                  >
                    <Link href="/cover-letter">
                      <Mail size={18} className="text-green-500" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Cover Letter</span>
                        <span className="text-xs text-muted-foreground">
                          Create matching letters
                        </span>
                      </div>
                    </Link>
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </LoadingScreen>
  );
}
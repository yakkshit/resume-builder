"use client"

import { useState, useRef, useEffect } from "react"
import { getTextContent } from "@/lib/message-utils"
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from "ai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Download, Upload, FileText, Key, AlertTriangle, HandHeart, TableIcon as TableOfContents, Sparkles, RotateCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import CoverLetterEditor from "@/components/resume-coverletter/cover-letter-editor"
import { defaultCoverLetterData } from "@/lib/default-cover-letter"
import type { CoverLetterData, CoverLetterTemplate, AIModel } from "@/lib/types"
import { generateCoverLetterPDF } from "@/lib/cover-letter-pdf-generator"
import CoverLetterPDFViewer from "@/components/resume-coverletter/cover-letter-pdf-viewer"
import { coverLetterTemplates } from "@/components/pdf-templates"
import CoverLetterChat from "@/components/resume-coverletter/cover-letter-chat"
import LoadingScreen from "@/components/resume-coverletter/loading-screen"
import Link from "next/link"

export default function CoverLetterPage() {
  const { toast } = useToast()
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("coverLetterData")
      return saved ? JSON.parse(saved) : defaultCoverLetterData
    }
    return defaultCoverLetterData
  })

  const [template, setTemplate] = useState<CoverLetterTemplate>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("coverLetterTemplate")
      return saved ? (saved as CoverLetterTemplate) : "standard"
    }
    return "standard"
  })

  const [jobDescription, setJobDescription] = useState("")
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-1.5-pro")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showQuotaWarning, setShowQuotaWarning] = useState(false)
  const [isApplyingChanges, setIsApplyingChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentRef = useRef<HTMLInputElement>(null)

  const [input, setInput] = useState('');

  const bodyRef = useRef<Record<string, unknown>>({ coverLetterData, jobDescription, model: selectedModel, apiKey });
  bodyRef.current = { coverLetterData, jobDescription, model: selectedModel, apiKey };

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    stop
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error)
      if (error.message && error.message.includes("429") && error.message.includes("quota")) {
        setShowQuotaWarning(true)
      }
    },

    transport: new DefaultChatTransport({
      api: "/api/cover-letter-chat",
      prepareSendMessagesRequest: ({ messages, id }) => ({ body: { ...bodyRef.current, messages, id } }),
    }),
  })

  // Save to localStorage whenever coverLetterData changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("coverLetterData", JSON.stringify(coverLetterData))
    }
  }, [coverLetterData])

  // Save template to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("coverLetterTemplate", template)
    }
  }, [template])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        setCoverLetterData(json)
        toast({
          title: "Cover letter data loaded",
          description: "Your cover letter data has been successfully imported.",
        })
      } catch (error) {
        toast({
          title: "Error loading file",
          description: "The file is not a valid JSON cover letter data file.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const downloadCoverLetterData = () => {
    const dataStr = JSON.stringify(coverLetterData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "cover-letter-data.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Cover letter data saved",
      description: "Your cover letter data has been downloaded as JSON.",
    })
  }

  const handleDownloadPDF = async () => {
    try {
      await generateCoverLetterPDF(coverLetterData, template)
      toast({
        title: "PDF Downloaded",
        description: "Your cover letter has been downloaded as a PDF.",
      })
    } catch (error) {
      toast({
        title: "Error generating PDF",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Apply AI changes with animation
  const applyAiChanges = async () => {
    // Find the last assistant message
    const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistantMessage) return

    setIsApplyingChanges(true)

    try {
      // Improved regex to better match JSON in the message, handling multiline JSON blocks
      const regex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
      const content = getTextContent(lastAssistantMessage)
      const match = content.match(regex)

      if (match && match[1]) {
        try {
          const suggestedChanges = JSON.parse(match[1].trim())
          console.log("Parsed AI suggestions:", suggestedChanges)

          // Apply changes
          setCoverLetterData((current) => {
            const newCoverLetterData = { ...current }

            if (suggestedChanges.head) {
              newCoverLetterData.head = suggestedChanges.head
            }

            if (suggestedChanges.body) {
              newCoverLetterData.body = suggestedChanges.body
            }

            if (suggestedChanges.footer) {
              newCoverLetterData.footer = suggestedChanges.footer
            }

            return newCoverLetterData
          })

          toast({
            title: "AI changes applied",
            description: "The suggested changes have been applied to your cover letter.",
          })
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError, "Raw JSON:", match[1])
          toast({
            title: "Error parsing JSON",
            description: "The AI suggestion contains invalid JSON. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // Try to find JSON without code blocks
        const jsonRegex = /\{[\s\S]*?\}/g
        const jsonMatches = content.match(jsonRegex)

        if (jsonMatches) {
          // Try each potential JSON match
          for (const potentialJson of jsonMatches) {
            try {
              const suggestedChanges = JSON.parse(potentialJson)

              // Check if this is a valid cover letter change (has at least one expected key)
              const validKeys = ["head", "body", "footer"]
              if (validKeys.some((key) => key in suggestedChanges)) {
                // Apply the changes
                setCoverLetterData((current) => {
                  const newCoverLetterData = { ...current }

                  if (suggestedChanges.head) {
                    newCoverLetterData.head = suggestedChanges.head
                  }

                  if (suggestedChanges.body) {
                    newCoverLetterData.body = suggestedChanges.body
                  }

                  if (suggestedChanges.footer) {
                    newCoverLetterData.footer = suggestedChanges.footer
                  }

                  return newCoverLetterData
                })

                toast({
                  title: "AI changes applied",
                  description: "The suggested changes have been applied to your cover letter.",
                })

                break // Exit after successfully applying changes
              }
            } catch (e) {
              // This wasn't valid JSON or wasn't a cover letter change, continue to next match
              continue
            }
          }
        } else {
          toast({
            title: "No changes found",
            description: "No applicable changes were found in the AI response.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to parse AI suggestions", error)
      toast({
        title: "Error applying changes",
        description: "There was an error applying the AI suggestions.",
        variant: "destructive",
      })
    } finally {
      setIsApplyingChanges(false)
    }
  }

  // Handle chat submit
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.()
    setShowQuotaWarning(false)

    // Check if there's a file attachment
    const files = attachmentRef.current?.files
    if (files && files.length > 0) {
      const file = files[0]

      if (file.type === "application/pdf") {
        toast({
          title: "PDF attached",
          description: "PDF attachments are being processed (demo only).",
        })
      } else if (file.type === "application/json") {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const attachedData = JSON.parse(event.target?.result as string)
            bodyRef.current = { ...bodyRef.current, attachedData: JSON.stringify(attachedData) }
            sendMessage({ text: input })
            setInput("")
          } catch (error) {
            toast({
              title: "Error processing JSON",
              description: "The attached JSON file could not be processed.",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
        if (attachmentRef.current) attachmentRef.current.value = ""
        return
      }
    }

    sendMessage({ text: input })
    setInput("")
    if (attachmentRef.current) attachmentRef.current.value = ""
  }

  return (
    <LoadingScreen minLoadingTime={5000}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto py-8 px-4">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-primary">AI-Powered Cover Letter Generator</h1>
            <p className="text-muted-foreground">
              Create, customize, and optimize your cover letter with AI assistance
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Editor & Chat */}
            <div className="space-y-6">
              <Card className="border shadow-md">
                <Tabs defaultValue="editor" className="w-full">
                  <TabsList className="w-full rounded-t-lg rounded-b-none bg-muted/50">
                    <TabsTrigger value="editor" className="flex-1 data-[state=active]:bg-background">
                      <FileText className="h-4 w-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-background">
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Assistant
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor" className="p-6 space-y-4 m-0">
                    <div>
                      <CoverLetterEditor coverLetterData={coverLetterData} setCoverLetterData={setCoverLetterData} />
                    </div>
                  </TabsContent>

                  {/* Enhanced Chat UI */}
                  <TabsContent value="chat" className="p-6 space-y-4 m-0">
                    <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
                      <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Paste a job description below to tailor your cover letter for specific positions. Our AI will
                        suggest improvements to match the requirements.
                      </p>
                      <div className="mb-2">
                        <Textarea
                          id="job-description"
                          placeholder="Paste the job description here to tailor your cover letter..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          className="h-32"
                        />
                      </div>
                    </div>

                    {showQuotaWarning && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>API Quota Exceeded</AlertTitle>
                        <AlertDescription>
                          The Google AI API quota has been exceeded. The assistant will provide generic advice instead
                          of personalized responses. Consider adding your own API key below or try again later.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* AI Model Selection */}
                    <div className="mb-4">
                      <Label htmlFor="ai-model">AI Model</Label>
                      <Select value={selectedModel} onValueChange={(value: AIModel) => setSelectedModel(value)}>
                        <SelectTrigger id="ai-model">
                          <SelectValue placeholder="Select AI model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                          <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                          <SelectItem value="gemini-2.0-flash-001">Gemini 2.0 Flash</SelectItem>
                          <SelectItem value="gemini-2.0-flash-thinking-exp-01-21">Gemini 2.0 Thinking</SelectItem>
                          <SelectItem value="gemini-2.0-flash-001">Gemini 2.0 Flash</SelectItem>
                          <SelectItem value="gemini-2.0-flash-exp-image-generation">Gemini 2.0 Flash with Image</SelectItem>
                          <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</SelectItem>
                          <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Flash Pro</SelectItem>

                          {/* New Models */}
                          <SelectItem value="gpt-4">GPT-4 (soon...)</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo(soon...)</SelectItem>

                          <SelectItem value="claude-1">Claude 1(soon...)</SelectItem>
                          <SelectItem value="claude-2">Claude 2(soon...)</SelectItem>
                          <SelectItem value="claude-3">Claude 3(soon...)</SelectItem>

                          <SelectItem value="deep-seek-v1">Deep Seek V1(soon...)</SelectItem>
                          <SelectItem value="deep-seek-v2">Deep Seek V2(soon...)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* API Key Input */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="api-key">Google API Key</Label>
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
                          placeholder="Enter your Google API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setApiKey("")
                            toast({
                              title: "API key cleared",
                              description: "Using default API key now.",
                            })
                          }}
                        >
                          <RotateCw size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced Chat UI */}
                    <CoverLetterChat
                      messages={messages}
                      setMessages={setMessages}
                      sendMessage={sendMessage}
                      input={input}
                      handleInputChange={e => setInput(e.target.value)}
                      handleSubmit={handleChatSubmit}
                      isLoading={status === "submitted" || status === "streaming"}
                      isStreaming={status === "streaming"}
                      onStop={stop}
                      applyAiChanges={applyAiChanges}
                      isApplyingChanges={isApplyingChanges}
                      attachmentRef={attachmentRef}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Column - Preview & Controls */}
            <div className="space-y-6">
              <Card className="p-4 border shadow-md">
                <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                  <div className="flex gap-2">
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
                    <Button variant="outline" onClick={downloadCoverLetterData} className="flex items-center gap-2">
                      <Download size={16} />
                      Save Details
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2">
                      <FileText size={16} />
                      Download PDF
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={template} onValueChange={(value: CoverLetterTemplate) => setTemplate(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(coverLetterTemplates).map((templateKey) => (
                          <SelectItem key={templateKey} value={templateKey}>
                            {templateKey.charAt(0).toUpperCase() + templateKey.slice(1).replace(/-/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Link href={"/"}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <FileText size={16} />
                        CV
                      </Button>
                    </Link>
                    <Link href={"/donate"}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <HandHeart size={16} />
                        Donate
                      </Button>
                    </Link>
                    <Link href={"/feedback"}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <TableOfContents size={16} />
                        Feedback
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <div className="h-[800px]">
                <CoverLetterPDFViewer coverLetterData={coverLetterData} template={template} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoadingScreen>
  );
}
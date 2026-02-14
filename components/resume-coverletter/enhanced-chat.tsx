"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, StopCircle, FileText, X, Paperclip, Image, FileUp, Sparkles, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "ai"
import { extractResumeJsonFromMessage, getSuggestedSectionsSummary } from "@/lib/extract-resume-json"

function AssistantMessageContent({ content }: { content: string }) {
  const update = extractResumeJsonFromMessage(content)
  const sections = update ? getSuggestedSectionsSummary(update) : []
  const hasSuggestedChanges = sections.length > 0

  if (!hasSuggestedChanges) {
    return <div className="whitespace-pre-wrap text-sm break-words">{content}</div>
  }

  const withoutJsonBlock = content.replace(/```(?:json)?\s*[\s\S]*?```/g, "").trim()
  return (
    <div className="space-y-2">
      {withoutJsonBlock && (
        <div className="whitespace-pre-wrap text-sm break-words">{withoutJsonBlock}</div>
      )}
      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
        <p className="font-medium text-primary mb-1">Suggested resume updates</p>
        <p className="text-muted-foreground">
          {sections.join(" · ")} — use <strong>Apply AI Changes</strong> below to update your resume.
        </p>
      </div>
    </div>
  )
}

interface EnhancedChatProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: any) => void
  isLoading: boolean
  onStop?: () => void
  applyAiChanges: () => void
  aiMode: boolean
  attachmentRef: React.RefObject<HTMLInputElement>
  contextText?: string
  onFilesAttached?: (files: File[]) => void
}

export default function EnhancedChat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStop,
  applyAiChanges,
  aiMode,
  attachmentRef,
  contextText,
  onFilesAttached,
}: EnhancedChatProps) {
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [canApplyChanges, setCanApplyChanges] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

    // If we have messages and the last one is from the assistant, enable apply changes
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setCanApplyChanges(true)
      setTypingIndicator(false)
    } else if (isLoading) {
      setTypingIndicator(true)
      setCanApplyChanges(false)
    }
  }, [messages, isLoading])

  // Handle file attachment - now handled directly in the input onChange
  // This useEffect is no longer needed since we handle file changes directly

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => {
      const newFiles = [...prev]
      newFiles.splice(index, 1)
      return newFiles
    })

    // Reset the file input
    if (attachmentRef.current) {
      attachmentRef.current.value = ""
    }

    // Notify parent component about removed files
    if (onFilesAttached) {
      const remainingFiles = attachedFiles.filter((_, i) => i !== index)
      onFilesAttached(remainingFiles)
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTypingIndicator(true)

    if (isLoading && onStop) {
      onStop()
      return
    }

    if (input.trim() === "" && attachedFiles.length === 0) {
      toast({
        title: "Empty message",
        description: "Please enter a message or attach a file.",
        variant: "destructive",
      })
      return
    }

    handleSubmit(e)
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />
    if (fileType === "application/pdf") return <FileText className="h-4 w-4" />
    if (fileType === "application/json") return <FileText className="h-4 w-4" />
    if (fileType === "text/plain") return <FileText className="h-4 w-4" />
    if (fileType.includes("word") || fileType.includes("document")) return <FileText className="h-4 w-4" />
    return <Paperclip className="h-4 w-4" />
  }

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith("image/")) return "Image"
    if (fileType === "application/pdf") return "PDF"
    if (fileType === "application/json") return "JSON"
    if (fileType === "text/plain") return "Text"
    if (fileType.includes("word") || fileType.includes("document")) return "Document"
    return "File"
  }

  return (
    <Card className="border shadow-lg overflow-hidden">
      <CardHeader className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="h-5 w-5 text-primary" />
            Chat with AI Assistant
          </CardTitle>
          {contextText && contextText.trim() && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 font-medium">Context Active</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4 mb-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center p-4">
                <Bot className="h-12 w-12 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Assistant Ready</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me anything about your resume or how to improve it.
                  {aiMode && " I can also tailor your resume to match job descriptions."}
                  <br/> Always Make sure to add atleast a basic prompt in chat to tailor the resume. <br/>
                  <p className="text-red-600">example prompt: Tailor my Resume as per job description.</p>
                  {contextText && contextText.trim() && (
                    <>
                      <br/>
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Active Context:</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{contextText.trim().length > 100 ? contextText.trim().substring(0, 100) + '...' : contextText.trim()}</p>
                      </div>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex gap-3 max-w-full group",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "rounded-lg p-3 max-w-[85%] shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-10"
                          : "bg-muted/50 border border-border/50 mr-10",
                      )}
                    >
                      <AssistantMessageContent content={message.content} />
                      <div className="mt-1 text-xs opacity-70 text-right">
                        {formatTimestamp(new Date(message.createdAt || Date.now()))}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}

                {typingIndicator && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 max-w-full"
                  >
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="rounded-lg p-4 max-w-[85%] bg-muted/50 border border-border/50 mr-10 flex items-center">
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0 }}
                          className="h-2 w-2 bg-primary/60 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
                          className="h-2 w-2 bg-primary/60 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
                          className="h-2 w-2 bg-primary/60 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background">
        <form onSubmit={handleFormSubmit} className="w-full space-y-3">
          {/* Attached files */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachedFiles.map((file, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 pl-2 pr-1">
                  {getFileIcon(file.type)}
                  <span className="text-xs max-w-[100px] truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({getFileTypeLabel(file.type)})</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 rounded-full"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              {/* Hidden file input for attachments */}
              <input
                ref={attachmentRef}
                type="file"
                accept=".pdf,.json,.txt,.csv,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.bmp"
                multiple={false}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const newFiles = Array.from(e.target.files)
                    setAttachedFiles(newFiles)
                    // Notify parent component about attached files
                    if (onFilesAttached) {
                      onFilesAttached(newFiles)
                    }
                  }
                }}
              />
              
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder={aiMode ? "Ask AI to tailor your resume..." : "Ask questions about your resume..."}
                className="min-h-[80px] pr-12 resize-none border rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (!isLoading) {
                      const form = e.currentTarget.form
                      if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
                    }
                  }
                }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                        onClick={() => attachmentRef.current?.click()}
                      >
                        <FileUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Attach file (PDF, Word, Excel, JSON, TXT, CSV, Images)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Button
              type="submit"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-200",
                isLoading ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
              )}
            >
              {isLoading ? <StopCircle className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </form>
      </CardFooter>
      {aiMode && messages.length > 0 && (
          <motion.div
            className="mt-4 p-2 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={applyAiChanges}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300"
              disabled={!canApplyChanges}
              variant="default"
            >
              <Sparkles size={16} className="mr-2" />
              Apply AI Changes
            </Button>
          </motion.div>
        )}
    </Card>
  )
}
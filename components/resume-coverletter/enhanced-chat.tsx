"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, StopCircle, FileText, X, Paperclip, Image, FileUp, Sparkles, Bot, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { UIMessage } from "ai"
import { extractResumeJsonFromMessage, getSuggestedSectionsSummary } from "@/lib/extract-resume-json"
import { getTextContent } from "@/lib/message-utils"

function AssistantMessageContent({ content }: { content: string }) {
  const update = extractResumeJsonFromMessage(content)
  const sections = update ? getSuggestedSectionsSummary(update) : []
  const hasSuggestedChanges = sections.length > 0

  if (!hasSuggestedChanges) {
    return (
      <div className="whitespace-pre-wrap text-sm break-words overflow-hidden hyphens-auto leading-relaxed">
        {content}
      </div>
    )
  }

  const withoutJsonBlock = content.replace(/```(?:json)?\s*[\s\S]*?```/g, "").trim()
  return (
    <div className="space-y-2">
      {withoutJsonBlock && (
        <div className="whitespace-pre-wrap text-sm break-words overflow-hidden hyphens-auto leading-relaxed">
          {withoutJsonBlock}
        </div>
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
  messages: UIMessage[]
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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [canApplyChanges, setCanApplyChanges] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const lastMessageCountRef = useRef(0)
  const userScrolledRef = useRef(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
    userScrolledRef.current = false
    setShowScrollToBottom(false)
  }, [])

  const checkScrollPosition = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const nearBottom = scrollHeight - scrollTop - clientHeight < 120
    setShowScrollToBottom(!nearBottom)
    if (nearBottom) userScrolledRef.current = false
  }, [])

  // Scroll to bottom when new message is added or streaming, unless user scrolled up
  useEffect(() => {
    const newCount = messages.length
    const hadNewMessage = newCount > lastMessageCountRef.current
    lastMessageCountRef.current = newCount

    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setCanApplyChanges(true)
      setTypingIndicator(false)
    } else if (isLoading) {
      setTypingIndicator(true)
      setCanApplyChanges(false)
    }

    if (hadNewMessage || isLoading) {
      if (!userScrolledRef.current) {
        requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }))
      }
    }
  }, [messages, isLoading])

  useEffect(() => {
    const el = messagesContainerRef.current
    if (!el) return
    el.addEventListener("scroll", checkScrollPosition, { passive: true })
    return () => el.removeEventListener("scroll", checkScrollPosition)
  }, [checkScrollPosition])

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

  const handleScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80
    if (!nearBottom) userScrolledRef.current = true
  }

  return (
    <Card className="border shadow-lg overflow-hidden flex flex-col min-h-0">
      <CardHeader className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="h-5 w-5 text-primary" />
            Chat with AI Assistant
          </CardTitle>
          {contextText && contextText.trim() && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Context Active</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col min-h-0 flex-1 relative">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className={cn(
            "overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3",
            "min-h-[280px] sm:min-h-[320px] h-[min(420px,55vh)] sm:h-[min(480px,58vh)]",
            "scroll-smooth",
          )}
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="space-y-4 pb-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
                <Bot className="h-12 w-12 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Assistant Ready</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me anything about your resume or how to improve it.
                  {aiMode && " I can also tailor your resume to match job descriptions."}
                  <br /> Always add at least a basic prompt in chat to tailor the resume. <br />
                  <span className="text-destructive/90 text-xs">Example: Tailor my resume as per job description.</span>
                  {contextText && contextText.trim() && (
                    <>
                      <br />
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Active Context:</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {contextText.trim().length > 100 ? contextText.trim().substring(0, 100) + "..." : contextText.trim()}
                        </p>
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
                      "flex gap-2 sm:gap-3 max-w-full group",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 max-w-[90%] sm:max-w-[85%] shadow-sm",
                        "border",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground border-primary/30 ml-8 sm:ml-10"
                          : "bg-muted/60 dark:bg-muted/40 border-border/50 mr-8 sm:mr-10",
                      )}
                    >
                      <AssistantMessageContent content={getTextContent(message)} />
                      <div className="mt-1.5 text-[10px] sm:text-xs opacity-70 text-right">
                        {formatTimestamp(new Date((message as { createdAt?: number | string }).createdAt || Date.now()))}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                    className="flex gap-2 sm:gap-3 max-w-full"
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl px-4 py-3 max-w-[85%] bg-muted/50 border border-border/50 mr-8 sm:mr-10 flex items-center">
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
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>

        <AnimatePresence>
          {showScrollToBottom && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
            >
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full shadow-lg border bg-background/95 backdrop-blur hover:bg-background"
                onClick={() => scrollToBottom("smooth")}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Scroll to bottom
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
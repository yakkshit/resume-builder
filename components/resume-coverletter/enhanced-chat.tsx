"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, StopCircle, FileText, X, Paperclip, Image, FileUp, Sparkles, Bot, User, ChevronDown, Pencil, RotateCw } from "lucide-react"
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
import { getTextContent, getReasoningContent } from "@/lib/message-utils"
import ReactMarkdown from "react-markdown"

function MarkdownContent({ content, className }: { content: string; className?: string }) {
  if (!content || typeof content !== "string") return null
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-0.5 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-0.5 my-2">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function AssistantMessageContent({ message, content, reasoning, isStreaming }: { message?: UIMessage; content: string; reasoning?: string; isStreaming?: boolean }) {
  const safeContent = typeof content === "string" ? content : ""
  const update = extractResumeJsonFromMessage(safeContent)
  const sections = update ? getSuggestedSectionsSummary(update) : []
  const hasSuggestedChanges = Array.isArray(sections) && sections.length > 0 && !isStreaming
  const showReasoning = (reasoning ?? "").trim().length > 0

  if (!hasSuggestedChanges) {
    return (
      <div className="space-y-2 relative">
        {showReasoning && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {isStreaming ? "Thinking…" : "Thought process"}
            </p>
            <div className="whitespace-pre-wrap text-xs text-muted-foreground break-words leading-relaxed">
              {reasoning}
            </div>
          </div>
        )}
        {safeContent ? (
          <div className="text-sm break-words overflow-hidden leading-relaxed">
            <MarkdownContent content={safeContent} className="text-foreground" />
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse align-middle" aria-hidden />
            )}
          </div>
        ) : isStreaming && !showReasoning && !safeContent ? (
          <p className="text-sm text-muted-foreground italic flex items-center gap-2">
            <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded" aria-hidden />
            We are tailoring the resume.
          </p>
        ) : null}
      </div>
    )
  }

  const withoutJsonBlock = safeContent.replace(/```(?:json)?\s*[\s\S]*?```/g, "").trim()
  return (
    <div className="space-y-2">
      {withoutJsonBlock && (
        <div className="text-sm break-words overflow-hidden leading-relaxed">
          <MarkdownContent content={withoutJsonBlock} className="text-foreground" />
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
  setMessages?: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void
  sendMessage?: (options: { text: string }) => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: any) => void
  isLoading: boolean
  isStreaming?: boolean
  onStop?: () => void
  applyAiChanges: () => void
  aiMode: boolean
  attachmentRef: React.RefObject<HTMLInputElement>
  contextText?: string
  onFilesAttached?: (files: File[]) => void
}

export default function EnhancedChat({
  messages,
  setMessages,
  sendMessage,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isStreaming = false,
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const lastMessageCountRef = useRef(0)
  const userScrolledRef = useRef(false)
  const canEdit = Boolean(setMessages && sendMessage)

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

    if (messages.length > 0 && messages[messages.length - 1].role === "assistant" && !isLoading) {
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

  const startEdit = (msg: UIMessage) => {
    setEditingId(msg.id)
    setEditDraft(getTextContent(msg))
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft("")
  }
  const saveEdit = () => {
    if (!setMessages || !editingId || editDraft.trim() === "") {
      cancelEdit()
      return
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editingId
          ? { ...m, parts: [{ type: "text" as const, text: editDraft.trim() }] }
          : m
      )
    )
    toast({ title: "Message updated", description: "Your edit has been saved." })
    cancelEdit()
  }
  const resendFromMessage = (msg: UIMessage) => {
    if (!setMessages || !sendMessage) return
    const text = editingId === msg.id ? editDraft.trim() : getTextContent(msg)
    if (!text) return
    const idx = messages.findIndex((m) => m.id === msg.id)
    if (idx < 0) return
    setMessages((prev) => prev.slice(0, idx + 1))
    cancelEdit()
    sendMessage({ text })
    toast({ title: "Resending", description: "New response will appear below." })
  }

  return (
    <Card className="relative overflow-hidden flex flex-col min-h-0 border shadow-xl bg-card/95 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.03] pointer-events-none" />
      <CardHeader className="relative p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-foreground">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/10"
            >
              <Bot className="h-5 w-5 text-primary" />
            </motion.div>
            <span>Chat with AI Assistant</span>
          </CardTitle>
          {contextText && contextText.trim() && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Context Active</span>
            </motion.div>
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
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center justify-center min-h-[200px] text-center p-4"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.5, ease: "easeInOut" }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 dark:bg-primary/10 mb-4 ring-1 ring-primary/10 shadow-inner"
                >
                  <Bot className="h-8 w-8 text-primary/60 dark:text-primary/70" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">AI Assistant Ready</h3>
                <div className="text-sm text-muted-foreground max-w-md leading-relaxed">
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
                </div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message, idx) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                    }}
                    className={cn(
                      "flex gap-2 sm:gap-3 max-w-full group",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.05 }}
                      >
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1 flex-shrink-0 ring-2 ring-primary/10">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 max-w-[90%] sm:max-w-[85%] shadow-sm",
                        "border transition-shadow duration-200",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground border-primary/30 ml-8 sm:ml-10 shadow-md hover:shadow-lg"
                          : "bg-muted/70 dark:bg-muted/50 border-border/60 mr-8 sm:mr-10 dark:border-border/80 hover:shadow-md",
                      )}
                    >
                      {message.role === "user" && editingId === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            className="min-h-[80px] text-sm bg-background/90 text-foreground border-primary/30 resize-none"
                            placeholder="Edit message..."
                          />
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                              Cancel
                            </Button>
                            <Button type="button" variant="secondary" size="sm" onClick={saveEdit}>
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => resendFromMessage(message)}
                              disabled={!editDraft.trim()}
                            >
                              <RotateCw className="h-3.5 w-3.5 mr-1" />
                              Resend from here
                            </Button>
                          </div>
                        </div>
                      ) : message.role === "assistant" ? (
                        <AssistantMessageContent
                          message={message}
                          content={getTextContent(message)}
                          reasoning={getReasoningContent(message)}
                          isStreaming={isStreaming && idx === messages.length - 1}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm break-words">{getTextContent(message)}</div>
                      )}
                      {editingId !== message.id && (
                        <div className="mt-1.5 flex items-center justify-end gap-2">
                          {message.role === "user" && canEdit && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-70 hover:opacity-100"
                                    onClick={() => startEdit(message)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">Edit message</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-70 hover:opacity-100"
                                    onClick={() => resendFromMessage(message)}
                                  >
                                    <RotateCw className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">Resend from here</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <span className="text-[10px] sm:text-xs opacity-70">
                            {formatTimestamp(new Date((message as { createdAt?: number | string }).createdAt || Date.now()))}
                          </span>
                        </div>
                      )}
                    </motion.div>

                    {message.role === "user" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.05 }}
                      >
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1 flex-shrink-0 ring-2 ring-secondary/20">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {typingIndicator && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="flex gap-2 sm:gap-3 max-w-full"
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1 ring-2 ring-primary/10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
                      className="rounded-2xl px-4 py-3 max-w-[85%] bg-muted/70 dark:bg-muted/50 border border-border/60 mr-8 sm:mr-10 flex items-center gap-2"
                    >
                      <div className="flex space-x-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 0.8,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                            className="h-2 w-2 bg-primary rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">thinking...</span>
                    </motion.div>
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
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow-lg border bg-background/95 backdrop-blur hover:bg-background gap-2"
                  onClick={() => scrollToBottom("smooth")}
                >
                  <motion.span
                    animate={{ y: [0, 2, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                  New messages
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="relative p-4 border-t bg-muted/30 dark:bg-muted/20">
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
              
              <div className="rounded-xl">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={aiMode ? "Ask AI to tailor your resume..." : "Ask questions about your resume..."}
                  className="min-h-[80px] pr-12 resize-none border-2 rounded-xl bg-background dark:bg-background/95 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/70"
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
              </div>
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

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full transition-all duration-200 shadow-md",
                  isLoading ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90 hover:shadow-lg",
                )}
              >
                {isLoading ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <StopCircle className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </form>
      </CardFooter>
      {aiMode && messages.length > 0 && (
          <motion.div
            className="relative mt-4 p-2 w-full overflow-hidden rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={applyAiChanges}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg disabled:opacity-50"
                disabled={!canApplyChanges}
                variant="default"
              >
                <motion.span
                  animate={canApplyChanges ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5, repeat: canApplyChanges ? Infinity : 0, repeatDelay: 2 }}
                >
                  <Sparkles size={16} className="mr-2" />
                </motion.span>
                Apply AI Changes
              </Button>
            </motion.div>
          </motion.div>
        )}
    </Card>
  )
}
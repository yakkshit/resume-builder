"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, StopCircle, FileText, X, Paperclip, Image, FileUp, Sparkles, Bot, User, Pencil, RotateCw, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getTextContent } from "@/lib/message-utils"
import { useToast } from "@/hooks/use-toast"
import type { UIMessage } from "ai"

/** Parse cover letter JSON suggestion from assistant message (head/body/footer). */
function parseCoverLetterSuggestion(content: string): { head?: string; body?: string; footer?: string } | null {
  const regex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
  const match = content.match(regex)
  if (match?.[1]) {
    try {
      const parsed = JSON.parse(match[1].trim())
      if (["head", "body", "footer"].some((k) => k in parsed)) return parsed
    } catch {
      // ignore
    }
  }
  const jsonRegex = /\{[\s\S]*?"(?:head|body|footer)"[\s\S]*?\}/g
  const matches = content.match(jsonRegex) || []
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m)
      if (["head", "body", "footer"].some((k) => k in parsed)) return parsed
    } catch {
      // ignore
    }
  }
  return null
}

function CoverLetterGenerativeBlock({
  content,
  isStreaming,
  onApply,
  isApplying,
}: {
  content: string
  isStreaming?: boolean
  onApply: () => void
  isApplying: boolean
}) {
  const suggestion = parseCoverLetterSuggestion(content)
  const withoutJson = content.replace(/```(?:json)?\s*[\s\S]*?```/g, "").trim()

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="whitespace-pre-wrap text-sm break-words leading-relaxed">
          {withoutJson || content}
        </div>
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse align-middle" aria-hidden />
        )}
      </div>
      {suggestion && !isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-4 space-y-3 shadow-sm"
        >
          <p className="text-sm font-medium text-primary">Suggested cover letter</p>
          <div className="space-y-2 text-sm">
            {suggestion.head != null && (
              <div>
                <span className="text-muted-foreground font-medium">Heading</span>
                <p className="mt-0.5 line-clamp-2">{String(suggestion.head).slice(0, 120)}…</p>
              </div>
            )}
            {suggestion.body != null && (
              <div>
                <span className="text-muted-foreground font-medium">Body</span>
                <p className="mt-0.5 line-clamp-3">{String(suggestion.body).slice(0, 200)}…</p>
              </div>
            )}
            {suggestion.footer != null && (
              <div>
                <span className="text-muted-foreground font-medium">Footer</span>
                <p className="mt-0.5 line-clamp-1">{String(suggestion.footer).slice(0, 80)}…</p>
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={onApply}
            disabled={isApplying}
            className="w-full gap-2"
          >
            {isApplying ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Apply to cover letter
          </Button>
        </motion.div>
      )}
    </div>
  )
}

interface CoverLetterChatProps {
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
  isApplyingChanges: boolean
  attachmentRef: React.RefObject<HTMLInputElement | null>
}

export default function CoverLetterChat({
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
  isApplyingChanges,
  attachmentRef,
}: CoverLetterChatProps) {
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [canApplyChanges, setCanApplyChanges] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const canEdit = Boolean(setMessages && sendMessage)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom()

    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setCanApplyChanges(true)
      setTypingIndicator(false)
    } else if (isLoading) {
      setTypingIndicator(true)
      setCanApplyChanges(false)
    }
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 120)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  // Handle file attachment
  useEffect(() => {
    const handleFileChange = () => {
      if (attachmentRef.current?.files?.length) {
        const newFiles = Array.from(attachmentRef.current.files)
        setAttachedFiles(newFiles)
      }
    }

    attachmentRef.current?.addEventListener("change", handleFileChange)
    return () => {
      attachmentRef.current?.removeEventListener("change", handleFileChange)
    }
  }, [attachmentRef])

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
    return <Paperclip className="h-4 w-4" />
  }

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith("image/")) return "Image"
    if (fileType === "application/pdf") return "PDF"
    if (fileType === "application/json") return "JSON"
    return "File"
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
    if (!setMessages || !editingId || !editDraft.trim()) {
      cancelEdit()
      return
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editingId ? { ...m, parts: [{ type: "text" as const, text: editDraft.trim() }] } : m
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
    <Card className="relative overflow-hidden flex flex-col min-h-0 border shadow-xl bg-card/95 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.03] pointer-events-none" />
      <CardHeader className="relative p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-foreground">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/10"
          >
            <Bot className="h-5 w-5 text-primary" />
          </motion.div>
          Cover Letter Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="relative p-0 flex flex-col min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 scroll-smooth h-[min(420px,55vh)] sm:h-[min(480px,58vh)]"
        >
          <div className="space-y-4 mb-2">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[200px] text-center p-4"
              >
                <Bot className="h-14 w-14 text-primary/20 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cover Letter Assistant Ready</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Ask me to help craft a compelling cover letter. I can tailor it to job descriptions and
                  highlight your skills. When I suggest changes, you can apply them with one click.
                </p>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message, idx) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={cn(
                      "flex gap-3 max-w-full group",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0 ring-2 ring-primary/10">
                        <AvatarImage src="/ai-avatar.png" alt="AI" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 max-w-[90%] sm:max-w-[85%] shadow-sm border transition-shadow",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground border-primary/30 ml-10"
                          : "bg-muted/70 dark:bg-muted/50 border-border/60 mr-10",
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
                        <CoverLetterGenerativeBlock
                          content={getTextContent(message)}
                          isStreaming={isStreaming && idx === messages.length - 1}
                          onApply={applyAiChanges}
                          isApplying={isApplyingChanges}
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
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0 ring-2 ring-secondary/20">
                        <AvatarImage src="/user-avatar.png" alt="User" />
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
                    <Avatar className="h-8 w-8 mt-1 ring-2 ring-primary/10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl px-4 py-3 max-w-[85%] bg-muted/70 dark:bg-muted/50 border border-border/60 mr-10 flex items-center gap-2">
                      <div className="flex space-x-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: i * 0.15, ease: "easeInOut" }}
                            className="h-2 w-2 bg-primary rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <AnimatePresence>
          {showScrollToBottom && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
            >
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full shadow-lg border bg-background/95 backdrop-blur gap-2"
                onClick={() => scrollToBottom("smooth")}
              >
                <ChevronDown className="h-4 w-4" />
                New messages
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="p-4 border-t bg-muted/30 dark:bg-muted/20">
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
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask AI to help with your cover letter..."
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
                      <p>Attach file (PDF, JSON)</p>
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

      {messages.length > 0 && (
          <motion.div
            className="mt-4 p-2 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={applyAiChanges}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300"
              disabled={!canApplyChanges || isApplyingChanges}
              variant="default"
            >
              {isApplyingChanges ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                  Applying Changes...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Apply AI Changes
                </>
              )}
            </Button>
          </motion.div>
        )}

    </Card>
  )
}
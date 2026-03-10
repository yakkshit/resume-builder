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
import { getTextContent } from "@/lib/message-utils"
import { useToast } from "@/hooks/use-toast"
import type { UIMessage } from "ai"

interface CoverLetterChatProps {
  messages: UIMessage[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: any) => void
  isLoading: boolean
  onStop?: () => void
  applyAiChanges: () => void
  isApplyingChanges: boolean
  attachmentRef: React.RefObject<HTMLInputElement>
}

export default function CoverLetterChat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStop,
  applyAiChanges,
  isApplyingChanges,
  attachmentRef,
}: CoverLetterChatProps) {
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

  return (
    <Card className="border shadow-lg overflow-hidden">
      <CardHeader className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Bot className="h-5 w-5 text-primary" />
          Cover Letter Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4 mb-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center p-4">
                <Bot className="h-12 w-12 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">Cover Letter Assistant Ready</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me to help craft a compelling cover letter. I can tailor it to match job descriptions and
                  highlight your relevant skills and experiences.
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
                        <AvatarImage src="/ai-avatar.png" alt="AI" />
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
                      <div className="whitespace-pre-wrap text-sm break-words">{getTextContent(message)}</div>
                      <div className="mt-1 text-xs opacity-70 text-right">
                        {formatTimestamp(new Date((message as { createdAt?: number | string }).createdAt || Date.now()))}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
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
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src="/ai-avatar.png" alt="AI" />
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
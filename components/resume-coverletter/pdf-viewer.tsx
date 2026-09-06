"use client"
import React, { useState, useEffect, useRef, useMemo } from "react"
import { pdf } from "@react-pdf/renderer"
import type { ResumeData, Template } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, AlertCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { getResumeTemplate } from "@/components/pdf-templates"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"

interface PDFViewerProps {
  resumeData: ResumeData
  template: Template
}

export default function PDFViewer({ resumeData, template }: PDFViewerProps) {
  const safeResumeData = useMemo(() => sanitizeResumeData(resumeData), [resumeData])
  const [isClient, setIsClient] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const { toast } = useToast()

  const currentBlobUrlRef = useRef<string | null>(null)
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsClient(true)
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current)
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [])

  // Generate PDF Blob whenever safeResumeData or template changes
  useEffect(() => {
    if (!isClient) return

    let isCancelled = false
    setIsLoading(true)
    setRenderError(null)

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    renderTimeoutRef.current = setTimeout(async () => {
      try {
        const PDFTemplate = getResumeTemplate(template as string)
        const element = React.createElement(PDFTemplate, { resumeData: safeResumeData })
        const pdfDoc = pdf(element)
        const blob = await pdfDoc.toBlob()

        if (isCancelled) return

        const newUrl = URL.createObjectURL(blob)

        // Revoke previous blob URL to prevent memory leaks
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current)
        }
        currentBlobUrlRef.current = newUrl
        setBlobUrl(newUrl)
        setRenderError(null)
      } catch (err) {
        if (isCancelled) return
        console.error("PDF generation/preview error:", err)
        setRenderError(err instanceof Error ? err.message : "Failed to render PDF preview")
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }, 300)

    return () => {
      isCancelled = true
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [safeResumeData, template, isClient])

  const handleDownload = async () => {
    if (!isClient) return

    try {
      setIsDownloading(true)
      let blob: Blob | null = null

      try {
        const PDFTemplate = getResumeTemplate(template as string)
        const element = React.createElement(PDFTemplate, { resumeData: safeResumeData })
        blob = await pdf(element).toBlob()
      } catch (clientErr) {
        console.warn("Client-side PDF rendering failed, falling back to MCP server...", clientErr)
        const { mcpGenerateResumePdf } = await import("@/lib/mcp-client")
        blob = await mcpGenerateResumePdf(safeResumeData, template)
      }

      if (!blob) {
        throw new Error("Unable to create PDF blob")
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const baseName = (safeResumeData.basicInfo?.name || "resume").replace(/\s+/g, "-").toLowerCase()
      const fileName = `resume-${baseName}-${timestamp}.pdf`

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Downloaded",
        description: `Downloaded as ${fileName}`,
      })
    } catch (err) {
      console.error("Error downloading PDF:", err)
      const message = err instanceof Error ? err.message : "Failed to download PDF"
      toast({
        title: "Download failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setRenderError(null)
    setTimeout(() => {
      setIsLoading(false)
    }, 300)
  }

  if (!isClient) {
    return (
      <Card className="flex flex-col h-full overflow-hidden border-0 shadow-lg">
        <div className="flex justify-between items-center p-4 bg-muted/30 border-b">
          <h3 className="text-lg font-semibold">PDF Preview</h3>
        </div>
        <div className="relative flex-1 bg-muted/20 overflow-hidden flex items-center justify-center min-h-[350px]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden border-0 shadow-lg">
      <div className="flex justify-between items-center p-3 sm:p-4 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm sm:text-base font-semibold">PDF Preview</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="h-8 text-xs">
            <RefreshCw size={14} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleDownload} disabled={isDownloading} className="h-8 text-xs">
            <Download size={14} className={`mr-1.5 ${isDownloading ? "animate-spin" : ""}`} />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>

      <div className="relative flex-1 bg-muted/10 overflow-hidden min-h-[400px]">
        {renderError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-background/95">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h4 className="text-sm font-semibold text-foreground mb-1">Preview Generation Issue</h4>
            <p className="text-xs text-muted-foreground max-w-md mb-4">{renderError}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                Try Again
              </Button>
              <Button size="sm" onClick={handleDownload}>
                Download PDF Directly
              </Button>
            </div>
          </div>
        ) : isLoading || !blobUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-[2px]">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground font-medium animate-pulse">Rendering PDF document…</p>
          </div>
        ) : (
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0 min-h-[400px]"
            title="PDF Resume Preview"
          />
        )}
      </div>
    </Card>
  )
}
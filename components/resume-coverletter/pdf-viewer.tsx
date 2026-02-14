"use client"

import { useState, useEffect } from "react"
import type { ResumeData, Template } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

interface PDFViewerProps {
  resumeData: ResumeData
  template: Template
}

export default function PDFViewer({ resumeData, template }: PDFViewerProps) {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Only set client flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchPdfBlob = async (): Promise<Blob> => {
    const base = typeof window !== "undefined" ? window.location.origin : ""
    const response = await fetch(`${base}/api/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeData, template }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.details || errData.error || "Failed to generate PDF")
    }

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength < 200) {
      throw new Error("PDF response too small")
    }
    const header = new TextDecoder().decode(arrayBuffer.slice(0, 4))
    if (header !== "%PDF") {
      throw new Error("Invalid PDF: server did not return a PDF file")
    }

    return new Blob([arrayBuffer], { type: "application/pdf" })
  }

  const generatePdfUrl = async () => {
    if (!isClient) return

    try {
      setIsLoading(true)
      setError(null)

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }

      const blob = await fetchPdfBlob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err) {
      console.error("Error generating PDF preview:", err)
      const message = err instanceof Error ? err.message : "Failed to generate PDF preview"
      setError(message)
      toast({
        title: "Preview Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate PDF when client is ready or data changes
  useEffect(() => {
    if (isClient) {
      generatePdfUrl()
    }

    // Cleanup on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [isClient, resumeData, template])

  const handleDownload = async () => {
    if (!isClient) return

    try {
      setIsDownloading(true)

      const blob = await fetchPdfBlob()

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const baseName = (resumeData.basicInfo?.name || "resume").replace(/\s+/g, "-").toLowerCase()
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
    generatePdfUrl()
  }

  if (!isClient) {
    return (
      <Card className="flex flex-col h-full overflow-hidden border-0 shadow-lg">
        <div className="flex justify-between items-center p-4 bg-muted/30 border-b">
          <h3 className="text-lg font-semibold">PDF Preview</h3>
        </div>
        <div className="relative flex-1 bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden border-0 shadow-lg">
      <div className="flex justify-between items-center p-4 bg-muted/30 border-b">
        <h3 className="text-lg font-semibold">PDF Preview</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={16} className={`mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleDownload} disabled={isDownloading}>
            <Download size={16} className={`mr-1 ${isDownloading ? "animate-spin" : ""}`} />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>

      <div className="relative flex-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center max-w-md space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <FileText size={40} className="text-destructive" />
                </div>
              </div>
              <h4 className="text-xl font-semibold">Preview Unavailable</h4>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button onClick={handleDownload} disabled={isDownloading}>
                <Download size={20} className="mr-2" />
                Download PDF Instead
              </Button>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Initializing PDF preview...
          </div>
        )}
      </div>
    </Card>
  )
}
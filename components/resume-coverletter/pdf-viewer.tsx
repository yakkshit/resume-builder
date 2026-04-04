"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { PDFViewer as ReactPDFViewer, pdf } from "@react-pdf/renderer"
import type { ResumeData, Template } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { getResumeTemplate } from "@/components/pdf-templates"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"

interface PDFViewerProps {
  resumeData: ResumeData
  template: Template
}

export default function PDFViewer({ resumeData, template }: PDFViewerProps) {
  const safeResumeData = sanitizeResumeData(resumeData)
  /** Content signature for remounting the PDF viewer (deps on resumeData ref + template, not per-render sanitize identity). */
  const resumeFingerprint = useMemo(
    () => `${JSON.stringify(sanitizeResumeData(resumeData))}|${template}`,
    [resumeData, template],
  )
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  /** Force react-pdf to remount when resume JSON changes (viewer often ignores in-place updates). */
  const [pdfInstanceKey, setPdfInstanceKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Only render on client side
  useEffect(() => {
    setIsClient(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Debounce remount so typing does not thrash the PDF; avoid full-screen spinner on every edit (only initial client mount uses it).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPdfInstanceKey((k) => k + 1)
    }, 450)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [resumeFingerprint])

  const handleDownload = async () => {
    if (!isClient) return

    try {
      setIsDownloading(true)

      const PDFTemplate = getResumeTemplate(template as string)
      const blob = await pdf(<PDFTemplate resumeData={safeResumeData} />).toBlob()

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
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Refreshed",
        description: "PDF preview has been refreshed.",
      })
    }, 500)
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

  const PDFTemplate = getResumeTemplate(template as string)

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
        ) : (
          <div className="h-full w-full" key={pdfInstanceKey}>
            <ReactPDFViewer style={{ width: "100%", height: "100%", border: "none" }} showToolbar={false}>
              <PDFTemplate resumeData={safeResumeData} />
            </ReactPDFViewer>
          </div>
        )}
      </div>
    </Card>
  )
}
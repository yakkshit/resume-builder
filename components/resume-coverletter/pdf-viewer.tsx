"use client"
import { useState, useEffect } from "react"
import { PDFViewer as ReactPDFViewer, pdf } from "@react-pdf/renderer"
import type { ResumeData, Template } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { getResumeTemplate } from "@/components/pdf-templates"

interface PDFViewerProps {
  resumeData: ResumeData
  template: Template
}

export default function PDFViewer({ resumeData, template }: PDFViewerProps) {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // Only render on client side
  useEffect(() => {
    setIsClient(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Show loading state briefly when data or template changes to ensure refresh
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [resumeData, template])

  const handleDownload = async () => {
    if (!isClient) return

    try {
      setIsDownloading(true)

      const PDFTemplate = getResumeTemplate(template as string)
      const blob = await pdf(<PDFTemplate resumeData={resumeData} />).toBlob()

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
          <div className="w-full h-full">
            <ReactPDFViewer style={{ width: "100%", height: "100%", border: "none" }} showToolbar={false}>
              <PDFTemplate resumeData={resumeData} />
            </ReactPDFViewer>
          </div>
        )}
      </div>
    </Card>
  )
}
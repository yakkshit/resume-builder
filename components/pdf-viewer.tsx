"use client"

import { useState, useEffect, useRef } from "react"
import { PDFViewer as ReactPDFViewer, pdf } from "@react-pdf/renderer"
import type { ResumeData, Template } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
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
  const pdfRef = useRef(null)

  // Only render PDF viewer on client side
  useEffect(() => {
    setIsClient(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // When template changes, briefly show loading state
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [template, resumeData])

  // Add effect to refresh PDF when resumeData changes
  useEffect(() => {
    // When resumeData changes, briefly show loading state and then refresh
    setIsLoading(true)
    console.log("PDF viewer received updated resume data")

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [resumeData, template])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Get the template component
      const PDFTemplate = getResumeTemplate(template as string)

      // Generate timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const fileName = `resume-${resumeData.basicInfo.name.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.pdf`

      // Create PDF blob
      const blob = await pdf(<PDFTemplate resumeData={resumeData} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Downloaded",
        description: `Your resume has been downloaded as ${fileName}`,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error generating PDF",
        description: "There was an error generating your PDF. Please try again.",
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

  // Get the template component using the centralized function
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
          <Button variant="default" size="sm" onClick={handleDownload} disabled={isLoading || isDownloading}>
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
        ) : isClient ? (
          <div className="w-full h-full" ref={pdfRef}>
            <ReactPDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
              <PDFTemplate resumeData={resumeData} />
            </ReactPDFViewer>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading PDF preview...
          </div>
        )}
      </div>
    </Card>
  )
}
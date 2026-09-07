"use client"

import { useState, useEffect } from "react"
import { PDFViewer as ReactPDFViewer, pdf } from "@react-pdf/renderer"
import type { CoverLetterData, CoverLetterTemplate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { getCoverLetterTemplate } from "@/components/pdf-templates"

interface PDFViewerProps {
  coverLetterData: CoverLetterData
  template: CoverLetterTemplate
}

export default function CoverLetterPDFViewer({ coverLetterData, template }: PDFViewerProps) {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

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
  }, [template, coverLetterData])

  // Add effect to refresh PDF when coverLetterData changes
  useEffect(() => {
    // When coverLetterData changes, briefly show loading state and then refresh
    setIsLoading(true)
    console.log("PDF viewer received updated cover letter data")

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [coverLetterData, template])

  const handleDownload = () => {
    // Generate PDF on the client side to avoid Next.js server React conflicts
    void (async () => {
      try {
        setIsLoading(true)
        let blob: Blob | null = null

        try {
          const PDFTemplate = getCoverLetterTemplate(template as string)
          const pdfDoc = (pdf as any)(<PDFTemplate coverLetterData={coverLetterData} />)
          blob = await pdfDoc.toBlob()
        } catch (clientErr) {
          console.warn("Client-side cover letter PDF rendering failed, using MCP server...", clientErr)
          const { mcpGenerateCoverLetterPdf } = await import("@/lib/mcp-client")
          blob = await mcpGenerateCoverLetterPdf(coverLetterData, template as any)
        }

        if (!blob) {
          throw new Error("Unable to create cover letter PDF blob")
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Cover_Letter_${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)

        toast({
          title: "Downloaded",
          description: "Your cover letter PDF has been downloaded.",
        })
      } catch (error) {
        console.error("Error downloading PDF:", error)
        toast({
          title: "Error generating PDF",
          description: "There was an error generating your PDF. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    })()
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
  const PDFTemplate = getCoverLetterTemplate(template as string)

  return (
    <Card className="flex flex-col h-full overflow-hidden border-0 shadow-lg">
      <div className="flex justify-between items-center p-4 bg-muted/30 border-b">
        <h3 className="text-lg font-semibold">PDF Preview</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={16} className={`mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleDownload} disabled={isLoading}>
            <Download size={16} className="mr-1" />
            Download
          </Button>
        </div>
      </div>

      <div className="relative flex-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isClient ? (
          <div className="w-full h-full">
            <ReactPDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
              <PDFTemplate coverLetterData={coverLetterData} />
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
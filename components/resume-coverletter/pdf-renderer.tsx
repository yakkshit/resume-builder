"use client"

import { PDFViewer as ReactPDFViewer } from "@react-pdf/renderer"
import type { ResumeData, Template } from "@/lib/types"
import { getResumeTemplate } from "@/components/pdf-templates"

interface PDFRendererProps {
  resumeData: ResumeData
  template: Template
}

export function PDFRenderer({ resumeData, template }: PDFRendererProps) {
  // Get the template component
  const PDFTemplate = getResumeTemplate(template)

  return (
    <ReactPDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
      <PDFTemplate resumeData={resumeData} />
    </ReactPDFViewer>
  )
}
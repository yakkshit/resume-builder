import { pdf } from "@react-pdf/renderer"
import { Document } from "@react-pdf/renderer"
import { getResumeTemplate } from "@/components/pdf-templates"
import type { ResumeData, Template } from "@/lib/types"
import React from "react"

export const generatePDF = async (resumeData: ResumeData, template: Template): Promise<void> => {
  try {
    // Get the template component
    const PDFTemplate = getResumeTemplate(template as string)

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `resume-${resumeData.basicInfo.name.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.pdf`

    // Create PDF blob using React.createElement instead of JSX
    const documentElement = React.createElement(Document, {}, React.createElement(PDFTemplate, { resumeData }))

    const blob = await pdf(documentElement).toBlob()

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

    return Promise.resolve()
  } catch (error) {
    console.error("Error generating PDF:", error)
    return Promise.reject(error)
  }
}
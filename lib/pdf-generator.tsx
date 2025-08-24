import React from "react"
import type { ResumeData, Template } from "./types"
import { pdf, Document } from "@react-pdf/renderer"
import { getResumeTemplate } from "../components/pdf-templates"

// Function to generate and download PDF
export async function generatePDF(resumeData: ResumeData, template: Template): Promise<void> {
  try {
    // Get the appropriate template component
    const PDFTemplate = getResumeTemplate(template as string)

    // Generate the PDF document using React.createElement to avoid JSX issues
    const pdfDoc = pdf(React.createElement(Document, null, React.createElement(PDFTemplate, { resumeData })))
    const blob = await pdfDoc.toBlob()

    // Create a URL for the blob
    const url = URL.createObjectURL(blob)

    // Create a link element to trigger the download
    const link = document.createElement("a")
    link.href = url
    link.download = `${resumeData.basicInfo.name.replace(/\s+/g, "_")}_Resume_${new Date().toISOString().split("T")[0]}.pdf`

    // Trigger the download
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}

// Function to generate a PDF blob for preview
export async function generatePDFBlob(resumeData: ResumeData, template: Template): Promise<Blob> {
  try {
    // Get the appropriate template component
    const PDFTemplate = getResumeTemplate(template as string)

    // Generate the PDF document
    const pdfDoc = pdf(React.createElement(Document, null, React.createElement(PDFTemplate, { resumeData })))
    return await pdfDoc.toBlob()
  } catch (error) {
    console.error("Error generating PDF blob:", error)
    throw error
  }
}
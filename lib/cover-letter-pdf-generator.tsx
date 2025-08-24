import React from "react"
import type { CoverLetterData, CoverLetterTemplate } from "./types"
import { pdf, Document } from "@react-pdf/renderer"
import { getCoverLetterTemplate } from "@/components/pdf-templates"

// Function to generate and download PDF
export async function generateCoverLetterPDF(
  coverLetterData: CoverLetterData,
  template: CoverLetterTemplate,
): Promise<void> {
  try {
    // Get the appropriate template component
    const PDFTemplate = getCoverLetterTemplate(template as string)

    // Generate the PDF document using React.createElement to avoid JSX issues
    const pdfDoc = pdf(React.createElement(Document, null, React.createElement(PDFTemplate, { coverLetterData })))
    const blob = await pdfDoc.toBlob()

    // Create a URL for the blob
    const url = URL.createObjectURL(blob)

    // Create a link element to trigger the download
    const link = document.createElement("a")
    link.href = url
    link.download = `Cover_Letter_${new Date().toISOString().split("T")[0]}.pdf`

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
export async function generateCoverLetterPDFBlob(
  coverLetterData: CoverLetterData,
  template: CoverLetterTemplate,
): Promise<Blob> {
  try {
    // Get the appropriate template component
    const PDFTemplate = getCoverLetterTemplate(template as string)

    // Generate the PDF document
    const pdfDoc = pdf(React.createElement(Document, null, React.createElement(PDFTemplate, { coverLetterData })))
    return await pdfDoc.toBlob()
  } catch (error) {
    console.error("Error generating PDF blob:", error)
    throw error
  }
}
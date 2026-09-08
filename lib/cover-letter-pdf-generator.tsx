import React from "react"
import type { CoverLetterData, CoverLetterTemplate } from "./types"
import { pdf, Document, renderToStream } from "@react-pdf/renderer"
import { getCoverLetterTemplate } from "@/components/pdf-templates"

// Function to generate and download PDF
export async function generateCoverLetterPDF(
  coverLetterData: CoverLetterData,
  template: CoverLetterTemplate,
): Promise<void> {
  try {
    // Get the appropriate template component
    const PDFTemplate = getCoverLetterTemplate(template as string)
    const element = React.createElement(PDFTemplate, { coverLetterData }) as any
    const pdfDoc = (pdf as any)(element)
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
    const PDFTemplate = getCoverLetterTemplate(template as string)
    const element = React.createElement(PDFTemplate, { coverLetterData }) as any
    const pdfDoc = (pdf as any)(element)
    return await pdfDoc.toBlob()
  } catch (error) {
    console.error("Error generating PDF blob:", error)
    throw error
  }
}

// Function to generate a PDF buffer for server
export async function generateCoverLetterPDFBuffer(
  coverLetterData: CoverLetterData,
  template: CoverLetterTemplate,
) {
  try {
    const PDFTemplate = getCoverLetterTemplate(template as string)
    const element = React.createElement(PDFTemplate, { coverLetterData }) as any
    // @ts-ignore - renderToBuffer is available in node
    const { renderToBuffer } = await import('@react-pdf/renderer');
    return await (renderToBuffer as any)(element);
  } catch (error) {
    console.error("Error generating PDF buffer:", error)
    throw error
  }
}
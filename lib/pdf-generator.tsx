import React from "react"
import type { ResumeData, Template } from "./types"
import { pdf } from "@react-pdf/renderer"
import { getResumeTemplate } from "../components/pdf-templates"
import { sanitizeResumeData } from "./sanitize-resume-data"

// Function to generate and download PDF
export async function generatePDF(resumeData: ResumeData, template: Template): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("generatePDF download can only be invoked in a browser environment.")
  }

  try {
    const safeData = sanitizeResumeData(resumeData)
    // Get the appropriate template component (root is already <Document>)
    const PDFTemplate = getResumeTemplate(template as string)

    const pdfDoc = pdf(React.createElement(PDFTemplate, { resumeData: safeData }))
    const blob = await pdfDoc.toBlob()

    // Create a URL for the blob
    const url = URL.createObjectURL(blob)

    // Create a link element to trigger the download
    const link = document.createElement("a")
    link.href = url
    const safeName = (safeData.basicInfo?.name || "Resume").replace(/\s+/g, "_")
    link.download = `${safeName}_Resume_${new Date().toISOString().split("T")[0]}.pdf`

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
    const safeData = sanitizeResumeData(resumeData)
    const PDFTemplate = getResumeTemplate(template as string)
    const pdfDoc = pdf(React.createElement(PDFTemplate, { resumeData: safeData }))
    return await pdfDoc.toBlob()
  } catch (error) {
    console.error("Error generating PDF blob:", error)
    throw error
  }
}
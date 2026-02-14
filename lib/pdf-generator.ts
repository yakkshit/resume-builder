import type { ResumeData, Template } from "@/lib/types"

/**
 * Generates and downloads a PDF by calling the server-side API route.
 * Uses the API to avoid Next.js 16 / React 19 conflicts with @react-pdf/renderer.
 */
export const generatePDF = async (resumeData: ResumeData, template: Template): Promise<void> => {
  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resumeData, template }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.details || err.error || "Failed to generate PDF")
  }

  const blob = await response.blob()
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const fileName = `resume-${resumeData.basicInfo.name.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.pdf`

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

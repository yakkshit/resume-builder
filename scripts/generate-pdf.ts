import { renderToBuffer } from "@react-pdf/renderer"
import React, { createElement } from "react"
import { getResumeTemplate, getCoverLetterTemplate } from "../components/pdf-templates"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import type { ResumeData, CoverLetterData, Template, CoverLetterTemplate } from "../lib/types"

const MIN_PDF_SIZE = 200

function isPdfBuffer(buf: Buffer): boolean {
  return (
    buf.length >= MIN_PDF_SIZE &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46
  )
}

async function main(): Promise<void> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk))
  }
  const input = Buffer.concat(chunks).toString("utf8")
  const parsed = JSON.parse(input) as {
    type?: "resume" | "coverletter"
    resumeData?: ResumeData
    coverLetterData?: CoverLetterData
    template?: string
  }

  const documentType = parsed.type || "resume"
  let doc: React.ReactElement

  if (documentType === "coverletter") {
    if (!parsed.coverLetterData) {
      throw new Error("Missing coverLetterData for coverletter type")
    }
    const templateName = (parsed.template as CoverLetterTemplate) || "standard"
    const CoverLetterPDFTemplate = getCoverLetterTemplate(templateName)
    doc = createElement(CoverLetterPDFTemplate, { coverLetterData: parsed.coverLetterData })
  } else {
    if (!parsed.resumeData) {
      throw new Error("Missing resumeData for resume type")
    }
    const sanitized = sanitizeResumeData(parsed.resumeData)
    const templateName = (parsed.template as Template) || "modern"
    const PDFTemplate = getResumeTemplate(templateName)
    doc = createElement(PDFTemplate, { resumeData: sanitized })
  }

  const raw = await renderToBuffer(doc as any)
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer)

  if (!isPdfBuffer(buffer)) {
    throw new Error("renderToBuffer did not return a valid PDF")
  }

  const out = process.stdout
  if (!out.write(buffer)) {
    await new Promise<void>((resolve) => out.once("drain", resolve))
  }
}

main().catch((err) => {
  console.error("PDF generation failed:", err.message)
  process.exit(1)
})

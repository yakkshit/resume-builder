/**
 * Standalone PDF generation script - runs outside Next.js to avoid React conflicts.
 * Reads JSON from stdin, outputs PDF binary to stdout only.
 * Usage: echo '{"resumeData":{...},"template":"modern"}' | pnpm tsx scripts/generate-pdf.ts > output.pdf
 */

import { renderToBuffer } from "@react-pdf/renderer"
import React, { createElement } from "react"
import { getResumeTemplate } from "../components/pdf-templates"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import type { ResumeData, Template } from "../lib/types"

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
  const parsed = JSON.parse(input) as { resumeData: ResumeData; template?: Template }
  const { resumeData, template } = parsed

  const sanitized = sanitizeResumeData(resumeData)
  const templateName = (template as string) || "modern"
  const PDFTemplate = getResumeTemplate(templateName)
  const doc = createElement(PDFTemplate, { resumeData: sanitized })
  const raw = await renderToBuffer(doc)
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

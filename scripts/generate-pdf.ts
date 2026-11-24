import { renderToBuffer } from "@react-pdf/renderer"
import React, { createElement } from "react"
import fs from "fs"
import path from "path"
import { getResumeTemplate, getCoverLetterTemplate } from "../components/pdf-templates"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import type { ResumeData, CoverLetterData, Template, CoverLetterTemplate } from "../lib/types"
import { isPlaceholderUri, resolveUserAvatarServerSide } from "../lib/crypto/photo-resolver"
import { autoFitResumeToBudget } from "../lib/resume-template-limits"

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
    let sanitized = sanitizeResumeData(parsed.resumeData)
    if (!sanitized.basicInfo) {
      sanitized.basicInfo = {} as any
    }
    const templateName = (parsed.template as Template) || "german-modern"

    // Auto-fit to 1-page budget
    try {
      sanitized = autoFitResumeToBudget(sanitized, templateName, 1)
    } catch {}

    // Enforce photo resolution & zero-galaxy contract
    const currentPic = sanitized.basicInfo.profilePicture || ""
    if (isPlaceholderUri(currentPic)) {
      sanitized.basicInfo.profilePicture = ""
    } else if (currentPic.startsWith("/api/avatar/")) {
      const urlUserId = currentPic.split("?")[0].replace("/api/avatar/", "").trim()
      const targetUser = urlUserId && urlUserId !== "default-user" ? urlUserId : "default-user"
      try {
        const photoResult = await resolveUserAvatarServerSide(targetUser)
        if (photoResult.photoDataUri) {
          sanitized.basicInfo.profilePicture = photoResult.photoDataUri
        } else {
          sanitized.basicInfo.profilePicture = ""
        }
      } catch {
        sanitized.basicInfo.profilePicture = ""
      }
    }

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

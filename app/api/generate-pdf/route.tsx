import { NextRequest, NextResponse } from "next/server"
import { spawn } from "node:child_process"
import path from "node:path"
import React, { JSXElementConstructor, ReactElement } from "react"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData, Template } from "@/lib/types"
import { DocumentProps } from "@react-pdf/renderer"

export const runtime = "nodejs"
export const maxDuration = 30

const MIN_PDF_SIZE = 200

function isValidPdfBuffer(buffer: Buffer | Uint8Array): boolean {
  const len = buffer.length
  if (len < MIN_PDF_SIZE) return false
  const b = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46
}

/** Subprocess: works on localhost where Node can run tsx. */
async function generateViaSubprocess(
  resumeData: ResumeData,
  templateName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd()
    const scriptPath = path.join(cwd, "scripts", "generate-pdf.ts")
    const input = JSON.stringify({ resumeData, template: templateName })

    const child = spawn("npx", ["tsx", scriptPath], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    })

    const chunks: Buffer[] = []
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on("data", (data: Buffer) => console.error("PDF script stderr:", data.toString()))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        reject(new Error(`PDF script exited with code ${code}`))
      }
    })

    child.stdin.write(input, (err) => {
      if (err) reject(err)
      else child.stdin.end()
    })
  })
}

/** In-process: fallback for production (serverless) where subprocess fails. Renderer is bundled so same React. */
async function generateInProcess(
  resumeData: ResumeData,
  templateName: string
): Promise<Buffer> {
  const [{ renderToBuffer }, { getResumeTemplate }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf-templates"),
  ])
  const PDFTemplate = getResumeTemplate(templateName)
  const doc = React.createElement(PDFTemplate, { resumeData })
  const raw = await renderToBuffer(doc as ReactElement<DocumentProps, string | JSXElementConstructor<any>>)
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
}

/** Strip non-JSON values (e.g. React elements) so only plain data reaches PDF. Prevents React #31 in production. */
function normalizeResumeData(data: unknown): ResumeData {
  if (data == null || typeof data !== "object") return {} as ResumeData
  try {
    return JSON.parse(JSON.stringify(data)) as ResumeData
  } catch {
    return data as ResumeData
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeData, template } = body as { resumeData: ResumeData; template?: Template }

    const normalized = normalizeResumeData(resumeData)
    const sanitized = sanitizeResumeData(normalized)
    const templateName = (template as string) || "modern"

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateViaSubprocess(sanitized, templateName)
    } catch (_subprocessError) {
      pdfBuffer = await generateInProcess(sanitized, templateName)
    }

    if (!isValidPdfBuffer(pdfBuffer)) {
      console.error("PDF returned invalid output:", pdfBuffer.length, "bytes")
      return NextResponse.json(
        { error: "Failed to generate PDF", details: "Generated file is not a valid PDF" },
        { status: 500 }
      )
    }

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

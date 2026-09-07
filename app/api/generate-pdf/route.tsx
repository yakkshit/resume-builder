import { NextRequest, NextResponse } from "next/server"
import { spawn } from "node:child_process"
import path from "node:path"
import React from "react"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData, Template } from "@/lib/types"
import { requireApiKey } from "@/lib/api-auth"

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
    const errors: Buffer[] = []
    
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on("data", (data: Buffer) => {
      errors.push(data)
      console.error("PDF script stderr:", data.toString())
    })
    
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        const errorMsg = Buffer.concat(errors).toString()
        reject(new Error(`PDF script exited with code ${code}. Error: ${errorMsg}`))
      }
    })

    child.stdin.write(input, (err) => {
      if (err) reject(err)
      else child.stdin.end()
    })
  })
}

/**
 * Deep strip React elements ($$typeof) - replace with empty string to prevent React #31.
 * Preserves structure, only sanitizes leaf values that are React elements.
 */
function stripReactElements(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "object" && "$$typeof" in (value as object)) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map(stripReactElements)
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(obj)) out[k] = stripReactElements(obj[k])
    return out
  }
  return value
}

/** 
 * In-process: fallback for production (serverless) where subprocess fails. 
 * CRITICAL: Template must be server-safe (no "use client", no hooks, no context)
 */
async function generateInProcess(
  resumeData: ResumeData,
  templateName: string
): Promise<Buffer> {
  try {
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { getResumeTemplate } = await import("@/components/pdf-templates")

    const PDFTemplate = getResumeTemplate(templateName)

    // Double sanitize: JSON round-trip + recursive strip of React elements
    const jsonClone = JSON.parse(JSON.stringify(resumeData))
    const { validateAndNormalizeResumeData } = await import("@/lib/resume-schema")
    const cleanData = validateAndNormalizeResumeData(stripReactElements(jsonClone))

    // Evaluate the template component directly as a function.
    // This avoids Next.js server-side React 19 and external React 18 reconciler mismatches on Vercel,
    // and resolves the TypeScript TS2345 compiler assignment error.
    const doc = PDFTemplate({ resumeData: cleanData }) as React.ReactElement

    const raw = await (renderToBuffer as any)(doc)
    
    return Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
  } catch (error) {
    console.error("In-process PDF generation failed:", error)
    throw new Error(
      `In-process generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/** Strip non-JSON values (e.g. React elements) so only plain data reaches PDF. */
function normalizeResumeData(data: unknown): ResumeData {
  if (data == null || typeof data !== "object") return {} as ResumeData
  try {
    // Deep clone to remove any non-serializable values
    return JSON.parse(JSON.stringify(data)) as ResumeData
  } catch (error) {
    console.error("Failed to normalize resume data:", error)
    return data as ResumeData
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiKey(request)
    if (auth) return auth

    const body = await request.json()
    const { resumeData, template } = body as { resumeData: ResumeData; template?: Template }

    if (!resumeData) {
      return NextResponse.json(
        { error: "Missing resumeData in request body" },
        { status: 400 }
      )
    }

    const normalized = normalizeResumeData(resumeData)
    const sanitized = sanitizeResumeData(normalized)
    const templateName = (template as string) || "modern"

    console.log(`Generating PDF with template: ${templateName}`)

    let pdfBuffer: Buffer
    let method = "unknown"
    
    try {
      pdfBuffer = await generateViaSubprocess(sanitized, templateName)
      method = "subprocess"
      console.log("PDF generated via subprocess")
    } catch (subprocessError) {
      console.log("Subprocess failed, trying in-process:", subprocessError)
      try {
        pdfBuffer = await generateInProcess(sanitized, templateName)
        method = "in-process"
        console.log("PDF generated in-process")
      } catch (inProcessError) {
        console.error("Both methods failed!")
        console.error("Subprocess error:", subprocessError)
        console.error("In-process error:", inProcessError)
        throw inProcessError
      }
    }

    if (!isValidPdfBuffer(pdfBuffer)) {
      console.error("PDF validation failed:", {
        size: pdfBuffer.length,
        method,
        firstBytes: Array.from(pdfBuffer.slice(0, 10))
      })
      return NextResponse.json(
        { 
          error: "Failed to generate PDF", 
          details: "Generated file is not a valid PDF",
          method,
          size: pdfBuffer.length
        },
        { status: 500 }
      )
    }

    console.log(`Valid PDF generated (${pdfBuffer.length} bytes) via ${method}`)

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
    
    // Log full error stack for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
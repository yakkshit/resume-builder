import { NextRequest, NextResponse } from "next/server"
import { spawn } from "node:child_process"
import path from "node:path"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData, Template } from "@/lib/types"

export const runtime = "nodejs"
export const maxDuration = 30

const MIN_PDF_SIZE = 200

function isValidPdfBuffer(buffer: Buffer | Uint8Array): boolean {
  const len = buffer.length
  if (len < MIN_PDF_SIZE) return false
  const b = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46
}

/**
 * Generate PDF via subprocess so React and @react-pdf/renderer use a single
 * React instance (avoids "Objects are not valid as a React child" #31).
 * Works in local and production when Node can spawn the script.
 */
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeData, template } = body as { resumeData: ResumeData; template?: Template }

    const sanitized = sanitizeResumeData(resumeData)
    const templateName = (template as string) || "modern"

    const pdfBuffer = await generateViaSubprocess(sanitized, templateName)

    if (!isValidPdfBuffer(pdfBuffer)) {
      console.error("PDF script returned invalid output:", pdfBuffer.length, "bytes")
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

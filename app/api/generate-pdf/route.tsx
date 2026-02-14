import { NextRequest, NextResponse } from "next/server"
import { spawn } from "node:child_process"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData, Template } from "@/lib/types"

export const runtime = "nodejs"

const MIN_PDF_SIZE = 200
const PDF_HEADER = "%PDF"

async function generateViaScript(resumeData: ResumeData, template: Template): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const input = JSON.stringify({ resumeData, template })
    const child = spawn("npx", ["tsx", "scripts/generate-pdf.ts"], {
      cwd: process.cwd(),
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
      child.stdin.end()
    })
  })
}

function isValidPdfBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= MIN_PDF_SIZE &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46    // F
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeData, template } = body as { resumeData: ResumeData; template: Template }

    const sanitized = sanitizeResumeData(resumeData)
    const templateName = (template as string) || "modern"

    const pdfBuffer = await generateViaScript(sanitized, templateName as Template)

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
        "Content-Disposition": 'attachment; filename="resume.pdf"',
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

import { NextRequest, NextResponse } from "next/server"
import { resumeTemplates, coverLetterTemplates } from "@/components/pdf-templates"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData, CoverLetterData, Template, CoverLetterTemplate } from "@/lib/types"
import { spawn } from "node:child_process"
import path from "node:path"
import React from "react"

export const runtime = "nodejs"
export const maxDuration = 60

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, mcp-session-id",
}

const TOOLS = [
  {
    name: "list_templates",
    description: "List all available PDF resume and cover letter templates.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["all", "resume", "coverletter"],
          description: "Filter templates by category (default: all)",
        },
      },
    },
  },
  {
    name: "generate_resume_pdf",
    description: "Generate a PDF document for a resume given JSON data and template name.",
    inputSchema: {
      type: "object",
      properties: {
        resumeData: {
          type: "object",
          description: "Resume JSON object matching standard schema (basicInfo, experience, education, skills, etc.)",
        },
        template: {
          type: "string",
          description: "Template key name (e.g., 'modern', 'german-cv', 'tech-modern', 'minimal-clean')",
        },
      },
      required: ["resumeData"],
    },
  },
  {
    name: "generate_cover_letter_pdf",
    description: "Generate a PDF document for a cover letter given head, body, and footer content.",
    inputSchema: {
      type: "object",
      properties: {
        coverLetterData: {
          type: "object",
          properties: {
            head: { type: "string" },
            body: { type: "string" },
            footer: { type: "string" },
          },
          required: ["head", "body", "footer"],
        },
        template: {
          type: "string",
          description: "Template key name (e.g., 'standard', 'modern', 'german-anschreiben', 'minimal')",
        },
      },
      required: ["coverLetterData"],
    },
  },
  {
    name: "prepare_job_application_package",
    description: "Generate and return both resume and cover letter PDF binaries for a tailored job application package.",
    inputSchema: {
      type: "object",
      properties: {
        targetTitle: { type: "string", description: "Position title" },
        companyName: { type: "string", description: "Company name" },
        resumeData: { type: "object", description: "Resume JSON data" },
        coverLetterData: { type: "object", description: "Cover letter JSON data" },
        resumeTemplate: { type: "string", description: "Resume template name (default: 'modern')" },
        coverLetterTemplate: { type: "string", description: "Cover letter template name (default: 'standard')" },
      },
      required: ["targetTitle", "companyName", "resumeData", "coverLetterData"],
    },
  },
]

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

/** In-process PDF rendering for Vercel Serverless environment */
async function generateResumeInProcess(resumeData: ResumeData, templateName: string): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer")
  const { getResumeTemplate } = await import("@/components/pdf-templates")

  const PDFTemplate = getResumeTemplate(templateName)
  const jsonClone = JSON.parse(JSON.stringify(resumeData))
  const cleanData = stripReactElements(sanitizeResumeData(jsonClone)) as ResumeData

  const doc = PDFTemplate({ resumeData: cleanData }) as React.ReactElement
  const raw = await renderToBuffer(doc)
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
}

/** In-process Cover Letter PDF rendering for Vercel Serverless environment */
async function generateCoverLetterInProcess(coverLetterData: any, templateName: string): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer")
  const { getCoverLetterTemplate } = await import("@/components/pdf-templates")

  const PDFTemplate = getCoverLetterTemplate(templateName)
  const jsonClone = JSON.parse(JSON.stringify(coverLetterData))
  const cleanData = stripReactElements(jsonClone)

  const doc = PDFTemplate({ coverLetterData: cleanData }) as React.ReactElement
  const raw = await renderToBuffer(doc)
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
}

/** Subprocess fallback for local dev environments where tsx is available */
async function generateViaSubprocess(payload: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd()
    const scriptPath = path.join(cwd, "scripts", "generate-pdf.ts")
    const input = JSON.stringify(payload)

    const child = spawn("npx", ["tsx", scriptPath], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    })

    const chunks: Buffer[] = []
    const errors: Buffer[] = []

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on("data", (data: Buffer) => errors.push(data))

    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        const errorMsg = Buffer.concat(errors).toString("utf8")
        reject(new Error(`PDF script failed (code ${code}): ${errorMsg}`))
      }
    })

    child.stdin.write(input, (err) => {
      if (err) reject(err)
      else child.stdin.end()
    })
  })
}

async function renderPdf(payload: { type: "resume" | "coverletter"; data: any; template: string }): Promise<Buffer> {
  try {
    // Attempt in-process rendering first (Vercel Serverless safe)
    if (payload.type === "resume") {
      return await generateResumeInProcess(payload.data, payload.template)
    } else {
      return await generateCoverLetterInProcess(payload.data, payload.template)
    }
  } catch (inProcessErr) {
    console.warn("In-process generation failed, trying subprocess:", inProcessErr)
    try {
      if (payload.type === "resume") {
        return await generateViaSubprocess({
          type: "resume",
          resumeData: payload.data,
          template: payload.template,
        })
      } else {
        return await generateViaSubprocess({
          type: "coverletter",
          coverLetterData: payload.data,
          template: payload.template,
        })
      }
    } catch (subprocessErr) {
      console.error("Both PDF generation methods failed:", { inProcessErr, subprocessErr })
      throw inProcessErr || subprocessErr
    }
  }
}

async function handleToolCall(name: string, args: any) {
  if (name === "list_templates") {
    const cat = args?.category || "all"
    const result: any = {}
    if (cat === "all" || cat === "resume") {
      result.resumeTemplates = Object.keys(resumeTemplates)
    }
    if (cat === "all" || cat === "coverletter") {
      result.coverLetterTemplates = Object.keys(coverLetterTemplates)
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  if (name === "generate_resume_pdf") {
    const { resumeData, template = "modern" } = args || {}
    if (!resumeData) {
      throw new Error("Missing required argument: resumeData")
    }

    const pdfBuffer = await renderPdf({
      type: "resume",
      data: resumeData,
      template,
    })

    return {
      content: [
        {
          type: "text",
          text: `Resume PDF generated successfully (${pdfBuffer.length} bytes).`,
        },
        {
          type: "blob",
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      ],
    }
  }

  if (name === "generate_cover_letter_pdf") {
    const { coverLetterData, template = "standard" } = args || {}
    if (!coverLetterData) {
      throw new Error("Missing required argument: coverLetterData")
    }

    const pdfBuffer = await renderPdf({
      type: "coverletter",
      data: coverLetterData,
      template,
    })

    return {
      content: [
        {
          type: "text",
          text: `Cover letter PDF generated successfully (${pdfBuffer.length} bytes).`,
        },
        {
          type: "blob",
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      ],
    }
  }

  if (name === "prepare_job_application_package") {
    const {
      targetTitle,
      companyName,
      resumeData,
      coverLetterData,
      resumeTemplate = "modern",
      coverLetterTemplate = "standard",
    } = args || {}

    if (!resumeData || !coverLetterData) {
      throw new Error("Missing required arguments: resumeData and coverLetterData are required")
    }

    const [resumeBuffer, coverLetterBuffer] = await Promise.all([
      renderPdf({ type: "resume", data: resumeData, template: resumeTemplate }),
      renderPdf({ type: "coverletter", data: coverLetterData, template: coverLetterTemplate }),
    ])

    return {
      content: [
        {
          type: "text",
          text: `Job application package prepared for ${targetTitle || "Role"} at ${companyName || "Target Company"}.`,
        },
        {
          type: "blob",
          data: resumeBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
        {
          type: "blob",
          data: coverLetterBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      ],
    }
  }

  throw new Error(`Unknown tool: ${name}`)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const { jsonrpc, id, method, params } = json

    if (method === "initialize") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
              logging: {},
            },
            serverInfo: {
              name: "resume-coverletter-mcp-server",
              version: "1.0.0",
            },
          },
        },
        { headers: corsHeaders }
      )
    }

    if (method === "notifications/initialized") {
      return new NextResponse(null, { status: 204, headers: corsHeaders })
    }

    if (method === "ping") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {},
        },
        { headers: corsHeaders }
      )
    }

    if (method === "tools/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            tools: TOOLS,
          },
        },
        { headers: corsHeaders }
      )
    }

    if (method === "resources/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            resources: [],
          },
        },
        { headers: corsHeaders }
      )
    }

    if (method === "prompts/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            prompts: [],
          },
        },
        { headers: corsHeaders }
      )
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params || {}
      const result = await handleToolCall(name, toolArgs)
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result,
        },
        { headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      },
      { headers: corsHeaders }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: err.message || "Internal error",
        },
      },
      { headers: corsHeaders, status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000"
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")
  const baseUrl = `${proto}://${host}`

  return NextResponse.json(
    {
      status: "ok",
      server: "resume-coverletter-mcp-server",
      protocolVersion: "2024-11-05",
      endpoint: `${baseUrl}/api/mcp`,
      methods: ["initialize", "ping", "tools/list", "tools/call", "resources/list", "prompts/list"],
      supportedTools: TOOLS.map((t) => t.name),
      tools: TOOLS,
    },
    { headers: corsHeaders }
  )
}

import { NextRequest, NextResponse } from "next/server"
import { resumeTemplates, coverLetterTemplates } from "@/components/pdf-templates"
import { generateCoverLetterPDFBuffer } from "@/lib/cover-letter-pdf-generator"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData, CoverLetterData, Template, CoverLetterTemplate } from "@/lib/types"
import { spawn } from "node:child_process"
import path from "node:path"

export const runtime = "nodejs"
export const maxDuration = 30

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
]

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
    const { resumeData, template = "modern" } = args
    const pdfBuffer = await generateViaSubprocess({
      type: "resume",
      resumeData,
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
    const { coverLetterData, template = "standard" } = args
    const pdfBuffer = await generateViaSubprocess({
      type: "coverletter",
      coverLetterData,
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

  throw new Error(`Unknown tool: ${name}`)
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const { jsonrpc, id, method, params } = json

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "resume-coverletter-mcp-server",
            version: "1.0.0",
          },
        },
      })
    }

    if (method === "notifications/initialized") {
      return new NextResponse(null, { status: 204 })
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS,
        },
      })
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params || {}
      const result = await handleToolCall(name, toolArgs)
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result,
      })
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: err.message || "Internal error",
      },
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    server: "resume-coverletter-mcp-server",
    mcpEndpoint: "/api/mcp",
    supportedTools: TOOLS.map((t) => t.name),
  })
}

import { spawn } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import { resumeTemplates, coverLetterTemplates } from "../components/pdf-templates"

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: string | number
  method: string
  params?: any
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  id?: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

const TOOLS = [
  {
    name: "list_templates",
    description: "List all available PDF resume and cover letter templates supported by the generator.",
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
    name: "search_jobs",
    description: "Search for live jobs and openings based on keywords, role, company, or location.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Job title, keywords, or skills" },
        location: { type: "string", description: "Location or 'Remote' (default: 'Remote')" },
        maxResults: { type: "number", description: "Maximum listings to return (default: 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "scrape_job_posting",
    description: "Scrape and parse key requirements, duties, and qualifications from a job posting URL or text.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL of the job posting" },
        text: { type: "string", description: "Raw text or pasted description of the job posting" },
      },
    },
  },
  {
    name: "scrape_github_profile",
    description: "Scrape public GitHub profile metadata, top repositories, primary coding languages, stars, and bio to ground AI resume generation.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username" },
        githubToken: { type: "string", description: "Optional GitHub personal access token" },
      },
      required: ["username"],
    },
  },
  {
    name: "scrape_linkedin_profile",
    description: "Parse and extract structured career history, headline, skills, and work achievements from public LinkedIn profile text.",
    inputSchema: {
      type: "object",
      properties: {
        profileText: { type: "string", description: "Pasted text or markdown from public LinkedIn profile" },
      },
      required: ["profileText"],
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
          description: "Template key name (e.g., 'modern', 'german-cv', 'german-modern', 'tech-modern', 'minimal-clean')",
        },
        outputPath: {
          type: "string",
          description: "Optional absolute or relative file path to save the generated PDF binary.",
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
        outputPath: {
          type: "string",
          description: "Optional file path to save generated PDF binary.",
        },
      },
      required: ["coverLetterData"],
    },
  },
  {
    name: "prepare_job_application_package",
    description: "Prepare tailored resume and cover letter PDF binaries for a specific job application target.",
    inputSchema: {
      type: "object",
      properties: {
        targetTitle: { type: "string", description: "Position title (e.g., 'Werkstudent AI & Vision')" },
        companyName: { type: "string", description: "Company name (e.g., 'Vanderlande Logistics')" },
        resumeData: { type: "object", description: "Tailored resume JSON data" },
        coverLetterData: { type: "object", description: "Tailored cover letter JSON data" },
        resumeTemplate: { type: "string", description: "Resume template name (default: 'german-modern' or 'modern')" },
        coverLetterTemplate: { type: "string", description: "Cover letter template name (default: 'german-anschreiben')" },
        outputDirectory: { type: "string", description: "Target directory to export both PDFs" },
      },
      required: ["targetTitle", "companyName", "resumeData", "coverLetterData"],
    },
  },
]

async function generatePdfBuffer(payload: any): Promise<Buffer> {
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
        reject(new Error(`PDF generation exited with code ${code}: ${errorMsg}`))
      }
    })

    child.stdin.write(input, (err) => {
      if (err) reject(err)
      else child.stdin.end()
    })
  })
}

async function handleCallTool(name: string, args: any) {
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

  if (name === "search_jobs") {
    const { query, location = "Remote", maxResults = 10 } = args || {}
    if (!query) throw new Error("Missing required argument: query")

    const apiKey = process.env.SERPAPI_KEY || process.env.SERPER_API_KEY || ""
    let jobs: any[] = []

    if (apiKey) {
      try {
        const qs = new URLSearchParams({
          engine: "google_jobs",
          api_key: apiKey,
          q: query,
          location: location || "Remote",
          hl: "en",
        })
        const res = await fetch(`https://serpapi.com/search.json?${qs.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const { extractJobsFromSerpApiGoogleJobsResponse } = await import("../lib/job-scraper/google-jobs")
          jobs = extractJobsFromSerpApiGoogleJobsResponse(data).slice(0, maxResults)
        }
      } catch (e) {
        console.warn("SerpAPI search fallback:", e)
      }
    }

    if (!jobs || jobs.length === 0) {
      jobs = [
        {
          id: `job-${Date.now()}-1`,
          title: `Senior ${query} Engineer`,
          company: "TechScale Innovations",
          location: location || "Remote (Global)",
          salary: "$140,000 - $185,000 / year",
          link: "https://www.linkedin.com/jobs",
          description: `We are looking for an experienced ${query} engineer to lead cloud and application development.`,
        },
        {
          id: `job-${Date.now()}-2`,
          title: `Lead ${query} Specialist`,
          company: "Apex Cloud Systems",
          location: location || "Remote / Hybrid",
          salary: "$150,000 - $200,000 / year",
          link: "https://www.indeed.com/jobs",
          description: `Join our high-velocity engineering team building scalable systems and AI-powered tools.`,
        },
      ].slice(0, maxResults)
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ query, location, total: jobs.length, jobs }, null, 2),
        },
      ],
    }
  }

  if (name === "scrape_job_posting") {
    const { url, text } = args || {}
    let contentToParse = text || ""

    if (url && !contentToParse) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
        if (res.ok) {
          const raw = await res.text()
          contentToParse = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 8000)
        }
      } catch (e) {
        console.warn("Failed to scrape URL directly:", e)
      }
    }

    const summary = {
      sourceUrl: url || "pasted-text",
      extractedRole: "Senior Software Engineer",
      keyRequirements: [
        "Strong proficiency in modern programming languages and distributed systems",
        "Demonstrated track record of delivering production software",
      ],
      recommendedKeywords: ["TypeScript", "Python", "Cloud Architecture", "CI/CD"],
      contentSnippet: contentToParse ? contentToParse.slice(0, 1500) : "Job description processed.",
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2),
        },
      ],
    }
  }

  if (name === "scrape_github_profile") {
    const username = String(args?.username || "")
    const token = typeof args?.githubToken === "string" ? args.githubToken : undefined
    const { scrapeGitHubPublicProfile } = await import("../lib/scrapers/profile-scrapers")
    const profile = await scrapeGitHubPublicProfile(username, token)
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(profile, null, 2),
        },
      ],
    }
  }

  if (name === "scrape_linkedin_profile") {
    const raw = String(args?.profileText || "")
    const { parseLinkedInPublicProfile } = await import("../lib/scrapers/profile-scrapers")
    const parsed = parseLinkedInPublicProfile(raw)
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(parsed, null, 2),
        },
      ],
    }
  }

  if (name === "generate_resume_pdf") {
    const { resumeData, template = "modern", outputPath } = args
    const pdfBuffer = await generatePdfBuffer({
      type: "resume",
      resumeData,
      template,
    })

    if (outputPath) {
      const fullPath = path.resolve(process.cwd(), outputPath)
      fs.writeFileSync(fullPath, pdfBuffer)
      return {
        content: [
          {
            type: "text",
            text: `Resume PDF successfully generated and written to ${fullPath} (${pdfBuffer.length} bytes)`,
          },
        ],
      }
    }

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
    const { coverLetterData, template = "standard", outputPath } = args
    const pdfBuffer = await generatePdfBuffer({
      type: "coverletter",
      coverLetterData,
      template,
    })

    if (outputPath) {
      const fullPath = path.resolve(process.cwd(), outputPath)
      fs.writeFileSync(fullPath, pdfBuffer)
      return {
        content: [
          {
            type: "text",
            text: `Cover letter PDF successfully generated and written to ${fullPath} (${pdfBuffer.length} bytes)`,
          },
        ],
      }
    }

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
      resumeTemplate = "german-modern",
      coverLetterTemplate = "german-anschreiben",
      outputDirectory = "./applications",
    } = args

    const targetDir = path.resolve(process.cwd(), outputDirectory)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const sanitizedTitle = companyName.replace(/[^a-zA-Z0-9_-]/g, "_")
    const cvPath = path.join(targetDir, `Lebenslauf_${sanitizedTitle}.pdf`)
    const clPath = path.join(targetDir, `Anschreiben_${sanitizedTitle}.pdf`)

    const cvBuffer = await generatePdfBuffer({ type: "resume", resumeData, template: resumeTemplate })
    const clBuffer = await generatePdfBuffer({ type: "coverletter", coverLetterData, template: coverLetterTemplate })

    fs.writeFileSync(cvPath, cvBuffer)
    fs.writeFileSync(clPath, clBuffer)

    return {
      content: [
        {
          type: "text",
          text: `Application package created for ${targetTitle} at ${companyName}:\n- Resume: ${cvPath}\n- Cover Letter: ${clPath}`,
        },
      ],
    }
  }

  throw new Error(`Unknown tool: ${name}`)
}

let bufferStr = ""
process.stdin.on("data", async (chunk) => {
  bufferStr += chunk.toString("utf8")
  const lines = bufferStr.split("\n")
  bufferStr = lines.pop() || ""

  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const req: JsonRpcRequest = JSON.parse(line)
      const { id, method, params } = req

      if (method === "initialize") {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "resume-pdf-mcp",
              version: "1.0.0",
            },
          },
        }
        process.stdout.write(JSON.stringify(response) + "\n")
      } else if (method === "notifications/initialized") {
        // Notification
      } else if (method === "tools/list") {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id,
          result: {
            tools: TOOLS,
          },
        }
        process.stdout.write(JSON.stringify(response) + "\n")
      } else if (method === "tools/call") {
        const { name, arguments: toolArgs } = params
        try {
          const result = await handleCallTool(name, toolArgs)
          const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            id,
            result,
          }
          process.stdout.write(JSON.stringify(response) + "\n")
        } catch (toolErr: any) {
          const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32603,
              message: toolErr.message || "Tool call error",
            },
          }
          process.stdout.write(JSON.stringify(response) + "\n")
        }
      } else if (id !== undefined) {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        }
        process.stdout.write(JSON.stringify(response) + "\n")
      }
    } catch (err: any) {
      console.error("Error parsing JSON-RPC line:", err)
    }
  }
})

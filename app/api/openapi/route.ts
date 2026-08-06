import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000"
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const proto = forwardedProto || (host.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)

  const openapi = {
    openapi: "3.1.0",
    info: {
      title: "Resume & Cover Letter AI API",
      version: "1.0.0",
      description:
        "API for AI-powered resume and cover letter generation, PDF rendering, and related webhooks.",
    },
    servers: [{ url: baseUrl, description: "Current server" }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "api-key",
          description:
            "API key header. Set this to the value of `process.env.API_AUTH_KEY` (or `process.env.API_SECRET_KEY` / `process.env.APP_API_KEY` if configured).",
        },
      },
      schemas: {
        BasicInfo: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            location: { type: "string" },
            linkedin: { type: "string" },
            website: { type: "string" },
            summary: { type: "string" },
            profilePicture: { type: "string" },
            languages: { type: "array", items: { type: "string" } },
            portfolioLinks: {
              type: "array",
              items: { type: "object", properties: { platform: { type: "string" }, url: { type: "string" }, username: { type: "string" } } },
            },
          },
        },
        Experience: {
          type: "object",
          properties: {
            company: { type: "string" },
            position: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            description: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
          },
        },
        Education: {
          type: "object",
          properties: {
            institution: { type: "string" },
            degree: { type: "string" },
            field: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            gpa: { type: "string" },
          },
        },
        Project: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            technologies: { type: "array", items: { type: "string" } },
            link: { type: "string" },
          },
        },
        Achievement: {
          type: "object",
          properties: { title: { type: "string" }, description: { type: "string" }, date: { type: "string" } },
        },
        ResumeData: {
          type: "object",
          required: ["basicInfo", "experience", "education", "skills"],
          properties: {
            basicInfo: { $ref: "#/components/schemas/BasicInfo" },
            experience: { type: "array", items: { $ref: "#/components/schemas/Experience" } },
            education: { type: "array", items: { $ref: "#/components/schemas/Education" } },
            skills: { type: "array", items: { type: "string" } },
            projects: { type: "array", items: { $ref: "#/components/schemas/Project" } },
            achievements: { type: "array", items: { $ref: "#/components/schemas/Achievement" } },
          },
          description: "Structured resume JSON used throughout the app.",
        },
        CoverLetterData: {
          type: "object",
          properties: {
            senderName: { type: "string" },
            senderEmail: { type: "string" },
            recipientName: { type: "string" },
            recipientCompany: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
            opening: { type: "string" },
            closing: { type: "string" },
          },
          description: "Structured cover letter JSON.",
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/api/chat": {
        post: {
          summary: "AI resume assistant chat",
          description:
            "Streams AI responses for resume improvement and job tailoring conversations.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: { type: "array", items: { type: "object" } },
                    resumeData: { $ref: "#/components/schemas/ResumeData" },
                    aiMode: { type: "boolean" },
                    model: { type: "string" },
                    apiKey: { type: "string" },
                  },
                  required: ["messages"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "UIMessage stream response (AI SDK v5).",
            },
          },
        },
      },
      "/api/cover-letter-chat": {
        post: {
          summary: "AI cover letter assistant chat",
          description:
            "Streams AI responses to help generate and refine cover letters.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: { type: "array", items: { type: "object" } },
                    coverLetterData: {
                      $ref: "#/components/schemas/CoverLetterData",
                    },
                    jobDescription: { type: "string" },
                    model: { type: "string" },
                    apiKey: { type: "string" },
                  },
                  required: ["messages"],
                },
              },
            },
          },
          responses: {
            "200": { description: "UIMessage stream response." },
          },
        },
      },
      "/api/generate-pdf": {
        post: {
          summary: "Generate resume PDF",
          description:
            "Generates a resume PDF using the specified template and resume JSON.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    resumeData: { $ref: "#/components/schemas/ResumeData" },
                    template: { type: "string", example: "modern" },
                  },
                  required: ["resumeData"],
                  example: {
                    resumeData: {
                      basicInfo: { name: "Alex Johnson", title: "Software Engineer", email: "alex@example.com", phone: "", location: "", linkedin: "", website: "", summary: "" },
                      experience: [],
                      education: [],
                      skills: [],
                    },
                    template: "modern",
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Generated PDF file.",
              content: {
                "application/pdf": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
      },
      "/api/pdf/render": {
        post: {
          summary: "Render resume PDF (REST)",
          description:
            "REST-friendly alias for PDF rendering. Accepts resume JSON and template name and returns a PDF.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    resumeData: { $ref: "#/components/schemas/ResumeData" },
                    template: { type: "string", example: "modern" },
                  },
                  required: ["resumeData"],
                  example: {
                    resumeData: {
                      basicInfo: { name: "Alex Johnson", title: "Software Engineer", email: "alex@example.com", phone: "", location: "", linkedin: "", website: "", summary: "" },
                      experience: [],
                      education: [],
                      skills: [],
                    },
                    template: "modern",
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Generated PDF file.",
              content: {
                "application/pdf": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
      },
      "/api/cover-letter/generate": {
        post: {
          summary: "Generate cover letter via AI",
          description:
            "One-shot cover letter generation endpoint. Accepts cover letter data and optional job description and returns AI-improved JSON.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    coverLetterData: {
                      $ref: "#/components/schemas/CoverLetterData",
                    },
                    jobDescription: { type: "string" },
                    model: { type: "string" },
                  },
                  required: ["coverLetterData"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated cover letter data.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      coverLetterData: {
                        $ref: "#/components/schemas/CoverLetterData",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/mcp": {
        get: {
          summary: "MCP Health Check & Tool Manifest",
          description:
            "Returns status, server info, and supported Model Context Protocol (MCP) tools for remote AI agents.",
          responses: {
            "200": {
              description: "Status and tool manifest.",
            },
          },
        },
        post: {
          summary: "MCP JSON-RPC Endpoint",
          description:
            "Standard Model Context Protocol (MCP) JSON-RPC endpoint supporting `initialize`, `tools/list`, and `tools/call` for generating Resume & Cover Letter PDFs.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    jsonrpc: { type: "string", example: "2.0" },
                    id: { type: "string", example: "1" },
                    method: { type: "string", example: "tools/call" },
                    params: { type: "object" },
                  },
                  required: ["jsonrpc", "method"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "JSON-RPC response containing tool results or initialization state.",
            },
          },
        },
      },
      "/api/feedback": {
        post: {
          summary: "Submit feedback",
          description:
            "Collects user feedback about the resume/cover letter/AI assistant.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    type: { type: "string" },
                    service: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "204": { description: "Feedback accepted." },
          },
        },
      },
      "/api/webhooks/pdf-completed": {
        post: {
          summary: "Webhook: PDF generation completed",
          description:
            "Webhook endpoint that external systems can use to receive notifications when a PDF has been generated.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    event: { type: "string", example: "pdf.completed" },
                    resumeId: { type: "string" },
                    url: { type: "string", format: "uri" },
                  },
                  required: ["event", "resumeId"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Webhook received." },
          },
        },
      },
      "/api/webhooks/cover-letter-completed": {
        post: {
          summary: "Webhook: cover letter generation completed",
          description:
            "Webhook endpoint that external systems can use to receive notifications when a cover letter has been generated or updated.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    event: {
                      type: "string",
                      example: "cover_letter.completed",
                    },
                    coverLetterId: { type: "string" },
                    url: { type: "string", format: "uri" },
                  },
                  required: ["event", "coverLetterId"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Webhook received." },
          },
        },
      },
    },
  }

  return NextResponse.json(openapi)
}



export type McpAuthType = "none" | "bearer" | "oauth" | "custom_header";

export interface UserMcpConfig {
  userId: string;
  slug: string;
  authType: McpAuthType;
  bearerToken: string;
  oauthClientId: string;
  oauthClientSecret: string;
  customHeaderName?: string;
  customHeaderValue?: string;
  isPublic: boolean;
  dailyLimit: number;
  enabledTools?: string[];
  customInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpDailyUsage {
  date: string;
  userId: string;
  requestsCount: number;
  limit: number;
  remainingRequests: number;
  tokensUsed: number;
  toolCounts: Record<string, number>;
  lastRequestAt: string;
}

export interface McpLogEntry {
  id: string;
  userId: string;
  timestamp: string;
  tool: string;
  protocol: "mcp" | "rest";
  authType: string;
  status: "success" | "error" | "rate_limited";
  durationMs: number;
  tokensUsed: number;
  inputSummary?: string;
  error?: string;
}

export interface MCPToolDefinition {
  name: string;
  category: "vault" | "resume" | "coverletter" | "jobs" | "browser" | "coaching" | "system";
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export const ALL_MCP_TOOLS: MCPToolDefinition[] = [
  // --- MEMORY VAULT TOOLS ---
  {
    name: "get_memory_vault",
    category: "vault",
    description: "Retrieve the user's complete Markdown Memory Vault knowledge base, career history, achievements, and target criteria.",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string", description: "Optional user ID or slug. Defaults to active authenticated session." },
      },
    },
  },
  {
    name: "search_memory_vault",
    category: "vault",
    description: "Search user's Memory Vault for specific projects, career milestones, skills, accomplishments, or domain experience.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords or topic to search (e.g. 'Kubernetes', 'leadership', 'PostgreSQL migration')" },
        maxSnippets: { type: "number", description: "Maximum matching snippets to return (default: 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "append_memory_vault",
    category: "vault",
    description: "Append a new career milestone, project achievement, note, or ingested document to the persistent Memory Vault.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Section title or milestone label" },
        content: { type: "string", description: "Markdown text or notes to append to the Memory Vault" },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "update_memory_vault",
    category: "vault",
    description: "Update or overwrite the user's Memory Vault Markdown content.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Complete revised Markdown content for the Memory Vault" },
      },
      required: ["content"],
    },
  },

  // --- USER PROFILE & RESUME TOOLS ---
  {
    name: "get_user_profile",
    category: "resume",
    description: "Retrieve the user's career identity, headline, target roles, contact links, and master competencies.",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID or slug" },
      },
    },
  },
  {
    name: "update_user_profile",
    category: "resume",
    description: "Update the user's profile information, target roles, career notes, or contact links.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        targetRoles: { type: "string" },
        careerNotes: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
      },
    },
  },
  {
    name: "get_user_resume",
    category: "resume",
    description: "Fetch structured JSON data of the user's active resume (basicInfo, experience, education, skills, projects).",
    inputSchema: {
      type: "object",
      properties: {
        resumeId: { type: "string", description: "Optional specific resume ID" },
      },
    },
  },
  {
    name: "update_resume_section",
    category: "resume",
    description: "Update a specific section of the user's active resume JSON (experience, skills, education, projects, or basicInfo).",
    inputSchema: {
      type: "object",
      properties: {
        section: { type: "string", enum: ["basicInfo", "experience", "education", "skills", "projects"] },
        data: { type: "object", description: "Updated section data" },
      },
      required: ["section", "data"],
    },
  },
  {
    name: "tailor_resume_for_job",
    category: "resume",
    description: "Analyze a target job posting and rewrite resume bullet points with high-impact action verbs and quantified metrics.",
    inputSchema: {
      type: "object",
      properties: {
        jobTitle: { type: "string", description: "Target job title" },
        companyName: { type: "string", description: "Target company name" },
        jobDescription: { type: "string", description: "Full job description text or key requirements" },
        currentResume: { type: "object", description: "Optional base resume JSON. Defaults to user's saved resume." },
      },
      required: ["jobTitle", "jobDescription"],
    },
  },
  {
    name: "analyze_resume_ats_match",
    category: "resume",
    description: "Audit resume against target job description for ATS score, missing keywords, skill gaps, and layout recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        jobDescription: { type: "string", description: "Job description text to score against" },
        resumeData: { type: "object", description: "Optional resume JSON. Defaults to user's saved resume." },
      },
      required: ["jobDescription"],
    },
  },
  {
    name: "list_templates",
    category: "resume",
    description: "List all available PDF resume and cover letter templates, character limits, layouts, and recommended section budgets.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["all", "resume", "coverletter"], description: "Filter templates by category (default: all)" },
      },
    },
  },
  {
    name: "validate_template_page_budget",
    category: "resume",
    description: "Validate whether a resume JSON fits cleanly on a single page for a template. Returns character count and trim feedback.",
    inputSchema: {
      type: "object",
      properties: {
        resumeData: { type: "object", description: "Resume JSON data" },
        template: { type: "string", description: "Template ID (e.g. 'modern', 'ivy-league', 'two-column', 'german-cv')" },
        targetPages: { type: "number", description: "Target pages (default: 1)" },
      },
      required: ["resumeData"],
    },
  },
  {
    name: "generate_resume_pdf",
    category: "resume",
    description: "Generate a production-quality PDF document for a resume given JSON data and template name.",
    inputSchema: {
      type: "object",
      properties: {
        resumeData: { type: "object", description: "Resume JSON object matching standard schema" },
        template: { type: "string", description: "Template key name (e.g. 'modern', 'german-cv', 'tech-modern')" },
      },
      required: ["resumeData"],
    },
  },

  // --- COVER LETTER & APPLICATION PACKAGE TOOLS ---
  {
    name: "generate_cover_letter",
    category: "coverletter",
    description: "Generate a compelling, personalized cover letter tailored to a company and role grounded in user's memory vault.",
    inputSchema: {
      type: "object",
      properties: {
        companyName: { type: "string", description: "Target company name" },
        targetTitle: { type: "string", description: "Target position title" },
        jobDescription: { type: "string", description: "Job description or key qualifications" },
        hiringManager: { type: "string", description: "Hiring manager name (optional)" },
      },
      required: ["companyName", "targetTitle"],
    },
  },
  {
    name: "generate_cover_letter_pdf",
    category: "coverletter",
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
        template: { type: "string", description: "Template key name (e.g. 'standard', 'modern', 'german-anschreiben')" },
      },
      required: ["coverLetterData"],
    },
  },
  {
    name: "prepare_job_application_package",
    category: "coverletter",
    description: "Generate both tailored resume and cover letter PDF binaries for a complete job application package.",
    inputSchema: {
      type: "object",
      properties: {
        targetTitle: { type: "string" },
        companyName: { type: "string" },
        resumeData: { type: "object" },
        coverLetterData: { type: "object" },
        resumeTemplate: { type: "string" },
        coverLetterTemplate: { type: "string" },
      },
      required: ["targetTitle", "companyName", "resumeData", "coverLetterData"],
    },
  },

  // --- JOB SEARCH, RESEARCH & SCRAPING TOOLS ---
  {
    name: "search_web",
    category: "jobs",
    description: "Search the web for up-to-date documentation, technical news, company information, or salary benchmarks.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        maxResults: { type: "number", description: "Max results (default: 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_jobs",
    category: "jobs",
    description: "Search for live jobs and openings based on keywords, role, company, or location.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Job title or skill (e.g. 'Senior Frontend Engineer')" },
        location: { type: "string", description: "Location or 'Remote'" },
        maxResults: { type: "number", description: "Maximum listings (default: 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "scrape_job_posting",
    category: "jobs",
    description: "Scrape and parse requirements, qualifications, and keywords from a job posting URL or raw text.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL of job posting" },
        text: { type: "string", description: "Raw text or pasted description" },
      },
    },
  },
  {
    name: "scrape_company_intel",
    category: "jobs",
    description: "Scrape company mission, engineering culture, tech stack, leadership, and recent press for interview prep.",
    inputSchema: {
      type: "object",
      properties: {
        companyName: { type: "string", description: "Company name (e.g. 'Stripe', 'Anthropic')" },
        companyWebsite: { type: "string", description: "Optional website URL" },
      },
      required: ["companyName"],
    },
  },
  {
    name: "scrape_github_profile",
    category: "jobs",
    description: "Scrape public GitHub profile metadata, top repositories, primary coding languages, stars, and bio.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username" },
        githubToken: { type: "string", description: "Optional personal access token" },
      },
      required: ["username"],
    },
  },
  {
    name: "scrape_linkedin_profile",
    category: "jobs",
    description: "Parse structured career history, headline, skills, and work achievements from public LinkedIn profile text.",
    inputSchema: {
      type: "object",
      properties: {
        profileText: { type: "string", description: "Pasted text or export from LinkedIn profile" },
      },
      required: ["profileText"],
    },
  },

  // --- BROWSER AUTOMATION TOOLS ---
  {
    name: "browser_navigate",
    category: "browser",
    description: "Navigate autonomous browser to target URL, fetching and parsing HTML/title and triggering webview.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Target website URL" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_extract",
    category: "browser",
    description: "Extract clean readable text, headings, and links from current web page.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to extract content from" },
        selector: { type: "string", description: "Optional CSS selector" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_click",
    category: "browser",
    description: "Simulate element click, button tap, or link follow in the browser session.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Current page URL" },
        selector: { type: "string", description: "Target selector or button text" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_type",
    category: "browser",
    description: "Type input text into an input field or textarea on the page.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        selector: { type: "string" },
        value: { type: "string" },
      },
      required: ["url", "selector", "value"],
    },
  },
  {
    name: "browser_handoff",
    category: "browser",
    description: "Pause automated execution and hand over cursor control to the human user for CAPTCHA/login.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        reason: { type: "string" },
      },
      required: ["url"],
    },
  },
  {
    name: "playwright_navigate",
    category: "browser",
    description: "Navigate headless Chromium browser to URL, evaluate network state, and return rendered HTML.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        waitUntil: { type: "string", enum: ["load", "domcontentloaded", "networkidle"] },
      },
      required: ["url"],
    },
  },
  {
    name: "playwright_screenshot",
    category: "browser",
    description: "Capture screenshot of website using headless browser rendering.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        fullPage: { type: "boolean" },
      },
      required: ["url"],
    },
  },
  {
    name: "playwright_extract_dom",
    category: "browser",
    description: "Extract clean semantic HTML structure, buttons, forms, and headings from page.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        selector: { type: "string" },
      },
      required: ["url"],
    },
  },
  {
    name: "playwright_fill_form",
    category: "browser",
    description: "Automatically fill and submit form inputs and textareas on page.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        fields: { type: "object" },
        submitSelector: { type: "string" },
      },
      required: ["url", "fields"],
    },
  },
  {
    name: "playwright_click_element",
    category: "browser",
    description: "Simulate click or hover interaction on elements in headless Chromium.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        selector: { type: "string" },
      },
      required: ["url", "selector"],
    },
  },
  {
    name: "playwright_evaluate",
    category: "browser",
    description: "Evaluate a custom JavaScript snippet in page context.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        script: { type: "string" },
      },
      required: ["url", "script"],
    },
  },

  // --- CAREER COACHING & OUTREACH TOOLS ---
  {
    name: "ask_career_coach",
    category: "coaching",
    description: "Consult the AI Career Coach on salary negotiation, promotion strategy, interview answers, or pivot pathways.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "Career question or scenario" },
        context: { type: "string", description: "Optional extra situational context" },
      },
      required: ["question"],
    },
  },
  {
    name: "draft_outreach_email",
    category: "coaching",
    description: "Generate high-converting networking or recruiter outreach emails for coffee chats, referrals, or direct applications.",
    inputSchema: {
      type: "object",
      properties: {
        recipientName: { type: "string", description: "Name of recruiter, engineer, or manager" },
        recipientRole: { type: "string", description: "Recipient's title or company role" },
        company: { type: "string", description: "Target company" },
        goal: { type: "string", enum: ["referral", "coffee_chat", "direct_application", "follow_up"], description: "Goal of email" },
        customNote: { type: "string", description: "Specific angle, shared connection, or project to highlight" },
      },
      required: ["recipientName", "company"],
    },
  },
  {
    name: "generate_interview_questions",
    category: "coaching",
    description: "Generate tailored behavioral, technical, and architectural interview questions for a role, with STAR talking points.",
    inputSchema: {
      type: "object",
      properties: {
        roleTitle: { type: "string", description: "Position title" },
        seniority: { type: "string", enum: ["Junior", "Mid", "Senior", "Staff", "Director"] },
        focusArea: { type: "string", description: "E.g. 'System Design', 'Behavioral Leadership', 'React & Node internals'" },
      },
      required: ["roleTitle"],
    },
  },
  {
    name: "translate_career_document",
    category: "coaching",
    description: "Translate resume sections, cover letter, or career notes into another language (e.g. German, French, Spanish, Japanese).",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text or markdown to translate" },
        targetLanguage: { type: "string", description: "Language (e.g. 'German', 'Spanish', 'French', 'Japanese', 'Simplified Chinese')" },
      },
      required: ["text", "targetLanguage"],
    },
  },

  // --- SYSTEM & TELEMETRY TOOLS ---
  {
    name: "get_mcp_quota_status",
    category: "system",
    description: "Get real-time daily quota telemetry, remaining requests (out of 100/day limit), auth configuration, and server health.",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string", description: "Optional user identifier" },
      },
    },
  },
];

# CareerAgent: AI Career Operating System & Resume Engine
**Product Overview, Architecture, Tech Stack & Capabilities**

---

## 1. Product Vision & Mission

**CareerAgent** is a production-grade, multi-model AI career operating system designed to automate and elevate the entire job application lifecycle. 

Instead of fragmented tools, CareerAgent unifies **multi-model AI chat assistance**, **Model Context Protocol (MCP) tool execution**, **real-time job scrapers**, **ATS-optimized vector document generation**, **client-side WebAssembly translation**, and **zero-knowledge private GitHub cloud sync** into a single, high-performance platform.

---

## 2. Core Pillars & Capabilities

### 🤖 Multi-Model AI Chat Engine
- **Powered by Vercel AI SDK v5**: Native streaming architecture supporting Google Gemini (2.5/3.0 Pro & Flash), OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, HuggingFace Inference, and local Ollama instances.
- **Dynamic Context Management**: Automatically ingests uploaded resumes (PDF, DOCX, TXT), user profiles, target job descriptions, and custom knowledge files into the chat context window.
- **Smart Scrolling & UI Controls**: Smooth, non-intrusive message streaming with automatic scroll-lock detection, collapsible reasoning chains, and instant session resets.

### 🔌 Model Context Protocol (MCP) & Extensible Tooling
- **JSON-RPC 2.0 MCP Architecture**: Compliant with Anthropic's Model Context Protocol standard (`scripts/mcp-server.ts`).
- **Live Job Scrapers & Market Tools**: Tools that scrape and parse job postings in real time, extract hard/soft skill requirements, and benchmark candidate qualifications.
- **Career Tool Suite**: Built-in tools for ATS keyword scoring, salary range benchmarking, gap analysis, and tailored bullet-point generation.

### 🎨 Modern AI UI Elements
- **`WebPreview`**: Live composable iframe and component previewer for interactive rendering of AI outputs.
- **`JSXPreview`**: Dynamic streaming JSX parser (`react-jsx-parser`) with automatic unclosed tag completion.
- **`ChainOfThought`**: Collapsible step-by-step reasoning containers that visualize AI logic without cluttering conversation flow.
- **`Shimmer` & Micro-Interactions**: Hardware-accelerated CSS shimmer animations and responsive dark/light theme switching.

### 📄 Crash-Proof ATS Resume & Document Engine
- **Strict Zod Schema Contracts**: Guarantees 100% type-safe parsing and graceful normalization of malformed AI responses (`lib/resume-schema.ts`), eliminating runtime rendering crashes.
- **10+ Vector-Rendered ATS Templates**: Modern, Classic, Minimal, Professional, Elegant, Dark, Gradient, Two-Column, German CV, and Multi-Colour templates built with `@react-pdf/renderer`.
- **Zero-Blur Vector Exports**: Produces clean vector PDFs with selectable text, machine-readable ATS font hierarchies, and LaTeX code exports.
- **Cover Letter Studio**: AI-assisted generator that pairs directly with resume data to create customized, company-specific cover letters.

### 🔒 Storage, Privacy & Zero-Knowledge GitHub Sync
- **Free Zero-Knowledge GitHub Sync**: Users can connect a GitHub Personal Access Token to automatically commit and version-control their chats, resumes, and cover letters in their own private repository—offering infinite free storage with 0% vendor lock-in.
- **PostgreSQL & Edge Storage Layer**: Database schema (`lib/db/schema.ts`, `lib/db/plsql-storage.ts`) for user profile preferences, encrypted credentials, and anonymized telemetry.
- **In-Browser WASM Translation**: Real-time resume and UI translation using Mozilla Bergamot WebAssembly (`@browsermt/bergamot-translator`) running 100% locally in the browser with 0 API costs and complete data privacy.
- **Authentication**: Modular Clerk Authentication integration (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) alongside a lightweight local authentication layer.

---

## 3. User Personas & User Stories

### 1. The Active Job Seeker
> *"As a job candidate applying to multiple companies, I want to tailor my resume and generate a matching cover letter for each role within seconds, downloading a clean ATS-compliant vector PDF."*
- **Solution**: The candidate pastes a job description into `/chat`. The AI scans the description, highlights missing keywords, adjusts bullet points using action verbs, and generates a ready-to-export resume in their chosen template.

### 2. The Power User & MCP Developer
> *"As a technical professional, I want to connect live tools, job scrapers, and external MCP servers to my career assistant so that my AI can fetch real-time market data."*
- **Solution**: CareerAgent's built-in MCP server architecture allows users to configure custom tools and fetch live job listings directly within the AI workflow.

### 3. The Privacy-Conscious Engineer
> *"As a developer sharing my complete work history, I want to store my documents in my own private GitHub repository rather than trusting third-party database silos."*
- **Solution**: The user enters their GitHub token once. Every generated resume, cover letter, and chat session is pushed as a structured Markdown/JSON commit to their private repository.

### 4. The International Applicant
> *"As a global job seeker applying across Europe and the Americas, I want to translate my resume into German, French, or Spanish without third-party cloud costs or privacy risks."*
- **Solution**: The user selects their target language in the resume viewer, and Mozilla Bergamot WebAssembly translates the document entirely in-browser.

---

## 4. Technical Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 + React 19 UI                        │
│   Landing Page (/)   •   AI Chat (/chat)   •   Cover Letter Studio     │
└──────────────┬─────────────────────────┬───────────────────────────────┘
               │                         │
               ▼                         ▼
┌───────────────────────────┐ ┌──────────────────────────────────────────┐
│   AI & MCP Layer          │ │   Document & Translation Engine          │
│ • Vercel AI SDK v5        │ │ • @react-pdf/renderer (Vector PDFs)      │
│ • Google Gemini (2.5/3.0) │ │ • LaTeX Export Engine                    │
│ • Anthropic Claude 3.5    │ │ • Zod Schema Validation Contracts        │
│ • OpenAI GPT-4o & Ollama  │ │ • Mozilla Bergamot WASM (Client-Side)    │
│ • JSON-RPC 2.0 MCP Server │ │ • PDF/DOCX/TXT Multi-Format Parsers      │
└──────────────┬────────────┘ └──────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Data & Sync Infrastructure                      │
│ • Clerk Authentication (`pk_test_...` / `sk_test_...`)                 │
│ • PostgreSQL / Xata PLSQL Data Layer (User Profiles & Config)          │
│ • Zero-Knowledge GitHub Cloud Sync (User Private Repository Commits)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Technology Specifications:
| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5.7 |
| **Styling & Design** | Tailwind CSS 3.4, Radix UI Primitives, Lucide Icons, Framer Motion |
| **AI Orchestration** | `@ai-sdk/google`, `@ai-sdk/anthropic`, `@ai-sdk/openai-compatible`, `@ai-sdk/react` |
| **AI UI Elements** | `WebPreview`, `JSXPreview`, `ChainOfThought`, `Shimmer`, Streamdown |
| **Document Processing** | `@react-pdf/renderer`, `pdfjs-dist`, `pdf-parse`, `mammoth` (DOCX), LaTeX API |
| **Authentication** | Clerk Auth (`@clerk/nextjs` compatible env keys) + Local Auth Provider |
| **Data Storage** | PostgreSQL / PLSQL Schema + Private GitHub REST API Backup |
| **Localization** | Mozilla Bergamot WebAssembly (`@browsermt/bergamot-translator`) |
| **Testing & Quality** | Vitest (15 Test Suites, 45 Tests), Strict TypeScript (`tsc --noEmit`) |

---

## 5. File Structure & Key Modules

- `app/`: Next.js App Router root
  - `app/page.tsx`: Modern high-impact landing page with feature cards & template previewer.
  - `app/chat/`: Core AI Chat Assistant interface with dynamic split view.
  - `app/cover-letter/`: Dedicated cover letter generator.
  - `app/api/chat/`: Multi-model streaming AI endpoint.
  - `app/api/mcp/`: JSON-RPC 2.0 Model Context Protocol bridge.
- `components/ai-elements/`: Rich AI UI widgets (`WebPreview`, `ChainOfThought`, `Shimmer`, `JSXPreview`).
- `components/pdf-templates/`: Vector ATS resume templates (10+ variants).
- `components/auth/`: `UserMenu`, `AuthModal`, and session management components.
- `lib/db/`: PostgreSQL / PLSQL schema definition (`schema.ts`) and data access layer (`plsql-storage.ts`).
- `lib/github/`: Zero-knowledge GitHub repository sync service (`sync.ts`).
- `lib/resume-schema.ts`: Strict Zod validation schemas for crash-proof data integrity.
- `scripts/mcp-server.ts`: Standalone Model Context Protocol server exposing job tools.

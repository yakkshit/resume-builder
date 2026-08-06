# Resume & Cover Letter PDF Generator MCP Server

This project provides a Model Context Protocol (MCP) server that allows AI assistants (Claude Desktop, Cursor, ChatGPT, Custom Agents) to list templates and generate **Resume & Cover Letter PDFs**.

It supports both:
1. **Stdio mode** (local CLI / desktop clients)
2. **Hosted HTTP JSON-RPC Endpoint** (`/api/mcp` for cloud/remote agent hosting)

---

## Available MCP Tools

### 1. `list_templates`
- **Description**: List all available PDF resume and cover letter templates.
- **Parameters**:
  - `category`: `"all" | "resume" | "coverletter"`

### 2. `generate_resume_pdf`
- **Description**: Generate a PDF document for a resume given JSON data.
- **Parameters**:
  - `resumeData`: Object containing `basicInfo`, `experience`, `education`, `skills`, `projects`, `achievements`.
  - `template`: Template name (e.g. `modern`, `german-cv`, `german-modern`, `tech-modern`, `minimal-clean`).
  - `outputPath`: *(Local stdio mode only)* Path to save the file.

### 3. `generate_cover_letter_pdf`
- **Description**: Generate a PDF document for a cover letter.
- **Parameters**:
  - `coverLetterData`: Object containing `{ head: string, body: string, footer: string }`.
  - `template`: Template name (e.g. `standard`, `modern`, `german-anschreiben`, `minimal`).
  - `outputPath`: *(Local stdio mode only)* Path to save the file.

---

## 1. Local Stdio Integration

Run locally:
```bash
npm run mcp
```

Claude Desktop Configuration (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "resume-coverletter-mcp": {
      "command": "npx",
      "args": ["tsx", "/Users/yakkshit/Downloads/project/resume/cv-main/scripts/mcp-server.ts"],
      "cwd": "/Users/yakkshit/Downloads/project/resume/cv-main"
    }
  }
}
```

---

## 2. Hosted Cloud HTTP Endpoint

When deployed (e.g. Vercel / Railway / Render / VPS), your hosted MCP endpoint is accessible at:

`https://<your-domain>/api/mcp`

### Connecting remote agents / HTTP MCP client:
- **`GET /api/mcp`**: Health check and supported tool list.
- **`POST /api/mcp`**: JSON-RPC endpoint handling standard `initialize`, `tools/list`, and `tools/call`.

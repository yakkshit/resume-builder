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

## 2. Hosted Cloud HTTP Endpoint (Vercel / Production)

When deployed to Vercel or any hosting platform, your MCP endpoint is available at:

```
https://<your-vercel-domain>.vercel.app/api/mcp
```

### Endpoints & Methods Supported:
- **`OPTIONS /api/mcp`**: CORS preflight support for web-based MCP clients and inspectors.
- **`GET /api/mcp`**: Health check, MCP server capabilities, and tool schemas.
- **`POST /api/mcp`**: Standard JSON-RPC 2.0 MCP endpoint (`initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `prompts/list`).

---

## 3. How to Test Your Vercel MCP Endpoint

### A. Quick Browser / Health Check
Open in your browser or run:
```bash
curl https://<your-vercel-domain>.vercel.app/api/mcp
```

### B. Test `initialize` via cURL
```bash
curl -X POST https://<your-vercel-domain>.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

### C. Test `tools/list` via cURL
```bash
curl -X POST https://<your-vercel-domain>.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### D. Test `tools/call` for `list_templates`
```bash
curl -X POST https://<your-vercel-domain>.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_templates","arguments":{"category":"all"}}}'
```


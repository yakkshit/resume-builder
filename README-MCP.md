# Dynamic User MCP & REST Platform

The Career Agent platform features a **Dynamic Model Context Protocol (MCP) and REST Server Engine**. Each user gets a personalized, dedicated MCP endpoint and REST endpoint that shares their **Memory Vault**, active resumes, cover letters, and live career intelligence tools.

---

## Key Features

1. **Dedicated User Endpoints**:
   - **MCP Endpoint**: `https://<your-domain>/api/mcp/<custom-slug>` (JSON-RPC 2.0 for Cursor, Claude Desktop, Windsurf, Claude Code)
   - **REST Endpoint**: `https://<your-domain>/api/mcp/rest/<custom-slug>` (Direct HTTP POST for cURL, scripts, Python, Node.js)
   - Custom endpoint slug customization per user (e.g. `/api/mcp/my-agent`)

2. **Configurable Multi-Authentication**:
   - **Public / None**: Completely open without requiring any auth token or header. Users can do whatever they want.
   - **Bearer Token**: Authenticate with `Authorization: Bearer <token>` or `x-api-key: <token>`.
   - **OAuth Client Credentials**: Authenticate with `Authorization: Basic base64(client_id:client_secret)` or `x-client-id` and `x-client-secret` headers.
   - **Custom Header**: User-defined custom header name and secret.

3. **Shared Memory Vault Integration**:
   - All tools share the user's persistent **Memory Vault** and career dossiers.
   - Search, read, append, and update career milestones, achievements, and work experience.

4. **Daily Admin Rate Limit Quota (100 Requests/Day)**:
   - Each user receives **100 requests per day** across all tools.
   - Quota tracking with real-time response telemetry headers:
     - `X-RateLimit-Limit: 100`
     - `X-RateLimit-Remaining: <count>`
     - `X-RateLimit-Reset: <timestamp>`
   - Resets daily at 00:00 UTC.

5. **Firebase Database Persistence**:
   - Tool usage and MCP telemetry are persisted directly in **Firebase Firestore** (`users/{userId}/mcp_usage` and `users/{userId}/mcp_logs`).
   - Resilient in-memory fallback ensures high availability when offline or in mock mode.

6. **Full Profile Accessibility UI**:
   - Accessible under **Profile > Dynamic MCP & REST**.
   - Copyable personal URLs and client configurations for Cursor, Claude Desktop, Claude Code, Windsurf, and cURL.
   - Live daily quota & token meter with progress bar.
   - Interactive Tool Explorer with 38+ tools and instant test runner.
   - Real-time audit log of tool executions stored in Firebase.

---

## Available Tools (38+ Tools)

### Memory Vault & Dossier Tools
- `get_memory_vault`: Retrieve complete markdown Memory Vault.
- `search_memory_vault`: Keyword and topic search across career milestones.
- `append_memory_vault`: Append achievements or notes to persistent Memory Vault.
- `update_memory_vault`: Overwrite or revise Memory Vault markdown.

### Resume & Career Profile Tools
- `get_user_profile`: Fetch user bio, target roles, headline, and contacts.
- `update_user_profile`: Update career profile information.
- `get_user_resume`: Retrieve active structured resume JSON.
- `update_resume_section`: Update a specific resume section.
- `tailor_resume_for_job`: Rewrite bullet points and summary tailored to a target job description.
- `analyze_resume_ats_match`: Calculate ATS match score (0-100), missing keywords, and recommendations.
- `list_templates`: List resume and cover letter templates with 1-page character limits.
- `validate_template_page_budget`: Check character counts against single-page limits.
- `generate_resume_pdf`: Render production PDF binary / base64.

### Cover Letter & Application Package Tools
- `generate_cover_letter`: Generate personalized cover letter text tailored to company & role.
- `generate_cover_letter_pdf`: Render cover letter PDF binary.
- `prepare_job_application_package`: Generate both tailored resume and cover letter PDFs.

### Jobs, Intelligence & Scrapers
- `search_web`: Real-time web search for tech documentation and salary benchmarks.
- `search_jobs`: Live job openings search by role, skills, and location.
- `scrape_job_posting`: Extract requirements, responsibilities, and qualifications from URL or text.
- `scrape_company_intel`: Extract company mission, engineering culture, tech stack, and news.
- `scrape_github_profile`: Scrape repositories, stars, languages, and commit highlights.
- `scrape_linkedin_profile`: Parse work history, headline, and skills from LinkedIn export.

### Browser & Headless Automation
- `browser_navigate`, `browser_extract`, `browser_click`, `browser_type`, `browser_handoff`
- `playwright_navigate`, `playwright_screenshot`, `playwright_extract_dom`, `playwright_fill_form`, `playwright_click_element`, `playwright_evaluate`

### Career Coaching, STAR Prep & Outreach
- `ask_career_coach`: AI career guidance on negotiation, promotion, or career pivots.
- `draft_outreach_email`: Generate personalized cold outreach or coffee chat request emails.
- `generate_interview_questions`: Generate behavioral & technical questions with STAR talking points.
- `translate_career_document`: Translate documents into German, Spanish, French, Japanese, etc.
- `get_mcp_quota_status`: Real-time quota status and remaining requests.

---

## Client Integration Examples

### 1. Cursor (`~/.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "my-career-agent": {
      "url": "https://your-domain.com/api/mcp/your-slug",
      "headers": {
        "Authorization": "Bearer mcp_sec_your_token"
      }
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "my-career-agent": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-domain.com/api/mcp/your-slug",
        "--header",
        "Authorization: Bearer mcp_sec_your_token"
      ]
    }
  }
}
```

### 3. Claude Code CLI
```bash
claude mcp add my-career-agent https://your-domain.com/api/mcp/your-slug --header "Authorization: Bearer mcp_sec_your_token"
```

### 4. Direct REST API (cURL)
```bash
curl -X POST https://your-domain.com/api/mcp/rest/your-slug \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mcp_sec_your_token" \
  -d '{
    "tool": "get_memory_vault",
    "args": {}
  }'
```

# Project Context

## Overview

This project provides a Model Context Protocol (MCP) server that allows AI assistants (Claude Desktop, Cursor, ChatGPT, Custom Agents) to list templates and generate Resume & Cover Letter PDFs. It supports both: 1. Stdio mode (local CLI / desktop clients) 2. Hosted HTTP JSON-RPC Endpoint (/api/mcp for cloud/remote agent hosting) ---


## Tech Stack

- TypeScript
- React (TSX)
- JSON
- CSS
- SQL
- JavaScript
- Markdown
- YAML
- React
- Next.js
- Tailwind CSS
- Vitest
- Node.js


## Directory Structure

```text
└── cv-main/
    ├── __tests__/
    │   ├── all-chat-components-resilience.test.ts
    │   ├── autonomous-browser-mcp.test.tsx
    │   ├── chat-feedback.test.ts
    │   ├── chat-keyboard-shortcuts.test.ts
    │   ├── chat-onboarding-video.test.ts
    │   ├── chat-textarea.test.ts
    │   ├── component-stage-and-proxy.test.tsx
    │   ├── cover-letter-resilience.test.ts
    │   ├── database-migration.test.ts
    │   ├── dependency-check.test.ts
    │   ├── email-draft-errors.test.ts
    │   ├── encryption.test.ts
    │   ├── extract-resume-json.test.ts
    │   ├── github-sync-encrypted.test.ts
    │   ├── github-sync-service.test.ts
    │   ├── gitlab-sync.test.ts
    │   ├── job-scraper.test.ts
    │   ├── linkedin-outreach.test.ts
    │   ├── lockfile-sync.test.ts
    │   ├── master-rag-vault.test.ts
    │   ├── mcp-protocol.test.ts
    │   ├── memory-vault.test.ts
    │   ├── neo4j-graph.test.ts
    │   ├── normalize-attached-file.test.ts
    │   ├── onboarding-db.test.ts
    │   ├── pdf-template-resilience.test.ts
    │   ├── persona-and-auth-sync.test.tsx
    │   ├── prod-leak-prevention.test.ts
    │   ├── profile-scrapers.test.ts
    │   ├── resume-schema.test.ts
    │   ├── resume-skills-safety.test.ts
    │   ├── sanitize-resume-data.test.ts
    │   ├── security-audit.test.ts
    │   ├── streaming-chat-content.test.ts
    │   ├── thinking-and-tools.test.ts
    │   └── user-knowledge-context.test.ts
    ├── .agents/
    │   └── mcp_config.json
    ├── .pnpm-store/
    │   └── v10/
    │       ├── files/
    │       │   └── ...
    │       └── index/
    │           └── ...
    ├── .vscode/
    │   ├── launch.json
    │   └── mcp.json
    ├── app/
    │   ├── api/
    │   │   ├── chat/
    │   │   │   └── ...
    │   │   ├── chat-assistant/
    │   │   │   └── ...
    │   │   ├── code-run/
    │   │   │   └── ...
    │   │   ├── cover-letter/
    │   │   │   └── ...
    │   │   ├── cover-letter-chat/
    │   │   │   └── ...
    │   │   ├── doc/
    │   │   │   └── ...
    │   │   ├── email-draft/
    │   │   │   └── ...
    │   │   ├── feedback/
    │   │   │   └── ...
    │   │   ├── generate-pdf/
    │   │   │   └── ...
    │   │   ├── github/
    │   │   │   └── ...
    │   │   ├── job-search/
    │   │   │   └── ...
    │   │   ├── latex-pdf/
    │   │   │   └── ...
    │   │   ├── mcp/
    │   │   │   └── ...
    │   │   ├── memory-vault/
    │   │   │   └── ...
    │   │   ├── openapi/
    │   │   │   └── ...
    │   │   ├── pdf/
    │   │   │   └── ...
    │   │   ├── translate/
    │   │   │   └── ...
    │   │   ├── user/
    │   │   │   └── ...
    │   │   ├── webhooks/
    │   │   │   └── ...
    │   │   └── webview/
    │   │       └── ...
    │   ├── bg/
    │   │   └── page.tsx
    │   ├── chat/
    │   │   ├── error.tsx
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── cover-letter/
    │   │   ├── loading.tsx
    │   │   └── page.tsx
    │   ├── donate/
    │   │   └── page.tsx
    │   ├── feedback/
    │   │   ├── loading.tsx
    │   │   └── page.tsx
    │   ├── price/
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   └── page.tsx
    │   ├── sign-in/
    │   │   └── [[...sign-in]]/
    │   │       └── ...
    │   ├── sign-up/
    │   │   └── [[...sign-up]]/
    │   │       └── ...
    │   ├── globals.css
    │   ├── icon.svg
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   └── page.tsx
    ├── applications/
    │   ├── 21X_Software_Engineer_C.pdf
    │   ├── 21X_Software_Engineer_CV.pdf
    │   ├── Master_AI_Robotics_FullStack_CV.pdf
    │   ├── Software_Engineer_Java_React_C.pdf
    │   ├── Software_Engineer_Java_React_CV.pdf
    │   ├── Vagas_Senior_Fullstack_Python_C.pdf
    │   └── Vagas_Senior_Fullstack_Python_CV.pdf
    ├── components/
    │   ├── ai-elements/
    │   │   ├── agent.tsx
    │   │   ├── attachments.tsx
    │   │   ├── chain-of-thought.tsx
    │   │   ├── index.ts
    │   │   ├── jsx-preview.tsx
    │   │   ├── persona.tsx
    │   │   ├── reasoning.tsx
    │   │   ├── shimmer.tsx
    │   │   └── web-preview.tsx
    │   ├── auth/
    │   │   ├── auth-modal.tsx
    │   │   └── user-menu.tsx
    │   ├── chat/
    │   │   ├── components/
    │   │   │   └── ...
    │   │   ├── ai-chat-career.tsx
    │   │   ├── ai-chat.tsx
    │   │   ├── chat-ambient.tsx
    │   │   ├── chat-artifact-chrome.tsx
    │   │   ├── chat-component-registry.tsx
    │   │   ├── chat-cv-tabs.tsx
    │   │   ├── chat-feedback.tsx
    │   │   ├── chat-input.tsx
    │   │   ├── chat-message-renderer.tsx
    │   │   ├── chat-onboarding.tsx
    │   │   ├── chat-sidebar.tsx
    │   │   ├── chat-store.tsx
    │   │   ├── chromium-webview.tsx
    │   │   ├── component-renderer.tsx
    │   │   ├── context-window.tsx
    │   │   ├── job-profile-dialog.tsx
    │   │   ├── job-suggestions-panel.tsx
    │   │   ├── markdown-renderer.tsx
    │   │   ├── mcp-dialog.tsx
    │   │   ├── profile-photo-crop-dialog.tsx
    │   │   ├── profile-settings-dialog.tsx
    │   │   ├── resume-latex-artifact.tsx
    │   │   ├── sidebar-integrations-accordion.tsx
    │   │   ├── sidebar.tsx
    │   │   ├── text-selection-popover.tsx
    │   │   ├── thinking-indicator.tsx
    │   │   └── translation-controls.tsx
    │   ├── donation/
    │   │   ├── animations/
    │   │   │   └── ...
    │   │   ├── donation-widget.tsx
    │   │   ├── faq-section.tsx
    │   │   ├── impact-section.tsx
    │   │   └── testimonials-section.tsx
    │   ├── logos/
    │   │   └── logos.ts
    │   ├── pdf-templates/
    │   │   ├── coverletter/
    │   │   │   └── ...
    │   │   ├── cv/
    │   │   │   └── ...
    │   │   └── index.tsx
    │   ├── resume-coverletter/
    │   │   ├── cover-letter-chat.tsx
    │   │   ├── cover-letter-editor.tsx
    │   │   ├── cover-letter-pdf-viewer.tsx
    │   │   ├── cover-letter-preview.tsx
    │   │   ├── debug-profile-image.tsx
    │   │   ├── enhanced-chat.tsx
    │   │   ├── loading-screen.tsx
    │   │   ├── pdf-renderer.tsx
    │   │   ├── pdf-viewer.tsx
    │   │   ├── resume-editor.tsx
    │   │   └── theme-provider.tsx
    │   ├── ui/
    │   │   ├── accordion.tsx
    │   │   ├── alert-dialog.tsx
    │   │   ├── alert.tsx
    │   │   ├── aspect-ratio.tsx
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── bolt-style-chat.tsx
    │   │   ├── breadcrumb.tsx
    │   │   ├── button-1.tsx
    │   │   ├── button.tsx
    │   │   ├── calendar.tsx
    │   │   ├── card.tsx
    │   │   ├── carousel.tsx
    │   │   ├── chart.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── collapsible.tsx
    │   │   ├── command.tsx
    │   │   ├── context-menu.tsx
    │   │   ├── dialog.tsx
    │   │   ├── drawer.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── enhanced-marquee.tsx
    │   │   ├── form.tsx
    │   │   ├── hover-card.tsx
    │   │   ├── infinite-marquee.tsx
    │   │   ├── input-otp.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── menubar.tsx
    │   │   ├── navigation-menu.tsx
    │   │   ├── pagination.tsx
    │   │   ├── particle-text-effect.tsx
    │   │   ├── popover.tsx
    │   │   ├── progress.tsx
    │   │   ├── radio-group.tsx
    │   │   ├── resizable.tsx
    │   │   ├── scroll-area.tsx
    │   │   ├── select.tsx
    │   │   ├── separator.tsx
    │   │   ├── sheet.tsx
    │   │   ├── shine-border.tsx
    │   │   ├── sidebar.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── slider.tsx
    │   │   ├── sonner.tsx
    │   │   ├── stepper.tsx
    │   │   ├── switch.tsx
    │   │   ├── table.tsx
    │   │   ├── tabs.tsx
    │   │   ├── textarea.tsx
    │   │   ├── the-infinite-grid.tsx
    │   │   ├── toast.tsx
    │   │   ├── toaster.tsx
    │   │   ├── toggle-group.tsx
    │   │   ├── toggle.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── use-mobile.tsx
    │   │   └── use-toast.ts
    │   ├── app-nav.tsx
    │   ├── cookie-banner.tsx
    │   ├── package-manager-ui.tsx
    │   └── theme-toggle.tsx
    ├── database/
    │   └── migrations.ts
    ├── drizzle/
    │   ├── meta/
    │   │   ├── _journal.json
    │   │   ├── 0000_snapshot.json
    │   │   └── 0001_snapshot.json
    │   ├── 0000_optimal_fallen_one.sql
    │   └── 0001_wandering_starjammers.sql
    ├── hooks/
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    ├── lib/
    │   ├── auth/
    │   │   ├── auth-provider.tsx
    │   │   └── clerk-config.ts
    │   ├── browser/
    │   │   ├── browser-driver.ts
    │   │   ├── playwright-driver.ts
    │   │   ├── playwright-service.ts
    │   │   └── selenium-driver.ts
    │   ├── cache/
    │   │   └── redis.ts
    │   ├── crypto/
    │   │   └── encryption.ts
    │   ├── db/
    │   │   ├── index.ts
    │   │   ├── plsql-storage.ts
    │   │   └── schema.ts
    │   ├── email/
    │   │   └── resend.ts
    │   ├── github/
    │   │   └── sync.ts
    │   ├── job-scraper/
    │   │   ├── google-jobs.ts
    │   │   └── live-scraper.ts
    │   ├── mcp/
    │   │   └── mcp-manager.ts
    │   ├── neo4j/
    │   │   ├── driver.ts
    │   │   └── graph-service.ts
    │   ├── scrapers/
    │   │   └── profile-scrapers.ts
    │   ├── storage/
    │   │   └── r2.ts
    │   ├── api-auth.ts
    │   ├── bergamot-translator-client.ts
    │   ├── bolt-models.tsx
    │   ├── chat-history.ts
    │   ├── chat-models.ts
    │   ├── chat-onboarding-video.ts
    │   ├── chat-provider-settings.ts
    │   ├── chat-resume-context.ts
    │   ├── chat-textarea.ts
    │   ├── clipboard.ts
    │   ├── cover-letter-pdf-generator.tsx
    │   ├── default-cover-letter.ts
    │   ├── default-resume-data.ts
    │   ├── email-compose-urls.ts
    │   ├── email-draft-errors.ts
    │   ├── extract-resume-json.ts
    │   ├── faq.ts
    │   ├── gallery-data.ts
    │   ├── linkedin-outreach.ts
    │   ├── mcp-client.ts
    │   ├── memory-store.ts
    │   ├── memory-vault.ts
    │   ├── message-utils.ts
    │   ├── model-provider-icon.tsx
    │   ├── multi-model-docs.ts
    │   ├── normalize-attached-file.ts
    │   ├── normalize-sections-resume.ts
    │   ├── pdf-generator.ts
    │   ├── pdf-generator.tsx
    │   ├── redact-resume-pii.ts
    │   ├── resume-schema.ts
    │   ├── safe-local-storage.ts
    │   ├── sanitize-cover-letter-data.ts
    │   ├── sanitize-resume-data.ts
    │   ├── streaming-chat-content.ts
    │   ├── translation.ts
    │   ├── types.ts
    │   ├── user-knowledge-context.ts
    │   └── utils.ts
    ├── public/
    │   ├── bergamot/
    │   │   ├── bergamot-translator-worker.js
    │   │   ├── bergamot-translator-worker.wasm
    │   │   └── translator-worker.js
    │   ├── deepmind-picture-2.jpg
    │   ├── icon.svg
    │   └── placeholder.svg
    ├── scripts/
    │   ├── build-accenture-a2.js
    │   ├── build-accenture-application.js
    │   ├── build-application-packages.ts
    │   ├── build-hws-application.js
    │   ├── build-project-template-applications.js
    │   ├── compile-applications.ts
    │   ├── drop-agent-harnesses.ts
    │   ├── generate-21x-package.ts
    │   ├── generate-application-pdfs.js
    │   ├── generate-java-react-package.ts
    │   ├── generate-master-cv.ts
    │   ├── generate-pdf.ts
    │   ├── generate-vagas-package.ts
    │   ├── mcp-server.ts
    │   ├── migrate.mjs
    │   ├── migrate.ts
    │   ├── test-fcukoffai.ts
    │   ├── test-large-ctx.ts
    │   ├── test-large.ts
    │   ├── test-pdf-endpoints.ts
    │   ├── test-route.ts
    │   └── workflow.ts
    ├── styles/
    │   └── globals.css
    ├── .gitignore
    ├── .npmrc
    ├── about.md
    ├── cjs-shim.ts
    ├── components.json
    ├── declarations.d.ts
    ├── drizzle.config.ts
    ├── eslint.config.mjs
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── postcss.config.mjs
    ├── proxy.ts
    ├── README-MCP.md
    ├── tailwind.config.ts
    ├── test_payload.json
    ├── test-render.tsx
    ├── ts_errors.txt
    ├── tsconfig.json
    ├── vitest.config.ts
    └── walkthrough.md
```

## Key Files

- **`.agents/mcp_config.json`**: Environment or tool configuration.
- **`components/ai-elements/index.ts`**: UI or modular structural component.
- **`components/pdf-templates/index.tsx`**: UI or modular structural component.
- **`lib/auth/clerk-config.ts`**: Exports `isClerkConfigured` function.
- **`lib/db/index.ts`**: Exports `db` definition.
- **`drizzle.config.ts`**: Exports default `defineConfig` component/module.
- **`eslint.config.mjs`**: ESLint code linting and formatting rules.
- **`next.config.mjs`**: Next.js framework runtime configuration and routing redirects.
- **`package.json`**: Project manifest, metadata, dependencies, and script definitions.
- **`postcss.config.mjs`**: PostCSS configuration for CSS transformations.
- **`README-MCP.md`**: Project documentation and overview.
- **`tailwind.config.ts`**: Tailwind CSS theme tokens and layout styling configuration.
- **`tsconfig.json`**: TypeScript compiler options and path aliases configuration.
- **`vitest.config.ts`**: Vitest testing framework configuration.
- **`__tests__/all-chat-components-resilience.test.ts`**: UI or modular structural component.


## Dependencies

### Production Dependencies
- `@ai-sdk/anthropic@^3.0.58`
- `@ai-sdk/google@^3.0.43`
- `@ai-sdk/huggingface@^1.0.40`
- `@ai-sdk/openai-compatible@^2.0.38`
- `@ai-sdk/react@^3.0.118`
- `@ai-sdk/ui-utils@^1.2.11`
- `@browsermt/bergamot-translator@^0.4.9`
- `@clerk/nextjs@^7.9.1`
- `@dnd-kit/core@^6.3.1`
- `@dnd-kit/sortable@^10.0.0`
- `@dnd-kit/utilities@^3.2.2`
- `@google/genai@^1.16.0`
- `@google/generative-ai@^0.21.0`
- `@hookform/resolvers@^3.9.1`
- `@huggingface/inference@^4.7.1`
- `@lobehub/icons@^5.8.0`
- `@radix-ui/react-accordion@^1.2.2`
- `@radix-ui/react-alert-dialog@^1.1.4`
- `@radix-ui/react-aspect-ratio@^1.1.1`
- `@radix-ui/react-avatar@^1.1.2`
- `@radix-ui/react-checkbox@^1.1.3`
- `@radix-ui/react-collapsible@^1.1.12`
- `@radix-ui/react-context-menu@^2.2.4`
- `@radix-ui/react-dialog@^1.1.4`
- `@radix-ui/react-dropdown-menu@^2.1.4`
- `@radix-ui/react-hover-card@^1.1.4`
- `@radix-ui/react-label@^2.1.1`
- `@radix-ui/react-menubar@^1.1.4`
- `@radix-ui/react-navigation-menu@^1.2.3`
- `@radix-ui/react-popover@^1.1.15`
### Development Dependencies
- `@playwright/test@^1.49.1`
- `@scalar/nextjs-api-reference@0.4.106`
- `@types/katex@^0.16.8`
- `@types/multer@^2.0.0`
- `@types/node@^22.17.2`
- `@types/pdf-parse@^1.1.5`
- `@types/react@^19.0.0`
- `@types/react-dom@^19.0.0`
- `@types/selenium-webdriver@^4.35.6`
- `drizzle-kit@^0.31.10`
- `eslint@^9.39.4`
- `eslint-config-next@^16.2.2`
- `postcss@^8.4.47`
- `tailwindcss@^3.4.17`
- `typescript@^5.7.2`
- `vitest@^2.1.0`


## Entry Points

- **scripts.start**: `next start`
- **scripts.dev**: `NODE_OPTIONS=--max-old-space-size=8192 next dev --webpack`


## Dependency Graph

### Entry Points
- `components/chat/ai-chat.tsx` (main entry)
- `components/ai-elements/index.ts` (main entry)
- `components/resume-coverletter/cover-letter-preview.tsx` (main entry)
- `scripts/generate-21x-package.ts` (main entry)
- `scripts/generate-java-react-package.ts` (main entry)
- `scripts/generate-vagas-package.ts` (main entry)
- `lib/browser/playwright-service.ts` (main entry)

### Core Modules
- `components/ai-elements/reasoning.tsx` (imported by 1 file)
- `components/ai-elements/shimmer.tsx` (imported by 2 files)
- `components/chat/components/component-stage.tsx` (imported by 1 file)
- `components/chat/components/cover-letter-viewer.tsx` (imported by 2 files)
- `components/chat/components/job-scraper-card.tsx` (imported by 2 files)
- `components/chat/chat-component-registry.tsx` (imported by 1 file)
- `components/chat/chat-store.tsx` (imported by 4 files)
- `components/chat/component-renderer.tsx` (imported by 2 files)
- `components/chat/job-suggestions-panel.tsx` (imported by 1 file)
- `components/chat/mcp-dialog.tsx` (imported by 2 files)

### Utilities
- `lib/types.ts` (shared helper)
- `lib/cover-letter-pdf-generator.tsx` (shared helper)
- `components/chat/chat-store.tsx` (shared helper)
- `components/logos/logos.ts` (shared helper)
- `components/pdf-templates/coverletter/modern-cover-letter-template.tsx` (shared helper)
- `components/pdf-templates/cv/general-resumes/modern-pdf-template.tsx` (shared helper)
- `lib/browser/browser-driver.ts` (shared helper)
- `components/ai-elements/shimmer.tsx` (shared helper)
- `components/chat/components/cover-letter-viewer.tsx` (shared helper)
- `components/chat/components/job-scraper-card.tsx` (shared helper)

### Key Relationships
- `__tests__/resume-schema.test.ts` → `lib/resume-schema.ts`
- `__tests__/thinking-and-tools.test.ts` → `lib/streaming-chat-content.ts`
- `__tests__/thinking-and-tools.test.ts` → `lib/extract-resume-json.ts`
- `app/layout.tsx` → `app/globals.css`
- `components/ai-elements/index.ts` → `components/ai-elements/agent.tsx`
- `components/ai-elements/index.ts` → `components/ai-elements/attachments.tsx`
- `components/ai-elements/index.ts` → `components/ai-elements/chain-of-thought.tsx`
- `components/ai-elements/index.ts` → `components/ai-elements/jsx-preview.tsx`
- `components/ai-elements/index.ts` → `components/ai-elements/reasoning.tsx`
- `components/ai-elements/index.ts` → `components/ai-elements/shimmer.tsx`


## Recent Git Commits

- `910d7b2`: fix: bugfix update to 2.11.8 (13 hours ago by yakkshit)
- `e4f2cbd`: fix: bugfix update to 2.11.7 (4 days ago by yakkshit)
- `d57850f`: fix: bugfix update to 2.11.6 (9 days ago by yakkshit)
- `abf6130`: fix: bugfix update to 2.11.5 (9 days ago by yakkshit)
- `e63aa53`: fix: bugfix update to 2.11.4 (10 days ago by yakkshit)


## Quick Notes for the LLM

- **Execution Context**: Refer to the entry points above to understand application bootstrap.
- **Modularity**: Check the Dependency Graph before refactoring to maintain module coupling.
- **Dependencies**: Rely on the installed packages and runtimes listed under Tech Stack.

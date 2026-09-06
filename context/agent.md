# Project Context

## Overview

**README-INTERVIEW-LAB.md**: This repo is a Next.js application that combines: - Resume Builder (build and export a resume) - Career Assistant Chat (multi-model chat with session-only API keys) - Cover Letter workflow - Interview Lab (mock interview rounds, coding tests, and live coaching) This document is the “one stop” guide for running the app, configuring Integrations, and understanding Interview Lab architecture.

**README-MCP.md**: This project provides a Model Context Protocol (MCP) server that allows AI assistants (Claude Desktop, Cursor, ChatGPT, Custom Agents) to list templates and generate Resume & Cover Letter PDFs. It supports both: 1. Stdio mode (local CLI / desktop clients) 2. Hosted HTTP JSON-RPC Endpoint (/api/mcp for cloud/remote agent hosting) ---


## Tech Stack

- TypeScript
- JSON
- React (TSX)
- CSS
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
    │   ├── chat-onboarding-video.test.ts
    │   ├── chat-textarea.test.ts
    │   ├── dependency-check.test.ts
    │   ├── email-draft-errors.test.ts
    │   ├── extract-resume-json.test.ts
    │   ├── interview-lab-support.test.ts
    │   ├── job-scraper.test.ts
    │   ├── linkedin-outreach.test.ts
    │   ├── normalize-attached-file.test.ts
    │   ├── pdf-template-resilience.test.ts
    │   ├── resume-skills-safety.test.ts
    │   ├── sanitize-resume-data.test.ts
    │   ├── security-audit.test.ts
    │   ├── streaming-chat-content.test.ts
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
    │   │   ├── interview-lab/
    │   │   │   └── ...
    │   │   ├── job-search/
    │   │   │   └── ...
    │   │   ├── latex-pdf/
    │   │   │   └── ...
    │   │   ├── mcp/
    │   │   │   └── ...
    │   │   ├── openapi/
    │   │   │   └── ...
    │   │   ├── pdf/
    │   │   │   └── ...
    │   │   ├── translate/
    │   │   │   └── ...
    │   │   └── webhooks/
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
    │   ├── globals.css
    │   ├── icon.svg
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   └── page.tsx
    ├── components/
    │   ├── ai-elements/
    │   │   ├── attachments.tsx
    │   │   ├── reasoning.tsx
    │   │   └── shimmer.tsx
    │   ├── chat/
    │   │   ├── components/
    │   │   │   └── ...
    │   │   ├── ai-chat-career.tsx
    │   │   ├── ai-chat.tsx
    │   │   ├── chat-ambient.tsx
    │   │   ├── chat-artifact-chrome.tsx
    │   │   ├── chat-component-registry.tsx
    │   │   ├── chat-cv-tabs.tsx
    │   │   ├── chat-input.tsx
    │   │   ├── chat-message-renderer.tsx
    │   │   ├── chat-onboarding.tsx
    │   │   ├── chat-sidebar.tsx
    │   │   ├── chat-store.tsx
    │   │   ├── component-renderer.tsx
    │   │   ├── context-window.tsx
    │   │   ├── interview-lab-panel.tsx
    │   │   ├── job-profile-dialog.tsx
    │   │   ├── job-suggestions-panel.tsx
    │   │   ├── markdown-renderer.tsx
    │   │   ├── mock-interview-interactive.tsx
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
    │   └── package-manager-ui.tsx
    ├── database/
    │   └── migrations.ts
    ├── hooks/
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    ├── lib/
    │   ├── job-scraper/
    │   │   └── google-jobs.ts
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
    │   ├── interview-lab-model-support.ts
    │   ├── linkedin-outreach.ts
    │   ├── memory-store.ts
    │   ├── message-utils.ts
    │   ├── model-provider-icon.tsx
    │   ├── multi-model-docs.ts
    │   ├── normalize-attached-file.ts
    │   ├── normalize-sections-resume.ts
    │   ├── pdf-generator.ts
    │   ├── pdf-generator.tsx
    │   ├── redact-resume-pii.ts
    │   ├── safe-local-storage.ts
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
    │   └── placeholder.svg
    ├── scripts/
    │   ├── build-application-packages.ts
    │   ├── compile-applications.ts
    │   ├── generate-pdf.ts
    │   ├── mcp-server.ts
    │   ├── test-pdf-endpoints.ts
    │   └── workflow.ts
    ├── styles/
    │   └── globals.css
    ├── .gitignore
    ├── 1.4.9.pdf
    ├── about.md
    ├── AI_SDK_5_MIGRATION.md
    ├── API_KEYS_SETUP.md
    ├── bugs.md
    ├── cjs-shim.ts
    ├── components.json
    ├── eslint.config.mjs
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── pnpm-lock.yaml
    ├── postcss.config.mjs
    ├── README-INTERVIEW-LAB.md
    ├── README-MCP.md
    ├── tailwind.config.ts
    ├── test-render.tsx
    ├── TESTING.md
    ├── ts_errors.txt
    ├── tsconfig.json
    └── vitest.config.ts
```

## Key Files

- **`.agents/mcp_config.json`**: Environment or tool configuration.
- **`components/pdf-templates/index.tsx`**: UI or modular structural component.
- **`eslint.config.mjs`**: ESLint code linting and formatting rules.
- **`next.config.mjs`**: Next.js framework runtime configuration and routing redirects.
- **`package.json`**: Project manifest, metadata, dependencies, and script definitions.
- **`postcss.config.mjs`**: PostCSS configuration for CSS transformations.
- **`README-INTERVIEW-LAB.md`**: Project documentation and overview.
- **`README-MCP.md`**: Project documentation and overview.
- **`tailwind.config.ts`**: Tailwind CSS theme tokens and layout styling configuration.
- **`tsconfig.json`**: TypeScript compiler options and path aliases configuration.
- **`vitest.config.ts`**: Vitest testing framework configuration.
- **`__tests__/chat-onboarding-video.test.ts`**: Automated test suite.
- **`__tests__/chat-textarea.test.ts`**: Automated test suite.
- **`__tests__/dependency-check.test.ts`**: Automated test suite.
- **`__tests__/email-draft-errors.test.ts`**: Automated test suite.


## Dependencies

### Production Dependencies
- `@ai-sdk/anthropic@^3.0.58`
- `@ai-sdk/google@^3.0.43`
- `@ai-sdk/huggingface@^1.0.40`
- `@ai-sdk/openai-compatible@^2.0.38`
- `@ai-sdk/react@^3.0.118`
- `@ai-sdk/ui-utils@^1.2.11`
- `@browsermt/bergamot-translator@^0.4.9`
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
- `@radix-ui/react-progress@^1.1.1`
### Development Dependencies
- `@scalar/nextjs-api-reference@0.4.106`
- `@types/katex@^0.16.8`
- `@types/multer@^2.0.0`
- `@types/node@^22.17.2`
- `@types/pdf-parse@^1.1.5`
- `@types/react@^19.0.0`
- `@types/react-dom@^19.0.0`
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
- `components/resume-coverletter/cover-letter-preview.tsx` (main entry)
- `lib/pdf-generator.tsx` (main entry)
- `scripts/build-application-packages.ts` (main entry)
- `scripts/compile-applications.ts` (main entry)
- `scripts/generate-pdf.ts` (main entry)
- `app/layout.tsx` (main entry)

### Core Modules
- `components/chat/components/cover-letter-viewer.tsx` (imported by 1 file)
- `components/chat/chat-component-registry.tsx` (imported by 1 file)
- `components/chat/chat-store.tsx` (imported by 4 files)
- `components/chat/component-renderer.tsx` (imported by 1 file)
- `components/chat/interview-lab-panel.tsx` (imported by 2 files)
- `components/chat/job-suggestions-panel.tsx` (imported by 1 file)
- `components/chat/profile-settings-dialog.tsx` (imported by 1 file)
- `components/chat/sidebar-integrations-accordion.tsx` (imported by 1 file)
- `components/chat/sidebar.tsx` (imported by 1 file)
- `components/logos/logos.ts` (imported by 4 files)

### Utilities
- `lib/types.ts` (shared helper)
- `components/chat/chat-store.tsx` (shared helper)
- `components/logos/logos.ts` (shared helper)
- `components/chat/interview-lab-panel.tsx` (shared helper)
- `components/pdf-templates/coverletter/dark-cover-letter-template.tsx` (shared helper)
- `components/pdf-templates/coverletter/elegant-cover-letter-template.tsx` (shared helper)
- `components/pdf-templates/coverletter/gradient-cover-letter-template.tsx` (shared helper)
- `components/pdf-templates/coverletter/professional-cover-letter-template.tsx` (shared helper)
- `components/pdf-templates/coverletter/standard-cover-letter-template.tsx` (shared helper)
- `lib/cover-letter-pdf-generator.tsx` (shared helper)

### Key Relationships
- `app/layout.tsx` → `app/globals.css`
- `components/ai-elements/reasoning.tsx` → `components/ai-elements/shimmer.tsx`
- `components/chat/components/cover-letter-viewer.tsx` → `components/chat/components/cover-letter-single-block-editor.tsx`
- `components/chat/ai-chat.tsx` → `components/chat/markdown-renderer.tsx`
- `components/chat/ai-chat.tsx` → `components/chat/component-renderer.tsx`
- `components/chat/ai-chat.tsx` → `components/chat/chat-store.tsx`
- `components/chat/ai-chat.tsx` → `components/chat/sidebar.tsx`
- `components/chat/ai-chat.tsx` → `components/chat/job-suggestions-panel.tsx`
- `components/chat/ai-chat.tsx` → `components/chat/chat-onboarding.tsx`
- `components/chat/ai-chat.tsx` → `components/chat/interview-lab-panel.tsx`


## Recent Git Commits

- `9abc8e2`: feat: new feature update 2.9.0 (3 weeks ago by yakkshit)
- `08b229b`: feat: new feature update 2.8.0 (4 weeks ago by yakkshit)
- `af36e2d`: feat: new feature update 2.7.0 (8 weeks ago by yakkshit)
- `bb06e38`: fix: bugfix update to 2.6.7 (8 weeks ago by yakkshit)
- `e3c1dc0`: fix: bugfix update to 2.6.6 (8 weeks ago by yakkshit)


## Quick Notes for the LLM

- **Execution Context**: Refer to the entry points above to understand application bootstrap.
- **Modularity**: Check the Dependency Graph before refactoring to maintain module coupling.
- **Dependencies**: Rely on the installed packages and runtimes listed under Tech Stack.

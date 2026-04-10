# Testing & Verification

Date: 2026-04-06

This file records the current verification status for the app (with emphasis on Interview Lab).

## Automated checks

### Build

Command:

```bash
pnpm run build
```

Result: **PASS** (compiled + generated pages successfully).

### Unit tests

Command:

```bash
pnpm run test
```

Result: **PASS**

Notes:

- Added new tests in `__tests__/interview-lab-support.test.ts` (Interview Lab compatibility + docs URL helper).
- Security audit test also passes (no secret-like patterns detected).

### Lint

Command:

```bash
pnpm run lint
```

Result: **PASS (with warnings)**.

Notes:

- Next.js v16 no longer ships `next lint` in the CLI, so linting is now via **ESLint**.
- The codebase currently produces warnings (mainly accessibility suggestions for `<img>` and some unused disables).

### Typecheck

Command:

```bash
pnpm exec tsc --noEmit
```

Result: **FAIL (pre-existing non–Interview Lab errors)**.

Notes:

- Interview Lab files themselves typecheck cleanly.
- Failures are in other areas (e.g. `app/api/generate-pdf/route.tsx`, `components/chat/chat-component-registry.tsx`, `lib/model-provider-icon.tsx`, etc.).

## Manual testing checklist (Interview Lab)

### Interview tab

- [ ] Send message with Gemini model → streamed response
- [ ] Non-Gemini model → inline compatibility banner + disabled input
- [ ] Click “Switch to Gemini” → banner disappears

### Code tab

- [ ] TypeScript Two Sum passes
- [ ] Python Two Sum passes
- [ ] Vercel Sandbox toggle works with configured credentials
- [ ] Falls back to local VM when Sandbox unavailable (toast + “Local VM” badge)

### Live tab

- [ ] Screen share start/stop
- [ ] Record WebM clip and see it appear in attachments
- [ ] “Transcribe latest clip (server)” shows upload + progress + editable transcript
- [ ] “Get AI coach feedback” sends transcript + notes to Gemini

### Sidebar integrations

- [ ] Accordion opens/closes smoothly
- [ ] Commands copy-to-clipboard work + toast feedback
- [ ] Sandbox “Test connection” behaves correctly
- [ ] Compatibility badge updates and “Switch to Gemini” works

### Responsive

- [ ] Mobile: panel is full-screen and tabs stick to bottom
- [ ] Desktop: fullscreen toggle works; Code tab becomes split editor/output on md+


# Bug Report: /chat Application

This document outlines the bugs and issues identified during the testing of the `/chat` application.

## 1. Critical Functional & Logic Issues
* **Onboarding Modal Failure**: Clicking the **"Skip for now"** button in the onboarding modal does not close the dialog. Users are forced to manually click the small "X" button to proceed.

## 2. UI & Accessibility Issues
* **Broken Mobile Layout**: On narrow viewports (e.g., 400px width), the UI collapses and elements overlap significantly. The **CV Document Editor** overlaps with the **suggested prompt pills** and the **chat composer**, rendering the app unusable on mobile.
* **Empty PDF Preview**: The **PDF Preview** tab in the CV Document Editor displays a blank dark box instead of a rendered document.

## 3. Privacy & Sidebar Issues
* **Potential PII Leak**: The **"Docs URL"** field in the sidebar appears to be pre-filled with the user's email address by default, which is a potential logic error or privacy concern.
* **Sidebar Styling**: Several items in the sidebar, such as **"History"** and **"New"**, appear as unstyled or poorly positioned text, suggesting a regression in the sidebar's CSS.

## 4. Technical & Performance
* **Favicon 404**: The browser console reports a `404 Not Found` error for `/favicon.ico`.
* **Viewport Scaling**: On certain window sizes, elements are incorrectly reported as being outside the viewport, leading to interaction issues with automated tools.

### Fix Status & Resolutions:
1. **Onboarding Modal Failure**: Fixed in `components/chat/chat-onboarding.tsx`. "Skip for now" now cleanly persists the dismissal flag to storage and closes the modal immediately.
2. **Translation for components**: Fixed in `lib/translation.ts` and `app/api/translate/route.ts`. Added automatic server API fallback for untranslated strings and included a free Google Translate client endpoint so translation works out-of-the-box without requiring custom API keys.
3. **Docs URL PII / Autofill**: Fixed in `components/chat/sidebar-integrations-accordion.tsx`. Added `type="url"`, `autoComplete="off"`, and ignore tags to prevent browser password managers from auto-filling user emails.
4. **Favicon 404**: Fixed by adding `app/icon.svg` and configuring the `icons` metadata in `app/layout.tsx`.
5. **Vercel MCP Server**: Fixed in `app/api/mcp/route.ts` with in-process React-PDF rendering, CORS headers, and standard MCP JSON-RPC handlers.
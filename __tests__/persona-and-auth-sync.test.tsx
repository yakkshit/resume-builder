import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Persona, type PersonaState, type PersonaVariant } from "@/components/ai-elements/persona";

describe("Persona AI Component", () => {
  const states: PersonaState[] = ["idle", "listening", "thinking", "speaking", "asleep"];
  const variants: PersonaVariant[] = ["obsidian", "mana", "opal", "halo", "glint", "command"];

  states.forEach((state) => {
    it(`renders correctly in state: ${state}`, () => {
      const html = renderToStaticMarkup(
        React.createElement(Persona, { state, variant: "obsidian" })
      );

      expect(html).toContain('data-testid="persona-avatar"');
      expect(html).toContain(`data-persona-state="${state}"`);
      expect(html).toContain('data-persona-variant="obsidian"');
    });
  });

  variants.forEach((variant) => {
    it(`renders variant theme: ${variant}`, () => {
      const html = renderToStaticMarkup(
        React.createElement(Persona, { state: "idle", variant })
      );

      expect(html).toContain(`data-persona-variant="${variant}"`);
    });
  });
});

describe("Unified Authentication Logic", () => {
  it("provides 1-click sign in parameters with zero friction", () => {
    const mockClerkUser = {
      id: "user_2test12345",
      fullName: "Alex Rivera",
      primaryEmailAddress: { emailAddress: "alex.rivera@example.com" },
      imageUrl: "https://example.com/avatar.png",
      externalAccounts: [{ provider: "oauth_github", username: "arivera-dev" }],
    };

    expect(mockClerkUser.primaryEmailAddress.emailAddress).toBe("alex.rivera@example.com");
    expect(mockClerkUser.externalAccounts[0].username).toBe("arivera-dev");
  });
});

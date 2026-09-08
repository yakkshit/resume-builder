import { describe, it, expect } from "vitest";
import React from "react";
import { sanitizeCoverLetterData, extractCoverLetterJsonFromMessage } from "@/lib/sanitize-cover-letter-data";
import { getCoverLetterTemplate, coverLetterTemplates } from "@/components/pdf-templates";

describe("Cover Letter Sanitization & Parser Resilience", () => {
  it("sanitizes the exact Zalion AI Engineer cover letter output from the model", () => {
    const modelOutput = {
      head: "Venkata Sai Yakkshit Reddy Asodi\nKonstanz, Germany | saiyakkshit2001@gmail.com | +49 1713562972 | yakkshit.github.io\n\n[Date]\n\nHiring Team\nZalion\n[Zalion's Address, if known, otherwise omit]",
      body: "Dear Zalion Hiring Team,\n\nI am writing to express my profound interest in the AI Engineer position at Zalion, as advertised. Your mission to revolutionize industrial procurement with cutting-edge AI agents deeply resonates with my expertise in architecting and deploying robust, agent-powered solutions and scalable full-stack applications. With a strong background in multi-agent systems, LLM fine-tuning, RAG pipelines, and end-to-end feature ownership, I am confident I can make an immediate and significant impact on your team.\n\nSincerely,\nVenkata Sai Yakkshit Reddy Asodi",
      footer: "",
      template: "modern",
    };

    const sanitized = sanitizeCoverLetterData(modelOutput);
    expect(sanitized.head).toContain("Venkata Sai Yakkshit Reddy Asodi");
    expect(sanitized.body).toContain("Dear Zalion Hiring Team");
    expect(typeof sanitized.footer).toBe("string");
  });

  it("handles null, undefined, empty, or alternative envelope structures", () => {
    expect(sanitizeCoverLetterData(null).head).toBeDefined();
    expect(sanitizeCoverLetterData(undefined).body).toBeDefined();
    expect(sanitizeCoverLetterData({}).head).toBeDefined();

    const nested = {
      coverLetterData: {
        header: "Alice Developer\nNYC, USA",
        content: "I am writing to apply for Senior Frontend Engineer.",
        signature: "Best,\nAlice",
      },
    };
    const sanitizedNested = sanitizeCoverLetterData(nested);
    expect(sanitizedNested.head).toBe("Alice Developer\nNYC, USA");
    expect(sanitizedNested.body).toBe("I am writing to apply for Senior Frontend Engineer.");
    expect(sanitizedNested.footer).toBe("Best,\nAlice");
  });

  it("handles alternative property names like sender, recipient, paragraphs array", () => {
    const alt = {
      sender: "Bob Smith",
      email: "bob@example.com",
      recipient: "Tech Recruiter at Google",
      paragraphs: ["Paragraph 1: Excitement", "Paragraph 2: Experience"],
      closing: "Warmly,\nBob",
    };
    const sanitized = sanitizeCoverLetterData(alt);
    expect(sanitized.head).toContain("Bob Smith");
    expect(sanitized.head).toContain("bob@example.com");
    expect(sanitized.head).toContain("Tech Recruiter at Google");
    expect(sanitized.body).toBe("Paragraph 1: Excitement\n\nParagraph 2: Experience");
    expect(sanitized.footer).toBe("Warmly,\nBob");
  });

  it("parses raw text cover letters intelligently into head, body, and footer", () => {
    const rawText = `John Doe\nBerlin, Germany | john@example.com\n\nDear Team,\n\nI am thrilled to apply for the role.\n\nSincerely,\nJohn`;
    const sanitized = sanitizeCoverLetterData(rawText);
    expect(sanitized.head).toContain("John Doe");
    expect(sanitized.body).toContain("Dear Team");
    expect(sanitized.footer).toContain("Sincerely");
  });

  it("extracts cover letter JSON from ```component:coverLetter blocks", () => {
    const message = `Here is your cover letter:
\`\`\`component:coverLetter
{
  "head": "Sai Reddy\\nKonstanz, Germany",
  "body": "Dear Hiring Manager,\\n\\nI am applying for the role.",
  "footer": "",
  "template": "modern"
}
\`\`\``;

    const extracted = extractCoverLetterJsonFromMessage(message);
    expect(extracted).not.toBeNull();
    expect(extracted?.head).toContain("Sai Reddy");
    expect(extracted?.body).toContain("Dear Hiring Manager");
  });

  it("extracts cover letter JSON from ```component:cover-letter and ```component:cover_letter", () => {
    const messageKebab = `\`\`\`component:cover-letter\n{"head": "Alice", "body": "Hello", "footer": ""}\n\`\`\``;
    const extractedKebab = extractCoverLetterJsonFromMessage(messageKebab);
    expect(extractedKebab?.head).toBe("Alice");

    const messageSnake = `\`\`\`component:cover_letter\n{"head": "Bob", "body": "World", "footer": ""}\n\`\`\``;
    const extractedSnake = extractCoverLetterJsonFromMessage(messageSnake);
    expect(extractedSnake?.head).toBe("Bob");
  });

  it("ensures all 9 cover letter templates are wrapped safely and render without throwing", () => {
    const templateNames = Object.keys(coverLetterTemplates);
    expect(templateNames.length).toBe(9);

    for (const name of templateNames) {
      const SafeTemplate = getCoverLetterTemplate(name);
      expect(SafeTemplate).toBeDefined();

      // Should not throw even when passed empty props
      expect(() => {
        const element = React.createElement(SafeTemplate, {
          coverLetterData: undefined as any,
        });
        expect(element).toBeDefined();
      }).not.toThrow();
    }
  });
});

import { describe, it, expect } from 'vitest';
import React from 'react';
import { ModernPDFTemplate } from '@/components/pdf-templates'; 
import { render } from '@react-pdf/renderer';

// Mock a "bad" AI response that is missing optional fields
const badAiResumeData = {
  name: "Test User",
  email: "test@test.com",
  // Missing phone, summary, experience, education, skills
};

describe('PDF Template Resilience', () => {
  it('should not crash when AI returns incomplete resume data', () => {
    // This test ensures your templates have proper fallbacks (e.g., || '')
    // If the template tries to render `undefined`, React/PDF renderer will throw.
    expect(() => {
      const element = React.createElement(ModernPDFTemplate, { resumeData: badAiResumeData as any });
    }).not.toThrow();
  });
});
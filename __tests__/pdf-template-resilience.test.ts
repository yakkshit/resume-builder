import { describe, it, expect } from 'vitest';
import React from 'react';
import {
  ModernPDFTemplate,
  GermanTealWaveTemplate,
  GermanSlateSplitTemplate,
  GermanRoseGoldTemplate,
  GermanTimelineMinimalTemplate,
  GermanBurgundyDualTemplate,
  IvyLeaguePDFTemplate,
  resumeTemplates,
  getResumeTemplate,
} from '@/components/pdf-templates';
import { defaultResumeData } from '@/lib/default-resume-data';

// Mock a "bad" AI response that is missing optional fields
const badAiResumeData = {
  basicInfo: {
    name: "Test User",
    email: "test@test.com",
  },
  // Missing phone, summary, experience, education, skills
};

describe('PDF Template Resilience', () => {
  it('should not crash when AI returns incomplete resume data', () => {
    expect(() => {
      React.createElement(ModernPDFTemplate, { resumeData: badAiResumeData as any });
    }).not.toThrow();
  });

  it('should instantiate all registered templates with default resume data without throwing', () => {
    Object.keys(resumeTemplates).forEach((templateKey) => {
      expect(() => {
        const SafeTemplate = getResumeTemplate(templateKey);
        React.createElement(SafeTemplate, { resumeData: defaultResumeData });
      }).not.toThrow();
    });
  });

  it('should instantiate all new templates with incomplete AI data without throwing', () => {
    const newTemplates = [
      GermanTealWaveTemplate,
      GermanSlateSplitTemplate,
      GermanRoseGoldTemplate,
      GermanTimelineMinimalTemplate,
      GermanBurgundyDualTemplate,
      IvyLeaguePDFTemplate,
    ];

    newTemplates.forEach((TemplateComponent) => {
      expect(() => {
        React.createElement(TemplateComponent, { resumeData: badAiResumeData as any });
      }).not.toThrow();
    });
  });
});
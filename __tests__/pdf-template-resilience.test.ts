import { describe, it, expect, vi } from 'vitest';
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

  it('should map section titles correctly based on language parameter without AI', async () => {
    const { getResumeSectionTitles, getMappedTitle } = await import('@/lib/resume-section-titles');
    
    // English default
    const enTitles = getResumeSectionTitles('en');
    expect(enTitles.experience).toBe('Experience');
    expect(enTitles.education).toBe('Education');
    expect(enTitles.skills).toBe('Skills');
    expect(enTitles.summary).toBe('Summary');

    // German mapping
    const deTitles = getResumeSectionTitles('de');
    expect(deTitles.experience).toBe('Berufserfahrung');
    expect(deTitles.education).toBe('Ausbildung');
    expect(deTitles.skills).toBe('Fähigkeiten');
    expect(deTitles.summary).toBe('Zusammenfassung');

    // Spanish mapping
    const esTitles = getResumeSectionTitles('es');
    expect(esTitles.experience).toBe('Experiencia');
    expect(esTitles.education).toBe('Educación');

    // getMappedTitle function
    expect(getMappedTitle('Experience', 'de')).toBe('Berufserfahrung');
    expect(getMappedTitle('Work Experience', 'de')).toBe('Berufserfahrung');
    expect(getMappedTitle('Education', 'de')).toBe('Ausbildung');
    expect(getMappedTitle('Skills', 'de')).toBe('Fähigkeiten');
    expect(getMappedTitle('Summary', 'de')).toBe('Zusammenfassung');
    expect(getMappedTitle('Present', 'de')).toBe('Heute');
    expect(getMappedTitle('Email: ', 'de')).toBe('E-Mail: ');

    // Fallback to English
    expect(getMappedTitle('Experience', 'unknown_lang')).toBe('Experience');

    // German to English title translations
    expect(getMappedTitle('Berufliche Laufbahn', 'en')).toBe('Experience');
    expect(getMappedTitle('BERUFLICHE LAUFBAHN', 'en')).toBe('EXPERIENCE');
    expect(getMappedTitle('Akademischer Werdegang', 'en')).toBe('Education');
    expect(getMappedTitle('AKADEMISCHER WERDEGANG', 'en')).toBe('EDUCATION');
    expect(getMappedTitle('IT-Kenntnisse', 'en')).toBe('Skills');
    expect(getMappedTitle('IT-KENNTNISSE', 'en')).toBe('SKILLS');
    expect(getMappedTitle('Software & IT', 'en')).toBe('Skills');
    expect(getMappedTitle('SOFTWARE & IT', 'en')).toBe('SKILLS');
    expect(getMappedTitle('Persönliche Stärken', 'en')).toBe('Skills');
    expect(getMappedTitle('PERSÖNLICHE STÄRKEN', 'en')).toBe('SKILLS');
    expect(getMappedTitle('Bildungsweg', 'en')).toBe('Education');
    expect(getMappedTitle('BILDUNGSWEG', 'en')).toBe('EDUCATION');
    expect(getMappedTitle('Erfolge & Auszeichnungen', 'en')).toBe('Achievements');
    expect(getMappedTitle('ERFOLGE & AUSZEICHNUNGEN', 'en')).toBe('ACHIEVEMENTS');
    expect(getMappedTitle('Betreff', 'en')).toBe('Summary');
    expect(getMappedTitle('Kurzprofil', 'en')).toBe('Summary');
    expect(getMappedTitle('Sprachen', 'en')).toBe('Languages');
    expect(getMappedTitle('SPRACHEN', 'en')).toBe('LANGUAGES');
  });

  it('should render German templates and Engineering template in English with translated section titles', () => {
    const templatesToTest = [
      'german-teal-wave',
      'german-rose-gold',
      'german-timeline-minimal',
      'german-burgundy-dual',
      'german-slate-split',
      'german-standard',
      'german-modern',
      'engineering-ats',
    ];

    templatesToTest.forEach((templateKey) => {
      const SafeTemplate = getResumeTemplate(templateKey);
      const enElement = SafeTemplate({ resumeData: defaultResumeData, language: 'en' });
      expect(enElement).toBeDefined();

      let foundExperience = false;
      let foundEducation = false;

      const walk = (node: any) => {
        if (!node) return;
        if (typeof node === 'string') {
          const lower = node.toLowerCase();
          if (lower.includes('experience')) foundExperience = true;
          if (lower.includes('education')) foundEducation = true;
        }
        if (node.props?.children) {
          if (Array.isArray(node.props.children)) {
            node.props.children.forEach(walk);
          } else {
            walk(node.props.children);
          }
        }
      };

      walk(enElement);
      expect(foundExperience, `${templateKey} should contain "Experience" in English`).toBe(true);
      expect(foundEducation, `${templateKey} should contain "Education" in English`).toBe(true);
    });
  });

  it('should render templates with localized section titles when language is de', () => {
    const SafeTemplate = getResumeTemplate('modern');
    const germanResumeData = {
      ...defaultResumeData,
      language: 'de',
    };
    
    const element = SafeTemplate({ resumeData: germanResumeData });
    expect(element).toBeDefined();

    // Check that tree was localized
    let foundBerufserfahrung = false;
    let foundAusbildung = false;

    const walk = (node: any) => {
      if (!node) return;
      if (typeof node === 'string') {
        if (node.includes('Berufserfahrung')) foundBerufserfahrung = true;
        if (node.includes('Ausbildung')) foundAusbildung = true;
      }
      if (node.props?.children) {
        if (Array.isArray(node.props.children)) {
          node.props.children.forEach(walk);
        } else {
          walk(node.props.children);
        }
      }
    };

    walk(element);
    expect(foundBerufserfahrung).toBe(true);
    expect(foundAusbildung).toBe(true);
  });

  it('should not produce unique key warnings when rendered with SafeTemplate(ModernPDFTemplate)', () => {
    const errorSpy = vi.spyOn(console, 'error');
    const warnSpy = vi.spyOn(console, 'warn');

    try {
      const SafeTemplate = getResumeTemplate('modern');
      const germanResumeData = {
        ...defaultResumeData,
        language: 'de',
      };

      const tree = SafeTemplate({ resumeData: germanResumeData });
      expect(tree).toBeDefined();

      // Ensure that in any array of children throughout the tree, every element has a defined key
      const checkKeys = (node: any) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach((child) => {
            if (React.isValidElement(child)) {
              expect(child.key).toBeDefined();
            }
            checkKeys(child);
          });
        }
        if (node.props?.children) {
          if (Array.isArray(node.props.children)) {
            node.props.children.forEach((child: any) => {
              if (React.isValidElement(child)) {
                expect(child.key).toBeDefined();
              }
              checkKeys(child);
            });
          } else {
            checkKeys(node.props.children);
          }
        }
      };

      checkKeys(tree);

      const keyErrors = errorSpy.mock.calls.filter((call: unknown[]) =>
        call.some((arg: unknown) => typeof arg === 'string' && arg.includes('unique "key" prop'))
      );
      const keyWarns = warnSpy.mock.calls.filter((call: unknown[]) =>
        call.some((arg: unknown) => typeof arg === 'string' && arg.includes('unique "key" prop'))
      );

      expect(keyErrors).toHaveLength(0);
      expect(keyWarns).toHaveLength(0);
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});
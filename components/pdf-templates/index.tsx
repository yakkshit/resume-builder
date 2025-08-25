// Resume PDF Templates
import { ModernPDFTemplate } from "./cv/general-resumes/modern-pdf-template"
import { ClassicPDFTemplate } from "./cv/general-resumes/classic-pdf-template"
import { MinimalPDFTemplate } from "./cv/general-resumes/minimal-pdf-template"
import { ProfessionalPDFTemplate } from "./cv/general-resumes/professional-pdf-template"
import { ElegantPDFTemplate } from "./cv/general-resumes/elegant-pdf-template"
import { DarkPDFTemplate } from "./cv/general-resumes/dark-pdf-template"
import { GradientPDFTemplate } from "./cv/general-resumes/gradient-pdf-template"
import { TwoColumnPDFTemplate } from "./cv/general-resumes/two-column-pdf-template"
import { GradientGrayPDFTemplate } from "./cv/general-resumes/gradient-gray-pdf-template"
import { StandardCoverLetterPDFTemplate } from "./coverletter/standard-cover-letter-template"
import { ModernCoverLetterPDFTemplate } from "./coverletter/modern-cover-letter-template"
import { CreativeCoverLetterPDFTemplate } from "./coverletter/creative-cover-letter-template"
import { ProfessionalCoverLetterTemplate } from "./coverletter/professional-cover-letter-template"
import { ElegantCoverLetterTemplate } from "./coverletter/elegant-cover-letter-template"
import { DarkCoverLetterTemplate } from "./coverletter/dark-cover-letter-template"
import { GradientCoverLetterTemplate } from "./coverletter/gradient-cover-letter-template"
import { GermanLebenslaufTemplate } from "./cv/german-templates/GermanLebenslaufTemplate"
import { MultiColorfulGradientPDFTemplate } from "./cv/other-resume/RandomColourTemplate"

// Cover Letter PDF Templates

// Export all templates
export {
  // Resume templates
  ModernPDFTemplate,
  ClassicPDFTemplate,
  MinimalPDFTemplate,
  ProfessionalPDFTemplate,
  ElegantPDFTemplate,
  DarkPDFTemplate,
  GradientPDFTemplate,
  TwoColumnPDFTemplate,
  GradientGrayPDFTemplate,
  GermanLebenslaufTemplate,
  // Cover letter templates
  StandardCoverLetterPDFTemplate,
  ModernCoverLetterPDFTemplate,
  CreativeCoverLetterPDFTemplate,
  ProfessionalCoverLetterTemplate,
  ElegantCoverLetterTemplate,
  DarkCoverLetterTemplate,
  GradientCoverLetterTemplate,
  MultiColorfulGradientPDFTemplate
}

// Template Mappings - Resume
// Export this first to avoid circular dependency with types.ts
export const resumeTemplates = {
  modern: ModernPDFTemplate,
  classic: ClassicPDFTemplate,
  minimal: MinimalPDFTemplate,
  professional: ProfessionalPDFTemplate,
  elegant: ElegantPDFTemplate,
  dark: DarkPDFTemplate,
  gradient: GradientPDFTemplate,
  "two-column": TwoColumnPDFTemplate,
  "gradient-gray": GradientGrayPDFTemplate,
  "german-cv": GermanLebenslaufTemplate,
  "multi-colour" : MultiColorfulGradientPDFTemplate
} as const

// Template Mappings - Cover Letter
export const coverLetterTemplates = {
  standard: StandardCoverLetterPDFTemplate,
  modern: ModernCoverLetterPDFTemplate,
  creative: CreativeCoverLetterPDFTemplate,
  professional: ProfessionalCoverLetterTemplate,
  elegant: ElegantCoverLetterTemplate,
  dark: DarkCoverLetterTemplate,
  gradient: GradientCoverLetterTemplate,
} as const

// Get resume template by name
export function getResumeTemplate(templateName: string) {
  return resumeTemplates[templateName as keyof typeof resumeTemplates] || ModernPDFTemplate
}

// Get cover letter template by name
export function getCoverLetterTemplate(templateName: string) {
  return coverLetterTemplates[templateName as keyof typeof coverLetterTemplates] || StandardCoverLetterPDFTemplate
}
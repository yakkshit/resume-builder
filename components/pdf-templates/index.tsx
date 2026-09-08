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
import { GermanModernLebenslaufTemplate } from "./cv/german-templates/GermanModernLebenslaufTemplate"
import { GermanTealWaveTemplate } from "./cv/german-templates/GermanTealWaveTemplate"
import { GermanSlateSplitTemplate } from "./cv/german-templates/GermanSlateSplitTemplate"
import { GermanRoseGoldTemplate } from "./cv/german-templates/GermanRoseGoldTemplate"
import { GermanTimelineMinimalTemplate } from "./cv/german-templates/GermanTimelineMinimalTemplate"
import { GermanBurgundyDualTemplate } from "./cv/german-templates/GermanBurgundyDualTemplate"
import { IvyLeaguePDFTemplate } from "./cv/general-resumes/ivy-league-pdf-template"
import { MultiColorfulGradientPDFTemplate } from "./cv/other-resume/RandomColourTemplate"
import { MinimalCleanPDFTemplate } from "./cv/general-resumes/minimal-clean-pdf-template"
import { TechModernPDFTemplate } from "./cv/general-resumes/tech-modern-pdf-template"
import { MinimalCoverLetterPDFTemplate } from "./coverletter/minimal-cover-letter-template"
import { GermanAnschreibenTemplate } from "./coverletter/german-anschreiben-template"

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
  GermanModernLebenslaufTemplate,
  GermanTealWaveTemplate,
  GermanSlateSplitTemplate,
  GermanRoseGoldTemplate,
  GermanTimelineMinimalTemplate,
  GermanBurgundyDualTemplate,
  IvyLeaguePDFTemplate,
  MinimalCleanPDFTemplate,
  TechModernPDFTemplate,
  // Cover letter templates
  StandardCoverLetterPDFTemplate,
  ModernCoverLetterPDFTemplate,
  CreativeCoverLetterPDFTemplate,
  ProfessionalCoverLetterTemplate,
  ElegantCoverLetterTemplate,
  DarkCoverLetterTemplate,
  GradientCoverLetterTemplate,
  MinimalCoverLetterPDFTemplate,
  GermanAnschreibenTemplate,
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
  "german-modern": GermanModernLebenslaufTemplate,
  "german-teal-wave": GermanTealWaveTemplate,
  "german-slate-split": GermanSlateSplitTemplate,
  "german-rose-gold": GermanRoseGoldTemplate,
  "german-timeline-minimal": GermanTimelineMinimalTemplate,
  "german-burgundy-dual": GermanBurgundyDualTemplate,
  "ivy-league": IvyLeaguePDFTemplate,
  "engineering-ats": IvyLeaguePDFTemplate,
  "minimal-clean": MinimalCleanPDFTemplate,
  "tech-modern": TechModernPDFTemplate,
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
  "minimal": MinimalCoverLetterPDFTemplate,
  "german-anschreiben": GermanAnschreibenTemplate,
} as const

import React from "react"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData } from "@/lib/types"

function createSafeResumeTemplate(RawTemplate: any) {
  const SafeComponent = (props: { resumeData: ResumeData; [key: string]: any }) => {
    const safeData = sanitizeResumeData(props?.resumeData)
    return React.createElement(RawTemplate, { ...props, resumeData: safeData })
  }
  SafeComponent.displayName = `SafeTemplate(${RawTemplate.displayName || RawTemplate.name || "Template"})`
  return SafeComponent
}

// Get resume template by name
export function getResumeTemplate(templateName: string) {
  const raw = resumeTemplates[templateName as keyof typeof resumeTemplates] || ModernPDFTemplate
  return createSafeResumeTemplate(raw)
}

// Get cover letter template by name
export function getCoverLetterTemplate(templateName: string) {
  return coverLetterTemplates[templateName as keyof typeof coverLetterTemplates] || StandardCoverLetterPDFTemplate
}
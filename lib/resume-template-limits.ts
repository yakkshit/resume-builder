import type { ResumeData, Template } from "./types"

export interface SectionCharacterLimits {
  basicInfo: { maxCharacters: number; recommendedCharacters: number }
  summary: { maxCharacters: number; recommendedCharacters: number; maxWords: number; recommendedWords: number }
  experience: {
    maxPositions: number
    maxBulletsPerPosition: number
    maxCharactersPerBullet: number
    totalMaxCharacters: number
    recommendedTotalCharacters: number
  }
  education: {
    maxEntries: number
    totalMaxCharacters: number
    recommendedTotalCharacters: number
  }
  skills: {
    maxCount: number
    totalMaxCharacters: number
    recommendedTotalCharacters: number
  }
  projects: {
    maxCount: number
    maxBulletsPerProject: number
    totalMaxCharacters: number
    recommendedTotalCharacters: number
  }
}

export interface TemplatePageBudget {
  templateId: Template
  displayName: string
  layout: "single-column" | "two-column" | "timeline"
  hasPhoto: boolean
  /** Absolute maximum characters before text spills onto page 2 */
  maxCharacters: number
  /** Ideal character count for a balanced, aesthetic single-page layout */
  recommendedCharacters: number
  /** Absolute maximum words for a single page */
  maxWords: number
  /** Ideal word count */
  recommendedWords: number
  sectionLimits: SectionCharacterLimits
  styleNotes: string
}

/**
 * Exact 1-Page Character and Word Budgets for all PDF Resume Templates.
 * Derived from font sizes, line heights, margins, and layout column geometry in PDF rendering.
 */
export const RESUME_TEMPLATE_LIMITS: Record<Template, TemplatePageBudget> = {
  modern: {
    templateId: "modern",
    displayName: "Modern",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2400,
    recommendedCharacters: 2100,
    maxWords: 380,
    recommendedWords: 330,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 150 },
      summary: { maxCharacters: 280, recommendedCharacters: 220, maxWords: 45, recommendedWords: 35 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 130,
        totalMaxCharacters: 1250,
        recommendedTotalCharacters: 1050,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 12, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 380, recommendedTotalCharacters: 300 },
    },
    styleNotes: "Clean single-column layout with accent rule bars. Medium typography density.",
  },

  classic: {
    templateId: "classic",
    displayName: "Classic Serif",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2300,
    recommendedCharacters: 2000,
    maxWords: 360,
    recommendedWords: 310,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 140 },
      summary: { maxCharacters: 260, recommendedCharacters: 200, maxWords: 40, recommendedWords: 32 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1200,
        recommendedTotalCharacters: 1000,
      },
      education: { maxEntries: 2, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      skills: { maxCount: 10, totalMaxCharacters: 200, recommendedTotalCharacters: 160 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 360, recommendedTotalCharacters: 280 },
    },
    styleNotes: "Traditional serif styling with standard margins. Generous line-height consumes vertical space.",
  },

  minimal: {
    templateId: "minimal",
    displayName: "Minimalist",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2000,
    recommendedCharacters: 1750,
    maxWords: 310,
    recommendedWords: 270,
    sectionLimits: {
      basicInfo: { maxCharacters: 160, recommendedCharacters: 130 },
      summary: { maxCharacters: 220, recommendedCharacters: 170, maxWords: 35, recommendedWords: 28 },
      experience: {
        maxPositions: 2,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 120,
        totalMaxCharacters: 1050,
        recommendedTotalCharacters: 880,
      },
      education: { maxEntries: 2, totalMaxCharacters: 190, recommendedTotalCharacters: 150 },
      skills: { maxCount: 10, totalMaxCharacters: 180, recommendedTotalCharacters: 140 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 320, recommendedTotalCharacters: 250 },
    },
    styleNotes: "High whitespace with generous padding. Requires concise, high-impact phrasing.",
  },

  professional: {
    templateId: "professional",
    displayName: "Professional Corporate",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2700,
    recommendedCharacters: 2400,
    maxWords: 430,
    recommendedWords: 380,
    sectionLimits: {
      basicInfo: { maxCharacters: 200, recommendedCharacters: 160 },
      summary: { maxCharacters: 320, recommendedCharacters: 250, maxWords: 50, recommendedWords: 40 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 4,
        maxCharactersPerBullet: 140,
        totalMaxCharacters: 1450,
        recommendedTotalCharacters: 1250,
      },
      education: { maxEntries: 2, totalMaxCharacters: 240, recommendedTotalCharacters: 190 },
      skills: { maxCount: 14, totalMaxCharacters: 260, recommendedTotalCharacters: 200 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 420, recommendedTotalCharacters: 330 },
    },
    styleNotes: "Tight corporate layout with compact headers. High information capacity.",
  },

  elegant: {
    templateId: "elegant",
    displayName: "Executive Elegant",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2100,
    recommendedCharacters: 1850,
    maxWords: 330,
    recommendedWords: 290,
    sectionLimits: {
      basicInfo: { maxCharacters: 170, recommendedCharacters: 140 },
      summary: { maxCharacters: 240, recommendedCharacters: 190, maxWords: 38, recommendedWords: 30 },
      experience: {
        maxPositions: 2,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1100,
        recommendedTotalCharacters: 920,
      },
      education: { maxEntries: 2, totalMaxCharacters: 200, recommendedTotalCharacters: 160 },
      skills: { maxCount: 10, totalMaxCharacters: 190, recommendedTotalCharacters: 150 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 330, recommendedTotalCharacters: 260 },
    },
    styleNotes: "Wide margins, airy letterspacing, and elegant serif typography.",
  },

  dark: {
    templateId: "dark",
    displayName: "Dark Mode",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2350,
    recommendedCharacters: 2050,
    maxWords: 370,
    recommendedWords: 325,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 150 },
      summary: { maxCharacters: 270, recommendedCharacters: 210, maxWords: 42, recommendedWords: 34 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 130,
        totalMaxCharacters: 1220,
        recommendedTotalCharacters: 1020,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 12, totalMaxCharacters: 210, recommendedTotalCharacters: 165 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 370, recommendedTotalCharacters: 290 },
    },
    styleNotes: "Dark slate background with white text and high-contrast section badges.",
  },

  gradient: {
    templateId: "gradient",
    displayName: "Gradient Accent",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2250,
    recommendedCharacters: 1950,
    maxWords: 350,
    recommendedWords: 310,
    sectionLimits: {
      basicInfo: { maxCharacters: 170, recommendedCharacters: 140 },
      summary: { maxCharacters: 260, recommendedCharacters: 200, maxWords: 40, recommendedWords: 32 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1180,
        recommendedTotalCharacters: 980,
      },
      education: { maxEntries: 2, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      skills: { maxCount: 11, totalMaxCharacters: 200, recommendedTotalCharacters: 160 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 350, recommendedTotalCharacters: 280 },
    },
    styleNotes: "Features a prominent top gradient hero banner consuming ~12% page height.",
  },

  "two-column": {
    templateId: "two-column",
    displayName: "Two Column Split",
    layout: "two-column",
    hasPhoto: false,
    maxCharacters: 2900,
    recommendedCharacters: 2600,
    maxWords: 460,
    recommendedWords: 410,
    sectionLimits: {
      basicInfo: { maxCharacters: 210, recommendedCharacters: 170 },
      summary: { maxCharacters: 340, recommendedCharacters: 270, maxWords: 52, recommendedWords: 42 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 4,
        maxCharactersPerBullet: 135,
        totalMaxCharacters: 1500,
        recommendedTotalCharacters: 1300,
      },
      education: { maxEntries: 2, totalMaxCharacters: 260, recommendedTotalCharacters: 200 },
      skills: { maxCount: 16, totalMaxCharacters: 300, recommendedTotalCharacters: 230 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 440, recommendedTotalCharacters: 350 },
    },
    styleNotes: "Split layout (32% left sidebar + 68% main column). Parallel vertical channels allow higher density.",
  },

  "gradient-gray": {
    templateId: "gradient-gray",
    displayName: "Gradient Gray",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2350,
    recommendedCharacters: 2050,
    maxWords: 370,
    recommendedWords: 325,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 150 },
      summary: { maxCharacters: 270, recommendedCharacters: 210, maxWords: 42, recommendedWords: 34 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 130,
        totalMaxCharacters: 1220,
        recommendedTotalCharacters: 1020,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 12, totalMaxCharacters: 210, recommendedTotalCharacters: 165 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 370, recommendedTotalCharacters: 290 },
    },
    styleNotes: "Monochrome grayscale layout with subtle gradient headers.",
  },

  "german-cv": {
    templateId: "german-cv",
    displayName: "German Standard Lebenslauf",
    layout: "single-column",
    hasPhoto: true,
    maxCharacters: 2200,
    recommendedCharacters: 1900,
    maxWords: 340,
    recommendedWords: 300,
    sectionLimits: {
      basicInfo: { maxCharacters: 200, recommendedCharacters: 160 },
      summary: { maxCharacters: 240, recommendedCharacters: 180, maxWords: 38, recommendedWords: 30 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 120,
        totalMaxCharacters: 1150,
        recommendedTotalCharacters: 950,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 12, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      projects: { maxCount: 1, maxBulletsPerProject: 2, totalMaxCharacters: 320, recommendedTotalCharacters: 240 },
    },
    styleNotes: "DIN 5008 German CV with applicant portrait frame. Photo slot reduces total body space.",
  },

  "german-modern": {
    templateId: "german-modern",
    displayName: "German Modern Lebenslauf",
    layout: "single-column",
    hasPhoto: true,
    maxCharacters: 2350,
    recommendedCharacters: 2050,
    maxWords: 360,
    recommendedWords: 320,
    sectionLimits: {
      basicInfo: { maxCharacters: 190, recommendedCharacters: 150 },
      summary: { maxCharacters: 260, recommendedCharacters: 200, maxWords: 40, recommendedWords: 32 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1220,
        recommendedTotalCharacters: 1020,
      },
      education: { maxEntries: 2, totalMaxCharacters: 230, recommendedTotalCharacters: 180 },
      skills: { maxCount: 12, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 360, recommendedTotalCharacters: 280 },
    },
    styleNotes: "Modern German Lebenslauf with photo slot and structured date columns.",
  },

  "german-teal-wave": {
    templateId: "german-teal-wave",
    displayName: "German Teal Wave",
    layout: "single-column",
    hasPhoto: true,
    maxCharacters: 2250,
    recommendedCharacters: 1950,
    maxWords: 350,
    recommendedWords: 310,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 150 },
      summary: { maxCharacters: 250, recommendedCharacters: 190, maxWords: 38, recommendedWords: 30 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1180,
        recommendedTotalCharacters: 980,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 11, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 350, recommendedTotalCharacters: 270 },
    },
    styleNotes: "Teal wave header banner with circular applicant portrait.",
  },

  "german-slate-split": {
    templateId: "german-slate-split",
    displayName: "German Slate Split",
    layout: "two-column",
    hasPhoto: true,
    maxCharacters: 2800,
    recommendedCharacters: 2500,
    maxWords: 440,
    recommendedWords: 390,
    sectionLimits: {
      basicInfo: { maxCharacters: 200, recommendedCharacters: 160 },
      summary: { maxCharacters: 320, recommendedCharacters: 250, maxWords: 50, recommendedWords: 40 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 135,
        totalMaxCharacters: 1450,
        recommendedTotalCharacters: 1250,
      },
      education: { maxEntries: 2, totalMaxCharacters: 260, recommendedTotalCharacters: 200 },
      skills: { maxCount: 14, totalMaxCharacters: 280, recommendedTotalCharacters: 220 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 420, recommendedTotalCharacters: 330 },
    },
    styleNotes: "Split 35/65 dual-column German layout with photo embedded in dark slate sidebar.",
  },

  "german-rose-gold": {
    templateId: "german-rose-gold",
    displayName: "German Rose Gold",
    layout: "single-column",
    hasPhoto: true,
    maxCharacters: 2300,
    recommendedCharacters: 2000,
    maxWords: 360,
    recommendedWords: 315,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 150 },
      summary: { maxCharacters: 260, recommendedCharacters: 200, maxWords: 40, recommendedWords: 32 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1200,
        recommendedTotalCharacters: 1000,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 12, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 360, recommendedTotalCharacters: 280 },
    },
    styleNotes: "Rose gold accented headings with applicant portrait frame.",
  },

  "german-timeline-minimal": {
    templateId: "german-timeline-minimal",
    displayName: "German Timeline Minimal",
    layout: "timeline",
    hasPhoto: false,
    maxCharacters: 2100,
    recommendedCharacters: 1800,
    maxWords: 330,
    recommendedWords: 290,
    sectionLimits: {
      basicInfo: { maxCharacters: 170, recommendedCharacters: 140 },
      summary: { maxCharacters: 240, recommendedCharacters: 180, maxWords: 38, recommendedWords: 30 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 2,
        maxCharactersPerBullet: 120,
        totalMaxCharacters: 1100,
        recommendedTotalCharacters: 900,
      },
      education: { maxEntries: 2, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      skills: { maxCount: 10, totalMaxCharacters: 190, recommendedTotalCharacters: 150 },
      projects: { maxCount: 1, maxBulletsPerProject: 2, totalMaxCharacters: 320, recommendedTotalCharacters: 250 },
    },
    styleNotes: "Continuous vertical timeline connecting experience nodes. Node dots take extra vertical height.",
  },

  "german-burgundy-dual": {
    templateId: "german-burgundy-dual",
    displayName: "German Burgundy Dual",
    layout: "two-column",
    hasPhoto: true,
    maxCharacters: 2850,
    recommendedCharacters: 2550,
    maxWords: 450,
    recommendedWords: 400,
    sectionLimits: {
      basicInfo: { maxCharacters: 210, recommendedCharacters: 170 },
      summary: { maxCharacters: 330, recommendedCharacters: 260, maxWords: 50, recommendedWords: 40 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 4,
        maxCharactersPerBullet: 135,
        totalMaxCharacters: 1480,
        recommendedTotalCharacters: 1280,
      },
      education: { maxEntries: 2, totalMaxCharacters: 260, recommendedTotalCharacters: 200 },
      skills: { maxCount: 15, totalMaxCharacters: 290, recommendedTotalCharacters: 220 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 430, recommendedTotalCharacters: 340 },
    },
    styleNotes: "Executive German dual-column CV with burgundy sidebar and portrait container.",
  },

  "ivy-league": {
    templateId: "ivy-league",
    displayName: "Ivy League ATS",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2950,
    recommendedCharacters: 2650,
    maxWords: 480,
    recommendedWords: 430,
    sectionLimits: {
      basicInfo: { maxCharacters: 200, recommendedCharacters: 160 },
      summary: { maxCharacters: 340, recommendedCharacters: 270, maxWords: 55, recommendedWords: 42 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 4,
        maxCharactersPerBullet: 145,
        totalMaxCharacters: 1550,
        recommendedTotalCharacters: 1350,
      },
      education: { maxEntries: 2, totalMaxCharacters: 260, recommendedTotalCharacters: 200 },
      skills: { maxCount: 16, totalMaxCharacters: 300, recommendedTotalCharacters: 230 },
      projects: { maxCount: 2, maxBulletsPerProject: 3, totalMaxCharacters: 450, recommendedTotalCharacters: 360 },
    },
    styleNotes: "Harvard/Stanford ATS standard. Compact 0.5-inch margins and tight leading yield highest single-column density.",
  },

  "engineering-ats": {
    templateId: "engineering-ats",
    displayName: "Engineering ATS",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2950,
    recommendedCharacters: 2650,
    maxWords: 480,
    recommendedWords: 430,
    sectionLimits: {
      basicInfo: { maxCharacters: 200, recommendedCharacters: 160 },
      summary: { maxCharacters: 340, recommendedCharacters: 270, maxWords: 55, recommendedWords: 42 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 4,
        maxCharactersPerBullet: 145,
        totalMaxCharacters: 1550,
        recommendedTotalCharacters: 1350,
      },
      education: { maxEntries: 2, totalMaxCharacters: 260, recommendedTotalCharacters: 200 },
      skills: { maxCount: 16, totalMaxCharacters: 300, recommendedTotalCharacters: 230 },
      projects: { maxCount: 2, maxBulletsPerProject: 3, totalMaxCharacters: 450, recommendedTotalCharacters: 360 },
    },
    styleNotes: "MIT/Stanford engineering ATS layout. Dense monospace accents and maximized printable surface area.",
  },

  "minimal-clean": {
    templateId: "minimal-clean",
    displayName: "Minimal Clean",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2250,
    recommendedCharacters: 1950,
    maxWords: 350,
    recommendedWords: 310,
    sectionLimits: {
      basicInfo: { maxCharacters: 170, recommendedCharacters: 140 },
      summary: { maxCharacters: 250, recommendedCharacters: 190, maxWords: 38, recommendedWords: 30 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1180,
        recommendedTotalCharacters: 980,
      },
      education: { maxEntries: 2, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      skills: { maxCount: 11, totalMaxCharacters: 200, recommendedTotalCharacters: 160 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 350, recommendedTotalCharacters: 270 },
    },
    styleNotes: "Clean sans-serif design with crisp borders and balanced whitespace.",
  },

  "tech-modern": {
    templateId: "tech-modern",
    displayName: "Tech Modern",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2500,
    recommendedCharacters: 2200,
    maxWords: 400,
    recommendedWords: 350,
    sectionLimits: {
      basicInfo: { maxCharacters: 190, recommendedCharacters: 150 },
      summary: { maxCharacters: 300, recommendedCharacters: 230, maxWords: 45, recommendedWords: 35 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 135,
        totalMaxCharacters: 1320,
        recommendedTotalCharacters: 1120,
      },
      education: { maxEntries: 2, totalMaxCharacters: 230, recommendedTotalCharacters: 180 },
      skills: { maxCount: 14, totalMaxCharacters: 250, recommendedTotalCharacters: 190 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 400, recommendedTotalCharacters: 310 },
    },
    styleNotes: "Software engineer focus with pill-style skill badges and tech tags.",
  },

  "multi-colour": {
    templateId: "multi-colour",
    displayName: "Multi-Colour Creative",
    layout: "single-column",
    hasPhoto: false,
    maxCharacters: 2350,
    recommendedCharacters: 2050,
    maxWords: 370,
    recommendedWords: 325,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 150 },
      summary: { maxCharacters: 270, recommendedCharacters: 210, maxWords: 42, recommendedWords: 34 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 130,
        totalMaxCharacters: 1220,
        recommendedTotalCharacters: 1020,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 12, totalMaxCharacters: 210, recommendedTotalCharacters: 165 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 370, recommendedTotalCharacters: 290 },
    },
    styleNotes: "Dynamic multi-color accent stripes and colorful skill pill badges.",
  },

  "german-forest-slate": {
    templateId: "german-forest-slate",
    displayName: "German Forest Slate",
    layout: "two-column",
    hasPhoto: true,
    maxCharacters: 2650,
    recommendedCharacters: 2300,
    maxWords: 410,
    recommendedWords: 350,
    sectionLimits: {
      basicInfo: { maxCharacters: 200, recommendedCharacters: 160 },
      summary: { maxCharacters: 320, recommendedCharacters: 250, maxWords: 50, recommendedWords: 40 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 135,
        totalMaxCharacters: 1350,
        recommendedTotalCharacters: 1100,
      },
      education: { maxEntries: 2, totalMaxCharacters: 230, recommendedTotalCharacters: 180 },
      skills: { maxCount: 14, totalMaxCharacters: 260, recommendedTotalCharacters: 200 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 360, recommendedTotalCharacters: 280 },
    },
    styleNotes: "Simon Heinz German engineering layout: forest-green banner header, dark charcoal sidebar, forest-green section badges.",
  },

  "pokemon-trainer": {
    templateId: "pokemon-trainer",
    displayName: "Pokémon Trainer Card",
    layout: "single-column",
    hasPhoto: true,
    maxCharacters: 2250,
    recommendedCharacters: 1950,
    maxWords: 360,
    recommendedWords: 310,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 140 },
      summary: { maxCharacters: 280, recommendedCharacters: 220, maxWords: 44, recommendedWords: 35 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 125,
        totalMaxCharacters: 1200,
        recommendedTotalCharacters: 1000,
      },
      education: { maxEntries: 2, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      skills: { maxCount: 12, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 350, recommendedTotalCharacters: 270 },
    },
    styleNotes: "Anime Pokémon trainer card with Pokéball badge accents, level borders, and elemental pill chips.",
  },

  "wizarding-scroll": {
    templateId: "wizarding-scroll",
    displayName: "Wizarding Scroll",
    layout: "two-column",
    hasPhoto: true,
    maxCharacters: 2400,
    recommendedCharacters: 2100,
    maxWords: 380,
    recommendedWords: 320,
    sectionLimits: {
      basicInfo: { maxCharacters: 190, recommendedCharacters: 150 },
      summary: { maxCharacters: 290, recommendedCharacters: 230, maxWords: 45, recommendedWords: 36 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 130,
        totalMaxCharacters: 1250,
        recommendedTotalCharacters: 1050,
      },
      education: { maxEntries: 2, totalMaxCharacters: 220, recommendedTotalCharacters: 170 },
      skills: { maxCount: 12, totalMaxCharacters: 230, recommendedTotalCharacters: 175 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 360, recommendedTotalCharacters: 280 },
    },
    styleNotes: "Hogwarts wizarding parchment scroll with gothic calligraphy headers, wand & crest ornaments, and quill illustrations.",
  },

  "retro-pokedex": {
    templateId: "retro-pokedex",
    displayName: "Retro Pokédex",
    layout: "two-column",
    hasPhoto: true,
    maxCharacters: 2250,
    recommendedCharacters: 1950,
    maxWords: 360,
    recommendedWords: 310,
    sectionLimits: {
      basicInfo: { maxCharacters: 180, recommendedCharacters: 140 },
      summary: { maxCharacters: 280, recommendedCharacters: 210, maxWords: 42, recommendedWords: 33 },
      experience: {
        maxPositions: 3,
        maxBulletsPerPosition: 3,
        maxCharactersPerBullet: 120,
        totalMaxCharacters: 1180,
        recommendedTotalCharacters: 980,
      },
      education: { maxEntries: 2, totalMaxCharacters: 210, recommendedTotalCharacters: 160 },
      skills: { maxCount: 12, totalMaxCharacters: 210, recommendedTotalCharacters: 165 },
      projects: { maxCount: 2, maxBulletsPerProject: 2, totalMaxCharacters: 340, recommendedTotalCharacters: 260 },
    },
    styleNotes: "Retro GameBoy / Pokédex UI with pixel-art LCD framing, pixel badges, and retro gaming font styling.",
  },
}

export interface ResumeMetrics {
  totalCharacters: number
  totalWords: number
  sections: {
    basicInfo: number
    summary: number
    experience: number
    education: number
    skills: number
    projects: number
    achievements: number
  }
  counts: {
    experiencePositions: number
    experienceBullets: number
    educationEntries: number
    skillsCount: number
    projectsCount: number
    achievementsCount: number
  }
  longestBulletCharacters: { text: string; length: number; roleIndex: number } | null
}

/**
 * Calculates raw character and word counts for resume data.
 */
export function calculateResumeMetrics(resume: Partial<ResumeData> | null | undefined): ResumeMetrics {
  if (!resume || typeof resume !== "object") {
    return {
      totalCharacters: 0,
      totalWords: 0,
      sections: { basicInfo: 0, summary: 0, experience: 0, education: 0, skills: 0, projects: 0, achievements: 0 },
      counts: { experiencePositions: 0, experienceBullets: 0, educationEntries: 0, skillsCount: 0, projectsCount: 0, achievementsCount: 0 },
      longestBulletCharacters: null,
    }
  }

  const basic = (resume.basicInfo || {}) as any
  const basicText = [
    basic.name || "",
    basic.title || "",
    basic.email || "",
    basic.phone || "",
    basic.location || "",
    basic.website || "",
    basic.linkedin || "",
  ].join(" ").trim()

  const summaryText = (basic.summary || "").trim()

  const expList = Array.isArray(resume.experience) ? resume.experience : []
  let expText = ""
  let expBulletCount = 0
  let longestBullet: { text: string; length: number; roleIndex: number } | null = null

  expList.forEach((exp, rIdx) => {
    expText += ` ${exp.position || ""} ${exp.company || ""} ${exp.startDate || ""} ${exp.endDate || ""} ${exp.description || ""}`
    const highlights = Array.isArray(exp.highlights) ? exp.highlights : []
    highlights.forEach((h) => {
      const bulletStr = String(h || "").trim()
      if (bulletStr) {
        expBulletCount++
        expText += ` ${bulletStr}`
        if (!longestBullet || bulletStr.length > longestBullet.length) {
          longestBullet = { text: bulletStr, length: bulletStr.length, roleIndex: rIdx }
        }
      }
    })
  })

  const eduList = Array.isArray(resume.education) ? resume.education : []
  let eduText = ""
  eduList.forEach((edu) => {
    eduText += ` ${edu.institution || ""} ${edu.degree || ""} ${edu.field || ""} ${edu.startDate || ""} ${edu.endDate || ""} ${edu.gpa || ""}`
  })

  const skillsList = Array.isArray(resume.skills) ? resume.skills : []
  const skillsText = skillsList.join(", ")

  const projList = Array.isArray(resume.projects) ? resume.projects : []
  let projText = ""
  projList.forEach((p) => {
    projText += ` ${p.name || ""} ${p.description || ""} ${(p.technologies || []).join(" ")}`
  })

  const achList = Array.isArray(resume.achievements) ? resume.achievements : []
  let achText = ""
  achList.forEach((a) => {
    achText += ` ${a.title || ""} ${a.description || ""} ${a.date || ""}`
  })

  const fullCombinedText = [basicText, summaryText, expText, eduText, skillsText, projText, achText].join(" ").replace(/\s+/g, " ").trim()
  const words = fullCombinedText ? fullCombinedText.split(/\s+/).length : 0

  return {
    totalCharacters: fullCombinedText.length,
    totalWords: words,
    sections: {
      basicInfo: basicText.length,
      summary: summaryText.length,
      experience: expText.trim().length,
      education: eduText.trim().length,
      skills: skillsText.length,
      projects: projText.trim().length,
      achievements: achText.trim().length,
    },
    counts: {
      experiencePositions: expList.length,
      experienceBullets: expBulletCount,
      educationEntries: eduList.length,
      skillsCount: skillsList.length,
      projectsCount: projList.length,
      achievementsCount: achList.length,
    },
    longestBulletCharacters: longestBullet,
  }
}

export interface PageBudgetEvaluation {
  templateId: Template
  templateName: string
  targetPages: number
  totalCharacters: number
  totalWords: number
  maxCharacters: number
  recommendedCharacters: number
  characterUsagePercent: number
  overflowCharacters: number
  isOnePageCompliant: boolean
  status: "optimal" | "under-budget" | "warning-overflow" | "critical-overflow"
  sectionBreakdown: {
    basicInfo: { count: number; max: number; status: "ok" | "overflow" }
    summary: { count: number; max: number; words: number; maxWords: number; status: "ok" | "overflow" }
    experience: {
      count: number
      max: number
      positions: number
      maxPositions: number
      bullets: number
      status: "ok" | "overflow"
    }
    education: { count: number; max: number; entries: number; maxEntries: number; status: "ok" | "overflow" }
    skills: { count: number; max: number; skillCount: number; maxSkills: number; status: "ok" | "overflow" }
    projects: { count: number; max: number; countItems: number; maxItems: number; status: "ok" | "overflow" }
  }
  actionableTrimmingSuggestions: string[]
  modelSelfTrainingFeedback: string
}

/**
 * Validates a resume's fit against a specific PDF template's single-page budget.
 * Emits actionable feedback for model self-correction / RLHF training.
 */
export function validateTemplatePageBudget(
  resume: Partial<ResumeData> | null | undefined,
  templateId: string = "modern",
  targetPages: number = 1
): PageBudgetEvaluation {
  const safeTemplate = (templateId in RESUME_TEMPLATE_LIMITS ? templateId : "modern") as Template
  const budget = RESUME_TEMPLATE_LIMITS[safeTemplate]
  const metrics = calculateResumeMetrics(resume)

  // Scale limits if targetPages > 1 (e.g. 2 pages)
  const multiplier = targetPages === 1 ? 1 : targetPages * 0.95 // slight consolidation factor on page 2
  const effectiveMaxChars = Math.round(budget.maxCharacters * multiplier)
  const effectiveRecChars = Math.round(budget.recommendedCharacters * multiplier)

  const overflowChars = Math.max(0, metrics.totalCharacters - effectiveMaxChars)
  const usagePercent = effectiveMaxChars > 0 ? Math.round((metrics.totalCharacters / effectiveMaxChars) * 100) : 0
  const isOnePageCompliant = metrics.totalCharacters <= effectiveMaxChars

  let status: PageBudgetEvaluation["status"] = "optimal"
  if (usagePercent < 75) {
    status = "under-budget"
  } else if (usagePercent <= 100) {
    status = "optimal"
  } else if (usagePercent <= 112) {
    status = "warning-overflow"
  } else {
    status = "critical-overflow"
  }

  const sLimits = budget.sectionLimits

  const sectionBreakdown: PageBudgetEvaluation["sectionBreakdown"] = {
    basicInfo: {
      count: metrics.sections.basicInfo,
      max: sLimits.basicInfo.maxCharacters,
      status: metrics.sections.basicInfo > sLimits.basicInfo.maxCharacters ? "overflow" : "ok",
    },
    summary: {
      count: metrics.sections.summary,
      max: sLimits.summary.maxCharacters * multiplier,
      words: metrics.sections.summary > 0 ? (resume?.basicInfo?.summary || "").trim().split(/\s+/).length : 0,
      maxWords: sLimits.summary.maxWords * multiplier,
      status: metrics.sections.summary > sLimits.summary.maxCharacters * multiplier ? "overflow" : "ok",
    },
    experience: {
      count: metrics.sections.experience,
      max: sLimits.experience.totalMaxCharacters * multiplier,
      positions: metrics.counts.experiencePositions,
      maxPositions: sLimits.experience.maxPositions * multiplier,
      bullets: metrics.counts.experienceBullets,
      status:
        metrics.sections.experience > sLimits.experience.totalMaxCharacters * multiplier ||
        metrics.counts.experiencePositions > sLimits.experience.maxPositions * multiplier
          ? "overflow"
          : "ok",
    },
    education: {
      count: metrics.sections.education,
      max: sLimits.education.totalMaxCharacters * multiplier,
      entries: metrics.counts.educationEntries,
      maxEntries: sLimits.education.maxEntries * multiplier,
      status: metrics.sections.education > sLimits.education.totalMaxCharacters * multiplier ? "overflow" : "ok",
    },
    skills: {
      count: metrics.sections.skills,
      max: sLimits.skills.totalMaxCharacters * multiplier,
      skillCount: metrics.counts.skillsCount,
      maxSkills: sLimits.skills.maxCount * multiplier,
      status: metrics.sections.skills > sLimits.skills.totalMaxCharacters * multiplier ? "overflow" : "ok",
    },
    projects: {
      count: metrics.sections.projects,
      max: sLimits.projects.totalMaxCharacters * multiplier,
      countItems: metrics.counts.projectsCount,
      maxItems: sLimits.projects.maxCount * multiplier,
      status: metrics.sections.projects > sLimits.projects.totalMaxCharacters * multiplier ? "overflow" : "ok",
    },
  }

  // Construct concrete, actionable trimming suggestions
  const suggestions: string[] = []

  if (overflowChars > 0) {
    if (sectionBreakdown.summary.status === "overflow") {
      const trimSummaryChars = metrics.sections.summary - sLimits.summary.recommendedCharacters
      suggestions.push(
        `Trim summary from ${metrics.sections.summary} chars (${sectionBreakdown.summary.words} words) down to ~${sLimits.summary.recommendedCharacters} chars (2–3 sentences, ~${sLimits.summary.recommendedWords} words). Saves ~${trimSummaryChars} chars.`
      )
    }

    if (metrics.counts.experiencePositions > sLimits.experience.maxPositions * multiplier) {
      suggestions.push(
        `Reduce work history to the top ${sLimits.experience.maxPositions * multiplier} most relevant roles (currently ${metrics.counts.experiencePositions}). Omit older or less relevant positions.`
      )
    }

    if (metrics.counts.experienceBullets > sLimits.experience.maxPositions * sLimits.experience.maxBulletsPerPosition * multiplier) {
      const excessBullets = metrics.counts.experienceBullets - sLimits.experience.maxPositions * sLimits.experience.maxBulletsPerPosition * multiplier
      suggestions.push(
        `Limit experience highlights to 2–3 quantified bullet points per role (currently ${metrics.counts.experienceBullets} total bullets). Remove ${excessBullets} lower-impact bullets.`
      )
    }

    if (metrics.longestBulletCharacters && metrics.longestBulletCharacters.length > sLimits.experience.maxCharactersPerBullet) {
      suggestions.push(
        `Shorten overly verbose bullet point in role #${metrics.longestBulletCharacters.roleIndex + 1} (${metrics.longestBulletCharacters.length} chars). Target under ${sLimits.experience.maxCharactersPerBullet} chars per bullet.`
      )
    }

    if (metrics.counts.projectsCount > sLimits.projects.maxCount * multiplier) {
      suggestions.push(
        `Limit featured projects to top ${sLimits.projects.maxCount * multiplier} most impressive items (currently ${metrics.counts.projectsCount} projects).`
      )
    }

    if (metrics.counts.skillsCount > sLimits.skills.maxCount * multiplier) {
      suggestions.push(
        `Condense skills list to ${sLimits.skills.maxCount * multiplier} high-signal keywords (currently ${metrics.counts.skillsCount}). Group or remove generic skills.`
      )
    }

    if (suggestions.length === 0) {
      suggestions.push(`Overall text exceeds budget by ${overflowChars} chars. Reduce overall bullet lengths by 10–15% across all roles.`)
    }
  } else if (usagePercent < 65) {
    suggestions.push(
      `Under budget (${usagePercent}% of single-page capacity). You can safely expand the summary, add 1 more achievement bullet per role, or detail key project technologies to fill the page attractively.`
    )
  } else {
    suggestions.push(`Optimal single-page fit (${usagePercent}% capacity). Layout will render cleanly on 1 page without spillover.`)
  }

  // Model Self-Training Feedback block
  let feedbackText = ""
  if (isOnePageCompliant) {
    feedbackText = `[1-PAGE TEMPLATE FIT: COMPLIANT]
Template: "${budget.displayName}" (${budget.templateId})
Layout Type: ${budget.layout} | Has Photo: ${budget.hasPhoto}
Character Usage: ${metrics.totalCharacters} / ${effectiveMaxChars} characters (${usagePercent}%)
Word Count: ${metrics.totalWords} / ${effectiveMaxWords(budget, multiplier)} words
Verdict: PERFECT 1-PAGE FIT. Generates exactly 1 balanced page without overflowing onto page 2.`
  } else {
    feedbackText = `[1-PAGE TEMPLATE FIT: OVERFLOW DETECTED - SELF-TRAINING FEEDBACK]
Template: "${budget.displayName}" (${budget.templateId})
Layout Type: ${budget.layout} | Has Photo: ${budget.hasPhoto}
Character Count: ${metrics.totalCharacters} characters (Budget: ${effectiveMaxChars} max, Exceeded by: +${overflowChars} chars)
Word Count: ${metrics.totalWords} words (Budget: ${effectiveMaxWords(budget, multiplier)} max words)
Section Usage:
- Summary: ${metrics.sections.summary} chars (Max: ${sLimits.summary.maxCharacters}) -> ${sectionBreakdown.summary.status}
- Experience: ${metrics.sections.experience} chars, ${metrics.counts.experiencePositions} roles, ${metrics.counts.experienceBullets} bullets (Max: ${sLimits.experience.totalMaxCharacters} chars, ${sLimits.experience.maxPositions} roles) -> ${sectionBreakdown.experience.status}
- Education: ${metrics.sections.education} chars, ${metrics.counts.educationEntries} entries (Max: ${sLimits.education.totalMaxCharacters}) -> ${sectionBreakdown.education.status}
- Skills: ${metrics.sections.skills} chars, ${metrics.counts.skillsCount} skills (Max: ${sLimits.skills.totalMaxCharacters}) -> ${sectionBreakdown.skills.status}
- Projects: ${metrics.sections.projects} chars, ${metrics.counts.projectsCount} projects (Max: ${sLimits.projects.totalMaxCharacters}) -> ${sectionBreakdown.projects.status}

ACTIONABLE TRIMMING INSTRUCTIONS FOR 1-PAGE RE-GENERATION:
${suggestions.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}

MODEL SELF-CORRECTION DIRECTIVE:
Re-emit the \`\`\`component:cv block trimming precisely ${overflowChars} characters according to the recommendations above so the final resume fits on exactly 1 page.`
  }

  return {
    templateId: safeTemplate,
    templateName: budget.displayName,
    targetPages,
    totalCharacters: metrics.totalCharacters,
    totalWords: metrics.totalWords,
    maxCharacters: effectiveMaxChars,
    recommendedCharacters: effectiveRecChars,
    characterUsagePercent: usagePercent,
    overflowCharacters: overflowChars,
    isOnePageCompliant,
    status,
    sectionBreakdown,
    actionableTrimmingSuggestions: suggestions,
    modelSelfTrainingFeedback: feedbackText,
  }
}

function effectiveMaxWords(b: TemplatePageBudget, multiplier: number): number {
  return Math.round(b.maxWords * multiplier)
}

/**
 * Returns a markdown reference table of all template 1-page limits for AI prompt injection.
 */
export function getTemplateCapacityCheatSheetMarkdown(): string {
  const rows = Object.values(RESUME_TEMPLATE_LIMITS).map((t) => {
    return `| \`${t.templateId}\` | ${t.displayName} | ${t.layout} | ${t.hasPhoto ? "Yes" : "No"} | **${t.maxCharacters.toLocaleString()}** | ${t.recommendedCharacters.toLocaleString()} | ~${t.maxWords} | 2–3 roles (2–3 bullets/role) |`
  })

  return `### Template 1-Page Character & Word Capacity Matrix:
| Template ID | Name | Layout | Photo? | 1-Page Max Chars | Ideal Chars | Max Words | Recommended Density |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|
${rows.join("\n")}

#### 1-Page Generation Rules for AI Models:
1. **Never exceed the template's 1-Page Max Chars** when user requests a 1-page resume. Exceeding creates an unwanted second page with 2–4 trailing lines.
2. **Density Calibration**:
   - Single-column high density (\`ivy-league\`, \`engineering-ats\`, \`professional\`): Can accept up to 2,700–2,950 characters.
   - Two-column split (\`two-column\`, \`german-slate-split\`, \`german-burgundy-dual\`): Can accept up to 2,800–2,900 characters because sidebar and main column run in parallel.
   - Clean / Airy templates (\`minimal\`, \`elegant\`, \`german-timeline-minimal\`): Strictly capped at 2,000–2,100 characters.
3. **If incoming user career data is too extensive**:
   - Curate only the top 2–3 most relevant positions.
   - Restrict to 2–3 high-impact quantified bullets per position (110–130 chars each).
   - Cap summary to 2–3 sentences (180–250 chars).
   - Cap skills to 10–14 relevant keywords.`
}

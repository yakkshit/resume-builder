import React from "react";

export interface ResumeSectionTitles {
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  achievements: string;
  languages: string;
  contact: string;
  portfolio: string;
  present: string;
  email: string;
  phone: string;
  location: string;
}

export const RESUME_TITLES_BY_LANGUAGE: Record<string, ResumeSectionTitles> = {
  en: {
    summary: "Summary",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    achievements: "Achievements",
    languages: "Languages",
    contact: "Contact",
    portfolio: "Portfolio",
    present: "Present",
    email: "Email:",
    phone: "Phone:",
    location: "Location:",
  },
  de: {
    summary: "Zusammenfassung",
    experience: "Berufserfahrung",
    education: "Ausbildung",
    skills: "Fähigkeiten",
    projects: "Projekte",
    achievements: "Zertifikate & Erfolge",
    languages: "Sprachen",
    contact: "Kontakt",
    portfolio: "Portfolio",
    present: "Heute",
    email: "E-Mail:",
    phone: "Telefon:",
    location: "Standort:",
  },
  es: {
    summary: "Resumen",
    experience: "Experiencia",
    education: "Educación",
    skills: "Habilidades",
    projects: "Proyectos",
    achievements: "Logros y Certificaciones",
    languages: "Idiomas",
    contact: "Contacto",
    portfolio: "Portafolio",
    present: "Presente",
    email: "Correo:",
    phone: "Teléfono:",
    location: "Ubicación:",
  },
  fr: {
    summary: "Résumé",
    experience: "Expérience",
    education: "Formation",
    skills: "Compétences",
    projects: "Projets",
    achievements: "Certifications et Réalisations",
    languages: "Langues",
    contact: "Coordonnées",
    portfolio: "Portfolio",
    present: "Présent",
    email: "E-mail :",
    phone: "Téléphone :",
    location: "Localisation :",
  },
  it: {
    summary: "Riepilogo",
    experience: "Esperienza",
    education: "Istruzione",
    skills: "Competenze",
    projects: "Progetti",
    achievements: "Certificazioni",
    languages: "Lingue",
    contact: "Contatti",
    portfolio: "Portfolio",
    present: "Presente",
    email: "Email:",
    phone: "Telefono:",
    location: "Città:",
  },
  pt: {
    summary: "Resumo",
    experience: "Experiência",
    education: "Formação",
    skills: "Habilidades",
    projects: "Projetos",
    achievements: "Conquistas",
    languages: "Idiomas",
    contact: "Contato",
    portfolio: "Portfólio",
    present: "Presente",
    email: "E-mail:",
    phone: "Telefone:",
    location: "Localização:",
  },
  nl: {
    summary: "Samenvatting",
    experience: "Werkervaring",
    education: "Opleiding",
    skills: "Vaardigheden",
    projects: "Projecten",
    achievements: "Certificaten & Prestaties",
    languages: "Talen",
    contact: "Contact",
    portfolio: "Portfolio",
    present: "Heden",
    email: "E-mail:",
    phone: "Telefoon:",
    location: "Locatie:",
  },
  pl: {
    summary: "Podsumowanie",
    experience: "Doświadczenie",
    education: "Wykształcenie",
    skills: "Umiejętności",
    projects: "Projekty",
    achievements: "Osiągnięcia i Certyfikaty",
    languages: "Języki",
    contact: "Kontakt",
    portfolio: "Portfolio",
    present: "Obecnie",
    email: "E-mail:",
    phone: "Telefon:",
    location: "Lokalizacja:",
  },
  ru: {
    summary: "О себе",
    experience: "Опыт работы",
    education: "Образование",
    skills: "Навыки",
    projects: "Проекты",
    achievements: "Достижения",
    languages: "Языки",
    contact: "Контакты",
    portfolio: "Портфолио",
    present: "По наст. время",
    email: "Эл. почта:",
    phone: "Телефон:",
    location: "Город:",
  },
  hi: {
    summary: "सारांश",
    experience: "कार्य अनुभव",
    education: "शिक्षा",
    skills: "कौशल",
    projects: "परियोजनाएं",
    achievements: "उपलब्धियां",
    languages: "भाषाएं",
    contact: "संपर्क",
    portfolio: "पोर्टफोलियो",
    present: "वर्तमान",
    email: "ईमेल:",
    phone: "फ़ोन:",
    location: "स्थान:",
  },
  te: {
    summary: "సారాంశం",
    experience: "పని అనుభవం",
    education: "విద్య",
    skills: "నైపుణ్యాలు",
    projects: "ప్రాజెక్టులు",
    achievements: "విజయాలు",
    languages: "భాషలు",
    contact: "సంప్రదించండి",
    portfolio: "పోర్ట్‌ఫోలియో",
    present: "ప్రస్తుతం",
    email: "ఈమెయిల్:",
    phone: "ఫోన్:",
    location: "ప్రాంతం:",
  },
  ar: {
    summary: "ملخص",
    experience: "الخبرات المهنية",
    education: "التعليم",
    skills: "المهارات",
    projects: "المشاريع",
    achievements: "الإنجازات والشهادات",
    languages: "اللغات",
    contact: "معلومات الاتصال",
    portfolio: "معرض الأعمال",
    present: "الحالي",
    email: "البريد الإلكتروني:",
    phone: "الهاتف:",
    location: "الموقع:",
  },
  ja: {
    summary: "職務要約",
    experience: "職務経歴",
    education: "学歴",
    skills: "スキル",
    projects: "主なプロジェクト",
    achievements: "実績・表彰",
    languages: "語学力",
    contact: "連絡先",
    portfolio: "ポートフォリオ",
    present: "現在",
    email: "メール:",
    phone: "電話番号:",
    location: "所在地:",
  },
  zh: {
    summary: "个人总结",
    experience: "工作经历",
    education: "教育背景",
    skills: "专业技能",
    projects: "项目经验",
    achievements: "荣誉与证书",
    languages: "语言能力",
    contact: "联系方式",
    portfolio: "作品集",
    present: "至今",
    email: "邮箱:",
    phone: "电话:",
    location: "地点:",
  },
};

type TitleConcept = keyof ResumeSectionTitles;

const TITLE_ALIASES: Record<TitleConcept, string[]> = {
  summary: [
    "summary",
    "professional summary",
    "about me",
    "profile overview",
    "profile",
    "zusammenfassung",
    "profil",
    "über mich",
    "kurzprofil",
    "betreff",
    "resumen",
    "perfil profesional",
    "résumé",
    "profil professionnel",
    "riepilogo",
    "samenvatting",
    "podsumowanie",
    "о себе",
  ],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "other work experience",
    "work history",
    "employment history",
    "berufserfahrung",
    "berufliche laufbahn",
    "beruflicher werdegang",
    "berufliche erfahrung",
    "praxiserfahrung",
    "werdegang",
    "experiencia",
    "experiencia laboral",
    "experiencia profesional",
    "expérience",
    "expérience professionnelle",
    "esperienza",
    "esperienza lavorativa",
    "werkervaring",
    "doświadczenie",
    "опыт работы",
  ],
  education: [
    "education",
    "academic background",
    "education & credentials",
    "academics",
    "ausbildung",
    "akademischer werdegang",
    "bildungsweg",
    "studium & ausbildung",
    "ausbildung & studium",
    "studium",
    "weiterbildung",
    "educación",
    "formación",
    "formation",
    "istruzione",
    "opleiding",
    "wykształcenie",
    "образование",
  ],
  skills: [
    "skills",
    "technical skills",
    "skills & competencies",
    "skills & stack",
    "core competencies",
    "skills and competencies",
    "fähigkeiten",
    "it-kenntnisse",
    "it kenntnisse",
    "software & it",
    "software und it",
    "persönliche stärken",
    "kompetenzen",
    "fachliche kompetenzen",
    "fachkompetenzen",
    "programmierung",
    "technische fähigkeiten",
    "weitere",
    "qualifikationen",
    "sonstige qualifikationen",
    "programming & frameworks",
    "tools & technologies",
    "data & systems",
    "kenntnisse",
    "fachkenntnisse",
    "kenntnisse & fähigkeiten",
    "habilidades",
    "compétences",
    "competenze",
    "vaardigheden",
    "umiejętności",
    "навыки",
  ],
  projects: [
    "projects",
    "academic projects",
    "featured projects",
    "notable projects",
    "personal projects",
    "key projects",
    "selected projects",
    "projekte",
    "proyectos",
    "projets",
    "progetti",
    "projecten",
    "projekty",
    "проекты",
  ],
  achievements: [
    "achievements",
    "certifications",
    "honors & awards",
    "honors and awards",
    "honors",
    "awards",
    "erfolge",
    "erfolge & auszeichnungen",
    "erfolge und auszeichnungen",
    "ehrenamt / erfolge",
    "ehrenamt & erfolge",
    "ehrenamt",
    "erfolge & hobbys",
    "zertifikate",
    "auszeichnungen",
    "zertifikate & erfolge",
    "activities & leadership",
    "activities and leadership",
    "logros",
    "certificaciones",
    "réalisations",
    "certificazioni",
    "prestaties",
    "osiągnięcia",
    "достижения",
  ],
  languages: [
    "languages",
    "sprachen",
    "sprachkenntnisse",
    "fremdsprachen",
    "idiomas",
    "langues",
    "lingue",
    "talen",
    "języki",
    "языки",
  ],
  contact: [
    "contact",
    "contact info",
    "kontakt",
    "kontaktdaten",
    "persönliche angaben",
    "persönliche daten",
    "contacto",
    "coordonnées",
    "contatti",
    "kontakty",
    "контакты",
  ],
  portfolio: [
    "portfolio",
    "portfolio & links",
    "portfolio and links",
    "portfolio links",
    "portafolio",
    "portfólio",
  ],
  present: [
    "present",
    "heute",
    "aktuell",
    "gegenwart",
    "presente",
    "présent",
    "heden",
    "obecnie",
  ],
  email: ["email", "email:", "e-mail", "e-mail:", "correo", "correo:"],
  phone: ["phone", "phone:", "telefon", "telefon:", "teléfono", "teléfono:", "téléphone", "téléphone:"],
  location: ["location", "location:", "standort", "standort:", "adresse", "adresse:", "ubicación", "ubicación:", "localisation", "localisation:"],
};

const CONCEPT_LOOKUP: Map<string, TitleConcept> = new Map();
for (const [concept, aliases] of Object.entries(TITLE_ALIASES)) {
  for (const alias of aliases) {
    CONCEPT_LOOKUP.set(alias.toLowerCase(), concept as TitleConcept);
  }
}

/**
 * Return section titles object for a given language code (default: "en")
 */
export function getResumeSectionTitles(language?: string): ResumeSectionTitles {
  const code = (language || "en").toLowerCase().trim();
  return RESUME_TITLES_BY_LANGUAGE[code] || RESUME_TITLES_BY_LANGUAGE.en;
}

/**
 * Maps a single title string (e.g. "Experience", "Summary", "Email: ") to the requested language.
 * Returns the mapped string, or the original if it is not a known title/label.
 */
export function getMappedTitle(raw: string, targetLanguage?: string): string {
  if (!raw || typeof raw !== "string") return raw;
  const lang = (targetLanguage || "en").toLowerCase().trim();
  const dict = RESUME_TITLES_BY_LANGUAGE[lang] || RESUME_TITLES_BY_LANGUAGE.en;

  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // Check if string ends with a colon
  const endsWithColon = trimmed.endsWith(":");
  const endsWithColonSpace = raw.endsWith(": ") || raw.endsWith(":  ");
  const normalizedKey = (endsWithColon ? trimmed.slice(0, -1) : trimmed).toLowerCase();

  const concept = CONCEPT_LOOKUP.get(normalizedKey) || CONCEPT_LOOKUP.get(trimmed.toLowerCase());
  if (!concept) return raw;

  let translated = dict[concept];
  if (!translated) return raw;

  // Preserve colon formatting
  if (concept === "email" || concept === "phone" || concept === "location") {
    // These dict entries usually already end with colon or colon-space
    if (endsWithColonSpace && !translated.endsWith(" ")) {
      translated = translated.endsWith(":") ? `${translated} ` : `${translated}: `;
    } else if (endsWithColon && !translated.endsWith(":")) {
      translated = `${translated}:`;
    }
  } else if (endsWithColonSpace) {
    translated = `${translated}: `;
  } else if (endsWithColon) {
    translated = `${translated}:`;
  }

  // Preserve ALL-CAPS if original was all-caps (and longer than 2 chars)
  if (trimmed.length > 2 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    translated = translated.toUpperCase();
  }

  // Preserve leading/trailing whitespace of the original string
  const leadingSpaceMatch = raw.match(/^\s+/);
  const trailingSpaceMatch = raw.match(/\s+$/);
  const leading = leadingSpaceMatch ? leadingSpaceMatch[0] : "";
  const trailing = trailingSpaceMatch && !endsWithColonSpace ? trailingSpaceMatch[0] : "";

  return `${leading}${translated}${trailing}`;
}

/**
 * Recursively walk a React element tree (e.g. @react-pdf/renderer document)
 * and replace known section header titles with mapped dictionary strings.
 * Preserves and assigns unique keys to all children to eliminate any React list-key warnings.
 */
export function localizeResumePdfElement(node: any, language?: string): any {
  if (node == null) return node;
  const lang = (language || "en").toLowerCase().trim();

  // If node is an array of elements
  if (Array.isArray(node)) {
    return React.Children.map(node, (child, idx) => {
      if (child == null) return child;
      const mapped = localizeResumePdfElement(child, lang);
      if (React.isValidElement(mapped) && mapped.key == null) {
        return React.cloneElement(mapped, {
          key: (child as any)?.key ?? `pn-${idx}`,
        });
      }
      return mapped;
    });
  }

  // If node is not a valid React element, return as is
  if (!React.isValidElement(node)) return node;

  const props = (node as any).props;
  if (!props) return node;

  let hasChanged = false;
  let newChildren = props.children;

  if (typeof props.children === "string") {
    const mapped = getMappedTitle(props.children, lang);
    if (mapped !== props.children) {
      newChildren = mapped;
      hasChanged = true;
    }
  } else if (Array.isArray(props.children)) {
    const nextArr = React.Children.map(props.children, (child: any, idx: number) => {
      if (child == null) return child;
      if (typeof child === "string") {
        const mapped = getMappedTitle(child, lang);
        if (mapped !== child) {
          hasChanged = true;
          return mapped;
        }
        return child;
      }
      const mappedChild = localizeResumePdfElement(child, lang);
      if (mappedChild !== child) {
        hasChanged = true;
      }
      if (React.isValidElement(mappedChild) && mappedChild.key == null) {
        return React.cloneElement(mappedChild, {
          key: (child as any)?.key ?? `pc-${idx}`,
        });
      }
      return mappedChild;
    });
    if (hasChanged) newChildren = nextArr;
  } else if (React.isValidElement(props.children)) {
    const mappedChild = localizeResumePdfElement(props.children, lang);
    if (mappedChild !== props.children) {
      newChildren = mappedChild;
      hasChanged = true;
    }
  }

  if (hasChanged) {
    const nodeKey = (node as any).key;
    const clonedProps: any = { ...props };
    if (nodeKey != null) {
      clonedProps.key = nodeKey;
    }
    if (Array.isArray(newChildren)) {
      return React.cloneElement(node as React.ReactElement, clonedProps, ...newChildren);
    }
    return React.cloneElement(node as React.ReactElement, clonedProps, newChildren);
  }

  return node;
}

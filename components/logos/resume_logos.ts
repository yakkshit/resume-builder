/**
 * Resume Template Logos and SVG Assets
 *
 * This file contains vector SVG definitions and data URLs for all specialized resume templates:
 * 1. German Forest Slate (Simon Heinz style)
 * 2. Pokémon Trainer Resume (Anime card style)
 * 3. Wizarding World Scroll (Harry Potter style)
 * 4. Retro Pokédex (8-bit pixel game style)
 *
 * You can customize or replace any SVG path or data URI below.
 */

// Helper to convert clean SVG markup to a safe data URL for @react-pdf/renderer <Image />
export function svgToDataUri(svgString: string): string {
  const clean = svgString.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. German Forest Slate (Simon Heinz style) Icons
// ─────────────────────────────────────────────────────────────────────────────
export const germanForestSlateIcons = {
  email: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  `),
  phone: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  `),
  location: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `),
  website: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/>
    </svg>
  `),
  linkedin: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  `),
  github: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
    </svg>
  `),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pokémon Trainer Anime Card Resume Icons
// ─────────────────────────────────────────────────────────────────────────────
export const pokemonTrainerIcons = {
  // Pokéball badge
  pokeball: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
      <path d="M 2 50 A 48 48 0 0 1 98 50 Z" fill="#EF4444" stroke="#1E293B" stroke-width="4"/>
      <line x1="2" y1="50" x2="98" y2="50" stroke="#1E293B" stroke-width="6"/>
      <circle cx="50" cy="50" r="16" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>
      <circle cx="50" cy="50" r="8" fill="#F8FAFC" stroke="#64748B" stroke-width="2"/>
    </svg>
  `),
  // Golden Gym Badge / Medal
  gymBadge: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <polygon points="32,4 42,24 64,26 47,42 52,64 32,52 12,64 17,42 0,26 22,24" fill="#FBBF24" stroke="#B45309" stroke-width="3"/>
      <circle cx="32" cy="34" r="12" fill="#FDE68A" stroke="#D97706" stroke-width="2"/>
    </svg>
  `),
  // Quest Battle Swords
  questSwords: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
      <line x1="13" y1="19" x2="19" y2="13"/>
      <line x1="16" y1="16" x2="20" y2="20"/>
      <line x1="19" y1="21" x2="21" y2="19"/>
    </svg>
  `),
  // Element: Fire Orb
  elementFire: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#EF4444"/>
      <path d="M20 8s4 6 1 11c5-2 6-8 6-8s3 5 1 10c-3 6-11 7-14 2-3-5 1-10 1-10s-3 4-2 7c-4-4-1-11 7-12z" fill="#FEF08A"/>
    </svg>
  `),
  // Element: Water Orb
  elementWater: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#3B82F6"/>
      <path d="M20 9c-3 5-7 10-7 14a7 7 0 0 0 14 0c0-4-4-9-7-14z" fill="#93C5FD"/>
    </svg>
  `),
  // Element: Grass Orb
  elementGrass: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#10B981"/>
      <path d="M12 28c3-10 12-14 16-16-1 7-5 16-16 16z" fill="#A7F3D0"/>
    </svg>
  `),
  // Element: Electric / Psychic Orb
  elementElectric: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#8B5CF6"/>
      <polygon points="21,8 12,21 19,21 17,32 28,18 21,18" fill="#FDE047"/>
    </svg>
  `),
  // Golden Championship Trophy
  trophy: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FBBF24" stroke="#B45309" stroke-width="1.5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 4h16v6a8 8 0 0 1-16 0V4Z"/>
      <path d="M12 14v4M8 22h8"/>
    </svg>
  `),
  // 4-Point Star Sparkle
  starSparkle: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B">
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>
    </svg>
  `),
  // Corner Pokéball with bold outline
  cornerPokeball: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#0F172A" stroke-width="6"/>
      <path d="M 4 50 A 46 46 0 0 1 96 50 Z" fill="#EF4444" stroke="#0F172A" stroke-width="6"/>
      <line x1="4" y1="50" x2="96" y2="50" stroke="#0F172A" stroke-width="8"/>
      <circle cx="50" cy="50" r="18" fill="#FFFFFF" stroke="#0F172A" stroke-width="8"/>
      <circle cx="50" cy="50" r="8" fill="#F1F5F9" stroke="#64748B" stroke-width="3"/>
    </svg>
  `),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Wizarding World Parchment (Harry Potter style) Icons
// ─────────────────────────────────────────────────────────────────────────────
export const wizardingScrollIcons = {
  // Hogwarts Shield Crest
  crest: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
      <path d="M40 5 C65 5 75 18 75 45 C75 75 55 90 40 98 C25 90 5 75 5 45 C5 18 15 5 40 5 Z" fill="#2A1B0E" stroke="#8B6914" stroke-width="4"/>
      <path d="M40 10 C62 10 70 20 70 45 C70 72 52 85 40 92 C28 85 10 72 10 45 C10 20 18 10 40 10 Z" fill="#581C1A"/>
      <line x1="40" y1="10" x2="40" y2="92" stroke="#D4AF37" stroke-width="2"/>
      <line x1="10" y1="48" x2="70" y2="48" stroke="#D4AF37" stroke-width="2"/>
      <polygon points="40,25 43,32 50,33 45,38 46,45 40,41 34,45 35,38 30,33 37,32" fill="#D4AF37"/>
      <polygon points="40,55 43,62 50,63 45,68 46,75 40,71 34,75 35,68 30,63 37,62" fill="#D4AF37"/>
    </svg>
  `),
  // Magic Wand
  wand: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#4A2810" stroke-width="3" stroke-linecap="round">
      <line x1="8" y1="56" x2="52" y2="12"/>
      <polygon points="56,8 50,14 48,12 54,6" fill="#D4AF37"/>
      <circle cx="56" cy="8" r="2.5" fill="#EAB308"/>
      <circle cx="48" cy="4" r="2" fill="#EAB308"/>
      <circle cx="60" cy="16" r="2" fill="#EAB308"/>
    </svg>
  `),
  // Messenger Owl (Hedwig)
  owl: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <ellipse cx="32" cy="36" rx="16" ry="22" fill="#F8FAFC" stroke="#475569" stroke-width="2"/>
      <circle cx="32" cy="20" r="12" fill="#F8FAFC" stroke="#475569" stroke-width="2"/>
      <circle cx="26" cy="18" r="4" fill="#EAB308"/>
      <circle cx="26" cy="18" r="2" fill="#0F172A"/>
      <circle cx="38" cy="18" r="4" fill="#EAB308"/>
      <circle cx="38" cy="18" r="2" fill="#0F172A"/>
      <polygon points="32,21 29,25 35,25" fill="#D97706"/>
    </svg>
  `),
  // Quill & Inkpot
  quillInkpot: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect x="14" y="44" width="22" height="16" rx="3" fill="#1C1917" stroke="#44403C" stroke-width="2"/>
      <ellipse cx="25" cy="44" rx="8" ry="3" fill="#0C0A09"/>
      <path d="M25 44 C35 30 45 10 52 4 C50 14 42 28 32 38" fill="#F5F5F4" stroke="#78716C" stroke-width="2"/>
    </svg>
  `),
  // Wax Seal with Award Ribbon
  waxSeal: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
      <polygon points="24,40 20,76 32,66 44,76 40,40" fill="#7F1D1D" stroke="#450A0A" stroke-width="2"/>
      <circle cx="32" cy="32" r="22" fill="#991B1B" stroke="#7F1D1D" stroke-width="3"/>
      <circle cx="32" cy="32" r="15" fill="#7F1D1D" stroke="#D4AF37" stroke-width="1.5"/>
      <polygon points="32,22 35,28 42,29 37,34 38,41 32,37 26,41 27,34 22,29 29,28" fill="#D4AF37"/>
    </svg>
  `),
  // Ornate Vintage Corner Flourish
  cornerFlourish: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" stroke="#78552B" stroke-width="2">
      <path d="M 4 36 L 4 12 C 4 7.5 7.5 4 12 4 L 36 4"/>
      <path d="M 8 36 L 8 14 C 8 10.5 10.5 8 14 8 L 36 8" stroke-width="1"/>
      <circle cx="12" cy="12" r="3" fill="#78552B"/>
    </svg>
  `),
  // Vintage Ornamental Divider Line
  dividerFlourish: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 16" fill="none" stroke="#8C6836" stroke-width="1.5">
      <line x1="10" y1="8" x2="85" y2="8"/>
      <polygon points="100,2 105,8 100,14 95,8" fill="#8C6836"/>
      <circle cx="90" cy="8" r="2" fill="#8C6836"/>
      <circle cx="110" cy="8" r="2" fill="#8C6836"/>
      <line x1="115" y1="8" x2="190" y2="8"/>
    </svg>
  `),
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Retro Pokédex Pixel-Art Resume Icons
// ─────────────────────────────────────────────────────────────────────────────
export const retroPokedexIcons = {
  // Pixel Pokéball
  pixelPokeball: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="5" y="1" width="6" height="1" fill="#0F172A"/>
      <rect x="3" y="2" width="2" height="1" fill="#0F172A"/>
      <rect x="11" y="2" width="2" height="1" fill="#0F172A"/>
      <rect x="2" y="3" width="1" height="2" fill="#0F172A"/>
      <rect x="13" y="3" width="1" height="2" fill="#0F172A"/>
      <rect x="3" y="3" width="10" height="4" fill="#EF4444"/>
      <rect x="1" y="5" width="1" height="6" fill="#0F172A"/>
      <rect x="14" y="5" width="1" height="6" fill="#0F172A"/>
      <rect x="2" y="7" width="12" height="2" fill="#0F172A"/>
      <rect x="6" y="6" width="4" height="4" fill="#FFFFFF"/>
      <rect x="7" y="7" width="2" height="2" fill="#0F172A"/>
      <rect x="3" y="9" width="10" height="4" fill="#F8FAFC"/>
      <rect x="2" y="11" width="1" height="2" fill="#0F172A"/>
      <rect x="13" y="11" width="1" height="2" fill="#0F172A"/>
      <rect x="3" y="13" width="2" height="1" fill="#0F172A"/>
      <rect x="11" y="13" width="2" height="1" fill="#0F172A"/>
      <rect x="5" y="14" width="6" height="1" fill="#0F172A"/>
    </svg>
  `),
  // Pixel D-Pad
  dPad: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
      <rect x="11" y="2" width="10" height="28" rx="2" fill="#334155" stroke="#0F172A" stroke-width="1.5"/>
      <rect x="2" y="11" width="28" height="10" rx="2" fill="#334155" stroke="#0F172A" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="3" fill="#1E293B"/>
    </svg>
  `),
  // Pixel Trophy
  pixelTrophy: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="3" y="2" width="10" height="6" fill="#FBBF24"/>
      <rect x="1" y="3" width="2" height="3" fill="#F59E0B"/>
      <rect x="13" y="3" width="2" height="3" fill="#F59E0B"/>
      <rect x="5" y="8" width="6" height="2" fill="#F59E0B"/>
      <rect x="7" y="10" width="2" height="3" fill="#D97706"/>
      <rect x="4" y="13" width="8" height="2" fill="#78350F"/>
    </svg>
  `),
  // Pixel Treasure Chest
  pixelChest: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="2" y="3" width="12" height="5" fill="#B45309"/>
      <rect x="2" y="8" width="12" height="6" fill="#92400E"/>
      <rect x="7" y="7" width="2" height="3" fill="#FDE047"/>
      <rect x="1" y="5" width="1" height="8" fill="#1C1917"/>
      <rect x="14" y="5" width="1" height="8" fill="#1C1917"/>
    </svg>
  `),
  // Pixel Swords
  pixelSwords: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="12" y="2" width="2" height="2" fill="#38BDF8"/>
      <rect x="10" y="4" width="2" height="2" fill="#38BDF8"/>
      <rect x="8" y="6" width="2" height="2" fill="#38BDF8"/>
      <rect x="6" y="8" width="2" height="2" fill="#94A3B8"/>
      <rect x="4" y="10" width="2" height="2" fill="#EAB308"/>
      <rect x="2" y="12" width="2" height="2" fill="#78350F"/>
    </svg>
  `),
};

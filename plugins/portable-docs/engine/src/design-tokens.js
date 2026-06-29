/**
 * Design Tokens - "The Scholarly Disruptor"
 *
 * SINGLE SOURCE OF TRUTH for the visual design system.
 *
 * Design Direction: MIT Technology Review meets Wired
 * - Editorial magazine aesthetic with premium typography
 * - Deep ink palette with restrained accent
 * - Paper-like textures, not screen-like glows
 * - Data visualization as art
 * - Confident white space
 *
 * THEMES: vanderbilt (default) | editorial | dark | brand
 *   Selected at BUILD TIME via PD_THEME env var (injected by build.js).
 *   PD_ACCENT overrides the accent color for brand theming.
 */

// =============================================================================
// THEMES MAP - all three palettes, same shape as COLORS
// =============================================================================

const THEMES = {
  // ── vanderbilt (default) ─────────────────────────────────────────────────────
  // Vanderbilt University black & gold, light treatment: paper-white ground,
  // Vanderbilt black ink (#1C1C1C), metallic-gold accent (#B49248, Pantone 871 C).
  // Official brand colors: https://brand.vanderbilt.edu/color/
  vanderbilt: {
    ink: {
      900: '#1C1C1C',        // Vanderbilt black — primary text
      800: '#2E2E2E',
      700: '#454545',
      600: '#5C5C5C',        // Secondary text
      500: '#757575',
      400: '#9A9A9A',
      300: '#BEBEBE',
      200: '#DDDDDD',
      100: '#F2F2F2',
      50: '#FAFAFA',
    },
    accent: {
      primary: '#B49248',    // Vanderbilt metallic gold (Pantone 871 C)
      light: '#CFAE70',      // Lighter gold (Pantone 4024 / Nike Club Gold) — hover
      muted: '#DCC79A',      // Soft gold — subtle fills
      wash: 'rgba(180, 146, 72, 0.06)',
      glow: 'rgba(180, 146, 72, 0.12)',
    },
    semantic: {
      success: '#059669',
      warning: '#D97706',
      info: '#0891B2',
    },
    surface: {
      paper: '#FAFAFA',
      elevated: '#FFFFFF',
      inset: '#F2F2F2',
      dark: '#1C1C1C',       // Vanderbilt black — dark hero/sections (gold pops here)
      darkElevated: '#2E2E2E',
    },
  },

  // ── editorial ────────────────────────────────────────────────────────────────
  // Verbatim original palette — preserved unchanged for `--theme editorial`.
  editorial: {
    ink: {
      900: '#0A0A0B',
      800: '#18181B',
      700: '#27272A',
      600: '#3F3F46',
      500: '#52525B',
      400: '#71717A',
      300: '#A1A1AA',
      200: '#D4D4D8',
      100: '#F4F4F5',
      50: '#FAFAFA',
    },
    accent: {
      primary: '#5B21B6',
      light: '#7C3AED',
      muted: '#8B5CF6',
      wash: 'rgba(91, 33, 182, 0.06)',
      glow: 'rgba(91, 33, 182, 0.12)',
    },
    semantic: {
      success: '#059669',
      warning: '#D97706',
      info: '#0891B2',
    },
    surface: {
      paper: '#FAFAFA',
      elevated: '#FFFFFF',
      inset: '#F4F4F5',
      dark: '#0A0A0B',
      darkElevated: '#18181B',
    },
  },

  // ── dark ────────────────────────────────────────────────────────────────────
  // Intentional dark palette: GitHub-dark/Obsidian-inspired neutral ground,
  // electric cyan accent that reads crisply on near-black surfaces.
  dark: {
    ink: {
      // Inverted: 900 = lightest text, 50 = darkest background
      900: '#F0F0F2',        // Primary text (near-white)
      800: '#C9C9CE',        // Subtext
      700: '#A0A0A8',        // Muted text
      600: '#70707A',        // Disabled / placeholder
      500: '#48484F',        // Borders strong
      400: '#30303A',        // Borders subtle
      300: '#22222A',        // Elevated surface
      200: '#1A1A22',        // Card surface
      100: '#13131A',        // Page surface
      50: '#0D1117',         // Near-black base (deepest)
    },
    accent: {
      primary: '#22D3EE',    // Cyan 400 — readable on dark, not neon
      light: '#67E8F9',      // Cyan 300
      muted: '#0891B2',      // Cyan 600 — for subtle use
      wash: 'rgba(34, 211, 238, 0.08)',
      glow: 'rgba(34, 211, 238, 0.16)',
    },
    semantic: {
      success: '#34D399',    // Emerald 400
      warning: '#FBBF24',    // Amber 400
      info: '#60A5FA',       // Blue 400
    },
    surface: {
      paper: '#0D1117',      // Deep base
      elevated: '#13131A',   // Slightly lifted
      inset: '#22222A',      // Inset panels
      dark: '#0A0A0E',       // Hero/sections
      darkElevated: '#1A1A22',
    },
  },

  // ── brand ───────────────────────────────────────────────────────────────────
  // Clean neutral — designed to receive a PD_ACCENT override.
  // Defaults to a slate accent if no PD_ACCENT is set.
  brand: {
    ink: {
      900: '#0C0C0E',
      800: '#1C1C1E',
      700: '#2C2C2E',
      600: '#48484A',
      500: '#636366',
      400: '#8E8E93',
      300: '#AEAEB2',
      200: '#D1D1D6',
      100: '#F2F2F7',
      50: '#FAFAFA',
    },
    accent: {
      primary: '#0077CC',    // Default brand blue (overridden by PD_ACCENT)
      light: '#339BE0',
      muted: '#66B8F0',
      wash: 'rgba(0, 119, 204, 0.06)',
      glow: 'rgba(0, 119, 204, 0.12)',
    },
    semantic: {
      success: '#30D158',
      warning: '#FF9F0A',
      info: '#32ADE6',
    },
    surface: {
      paper: '#FAFAFA',
      elevated: '#FFFFFF',
      inset: '#F2F2F7',
      dark: '#0C0C0E',
      darkElevated: '#1C1C1E',
    },
  },
};

// =============================================================================
// ACTIVE THEME SELECTION
// Browser-safe guarded read: `typeof process` never throws in a browser.
// In Node (unit tests / build.js), picks up PD_THEME from env.
// In the browser, this guard always yields 'vanderbilt' — build.js MUST
// string-replace this line with a literal before bundling.
// =============================================================================
const ACTIVE_THEME = (typeof process !== 'undefined' && process.env && process.env.PD_THEME) || 'vanderbilt';

// =============================================================================
// COLORS - Resolved from active theme (exported as single source of truth)
// =============================================================================
export const COLORS = THEMES[ACTIVE_THEME] || THEMES.vanderbilt;

// =============================================================================
// ACCENT OVERRIDE - PD_ACCENT replaces accent.primary (and derives light/muted)
// Browser-safe: build.js injects a literal for PD_ACCENT before bundling.
// =============================================================================
(function applyAccentOverride() {
  const accent = (typeof process !== 'undefined' && process.env && process.env.PD_ACCENT) || '';
  if (accent && /^#[0-9A-Fa-f]{3,8}$/.test(accent)) {
    // Normalize to #RRGGBB so wash/glow alpha suffixes are always valid, then
    // derive lighter hover/muted shades by blending toward white.
    const primary = normalizeHex(accent);
    COLORS.accent.primary = primary;
    COLORS.accent.light = lighten(primary, 0.20); // ~20% toward white (hover)
    COLORS.accent.muted = lighten(primary, 0.40); // ~40% toward white (muted)
    COLORS.accent.wash = primary + '14'; // ~8% opacity
    COLORS.accent.glow = primary + '29'; // ~16% opacity
  }
})();

// =============================================================================
// TYPOGRAPHY - Editorial hierarchy
// =============================================================================
export const FONTS = {
  // Display: Distinctive, editorial presence
  display: "'Fraunces', 'Playfair Display', Georgia, serif",
  // Headlines: Clean, authoritative
  headline: "'Instrument Serif', 'Noto Serif Display', Georgia, serif",
  // Body: Readable, refined
  body: "'Newsreader', 'Source Serif 4', Georgia, serif",
  // UI/Labels: Clean sans for interface elements
  ui: "'DM Sans', 'Outfit', system-ui, sans-serif",
  // Data: Precise, technical
  mono: "'IBM Plex Mono', 'JetBrains Mono', monospace",
};

// Type scale with editorial proportions
export const TYPE_SCALE = {
  // Display sizes (for hero, major section heads)
  display: {
    xl: { size: 'clamp(3.5rem, 8vw, 7rem)', lineHeight: 0.95, letterSpacing: '-0.03em', weight: 400 },
    lg: { size: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.0, letterSpacing: '-0.025em', weight: 400 },
    md: { size: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, letterSpacing: '-0.02em', weight: 400 },
  },
  // Headline sizes
  headline: {
    lg: { size: '2rem', lineHeight: 1.15, letterSpacing: '-0.015em', weight: 500 },
    md: { size: '1.5rem', lineHeight: 1.25, letterSpacing: '-0.01em', weight: 500 },
    sm: { size: '1.25rem', lineHeight: 1.3, letterSpacing: '0', weight: 500 },
  },
  // Body sizes
  body: {
    lg: { size: '1.25rem', lineHeight: 1.7, letterSpacing: '0', weight: 400 },
    md: { size: '1.125rem', lineHeight: 1.75, letterSpacing: '0.005em', weight: 400 },
    sm: { size: '1rem', lineHeight: 1.7, letterSpacing: '0.01em', weight: 400 },
  },
  // UI sizes
  ui: {
    lg: { size: '1rem', lineHeight: 1.5, letterSpacing: '0.01em', weight: 500 },
    md: { size: '0.875rem', lineHeight: 1.5, letterSpacing: '0.015em', weight: 500 },
    sm: { size: '0.75rem', lineHeight: 1.4, letterSpacing: '0.02em', weight: 500 },
    xs: { size: '0.6875rem', lineHeight: 1.3, letterSpacing: '0.05em', weight: 600 },
  },
  // Mono sizes (for data, stats)
  mono: {
    display: { size: '3.5rem', lineHeight: 1, letterSpacing: '-0.02em', weight: 500 },
    lg: { size: '2rem', lineHeight: 1.1, letterSpacing: '-0.01em', weight: 500 },
    md: { size: '1rem', lineHeight: 1.4, letterSpacing: '0', weight: 400 },
    sm: { size: '0.8125rem', lineHeight: 1.4, letterSpacing: '0.02em', weight: 400 },
  },
};

// =============================================================================
// SPACING - Editorial rhythm (based on 8px grid, with intentional jumps)
// =============================================================================
export const SPACE = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.5rem',    // 24px
  6: '2rem',      // 32px
  7: '2.5rem',    // 40px
  8: '3rem',      // 48px
  9: '4rem',      // 64px
  10: '5rem',     // 80px
  11: '6rem',     // 96px
  12: '8rem',     // 128px
  section: '4rem', // Standard section padding
  article: '3rem', // Article rhythm
};

// =============================================================================
// LAYOUT - Editorial grid
// =============================================================================
export const LAYOUT = {
  maxWidth: {
    prose: '52rem',      // ~832px - comfortable reading width
    content: '64rem',    // ~1024px - main content area
    wide: '80rem',       // ~1280px - full-bleed content
    full: '96rem',       // ~1536px - max container
  },
  gutter: '2rem',
  margin: 'clamp(1.5rem, 5vw, 4rem)',
};

// =============================================================================
// EFFECTS - Subtle, print-inspired
// =============================================================================
export const EFFECTS = {
  // Shadows - soft, paper-like
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
    md: '0 2px 4px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.06)',
    lg: '0 4px 8px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.08)',
    xl: '0 8px 16px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.1)',
    inset: 'inset 0 1px 2px rgba(0,0,0,0.06)',
  },
  // Border radii - minimal, editorial
  radius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  // Transitions
  transition: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '400ms ease',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    expand: '400ms cubic-bezier(0.4, 0, 0.2, 1)',  // Smooth expand/collapse
  },
  // Noise texture (applied via CSS)
  noise: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
};

// =============================================================================
// CHART COLORS - Sophisticated data palette
// =============================================================================
export const CHART_COLORS = [
  COLORS.accent.primary,   // Primary data series
  COLORS.ink[400],         // Secondary
  COLORS.accent.muted,     // Tertiary
  COLORS.ink[300],         // Quaternary
];

// =============================================================================
// COMPONENT CONFIGS
// =============================================================================
export const roleConfigs = {
  'PMs': {
    bg: COLORS.accent.wash,
    text: COLORS.accent.primary,
    border: `${COLORS.accent.primary}30`
  },
  'Designers': {
    bg: COLORS.ink[100],
    text: COLORS.ink[700],
    border: COLORS.ink[200]
  },
  'Engineers': {
    bg: COLORS.accent.wash,
    text: COLORS.accent.primary,
    border: `${COLORS.accent.primary}30`
  },
};

export const targetConfigs = {
  'Engineering': { bg: COLORS.accent.primary, glow: COLORS.accent.glow },
  'Eng & PM': { bg: COLORS.ink[800], glow: 'rgba(0,0,0,0.15)' },
  'Product': { bg: COLORS.accent.light, glow: COLORS.accent.glow },
};

// =============================================================================
// SVG ICONS - Refined, minimal strokes
// =============================================================================
export const Icons = {
  briefcase: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  code: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  rocket: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  palette: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill={color}/>
      <circle cx="17.5" cy="10.5" r=".5" fill={color}/>
      <circle cx="8.5" cy="7.5" r=".5" fill={color}/>
      <circle cx="6.5" cy="12.5" r=".5" fill={color}/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  network: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <circle cx="6" cy="17" r="3"/>
      <line x1="9" y1="15.4" x2="10.5" y2="12.6"/>
      <circle cx="18" cy="17" r="3"/>
      <line x1="15" y1="15.4" x2="13.5" y2="12.6"/>
    </svg>
  ),
  graduation: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 10-10-5L2 10l10 5 10-5v6"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  lightbulb: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>
  ),
  chart: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  users: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  shield: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  zap: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  target: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  layers: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  cpu: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <path d="M9 1v3"/>
      <path d="M15 1v3"/>
      <path d="M9 20v3"/>
      <path d="M15 20v3"/>
      <path d="M20 9h3"/>
      <path d="M20 14h3"/>
      <path d="M1 9h3"/>
      <path d="M1 14h3"/>
    </svg>
  ),
  database: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14a9 3 0 0 0 18 0V5"/>
      <path d="M3 12a9 3 0 0 0 18 0"/>
    </svg>
  ),
  arrowRight: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  quote: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z"/>
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
    </svg>
  ),
  // Additional icons for WorkList
  server: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/>
      <line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  ),
  microphone: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  ),
  brain: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>
    </svg>
  ),
  book: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  ),
  gitBranch: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  ),
  messageSquare: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  // Core set additions (Task 2.3)
  search: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  compass: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  // Neutral placeholder for unknown icon names — visually distinct, never silently masquerades
  placeholder: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
    </svg>
  ),
};

// Helper to get icon by name with fallback.
// Returns Icons.placeholder for unknown names — a neutral dashed-border square
// that is visually distinct from any real icon so authors notice a typo.
export const getIcon = (name, color) => {
  const IconFn = Icons[name];
  return IconFn ? IconFn(color) : Icons.placeholder(color);
};

// =============================================================================
// LEGACY EXPORTS (for backwards compatibility)
// =============================================================================
export const TOKENS = {
  colors: COLORS,
  fonts: FONTS,
  effects: EFFECTS,
  space: SPACE,
  layout: LAYOUT,
};

export default TOKENS;

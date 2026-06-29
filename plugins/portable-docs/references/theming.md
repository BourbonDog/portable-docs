# Theming Reference

How to select and customize the visual theme for a portable-docs build.
All palette data is derived from `engine/src/design-tokens.js` (`THEMES` map).
Injection behavior is derived from `engine/src/utils/build.js`
(`extractDesignTokensCode()`).

---

## Available themes

Four themes ship with the engine. Select one at build time.

| Name | Description | Body background |
|------|-------------|----------------|
| `vanderbilt` | Default. Vanderbilt black & gold (light): paper-white ground, Vanderbilt-black ink, metallic-gold accent. | `#FAFAFA` (near-white paper) |
| `editorial` | Paper-white, deep-ink text, purple accent. "MIT Tech Review meets Wired." | `#FAFAFA` (near-white paper) |
| `dark` | GitHub-dark/Obsidian-inspired. Near-black base, electric-cyan accent. | `#0D1117` (near-black) |
| `brand` | Clean neutral slate. Designed to receive a `PD_ACCENT` override. | `#FAFAFA` (near-white) |

---

## Selecting a theme

**CLI flag** (per-build):

```bash
node scripts/build-doc.js --input doc.md --theme dark
node scripts/build-doc.js --input doc.md --theme brand
```

**Environment variable** (session-wide default):

```bash
PD_THEME=dark node scripts/build-doc.js --input doc.md
```

`--theme` takes precedence over `PD_THEME`. If neither is set, the engine
defaults to `vanderbilt`.

**How injection works:** `build.js` reads `process.env.PD_THEME` at bundle
time and string-replaces the `ACTIVE_THEME` guard with a literal string before
bundling, so the browser HTML never contains any `process.env` references.

---

## Palette details

### `vanderbilt` (default)

Vanderbilt University black & gold, light treatment. Official brand colors:
<https://brand.vanderbilt.edu/color/>

| Role | Token | Value |
|------|-------|-------|
| Accent primary | `COLORS.accent.primary` | `#B49248` (metallic gold, Pantone 871 C) |
| Accent light | `COLORS.accent.light` | `#CFAE70` (Nike Club Gold, Pantone 4024) |
| Accent muted | `COLORS.accent.muted` | `#DCC79A` |
| Accent wash | `COLORS.accent.wash` | `rgba(180,146,72,0.06)` |
| Accent glow | `COLORS.accent.glow` | `rgba(180,146,72,0.12)` |
| Text primary | `COLORS.ink[900]` | `#1C1C1C` (Vanderbilt black) |
| Text secondary | `COLORS.ink[600]` | `#5C5C5C` |
| Page background | `COLORS.surface.paper` | `#FAFAFA` |
| Card surface | `COLORS.surface.elevated` | `#FFFFFF` |
| Success | `COLORS.semantic.success` | `#059669` |
| Warning | `COLORS.semantic.warning` | `#D97706` |
| Info | `COLORS.semantic.info` | `#0891B2` |

### `editorial`

| Role | Token | Value |
|------|-------|-------|
| Accent primary | `COLORS.accent.primary` | `#5B21B6` (violet) |
| Accent light | `COLORS.accent.light` | `#7C3AED` |
| Accent muted | `COLORS.accent.muted` | `#8B5CF6` |
| Accent wash | `COLORS.accent.wash` | `rgba(91,33,182,0.06)` |
| Accent glow | `COLORS.accent.glow` | `rgba(91,33,182,0.12)` |
| Text primary | `COLORS.ink[900]` | `#0A0A0B` |
| Text secondary | `COLORS.ink[600]` | `#3F3F46` |
| Page background | `COLORS.surface.paper` | `#FAFAFA` |
| Card surface | `COLORS.surface.elevated` | `#FFFFFF` |
| Success | `COLORS.semantic.success` | `#059669` |
| Warning | `COLORS.semantic.warning` | `#D97706` |
| Info | `COLORS.semantic.info` | `#0891B2` |

### `dark`

Ink scale is **inverted**: `ink[900]` is the lightest text, `ink[50]` is the
deepest background — the opposite of `editorial`.

| Role | Token | Value |
|------|-------|-------|
| Accent primary | `COLORS.accent.primary` | `#22D3EE` (cyan 400) |
| Accent light | `COLORS.accent.light` | `#67E8F9` |
| Accent muted | `COLORS.accent.muted` | `#0891B2` |
| Accent wash | `COLORS.accent.wash` | `rgba(34,211,238,0.08)` |
| Accent glow | `COLORS.accent.glow` | `rgba(34,211,238,0.16)` |
| Text primary | `COLORS.ink[900]` | `#F0F0F2` (near-white) |
| Text secondary | `COLORS.ink[600]` | `#70707A` |
| Page background | `COLORS.surface.paper` | `#0D1117` |
| Card surface | `COLORS.surface.elevated` | `#13131A` |
| Success | `COLORS.semantic.success` | `#34D399` |
| Warning | `COLORS.semantic.warning` | `#FBBF24` |
| Info | `COLORS.semantic.info` | `#60A5FA` |

### `brand`

Neutral slate base, designed to receive a `PD_ACCENT` override. Default
accent is a corporate blue but is expected to be replaced.

| Role | Token | Value |
|------|-------|-------|
| Accent primary | `COLORS.accent.primary` | `#0077CC` (default brand blue) |
| Accent light | `COLORS.accent.light` | `#339BE0` |
| Accent muted | `COLORS.accent.muted` | `#66B8F0` |
| Accent wash | `COLORS.accent.wash` | `rgba(0,119,204,0.06)` |
| Accent glow | `COLORS.accent.glow` | `rgba(0,119,204,0.12)` |
| Text primary | `COLORS.ink[900]` | `#0C0C0E` |
| Text secondary | `COLORS.ink[600]` | `#48484A` |
| Page background | `COLORS.surface.paper` | `#FAFAFA` |
| Card surface | `COLORS.surface.elevated` | `#FFFFFF` |
| Success | `COLORS.semantic.success` | `#30D158` |
| Warning | `COLORS.semantic.warning` | `#FF9F0A` |
| Info | `COLORS.semantic.info` | `#32ADE6` |

---

## Accent color override (`PD_ACCENT`)

Any theme's accent can be overridden with a hex color at build time. This is
most useful with the `brand` theme.

```bash
PD_THEME=brand PD_ACCENT=#E63946 node scripts/build-doc.js --input doc.md
```

**What gets overridden:** `accent.primary`, `accent.light`, `accent.muted`,
`accent.wash` (8% opacity suffix), `accent.glow` (16% opacity suffix).

**Caveat:** The override derives `light` and `muted` by setting them to
**identical** to `primary` — no lightening calculation is performed. If you
need distinct hover / muted shades, supply a full palette via the `brand`
theme defaults or contribute a hex-lightening utility.

**Validation:** Only valid hex colors are accepted: `/^#[0-9A-Fa-f]{3,8}$/`.
An invalid value is silently ignored and the theme's default accent is used.

**Injection:** `build.js` reads `process.env.PD_ACCENT` at bundle time and
replaces the `applyAccentOverride` function body with a literal before bundling,
so the browser HTML never contains any `process.env` references.

---

## Body background

The `wrap-html.js`, `wrap-article-html.js`, and `wrap-slides-html.js`
wrappers each inject the theme's `surface.paper` value as the `<body>`
background color in the output HTML. This ensures the page background matches
the theme even before React mounts.

| Theme | `body` background |
|-------|------------------|
| `vanderbilt` | `#FAFAFA` |
| `editorial` | `#FAFAFA` |
| `dark` | `#0D1117` |
| `brand` | `#FAFAFA` |

---

## Typography (shared across all themes)

Typography stacks are theme-independent and defined in `FONTS` in
`design-tokens.js`.

| Role | Stack |
|------|-------|
| Display | `'Fraunces', 'Playfair Display', Georgia, serif` |
| Headline | `'Instrument Serif', 'Noto Serif Display', Georgia, serif` |
| Body | `'Newsreader', 'Source Serif 4', Georgia, serif` |
| UI / Labels | `'DM Sans', 'Outfit', system-ui, sans-serif` |
| Mono / Data | `'IBM Plex Mono', 'JetBrains Mono', monospace` |

Fonts are loaded from Google Fonts by the HTML wrapper at runtime. No font
files are bundled.

# Theming and Branding

Control the visual look of every portable-docs build — from a single accent swap
to a full multi-brand configuration file.

← [Back to README](README.md)

---

## Contents

- [Themes](#themes)
- [Accent color](#accent-color)
- [Icons](#icons)
- [Config file and brand presets](#config-file-and-brand-presets)

---

## Themes

Four themes ship with the engine. Select one at build time; the choice is
**frozen into the HTML** — rebuild to change it.

| Name | Description | Body background | Default for |
|------|-------------|----------------|-------------|
| `vanderbilt` | Vanderbilt black & gold (light): paper-white ground, Vanderbilt-black ink, metallic-gold accent. | `#FAFAFA` | Global default |
| `editorial` | Paper-white, deep-ink text, violet accent. "MIT Tech Review meets Wired." | `#FAFAFA` | `resume`, `case-study`, `changelog`, `newsletter` |
| `dark` | Near-black base, electric-cyan accent. GitHub-dark / Obsidian-inspired. | `#0D1117` | — |
| `brand` | Neutral slate, designed to receive an accent override. | `#FAFAFA` | `landing`, `rfp` |

**Dark theme ink-scale note:** the `dark` theme's ink scale is **inverted** —
`ink[900]` is the *lightest* text (near-white `#F0F0F2`) and `ink[50]` is the
*deepest* background (`#0D1117`). This is the opposite of `vanderbilt`, `editorial`, and `brand`.

**Typography is identical across all themes.** Font stacks (Fraunces, Instrument
Serif, Newsreader, DM Sans, IBM Plex Mono) and the full type scale are defined
once in `design-tokens.js` and shared unconditionally.

### Selecting a theme

```bash
# Per-build CLI flag (highest priority)
node engine/scripts/build-doc.js --input doc.md --theme dark
node engine/scripts/build-doc.js --input doc.md --theme brand

# Session-wide env var
PD_THEME=dark node engine/scripts/build-doc.js --input doc.md
```

Or set `"theme"` in your [config file](#config-file-and-brand-presets).

Precedence: `--theme flag > PD_THEME env > config file > built-in default (vanderbilt)`.

See [references/theming.md](../references/theming.md) for the full token tables
for each theme.

---

## Accent color

Any theme's accent can be overridden with a custom hex color at build time.
This is most powerful with the `brand` theme, which ships with a placeholder
corporate blue intended to be replaced.

**There is no `--accent` flag.** Use one of:

| Method | Example |
|--------|---------|
| Environment variable | `PD_ACCENT=#E63946` |
| Config file key | `"accent": "#E63946"` |

```bash
# Override accent via env var (combine with PD_THEME)
PD_THEME=brand PD_ACCENT=#E63946 node engine/scripts/build-doc.js --input doc.md
```

### What gets overridden

When a valid `PD_ACCENT` value is supplied, the engine derives five accent
tokens from the base hex:

| Token | Derivation |
|-------|-----------|
| `accent.primary` | The supplied hex (normalized to `#RRGGBB`) |
| `accent.light` | `lighten(primary, 0.20)` — 20% blend toward white |
| `accent.muted` | `lighten(primary, 0.40)` — 40% blend toward white |
| `accent.wash` | `primary + '14'` — ~8% opacity hex suffix |
| `accent.glow` | `primary + '29'` — ~16% opacity hex suffix |

The accent override does **not** change the body background; that is controlled
exclusively by the theme.

### Validation

Accepted formats: 3–8 digit hex strings matching `/^#[0-9A-Fa-f]{3,8}$/`
(e.g. `#F00`, `#E63946`, `#E63946FF`). An invalid value is **silently ignored**
and the theme's default accent is used instead.

---

## Icons

The 25-icon core set is used in `@card` markers via `icon="<name>"`. Names are
**case-sensitive** (`arrowRight`, not `ArrowRight`). Any unrecognized name
renders a `placeholder` glyph (a dashed-border rounded square) rather than
silently showing a real icon.

For usage syntax see [markers.md#icon-names](markers.md#icon-names). For the full glyph
list see [references/icons.md](../references/icons.md).

---

## Config file and brand presets

A JSON config file lets you set per-project defaults and define named brand
presets that can be activated with a single `--brand` flag.

### File location and discovery

| File | Purpose |
|------|---------|
| `portable-docs.config.json` (project root) | Project-level config |
| `~/.portable-docs.config.json` | Global user fallback |

Discovery walks **up from the input file's directory** toward the filesystem
root. The first `portable-docs.config.json` found wins. If no project-level
file is found, the global fallback is checked.

**Escape hatches:**

| Method | Effect |
|--------|--------|
| `--config <path>` | Use a specific file; skips walk-up |
| `--no-config` | Ignore all config files for this invocation |
| `PD_NO_CONFIG=1` | Same as `--no-config`, via environment variable |

### Schema

```json
{
  "theme": "editorial",
  "accent": "#5B5EA6",
  "outDir": "~/Documents/portable-docs",
  "style": "proposal",
  "identity": {
    "from": "Jane Smith",
    "email": "jane@example.com",
    "linkedin": "https://linkedin.com/in/janesmith",
    "github": "https://github.com/janesmith",
    "headshot": "./assets/headshot.jpg",
    "logo": "./assets/logo.png",
    "brand": "Acme Corp",
    "brandsub": "Product Team",
    "footer": "Confidential"
  },
  "brands": {
    "acme": {
      "theme": "brand",
      "accent": "#0057B8",
      "identity": {
        "brand": "Acme Corp",
        "footer": "Confidential"
      }
    }
  }
}
```

### Top-level keys

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| `theme` | string | `"vanderbilt"` | `vanderbilt` \| `editorial` \| `dark` \| `brand` |
| `accent` | string | _(theme default)_ | Hex accent override |
| `outDir` | string | `~/Documents/portable-docs` | Default output directory (**not** `out`) |
| `style` | string | `"proposal"` | `proposal` \| `article` |
| `identity` | object | — | Author identity; fills blank `@header` fields |
| `brands` | object | — | Named brand presets |

> **Naming trap:** the output-directory key is `outDir`, not `out`.

### Identity fields

`identity` fills **blank** fields in the document's `@header` block. The
document's own `@header` values always win per-field. If a document has no
`@header`, a header is synthesized from identity plus the input filename as
a fallback title.

| Key | Fills `@header` field | Notes |
|-----|-----------------------|-------|
| `from` | Author name | |
| `email` | Author email | |
| `linkedin` | LinkedIn URL | |
| `github` | GitHub URL | |
| `headshot` | Headshot image | Relative path resolves against config file's directory |
| `logo` | Logo image | Relative path resolves against config file's directory |
| `brand` | Organization name | |
| `brandsub` | Sub-brand / team label | Key is `brandsub` (lowercase) in JSON |
| `footer` | Footer text | |

> **Naming trap:** `brandsub` is lowercase in JSON (`"brandsub"`, not `"brandSub"`).

> **Asset resolution:** relative `headshot` and `logo` paths resolve against the
> **config file's directory**, not the input file's directory or cwd. Absolute
> paths and `https://` / `data:` URLs are used as-is.

### Named brand presets (`--brand`)

The `brands` map holds any number of named presets. Each preset is a partial
config object that is **deep-merged over the top-level defaults** when selected.

```bash
# Activate the "acme" preset
node engine/scripts/build-doc.js --input doc.md --brand acme
```

If `--brand <name>` names a preset that does not exist in `brands`, the engine
throws an error listing the available preset names.

### Precedence

```
flag > env (PD_*) > config > --type default > built-in
```

| Source | Example |
|--------|---------|
| CLI flag (highest) | `--theme dark`, `--brand acme` |
| Environment variable | `PD_THEME=dark`, `PD_ACCENT=#E63946`, `PORTABLE_DOCS_OUT=~/exports` |
| Config file | `"theme": "brand"` in `portable-docs.config.json` |
| `--type` default | `brand` theme for `landing` / `rfp` types |
| Built-in default (lowest) | `vanderbilt` theme, `~/Documents/portable-docs` output dir |

An **empty string (`''`)** in an env var or config value is treated as
**unset** and falls through to the next level. A non-empty flag always wins.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `PD_THEME` | Default theme (`vanderbilt` \| `editorial` \| `dark` \| `brand`) |
| `PD_ACCENT` | Hex accent override |
| `PORTABLE_DOCS_OUT` | Default output directory |
| `PD_NO_CONFIG=1` | Disable config discovery for this invocation |
| `PD_BROWSER` | Override browser used by `--open` |

---

## See also

- [Document Types](document-types.md) — type-specific defaults including `brand` theme for `landing`/`rfp`
- [Markers](markers.md) — `@header`, `@card`, and other content markers
- [Commands and CLI](commands-and-cli.md) — full flag reference
- [Theming Reference](../references/theming.md) — full token tables for each theme
- [Config Reference](../references/config.md) — full config schema
- [Icon Reference](../references/icons.md) — full glyph list

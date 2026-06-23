# Config Reference — `portable-docs.config.json`

A project-level (or global) JSON file that sets theme, accent, output directory,
default style, author identity, and named brand presets. All fields are optional.

---

## Discovery

The engine walks **up from the input file's directory** toward the filesystem root,
looking for `portable-docs.config.json`. The first match wins. If no project-level
file is found, it falls back to `~/.portable-docs.config.json` (global user config).

```
input file's dir → parent → … → / → ~/.portable-docs.config.json → (none)
```

**Escape hatches:**

| Method | Effect |
|--------|--------|
| `--config <path>` | Use a specific config file (absolute or relative path); skips walk-up |
| `--no-config` | Ignore all config files for this invocation |
| `PD_NO_CONFIG=1` | Same as `--no-config`, via environment variable |

---

## Schema

```json
{
  "theme":   "editorial",
  "accent":  "#5B5EA6",
  "outDir":  "~/Documents/portable-docs",
  "style":   "proposal",

  "identity": {
    "from":      "Your Name",
    "email":     "you@example.com",
    "linkedin":  "https://linkedin.com/in/yourhandle",
    "github":    "https://github.com/yourhandle",
    "headshot":  "./assets/headshot.jpg",
    "logo":      "./assets/logo.png",
    "brand":     "Acme Corp",
    "brandsub":  "Product Team",
    "footer":    "Confidential"
  },

  "brands": {
    "work": {
      "theme":  "brand",
      "accent": "#0057B8",
      "identity": {
        "brand":    "Acme Corp",
        "brandsub": "Product Team",
        "logo":     "./assets/acme-logo.png",
        "footer":   "Confidential — Acme Corp"
      }
    },
    "personal": {
      "theme":  "editorial",
      "accent": "#5B5EA6",
      "identity": {
        "brand": "My Name",
        "logo":  "./assets/personal-logo.png"
      }
    }
  }
}
```

---

## Top-level keys

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `theme` | `string` | `"editorial"` | Default theme: `editorial` \| `dark` \| `brand` |
| `accent` | `string` | _(theme default)_ | Hex accent color override (e.g. `"#E63946"`) |
| `outDir` | `string` | `~/Documents/portable-docs` | Default output directory |
| `style` | `string` | `"proposal"` | Default format: `proposal` \| `article` |
| `identity` | `object` | — | Author identity defaults (fills blank `@header` fields) |
| `brands` | `object` | — | Named brand presets; each key is a preset name |

---

## Identity fields

All identity fields are optional. They fill **blank** fields in the document's
`@header` block — the document's own `@header` values always win per-field.
If a document has no `@header` at all, a header is synthesized from identity
plus the input filename as a fallback title.

| Key | Maps to `@header` field | Notes |
|-----|------------------------|-------|
| `from` | `@from name=` | Author full name |
| `email` | `@from email=` | Author email |
| `linkedin` | `@from linkedin=` | LinkedIn profile URL |
| `github` | `@from github=` | GitHub profile URL |
| `headshot` | `@headshot url=` | Path or URL to headshot image |
| `logo` | `@logo value=` | Path or URL to logo image |
| `brand` | `@brand value=` | Organization / company name |
| `brandsub` | `@brandsub value=` | Team or sub-brand label |
| `footer` | `@footer value=` | Footer text |

**Relative `headshot` and `logo` paths** are resolved against the directory of the
config file (not the input file or cwd). Absolute paths and `https://` / `data:`
URLs are used as-is. `~` is expanded to the user's home directory.

---

## Named presets (`--brand`)

The `brands` map holds any number of named presets. Each preset is a partial config
object that is **deep-merged over the top-level defaults** when selected.

```bash
# Select the "work" preset — deep-merges brands.work over the top-level defaults
node engine/scripts/build-doc.js --input my-pitch.md --brand work
```

Or via the `/doc` and `/slides` slash commands:

```
/doc my-pitch.md --brand work
```

If `--brand <name>` refers to a preset that does not exist in `brands`, the engine
throws an error listing the available preset names.

---

## Precedence

```
flag > env > config > built-in default
```

| Source | Example |
|--------|---------|
| CLI flag (highest) | `--theme dark`, `--brand work` |
| Environment variable | `PD_THEME=dark`, `PD_ACCENT=#E63946`, `PORTABLE_DOCS_OUT=~/exports` |
| Config file | `"theme": "brand"` in `portable-docs.config.json` |
| Built-in default (lowest) | `editorial` theme, `~/Documents/portable-docs` output dir |

An explicit flag always wins. An empty string in an env var or config value is
treated as "unset" (falls through to the next level).

---

## Example: multi-brand setup

```json
{
  "theme": "editorial",
  "identity": {
    "from":     "Jane Smith",
    "email":    "jane@example.com",
    "linkedin": "https://linkedin.com/in/janesmith"
  },
  "brands": {
    "acme": {
      "theme":  "brand",
      "accent": "#0057B8",
      "identity": {
        "brand":    "Acme Corp",
        "logo":     "./assets/acme-logo.png",
        "footer":   "Confidential — Acme Internal"
      }
    },
    "consulting": {
      "theme":  "editorial",
      "accent": "#1A1A2E",
      "identity": {
        "brand":    "Jane Smith Consulting",
        "logo":     "./assets/consulting-logo.png",
        "footer":   "© Jane Smith Consulting"
      }
    }
  }
}
```

Usage:

```bash
/doc deck.md --brand acme        # Acme Corp theme + identity
/doc proposal.md --brand consulting   # Consulting theme + identity
/doc personal.md                 # Top-level editorial defaults + identity
```

---

## Key Takeaways

- Place `portable-docs.config.json` at your project or repo root; it auto-discovers.
- `identity` fills blank `@header` fields — the doc's own header always wins per-field.
- `brands` lets you switch branded contexts with a single `--brand <name>` flag.
- Precedence: **flag > env > config > default** — a flag always wins, config never overrides a flag.
- Use `--no-config` or `PD_NO_CONFIG=1` when you need clean, config-free output (e.g. in CI).
- Relative asset paths (`headshot`, `logo`) resolve against the config file's directory.

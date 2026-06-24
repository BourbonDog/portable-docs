<p align="center">
  <img src="plugins/portable-docs/assets/icon-512.png" width="128" height="128" alt="portable-docs">
</p>

# portable-docs

**Turn your content into polished, self-contained, shareable HTML documents — inside Claude Code.**

One command. Three formats. Zero runtime dependencies. A single `.html` file you can email, drop in Notion, or share as a public link.

---

> 📖 **Full guide:** [plugins/portable-docs/docs/](plugins/portable-docs/docs/) — getting started, every format/type/marker/command, how it works, and troubleshooting.

## Install

```
/plugin marketplace add BourbonDog/portable-docs
```

```
/plugin install portable-docs@portable-docs
```

Requires Node.js 18 or later (`node --version` to check).

---

## What it does

portable-docs takes your markdown — notes, outlines, prose, bullet points — and builds a
beautifully formatted, single self-contained HTML file. No build server. No local asset files.
React is vendored and inlined, and JSX is precompiled at build time — the single `.html` file
renders fully offline, with no CDN and no network connection required. Local images, logos, and
headshots are embedded as base64 data URIs so the file is truly portable; remote image URLs are
kept as references. Attach it to an email, drop it in Notion, or share it as a link; no sibling
files needed.

### Three formats

| Format | Flag | Best for |
|--------|------|----------|
| **Proposal** (default) | _(none)_ | Pitches, one-pagers, proposals, credential docs. Rich visual components via `@`-marker DSL (`@stats`, `@cards`, `@chart`, `@timeline`, `@quotes`, etc.). |
| **Long-form article** | `--style article` | Essays, reports, blog posts, how-tos. Standard markdown in, editorial magazine layout out. |
| **Slide deck** | `--slides` | Presentations, decks, codebase recaps. Slides separated by `---`; navigable in the browser. |

### Themes

| Theme | Feel | Flag |
|-------|------|------|
| `editorial` | Paper-white, violet accent. MIT Tech Review meets Wired. | default |
| `dark` | Near-black, cyan accent. Best for technical docs and decks. | `--theme dark` |
| `brand` | Neutral slate, ready for a custom accent color. | `--theme brand` |

Override the accent color for any theme: set `PD_ACCENT=#HEX` before running the engine
(e.g. `PD_ACCENT=#E63946`).

---

## Commands

| Command | What it does |
|---------|-------------|
| `/doc <source> [flags]` | Build a polished HTML document from a file or inline content. Supports all three formats via flags. |
| `/slides <source> [flags]` | Alias for `/doc --slides`. Structures content as a navigable slide deck; defaults to `--theme dark`. |
| `/lint <source.md>` | Check a source file for malformed, unknown, or under-specified markers — line-numbered output, exits non-zero on errors. No build. |
| `/watch <source.md> [flags]` | Start a local live-preview server. Rebuilds on save and auto-refreshes the browser via Server-Sent Events. |
| `/export <file.html> [--pdf] [--png] [--out <dir>]` | Export a previously built HTML file to PDF, PNG, or both (default: both). Drives a system browser you already have — no extra deps. |
| `/from-repo [path] [flags]` | Scan a codebase, draft a recap, and build it as a deck or article. No content needed — the agent reads the repo. |
| `/share <html-file>` | Publish an HTML file to a public URL via GitHub Gist (`gh`) or Vercel. Prints install instructions if neither is available. |
| `/doctor` | Run the portable-docs self-test. Verifies Node version, engine path, and all three build pipelines (including a lint check). |

---

## Authoring config

Drop a `portable-docs.config.json` at your project root (or repo root) to set
project-wide defaults for theme, accent color, output directory, and author identity:

```json
{
  "theme": "brand",
  "accent": "#0057B8",
  "identity": {
    "from":   "Your Name",
    "email":  "you@example.com",
    "brand":  "Acme Corp",
    "footer": "Confidential"
  }
}
```

The config is discovered by walking up from the input file's directory; falling back to
`~/.portable-docs.config.json` if no project file is found.

**Named brand presets** — add a `brands` map and switch contexts with `--brand <name>`:

```bash
/doc my-pitch.md --brand work      # deep-merges brands.work over the top-level defaults
```

**Precedence:** `flag > env (PD_THEME / PD_ACCENT / PORTABLE_DOCS_OUT) > config > built-in default`.
Use `--no-config` or `PD_NO_CONFIG=1` to skip config loading entirely.

See [`references/config.md`](plugins/portable-docs/references/config.md) for the full schema and examples.

---

## Lint

Every `/doc` and `/slides` build **auto-lints** the source and prints line-numbered
warnings to stderr (the build still completes). Add `--strict` to abort the build on
lint errors instead:

```bash
/doc my-pitch.md --strict          # aborts if there are lint errors
```

To lint without building, use `/lint`:

```bash
/lint my-pitch.md                  # line-numbered errors + warnings; exits non-zero on errors
```

**What it catches:**

| Severity | Code | Condition |
|----------|------|-----------|
| error | `unclosed-block` | Paired marker opened but never closed |
| error | `unknown-marker` | Unrecognised marker name (e.g. `@stas`) |
| error | `missing-attr` | Required attribute absent (e.g. `@stat` without `value`) |
| error | `bad-enum` | Attribute value not in allowed set |
| warning | `unknown-icon` | `icon=` name not in the icon set (falls back to placeholder) |
| warning | `unnumbered-section` | `## Heading` without the required `N.` prefix |
| warning | `duplicate-header` | More than one `@header` block |

---

## Live preview

`/watch` starts a local dev server and keeps a browser tab live while you edit:

```bash
/watch my-pitch.md                 # opens http://127.0.0.1:<port>/ and rebuilds on save
/watch my-pitch.md --brand work    # watch with a brand preset
```

- Auto-refreshes the browser tab on every save via Server-Sent Events (zero npm deps).
- The on-disk HTML stays a pristine self-contained file — the reload script is injected
  only into the served HTTP response, never written to disk.
- A build error shows a banner in the preview without crashing the watcher; fix and save
  to recover.
- Preview-only: `--pdf` and `--png` are ignored while watching.
- Also watches `portable-docs.config.json` — brand/theme/identity changes hot-reload too.
- Press `Ctrl-C` to stop.

---

## Export & print

portable-docs can export any built document to PDF or PNG using a headless
browser already installed on your system (Chrome, Edge, or Chromium).
**No extra npm packages are required.**

```bash
# Export a built HTML file (produces both PDF and PNG by default)
/export ~/Documents/portable-docs/my-pitch.html

# PDF only, custom output directory
/export my-pitch.html --pdf --out ~/Desktop/exports

# Build and export in one pass
/doc my-pitch.md --theme editorial --pdf --png
/slides my-outline.md --pdf
```

**Format behavior:**
- **Proposals and articles** — PDF is the full multi-page document. PNG is a full-page capture of the entire scrollable page (not just the viewport).
- **Slide decks** — PDF is landscape with one slide per page. PNG is a single hero shot of the title slide.
- **Print stylesheet** — on-screen chrome (table of contents, reading-progress bar, copy buttons, heading anchors) is hidden in PDFs. Collapsed card bodies are expanded. Theme colors are preserved.

**Browser detection order:** Chrome → Edge → Chromium. Override with `PD_BROWSER=/path/to/browser`.

**Graceful fallback:** if no supported browser is found, the export command warns and tells you how to install one, set `PD_BROWSER`, or use the browser's built-in Print → Save as PDF — it never crashes.

---

## Viewer features

Every built document includes interactive on-screen affordances:

- **Data-driven table of contents** (proposals) — the sticky sidebar reads section titles directly from the document; labels always match the content.
- **Reading-progress bar** (proposals and articles) — a thin accent-colored indicator at the top of the page tracks scroll position.
- **Hover heading anchors** (proposal `##` section headings) — a `#` link appears on hover; clicking navigates to that section via the URL hash (a shareable deep-link).
- **Copy-code button** — appears on `@terminal` and code blocks on hover; copies the text to the clipboard.

These affordances are hidden automatically when printing or exporting to PDF.

---

## 60-second example

```bash
# Build a proposal from your notes
/doc my-pitch.md --theme editorial

# Build a dark-themed slide deck
/slides my-outline.md

# Scan the current repo and build a recap deck
/from-repo

# Share the result publicly (requires gh or vercel)
/share ~/Documents/portable-docs/my-pitch.html
```

Or invoke the engine directly:

```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input my-pitch.md \
  --out ~/Documents/portable-docs/my-pitch.html \
  --theme editorial
```

---

## Engine flags reference

| Flag | Default | Purpose |
|------|---------|---------|
| `--input <md>` | (required) | Path to the input markdown file |
| `--out <html>` | `~/Documents/portable-docs/<slug>.html` | Output path |
| `--title <text>` | Derived from `@title` or filename | Document title |
| `--theme <name>` | `editorial` | `editorial` \| `dark` \| `brand` |
| `--style <name>` | `proposal` | `proposal` \| `article` |
| `--slides` | off | Slide deck format (takes priority over `--style article`) |
| `--jsx` | off | Copy the JSX bundle alongside the HTML output |
| `--no-open` | _(opens by default)_ | Suppress auto-open in browser |
| `--lint` | off | Lint only — report diagnostics without building; exits non-zero on errors |
| `--strict` | off | Abort the build when there are lint errors (auto-lint still runs by default) |
| `--watch` | off | Start a live-preview server; rebuilds and refreshes on save |
| `--brand <name>` | _(none)_ | Select a named preset from `portable-docs.config.json`'s `brands` map |
| `--config <path>` | _(walk-up discovery)_ | Use a specific config file instead of auto-discovery |
| `--no-config` | off | Skip config file loading for this invocation |

**Env vars:** `PORTABLE_DOCS_OUT` (output path), `PD_THEME` (session theme), `PD_ACCENT` (hex accent override), `PD_NO_CONFIG=1` (skip config loading).

---

## How it works

The engine is a vendored React renderer with zero local dependencies. It compiles your
markdown + `@`-markers into a JSX component tree, precompiles the JSX to plain JavaScript at
build time using Babel (Node-side, not in the browser), bundles it with the classic JSX runtime
(the "never blank" guarantee — no module-format mismatch), and writes a single self-contained
HTML file with React and all scripts inlined. No CDN. No in-browser Babel. No network
connection required to open the output. No local sibling assets, no build server.

---

## Credit

Authored by **Christian Wagner** ([@BourbonDog](https://github.com/BourbonDog)). MIT licensed.

Inspired by John Renaldi's northwestern (https://github.com/jrenaldi79/northwestern).

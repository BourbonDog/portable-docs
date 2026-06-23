# portable-docs

**Turn your content into polished, self-contained, shareable HTML documents — inside Claude Code.**

One command. Three formats. Zero runtime dependencies. A single `.html` file you can email, drop in Notion, or share as a public link.

---

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
| `/export <file.html> [--pdf] [--png] [--out <dir>]` | Export a previously built HTML file to PDF, PNG, or both (default: both). Drives a system browser you already have — no extra deps. |
| `/from-repo [path] [flags]` | Scan a codebase, draft a recap, and build it as a deck or article. No content needed — the agent reads the repo. |
| `/share <html-file>` | Publish an HTML file to a public URL via GitHub Gist (`gh`) or Vercel. Prints install instructions if neither is available. |
| `/doctor` | Run the portable-docs self-test. Verifies Node version, engine path, and all three build pipelines. |

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
- **Hover heading anchors** (`##` and `###` headings) — a `#` link appears on hover; clicking copies a deep-link to the clipboard.
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

**Env vars:** `PORTABLE_DOCS_OUT` (output path), `PD_THEME` (session theme), `PD_ACCENT` (hex accent override).

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

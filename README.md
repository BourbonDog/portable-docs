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
React and Babel load from the unpkg CDN at view time, so a network connection is required to
open the output. The file itself is self-contained — attach it to an email, drop it in Notion,
or share it as a link; no sibling files needed.

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
| `/from-repo [path] [flags]` | Scan a codebase, draft a recap, and build it as a deck or article. No content needed — the agent reads the repo. |
| `/share <html-file>` | Publish an HTML file to a public URL via GitHub Gist (`gh`) or Vercel. Prints install instructions if neither is available. |
| `/doctor` | Run the portable-docs self-test. Verifies Node version, engine path, and all three build pipelines. |

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
markdown + `@`-markers into a JSX component tree, bundles it with the classic JSX runtime
(the "never blank" guarantee — no module-format mismatch), and writes a single self-contained
HTML file. React, ReactDOM, and Babel are loaded from the unpkg CDN at view time, so opening
the output requires a network connection. No local sibling assets, no build server, no
framework footprint beyond what unpkg provides.

---

## Credit

Authored by **Christian Wagner** ([@BourbonDog](https://github.com/BourbonDog)). MIT licensed.

Inspired by John Renaldi's northwestern (https://github.com/jrenaldi79/northwestern).

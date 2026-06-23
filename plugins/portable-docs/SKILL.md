---
name: portable-docs
description: >
  Use this skill when the user wants to turn their content into a polished,
  shareable, self-contained HTML document. Triggers: "make this a polished
  doc", "turn this into a proposal", "create a one-pager", "generate a report",
  "build a slide deck", "write a long-form article", "make this shareable",
  "create a pitch doc", "export this as HTML", "design a presentation",
  "build a portfolio page", "format this professionally", "package this as a
  document", "make this look like Wired / MIT Tech Review". Also triggers on
  any request for a professional HTML output from markdown or raw notes.
---

# portable-docs

Turns markdown (or raw content) into a polished, self-contained, shareable
HTML document. Three formats: **proposal** (rich DSL with visual components),
**article** (long-form editorial), and **slides** (deck). All output is a
single `.html` file — no build server, no dependencies, drag-to-email ready.

---

## When to use

Use this skill when the user wants:
- A visually designed HTML document from their notes, outline, or draft
- A professional-grade proposal, pitch doc, or one-pager
- A long-form editorial article or report
- A slide deck from bullet points or an outline
- A portfolio page, credential showcase, or career document
- Any "shareable link" or "email-ready" polished output

**Do not use** for plain-text output, code generation, or when the user
explicitly wants PDF, Word, or a static website (multi-page).

---

## Preflight — Node check

Before invoking the engine, verify Node.js ≥ 18 is available:

```bash
node --version
```

If the command fails or the version is below 18, stop and tell the user:

> portable-docs requires Node.js 18 or later. Install it at https://nodejs.org
> then try again.

---

## Step 1 — Identify source content and pick a format

Ask (or infer from context) what the user has:

| User has | Pick format |
|----------|-------------|
| A structured pitch, proposal, or credential doc | **proposal** (default) |
| A long-form article, essay, or report | **article** (`--style article`) |
| A slide deck outline or bullet list | **slides** (`--slides`) |

**Guidance:**
- **Proposal** is best when the content has distinct sections, data points,
  quotes, or visual components (stats, charts, cards, timelines). Richer output.
- **Article** is best for flowing prose: essays, reports, how-tos, blog posts.
  Plain markdown in, editorial layout out.
- **Slides** is best when the user says "deck", "presentation", or has content
  organized as slide-by-slide bullets separated by `---`.

---

## Step 2 — Auto-markup the content

Before building, structure the source markdown correctly for the chosen format.
Read `references/markers.md` (at `$CLAUDE_PLUGIN_ROOT/references/markers.md`)
for the complete syntax. The key rules per format:

### Proposal format (default)

- Add a `<!-- @header -->` block at the top with `@title`, `@subtitle`,
  `@brand`, `@date`, `@from`, `@footer`, etc.
- Structure body as numbered `## N. Title` sections, `### Subsection` headings.
- Insert `@`-marker blocks to produce rich components. Match content type to
  component using `references/components.md`:

  | Content type | Marker to use |
  |---|---|
  | 2–5 key stats | `@stats` / `@stat` |
  | Trend or comparison data | `@chart type="growth"` or `type="bar"` |
  | 3–9 parallel items / pillars | `@cards type="feature"` |
  | Career history or roadmap | `@timeline` / `@entry` |
  | External validation quotes | `@quotes` / `@quote` |
  | One key emphasized statement | `@pullquote` |
  | Portfolio work items | `@worklist` / `@workitem` |
  | Credentials / metrics row | `@credentials` / `@credential` |
  | Testimonials | `@testimonials` / `@testimonial` |
  | Terminal / API output | `@terminal` |
  | Tabular comparisons | GFM table + optional `<!-- @table variant="striped" -->` |

- Add a `## Citations` section at the end if sources are referenced.

### Article format (`--style article`)

- Use standard markdown: `# H1` for title, `*italic*` for subtitle (first line),
  `## Section`, `### Subsection`, prose paragraphs, lists, blockquotes, tables.
- Optional: add a `<!-- @header -->` block at the top (same schema as proposal)
  for a full-bleed cover header. Its `@title`/`@subtitle` take precedence over
  `# H1` / italic.
- No other `@`-markers are used in the body.

### Slides format (`--slides`)

- Separate each slide with `---` (three dashes on its own line).
- First non-blank line of each slide becomes the slide title (`#` or `##`
  heading or plain text).
- Optional: place a `<!-- @header -->` block before the first `---` for a
  title slide (uses `@title`, `@subtitle`, `@brand`, `@footer`, `@date`, etc.).
- Body of each slide uses the same block types as article: paragraphs, bullets,
  numbered lists, blockquotes, tables.

---

## Step 3 — Choose a theme

See `references/theming.md` for full palette details. Three themes ship:

| Theme | Feel | Best for |
|-------|------|----------|
| `editorial` | Paper-white, violet accent. MIT Tech Review meets Wired. | Default — works for everything |
| `dark` | Near-black, cyan accent. Developer / technical docs. | Technical proposals, engineering docs |
| `brand` | Neutral slate. Designed to receive a `PD_ACCENT` hex override. | Branded proposals, corporate use |

Use `--theme <name>` to select. Override accent with `PD_ACCENT=#hex`.

---

## Step 4 — Run the engine

The engine entry point is `engine/scripts/build-doc.js`. In a Claude Code
plugin context, invoke it via the plugin root env var.

**Proposal (default):**
```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input path/to/doc.md \
  --out path/to/output.html \
  --theme editorial \
  --no-open
```

**Article:**
```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input path/to/article.md \
  --style article \
  --out path/to/output.html \
  --theme editorial \
  --no-open
```

**Slides:**
```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input path/to/deck.md \
  --slides \
  --out path/to/output.html \
  --theme dark \
  --no-open
```

**All flags:**

| Flag | Default | Purpose |
|------|---------|---------|
| `--input <md>` | (required) | Path to input markdown file |
| `--out <html>` | `~/Documents/portable-docs/<slug>.html` | Output HTML path |
| `--title <text>` | `@header` `@title`, else input filename | Document title; also drives the default output slug |
| `--theme <name>` | `editorial` | Theme: `editorial` \| `dark` \| `brand` |
| `--style <name>` | `proposal` | Format: `proposal` \| `article` |
| `--slides` | off | Slide deck format. If combined with `--style article`, `--slides` silently wins (no error). |
| `--jsx` | off | Copy the JSX bundle next to the HTML output |
| `--no-open` | (opens by default) | Suppress auto-open in browser |

**Env vars:**

| Var | Purpose |
|-----|---------|
| `PORTABLE_DOCS_OUT` | Session-wide output path override (same as `--out`) |
| `PD_THEME` | Session-wide theme default. An explicit `--theme` flag always wins over `PD_THEME`. |
| `PD_ACCENT` | Hex accent color override (e.g. `PD_ACCENT=#E63946`) |

On success the engine prints the resolved output path and exits 0. The HTML
file is self-contained — no local sibling assets. React, ReactDOM, and Babel
load from the unpkg CDN at view time, so a network connection is required to
open the output in a browser.

---

## Step 5 — Auto-open and iterate

Without `--no-open`, the engine opens the output in the default browser
immediately after a successful build.

To iterate:
1. Edit the input markdown (adjust markers, prose, flags).
2. Re-run the same build command (overwriting the output path).
3. Refresh the browser tab.

Common refinement loops:
- Swap `--theme dark` → `--theme editorial` to compare feels.
- Add `PD_ACCENT=#E63946` for a brand color.
- Promote a bullet list to a `@cards type="feature"` block for visual impact.
- Add `@stats` at the top of a section to lead with data.

---

## Design principles

- **Editorial quality first.** Every output should look intentional — magazine
  typography, generous white space, purposeful use of components.
- **Right component for the content.** Don't use cards for everything. Use the
  component selector table above. Consult `references/components.md` for full
  detail on when each component shines.
- **Self-contained and shareable.** The output is a single `.html` file — no
  local sibling assets, no build server. React loads from the unpkg CDN at view
  time, so a network connection is required to open it. Attach to email, drop in
  Notion, or share as a link — no companion files needed.
- **Less is more.** 3–5 rich components per proposal reads better than 12.
  Long prose in article format reads better than marker-heavy markup.

---

## References

All reference docs live alongside this skill in `$CLAUDE_PLUGIN_ROOT/references/`:

| File | Contents |
|------|----------|
| `markers.md` | Complete input syntax for all 3 formats — read this to write markup |
| `components.md` | Component catalog: what each renders, when to use it |
| `theming.md` | Theme palette details + `PD_ACCENT` override instructions |
| `icons.md` | Valid icon names for `@card icon="…"` and `@workitem icon="…"` |

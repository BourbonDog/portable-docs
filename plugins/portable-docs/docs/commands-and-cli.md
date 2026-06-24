# Commands and CLI Reference

Complete reference for every portable-docs slash command and the raw Node engine
invocation. Back to [README](../../../README.md).

---

## The eight commands

### `/doc`

**Purpose:** The main build command. Turns a Markdown file or inline content into
a polished, self-contained HTML document.

**Invocation:**

```
/doc <source> [flags]
```

`<source>` is a file path or inline Markdown text. If inline text is passed, the
agent writes it to a temporary `.md` file before calling the engine.

**Flags:**

| Flag | Description |
|------|-------------|
| `--type <name>` | Document type: `resume`, `case-study`, `changelog`, `newsletter`, `landing`, `rfp`. Sets a default base format and theme; all other flags override it. |
| `--style proposal` | Rich proposal / pitch layout (default). |
| `--style article` | Long-form editorial layout. |
| `--slides` | Slide deck. Wins over `--style article` when both are passed. |
| `--theme <name>` | Visual theme: `editorial` (default), `dark`, or `brand`. |
| `--brand <name>` | Select a named brand preset from `portable-docs.config.json`. |
| `--config <path>` | Use a specific config file instead of auto-discovery. |
| `--no-config` | Skip config file loading for this build. |
| `--lint` | Lint only — prints diagnostics without building. Exits non-zero on errors. |
| `--strict` | Abort the build if any lint errors are found. |
| `--watch` | Start a live-preview server; rebuilds and auto-refreshes on save. |
| `--jsx` | Copy the JSX bundle alongside the HTML output. |
| `--pdf` | Export to PDF at build time (requires a system browser). |
| `--png` | Export to PNG at build time (requires a system browser). |

**Behavior:**
- Default output: `~/Documents/portable-docs/<slug>.html` (overridden by `--out`,
  `PORTABLE_DOCS_OUT`, or the config `outDir`).
- Default theme: `editorial`.
- Default format: `proposal`.
- Auto-lints every build and prints warnings to stderr; the build still completes
  unless `--strict` is also set.
- On success, prints the resolved output path and opens the file in the browser
  (suppress with `--no-open` at the engine level).

---

### `/slides`

**Purpose:** Convenience alias for `/doc --slides`. Builds a slide deck from a
source file or outline.

**Invocation:**

```
/slides <source> [--theme editorial|dark|brand] [--brand <name>] [--lint] [--strict] [--watch] [--jsx]
```

**Behavior:**
- Identical to `/doc --slides`; the `--slides` flag is locked in automatically.
- Default (recommended) theme is `dark`; override with `--theme`.
- Separate slides with `---` (a blank line, three dashes, blank line). The first
  non-blank line of each slide becomes its title.
- Add a `<!-- @header -->` block before the first `---` for a title slide.

> **Gotcha:** `/slides` is syntactic sugar for `/doc --slides`. The underlying
> engine call is identical. It is not a separate pipeline.

---

### `/lint`

**Purpose:** Check a Markdown source file for portable-docs marker problems
without building.

**Invocation:**

```
/lint <source.md>
```

**Behavior:**
- Prints line-numbered errors and warnings to stderr.
- **Never builds** — exits immediately after the lint run.
- Exits non-zero (exit 1) when any errors are found.
- Exits 0 when the file is clean; prints `lint: clean`.

**What it checks (proposal format):**
- Unclosed or unmatched paired markers (e.g. `<!-- @stats -->` with no closing tag).
- Unknown markers (typos such as `@stas`).
- Missing required attributes (`@card` needs `icon` + `title`; `@stat` needs
  `value`, `label`, `source`).
- Invalid enum values (`@cards type` must be `feature|profile|topic`;
  `@chart type` must be `growth|bar|hierarchy|range`).
- Unknown `icon=` names (warning only — renders with a placeholder glyph).
- `## Title` sections missing the required `N.` number prefix (warning).
- More than one `@header` block (warning).

Article and slides files: only the shared `@header` block and structural balance
are linted.

> **Note:** Every `/doc` and `/slides` build also auto-lints. `/lint` exists for
> a fast pre-build check without producing output.

---

### `/watch`

**Purpose:** Live-preview a document as you author it — rebuilds and
auto-refreshes the browser on every save.

**Invocation:**

```
/watch <source.md> [--theme <name>] [--style article] [--slides] [--brand <name>]
```

**Behavior:**
- Starts a local HTTP server on an ephemeral port and opens
  `http://127.0.0.1:<port>/` in your browser.
- Rebuilds the document every time you save the source file (or the
  `portable-docs.config.json`, if present).
- The reload script is injected only into the served HTTP response — the on-disk
  HTML file remains a pristine, self-contained file.
- A build error keeps the last good preview on screen and shows the error in a
  red banner; fix the file and save to recover.
- `Ctrl-C` stops the server.

> **Gotcha:** `/watch` is **preview-only**. Passing `--pdf` or `--png` is silently
> ignored — export flags have no effect during a watch session. Use `/export` on
> the finished build instead.

---

### `/export`

**Purpose:** Render an already-built portable-docs HTML file to PDF and/or PNG
using a local headless browser.

**Invocation:**

```
/export <file.html> [--pdf] [--png] [--out <dir>]
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--pdf` | Export to PDF. |
| `--png` | Export to full-page PNG. |
| `--out <dir>` | Write output files to this directory (default: alongside the HTML). |

**Behavior:**
- With neither `--pdf` nor `--png`, both formats are produced.
- Output files reuse the HTML base name: `report.html` → `report.pdf` / `report.png`.
- Slides: landscape PDF (one slide per page) + PNG of the title slide.
- Proposals/articles: full-document PDF + full-page PNG. `@media print` styles
  suppress on-screen chrome (table of contents, progress bar, copy buttons) and
  avoid awkward page breaks.
- Requires Chrome, Edge, or Chromium. Override the executable with `PD_BROWSER`.
  If no browser is found, prints guidance and exits cleanly.

> **Gotcha:** `/export` operates on a **built HTML file**, not a `.md` source.
> Run `/doc` (or `/slides`) first to produce the HTML, then export it. You can
> also pass `--pdf` / `--png` directly to `/doc` to export at build time.

See [exporting-and-sharing.md](exporting-and-sharing.md) for full detail.

---

### `/from-repo`

**Purpose:** Scan a codebase and produce a polished HTML overview — either a
slide deck or a long-form article.

**Invocation:**

```
/from-repo [path] [--style article] [--theme editorial|dark|brand] [--jsx]
```

`path` defaults to the current working directory.

**Behavior:**
- The agent reads the codebase and drafts the Markdown content itself (directory
  structure, key modules, tech stack, recent git commits, how to run).
- Default output format: **slide deck** (`--slides`), theme `dark` — a codebase
  recap reads well as a navigable deck.
- Pass `--style article` for a long-form document instead.
- The agent saves the draft to `_repo-recap.md` (or a descriptive name) before
  building.

> **Gotcha:** `/from-repo` is **not an alias** for any other command. It is an
> agent-authored workflow: the agent reads the repo and writes the Markdown before
> calling the engine. The engine invocation it produces is identical to `/doc` or
> `/slides`, but the content-gathering step is autonomous.

---

### `/share`

**Purpose:** Publish a built portable-docs HTML file to a public URL.

**Invocation:**

```
/share <html-file>
```

**Behavior:**
- Uses the best available deployer in priority order:
  1. `gh` (GitHub CLI, authenticated) → creates a **public GitHub Gist**.
  2. `vercel` CLI → runs `vercel deploy --prod` on the file's directory.
  3. Neither available → prints step-by-step install instructions and exits
     cleanly. Nothing is uploaded.
- For the Gist path, both the Gist view URL and the raw URL are reported. The
  raw URL renders the HTML directly in the browser.

> **Gotcha:** `/share` publishes the document **publicly on the internet**.
> The agent confirms with the user before deploying when content may be sensitive.
> `/share` operates on a **built HTML file** — run `/doc` first.

See [exporting-and-sharing.md](exporting-and-sharing.md) for full detail.

---

### `/doctor`

**Purpose:** Run the portable-docs engine self-test to verify a correct
installation.

**Invocation:**

```
/doctor
```

**Takes no flags.**

**What it checks:**
1. Node >= 18 is installed and on PATH.
2. `build-doc.js` exists at the expected engine path.
3. Proposal build — builds `sample.md` through the default pipeline and validates
   the HTML output.
4. Lint — runs the linter over `sample.md` and confirms it is clean.
5. Data-driven chart build — builds `charts-doctor.md` (inline CSV pie chart) and
   confirms inline SVG in the output.
6. Article build — builds `sample-article.md` through `--style article`.
7. Slides build — builds `sample-slides.md` through `--slides`.
8. Type-template builds — for each Phase 5a type (`resume`, `case-study`,
   `changelog`, `newsletter`, `rfp`, `landing`), builds the matching template with
   `--type <type>` and validates the output.

Each check prints `PASS` or `FAIL`. Exits non-zero if any check fails.

---

## Important gotchas

| Situation | What to know |
|-----------|-------------|
| `/slides` vs `/doc --slides` | They are identical. `/slides` is syntactic sugar. |
| `/from-repo` | Agent-authored, not an alias. The agent reads the repo and writes the Markdown. |
| `/lint` never builds | Even if the file is clean, no HTML is produced. Use `/doc` to build. |
| `/watch` is preview-only | `--pdf` and `--png` are silently ignored during a watch session. |
| `/export` and `/share` need built HTML | Run `/doc` or `/slides` first; these commands do not accept `.md` files. |
| `/share` is public | The published URL is accessible to anyone on the internet. |
| `/doctor` takes no flags | Do not pass `--no-open` or other flags; the script manages everything internally. |

---

## Raw engine invocation

Use the raw engine when scripting, CI, or when you need flags not exposed through
a slash command.

```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input path/to/source.md \
  --out path/to/output.html \
  --theme editorial \
  --no-open
```

### Complete flag table

Every flag that exists in `parseArgs` in `engine/scripts/build-doc.js`:

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--input <path>` | string | _(required)_ | Path to the Markdown source file. |
| `--out <path>` | string | see below | Output HTML path. Overrides env and config. |
| `--title <text>` | string | from `@title` or filename | Document title; used in `<title>` and for output filename slug. |
| `--theme <name>` | string | `editorial` | Visual theme: `editorial`, `dark`, `brand`. |
| `--style <name>` | string | `proposal` | Base format: `proposal` or `article`. |
| `--type <name>` | string | none | Document type: `resume`, `case-study`, `changelog`, `newsletter`, `landing`, `rfp`. Sets format and theme defaults. |
| `--slides` | boolean | false | Build a slide deck. Wins over `--style article` when both are passed. |
| `--jsx` | boolean | false | Copy the JSX bundle next to the HTML output. |
| `--pdf` | boolean | false | Export to PDF at build time (requires a system browser). |
| `--png` | boolean | false | Export to PNG at build time (requires a system browser). |
| `--brand <name>` | string | none | Select a named preset from `portable-docs.config.json`. |
| `--config <path>` | string | auto-discovered | Explicit path to a config file. |
| `--no-config` | boolean | false | Skip config file loading entirely. |
| `--lint` | boolean | false | Lint only — never builds. Exit 1 on errors. |
| `--strict` | boolean | false | Abort the build (or exit 1 in lint mode) on any lint error. |
| `--watch` | boolean | false | Start a live-preview server; rebuilds on save. |
| `--no-open` | boolean | false | Suppress auto-opening the result in the browser. |

**There is no `--accent` flag.** Accent color is controlled via the `PD_ACCENT`
environment variable or the `accent` field in `portable-docs.config.json`.

**Default output path:** `~/Documents/portable-docs/<slug>.html` when `--out`,
`PORTABLE_DOCS_OUT`, and the config `outDir` are all unset.

### Environment variable table

| Variable | Description |
|----------|-------------|
| `PORTABLE_DOCS_OUT` | Default output HTML path (overridden by `--out`). |
| `PD_THEME` | Default theme name (overridden by `--theme`). |
| `PD_ACCENT` | Accent color override (CSS color string). There is no CLI `--accent` flag — this env var (or the config file) is the only way to set it. |
| `PD_NO_CONFIG` | Set to `1` to skip config discovery globally (same as `--no-config`). |
| `PD_BROWSER` | Path or name of the browser executable to use for PDF/PNG export. |

### Precedence

For theme, accent, style, and output path, the resolution order is:

```
CLI flag  >  env var  >  portable-docs.config.json  >  built-in default
```

See [theming-and-branding.md](theming-and-branding.md) for the full config file
reference and precedence rules.

---

## Related pages

- [formats.md](formats.md) — proposal, article, and slides formats in detail.
- [theming-and-branding.md](theming-and-branding.md) — theme options, config file,
  brand presets, and the full env/config/flag precedence chain.
- [exporting-and-sharing.md](exporting-and-sharing.md) — PDF/PNG export and
  public sharing in depth.
- [authoring-workflow.md](authoring-workflow.md) — end-to-end authoring workflow
  from blank file to shared output.
- [document-types.md](document-types.md) — per-type details for `--type`.
- [markers.md](markers.md) — all `@`-marker components and their attributes.

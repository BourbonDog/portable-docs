# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.6.0] — 2026-06-24

### Added
- Six document types via a new `--type` flag: `resume`, `case-study`, `changelog`, `newsletter`, `landing`, `rfp`. Each maps to a base format, a default theme, a starter template, and type-aware linting.
- `@cta` (CallToAction) component for landing pages — an accent button band with primary/secondary actions; prints the destination URL instead of a dead button.

### Changed
- Linter now accepts a `type` option; type-aware rules are gated on the active `--type` and never affect default proposal/article/slides linting.

---

## [0.5.1] — 2026-06-24

### Added

- **Diagrams (Phase 4b).** Three diagram markers, available in all three document formats
  (proposal, article, slides):
  - **`@flow`** and **`@quadrant`** — native, theme-aware diagrams (a tabbed architecture-flow
    diagram and a 2×2 positioning chart). Data is authored as an inline fenced ` ```json ` block
    or an external `src="./file.json"` (resolved at build time; `src=` wins). Bad data renders a
    visible inline error card instead of crashing the build.
  - **`@mermaid`** — author any [Mermaid](https://mermaid.js.org/) diagram (raw source in the
    block body, or `src="./diagram.mmd"`). Rendered to **inline SVG at build time** via a vendored,
    build-only Mermaid bundle in your system's headless browser — only the SVG ships in the output,
    never Mermaid itself. Diagrams match the document theme and `PD_ACCENT`. When no headless
    browser is available (or a diagram has a syntax error), it degrades gracefully to a fenced code
    block preserving the source.

- **Linting & `/doctor` coverage** for the new markers: `@flow`/`@quadrant`/`@mermaid` are
  registered in the marker spec with presence checks (data-or-`src` required), and `/doctor` gains
  a quadrant build check plus a Mermaid render check that skips gracefully without a browser.

### Fixed

- **`FlowDiagram` rendering.** The previously-orphaned `FlowDiagram` component referenced an
  unimported `useInView` hook; it now uses its own self-contained `IntersectionObserver` and is
  reachable via `@flow`.

### Notes

- `--strict` aborts the build on a diagram data error or a Mermaid syntax error, but degrades
  gracefully (does not abort) when no headless browser is found.
- Documents that use none of the new markers are unaffected — the Mermaid pre-pass is a no-op and
  launches no browser when there are no `@mermaid` blocks.

---

## [0.5.0] — 2026-06-24

### Added

- **Data-driven charts (Phase 4a).** Seven new hand-rolled inline-SVG chart types available in
  all three document formats (proposal, article, slides): **pie**, **donut**, **grouped-bar**,
  **stacked-bar**, **area**, **line**, and **scatter**. Chart data is supplied via an inline
  fenced code block or an external file (`src=` attribute); external paths are resolved at build
  time and baked into the output — zero runtime I/O. Supported data formats: CSV and JSON.

- **Document-order chart placement.** Charts are inserted in document order, eliminating the
  prior limitation where all charts of the same type resolved to index `[0]`.

- **`--strict` chart-data errors.** Pass `--strict` to abort the build when chart data is
  missing or malformed (default: render an error card and continue).

- **Marker linter extended.** New chart type enums (`pie`, `donut`, `grouped-bar`, etc.) and a
  new `chart-no-data` diagnostic code cover data-driven chart markers. `/doctor` includes a
  data-driven-chart self-test check (7/7 PASS).

### Not changed (intentionally)
- The 4 legacy chart types (`growth`, `bar`, `hierarchy`, `range`) remain proposal-only and
  byte-identical to v0.4.0.

---

## [0.4.0] — 2026-06-23

### Added

- **Marker linter.** Every `/doc` and `/slides` build now auto-lints and prints line-numbered
  diagnostics to stderr (the build still completes). Add `--strict` to abort the build on lint
  errors. Use `/lint <file>` (or `--lint`) to check without building; exits non-zero on errors.
  `/doctor` includes a lint check over `sample.md`. Seven diagnostic codes: `unclosed-block`,
  `unknown-marker`, `missing-attr`, `bad-enum` (errors); `unknown-icon`, `unnumbered-section`,
  `duplicate-header` (warnings).

- **`--watch` live-reload dev server.** `/watch <source.md>` (or `--watch`) opens a localhost
  live-preview that rebuilds and auto-refreshes the browser tab on every save via Server-Sent
  Events — zero npm dependencies (Node built-ins only). The on-disk HTML stays a pristine
  self-contained file (reload script is response-only). A build error shows a banner without
  crashing the watcher; save to recover. Also watches `portable-docs.config.json` for hot
  brand/theme reloads.

- **`portable-docs.config.json` brand-kit.** A discoverable project-level (or global) config
  file carrying theme, accent, output directory, default style, and author identity defaults.
  Identity fills blank `@header` fields per-field (the doc's own header always wins); a header
  is synthesized when absent. Named presets (`brands` map) allow switching branded contexts
  with a single `--brand <name>` flag (deep-merges over top-level defaults). Relative
  `headshot`/`logo` paths resolve against the config file's directory. Escape hatches:
  `--config <path>`, `--no-config`, `PD_NO_CONFIG=1`. Precedence:
  **flag > env > config > built-in default**.

### Not included (intentionally deferred)
- Linter auto-fix (report-only for now)
- Export-under-watch (`--pdf` / `--png` are ignored while `--watch` is active)

---

## [0.3.0] — 2026-06-23

### Added

- **PDF/PNG export via system headless browser.** `/export <file.html> [--pdf] [--png] [--out <dir>]` drives Chrome, Edge, or Chromium already installed on the system — zero extra npm deps. Both formats are produced by default; pass `--pdf` or `--png` alone to export one. Set `PD_BROWSER` to override the detected browser path.
- **Build-and-export in one pass.** `--pdf` and `--png` flags are also available on `/doc` and `/slides`, so you can build and export without a separate step.
- **`/export` command.** Accepts any previously built `.html` file, detects the format from the content, and produces PDF, PNG, or both in the same directory (or `--out <dir>`).
- **`@media print` stylesheet.** PDFs produced by the headless browser hide on-screen chrome (table of contents, reading-progress bar, copy buttons, heading anchors), expand all collapsed `@cards` bodies, avoid awkward mid-component page breaks, and preserve the document's theme colors.
- **Full-page PNG for proposals and articles.** The PNG captures the entire scrollable page via the browser's DevTools protocol (not just the viewport).
- **Slide-deck export.** Slide decks export to a landscape PDF with one slide per page (a dedicated print render mode renders all slides at once). The PNG export captures a single hero shot of the title slide.
- **Data-driven proposal table of contents.** The `SectionNav` sidebar now reads section labels from the parsed content instead of hardcoded strings — section titles always match the document.
- **Reading-progress bar.** A thin accent-colored progress indicator appears at the top of proposals and articles as the reader scrolls.
- **Hover heading anchors with deep-linking.** Proposal `##` section headings show a `#` anchor on hover; clicking navigates to that section via the URL hash (a shareable deep-link you can copy from the address bar).
- **Copy-code button on terminal/code blocks.** A clipboard icon appears on `@terminal` and code blocks on hover; clicking copies the text to the clipboard.
- **`</script>` escaping.** The string `</script>` in any content field is escaped to `<\/script>` before being embedded in the inline JS bundle, preventing it from breaking the offline page.

### Not included (intentionally deferred)
- Client-side search
- Runtime light/dark theme toggle

---

## [0.2.0] — 2026-06-23

### Changed
- **Output is now fully self-contained and offline.** React/ReactDOM are vendored and inlined, and JSX is precompiled at build time — the generated HTML renders with no network connection, no CDN, and no in-browser Babel (which also removes a ~3MB per-view download). Documents open instantly and work in email, airgapped machines, and anywhere offline.

### Added
- Local images, logos, and headshots are embedded as base64 `data:` URIs, so the single `.html` file carries its own images. Remote image URLs are left as references; a missing local file is left as-is with a warning.

### Fixed
- `validate.js` now enforces the self-contained invariants (inlined React, no CDN, no in-browser Babel) instead of the old CDN requirements.

---

## [0.1.2] — 2026-06-23

### Changed
- `CardGrid` expand icons and chevrons use theme-aware colors (`COLORS.ink[50]`) instead of hardcoded white, matching the earlier `Timeline` de-hardcode so they adapt under the dark theme and unusual `PD_ACCENT` values. Default output stays byte-equal to `--theme editorial`.

### Fixed
- The "Image unavailable" placeholder shown when an article image fails to load now carries `role="img"` and `aria-label="Image unavailable"`, so assistive technology treats it as a proper image replacement.

---

## [0.1.1] — 2026-06-23

### Added
- `####` (h4) headings in the **article** and **slides** formats.
- Graceful "Image unavailable" placeholder when an article image fails to load.

### Changed
- `PD_ACCENT` now derives lighter `light`/`muted` accent shades (blend toward white) instead of echoing the primary, so hover/muted states keep their lift.
- `Timeline` year markers and company badge use theme-aware colors instead of hardcoded white.

### Fixed
- A 3-digit `PD_ACCENT` (e.g. `#E33`) no longer produces invalid `wash`/`glow` values.
- `SKILL.md` clarifications: `--title` default, `PD_THEME` vs `--theme` precedence, `--slides`-wins note, and `@footer` added to the proposal `@header` field list.
- Removed a stale generated `content.js` from `engine/src/`.

---

## [0.1.0] — 2026-06-22

### Added

- **Three output formats:**
  - **Proposal** (default) — rich layout driven by an `@`-marker DSL (`@stats`, `@cards`, `@chart`, `@timeline`, `@quotes`, `@pullquote`, `@worklist`, `@credentials`, `@testimonials`, `@terminal`).
  - **Long-form article** (`--style article`) — editorial magazine layout for flowing prose, essays, and reports.
  - **Slide deck** (`--slides`) — browser-navigable presentation from `---`-separated slides.

- **Three themes:** `editorial` (paper-white, violet accent), `dark` (near-black, cyan accent), `brand` (neutral slate with `PD_ACCENT` hex override).

- **Icon set** — curated icon library for `@card icon="…"` and `@workitem icon="…"` components, with documented fallback behavior.

- **Vendored React engine** — builds a single self-contained HTML file (no local sibling assets, no build server). React, ReactDOM, and Babel load from the unpkg CDN at view time, so a network connection is required to open the output. Classic JSX runtime ensures output is never blank regardless of module-format environment.

- **Five slash commands:**
  - `/doc` — primary build command; supports all three formats and themes.
  - `/slides` — alias for `/doc --slides`; defaults to `dark` theme.
  - `/from-repo` — scans a codebase and auto-drafts a recap deck or article.
  - `/share` — publishes output to a public URL via GitHub Gist or Vercel.
  - `/doctor` — self-test verifying Node version, engine path, and all three pipelines.

- **`SKILL.md`** — structured workflow for format selection, auto-markup, theme selection, and engine invocation.

- **Reference docs** — `markers.md` (complete input syntax), `components.md` (component catalog), `theming.md` (palette details), `icons.md` (valid icon names).

- **Templates** — starter templates for each format.

# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

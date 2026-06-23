# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

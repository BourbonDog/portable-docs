# portable-docs User Guide

**Turn your content into polished, self-contained, shareable HTML documents — inside Claude Code.** One command converts a plain Markdown file into a single `.html` file with no runtime dependencies: no server, no CDN, no `npm install` at view time. The output opens offline in any browser, can be emailed, dropped into Notion, or published to a public URL.

---

## Four core concepts

| Concept | What it is |
|---------|-----------|
| **Format** | The layout pipeline — `proposal` (rich pitch layout), `article` (long-form prose), or `slides` (full-viewport deck). See [formats.md](formats.md). |
| **Type** | A `--type` preset that bundles a default format, theme, and lint profile — e.g. `--type resume` or `--type landing`. See [document-types.md](document-types.md). |
| **Marker** | An `@`-prefixed HTML-comment component directive embedded in your Markdown — e.g. `@stats`, `@cta`, `@chart`, `@mermaid`. See [markers.md](markers.md). |
| **Theme** | A color palette applied at build time and frozen into the HTML — `editorial` (paper-white), `dark` (near-black), or `brand` (accent-forward). See [theming-and-branding.md](theming-and-branding.md). |

---

## Recommended learning path

Start here and follow the path in order. Detours are fine — each page is self-contained.

1. **[Getting Started](getting-started.md)** — install, build your first document, and understand the output directory.
2. **[Formats](formats.md)** — understand the three layout pipelines (proposal, article, slides) and which markers work in each.
3. **[Document Types](document-types.md)** — use a `--type` preset (resume, case-study, changelog, newsletter, landing, rfp) for sensible defaults and type-aware lint rules.
4. **[Markers](markers.md)** — the complete `@`-marker DSL reference: every component, its attributes, and format availability.
5. **[Charts and Diagrams](charts-and-diagrams.md)** — the 7 data-driven chart types and 3 diagram types (`@flow`, `@quadrant`, `@mermaid`).
6. **[Theming and Branding](theming-and-branding.md)** — themes, accent overrides, icon set, and the config file / brand presets.
7. **[Commands and CLI](commands-and-cli.md)** — every slash command (`/doc`, `/slides`, `/lint`, `/watch`, `/export`, `/from-repo`, `/share`, `/doctor`) and raw engine flags.
8. **[Exporting and Sharing](exporting-and-sharing.md)** — PDF/PNG export, viewer affordances baked into every doc, and public URL sharing.
9. **[Authoring Workflow](authoring-workflow.md)** — end-to-end loop from blank file to shared output; lint codes reference and troubleshooting FAQ.

**Read when you're curious:** [How It Works](how-it-works.md) — the build pipeline, the self-contained/offline guarantee, and the "never blank" invariant.

---

## Table of contents

| Page | What it covers |
|------|---------------|
| [getting-started.md](getting-started.md) | Install, first document in 60 seconds, output location, edit-build loop |
| [how-it-works.md](how-it-works.md) | Build pipeline, self-contained guarantee, "never blank" invariants |
| [formats.md](formats.md) | Proposal, article, and slides — anatomy, examples, format routing rules |
| [document-types.md](document-types.md) | Six `--type` presets with examples and type-aware lint rules |
| [markers.md](markers.md) | Complete `@`-marker DSL — every component, attributes, and gotchas |
| [charts-and-diagrams.md](charts-and-diagrams.md) | `@chart` (7 data-driven types + 4 legacy), `@flow`, `@quadrant`, `@mermaid` |
| [theming-and-branding.md](theming-and-branding.md) | Three themes, accent override, icon set, config file and brand presets |
| [commands-and-cli.md](commands-and-cli.md) | All 8 slash commands and the full raw engine flag table |
| [exporting-and-sharing.md](exporting-and-sharing.md) | PDF/PNG export, viewer affordances, GitHub Gist / Vercel sharing |
| [authoring-workflow.md](authoring-workflow.md) | Recommended loop, all lint codes with fix guidance, troubleshooting FAQ |

---

## References and spec files

The `references/` directory holds raw spec tables for quick lookup:

- [../references/markers.md](../references/markers.md) — raw marker/syntax spec
- [../references/config.md](../references/config.md) — full config schema
- [../references/theming.md](../references/theming.md) — full token tables for each theme
- [../references/icons.md](../references/icons.md) — icon glyph list with descriptions

For the project README and installation overview, see [../../../README.md](../../../README.md).

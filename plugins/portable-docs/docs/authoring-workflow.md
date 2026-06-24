# Authoring Workflow

End-to-end guide for writing, linting, previewing, and publishing a portable-docs document.
Back to [README.md](README.md)

---

## Recommended loop

```
draft .md  →  /watch (live preview)  →  /lint  →  /doc or /slides  →  /export and/or /share
```

1. **Draft** — write your Markdown file with [markers](markers.md).
2. **`/watch`** — starts a live-preview server that rebuilds and auto-refreshes on every save, so you can iterate without re-running commands.
3. **`/lint`** (or rely on auto-lint) — `/lint` checks the file without building. Auto-lint runs automatically on every `/doc` or `/slides` build and prints diagnostics to stderr; the build still completes unless `--strict` is set.
4. **Build** — `/doc` for articles/proposals, `/slides` for decks. Both run the linter first and print any warnings.
5. **`/export` and/or `/share`** — export to PDF/PNG or share a link to the rendered output.

> **Tip:** `/watch` is the fastest inner loop. Use `/lint` as a quick check before committing or handing off.

---

## Lint codes reference

Run `/lint` (or `/doc --lint`) to see all diagnostics before building. Errors block a build when `--strict` is set; warnings are always advisory.

### `--strict` semantics

`--strict` turns the following into a build abort:
- All lint **errors** (any code with severity `error`).
- Chart, diagram, and Mermaid **data/render errors** detected at build time — malformed `@chart`/`@flow`/`@quadrant` data, or a Mermaid render failure. Without `--strict` these render as visible inline error cards and the build still succeeds; `--strict` turns them into a build abort. (A *missing browser* for `@mermaid` is the one exception — it degrades to a `<pre>` fallback even under `--strict`; see [charts-and-diagrams.md](charts-and-diagrams.md).)

### Errors

| Code | When it fires | How to fix |
|------|--------------|------------|
| `unclosed-block` | A paired block marker (`@chart`, `@flow`, `@quadrant`, etc.) was opened but never closed, or a closing `/@…` appears without a matching open. | Add the missing `/@<name>` closing comment, or remove the orphan closer. |
| `unknown-marker` | An `@name` comment does not match any known marker. | Check spelling against the [Marker DSL reference](markers.md); remove or correct the marker. |
| `missing-attr` | A required attribute is absent from a marker (e.g., `type` on `@chart`). | Add the required attribute. See [markers.md](markers.md) for each marker's required/optional attributes. |
| `bad-enum` | An attribute value is not one of the allowed values (e.g., an unsupported `@chart type`). | Use a valid value from the marker's allowed list. See [markers.md](markers.md) and [charts-and-diagrams.md](charts-and-diagrams.md). |
| `chart-no-data` | A `@chart`/`/@chart` block contains no parseable data rows. | Add at least one data row inside the block. See [charts-and-diagrams.md](charts-and-diagrams.md). |
| `diagram-no-data` | A `@flow` or `@quadrant` block contains no parseable entries. | Add at least one entry inside the block. See [charts-and-diagrams.md](charts-and-diagrams.md). |
| `mermaid-no-source` | A `@mermaid`/`/@mermaid` block is empty or contains no Mermaid source. | Paste valid Mermaid diagram source between the open and close markers. |
| `resume-no-experience` | A `resume`-type document has no experience section. | Add an `## Experience` section with at least one job entry. See [document-types.md](document-types.md). |
| `changelog-no-releases` | A `changelog`-type document has no release entries. | Add at least one `## [version]` release section. See [document-types.md](document-types.md). |

### Warnings

| Code | When it fires | How to fix |
|------|--------------|------------|
| `unknown-icon` | An `icon=` attribute references an icon name that is not in the known icon list (falls back to the placeholder glyph). | Use a valid icon name, or leave the icon attribute out. |
| `unnumbered-section` | A `## Heading` in a proposal document lacks an `N.` number prefix (`## 1. Introduction`). | Prefix the heading with a number, or change the format to `article` if numbering is unwanted. |
| `duplicate-header` | More than one `@header`/`/@header` block appears in the file; only the first is used. | Remove or merge the extra `@header` blocks. |
| `changelog-empty-release` | A `## [version]` section contains no items. | Add at least one item to the release section, or remove the empty section. |
| `changelog-section-not-versioned` | A section inside a changelog release is not one of the standard groups. | Use a recognised group name (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`). |
| `changelog-unknown-group` | A changelog group heading is not a recognised Keep a Changelog group. | Rename it to one of the standard groups above. |
| `newsletter-no-issue` | A `newsletter`-type document is missing an issue number. | Add an issue number in the newsletter header. See [document-types.md](document-types.md). |
| `newsletter-no-date` | A `newsletter`-type document is missing a date. | Add a date in the newsletter header. See [document-types.md](document-types.md). |
| `newsletter-thin` | A `newsletter`-type document has too few sections. | Add more content sections to the newsletter. |
| `rfp-missing-section` | A required section is absent from an `rfp`-type document. | Add the missing section. See [document-types.md](document-types.md) for the required RFP structure. |
| `rfp-matrix-checkmark` | A compliance-matrix status cell uses a token that won't render as a badge. | Use one of the recognized badge tokens: `✓`, `✔`, `yes`, `✗`, `✘`, or `no`. |
| `rfp-pricing-no-table` | An RFP pricing section exists but contains no Markdown table. | Add a pricing table inside the pricing section. |
| `resume-no-header` | A `resume`-type document has no header block. | Add an `@header`/`/@header` block with your name and contact details. See [document-types.md](document-types.md). |
| `resume-entry-missing-dates` | A resume `@entry` has a `year` attribute that contains no digits (e.g. `year="TBD"`) instead of a real year or range. | Give the entry a real year or range, e.g. `year="2021–2024"`. |
| `resume-density-warning` | The resume is unusually long or dense. | Trim entries or enable compact CV mode (`data-pd-type`). See [document-types.md](document-types.md). |
| `landing-no-cta` | A `landing`-type document has no call-to-action section. | Add a CTA section. See [document-types.md](document-types.md). |
| `landing-no-hero` | A `landing`-type document has no hero section. | Add a hero section at the top of the page. See [document-types.md](document-types.md). |
| `case-study-missing-metrics` | A `case-study`-type document has no metrics. | Add a metrics/results section with quantitative outcomes. See [document-types.md](document-types.md). |
| `case-study-missing-quote` | A `case-study`-type document has no pull quote. | Add a customer quote. See [document-types.md](document-types.md). |
| `case-study-stats-count` | A case-study stats block has an unusual number of stats. | Keep stats blocks to 2–4 items for the best layout. |
| `case-study-quote-attribution` | A case-study pull quote is missing attribution. | Add attribution (name/title) to the quote. |

---

## Troubleshooting / FAQ

**Blank page in the browser**
Blank output is rare. The engine always emits a valid HTML shell, but a component bug can prevent content from rendering. Fix: run `/doc` again to rebuild (a transient error usually clears). If the problem persists, check the lint output for errors and look for a JavaScript error in the browser console.

**Image not showing**
Local images are inlined at build time (embedded as data URIs in the HTML file). Remote URLs (http/https) stay as external references — they will only load when the browser has network access. If a remote image is missing in an exported/offline copy, download it locally and reference it by path instead.

**Legacy chart shows an error card in a slide deck**
The old chart DSL (pre-v0.5) is proposal-format only. In a deck, it renders as an error card. Fix: migrate to the new `@chart type="…"` syntax. See [charts-and-diagrams.md](charts-and-diagrams.md).

**`@cta` appears as literal text or is ignored**
`@cta` is a proposal-only block. In `article` format and slide decks it is not recognised by the renderer and is either printed as literal text or silently ignored. Use `@cta` only in proposal-format documents.

**Theme or accent colour not changing**
Theme and accent are frozen at build time. Changing `PD_ACCENT` or the `--theme` flag has no effect on already-built files. Fix: rebuild with `/doc` (or `/slides`) to apply the new settings.

**No browser available for `/export` or `@mermaid`**
PDF, PNG export, and `@mermaid` diagram rendering all require a system browser (Chromium or Chrome). If no browser is found, install one or set the `PD_BROWSER` environment variable to the browser executable path. Without a browser, `@mermaid` falls back to rendering the raw source in a `<pre>` block rather than an SVG diagram.

---

## See also

- [markers.md](markers.md) — complete marker DSL reference
- [charts-and-diagrams.md](charts-and-diagrams.md) — chart and diagram authoring
- [commands-and-cli.md](commands-and-cli.md) — `/doc`, `/lint`, `/watch`, `/export`, `/share`, and all CLI flags
- [document-types.md](document-types.md) — type-specific structure and type-aware lint rules
- [README.md](README.md) — guide index

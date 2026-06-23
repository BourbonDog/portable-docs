# Component Reference

Catalog of every React component in `engine/src/components/`. Includes what
each component renders, when to use it, and which proposal marker (if any)
produces it. Component source is in `engine/src/components/<Name>.jsx`.

Components not reached by any marker are noted separately — they are available
for use in the JSX bundle but have no corresponding markdown syntax.

---

## Proposal-format components (marker-driven)

These components are instantiated by the `App.jsx` renderer in response to
parsed marker blocks.

---

### `Header`

**File:** `Header.jsx`
**Marker:** `@header` block
**What it is:** Full-bleed magazine-cover hero with title (3-line split
treatment), typewriter subtitle, author byline, headshot, brand logo,
eyebrow label, and an optional hero pull quote.
**Use when:** Every proposal or article document — it is always the first
rendered element when a `@header` block is present.
**Caveat:** The title is split word-by-word into first/middle/last groups for
editorial typography; very short titles (1–2 words) will have empty middle or
last slots, which is fine.

---

### `StatsGrid`

**File:** `StatsGrid.jsx`
**Marker:** `@stats` / `@stat`
**What it is:** A horizontal row of large-number "stat cards" (value + label +
source attribution). Uses monospace display type for the numbers.
**Use when:** You have 2–5 high-impact data points to lead a section with.

---

### `Chart`

**File:** `Chart.jsx`
**Marker:** `@chart type="growth|bar|hierarchy|range"`
**What it is:** A family of four data-visualization components behind one
export. Each `type` renders differently:

| Type | Renders | Best for |
|------|---------|----------|
| `growth` | Multi-series horizontal bar comparison with growth delta | Trend over time, market sizing |
| `bar` | Horizontal bars with value label and source cite | Comparisons, benchmarks |
| `hierarchy` | Org-chart-style top-down node diagram | Team structure, reporting lines |
| `range` | Horizontal range bands (min→max) with optional highlight | Salary bands, comp ranges |

**Use when:** Quantitative data that benefits from a visual chart rather than a
table.

---

### `Convergence`

**File:** `Convergence.jsx`
**Marker:** `@convergence`
**What it is:** A three-circle Venn diagram showing how multiple roles converge
into one. Renders each role's "from" label, connecting arrows, and a "to"
label in the center.
**Use when:** Illustrating a hybrid / cross-functional role identity (e.g.,
"PM + Designer + Engineer = Product Engineer").

---

### `QuoteCarousel`

**File:** `QuoteCarousel.jsx`
**Marker:** `@quotes` / `@quote`
**What it is:** An auto-rotating carousel of industry / third-party quotes with
author attribution and optional citation superscript. Each `@quotes` block
renders one carousel.
**Use when:** You have 2–6 external validation quotes for a section.

---

### `PullQuote`

**File:** `PullQuote.jsx`
**Marker:** `@pullquote`
**What it is:** A large-format editorial pull quote with an oversized quote
mark, optional author / title attribution, and a decorative accent bar.
**Use when:** One key statement deserves typographic emphasis mid-section.

---

### `CardGrid`

**File:** `CardGrid.jsx`
**Marker:** `@cards` / `@card`
**What it is:** A responsive grid of cards. Three visual sub-types:

| `type=` | Visual style | Use for |
|---------|-------------|---------|
| `feature` | Large editorial number + icon + text | Strategic pillars, top reasons |
| `profile` | Icon + title + paragraph | Requirements, skill profiles |
| `topic` | Icon + title + audience tag + expandable body | Curriculum topics, course listings |

Cards support an optional `@expanded` inner block for a reveal-on-click body.
**Use when:** You need to present 3–9 parallel items in a visual grid.

---

### `Credentials`

**File:** `Credentials.jsx`
**Marker:** `@credentials` / `@credential`
**What it is:** A horizontal strip of large-value "credential badges" (value +
label), styled like achievement callouts.
**Use when:** Surfacing 2–6 career metrics or credentials in a compact row
(years of experience, companies, publications, etc.).

---

### `Timeline`

**File:** `Timeline.jsx`
**Marker:** `@timeline` / `@entry`
**What it is:** A vertical chronological timeline with year badge, company /
org name, role title, description text, and optional accent highlight on
featured entries.
**Use when:** Presenting a career history, project history, or roadmap.

---

### `Testimonials`

**File:** `Testimonials.jsx`
**Marker:** `@testimonials` / `@testimonial`
**What it is:** A styled list of testimonials grouped by `type`. The `type`
attribute controls the visual treatment (e.g., leadership, teaching, student).
Multiple `@testimonials` blocks in the same document render as separate groups.
**Use when:** Including reference quotes or recommendations from colleagues,
students, or managers.

---

### `Table`

**File:** `Table.jsx`
**Marker:** Standard GFM pipe table + optional `<!-- @table variant="..." -->`
hint
**What it is:** A styled HTML table with header row, body rows, and an optional
`variant` class for alternate row coloring (`"default"` or `"striped"`).
**Use when:** Tabular data that doesn't fit a chart — feature comparisons,
specs, or reference data.

---

### `Citations`

**File:** `Citations.jsx`
**Marker:** `## Citations` section
**What it is:** A numbered reference list at the end of the document. Each
`[N] Text` line becomes one citation entry.
**Use when:** You have cited sources referenced via `[N]` superscripts in the
body.

---

### `TerminalWindow`

**File:** `TerminalWindow.jsx`
**Marker:** `@terminal`
**What it is:** A styled "terminal window" panel with a title bar, command
prompt header (`$ <command>`), and body lines. Bullet items (`- ` / `* `) are
rendered as `•` bullets; other lines render as-is.
**Use when:** Showcasing API docs, CLI output, config snippets, or code
concepts in a readable, non-syntax-highlighted format.

---

### `WorkList`

**File:** `WorkList.jsx`
**Marker:** `@worklist` / `@workitem`
**What it is:** A portfolio-style list of work items with a numbered badge,
icon, title, technology tag pills, and description. The first item gets a
"hero" dark-background treatment; subsequent items are a lighter list style.
**Use when:** Presenting 3–8 significant technical or product work items in a
portfolio section.

---

## Layout & text components (used internally by App.jsx)

These components are used in the rendering pipeline but are not directly
triggered by a single named marker. Authors do not reference them in markdown.

---

### `Section`

**File:** `Section.jsx`
**What it is:** The wrapper for each `## N. Title` section. Handles fade-in
scroll animation via an `IntersectionObserver` hook (`useInView`). Also
exports `SectionDivider`, `Subsection`, `Paragraph`, and `BulletList`
sub-components used by `App.jsx`'s `BlockRenderer`.
**Note:** `Section.jsx` **must** be the first component in the build order
because it defines the `useInView` hook that other components reuse.

---

### `RichText`

**File:** `RichText.jsx`
**What it is:** Inline markdown renderer for paragraph body text. Handles bold
(`**`), italic (`*`), inline code (`` ` ``), and links (`[text](url)`). Used
wherever paragraph body text appears.

---

### `SectionNav`

**File:** `SectionNav.jsx`
**What it is:** A sticky side navigation bar listing all document sections with
short labels. Used in the proposal format to let readers jump between sections.
Not triggered by a marker — always rendered when the proposal has sections.
- Section labels are data-driven (read from parsed section titles — no hardcoded strings).
- Hidden automatically in PDF/print output (`pd-no-print` class).

---

## Viewer affordances (Phase 2)

These features are added automatically at build time — no markers needed.

### Reading progress bar

- Renders on proposals and articles as a thin accent-colored bar fixed to the top of the page.
- Tracks scroll position; fills left-to-right as the reader scrolls.
- Hidden in PDF/print output (`pd-no-print` class).

### Heading anchors

- Proposal `##` section headings reveal a `#` anchor icon when you hover the heading.
- Clicking the anchor navigates to that section via the URL hash — a shareable deep-link you can copy from the address bar.
- Subsection (`###`) and article headings do not get anchors.
- Hidden in PDF/print output (`pd-no-print` class).

### Copy-code button

- Appears on `@terminal` and code blocks on hover.
- Clicking copies the block's text to the clipboard.
- Hidden in PDF/print output (`pd-no-print` class).

---

## Print / PDF behavior

When the document is exported to PDF (or printed via the browser):
- Components with the `pd-no-print` class are hidden: `SectionNav`, reading progress bar, heading anchors, copy buttons.
- Collapsed `@cards` bodies (cards with `@expanded` inner content) are expanded so no content is cut off.
- Page breaks are avoided mid-component.
- Theme colors are preserved via explicit color values.

---

## Components not connected to any marker

These components exist in `engine/src/components/` and are exported from
`index.js` but are **not wired into `parser.js` or `App.jsx`**. They cannot
be triggered by any markdown marker in the current engine. They are available
for direct JSX use or future marker additions.

---

### `QuadrantChart`

**File:** `QuadrantChart.jsx`
**What it is:** A 2×2 scatter-plot quadrant chart for strategic positioning
maps. Props: `title`, `subtitle`, `xAxisLow`, `xAxisHigh`, `yAxisLow`,
`yAxisHigh`, `quadrantLabels`, `dots`.
**Status:** Exported but **no `@quadrant` marker exists in the parser**. Cannot
be invoked from markdown.

---

### `FlowDiagram`

**File:** `FlowDiagram.jsx`
**What it is:** A tabbed, interactive architecture flow diagram showing
ingestion/query paths (AI memory system style). Supports parallel lanes, SVG
arrows between stages, and optional callout boxes.
Props: `systemName`, `accentColor`, `tabs`, `callouts`.
**Status:** Exported but **no `@flow` marker exists in the parser**. Cannot be
invoked from markdown.

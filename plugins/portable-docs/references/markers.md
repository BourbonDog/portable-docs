# Marker / Syntax Reference

Complete input syntax for all three portable-docs document formats.
Everything here is derived from the actual parser source files — do not add
markers that are not listed.

---

## Format Overview

| Flag | Format | Parser |
|------|--------|--------|
| _(default)_ | **proposal** — HTML-comment marker DSL | `engine/src/utils/parser.js` |
| `--style article` | **article** — plain markdown | `engine/scripts/parse-article.js` |
| `--slides` | **slides** — `---` delimited deck | `engine/scripts/parse-slides.js` |

`--slides` wins over `--style article` if both flags are passed.

---

## 1. Proposal Format (default)

The proposal parser (`parser.js`) reads an HTML-comment DSL. Every marker is
a self-closing or paired HTML comment block. Sections are `## N. Title`
(number-prefixed), subsections are `### Title`. Citations live under
`## Citations`.

### `@header` block

Wraps all per-document metadata. Exactly one block per file. Every sub-marker
is self-closing inside the pair.

```markdown
<!-- @header -->
<!-- @title value="Document Title" -->
<!-- @subtitle value="One-line description" -->
<!-- @eyebrow value="CATEGORY LABEL" -->
<!-- @brand value="Org / Company Name" -->
<!-- @brandsub value="Team or sub-brand" -->
<!-- @logo value="https://cdn.example.com/logo.png" -->
<!-- @date value="June 2026" -->
<!-- @from name="Full Name" email="you@example.com" linkedin="https://..." github="https://..." -->
<!-- @headshot url="https://cdn.example.com/headshot.jpg" -->
<!-- @footer value="Confidential — June 2026" -->
<!-- /@header -->
```

All sub-markers are optional. `@from` has `name`, `email`, optional `linkedin`
and optional `github` attributes. `@headshot` has `url`.

Parser implementation: `extractHeader()` — lines 39–70 in `parser.js`.

---

### `@stats` / `@stat`

A row of up to N key statistics rendered as a StatsGrid.

```markdown
<!-- @stats -->
<!-- @stat value="42M" label="Active learners" source="EdTech Report 2025" -->
<!-- @stat value="3×" label="Revenue growth" source="Internal" -->
<!-- /@stats -->
```

`@stat` attributes: `value`, `label`, `source` (all required by convention).

Parser: `extractStats()` — lines 72–85.

---

### `@chart` block (4 types)

One `@chart` block per chart. `type` is required and selects the sub-parser.

#### `type="growth"` — multi-series line comparison

```markdown
<!-- @chart type="growth" title="Engineer Demand" subtitle="2019 → 2025" -->
<!-- @series label="AI/ML roles" -->
<!-- @point year="2019" value="100" -->
<!-- @point year="2021" value="180" -->
<!-- @point year="2025" value="340" -->
<!-- /@series -->
<!-- /@chart -->
```

`@point` attributes: `year`, `value` (integer).

#### `type="bar"` — horizontal bar chart

```markdown
<!-- @chart type="bar" title="Compensation Benchmarks" -->
<!-- @bar label="Staff Engineer" value="230" unit="k" source="Levels.fyi" cite="[1]" -->
<!-- @bar label="Principal PM" value="260" unit="k" source="Levels.fyi" cite="[2]" -->
<!-- /@chart -->
```

`@bar` attributes: `label`, `value`, `unit`, optional `source`, optional `cite`.

#### `type="hierarchy"` — org-chart / hierarchy flow

```markdown
<!-- @chart type="hierarchy" title="Org Structure" -->
<!-- @level from="CTO" to="VP Engineering" -->
<!-- @level from="VP Engineering" to="Staff Engineer" -->
<!-- /@chart -->
```

`@level` attributes: `from`, `to`.

#### `type="range"` — salary / range bands

```markdown
<!-- @chart type="range" title="Comp Bands" -->
<!-- @range label="Senior SWE" min="160" max="220" unit="k" highlight="true" -->
<!-- @range label="Staff SWE" min="220" max="310" unit="k" highlight="false" -->
<!-- /@chart -->
```

`@range` attributes: `label`, `min`, `max`, `unit`, optional `highlight` (`"true"`/`"false"`).

Parser: `extractCharts()` — lines 87–144.

#### Data-driven types (CSV / JSON)

Seven additional types render as hand-rolled inline SVG from CSV or JSON data,
supplied **inline** (a fenced block in the marker body) or from an **external
file** (`src="…"`, resolved relative to the `.md`). `src=` wins if both are given.
Data is read at build time and baked into the output — nothing is fetched at view
time. These types work in **all three formats** (proposal, article, slides).

| `type` | Data (CSV header → meaning) |
|--------|-----------------------------|
| `pie` / `donut` | `label,value` (optional third `color` column) |
| `grouped-bar` / `stacked-bar` | wide: `category,SeriesA,SeriesB,…` |
| `area` / `line` | wide: `x,SeriesA,SeriesB,…` |
| `scatter` | `x,y` (optional `label`, `series` columns) |

Optional attributes: `title`, `subtitle`, `src`, and (for `area`/`line`/`scatter`)
`xlabel` / `ylabel`. JSON is an array of row-objects mirroring the same columns.

```markdown
<!-- @chart type="pie" title="Browser Share" subtitle="Q2 2026" -->
```csv
label,value
Chrome,65
Safari,35
```
<!-- /@chart -->

<!-- @chart type="area" title="Revenue" src="./data/finance.csv" xlabel="Year" ylabel="$M" -->
<!-- /@chart -->
```

If the data source is missing or malformed, the build prints a diagnostic and
renders a visible error card in place (and `--strict` aborts). The four legacy
types above (`growth`/`bar`/`hierarchy`/`range`) use nested markers and remain
**proposal-only**.

---

### `@convergence` block

Venn-like diagram showing role evolution (e.g. PM + Designer + Engineer).

```markdown
<!-- @convergence position="after" -->
<!-- @role from="Product Manager" to="Product Engineer" description="Owns end-to-end" -->
<!-- @role from="Designer" to="Product Engineer" description="Builds their designs" -->
<!-- @role from="Engineer" to="Product Engineer" description="Shapes the product" -->
<!-- /@convergence -->
```

`@convergence` attribute: `position` (optional; `"after"` is default).
`@role` attributes: `from`, `to`, `description`.

Parser: `extractConvergence()` — lines 146–159.

---

### `@quotes` / `@quote` block

One or more quote carousels. Each `@quotes` block may be keyed to a document
section via `section=`.

```markdown
<!-- @quotes section="1" -->
<!-- @quote author="Lenny Rachitsky" title="PM Coach" cite="[3]" -->
The bar for "good enough" is rising fast.
<!-- /@quote -->
<!-- @quote author="Shreyas Doshi" title="ex-Stripe PM" -->
Context is everything.
<!-- /@quote -->
<!-- /@quotes -->
```

`@quotes` attributes: optional `section` (matches `## N.` section number as a string).
`@quote` attributes: `author`, `title`, optional `cite`. Body is the quote text.

Parser: `extractQuotes()` — lines 161–177.

---

### `@pullquote` block

A single large-format pull quote (editorial sideline treatment).

```markdown
<!-- @pullquote author="Reed Hastings" title="CEO, Netflix" -->
The future belongs to those who can build what they imagine.
<!-- /@pullquote -->
```

`@pullquote` attributes: optional `author`, optional `title`. Body is the text.

Parser: `extractPullQuotes()` — lines 179–187.

---

### `@cards` / `@card` block

A grid of cards. Three visual styles depending on `type`.

```markdown
<!-- @cards type="feature" columns="3" section="2" label="Core Pillars" -->
<!-- @card icon="rocket" title="Velocity" -->
Ship in days, not quarters.
<!-- /@card -->
<!-- @card icon="brain" title="Judgment" audience="Senior+" -->
Short text.
<!-- @expanded -->
Longer detail shown on expand.
<!-- /@card -->
<!-- /@cards -->
```

`@cards` attributes:
- `type` (required) — `"feature"` | `"profile"` | `"topic"`
- `columns` (optional, default `3`)
- `section` (optional, for placement lookup)
- `label` (optional, grid heading)

`@card` attributes:
- `icon` (required) — see `icons.md` for valid names
- `title` (required)
- `audience` (optional, shown as tag on `topic` cards)

Inside a `@card`, adding `<!-- @expanded -->` splits the body: text before is
the collapsed view; text after is revealed on expand.

Parser: `extractCards()` — lines 189–225.

---

### `@credentials` / `@credential` block

A row of metric-style credential callouts (e.g., years of experience,
companies, publications).

```markdown
<!-- @credentials -->
<!-- @credential value="12+" label="Years building products" -->
<!-- @credential value="3" label="Successful exits" -->
<!-- @credential value="50k+" label="Students taught" -->
<!-- /@credentials -->
```

`@credential` attributes: `value`, `label`.

Parser: `extractCredentials()` — lines 227–238.

---

### `@timeline` / `@entry` block

A chronological career or project timeline.

```markdown
<!-- @timeline -->
<!-- @entry year="2019" company="Acme Corp" title="Staff Engineer" highlight="true" -->
Led migration to microservices. Reduced deploy time by 70%.
<!-- /@entry -->
<!-- @entry year="2022" company="NextCo" title="Principal Engineer" highlight="false" -->
Architected the ML platform.
<!-- /@entry -->
<!-- /@timeline -->
```

`@entry` attributes: `year`, `company`, `title`, `highlight` (`"true"`/`"false"`).
Body is the entry description text.

Parser: `extractTimeline()` — lines 240–251.

---

### `@testimonials` / `@testimonial` block

One or more testimonial groups. `type` controls the visual treatment.

```markdown
<!-- @testimonials type="leadership" source="LinkedIn recommendations" -->
<!-- @testimonial author="Jane Smith" title="CTO" subtitle="Acme Corp" -->
One of the best engineers I've worked with.
<!-- /@testimonial -->
<!-- /@testimonials -->
```

`@testimonials` attributes: `type` (required), optional `source`.
`@testimonial` attributes: optional `author`, optional `title`, optional `subtitle`.
Body is the testimonial text.

Parser: `extractTestimonials()` — lines 253–271.

---

### `@table` (variant hint)

Markdown tables are parsed automatically from standard pipe syntax. To set a
display variant, place a hint comment immediately before the table:

```markdown
<!-- @table variant="striped" -->
| Column A | Column B |
|----------|----------|
| Value 1  | Value 2  |
```

The hint is optional. Without it, `variant` defaults to `"default"`. The hint
is consumed by the parser; the table itself is standard GFM pipe syntax.

Parser: `extractTables()` — lines 273–290. Variant hint lookback at line 284.

---

### `@terminal` block

A syntax-highlighted terminal / code window panel.

```markdown
<!-- @terminal title="API Usage" command="curl" variant="default" -->
- POST /api/v1/generate
- Authorization: Bearer <token>
- Returns: { id, status, result }
<!-- /@terminal -->
```

`@terminal` attributes: `title` (required), optional `command` (default `"cat"`), optional `variant` (default `"default"`).
Body lines starting with `- ` or `* ` are converted to bullet `•` prefix.
Lines that start with `<!--` are skipped.

Parser: `extractTerminals()` — lines 292–307.

---

### `@worklist` / `@workitem` block

A portfolio section listing hands-on work with icons and technology tags.

```markdown
<!-- @worklist section="3" -->
<!-- @workitem icon="server" title="Distributed Cache Layer" technologies="Redis,Go,Kubernetes" -->
Designed and shipped a multi-region cache. Reduced p99 latency by 60%.
<!-- /@workitem -->
<!-- @workitem icon="cpu" title="ML Inference Pipeline" technologies="Python,PyTorch" -->
End-to-end inference pipeline handling 10k req/s.
<!-- /@workitem -->
<!-- /@worklist -->
```

`@worklist` attributes: `section` (required, for placement lookup).
`@workitem` attributes: `icon` (required, see `icons.md`), `title` (required), optional `technologies` (comma-separated string).

Parser: `extractWorkLists()` — lines 309–338.

---

### `@citations` (prose block)

Citations are parsed from a special `## Citations` section at the end of the
document. No wrapper marker needed — the heading itself triggers parsing.

```markdown
## Citations

[1] Author, Title. Publisher, 2024. https://example.com
[2] Smith, J. "Article Name." Journal Vol 3, 2023.
```

Each line starting with `[N]` becomes one citation. Multi-line citations are
concatenated until the next `[N]` marker.

Parser: `extractCitations()` — lines 341–361.

---

### Section structure

Outside of the marker blocks above, sections use standard numbered headings.
The document body is split on `## N. Title` patterns; subsections use `### Title`.
Prose, bullet lists, and tables between markers are parsed automatically.

```markdown
## 1. About Me

Introductory prose here.

### Background

- Bullet one
- Bullet two

<!-- @stats -->
...
<!-- /@stats -->
```

---

## 2. Article Format (`--style article`)

The article parser (`parse-article.js`) reads **plain markdown**. No
HTML-comment markers are used in the body (except the optional `@header`
block, which uses the identical schema as the proposal format).

### Title and subtitle

```markdown
# My Article Title

*An optional one-line subtitle in italic*
```

- `# H1` → document title
- First `*italic*` line → subtitle
- If a `<!-- @header -->` block is present, `@title` and `@subtitle` inside it
  take precedence over H1/italic fallbacks.

### Sections and subsections

```markdown
## Section Heading

Body text, bullet lists, tables, blockquotes.

### Subsection Heading

More body text.
```

- `##` headings split the document into sections (numbered automatically 1, 2, 3…).
- `###` headings create subsections within a section.

### Supported block types

| Syntax | Block type |
|--------|-----------|
| Paragraph text | `paragraph` |
| `- ` / `* ` list | `bulletList` |
| `1. ` list | `numberedList` |
| `> ` blockquote | `blockquote` |
| `\| col \| col \|` table | `table` |
| `![alt](url)` | `image` |
| `![caption](https://www.youtube.com/watch?v=ID)` | `youtube` embed |

### Optional `@header` block

The same `@header` / `@title` / `@subtitle` / `@brand` / `@from` / etc. block
from the proposal format is also valid at the top of an article file.

---

## 3. Slides Format (`--slides`)

The slides parser (`parse-slides.js`) reads **plain markdown** and builds a deck.

### Slide delimiter

```markdown
---
```

Every `---` (three or more dashes on its own line) creates a slide boundary.
Chunks between delimiters become individual slides.

### Optional title slide

Place a `<!-- @header -->` block before the first `---` to generate a title
slide (slide 0). The header uses the same schema as the proposal/article format
(`@title`, `@subtitle`, `@brand`, `@brandsub`, `@logo`, `@footer`, `@from`,
`@date`, etc.).

```markdown
<!-- @header -->
<!-- @title value="Quarterly Review" -->
<!-- @subtitle value="Q2 2026 Results" -->
<!-- @brand value="Acme Corp" -->
<!-- @footer value="Confidential" -->
<!-- /@header -->

---

## First Real Slide

Content here.
```

### Slide headings

The first non-blank line of each slide chunk can be a heading (`#` or `##`) —
it becomes the slide title. Remaining content is block-parsed using the same
block parser as articles: paragraphs, bullets, numbered lists, blockquotes,
tables, images.

### Subsections within a slide

`###` headings within a slide body create subsection groupings (same
`groupSubsections()` logic shared with the article parser).

---

---

## 4. Diagram Markers

Three native diagram types are available in **all three formats** (proposal, article, slides).
Data for `@flow` and `@quadrant` is supplied either as an inline fenced ` ```json ` block
in the marker body **or** from an external file via `src="./path.json"` (resolved relative
to the `.md`). `src=` wins if both are given — the same precedence as the data-driven chart
types. `@mermaid` likewise takes its diagram source inline in the body **or** from
`src="./diagram.mmd"` (`src=` wins).

---

### `@flow` / `/@flow` — tabbed architecture flow diagram

Renders a `FlowDiagram` component: a tabbed, interactive pipeline flow with parallel lanes,
SVG arrows, and optional callout boxes.

```markdown
<!-- @flow title="System Architecture" -->
```json
{
  "systemName": "Hindsight",
  "accentColor": "#5b21b6",
  "tabs": [
    {
      "label": "Ingest",
      "stages": [
        { "label": "Input",   "type": "input"   },
        { "label": "Embed",   "type": "process" },
        { "label": "Store",   "type": "store"   }
      ]
    },
    {
      "label": "Query",
      "stages": [
        { "label": "Search",  "type": "search"  },
        { "label": "LLM",     "type": "llm"     },
        { "label": "Output",  "type": "output"  }
      ]
    }
  ],
  "callouts": [{ "title": "Key Point", "text": "Fast ingestion." }]
}
```
<!-- /@flow -->
```

**JSON fields:**
- `systemName` (required string) — displayed as the diagram title
- `accentColor` (optional string, hex) — accent color for the header bar
- `tabs` (required array) — each tab has `label` (string) and `stages` (array)
- `stages` — each stage has `label` (string) and `type` (see below), or `lanes` (array of stage objects for parallel paths)
- `callouts` (optional array) — each callout has `title` and `text`

**`type` values for stages:** `input` | `process` | `llm` | `store` | `search` | `output` | `unique`

If `tabs` is missing or the JSON is malformed, the build emits a visible error card
in place of the diagram. `--strict` aborts on resolver/syntax errors.

---

### `@quadrant` / `/@quadrant` — 2×2 positioning map

Renders a `QuadrantChart` component: a scatter-plot quadrant with labeled axes,
four quadrant labels, and dots positioned on a 0–100 coordinate grid.

```markdown
<!-- @quadrant title="Market Map" subtitle="Q1 2026" -->
```json
{
  "xAxisLow":  "Niche",
  "xAxisHigh": "Broad",
  "yAxisLow":  "Low",
  "yAxisHigh": "High",
  "quadrantLabels": ["Leaders", "Challengers", "Niche Players", "Visionaries"],
  "dots": [
    { "label": "Alpha", "x": 75, "y": 80, "color": "#5b21b6" },
    { "label": "Beta",  "x": 30, "y": 60, "color": "#6366f1", "note": "2025" }
  ]
}
```
<!-- /@quadrant -->
```

**JSON fields:**
- `xAxisLow` / `xAxisHigh` — labels for the left / right ends of the x-axis
- `yAxisLow` / `yAxisHigh` — labels for the bottom / top ends of the y-axis
- `quadrantLabels` (required array of exactly 4 strings) — top-right, top-left, bottom-right, bottom-left
- `dots` (required array, minimum 1) — each dot: `label` (string), `x` / `y` (0–100 integer coordinates), `color` (hex), optional `note` string

Dot coordinates use a 0–100 scale where (0,0) is bottom-left and (100,100) is top-right.
Missing or malformed JSON renders an error card. `--strict` aborts.

---

### `@mermaid` / `/@mermaid` — escape hatch for any diagram type

Renders any [Mermaid](https://mermaid.js.org/) diagram as an inline SVG baked into
the output at build time. The diagram source is passed as raw Mermaid text inside
the block body (no fenced block required — just the raw source).

```markdown
<!-- @mermaid title="Request Flow" -->
sequenceDiagram
  Client->>API: POST /generate
  API->>LLM: prompt
  LLM-->>API: completion
  API-->>Client: 200 OK
<!-- /@mermaid -->
```

**Build-time rendering:** the engine spins up a headless browser, loads the vendored
`mermaid.min.js` (v11.4.1, `engine/vendor/`), renders the diagram to SVG, and inlines
the result directly into the HTML output. The Mermaid library **never ships** in the
output artifact — only the rendered `<svg>` is included.

**Graceful fallback:** if no supported browser is found (`Chrome → Edge → Chromium`),
the build continues and renders the diagram source inside a `<pre>` block instead of
aborting. Override the browser path with `PD_BROWSER=/path/to/browser`.

**`--strict` behavior:** resolver errors (bad Mermaid syntax) and missing-browser
situations are treated as degraded (not errors) by default. With `--strict`, a
Mermaid syntax error that the renderer reports aborts the build; a missing browser
degrades gracefully even with `--strict`.

**`title` attribute** is optional and displayed as a caption above the diagram.

---

## Linting

Every `/doc` and `/slides` build **auto-lints** the source and prints line-numbered
diagnostics to stderr. The build still completes unless `--strict` is passed.

Use `/lint <file>` (or `--lint`) to check without building; exits non-zero on errors.

**Diagnostic codes:**

| Severity | Code | Condition |
|----------|------|-----------|
| error | `unclosed-block` | Paired marker opened but never closed (e.g. `<!-- @stats -->` with no `<!-- /@stats -->`) |
| error | `unknown-marker` | Unrecognised marker name (e.g. `<!-- @stas -->`) |
| error | `missing-attr` | Required attribute absent (e.g. `@card` without `icon` or `title`) |
| error | `bad-enum` | Attribute value not in the allowed set (e.g. `@cards type="grid"`) |
| warning | `unknown-icon` | `icon=` name not in the icon set — falls back to the placeholder glyph |
| warning | `unnumbered-section` | `## Heading` in a proposal without the required `N.` number prefix |
| warning | `duplicate-header` | More than one `@header` block in the document |

Article and slides formats are plain markdown; only the shared `@header` block and
structural balance are linted (the `@`-marker DSL linting applies to proposal format).

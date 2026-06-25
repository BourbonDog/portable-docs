# Charts and Diagrams

portable-docs has two families of visual: **data-driven charts** (`@chart`) and **structural diagrams** (`@flow`, `@quadrant`, `@mermaid`). Both are HTML-comment markers that wrap a data block; the engine resolves everything at build time and bakes the result into the output.

Back to [README.md](README.md) | See also [markers.md](markers.md) | [formats.md](formats.md) | [authoring-workflow.md](authoring-workflow.md)

---

## Charts (`@chart`)

### Anatomy

````markdown
<!-- @chart type="pie" title="Browser Share" subtitle="Q2 2026" -->
```csv
label,value
Chrome,65
Safari,35
```
<!-- /@chart -->
````

**Required:** `type`

**Optional:**

| Attribute  | Effect |
|------------|--------|
| `title`    | Heading above the chart |
| `subtitle` | Lighter sub-line |
| `xlabel`   | X-axis label (rendered only on `scatter`) |
| `ylabel`   | Y-axis label |
| `src`      | Path to a `.csv` or `.json` data file (relative to the `.md`) |

**Data source:** provide an inline ` ```csv ``` ` or ` ```json ``` ` fenced block **or** a `src="file.csv"` attribute. When both are present, **`src` wins** — the inline fence is ignored.

---

### The 7 data-driven types

All seven types render in every output format (proposal, article, slides).

#### Pie / Donut

CSV columns: `label, value[, color]`

````markdown
<!-- @chart type="pie" title="Browser Share" subtitle="Q2 2026" -->
```csv
label,value
Chrome,65
Safari,35
```
<!-- /@chart -->
````

````markdown
<!-- @chart type="donut" title="Budget Split" -->
```csv
label,value,color
Engineering,55,#5b21b6
Sales,25,#6366f1
Ops,20,#94a3b8
```
<!-- /@chart -->
````

#### Grouped-bar / Stacked-bar

**Wide CSV:** column 0 = category, every later column = a series.

````markdown
<!-- @chart type="grouped-bar" title="Revenue by Quarter" ylabel="$M" -->
```csv
quarter,Product A,Product B
Q1,120,80
Q2,150,95
```
<!-- /@chart -->
````

````markdown
<!-- @chart type="stacked-bar" title="Headcount by Team" -->
```csv
team,Eng,Design,PM
2024,20,5,3
2025,32,8,6
```
<!-- /@chart -->
````

#### Area / Line

Same wide-CSV shape as bar charts (column 0 = x/category, remaining columns = series).

````markdown
<!-- @chart type="area" title="Demand Index" ylabel="Index" -->
```csv
year,AI/ML
2019,100
2022,210
2025,340
```
<!-- /@chart -->
````

````markdown
<!-- @chart type="line" title="Two Series" -->
```csv
year,A,B
2019,10,5
2022,28,18
2025,40,30
```
<!-- /@chart -->
````

#### Scatter

CSV columns must be named `x` and `y`; optional `label` and `series`.
Scatter is the **only** chart type that renders an `xlabel` (X-axis label) — and
it renders `ylabel` too. (The other cartesian types, bar/area/line, render only
`ylabel`.)

````markdown
<!-- @chart type="scatter" title="Effort vs Impact" xlabel="Effort" ylabel="Impact" -->
```csv
x,y,label
2,80,Alpha
7,40,Beta
9,90,Gamma
```
<!-- /@chart -->
````

---

### Notes on data

- **`num()` silently strips non-numeric characters** (it keeps only digits, `.`, and `-`). `$3.5k` → `3.5`, `1,200` → `1200`, `65%` → `65`. Handy for pasting currency/percent values — but unit suffixes are **not** expanded: `3.5k` becomes `3.5`, not `3500`.
- **Color palette wraps.** The engine has a 4-color built-in palette; if a series has more than 4 items (pie/donut) or more than 4 series columns (bar/area/line), colors repeat from the beginning.
- **JSON alternative.** Replace the ` ```csv ``` ` fence with ` ```json ``` ` containing a non-empty array of row objects (keys become column names).

---

### Legacy chart types (proposal-only)

The types `growth`, `bar`, `hierarchy`, and `range` use a nested-marker syntax and are **proposal-only**. In article and slides output they render as a visible **error card** ("unknown chart type") — there is no lint warning. They are considered deprecated; use the 7 data-driven types above for any new document.

---

## Diagrams

### `@flow` — tabbed architecture pipeline

`@flow` renders a tabbed pipeline diagram with typed stage icons. Use it for AI system designs, data pipelines, and multi-path architecture overviews.

**Data:** inline ` ```json ``` ` fence or `src="file.json"` (src wins).

**Required JSON fields:**

| Field    | Type   | Notes |
|----------|--------|-------|
| `tabs`   | array  | Non-empty. Each entry: `{ "label": "...", "stages": [...] }` |

**Optional JSON fields:**

| Field         | Type   | Notes |
|---------------|--------|-------|
| `systemName`  | string | Shown as the diagram heading |
| `accentColor` | string | Hex color for highlights — **set this**; defaults to empty (no accent) |
| `callouts`    | array  | Each: `{ "title": "...", "text": "..." }` |

**Stage `type` enum:** `input | process | llm | store | search | output | unique`
Any unknown type falls back to `process`.

**Minimal example:**

````markdown
<!-- @flow title="System" -->
```json
{
  "systemName": "Hindsight",
  "accentColor": "#5b21b6",
  "tabs": [
    {
      "label": "Ingest",
      "stages": [
        { "label": "Input",  "type": "input"  },
        { "label": "Store",  "type": "store"  }
      ]
    }
  ]
}
```
<!-- /@flow -->
````

**Full example with two tabs and callouts:**

````markdown
<!-- @flow title="AI Memory System" -->
```json
{
  "systemName": "Hindsight",
  "accentColor": "#5b21b6",
  "tabs": [
    {
      "label": "Ingest",
      "stages": [
        { "label": "Input",  "type": "input"   },
        { "label": "Embed",  "type": "process" },
        { "label": "Store",  "type": "store"   }
      ]
    },
    {
      "label": "Query",
      "stages": [
        { "label": "Search", "type": "search"  },
        { "label": "Rerank", "type": "llm"     },
        { "label": "Output", "type": "output"  }
      ]
    }
  ],
  "callouts": [
    { "title": "Dual write", "text": "Embeddings and raw text stored together." }
  ]
}
```
<!-- /@flow -->
````

---

### `@quadrant` — 2×2 positioning map

`@quadrant` renders a scatter map on a 2×2 grid. Use it for competitive landscapes, priority matrices, or any two-axis positioning analysis.

**Data:** inline ` ```json ``` ` fence or `src="file.json"` (src wins).

**Required JSON fields:**

| Field            | Type  | Notes |
|------------------|-------|-------|
| `quadrantLabels` | array | **Exactly 4** strings. Order: top-left, top-right, bottom-left, bottom-right |
| `dots`           | array | Non-empty. Each: `{ "label": "...", "x": 0–100, "y": 0–100, "color": "#hex" }` |

**Optional dot field:** `"note"` — shown in the legend beside the label.

**Optional axis labels:**

| Field       | Placement |
|-------------|-----------|
| `xAxisLow`  | Left end of x-axis |
| `xAxisHigh` | Right end of x-axis |
| `yAxisLow`  | Bottom of y-axis |
| `yAxisHigh` | Top of y-axis |

**Coordinate system:** x `0` = left, x `100` = right; y `0` = **bottom**, y `100` = **top**. A dot at `(75, 80)` appears in the upper-right quadrant.

````markdown
<!-- @quadrant title="Market Map" -->
```json
{
  "xAxisLow": "Niche",
  "xAxisHigh": "Broad",
  "yAxisLow": "Low",
  "yAxisHigh": "High",
  "quadrantLabels": ["Leaders", "Challengers", "Niche", "Visionaries"],
  "dots": [
    { "label": "Us", "x": 75, "y": 80, "color": "#5b21b6" }
  ]
}
```
<!-- /@quadrant -->
````

---

### `@mermaid` — escape hatch for any Mermaid diagram

`@mermaid` renders any diagram type the bundled Mermaid library supports — sequence, flowchart, class, ER, Gantt, and more. The engine renders to inline SVG at build time via a headless browser.

**Body:** raw Mermaid source pasted **directly** between the open and close tags — **no inner code fence**. The source is not wrapped in triple-backticks.

**`src` attribute:** point to a `.mmd` file instead of an inline body; `src` wins when both are present.

```
<!-- @mermaid title="Request Flow" -->
sequenceDiagram
  Client->>API: POST /generate
  API-->>Client: 200 OK
<!-- /@mermaid -->
```

The engine auto-maps the doc theme (`editorial` / `dark` / `brand`) and the `PD_ACCENT` color to Mermaid's `themeVariables`, so diagrams match the rest of the document without manual configuration.

**No headless browser:** if no browser is detected at build time the engine falls back to a `<pre>` block showing the raw source. The build still succeeds.

---

## Error cards and `--strict`

By default, any chart or diagram that cannot render (bad data, unknown type, missing file) is replaced by a visible inline **error card** and the build **succeeds**. This lets a draft with placeholder data still produce a usable HTML file.

`--strict` changes the behavior:

| Condition | Default | `--strict` |
|-----------|---------|------------|
| Chart data error | Error card, build succeeds | **Aborts** |
| `@flow` / `@quadrant` data error | Error card, build succeeds | **Aborts** |
| Real `@mermaid` render error | Error card, build succeeds | **Aborts** |
| **Missing headless browser** (Mermaid) | `<pre>` fallback, build succeeds | **Still degrades gracefully** — does NOT abort |

The missing-browser exception is intentional: `--strict` cannot require infrastructure that may legitimately not be present on a CI machine.

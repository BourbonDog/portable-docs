<!-- @header -->
<!-- @title value="Diagram Showcase" -->
<!-- @subtitle value="Native flow, quadrant, and Mermaid diagrams" -->
<!-- /@header -->

## 1. Flow Diagram

`@flow` produces a tabbed architecture diagram with typed stages and optional callouts.
Use it for AI pipelines, data architectures, and multi-path system flows.

<!-- @flow title="AI Memory System" -->
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
        { "label": "Rerank",  "type": "llm"     },
        { "label": "Output",  "type": "output"  }
      ]
    }
  ],
  "callouts": [
    { "title": "Dual write", "text": "Embeddings and raw text stored together." }
  ]
}
```
<!-- /@flow -->

## 2. Quadrant Chart

`@quadrant` produces a 2×2 positioning map. Dots use 0–100 coordinates where
(0,0) is bottom-left and (100,100) is top-right.

<!-- @quadrant title="AI Tool Landscape" subtitle="Q2 2026" -->
```json
{
  "xAxisLow":  "Narrow",
  "xAxisHigh": "Broad",
  "yAxisLow":  "Low Impact",
  "yAxisHigh": "High Impact",
  "quadrantLabels": ["Leaders", "Specialists", "Challengers", "Niche"],
  "dots": [
    { "label": "Hindsight", "x": 78, "y": 85, "color": "#5b21b6" },
    { "label": "Competitor A", "x": 60, "y": 55, "color": "#6366f1" },
    { "label": "Competitor B", "x": 30, "y": 70, "color": "#94a3b8" }
  ]
}
```
<!-- /@quadrant -->

## 3. Mermaid Diagram

`@mermaid` is the escape hatch for any diagram type Mermaid supports. The engine
renders it to an inline SVG at build time via a headless browser; if no browser is
found the source is shown in a `<pre>` fallback instead of aborting.

<!-- @mermaid title="Request Lifecycle" -->
sequenceDiagram
  Client->>API: POST /query
  API->>VectorDB: semantic search
  VectorDB-->>API: top-k chunks
  API->>LLM: prompt + context
  LLM-->>API: completion
  API-->>Client: 200 OK
<!-- /@mermaid -->

> See also: [[chart-showcase]] for the seven data-driven SVG chart types (`pie`, `donut`, `grouped-bar`, `stacked-bar`, `area`, `line`, `scatter`).

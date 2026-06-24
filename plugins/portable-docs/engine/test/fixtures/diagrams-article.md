# Diagrams Article Test

*A test article with flow and quadrant diagrams.*

## Architecture

A flow diagram showing the Hindsight system.

<!-- @flow title="Hindsight Architecture" -->
```json
{
  "systemName": "Hindsight",
  "accentColor": "#5b21b6",
  "tabs": [
    {
      "label": "Ingest",
      "stages": [
        { "label": "Input", "type": "input" },
        { "label": "Process", "type": "process" },
        { "label": "Store", "type": "store" }
      ]
    }
  ],
  "callouts": [{ "title": "Note", "text": "Real-time ingestion." }]
}
```
<!-- /@flow -->

## Positioning

A quadrant chart showing Positioning.

<!-- @quadrant title="Positioning" subtitle="Q1 2026" -->
```json
{
  "xAxisLow": "Niche",
  "xAxisHigh": "Broad",
  "yAxisLow": "Low",
  "yAxisHigh": "High",
  "quadrantLabels": ["Leaders", "Challengers", "Niche Players", "Visionaries"],
  "dots": [
    { "label": "Alpha", "x": 75, "y": 80, "color": "#5b21b6" }
  ]
}
```
<!-- /@quadrant -->

<!-- @header -->
<!-- @title value="Diagrams Proposal Test" -->
<!-- /@header -->

## 1. Architecture

### Flow Section

<!-- @flow title="System Architecture" -->
```json
{
  "systemName": "TestSystem",
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
  "callouts": [{ "title": "Key Point", "text": "Fast ingestion." }]
}
```
<!-- /@flow -->

### Quadrant Section

<!-- @quadrant title="Positioning Map" subtitle="Q1 2026" -->
```json
{
  "xAxisLow": "Niche",
  "xAxisHigh": "Broad",
  "yAxisLow": "Low",
  "yAxisHigh": "High",
  "quadrantLabels": ["Leaders", "Challengers", "Niche Players", "Visionaries"],
  "dots": [
    { "label": "Us", "x": 75, "y": 80, "color": "#5b21b6" },
    { "label": "Them", "x": 30, "y": 45, "color": "#6366f1" }
  ]
}
```
<!-- /@quadrant -->

### Bad Flow Section

<!-- @flow title="Broken Flow" -->
```json
{ "systemName": "X" }
```
<!-- /@flow -->

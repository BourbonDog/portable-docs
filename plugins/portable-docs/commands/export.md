---
description: Export a built portable-docs HTML file to PDF and/or PNG via a local headless browser.
---

# /export

Render an already-built portable-docs HTML file to **PDF** and/or **PNG** using a
system headless browser (Chrome, Edge, or Chromium). No network and no npm
dependencies — it drives a browser you already have installed.

## Usage

```
/export <file.html> [--pdf] [--png] [--out <dir>]
```

- With no `--pdf`/`--png`, both are produced.
- `--out <dir>` writes outputs to a directory (default: alongside the HTML).
- Output files reuse the HTML's base name (`report.html` → `report.pdf` / `report.png`).

You can also export at build time: add `--pdf` / `--png` to `/doc` or `/slides`.

## Behavior

- **Slides** export to a one-slide-per-page **landscape PDF** plus a single **hero PNG**
  of the title slide.
- **Proposals / articles** export to a PDF and a full-page PNG. The `@media print`
  stylesheet hides on-screen chrome (table of contents, progress bar, copy buttons),
  expands collapsed cards, and avoids awkward page breaks.

## Requirements & fallbacks

- Needs Chrome, Edge, or Chromium installed. Override the executable with the
  `PD_BROWSER` environment variable.
- If no browser is found, `/export` prints guidance and exits cleanly — open the HTML
  and use the browser's **Print → Save as PDF** instead.

## Implementation

Run the engine exporter:

```
node engine/scripts/export.js <file.html> --pdf --png
```

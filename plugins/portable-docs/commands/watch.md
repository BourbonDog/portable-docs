---
description: Live-preview a portable-docs document — rebuilds on save and auto-refreshes the browser.
---

# /watch

Start a local live-preview server for a portable-docs source. Opens your browser
once, then rebuilds and auto-refreshes the tab every time you save the source.

## Usage

```
/watch <source.md> [--theme <name>] [--style article] [--slides] [--brand <name>]
```

- Opens `http://127.0.0.1:<port>/` (an ephemeral port) and reloads on save via Server-Sent Events.
- The on-disk HTML stays a pristine self-contained file — the reload script is injected only into the served response.
- Preview-only: `--pdf` / `--png` are ignored while watching.
- A build error keeps the last good preview on screen and shows the error in a banner; fix and save to recover.
- `Ctrl-C` stops the server.

It also watches your `portable-docs.config.json` (if present), so brand/theme/identity changes hot-reload too.

## Requirements & fallbacks

- Needs a browser to view the preview. If none opens automatically, copy the printed `http://127.0.0.1:<port>/` URL into your browser.

## Implementation

```
node engine/scripts/build-doc.js --input <source.md> --watch
```

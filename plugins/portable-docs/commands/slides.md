---
description: Build a slide deck from a source file or outline
argument-hint: <source> [--theme vanderbilt|editorial|dark|brand] [--brand <name>] [--lint] [--strict] [--watch] [--jsx]
---

Alias for `/doc $ARGUMENTS --slides`. Builds a slide deck from `$ARGUMENTS`.

Follow the full `/doc` workflow (SKILL.md Steps 1–5) with `--slides` locked in:

1. Read `$ARGUMENTS` as a file path or inline content.
2. Structure the content as slides: each slide separated by `---` (three dashes on its own line). First non-blank line per slide becomes the slide title. Add a `<!-- @header -->` block before the first `---` for a title slide if the content has a clear title/subtitle.
3. Choose a theme — `dark` is recommended for decks; user may override via `--theme`.
4. Build:

```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input path/to/deck.md \
  --out path/to/output.html \
  --slides \
  --theme <vanderbilt|editorial|dark|brand> \
  [--brand <name>] \
  [--lint] \
  [--strict] \
  [--watch] \
  [--jsx]
```

The engine opens the deck in the browser automatically on success. For full flag and markup reference see SKILL.md and `$CLAUDE_PLUGIN_ROOT/references/markers.md`.

**Phase 3 flags (also available on `/slides`):**

| Flag | Purpose |
|------|---------|
| `--brand <name>` | Select a named preset from `portable-docs.config.json` |
| `--config <path>` | Use a specific config file instead of auto-discovery |
| `--no-config` | Skip config loading for this build |
| `--lint` | Lint only — no build; exits non-zero on errors |
| `--strict` | Abort build on lint errors |
| `--watch` | Live-preview server (preview-only; `--pdf`/`--png` ignored) |

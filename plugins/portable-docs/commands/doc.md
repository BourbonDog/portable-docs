---
description: Generate a polished, self-contained HTML document from a source file or inline content
argument-hint: <source> [--style proposal|article] [--slides] [--theme editorial|dark|brand] [--jsx]
---

Turn `$ARGUMENTS` into a polished, portable HTML file using the portable-docs engine.

## Step 1 — Read the source

`$ARGUMENTS` is either a file path or inline content (markdown text, bullet points, notes).

- If it is a file path, read that file.
- If it is inline content, write it to a temporary `.md` file in the current directory (e.g. `_pd-input.md`) so the engine can consume it.

## Step 2 — Parse flags from $ARGUMENTS

Extract any flags the user passed:

| Flag | Engine flag | Notes |
|------|-------------|-------|
| `--style proposal` | `--style proposal` | Default — rich proposal/pitch layout |
| `--style article` | `--style article` | Long-form editorial layout |
| `--slides` | `--slides` | Slide deck; wins over `--style article` if both present |
| `--theme editorial` | `--theme editorial` | Default theme (paper-white, violet accent) |
| `--theme dark` | `--theme dark` | Near-black, cyan accent — best for technical docs |
| `--theme brand` | `--theme brand` | Neutral slate with `PD_ACCENT` override support |
| `--jsx` | `--jsx` | Copy JSX bundle next to the HTML output |

**Content intents → engine flags:**
- User says "report", "one-pager", or "pitch doc" → `--style proposal` (default; do NOT invent a `--style report` or `--style one-pager` flag)
- User says "essay", "blog post", "long-form", or "article" → `--style article`
- User says "deck", "presentation", or "slides" → `--slides`

## Step 3 — Pick and apply the right format

Follow the SKILL.md workflow:

1. **Choose format** based on the content and any explicit `--style`/`--slides` flag (see Step 2).
2. **Auto-markup** the markdown for the chosen format using `$CLAUDE_PLUGIN_ROOT/references/markers.md`:
   - Proposal: add `<!-- @header -->` block, structure as numbered `## N.` sections, insert `@`-marker component blocks (`@stats`, `@cards`, `@chart`, `@timeline`, `@quotes`, `@pullquote`, etc.) where the content warrants them.
   - Article: use standard markdown headings and prose; optional `<!-- @header -->` for a full-bleed cover.
   - Slides: separate slides with `---`; optional `<!-- @header -->` before the first `---` for a title slide.
3. **Choose a theme** if the user did not specify one (`editorial` is the default).

## Step 4 — Build

Check Node ≥ 18 is available (`node --version`), then invoke:

```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input path/to/input.md \
  --out path/to/output.html \
  --theme <editorial|dark|brand> \
  [--style proposal|article] \
  [--slides] \
  [--jsx]
```

Omit `--no-open` — the engine opens the result in the browser automatically on success.

On success the engine prints the resolved output path and exits 0.

## Step 5 — Report back

Tell the user:
- The output file path that the engine printed.
- The format and theme used.
- Any `@`-marker components you added and why (brief).
- Offer to iterate: swap theme, adjust a component, or rebuild with different flags.

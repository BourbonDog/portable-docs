---
description: Lint a portable-docs source file for malformed, unknown, or under-specified markers (line-numbered).
---

# /lint

Check a portable-docs markdown source for marker problems **without building**.
Reports line-numbered errors and warnings; exits non-zero when there are errors.

## Usage

```
/lint <source.md>
```

## What it checks (proposal format)

- **Errors** (the marker is silently dropped or the render breaks):
  - unclosed / unmatched paired markers (`<!-- @stats -->` with no `<!-- /@stats -->`)
  - unknown markers (typos like `@stas`)
  - missing required attributes (`@card` needs `icon` + `title`, `@stat` needs `value`/`label`/`source`, …)
  - invalid enum values (`@cards type` must be `feature|profile|topic`; `@chart type` must be `growth|bar|hierarchy|range`)
- **Warnings** (renders, but degraded):
  - unknown `icon=` name (falls back to the placeholder glyph)
  - a `## Title` section without the required `N.` number prefix
  - more than one `@header` block

Article and slides files are plain markdown; only the shared `@header` block and
structural balance are linted.

## Related

- Every `/doc` and `/slides` build auto-lints and prints warnings to stderr (it still builds).
- Add `--strict` to a build to make lint **errors** abort the build.

## Implementation

```
node engine/scripts/build-doc.js --input <source.md> --lint
```

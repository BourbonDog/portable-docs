# Icon Reference

All supported icon names for the `@card icon="…"` marker in portable-docs.

Icons are defined in `engine/src/design-tokens.js` (`Icons` object, ≈line 329).
The helper `getIcon(name, color)` retrieves them; any unknown name falls back to
the `placeholder` glyph (see [Unknown-name fallback](#unknown-name-fallback) below).

---

## Usage

```markdown
<!-- @cards type="feature" columns="3" section="1" -->
<!-- @card icon="search" title="Discovery" -->
Short description here.
<!-- /@card -->
<!-- /@cards -->
```

The value of `icon=` must exactly match one of the names below (case-sensitive).

---

## Core Icon Set

| Name            | Description                                      |
|-----------------|--------------------------------------------------|
| `arrowRight`    | Horizontal arrow pointing right                  |
| `book`          | Open book with spine                             |
| `brain`         | Dual-hemisphere brain outline                    |
| `briefcase`     | Briefcase / portfolio bag                        |
| `chart`         | Vertical bar chart (3 bars)                      |
| `code`          | `< >` chevron brackets (code angle brackets)     |
| `compass`       | Circle with directional needle polygon           |
| `cpu`           | CPU / processor chip with pin lines              |
| `database`      | Stacked ellipses (cylinder / database)           |
| `gitBranch`     | Git branch with circle nodes                     |
| `graduation`    | Graduation cap (mortarboard)                     |
| `layers`        | Stacked polygon layers                           |
| `lightbulb`     | Lightbulb with filament paths                    |
| `messageSquare` | Chat bubble with tail                            |
| `microphone`    | Microphone with stand arc                        |
| `network`       | Node-link tree (3 circles, 2 branch lines)       |
| `palette`       | Artist's palette with color dots                 |
| `quote`         | Open-quote double-comma (filled)                 |
| `rocket`        | Rocket with flame and exhaust paths              |
| `search`        | Magnifying glass (circle + angled line)          |
| `server`        | Two server rack rectangles with status dots      |
| `shield`        | Shield with checkmark                            |
| `target`        | Concentric circles (bullseye)                    |
| `users`         | Two overlapping person silhouettes               |
| `zap`           | Lightning bolt polygon                           |

**Total: 25 named icons** (all are the documented core set as of Task 2.3).

---

## Unknown-name fallback

If `icon=` is set to a name that does not exist in the table above, `getIcon`
returns the `placeholder` glyph — a **dashed-border rounded square** — instead
of silently rendering a real icon.

This behavior is intentional: the placeholder is visually neutral and distinct
from every real icon, so authors who mistype a name get an obvious marker rather
than a misleading real glyph (the old fallback was `lightbulb`, which could go
unnoticed).

The `placeholder` name is also valid as an explicit icon value if needed, but it
is not part of the content icon vocabulary — it exists solely as the fallback.

```markdown
<!-- @card icon="totally-unknown-xyz" title="Example" -->
This renders a dashed-border square (placeholder), not a lightbulb.
<!-- /@card -->
```

---

## Notes

- Icon names are **camelCase** where multi-word (`arrowRight`, `gitBranch`, `messageSquare`).
- All icons share the same visual style: `24×24 px`, `fill="none"`, `stroke={color}`,
  `strokeWidth="1.5"`, round caps and joins — except `quote` which uses `fill={color}`.
- The `placeholder` icon uses `strokeDasharray="3 2"` to make it visually distinct.
- To add a new icon, add an entry to the `Icons` object in
  `engine/src/design-tokens.js` and update this file.

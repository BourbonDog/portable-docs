# Output Formats

portable-docs has three output formats. Each is a distinct layout pipeline that
decides how your Markdown is parsed, which markers are active, and how the HTML
is structured.

---

## Proposal (default)

**Invocation:** `/doc file.md` or `--style proposal`

The richest format. Designed for pitches, one-pagers, proposals, reports,
resumes, landing pages, and RFPs.

- Body is numbered `## N. Title` sections (e.g. `## 1. Problem`) with optional
  `### Subsection` headings inside each.
- A trailing `## Citations` section is rendered as a reference list.
- The full marker set is active — `@header`, `@stats`, `@cta`, `@icons`,
  `@features`, `@table`, `@timeline`, `@comparison`, `@quote`, all chart types,
  all diagram types. See [markers.md](markers.md) for the complete reference.

**Minimal example:**

```markdown
<!-- @header -->
<!-- @title value="Q3 Proposal" -->
<!-- @from name="Ada Lovelace" email="ada@example.com" -->
<!-- /@header -->

## 1. The Opportunity

We can reduce churn by 30 % with a single product change.

<!-- @stats -->
<!-- @stat value="30%" label="Churn reduction" source="Q2 analysis" -->
<!-- @stat value="2 wks" label="Time to ship" source="estimate" -->
<!-- /@stats -->
```

---

## Article (`--style article`)

**Invocation:** `/doc essay.md --style article`

Long-form editorial prose. Best for essays, blog posts, reports, changelogs,
and newsletters.

- `# H1` at the top = document title.
- First `*italic*` line after the title = subtitle (displayed below the title
  in a lighter style).
- Body structured with `## Section` and `### Subsection` headings, paragraphs,
  bullet lists, numbered lists, blockquotes, and GFM tables.
- An optional `<!-- @header -->` block before the body generates a cover card
  (same schema as proposal: title, subtitle, brand, date, etc.).

**What renders vs. what is left as literal text:**

| Element | Renders? |
|---------|---------|
| `<!-- @header -->` cover block | Yes |
| Data-driven charts (pie, donut, grouped-bar, stacked-bar, area, line, scatter) | Yes |
| `<!-- @flow -->` node diagrams | Yes |
| `<!-- @quadrant -->` quadrant charts | Yes |
| `<!-- @mermaid -->` diagrams | Yes |
| Proposal-only markers (`@stats`, `@cta`, `@icons`, `@features`, `@table`, `@timeline`, `@comparison`, `@quote`) | No — ignored; they don't render and produce no visible output |

> For a full list of which markers belong to which category, see
> [markers.md](markers.md).

**Minimal example:**

```markdown
# The State of Open Source AI

*How foundation models changed the game in 2024.*

## Background

Three years ago, large models were locked behind APIs.

## What Changed

Community-driven weights shifted the balance of power.
```

With a cover:

```markdown
<!-- @header -->
<!-- @title value="The State of Open Source AI" -->
<!-- @subtitle value="How foundation models changed the game in 2024." -->
<!-- @from name="Ada Lovelace" email="ada@example.com" -->
<!-- @date value="June 2026" -->
<!-- /@header -->

## Background

Three years ago, large models were locked behind APIs.
```

---

## Slides (`--slides`)

**Invocation:** `/slides deck.md` or `/doc deck.md --slides`

A full-viewport slide deck. Best for presentations and pitches you share
as a link.

- Slides are separated by `---` on its own line.
- Each slide's title is its leading `#` or `##` heading. A slide whose
  first non-blank line is **not** a `#`/`##` heading has **no title** —
  its entire text is treated as body.
- An optional `<!-- @header -->` block placed **before** the first `---`
  generates a formatted title slide (slide 0) with title, subtitle, and
  brand name.
- `--theme dark` is recommended for presentations — the engine default
  remains `editorial` unless you pass `--theme dark` (or set it in
  `portable-docs.config.json`).

**Minimal example:**

```markdown
<!-- @header -->
<!-- @title value="Portable Docs" -->
<!-- @subtitle value="Docs that go anywhere." -->
<!-- @from name="Ada Lovelace" email="ada@example.com" -->
<!-- /@header -->

---

## Why portable-docs?

- One command to a shareable HTML file
- No runtime dependencies
- Opens offline

---

## How it works

Parse → Bundle → Wrap → Done.
```

---

## Routing and priority

| Condition | Pipeline |
|-----------|---------|
| `--slides` | Slides (wins over all other flags) |
| `--style article` | Article |
| everything else | Proposal (default) |

- `--slides` **wins** over `--style article` if both are passed.
- `--type <name>` applies a base format and theme as the *lowest-priority*
  defaults; an explicit `--slides` or `--style` flag always overrides them.
- Default theme is `editorial` for all three formats unless you pass
  `--theme` or set it in `portable-docs.config.json`.

See [commands-and-cli.md](commands-and-cli.md) for the full flag reference.

---

## Which markers work in each format?

Only `@header`, the seven data-driven chart types, and the three diagram
types (`@flow`, `@quadrant`, `@mermaid`) are cross-format. All other
proposal-only markers (`@stats`, `@cta`, `@icons`, etc.) are ignored in
article and slides output — they don't render and produce no visible output.

Full per-marker format support is documented in [markers.md](markers.md).

---

← Back to the [guide index](README.md).

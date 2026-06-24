# Marker DSL Reference

portable-docs proposals are authored in plain Markdown with embedded
**HTML-comment markers** that drive the rich layout components. This page is
the complete reference for every marker — syntax, required and optional
attributes, format availability, and paste-ready examples.

Back to [README.md](../README.md) | See also [formats.md](formats.md) |
[charts-and-diagrams.md](charts-and-diagrams.md) |
[theming-and-branding.md](theming-and-branding.md)

---

## How markers work

### Syntax

Every marker is an HTML comment:

```
<!-- @name attr="value" attr2="value2" -->
```

- The name starts with `@` and uses lowercase letters only (e.g. `@stats`,
  `@card`).
- Attribute values **must be double-quoted**. Single quotes and unquoted values
  are not parsed.
- Attributes are key=value pairs separated by spaces.

### Inline (self-closing) vs paired

Some markers are **self-closing** — a single comment, no closing tag:

```markdown
<!-- @stat value="42M" label="Active learners" source="EdTech Report" -->
```

Others are **paired** — an open comment, body content, and a closing comment:

```markdown
<!-- @stats -->
<!-- @stat value="42M" label="Active learners" source="EdTech Report" -->
<!-- /@stats -->
```

Whether a marker is inline or paired is **fixed per marker** (documented below).
Using the wrong form produces an `unclosed-block` or `unknown-marker` lint error
and the block is dropped.

### Placement

Markers are positional or keyed:

- **Positional** — charts, tables, terminals, flows, quadrants render where they
  appear in the document, replacing the marker comment in the output.
- **Keyed by `section=`** — cards, worklists, and quotes blocks use `section=`
  to match the numbered section heading where they will appear (e.g. `section="2"`
  matches `## 2. The Solution`). Place the marker anywhere in the file.
- **Keyed by `type=`** — testimonials groups are keyed by their `type` attribute.
- **Keyed by `href=`** — CTA bands are placed by their destination URL.
- **Pull quotes** — placed positionally; the **first** `@pullquote` in the file
  also becomes the hero quote shown at the top of the proposal.

### Cross-format availability

> **Proposal-only markers render as literal text in article and slides formats.**
>
> The following markers work in **all three formats** (proposal, article, slides):
> `@header` (and its sub-markers), the seven data-driven chart types
> (`pie`, `donut`, `grouped-bar`, `stacked-bar`, `area`, `line`, `scatter`),
> `@flow`, `@quadrant`, and `@mermaid`.
>
> All other markers in this reference are **proposal-only**. If you place a
> `@stats` block in an article or slides file it will appear as a raw HTML
> comment in the output — the layout component is not rendered.

---

## Header / identity markers

These markers belong inside the `@header` paired block. Exactly one `@header`
block per document. Every sub-marker is inline/self-closing.

### `@header`

**Paired container.** Wraps all document metadata. Place it at the very top of
the file, before any `## N.` sections.

```markdown
<!-- @header -->
<!-- @title value="Document Title" -->
<!-- @subtitle value="One-line description" -->
<!-- @eyebrow value="CATEGORY LABEL" -->
<!-- @brand value="Org / Company Name" -->
<!-- @brandsub value="Team or sub-brand" -->
<!-- @logo value="https://cdn.example.com/logo.png" -->
<!-- @date value="June 2026" -->
<!-- @from name="Full Name" email="you@example.com" linkedin="https://linkedin.com/in/…" github="https://github.com/…" -->
<!-- @headshot url="https://cdn.example.com/headshot.jpg" -->
<!-- @footer value="Confidential — June 2026" -->
<!-- /@header -->
```

All sub-markers are optional. Formats: proposal, article, slides.

---

### `@title`

**Inline.** Required attribute: `value`.

```markdown
<!-- @title value="Atlas Platform" -->
```

---

### `@subtitle`

**Inline.** Required attribute: `value`.

```markdown
<!-- @subtitle value="A unified data intelligence layer." -->
```

---

### `@eyebrow`

**Inline.** Small label rendered above the title (e.g. `PRODUCT PROPOSAL`).
Required attribute: `value`.

```markdown
<!-- @eyebrow value="PRODUCT PROPOSAL" -->
```

---

### `@brand`

**Inline.** Organization or company name. Required attribute: `value`.

```markdown
<!-- @brand value="Northwind Labs" -->
```

---

### `@brandsub`

**Inline.** Sub-brand or team label (e.g. `Product Strategy`). Required
attribute: `value`.

```markdown
<!-- @brandsub value="Product Strategy" -->
```

---

### `@logo`

**Inline.** URL to a logo image. Required attribute: `value` (the image URL).

```markdown
<!-- @logo value="https://cdn.example.com/logo.png" -->
```

---

### `@date`

**Inline.** Document date. Required attribute: `value`.

```markdown
<!-- @date value="Q3 2026" -->
```

---

### `@from`

**Inline.** Author / sender identity. Required attributes: `name`, `email`
(in that order — order is significant). Optional: `linkedin`, `github`.

```markdown
<!-- @from name="Jordan Mercer" email="jordan@example.com" linkedin="https://linkedin.com/in/jmercer" github="https://github.com/jmercer" -->
```

Note: attribute order matters — `name` before `email`. The parser reads
attributes positionally in the DSL.

---

### `@headshot`

**Inline.** Headshot photo URL. Required attribute: `url` (not `value`).

```markdown
<!-- @headshot url="https://cdn.example.com/headshot.jpg" -->
```

---

### `@footer`

**Inline.** Footer note (shown at the bottom of each page in print). Required
attribute: `value`.

```markdown
<!-- @footer value="Confidential — Northwind Labs 2026" -->
```

---

## Content block markers

All content block markers are **proposal-only** unless noted.

---

### `@stats` / `@stat`

**`@stats` is paired; `@stat` is inline.** Renders a StatsGrid row of key
metrics. Each `@stat` requires three attributes: `value`, `label`, `source`.

```markdown
<!-- @stats -->
<!-- @stat value="$18B" label="Mid-market analytics TAM" source="Gartner, 2025" -->
<!-- @stat value="74%" label="Ops teams cite data lag" source="Northwind Survey" -->
<!-- /@stats -->
```

---

### `@cards` / `@card` / `@expanded`

**All three are paired.** Renders a card grid. Three visual styles: `feature`,
`profile`, `topic`.

`@cards` attributes:

| Attribute | Required | Values / default |
|-----------|----------|-----------------|
| `type` | required | `feature` \| `profile` \| `topic` |
| `columns` | optional | integer, default `3` |
| `section` | optional | section number string for placement keying |
| `label` | optional | grid heading text |

`@card` attributes:

| Attribute | Required | Notes |
|-----------|----------|-------|
| `icon` | required | see [Icon names](#icon-names) below |
| `title` | required | card heading |
| `audience` | optional | shown as a tag on `topic`-type cards |

`@expanded` (inline/self-closing, no attributes) — a divider inside a `@card`
body. Text before `<!-- @expanded -->` is the collapsed preview; text after is
revealed on click. No closing tag.

```markdown
<!-- @cards type="feature" columns="3" section="2" label="Core Pillars" -->
<!-- @card icon="database" title="Unified Ingestion" -->
Connect any source through a single config layer.
<!-- /@card -->
<!-- @card icon="rocket" title="Ship Fast" audience="Engineering" -->
Short visible teaser.
<!-- @expanded -->
Longer detail revealed on expand.
<!-- /@card -->
<!-- /@cards -->
```

---

### `@timeline` / `@entry`

**Both are paired.** Renders a chronological timeline (career, project phases,
etc.). `@entry` body is the description text.

`@entry` attributes:

| Attribute | Required | Values / default |
|-----------|----------|-----------------|
| `year` | required | year or range string, e.g. `"2022–Present"` |
| `company` | required | company or phase name |
| `title` | required | role or milestone title |
| `highlight` | required | `"true"` \| `"false"` |

```markdown
<!-- @timeline -->
<!-- @entry year="2022–Present" company="NextCo" title="Staff Engineer" highlight="true" -->
- Led the microservices migration, cutting median deploy time 70%.
<!-- /@entry -->
<!-- @entry year="2018–2022" company="Acme Corp" title="Senior Engineer" highlight="false" -->
Built the event-sourcing platform powering 50M daily requests.
<!-- /@entry -->
<!-- /@timeline -->
```

---

### `@quotes` / `@quote`

**Both are paired.** Renders a quote carousel. `@quote` body is the quote text.

`@quotes` attributes:

| Attribute | Required | Notes |
|-----------|----------|-------|
| `section` | optional | section number string for placement keying |

`@quote` attributes:

| Attribute | Required | Notes |
|-----------|----------|-------|
| `author` | required | speaker name |
| `title` | required | speaker title or affiliation |
| `cite` | optional | citation reference, e.g. `"[3]"` |

```markdown
<!-- @quotes section="1" -->
<!-- @quote author="Lenny Rachitsky" title="PM Coach" cite="[3]" -->
The bar for "good enough" is rising fast.
<!-- /@quote -->
<!-- @quote author="Shreyas Doshi" title="ex-Stripe PM" -->
Context is everything.
<!-- /@quote -->
<!-- /@quotes -->
```

---

### `@pullquote`

**Paired.** Renders a large-format editorial pull quote. Body is the quote text.
Optional attributes: `author`, `title`.

The **first** `@pullquote` in the document also becomes the hero quote displayed
prominently at the top of the proposal view.

```markdown
<!-- @pullquote author="VP Operations, RetailCo" title="Pilot Participant" -->
Before Atlas, I spent two days a week reconciling numbers. Now it takes twenty minutes.
<!-- /@pullquote -->
```

---

### `@credentials` / `@credential`

**`@credentials` is paired; `@credential` is inline.** Renders a row of
credential callouts (years of experience, publications, etc.).

`@credential` attributes: `value` (required), `label` (required).

```markdown
<!-- @credentials -->
<!-- @credential value="12+" label="Years in industry" -->
<!-- @credential value="4" label="Successful exits" -->
<!-- @credential value="50k+" label="Students taught" -->
<!-- /@credentials -->
```

---

### `@testimonials` / `@testimonial`

**Both are paired.** Renders testimonial groups. `type` controls the visual
treatment (`leadership`, `teaching`, `student` are conventional values; the
attribute is not enum-locked — any string is accepted).

`@testimonials` attributes:

| Attribute | Required | Notes |
|-----------|----------|-------|
| `type` | required | `"leadership"` \| `"teaching"` \| `"student"` (or any string) |
| `source` | optional | provenance label, e.g. `"LinkedIn recommendations"` |

`@testimonial` attributes: all optional — `author`, `title`, `subtitle`. Body is
the testimonial text.

```markdown
<!-- @testimonials type="leadership" source="LinkedIn recommendations" -->
<!-- @testimonial author="Jane Smith" title="CTO" subtitle="Acme Corp" -->
One of the best engineers I've worked with.
<!-- /@testimonial -->
<!-- /@testimonials -->
```

---

### `@worklist` / `@workitem`

**Both are paired.** Renders a portfolio section with icons and technology tags.
`@workitem` body is the description text.

`@worklist` attributes: `section` (required — section number string for
placement keying).

`@workitem` attributes:

| Attribute | Required | Notes |
|-----------|----------|-------|
| `icon` | required | see [Icon names](#icon-names) below |
| `title` | required | work item heading |
| `technologies` | optional | comma-separated string, e.g. `"Redis,Go,Kubernetes"` |

```markdown
<!-- @worklist section="3" -->
<!-- @workitem icon="server" title="Distributed Cache Layer" technologies="Redis,Go,Kubernetes" -->
Designed and shipped a multi-region cache. Reduced p99 latency by 60%.
<!-- /@workitem -->
<!-- @workitem icon="cpu" title="ML Inference Pipeline" technologies="Python,PyTorch" -->
End-to-end inference pipeline handling 10k req/s.
<!-- /@workitem -->
<!-- /@worklist -->
```

---

### `@convergence` / `@role`

**Both are paired.** Renders a Venn-style role-evolution diagram (e.g. PM +
Designer + Engineer converging to Product Engineer). Only the **first**
`@convergence` block in the document is parsed; subsequent ones are silently
ignored.

`@convergence` attributes: `position` (optional, default `"after"`).

`@role` attributes: `from` (required), `to` (required), `description` (required).

```markdown
<!-- @convergence position="after" -->
<!-- @role from="Product Manager" to="Product Engineer" description="Owns end-to-end" -->
<!-- @role from="Designer" to="Product Engineer" description="Builds their designs" -->
<!-- @role from="Engineer" to="Product Engineer" description="Shapes the product" -->
<!-- /@convergence -->
```

---

### `@table`

**Inline (variant hint).** Markdown tables are parsed automatically from
standard GFM pipe syntax. To apply a display variant, place a `@table` hint
immediately before the table rows. Without the hint, variant defaults to
`"default"`.

`@table` attributes: `variant` (optional, hint string — e.g. `"striped"`).

```markdown
<!-- @table variant="striped" -->
| Column A | Column B |
|----------|----------|
| Value 1  | Value 2  |
```

---

### `@terminal`

**Paired.** Renders a syntax-highlighted terminal / code panel. Body lines
starting with `- ` or `* ` are converted to bullet `•` prefix. Lines starting
with `<!--` are skipped.

`@terminal` attributes:

| Attribute | Required | Values / default |
|-----------|----------|-----------------|
| `title` | required | panel heading |
| `command` | optional | default `"cat"` |
| `variant` | optional | default `"default"`; `"compact"` is also supported |

```markdown
<!-- @terminal title="API Usage" command="curl" variant="default" -->
- POST /api/v1/generate
- Authorization: Bearer <token>
- Returns: { id, status, result }
<!-- /@terminal -->
```

---

### `@cta`

**Paired.** Renders an accent call-to-action band. The paired body is optional
subtext. Primarily used in the `landing` document type. Buttons carry
`pd-no-print`; the PDF/PNG export prints destination URLs instead of dead
buttons.

`@cta` attributes:

| Attribute | Required | Values / default |
|-----------|----------|-----------------|
| `label` | required | primary button label |
| `href` | required | primary button URL |
| `variant` | optional | `"primary"` (default) \| `"secondary"` |
| `headline` | optional | heading above the button |
| `subtext` | optional | supporting text (alternative to body) |
| `secondaryLabel` | optional | secondary button label |
| `secondaryHref` | optional | secondary button URL |

```markdown
<!-- @cta label="Start free trial" href="https://example.com/signup" variant="primary" headline="Ready to start?" secondaryLabel="Book a demo" secondaryHref="https://example.com/demo" -->
No credit card required. Up and running in minutes.
<!-- /@cta -->
```

---

### Charts and diagrams

Charts and diagrams have their own dedicated reference page.

See [charts-and-diagrams.md](charts-and-diagrams.md) for the full reference:
`@chart` (types: `growth`, `bar`, `hierarchy`, `range`, `pie`, `donut`,
`grouped-bar`, `stacked-bar`, `area`, `line`, `scatter`), `@flow`, `@quadrant`,
and `@mermaid`.

The seven data-driven chart types and the three diagram types (`@flow`,
`@quadrant`, `@mermaid`) work in all three formats (proposal, article, slides).
The four legacy chart types (`growth`, `bar`, `hierarchy`, `range`) are
proposal-only.

---

### `## Citations`

**Not a marker.** Citations are a special `## Citations` section at the end of
the document. The section heading itself triggers parsing — no `@`-marker wrapper
is used. Each line starting with `[N]` becomes one numbered citation.

```markdown
## Citations

[1] Gartner. "Mid-Market Analytics Forecast 2025–2027." Gartner Research, 2025.
[2] Smith, J. "Article Name." Journal Vol 3, 2023. https://example.com
```

---

## Icon names

The `icon=` attribute on `@card` and `@workitem` accepts exactly **25
case-sensitive names**:

`briefcase`, `code`, `rocket`, `palette`, `network`, `graduation`, `lightbulb`,
`chart`, `users`, `shield`, `zap`, `target`, `layers`, `cpu`, `database`,
`arrowRight`, `quote`, `server`, `microphone`, `brain`, `book`, `gitBranch`,
`messageSquare`, `search`, `compass`

Three names are camelCase: `arrowRight`, `gitBranch`, `messageSquare`.

An unknown name renders the dashed-border placeholder glyph and produces an
`unknown-icon` **warning** (not an error) at lint time. The build still completes.

See [../references/icons.md](../references/icons.md) for descriptions and visual
style notes.

---

## Gotchas

> **Common mistakes and how to avoid them**
>
> - **Double-quotes only.** `attr='value'` and `attr=value` are both silently
>   ignored — only `attr="value"` is parsed. If an attribute appears to have no
>   effect, check your quote style.
>
> - **Typo'd marker name = dropped block.** `<!-- @stas -->` is an unknown
>   marker; the linter reports `unknown-marker` and the entire block is dropped.
>   Run `/lint <file>` before building to catch these early.
>
> - **Paired vs inline is fixed.** `@stat` is always inline; `@card` is always
>   paired. Using the wrong form causes `unclosed-block` errors.
>
> - **Proposal-only markers are literal text elsewhere.** A `@stats` block in
>   an article or slides file is rendered as a raw HTML comment. The layout
>   component is never invoked.
>
> - **Placement is positional or keyed.** Charts and tables render where they
>   appear in the file. Cards and worklists use `section=` to locate themselves.
>   If a `section="2"` block appears but the document has no `## 2.` heading, it
>   silently renders nothing.
>
> - **First `@pullquote` doubles as the hero quote.** Only the first one in the
>   file is promoted to the hero position. Later pullquotes are placed inline.
>
> - **`@from` attribute order matters.** `name=` must come before `email=`. The
>   parser reads attributes in source order.
>
> - **Sections need the `## N.` number prefix.** `## The Solution` will not
>   render as a proposal section; `## 2. The Solution` will. The linter emits an
>   `unnumbered-section` warning for bare headings. `## Citations` is the only
>   exempt heading.

# Document Types

A `--type` is a **preset**: it sets a base-format default, a theme default, and
activates type-aware lint rules — all at the *lowest priority*. Any explicit
`--style`, `--slides`, or `--theme` flag (or a value from your config file)
always wins over the type preset.

```
/doc myfile.md --type resume           # preset only
/doc myfile.md --type resume --theme dark   # dark theme overrides the preset
```

Source: `engine/scripts/build-doc.js` — `TYPE_MAP` and `applyTypeDefaults`.

---

## Quick-reference table

| Type | Base format | Default theme | Best for |
|------|-------------|---------------|----------|
| [`resume`](#resume) | proposal | editorial | CVs and curriculum vitae |
| [`case-study`](#case-study) | proposal | editorial | Customer success stories |
| [`changelog`](#changelog) | article | editorial | Release notes (Keep-a-Changelog) |
| [`newsletter`](#newsletter) | article | editorial | Periodic issues and digests |
| [`landing`](#landing) | proposal | brand | Marketing landing pages |
| [`rfp`](#rfp) | proposal | brand | RFP responses and proposals |

> `report` and `one-pager` are **templates, not types** — they are starter files
> in `templates/report.md` and `templates/one-pager.md`. Do not pass
> `--type report` or `--type one-pager`; an unknown `--type` throws an error
> listing the valid names.

Every marker named below — `@timeline`, `@stats`, `@cta`, and the rest — is
documented in [markers.md](markers.md); charts and diagrams live in
[charts-and-diagrams.md](charts-and-diagrams.md).

---

## resume

**Invocation:** `/doc cv.md --type resume`  
**Starter template:** `templates/resume.md`

A compact CV layout. The `--type resume` preset routes through the proposal
pipeline with the editorial theme, then applies a compact-CV render pass that:

- Collapses the hero area to a single condensed header band.
- Forces `@timeline` entries into a single-column stacked layout regardless of
  viewport width.

**Structure:** numbered `## N. Section` headings (proposal format). The key
sections are Summary, Experience (`@timeline`), and Skills.

**Required marker:** `@timeline` (the experience block). The linter emits a
`resume-no-experience` **error** when it is absent.

**Example:**

```markdown
<!-- @header -->
<!-- @title value="Jordan Mercer" -->
<!-- @from name="Jordan Mercer" email="jordan@example.com" -->
<!-- /@header -->

## 1. Summary

Platform engineer with 12 years building reliable distributed systems.

## 2. Experience

<!-- @timeline -->
<!-- @entry year="2022–Present" company="NextCo" title="Staff Engineer" highlight="true" -->
- Led the microservices migration, cutting deploy time 70%.
<!-- /@entry -->
<!-- /@timeline -->
```

**Lint rules:** `resume-no-experience` (error — missing `@timeline`);
`resume-no-header` (warning — missing `@header` with `@from name/email`);
`resume-entry-missing-dates` (warning — `@entry year` has no digit);
`resume-density-warning` (warning — more than 6 entries or 2 card/worklist blocks).

---

## case-study

**Invocation:** `/doc story.md --type case-study`  
**Starter template:** `templates/case-study.md`

A customer success story. Uses the proposal base and editorial theme. The
Results section should lead with hard metrics in a `@stats` block (3–4 `@stat`
entries) and include an attributed customer quote via `@pullquote` or `@quotes`.

**Example:**

```markdown
<!-- @header -->
<!-- @title value="How Acme Reduced Churn by 40%" -->
<!-- @eyebrow value="CASE STUDY" -->
<!-- /@header -->

## 1. Challenge

Acme lost 20% of users per quarter to a competing product.

## 2. Results

<!-- @stats -->
<!-- @stat value="40%" label="Churn reduction" source="Q3 internal data" -->
<!-- @stat value="3 mo" label="Time to value" source="Customer interview" -->
<!-- @stat value="$2M" label="ARR retained" source="Finance" -->
<!-- @stat value="94%" label="NPS (post-launch)" source="Survey, n=120" -->
<!-- /@stats -->

<!-- @pullquote author="VP of Product, Acme" title="Customer" -->
We stopped the bleeding the day we flipped the switch.
<!-- /@pullquote -->
```

**Lint rules:** `case-study-missing-metrics` (warning — no `@stats` block);
`case-study-missing-quote` (warning — no `@pullquote` or `@quotes`);
`case-study-stats-count` (warning — `@stats` has fewer than 3 or more than 4
`@stat` entries); `case-study-quote-attribution` (warning — `@pullquote` has no
`author` attribute).

---

## changelog

**Invocation:** `/doc CHANGELOG.md --type changelog`  
**Starter template:** `templates/changelog.md`

A [Keep-a-Changelog](https://keepachangelog.com)-formatted release log. The
`--type changelog` preset routes through the **article** pipeline (not proposal)
with the editorial theme. Numbered `## N.` section headings are **not** used —
use bare `## <version> — <date>` headings instead.

**Convention:** `## <version> — <date>` for each release (e.g.
`## 1.2.0 — 2026-06-20`); group entries under `### Added`, `### Changed`,
`### Deprecated`, `### Removed`, `### Fixed`, or `### Security`.

> `@cta` and other proposal-only markers (`@stats`, `@timeline`, etc.) are
> **ignored** in the article pipeline — they produce no visible output. Keep
> changelogs to prose, headings, and bullet lists.

**Example:**

```markdown
# Changelog

All notable changes to this project are documented here.

## Unreleased

### Added
- Dark-mode toggle in the sidebar.

## 1.2.0 — 2026-06-20

### Fixed
- Tab order on the settings panel was reversed.

### Changed
- Upgraded React to 19.1.
```

**Lint rules:** `changelog-no-releases` (**error** — no versioned `## <version>`
heading found); `changelog-section-not-versioned` (warning — `## Section` has
no version number); `changelog-unknown-group` (warning — `### Group` is not one
of the six Keep-a-Changelog groups); `changelog-empty-release` (warning — a
versioned section has no bullets or sub-headings).

---

## newsletter

**Invocation:** `/doc issue-7.md --type newsletter`  
**Starter template:** `templates/newsletter.md`

A periodic issue or digest. Uses the **article** pipeline with the editorial
theme. The masthead is an `@header` block containing `@brand` (publication
name), `@brandsub` (issue label such as "Issue 7"), and `@date`.

> `@cta`, `@stats`, `@timeline`, and other proposal-only markers are **ignored**
> in the article pipeline — they do not render in newsletters or changelogs.

**Example:**

```markdown
<!-- @header -->
<!-- @brand value="The Weekly Build" -->
<!-- @brandsub value="Issue 7" -->
<!-- @date value="June 2026" -->
<!-- /@header -->

## In This Issue

- New `--type` presets
- Theming tips
- Upcoming webinar

## What's New in Portable Docs

`--type` presets ship in v0.6. Pick a type and get sensible defaults instantly.

## Theming Tips

Use `--theme dark` for high-contrast presentations.
```

**Lint rules:** `newsletter-no-issue` (warning — `@header` has no `@brandsub`
or `@eyebrow` for the issue label); `newsletter-no-date` (warning — no `@date`
in the masthead); `newsletter-thin` (warning — fewer than 2 `## Section`
headings).

---

## landing

**Invocation:** `/doc product.md --type landing`  
**Starter template:** `templates/landing.md`

A marketing landing page. Uses the proposal base and the **brand** theme
(accent-color-forward, your brand palette). The `@cta` call-to-action band is
the defining element — it is a **proposal-only** marker and renders only in
types that use the proposal base (`landing`, `rfp`, `resume`, `case-study`).

**Example:**

```markdown
<!-- @header -->
<!-- @eyebrow value="ALERTING, REIMAGINED" -->
<!-- @title value="Beacon" -->
<!-- @subtitle value="From alert noise to signal in one pane." -->
<!-- /@header -->

## 1. Why Beacon

<!-- @cards type="feature" columns="3" section="1" label="What you get" -->
<!-- @card icon="target" title="Impact-Ranked Feed" -->Highest-impact signal surfaces first.<!-- /@card -->
<!-- @card icon="zap" title="One-Click Routing" -->Acknowledge in one action.<!-- /@card -->
<!-- @card icon="shield" title="Audit Trail" -->Every decision logged automatically.<!-- /@card -->
<!-- /@cards -->

<!-- @cta headline="Stop drowning in alert noise" label="Start free trial" href="https://example.com/signup" variant="primary" secondaryLabel="Book a demo" secondaryHref="https://example.com/demo" -->
No credit card required.
<!-- /@cta -->
```

**Lint rules:** `landing-no-cta` (warning — no `@cta` block found);
`landing-no-hero` (warning — no `@header` block found).

---

## rfp

**Invocation:** `/doc response.md --type rfp`  
**Starter template:** `templates/rfp.md`

An RFP response. Uses the proposal base and the **brand** theme. Readers expect
a predictable backbone: scope, requirements, timeline, pricing, and terms as
numbered sections. Compliance matrices use a Markdown GFM table with a column
whose header contains "compliance", "status", "meets", or "support" — cell
values are badged when they are `✓`, `✔`, `yes`, `✗`, `✘`, or `no`.

**Example:**

```markdown
<!-- @header -->
<!-- @title value="Response to RFP-2026-047" -->
<!-- @eyebrow value="CONFIDENTIAL" -->
<!-- @brand value="Crestline Systems" -->
<!-- @date value="June 2026" -->
<!-- /@header -->

## 1. Scope of Work

We will deliver a fully managed alerting platform in three phases.

## 2. Pricing

<!-- @stats -->
<!-- @stat value="$4,800/mo" label="Starter tier (≤10 users)" source="Crestline pricing sheet" -->
<!-- @stat value="$9,600/mo" label="Growth tier (≤50 users)" source="Crestline pricing sheet" -->
<!-- /@stats -->

## 3. Compliance

| Requirement | Meets |
|-------------|-------|
| SOC 2 Type II | ✓ |
| GDPR data residency | ✓ |
| On-prem deployment | ✗ |
```

**Lint rules:** `rfp-missing-section` (warning — no heading matching
scope/requirements/timeline/pricing/terms); `rfp-matrix-checkmark` (warning —
compliance cell is not a recognized badge token); `rfp-pricing-no-table`
(warning — pricing section has no table or `@stats` block).

---

## Priority and overrides

`--type` is always the lowest-priority default. The full resolution order for
base format and theme is:

1. Explicit CLI flag (`--style article`, `--theme dark`, `--slides`)
2. Environment variable (`PD_THEME`, etc.)
3. `portable-docs.config.json` brand-kit entry
4. `--type` preset ← **lowest**

This means you can use a type for its lint rules while overriding its visual
defaults:

```
/doc cv.md --type resume --theme dark
/doc notes.md --type changelog --style proposal   # opt out of article pipeline
```

See [formats.md](formats.md) for a full description of each base format, and
[theming-and-branding.md](theming-and-branding.md) for theme and accent options.

---

← Back to the [guide index](README.md).

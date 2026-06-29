# How portable-docs works

portable-docs turns a Markdown file into a single, self-contained HTML document
that renders offline — no server, no CDN, no `npm install` at view time.
This page explains the pipeline and the guarantees it makes.

---

## Core concepts

| Concept | What it is | Learn more |
|---------|-----------|-----------|
| **Format** | The layout pipeline: `proposal` (default), `article`, or `slides` | [formats.md](formats.md) |
| **Type** | A preset that bundles a default format, a default theme, and a lint profile — e.g. `--type resume` | [document-types.md](document-types.md) |
| **Marker** | An `@`-prefixed component directive embedded in the Markdown — e.g. `@cta`, `@stats`, `@mermaid` | [markers.md](markers.md) |
| **Theme** | A color palette applied at build time: `vanderbilt` (default), `editorial`, `dark`, or `brand` | [theming-and-branding.md](theming-and-branding.md) |

---

## The pipeline, end to end

Each `pd build` run (or `pd open`) runs these steps in order:

1. **Read** — load the `.md` source file from disk.

2. **Lint** — check the Markdown against the active format's rules (error
   counts are printed to stderr; `--strict` aborts on errors).

3. **Route by format** — decide which layout pipeline to use:
   - `--slides` → slide-deck pipeline *(takes priority over everything else;
     if `--slides` and `--style article` are both passed, slides wins)*
   - `--style article` → long-form article pipeline
   - anything else → proposal pipeline (the default)
   
   `--type <name>` applies the type's base format and theme as the
   *lowest-priority* defaults; an explicit flag, env var, or config file
   always overrides them.

4. **Mermaid pre-render** — any `@mermaid` blocks are rendered to SVG by a
   headless browser at build time. The resulting `<svg>` elements are spliced
   back into the Markdown source as sentinels. Mermaid itself never ships in
   the output.

5. **Parse** — the Markdown (with SVG sentinels) is parsed into a plain
   JavaScript content object. No JSX is produced here; the parser only
   identifies sections, markers, and metadata.

6. **Inline local images** — every local image path found in the content object
   is read and replaced with a `data:` base64 URI so the output has no external
   file dependencies. Remote URLs (`http://` / `https://`) are left as-is
   (see [self-contained guarantee](#the-self-contained--offline-guarantee) below).

7. **Bundle to JSX** — all components, the content object, and the design
   tokens are concatenated into a single JSX file. Theme and accent color are
   injected as **build-time string literals** here — the bundle contains no
   `process.env` references.

8. **Wrap to HTML** — the JSX bundle goes through four sub-steps:
   - Strip ESM `import`/`export` lines (the output uses UMD globals).
   - Inline the React and ReactDOM production UMD scripts directly into the
     `<script>` blocks — no CDN link.
   - Precompile all JSX to `React.createElement(...)` calls using the
     **classic runtime** (vendored `@babel/standalone`, run in Node at build
     time; Babel itself never ships in the output).
   - Write the finished HTML file.

9. **Validate** — a static "never-blank gate" reads the HTML file and asserts
   the offline-render invariants (see below). If validation fails the build
   aborts with an error.

10. **Open** — the HTML file is opened in the system browser (pass `--no-open`
    to skip).

---

## The self-contained / offline guarantee

A finished portable-doc is a **single `.html` file** with no runtime
dependencies:

- **Ships in every output:** React 18.3.1 UMD (`react.production.min.js`) and
  ReactDOM 18.3.1 UMD (`react-dom.production.min.js`) are inlined verbatim.
- **Build-only, never shipped:**
  - `@babel/standalone` 7.26.4 — used during step 8 to compile JSX in Node;
    the compiled plain JS is what lands in the HTML.
  - Mermaid v11.4.1 — used during step 4 in the headless browser; only the
    rendered `<svg>` elements are inlined.
- **Caveat:** local images become base64 data URIs (offline-safe), but
  **remote image URLs are kept as references** — a document that links to
  `https://` images will still reach the network when viewed.

---

## The "never blank" guarantee

Three mechanisms work together to ensure the document renders rather than
showing a blank page:

1. **Classic JSX runtime** — JSX is compiled to `React.createElement(...)`,
   not to `import { jsx } from 'react/jsx-runtime'`. There is no module import
   for the browser to attempt (and potentially 404 on when the file is opened
   via `file://`).

2. **No `process.env` in the bundle** — theme and accent are replaced with
   string literals at build time, so the browser never encounters a Node
   runtime reference.

3. **Static validator** — after wrapping, the validator asserts:
   - React and ReactDOM UMD banners are present (inlined, not CDN).
   - `ReactDOM.createRoot` call is present.
   - `.render(` call is present.
   - `<div id="root"` mount point is present.
   - No `unpkg.com` CDN reference.
   - No `@babel/standalone` (in-browser compile forbidden).
   - No `type="text/babel"` script tag.
   - No `import React` ESM leak.
   - No `react/jsx-runtime` ESM leak.

> **Note:** the validator is a *structural* check — it reads the HTML source.
> It cannot catch a runtime bug inside a component (a component that throws
> during render can still produce a blank page). The guarantee is that the
> offline wiring is correct.

---

[Back to README](README.md)

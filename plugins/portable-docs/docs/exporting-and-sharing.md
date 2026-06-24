# Exporting and Sharing

Export a built HTML document to PDF or PNG, and publish it to a public URL.
Back to the [guide index](README.md).

---

## Exporting to PDF and PNG

### The `/export` command

```
/export <file.html> [--pdf] [--png] [--out <dir>]
```

`/export` renders an already-built portable-docs HTML file using a local headless
browser. No network is needed; no npm dependencies are involved.

You can also trigger export at build time by adding `--pdf` or `--png` to `/doc`
or `/slides`.

### What gets produced

| Format | PDF | PNG |
|--------|-----|-----|
| Proposals / articles | Full-page PDF (all content) | Full-page PNG (CDP full-scroll capture) |
| Slides | Landscape PDF, one slide per page | Hero PNG of the title slide only |

When neither `--pdf` nor `--png` is passed, **both are produced**.

Output files are written alongside the HTML unless `--out <dir>` specifies a
directory. The base name is reused: `report.html` becomes `report.pdf` and
`report.png`.

### Browser detection

portable-docs drives a browser you already have installed. On **Windows**, Edge
is tried first; Chrome and Chromium follow as fallbacks. On macOS, Chrome is
first, then Edge, then Chromium. On Linux, `google-chrome`, `google-chrome-stable`,
`chromium`, `chromium-browser`, and `microsoft-edge` are probed in that order.

Pin a specific executable by setting the `PD_BROWSER` environment variable to its
full path:

```
PD_BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe" /export report.html
```

### Node version requirements

- **Proposals and articles** — PDF and full-page PNG are captured via Chrome DevTools
  Protocol (CDP), which requires Node's global `WebSocket` (available from **Node 22+**).
  On older Node, these captures are skipped with a warning.
- **Slides** — the title-slide PNG uses a simple browser screenshot that works on
  **any Node ≥ 18**. The slides PDF is also CDP-based and needs Node 22+.

### What the print stylesheet does

When exporting (or when the user prints from a browser), the `@media print` styles
automatically:

- **Hide on-screen chrome** via the `pd-no-print` class: the reading-progress bar,
  the section-nav panel, heading anchor links, and copy-code buttons all disappear.
- **Expand collapsed cards** — elements with `pd-collapsible` are forced to full
  height so no content is truncated.
- **Preserve page-break integrity** — cards, figures, blockquotes, stats, and
  testimonials carry `break-inside: avoid`.
- **Force color fidelity** — `print-color-adjust: exact` keeps backgrounds and
  accent colors in print.

### No-browser fallback

If no supported browser is found, `/export` prints guidance and exits cleanly. It
never crashes or leaves partial output. The fallback workflow is:

1. Open the HTML in any browser.
2. Choose **File → Print** (or press `Ctrl+P` / `Cmd+P`).
3. Select **Save as PDF** as the destination.

---

## Viewer affordances (baked into every built doc)

Every portable-docs HTML file ships with interactive affordances that are hidden in
print via `pd-no-print`. These require no external dependencies and work offline.

### Reading-progress bar

Proposals and articles display a thin progress bar that tracks scroll position.
Slides do not include the bar. Hidden in print.

### Section navigation panel

A floating side panel lists every numbered section (`## N. Title`) and highlights
the current section as the reader scrolls. The panel is **visible only on desktop
viewports ≥ 1280 px wide** and hidden on narrower screens and in print.

### Heading deep-links

Hover over any section heading to reveal a link icon (`#`). Click it to copy a
`#slug` URL directly to the current section. The slug is derived from the heading
text (lowercase, trimmed, spaces to hyphens). Hidden in print.

### Copy-code buttons

`@terminal` blocks and fenced code blocks display a **Copy code** button in the
top-right corner. Clicking it writes the block's contents to the clipboard via
`navigator.clipboard`. Hidden in print.

### Slide navigation (slide decks only)

Slide decks include keyboard navigation (arrow keys / space) and dot-indicator
navigation. These controls are part of the slide layout and do not appear in
proposals or articles.

---

## Sharing a document publicly

### The `/share` command

```
/share <file.html>
```

`/share` publishes a built HTML file to a public URL. The file is published
**publicly on the internet** — confirm this is intentional before running the
command, especially for documents containing sensitive or draft content.

### Deployer priority

| Priority | Tool | Method |
|----------|------|--------|
| 1 | `gh` (GitHub CLI, authenticated) | Creates a **public GitHub Gist**; prints both the Gist view URL and a raw URL for direct browser rendering |
| 2 | `vercel` CLI | Runs `vercel deploy --prod` on the file's directory; prints the deployed URL |
| 3 | Neither found | Prints step-by-step install instructions for `gh` and `vercel`; exits cleanly (nothing is uploaded) |

### GitHub Gist output

When `gh` is available and authenticated, `/share` reports two URLs:

- **Gist view URL** — the GitHub Gist page (`gist.github.com/…`)
- **Raw URL** — direct HTML rendering in a browser (`gist.githubusercontent.com/…/raw/…`)

Open the raw URL in a browser to view the rendered document. Gist content may be
cached or indexed by search engines once public.

### Installing a deployer

**GitHub CLI (recommended):**

```
# Windows
winget install GitHub.cli

# macOS
brew install gh

# Authenticate
gh auth login
```

**Vercel CLI:**

```
npm install -g vercel
vercel login
```

---

## Related pages

- [commands-and-cli.md](commands-and-cli.md) — full flag reference for `/doc`, `/export`, and `/share`
- [formats.md](formats.md) — format differences that affect export output
- [how-it-works.md](how-it-works.md) — engine internals and the self-contained HTML guarantee

---

← Back to the [guide index](README.md).

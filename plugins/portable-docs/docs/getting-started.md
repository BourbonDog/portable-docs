# Getting Started

portable-docs turns a Markdown file into a polished, self-contained HTML document — one command, no build server, no runtime dependencies.

---

## Install

```
/plugin marketplace add BourbonDog/portable-docs
```

```
/plugin install portable-docs@portable-docs
```

Requires Node.js 18 or later. Run `node --version` to check.

---

## What you need

- A Markdown file (or a few lines of inline notes).
- The plugin does the rest.

---

## Your first document in 60 seconds

Create `first.md` with this content:

```markdown
<!-- @header -->
<!-- @title value="My First Doc" -->
<!-- @subtitle value="Built with portable-docs" -->
<!-- @from name="Your Name" email="you@example.com" -->
<!-- /@header -->

## 1. Why this exists

portable-docs turns Markdown into a single, shareable HTML file.

<!-- @stats -->
<!-- @stat value="1" label="Command" source="that's it" -->
<!-- @stat value="0" label="Runtime deps" source="self-contained" -->
<!-- /@stats -->
```

Then run:

```
/doc first.md
```

It opens in your browser. The file is saved to `~/Documents/portable-docs/first.html`.

---

## Where output goes

By default every build writes to `~/Documents/portable-docs/<slug>.html`.

- Override for one run: `--out ~/Desktop/my-doc.html`
- Override globally: set `PORTABLE_DOCS_OUT` in your environment or add `"outputDir"` to your config file.

See [commands-and-cli.md](commands-and-cli.md) for the full flag reference and [theming-and-branding.md](theming-and-branding.md#output-location) for config-file options.

---

## The edit-build loop

- Edit your `.md` file, then re-run `/doc` to rebuild.
- For live preview, use `/watch` — it rebuilds on every save and auto-refreshes the browser tab:

  ```
  /watch first.md
  ```

See [commands-and-cli.md#watch](commands-and-cli.md#watch) and [authoring-workflow.md](authoring-workflow.md) for tips on structuring a document as you write.

---

## Next steps

- [formats.md](formats.md) — proposals, articles, and slide decks
- [markers.md](markers.md) — the full `@`-marker DSL reference
- [how-it-works.md](how-it-works.md) — engine internals and the "never blank" guarantee

---

← Back to the [guide index](README.md).

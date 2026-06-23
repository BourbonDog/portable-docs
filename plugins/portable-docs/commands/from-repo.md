---
description: Scan a codebase and build a polished HTML overview (deck or long-form article)
argument-hint: [path] [--style article] [--theme editorial|dark|brand] [--jsx]
---

Scan the codebase at the path in `$ARGUMENTS` (or the current working directory if omitted), draft a concise recap markdown, then build it with the portable-docs engine.

## Step 1 — Identify the target directory

Parse `$ARGUMENTS`. If a path is provided use that; otherwise use the current working directory. Extract any `--style`/`--theme`/`--jsx` flags the user passed.

## Step 2 — Scan the codebase (agent-authored draft)

**You draft the markdown.** Do not ask the user to supply content — read the repo yourself.

Collect and write up:

- **Architecture overview** — top-level directory structure, main entry points, key layers (API, data, UI, etc.).
- **Key modules** — what each major package/folder does in one sentence.
- **Tech stack** — languages, frameworks, notable dependencies (read `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, etc.).
- **Recent changes** — last 5–10 git commits (`git log --oneline -10`) summarized as a "What's new" section.
- **How to run** — if a `README`, `Makefile`, or `package.json` scripts section is present, extract the start/test/build commands.

Keep the draft concise — aim for a document a new team member would want to read in 5 minutes.

## Step 3 — Choose output format

Default recommendation: **slide deck** (`--slides`) — a codebase recap reads well as a navigable deck (Architecture / Key Modules / Tech Stack / Recent Changes / How to Run).

The user may override with `--style article` for a long-form document if they passed that flag.

## Step 4 — Write the input markdown

Save the drafted content to `_repo-recap.md` (or a descriptive name) in the repo root (or a safe temp path). Apply the format markup from SKILL.md:

- Slides: separate sections with `---`; add a `<!-- @header -->` title slide with `@title` = repo name, `@subtitle` = one-line description.
- Article: use `# Title`, `*subtitle*`, `## Section` headings; add `<!-- @header -->` for a full-bleed cover.

## Step 5 — Build

Check Node ≥ 18, then invoke:

**Option A — slide deck (default, recommended for codebase recaps):**

```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input _repo-recap.md \
  --out path/to/repo-recap.html \
  --slides \
  --theme dark \
  [--jsx]
```

**Option B — long-form article (when the user passed `--style article`):**

```bash
node "$CLAUDE_PLUGIN_ROOT/engine/scripts/build-doc.js" \
  --input _repo-recap.md \
  --out path/to/repo-recap.html \
  --style article \
  --theme editorial \
  [--jsx]
```

> `--slides` and `--style article` are **mutually exclusive** — `--slides` wins if both are present. Use one or the other, never both.

Use Option A by default. Switch to Option B only when the user explicitly passes `--style article`. If the user passed an explicit `--theme`, use that in place of the default theme shown above.

The engine opens the result in the browser on success and prints the output path.

## Step 6 — Report back

Tell the user:
- The output file path.
- Format and theme used.
- The sections covered in the recap.
- Offer to add/remove sections or rebuild with a different format or theme.

---
description: Run a self-test to verify that the portable-docs engine is correctly installed and working on this machine
---

Run the portable-docs self-test (`doctor.sh`) and report the result.

## What it checks

1. **Node >= 18** is installed and on PATH.
2. **`build-doc.js` exists** at the expected engine path.
3. **Proposal build** — builds `sample.md` through the default (proposal) pipeline and validates the HTML output.
3b. **Lint** — runs the marker linter over `sample.md` and confirms it is clean (no errors).
3c. **Data-driven chart build** — builds `charts-doctor.md` (a pie chart from inline CSV) and confirms the output contains inline SVG.
4. **Article build** — builds `sample-article.md` through the `--style article` pipeline (if the fixture exists).
5. **Slides build** — builds `sample-slides.md` through the `--slides` pipeline (if the fixture exists).

Each check prints `PASS` or `FAIL`. The script exits non-zero if any check fails.

## Step 1 — Run the doctor script

```bash
bash "$CLAUDE_PLUGIN_ROOT/scripts/doctor.sh"
```

Do **not** add `--no-open` or any other flags — the script manages everything internally.

## Step 2 — Report the result

- If all checks print `PASS` and the exit code is 0: tell the user the engine is healthy and summarize what was tested.
- If any check prints `FAIL`: show the full output and explain the likely cause (e.g. Node version too old, engine path mismatch, fixture missing). Offer to help resolve it.
- If the script itself is not found: verify that `$CLAUDE_PLUGIN_ROOT` is set correctly and that the plugin was installed from the correct path.

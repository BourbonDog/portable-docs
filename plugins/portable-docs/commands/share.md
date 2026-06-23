---
description: Publish a portable-docs HTML file to a public URL (best-effort; requires gh or vercel CLI)
argument-hint: <html-file>
---

Deploy `$ARGUMENTS` (an HTML file previously built by `/doc`) to a public URL using the best available deployer.

> **Privacy notice:** the HTML file is published **publicly** on the internet. Only share documents the user intends to make public.

> **Optional / best-effort:** this command requires either the GitHub CLI (`gh`) or the Vercel CLI (`vercel`) to be installed and authenticated. If neither is available, `/share` **prints step-by-step install instructions and exits cleanly — no file is uploaded, nothing is shared**. The user is not left wondering whether their document was published.

## Deployer priority

| Priority | Tool | Method |
|----------|------|--------|
| 1 | `gh` (GitHub CLI, authed) | Creates a **public GitHub Gist** from the HTML file |
| 2 | `vercel` CLI | Runs `vercel deploy --prod` on the file's directory |
| 3 | Neither available | Prints install instructions; exits 0 |

## Step 1 — Resolve the HTML file path

`$ARGUMENTS` is the path to an HTML file (output of `/doc` or `/slides`). If the user passed a relative path, resolve it to an absolute path before passing it to the script.

## Step 2 — Warn the user

Before deploying, confirm with the user that the file may be shared publicly if the content is sensitive. If the user has already expressed intent to share (e.g. "share this publicly"), skip the confirmation.

## Step 3 — Run the share script

```bash
bash "$CLAUDE_PLUGIN_ROOT/scripts/share.sh" "<resolved-html-file>"
```

## Step 4 — Report back

- **GitHub Gist path:** tell the user both the Gist view URL and the raw URL. Explain that the raw URL renders the HTML directly in the browser.
- **Vercel path:** tell the user the deployment URL.
- **No deployer path:** show the script's install instructions and offer to help them install `gh` (`winget install GitHub.cli` on Windows, `brew install gh` on macOS).
- **Error path:** show the full output and help debug (auth issues, network, etc.).

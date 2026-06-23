#!/usr/bin/env bash
# share.sh — best-effort deploy of a portable-docs HTML file to a public URL.
#
# Deployer priority:
#   1. gh (GitHub CLI, authed) → publish as a GitHub Gist (single-file, public)
#   2. vercel CLI              → vercel deploy --prod (static site)
#   3. Neither available       → friendly instructions, exit 0
#
# Usage:
#   bash plugins/portable-docs/scripts/share.sh path/to/output.html
#   # or from the harness:
#   bash "$CLAUDE_PLUGIN_ROOT/scripts/share.sh" "$1"
#
# WARNING: the HTML file is published PUBLICLY on the internet.

set -euo pipefail

# ── Argument validation ───────────────────────────────────────────────────────
if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "share: usage: share.sh <path-to-html-file>"
  echo "       Example: bash scripts/share.sh output/my-doc.html"
  exit 1
fi

HTML_FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"

if [ ! -f "$HTML_FILE" ]; then
  echo "share: file not found: $HTML_FILE"
  exit 1
fi

FILENAME="$(basename "$HTML_FILE")"
echo ""
echo "portable-docs share"
echo "==================="
echo ""
echo "File  : $HTML_FILE"
echo "Note  : This file will be published PUBLICLY on the internet."
echo ""

# ── Deployer 1: GitHub CLI gist ───────────────────────────────────────────────
if command -v gh >/dev/null 2>&1; then
  # Verify auth without network if possible; fall through on any error.
  if gh auth status >/dev/null 2>&1; then
    echo "Deployer: GitHub CLI (gh gist)"
    echo "Creating public gist..."

    # Create a public gist with the HTML file; capture the output URL.
    # Use grep to extract the URL rather than blindly taking the last line —
    # that avoids capturing a progress/status/error line as the URL.
    # The || true prevents set -e from aborting when gh fails or grep matches nothing.
    GIST_URL="$(gh gist create --public --filename "$FILENAME" "$HTML_FILE" 2>/dev/null \
      | grep -Eo 'https://[^[:space:]]+' | tail -1 || true)"

    if [ -n "$GIST_URL" ]; then
      # Gist raw URL for direct browser rendering:
      # https://gist.github.com/<user>/<id>  (gist view URL)
      # For rendered HTML, the raw URL is:
      # https://gist.githubusercontent.com/<user>/<id>/raw/<filename>
      # gh gist create prints the gist *view* URL; derive the raw URL from it.
      RAW_URL="${GIST_URL/gist.github.com/gist.githubusercontent.com}/raw/$FILENAME"
      echo ""
      echo "  Gist URL (view)  : $GIST_URL"
      echo "  Raw URL (render) : $RAW_URL"
      echo ""
      echo "Open the raw URL in a browser to view the rendered HTML."
      echo "DONE"
      exit 0
    else
      echo "share: gh gist create did not return a URL — check your auth or network."
      echo "       Falling through to next deployer."
    fi
  else
    echo "share: gh is installed but not authenticated (run: gh auth login)."
    echo "       Falling through to next deployer."
  fi
fi

# ── Deployer 2: Vercel CLI ────────────────────────────────────────────────────
if command -v vercel >/dev/null 2>&1; then
  echo "Deployer: Vercel CLI"
  HTML_DIR="$(dirname "$HTML_FILE")"
  echo "Deploying directory: $HTML_DIR"
  echo ""

  # vercel deploy in prod mode; let it stream output.
  # --yes accepts prompts non-interactively (no hanging).
  # grep + || true: if vercel fails or outputs no https:// line, DEPLOY_URL is
  # empty rather than causing set -e to abort before our friendly-failure check.
  DEPLOY_URL="$(vercel deploy --prod --yes "$HTML_DIR" 2>/dev/null \
    | grep -Eo '^https://[^[:space:]]+' | tail -1 || true)"

  if [ -n "$DEPLOY_URL" ]; then
    echo ""
    echo "  Deployed URL: $DEPLOY_URL"
    echo ""
    echo "DONE"
    exit 0
  else
    echo "share: vercel deploy did not return a URL."
    echo "       Check vercel output above for errors."
    exit 1
  fi
fi

# ── No deployer available ─────────────────────────────────────────────────────
echo "No deployer found. To share your HTML file publicly, install one of:"
echo ""
echo "  Option 1 — GitHub CLI (recommended):"
echo "    Windows : winget install GitHub.cli"
echo "    macOS   : brew install gh"
echo "    Linux   : https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
echo "    Then run: gh auth login"
echo ""
echo "  Option 2 — Vercel CLI:"
echo "    npm install -g vercel"
echo "    Then run: vercel login"
echo ""
echo "After installing, re-run:"
echo "  bash \"$0\" \"$HTML_FILE\""
echo ""
# Exit 0 — no deployer is not an error; the file built fine.
exit 0

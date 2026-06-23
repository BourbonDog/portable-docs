#!/usr/bin/env bash
# doctor.sh — portable-docs self-test
# Verifies that Node >= 18 is present and that the engine can build each
# fixture format (proposal, article, slides).  Prints PASS/FAIL per check
# and exits non-zero if any check fails.
#
# Usage:
#   bash plugins/portable-docs/scripts/doctor.sh
#   # or, when $CLAUDE_PLUGIN_ROOT is set by the harness:
#   bash "$CLAUDE_PLUGIN_ROOT/scripts/doctor.sh"

set -euo pipefail

# ── Path resolution ───────────────────────────────────────────────────────────
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  ENGINE="$CLAUDE_PLUGIN_ROOT/engine"
else
  ENGINE="$DIR/../engine"
fi
BUILD="$ENGINE/scripts/build-doc.js"
FIXTURES="$ENGINE/test/fixtures"

# ── Helpers ───────────────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0

pass() { echo "  PASS  $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "  FAIL  $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

run_check() {
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    pass "$label"
  else
    fail "$label"
  fi
}

# ── Check 1: Node is installed ────────────────────────────────────────────────
echo ""
echo "portable-docs doctor"
echo "===================="
echo ""
echo "Paths:"
echo "  engine   : $ENGINE"
echo "  build    : $BUILD"
echo "  fixtures : $FIXTURES"
echo ""
echo "Checks:"

if ! command -v node >/dev/null 2>&1; then
  echo "  FAIL  Node.js not found"
  echo "        Install Node 18+ from https://nodejs.org and re-run."
  echo ""
  echo "Summary: 0 passed, 1 failed"
  exit 1
fi

NODE_VERSION="$(node --version 2>/dev/null | sed 's/v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"

# Guard: ensure NODE_MAJOR is a plain integer before numeric comparison.
# An empty or non-numeric value (e.g. if --version output is unexpected)
# must not cause an arithmetic error under set -euo pipefail.
if [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && [ "$NODE_MAJOR" -ge 18 ]; then
  pass "Node >= 18  (found v${NODE_VERSION})"
else
  fail "Node >= 18  (found v${NODE_VERSION} — upgrade required)"
fi

# ── Check 2: engine/scripts/build-doc.js exists ───────────────────────────────
if [ -f "$BUILD" ]; then
  pass "build-doc.js exists"
else
  fail "build-doc.js not found at $BUILD"
  echo ""
  echo "Summary: $PASS_COUNT passed, $FAIL_COUNT failed"
  exit 1
fi

# ── Check 3: proposal fixture (default style) ─────────────────────────────────
SAMPLE_MD="$FIXTURES/sample.md"
if [ -f "$SAMPLE_MD" ]; then
  TMP_PROPOSAL="$(mktemp -d)"
  OUT_PROPOSAL="$TMP_PROPOSAL/out.html"
  if node "$BUILD" --input "$SAMPLE_MD" --out "$OUT_PROPOSAL" --no-open >/dev/null 2>&1; then
    pass "build proposal  (sample.md)"
  else
    fail "build proposal  (sample.md)"
  fi
  rm -rf "$TMP_PROPOSAL"
else
  fail "build proposal  (sample.md not found at $SAMPLE_MD)"
fi

# ── Check 3b: proposal fixture lints clean ────────────────────────────────────
if [ -f "$SAMPLE_MD" ]; then
  if node "$BUILD" --input "$SAMPLE_MD" --lint --no-config >/dev/null 2>&1; then
    pass "lint proposal   (sample.md clean)"
  else
    fail "lint proposal   (sample.md has lint errors)"
  fi
fi

# ── Check 4: article fixture ──────────────────────────────────────────────────
SAMPLE_ARTICLE="$FIXTURES/sample-article.md"
if [ -f "$SAMPLE_ARTICLE" ]; then
  TMP_ARTICLE="$(mktemp -d)"
  OUT_ARTICLE="$TMP_ARTICLE/out.html"
  if node "$BUILD" --input "$SAMPLE_ARTICLE" --out "$OUT_ARTICLE" --style article --no-open >/dev/null 2>&1; then
    pass "build article   (sample-article.md)"
  else
    fail "build article   (sample-article.md)"
  fi
  rm -rf "$TMP_ARTICLE"
else
  echo "  SKIP  build article   (sample-article.md not found — optional)"
fi

# ── Check 5: slides fixture ───────────────────────────────────────────────────
SAMPLE_SLIDES="$FIXTURES/sample-slides.md"
if [ -f "$SAMPLE_SLIDES" ]; then
  TMP_SLIDES="$(mktemp -d)"
  OUT_SLIDES="$TMP_SLIDES/out.html"
  if node "$BUILD" --input "$SAMPLE_SLIDES" --out "$OUT_SLIDES" --slides --no-open >/dev/null 2>&1; then
    pass "build slides    (sample-slides.md)"
  else
    fail "build slides    (sample-slides.md)"
  fi
  rm -rf "$TMP_SLIDES"
else
  echo "  SKIP  build slides    (sample-slides.md not found — optional)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "Summary: $PASS_COUNT passed, $FAIL_COUNT failed"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "One or more checks FAILED. See above for details."
  exit 1
fi

echo "All checks PASSED. portable-docs is healthy."
exit 0

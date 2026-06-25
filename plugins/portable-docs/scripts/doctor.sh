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

# ── Check 6: data-driven chart fixture builds ─────────────────────────────────
CHARTS_MD="$FIXTURES/charts-doctor.md"
if [ -f "$CHARTS_MD" ]; then
  TMP_CHARTS="$(mktemp -d)"
  OUT_CHARTS="$TMP_CHARTS/out.html"
  if node "$BUILD" --input "$CHARTS_MD" --out "$OUT_CHARTS" --no-open >/dev/null 2>&1 \
     && grep -q "<svg" "$OUT_CHARTS"; then
    pass "build charts    (charts-doctor.md)"
  else
    fail "build charts    (charts-doctor.md)"
  fi
  rm -rf "$TMP_CHARTS"
else
  echo "  SKIP  build charts    (charts-doctor.md not found — optional)"
fi

# ── Check 7: quadrant fixture builds (no browser needed) ──────────────────────
QUAD_MD="$FIXTURES/quadrant-doctor.md"
if [ -f "$QUAD_MD" ]; then
  TMP_QUAD="$(mktemp -d)"
  OUT_QUAD="$TMP_QUAD/out.html"
  if node "$BUILD" --input "$QUAD_MD" --out "$OUT_QUAD" --no-open >/dev/null 2>&1 \
     && grep -q "Self-test Quadrant" "$OUT_QUAD"; then
    pass "build quadrant  (quadrant-doctor.md)"
  else
    fail "build quadrant  (quadrant-doctor.md)"
  fi
  rm -rf "$TMP_QUAD"
else
  echo "  SKIP  build quadrant  (quadrant-doctor.md not found — optional)"
fi

# ── Check 8: mermaid renders to SVG when a browser is present (else SKIP) ──────
MMD_MD="$FIXTURES/mermaid-doctor.md"
if [ -f "$MMD_MD" ]; then
  TMP_MMD="$(mktemp -d)"
  OUT_MMD="$TMP_MMD/out.html"
  node "$BUILD" --input "$MMD_MD" --out "$OUT_MMD" --no-open >/dev/null 2>&1 || true
  if [ -f "$OUT_MMD" ] && grep -q "</svg>" "$OUT_MMD"; then
    pass "build mermaid   (mermaid-doctor.md → inline SVG)"
  else
    echo "  SKIP  build mermaid   (no headless browser — @mermaid degraded to a code block)"
  fi
  rm -rf "$TMP_MMD"
else
  echo "  SKIP  build mermaid   (mermaid-doctor.md not found — optional)"
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

# ── Phase 5a type-template checks ────────────────────────────────────────────
# For each --type introduced in Phase 5a, build its starter template and assert
# the output is a valid HTML document (<!DOCTYPE html).  For the landing type,
# also assert the @cta block rendered its href (proves CTA component executed).

TEMPLATES="$DIR/../templates"

for TYPE in resume case-study changelog newsletter rfp; do
  TMPL="$TEMPLATES/${TYPE}.md"
  if [ -f "$TMPL" ]; then
    TMP_TYPE="$(mktemp -d)"
    OUT_TYPE="$TMP_TYPE/out.html"
    if node "$BUILD" --input "$TMPL" --type "$TYPE" --no-open --no-config --out "$OUT_TYPE" >/dev/null 2>&1 \
       && grep -q "<!DOCTYPE html" "$OUT_TYPE"; then
      pass "build type:${TYPE}  (${TYPE}.md → HTML)"
    else
      fail "build type:${TYPE}  (${TYPE}.md)"
    fi
    rm -rf "$TMP_TYPE"
  else
    fail "build type:${TYPE}  (template not found at $TMPL)"
  fi
done

# landing — extra assertion: @cta must render its href
LANDING_TMPL="$TEMPLATES/landing.md"
if [ -f "$LANDING_TMPL" ]; then
  TMP_LANDING="$(mktemp -d)"
  OUT_LANDING="$TMP_LANDING/out.html"
  if node "$BUILD" --input "$LANDING_TMPL" --type landing --no-open --no-config --out "$OUT_LANDING" >/dev/null 2>&1 \
     && grep -q "<!DOCTYPE html" "$OUT_LANDING"; then
    pass "build type:landing  (landing.md → HTML)"
  else
    fail "build type:landing  (landing.md)"
  fi
  if [ -f "$OUT_LANDING" ] && grep -q "crestline.example/signup" "$OUT_LANDING"; then
    pass "build type:landing  (@cta href rendered)"
  else
    fail "build type:landing  (@cta href not found in output)"
  fi
  rm -rf "$TMP_LANDING"
else
  fail "build type:landing  (template not found at $LANDING_TMPL)"
  fail "build type:landing  (@cta href rendered — template missing)"
fi

# ── Check: fence-article.md example survives as code ─────────────────────────
FENCE_ARTICLE="$FIXTURES/fence-article.md"
if [ -f "$FENCE_ARTICLE" ]; then
  TMP_FENCE="$(mktemp -d)"
  OUT_FENCE="$TMP_FENCE/out.html"
  if node "$BUILD" --input "$FENCE_ARTICLE" --out "$OUT_FENCE" --style article --no-config --no-open >/dev/null 2>&1 \
     && grep -qE 'title=(\\"|\&quot;|")Example' "$OUT_FENCE"; then
    pass "fence-article: in-fence example survives as code (title=Example present)"
  else
    fail "fence-article: in-fence example not rendered as code (title=Example missing)"
  fi
  rm -rf "$TMP_FENCE"
else
  fail "fence-article: fixture not found at $FENCE_ARTICLE"
fi

# ── Check: how-it-works.md self-referential doc builds ───────────────────────
HOW_IT_WORKS="$DIR/../docs/how-it-works.md"
if [ -f "$HOW_IT_WORKS" ]; then
  TMP_HIW="$(mktemp -d)"
  OUT_HIW="$TMP_HIW/out.html"
  if node "$BUILD" --input "$HOW_IT_WORKS" --out "$OUT_HIW" --style article --no-config --no-open >/dev/null 2>&1; then
    pass "how-it-works: self-referential guide doc builds (exit 0)"
  else
    fail "how-it-works: self-referential guide doc failed to build"
  fi
  rm -rf "$TMP_HIW"
else
  fail "how-it-works: docs/how-it-works.md not found at $HOW_IT_WORKS"
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

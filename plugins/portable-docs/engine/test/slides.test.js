'use strict';
/**
 * Task 2.4b — Slide deck format test
 *
 * TDD via BUILD OUTPUT (design-tokens/JSX cannot be require()d — they are
 * inlined as text into a browser bundle). We drive build-doc.js with
 * `--slides` and assert on the generated HTML.
 *
 * Verifies:
 *  1. `--slides` builds and passes validate() (never-blank gate).
 *  2. Output carries parsed content: brand "Acme Labs", title, slide headings,
 *     bullet text.
 *  3. Output contains a keyboard-nav marker (ArrowRight handler).
 *  4. Output contains NO `process.env`.
 *  5. Output contains NONE of the banned brand literals (Northwestern/McCormick/
 *     Market Sizing).
 *  6. `--slides --theme dark` → dark body bg present AND no hardcoded light
 *     slide-background literal (#f8f9fc absent; deck bg from COLORS tokens).
 *  7. Default (no --slides) proposal build is unchanged.
 *  8. `--style article` build is unchanged.
 *  9. `--slides` wins over `--style article` when both are passed (precedence).
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE          = path.join(__dirname, '..');
const SLIDES_FIXTURE  = path.join(__dirname, 'fixtures', 'sample-slides.md');
const PROPOSAL_FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');
const ARTICLE_FIXTURE  = path.join(__dirname, 'fixtures', 'sample-article.md');

// Run main() with a given argv; return the output HTML text.
async function runBuild({ outFile, slides, style, theme, input } = {}) {
  const tmpHtml = outFile ||
    path.join(os.tmpdir(), `pd-slides-test-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  const origArgv = process.argv;
  const origEnv  = { PD_THEME: process.env.PD_THEME, PD_ACCENT: process.env.PD_ACCENT };
  try {
    const args = ['node', 'build-doc.js',
      '--input', input || SLIDES_FIXTURE, '--out', tmpHtml, '--no-open'];
    if (slides) args.push('--slides');
    if (style)  args.push('--style', style);
    if (theme)  args.push('--theme', theme);
    process.argv = args;
    await main();
  } finally {
    process.argv = origArgv;
    if (origEnv.PD_THEME !== undefined) process.env.PD_THEME  = origEnv.PD_THEME;
    else delete process.env.PD_THEME;
    if (origEnv.PD_ACCENT !== undefined) process.env.PD_ACCENT = origEnv.PD_ACCENT;
    else delete process.env.PD_ACCENT;
  }
  assert.ok(fs.existsSync(tmpHtml), `output file must exist: ${tmpHtml}`);
  return fs.readFileSync(tmpHtml, 'utf8');
}

// ── Test 1: --slides builds and passes validate() ────────────────────────────

test('slides: --slides builds and passes validate()', async () => {
  const html = await runBuild({ slides: true });
  const { validate } = require(path.join(ENGINE, 'scripts/validate.js'));
  const outFile = path.join(os.tmpdir(), `pd-slides-val-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(outFile, html, 'utf8');
  const result = validate({ htmlPath: outFile });
  assert.ok(result.ok, 'slide HTML must pass validate(): ' + result.errors.join('; '));
});

// ── Test 2: slides output carries the parsed content ─────────────────────────

test('slides: output contains brand, title, slide headings, and bullet text', async () => {
  const html = await runBuild({ slides: true });
  assert.ok(html.includes('Acme Labs'),        'brand "Acme Labs" must be present');
  assert.ok(html.includes('Building the Future'), 'title must be present');
  // slide headings from the fixture
  assert.ok(html.includes('Why We Build'),     'slide heading "Why We Build" must be present');
  assert.ok(html.includes('The Opportunity'),  'slide heading "The Opportunity" must be present');
  // bullet content
  assert.ok(html.includes('Ship fast and learn'), 'bullet text must be present');
  // table content
  assert.ok(html.includes('Enterprise'),       'table cell content must be present');
});

// ── Test 3: keyboard-nav handler present in bundle ───────────────────────────

test('slides: output contains ArrowRight keyboard handler', async () => {
  const html = await runBuild({ slides: true });
  assert.ok(html.includes('ArrowRight'), 'keyboard nav marker "ArrowRight" must be in the bundle');
  assert.ok(html.includes('keydown'),    'keydown listener must be in the bundle');
});

// ── Test 4: no process.env in the inlined bundle ────────────────────────────

test('slides: output contains no process.env (build-time injection)', async () => {
  const html = await runBuild({ slides: true });
  assert.ok(!html.includes('process.env'), 'slide HTML must contain no process.env');
});

// ── Test 5: no banned brand literals ─────────────────────────────────────────

test('slides: output contains none of the banned brand literals', async () => {
  const html = await runBuild({ slides: true });
  for (const banned of ['Northwestern', 'McCormick', 'Market Sizing']) {
    assert.ok(!html.includes(banned), `banned literal must NOT appear: "${banned}"`);
  }
});

// ── Test 6: --slides --theme dark is genuinely dark ──────────────────────────

test('slides: --slides --theme dark has dark body bg and no hardcoded light hex', async () => {
  const html = await runBuild({ slides: true, theme: 'dark' });
  assert.ok(html.includes('background: #0D1117'), 'dark body CSS rule must be: background: #0D1117');
  assert.ok(html.includes('data-pd-theme="dark"'), 'data-pd-theme must be "dark"');
  // The 2.4a lesson: a dark deck must NOT contain the hardcoded light hex sentinel.
  assert.ok(!html.includes('#f8f9fc'), 'dark slide HTML must NOT contain hardcoded light hex #f8f9fc');
  // Dark theme surface.paper = #0D1117, must appear in the inlined token
  assert.ok(html.includes('#0D1117'), 'dark theme base token #0D1117 must appear in the bundle');
  // No process.env even in the dark variant
  assert.ok(!html.includes('process.env'), 'dark slide HTML must contain no process.env');
});

// ── Test 7: default (no --slides) proposal build unchanged ───────────────────

test('slides: default build (no --slides) is still the proposal format', async () => {
  const html = await runBuild({ input: PROPOSAL_FIXTURE });
  assert.ok(html.includes('The Adaptive Engineer'), 'proposal title must be present in default build');
  // "ArrowRight" now appears in every doc inside the inlined ReactDOM UMD key-map.
  // Use the slide-specific switch branch as the discriminator instead.
  assert.ok(!html.includes("case 'ArrowRight':"), 'slide keyboard nav must NOT appear in a proposal build');
});

// ── Test 8: --style article build unchanged ───────────────────────────────────

test('slides: --style article build is the article format, not slides', async () => {
  const html = await runBuild({ style: 'article', input: ARTICLE_FIXTURE });
  assert.ok(html.includes('Designing Resilient Systems'), 'article title must be present');
  // "ArrowRight" now appears in every doc inside the inlined ReactDOM UMD key-map.
  // Use the slide-specific switch branch as the discriminator instead.
  assert.ok(!html.includes("case 'ArrowRight':"), 'slide keyboard nav must NOT appear in an article build');
});

// ── Test 9: --slides wins over --style article ────────────────────────────────

test('slides: --slides flag wins over --style article (precedence)', async () => {
  const html = await runBuild({ slides: true, style: 'article' });
  // Slide deck chrome must be present (proves the slides pipeline ran)
  assert.ok(html.includes('ArrowRight'), 'ArrowRight must be present (slides pipeline ran)');
  // The article title from ARTICLE_FIXTURE must NOT appear (slides fixture was the input)
  assert.ok(!html.includes('Designing Resilient Systems'),
    'article content must NOT appear when --slides was the active flag');
});

// ── Test 10: overflow:hidden is in the HEAD <style> block (wrapper-level) ──────
// This test is intentionally strict: it must FAIL if the wrapper-level rule is
// absent (even though SlideDeck.jsx also injects an inline style via useEffect —
// that React-side rule alone is not sufficient for FOUC protection).
// We extract the HEAD <style> block and assert the html,body rule is there.

test('slides: HEAD <style> block contains html,body overflow:hidden rule (not just React-side)', async () => {
  const html = await runBuild({ slides: true });

  // Extract only the <style> block inside <head> (before </head>)
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  assert.ok(headMatch, 'output must contain a <head> block');
  const headSection = headMatch[0];

  const styleMatch = headSection.match(/<style>([\s\S]*?)<\/style>/i);
  assert.ok(styleMatch, '<head> must contain a <style> block');
  const styleContent = styleMatch[1];

  // The wrapper-level rule must be present in the HEAD style block.
  // This assertion fails if the regex in wrap-slides-html.js missed, even
  // though SlideDeck.jsx's useEffect injects overflow:hidden separately.
  assert.ok(
    styleContent.includes('overflow: hidden') || styleContent.includes('overflow:hidden'),
    'HEAD <style> block must contain html,body overflow:hidden (wrapper-level FOUC protection)'
  );
  // Confirm it applies to html element, not just body
  assert.ok(
    styleContent.includes('html') && (styleContent.includes('overflow: hidden') || styleContent.includes('overflow:hidden')),
    'HEAD <style> overflow:hidden rule must cover the html element'
  );
});

// ── Test 11: ### subsection blocks render in slides ──────────────────────────

test('slides: ### subsection heading text appears in built slide output', async () => {
  const html = await runBuild({ slides: true });
  // "Technical Foundation" is the ### subsection title added to sample-slides.md
  assert.ok(html.includes('Technical Foundation'),
    '### subsection heading "Technical Foundation" must be rendered in slide output');
  // Bullet content nested under the subsection must also appear
  assert.ok(html.includes('Zero-downtime deploys'),
    'bullet content nested under the ### subsection must appear in slide output');
});

// ── Test 12: print mode (beforeprint, pd-slide-page) ─────────────────────────

test('slide deck output supports print mode (all slides, beforeprint)', async () => {
  const html = await runBuild({ slides: true });
  assert.ok(html.includes('beforeprint'), 'registers a beforeprint listener');
  assert.ok(html.includes('pd-slide-page'), 'wraps slides in paginated print pages');
  assert.ok(html.includes('data-pd-format="slides"'), 'format marker present');
});

'use strict';
/**
 * Task 2.4a — Article format test
 *
 * TDD via BUILD OUTPUT (design-tokens/JSX cannot be require()d — they are
 * inlined as text into a browser bundle). We drive build-doc.js with
 * `--style article` and assert on the generated HTML.
 *
 * Verifies:
 *  1. `--style article` builds, validate() passes (never-blank gate).
 *  2. Output carries the parsed content: title, brand, footer, section text,
 *     and the table / list / blockquote content.
 *  3. Output contains NONE of the northwestern/market-sizing brand literals.
 *  4. `--style article --theme dark` yields a dark body background.
 *  5. The default (no --style) build is still the unchanged proposal.
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE          = path.join(__dirname, '..');
const ARTICLE_FIXTURE = path.join(__dirname, 'fixtures', 'sample-article.md');
const PROPOSAL_FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');

// Run main() with a given argv; return the output HTML text.
async function runBuild({ outFile, style, theme, input } = {}) {
  const tmpHtml = outFile ||
    path.join(os.tmpdir(), `pd-article-test-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  const origArgv = process.argv;
  const origEnv  = { PD_THEME: process.env.PD_THEME, PD_ACCENT: process.env.PD_ACCENT };
  try {
    const args = ['node', 'build-doc.js',
      '--input', input || ARTICLE_FIXTURE, '--out', tmpHtml, '--no-open'];
    if (style) args.push('--style', style);
    if (theme) args.push('--theme', theme);
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

// ── Test 1: --style article builds and passes the render validator ───────────

test('article: --style article builds and passes validate()', async () => {
  const html = await runBuild({ style: 'article' });
  const { validate } = require(path.join(ENGINE, 'scripts/validate.js'));
  // Re-validate the emitted file directly (build-doc already validates, but we
  // assert it here too so a regression surfaces in this suite).
  const outFile = path.join(os.tmpdir(), `pd-article-validate-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(outFile, html, 'utf8');
  const result = validate({ htmlPath: outFile });
  assert.ok(result.ok, 'article HTML must pass validate(): ' + result.errors.join('; '));
});

// ── Test 2: article output carries the parsed content ────────────────────────

test('article: output contains title, brand, footer, section, table, list, blockquote', async () => {
  const html = await runBuild({ style: 'article' });
  assert.ok(html.includes('Designing Resilient Systems'), 'title must be present');
  assert.ok(html.includes('Acme Labs'),  'brand "Acme Labs" must be present');
  assert.ok(html.includes('© Acme Labs'), 'footer "© Acme Labs" must be present');
  assert.ok(html.includes('Why Resilience Matters'), 'section heading text must be present');
  // table content
  assert.ok(html.includes('Active-active'), 'table cell content must be present');
  assert.ok(html.includes('Recovery Speed'), 'table header content must be present');
  // list content (bullet + numbered)
  assert.ok(html.includes('Redundancy keeps spare capacity ready'), 'bullet list item must be present');
  assert.ok(html.includes('Detect the failure with health checks'), 'numbered list item must be present');
  // blockquote content
  assert.ok(html.includes('The person who plans for failure ships systems that survive it'),
    'blockquote text must be present');
});

// ── Test 3: NO northwestern/market-sizing brand literals leak ────────────────

test('article: output contains none of the northwestern brand literals', async () => {
  const html = await runBuild({ style: 'article' });
  for (const banned of ['Northwestern', 'McCormick', 'Market Sizing', 'MPD-409', 'Romanian Proverb']) {
    assert.ok(!html.includes(banned), `banned literal must NOT appear: "${banned}"`);
  }
});

// ── Test 4: --style article --theme dark gives a dark body background ─────────

test('article: --style article --theme dark has dark body background', async () => {
  const html = await runBuild({ style: 'article', theme: 'dark' });
  assert.ok(html.includes('background: #0D1117'), 'dark body CSS rule must be: background: #0D1117');
  assert.ok(html.includes('data-pd-theme="dark"'), 'data-pd-theme must be "dark"');
  // and no process.env leaked into the inlined bundle (build-time injection proof)
  assert.ok(!html.includes('process.env'), 'article dark HTML must contain no process.env');
});

// ── Test 5: default (no --style) build is still the proposal, unchanged ───────

test('article: default build (no --style) is still the proposal format', async () => {
  const html = await runBuild({ input: PROPOSAL_FIXTURE });
  // Proposal-only signal: the proposal App renders a SectionNav with the
  // literal "The Adaptive Engineer" title from the proposal fixture header.
  assert.ok(html.includes('The Adaptive Engineer'), 'proposal title must be present in default build');
  // The article eyebrow "Engineering Field Guide" must NOT be in a proposal build.
  assert.ok(!html.includes('Designing Resilient Systems'),
    'article content must NOT appear in a default proposal build');
});

// ── Test 6: dark hero is theme-aware (no hardcoded light gradient) ─────────────

test('article: --style article --theme dark hero must not contain hardcoded light gradient', async () => {
  const darkHtml  = await runBuild({ style: 'article', theme: 'dark' });
  const lightHtml = await runBuild({ style: 'article', theme: 'editorial' });

  // Dark build must NOT contain the old hardcoded light gradient sentinel hex.
  assert.ok(
    !darkHtml.includes('#f8f9fc'),
    'dark article hero must NOT contain the hardcoded light hex #f8f9fc'
  );

  // Dark build must contain a dark surface token in the hero gradient.
  // The dark theme surface.paper resolves to #0D1117 — used as the gradient start.
  assert.ok(
    darkHtml.includes('#0D1117'),
    'dark article hero gradient must reference dark surface token #0D1117'
  );

  // Light (editorial) build must still contain light surface tones in the hero.
  // editorial surface.paper = #FAFAFA, surface.inset = #F4F4F5, surface.elevated = #FFFFFF.
  assert.ok(
    lightHtml.includes('#FAFAFA') || lightHtml.includes('#F4F4F5') || lightHtml.includes('#FFFFFF'),
    'editorial article hero must still render light surface tones'
  );
});

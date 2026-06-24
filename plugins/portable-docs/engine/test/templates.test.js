'use strict';
/**
 * Task 3.3 — Template smoke tests
 *
 * Drives build-doc.js against each of the four shipped templates and asserts:
 *  1. The build exits cleanly (no throw = validate() passed internally).
 *  2. The output file is a non-empty HTML document.
 *
 * Banned-literal coverage is enforced here for all four formats. Timeline.jsx
 * was de-branded in Task 5.2 (generic initial-badge replaces org-specific logo
 * map), so the full banned-literal check now applies to proposal and one-pager
 * bundles too — no exemptions remain.
 *
 * Templates live at ../../templates/ relative to this test file.
 * Formats covered:
 *   proposal.md   — default (proposal) format
 *   report.md     — --style article
 *   one-pager.md  — default (proposal) format
 *   recap.md      — --slides
 *   changelog.md  — --type changelog (Phase 5a)
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const { lintMarkdown } = require('../scripts/lint.js');

const ENGINE    = path.join(__dirname, '..');
const TEMPLATES = path.join(__dirname, '..', '..', 'templates');

/**
 * Run main() and return the output HTML text.
 * @param {{ input:string, slides?:boolean, style?:string }} opts
 */
async function runBuild({ input, slides, style, type } = {}) {
  const tmpHtml = path.join(os.tmpdir(),
    `pd-tmpl-test-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  const origArgv = process.argv;
  const origEnv  = {
    PD_THEME:  process.env.PD_THEME,
    PD_ACCENT: process.env.PD_ACCENT,
  };
  try {
    const args = ['node', 'build-doc.js',
      '--input', input, '--out', tmpHtml, '--no-open'];
    if (slides) args.push('--slides');
    if (style)  args.push('--style', style);
    if (type) args.push('--type', type);
    process.argv = args;
    await main();
  } finally {
    process.argv = origArgv;
    if (origEnv.PD_THEME  !== undefined) process.env.PD_THEME  = origEnv.PD_THEME;
    else delete process.env.PD_THEME;
    if (origEnv.PD_ACCENT !== undefined) process.env.PD_ACCENT = origEnv.PD_ACCENT;
    else delete process.env.PD_ACCENT;
  }
  assert.ok(fs.existsSync(tmpHtml), `output file must exist: ${tmpHtml}`);
  return fs.readFileSync(tmpHtml, 'utf8');
}

// Banned literals — none of these must appear in any built output.
// Timeline.jsx was de-branded (Task 5.2): org-specific logo map removed.
const BANNED = [
  'Northwestern', 'McCormick', 'Motorola', 'Jiobit', 'Life360',
  'Deloitte', 'Renaldi', 'Walinski', 'Market Sizing', 'MPD-409',
];

function assertNoBannedLiterals(html, label) {
  for (const term of BANNED) {
    assert.ok(!html.includes(term), `${label} must NOT contain banned literal "${term}"`);
  }
}

// ── 1. proposal.md — default format ─────────────────────────────────────────

test('templates: proposal.md builds clean (default format)', async () => {
  const html = await runBuild({ input: path.join(TEMPLATES, 'proposal.md') });
  assert.ok(html.length > 1000, 'output must be non-trivially large');
  assert.ok(html.includes('<!DOCTYPE html'), 'output must be an HTML document');
  assertNoBannedLiterals(html, 'proposal.md');
});

// ── 2. report.md — --style article ──────────────────────────────────────────

test('templates: report.md builds clean (--style article)', async () => {
  const html = await runBuild({
    input: path.join(TEMPLATES, 'report.md'),
    style: 'article',
  });
  assert.ok(html.length > 1000, 'output must be non-trivially large');
  assert.ok(html.includes('<!DOCTYPE html'), 'output must be an HTML document');
  // Article bundle is lean — no proposal component code. Confirm none of the
  // template's own fictional content introduces banned literals.
  assertNoBannedLiterals(html, 'report.md');
});

// ── 3. one-pager.md — default format ────────────────────────────────────────

test('templates: one-pager.md builds clean (default format)', async () => {
  const html = await runBuild({ input: path.join(TEMPLATES, 'one-pager.md') });
  assert.ok(html.length > 1000, 'output must be non-trivially large');
  assert.ok(html.includes('<!DOCTYPE html'), 'output must be an HTML document');
  assertNoBannedLiterals(html, 'one-pager.md');
});

// ── 4. recap.md — --slides ──────────────────────────────────────────────────

test('templates: recap.md builds clean (--slides)', async () => {
  const html = await runBuild({
    input: path.join(TEMPLATES, 'recap.md'),
    slides: true,
  });
  assert.ok(html.length > 1000, 'output must be non-trivially large');
  assert.ok(html.includes('<!DOCTYPE html'), 'output must be an HTML document');
  // Slides bundle is also lean — confirm template content is clean.
  assertNoBannedLiterals(html, 'recap.md');
});

// ── 5. changelog.md — --type changelog (Phase 5a) ───────────────────────────

test('templates: changelog.md builds clean under --type changelog', async () => {
  const html = await runBuild({ input: path.join(TEMPLATES, 'changelog.md'), type: 'changelog' });
  assert.ok(html.length > 1000, 'output must be non-trivially large');
  assert.ok(html.includes('<!DOCTYPE html'), 'output must be an HTML document');
  assertNoBannedLiterals(html, 'changelog.md');
});

test('lint: changelog.md is error-free under --type changelog', () => {
  const md = fs.readFileSync(path.join(TEMPLATES, 'changelog.md'), 'utf8');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.deepStrictEqual(r.errors, [], 'changelog template must have no lint errors');
});

// ── 6. newsletter.md — --type newsletter (Phase 5a) ─────────────────────────

test('templates: newsletter.md builds clean under --type newsletter', async () => {
  const html = await runBuild({ input: path.join(TEMPLATES, 'newsletter.md'), type: 'newsletter' });
  assert.ok(html.length > 1000);
  assert.ok(html.includes('<!DOCTYPE html'));
  assertNoBannedLiterals(html, 'newsletter.md');
});

test('lint: newsletter.md is error-free and warning-free under --type newsletter', () => {
  const md = fs.readFileSync(path.join(TEMPLATES, 'newsletter.md'), 'utf8');
  const r = lintMarkdown(md, { format: 'article', type: 'newsletter' });
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.warnings, []);
});

// ── 7. case-study.md — --type case-study (Phase 5a) ─────────────────────────

test('templates: case-study.md builds clean under --type case-study', async () => {
  const html = await runBuild({ input: path.join(TEMPLATES, 'case-study.md'), type: 'case-study' });
  assert.ok(html.length > 1000);
  assert.ok(html.includes('<!DOCTYPE html'));
  assertNoBannedLiterals(html, 'case-study.md');
});

test('lint: case-study.md is error-free and warning-free under --type case-study', () => {
  const md = fs.readFileSync(path.join(TEMPLATES, 'case-study.md'), 'utf8');
  const r = lintMarkdown(md, { format: 'proposal', type: 'case-study' });
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.warnings, []);
});

// ── 8. rfp.md — --type rfp (Phase 5a) ───────────────────────────────────────

test('templates: rfp.md builds clean under --type rfp', async () => {
  const html = await runBuild({ input: path.join(TEMPLATES, 'rfp.md'), type: 'rfp' });
  assert.ok(html.length > 1000);
  assert.ok(html.includes('<!DOCTYPE html'));
  assertNoBannedLiterals(html, 'rfp.md');
});

test('lint: rfp.md is error-free and warning-free under --type rfp', () => {
  const md = fs.readFileSync(path.join(TEMPLATES, 'rfp.md'), 'utf8');
  const r = lintMarkdown(md, { format: 'proposal', type: 'rfp' });
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.warnings, []);
});

// ── 9. resume.md — --type resume (Phase 5a) ──────────────────────────────────

test('templates: resume.md builds clean under --type resume', async () => {
  const html = await runBuild({ input: path.join(TEMPLATES, 'resume.md'), type: 'resume' });
  assert.ok(html.length > 1000);
  assert.ok(html.includes('<!DOCTYPE html'));
  assertNoBannedLiterals(html, 'resume.md');
});

test('lint: resume.md is error-free under --type resume', () => {
  const md = fs.readFileSync(path.join(TEMPLATES, 'resume.md'), 'utf8');
  const r = lintMarkdown(md, { format: 'proposal', type: 'resume' });
  assert.deepStrictEqual(r.errors, [], 'resume template must have no lint errors');
});

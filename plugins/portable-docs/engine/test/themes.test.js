'use strict';
/**
 * Task 2.2 — Themes test
 *
 * TDD: write tests first, then implement.
 *
 * Verifies:
 *  1. Default build (no PD_THEME) outputs editorial accent #5B21B6 and paper #FAFAFA
 *  2. --theme editorial produces same editorial values
 *  3. --theme dark produces a dark-palette value NOT in editorial output
 *  4. --theme dark body background is dark (not white)
 *  5. Built HTML contains NO "process.env" text (build-time injection proof)
 *  6. PD_ACCENT override appears in output
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE  = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');

// Helper: run main() with a given set of argv overrides and optional env vars.
// Returns the HTML content of the output file.
async function runBuild({ outFile, theme, accent } = {}) {
  const tmpHtml = outFile || path.join(os.tmpdir(), `pd-theme-test-${Date.now()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  const origArgv = process.argv;
  const origEnv  = { PD_THEME: process.env.PD_THEME, PD_ACCENT: process.env.PD_ACCENT };

  // Clear cached module so main() re-reads env on each call
  // (build-doc requires build.js which caches nothing critical for us)
  try {
    const args = ['node', 'build-doc.js', '--input', FIXTURE, '--out', tmpHtml, '--no-open'];
    if (theme) args.push('--theme', theme);
    process.argv = args;
    if (accent !== undefined) {
      process.env.PD_ACCENT = accent;
    }
    // If accent is undefined, leave the caller-set PD_ACCENT alone
    // (test 6 sets it directly in env before calling runBuild)
    await main();
  } finally {
    process.argv = origArgv;
    // Restore env
    if (origEnv.PD_THEME !== undefined) process.env.PD_THEME  = origEnv.PD_THEME;
    else delete process.env.PD_THEME;
    if (origEnv.PD_ACCENT !== undefined) process.env.PD_ACCENT = origEnv.PD_ACCENT;
    else delete process.env.PD_ACCENT;
  }

  assert.ok(fs.existsSync(tmpHtml), `output file must exist: ${tmpHtml}`);
  return fs.readFileSync(tmpHtml, 'utf8');
}

// ── Test 1: default build (no --theme) produces editorial values ─────────────

test('themes: default build (no --theme) contains editorial accent #5B21B6', async () => {
  const html = await runBuild({});
  assert.ok(html.includes('#5B21B6'), 'editorial accent #5B21B6 must be present');
});

test('themes: default build (no --theme) contains editorial paper #FAFAFA', async () => {
  const html = await runBuild({});
  assert.ok(html.includes('#FAFAFA'), 'editorial paper #FAFAFA must be present');
});

// ── Test 2: --theme editorial is byte-for-byte same brand values ─────────────

test('themes: --theme editorial contains #5B21B6 and #FAFAFA', async () => {
  const html = await runBuild({ theme: 'editorial' });
  assert.ok(html.includes('#5B21B6'), 'editorial accent must be present');
  assert.ok(html.includes('#FAFAFA'), 'editorial paper must be present');
});

// ── Test 3: --theme dark has dark ACTIVE_THEME literal and dark body bg ───────
// The THEMES map is inlined as source text in all builds (so #0D1117 appears
// in both). The distinguishing signals are: (a) ACTIVE_THEME literal,
// (b) data-pd-theme attribute, and (c) body background color.

test('themes: --theme dark has ACTIVE_THEME="dark" injected and dark body bg', async () => {
  const darkHtml = await runBuild({ theme: 'dark' });
  // ACTIVE_THEME must be injected as the literal "dark"
  assert.ok(darkHtml.includes('ACTIVE_THEME = "dark"'), '--theme dark must inject ACTIVE_THEME = "dark"');
  // data-pd-theme attribute must be "dark"
  assert.ok(darkHtml.includes('data-pd-theme="dark"'), 'data-pd-theme must be "dark"');
  // Body background must be the dark base color
  assert.ok(darkHtml.includes('background: #0D1117'), 'body background must be dark #0D1117');
  // Editorial accent must NOT be the active accent (the dark theme uses cyan)
  // We verify the dark accent #22D3EE appears in the THEMES definition
  assert.ok(darkHtml.includes('#22D3EE'), '--theme dark must contain dark accent #22D3EE');
});

// ── Test 4: --theme dark gives dark body background in <style> ───────────────
// Checks the actual CSS body rule emitted by wrap-html.js (line 81):
//   body { font-family: …; background: #0D1117; }
// The substring 'background: #0D1117' is discriminating: it is present for the
// dark build (THEME_BODY_BG.dark = '#0D1117') and ABSENT for editorial
// (THEME_BODY_BG.editorial = '#FAFAFA', emitting 'background: #FAFAFA').
// Note: '#0D1117' alone is a weak check because that hex also appears in the
// inlined THEMES map present in every build (editorial/brand too).

test('themes: --theme dark body background is dark', async () => {
  const html = await runBuild({ theme: 'dark' });
  // The body CSS rule must use the dark background color — exact format from wrap-html.js
  assert.ok(html.includes('background: #0D1117'), 'dark body CSS rule must be: background: #0D1117');
  // Confirm the same assertion is discriminating: an editorial build emits 'background: #FAFAFA', not '#0D1117'
  const editorialHtml = await runBuild({ theme: 'editorial' });
  assert.ok(!editorialHtml.includes('background: #0D1117'), 'editorial build must NOT contain: background: #0D1117');
  assert.ok(editorialHtml.includes('background: #FAFAFA'),  'editorial build must contain: background: #FAFAFA');
});

// ── Test 4b: default build == explicit --theme editorial (byte equality) ─────
// Proves the "editorial unchanged" guarantee: the default path and the editorial
// path must produce identical HTML.
//
// Normalization applied: the JSX bundle comment header contains a build timestamp
// ("Generated: <ISO timestamp>", from build.js line 171). Two sequential builds
// will differ in that one line. We strip any ISO 8601 datetime string before
// comparing so that a true content-equality assertion is possible without
// introducing a fixed wait between builds.
//
// Pattern stripped: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/g
// This is the only nondeterministic field identified; all other content is
// deterministic given the same fixture + theme + env.

test('themes: default build (no --theme) is byte-equal to --theme editorial', async () => {
  const TIMESTAMP_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/g;
  const normalize = (s) => s.replace(TIMESTAMP_RE, '<TIMESTAMP>');

  const defaultHtml   = await runBuild({});
  const editorialHtml = await runBuild({ theme: 'editorial' });

  assert.strictEqual(
    normalize(defaultHtml),
    normalize(editorialHtml),
    'default build and --theme editorial must produce identical HTML (after timestamp normalization)',
  );
});

// ── Test 5: Built HTML contains NO "process.env" text ────────────────────────
// This is the key safety assertion that proves build-time injection happened.

test('themes: built HTML contains NO "process.env" references (build-time injection)', async () => {
  const [darkHtml, editorialHtml, defaultHtml] = await Promise.all([
    runBuild({ theme: 'dark' }),
    runBuild({ theme: 'editorial' }),
    runBuild({}),
  ]);
  assert.ok(!darkHtml.includes('process.env'),     'dark HTML must contain no process.env');
  assert.ok(!editorialHtml.includes('process.env'),'editorial HTML must contain no process.env');
  assert.ok(!defaultHtml.includes('process.env'),  'default HTML must contain no process.env');
});

// ── Test 6: PD_ACCENT override appears in output ─────────────────────────────

test('themes: PD_ACCENT override #E11D48 appears in output', async () => {
  // Set a custom accent via env (build-doc must forward PD_ACCENT to the bundle)
  const origAccent = process.env.PD_ACCENT;
  process.env.PD_ACCENT = '#E11D48';
  let html;
  try {
    html = await runBuild({ theme: 'brand' });
  } finally {
    if (origAccent !== undefined) process.env.PD_ACCENT = origAccent;
    else delete process.env.PD_ACCENT;
  }
  assert.ok(html.includes('#E11D48'), 'PD_ACCENT custom color #E11D48 must appear in output');
});

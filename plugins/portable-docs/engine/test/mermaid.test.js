// engine/test/mermaid.test.js
// Task 14: @mermaid wired into the PROPOSAL pipeline (build-doc + parser + App + build.js).
// Tests run browser-free by forcing PD_BROWSER to a non-existent path, so @mermaid
// degrades to the { source, error } fallback path.  The real-SVG path is exercised
// by /doctor later.
'use strict';
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE = path.join(__dirname, '..');

// ── helper: build fixture with optional extra args ────────────────────────────
async function build(fixture, extraArgv = []) {
  const tmpHtml = path.join(os.tmpdir(), `pd-mermaid-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  const prevBrowser = process.env.PD_BROWSER;
  try {
    process.env.PD_BROWSER = 'nonexistent-browser-for-test';
    process.argv = [
      'node', 'build-doc.js',
      '--input', path.join(ENGINE, 'test/fixtures', fixture),
      '--out', tmpHtml,
      '--no-open', '--no-config',
      ...extraArgv,
    ];
    await main();
  } finally {
    process.argv = origArgv;
    if (prevBrowser !== undefined) process.env.PD_BROWSER = prevBrowser;
    else delete process.env.PD_BROWSER;
  }
  return fs.readFileSync(tmpHtml, 'utf8');
}

// ── @mermaid in proposal ──────────────────────────────────────────────────────

test('@mermaid proposal: mermaid source preserved in fallback output', async () => {
  const html = await build('mermaid-proposal.md');
  // The source text "graph TD" must appear somewhere in the HTML (fallback <pre>)
  assert.ok(html.includes('graph TD'), 'mermaid source preserved in fallback pre');
});

test('@mermaid proposal: MermaidFigure fallback renders ⚠ mermaid: prefix', async () => {
  const html = await build('mermaid-proposal.md');
  // MermaidFigure hardcodes "⚠ mermaid:" for error display
  assert.ok(/mermaid:/.test(html), 'MermaidFigure warning prefix present');
});

test('@mermaid proposal: docs without @mermaid build unchanged (themes not broken)', async () => {
  const html = await build('sample.md');
  // sample.md has no @mermaid blocks — should build fine without any mermaid markers
  assert.ok(html.includes('</html>'), 'sample.md builds to valid HTML');
  assert.ok(!html.includes('MERMAIDSVG'), 'no stray mermaid sentinels in non-mermaid doc');
});

test('@mermaid proposal: content.mermaids is present in output (data threaded through)', async () => {
  const html = await build('mermaid-proposal.md');
  // The CONTENT snapshot in the HTML bundle must contain the mermaids array
  assert.ok(/mermaids/.test(html), 'mermaids key present in baked CONTENT');
});

// ── assertDiagramsStrict ──────────────────────────────────────────────────────

test('--strict aborts on a @flow/@quadrant data error', async () => {
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const tmp = path.join(os.tmpdir(), `pd-ds-${process.hrtime.bigint()}.html`);
  const origArgv = process.argv;
  let threw = false;
  let msg = '';
  try {
    process.argv = [
      'node', 'build-doc.js',
      '--input', path.join(ENGINE, 'test/fixtures/diagrams-proposal.md'),
      '--out', tmp,
      '--no-open', '--no-config', '--strict',
    ];
    await main();
  } catch (e) {
    threw = true;
    msg = e.message;
  } finally {
    process.argv = origArgv;
  }
  assert.ok(threw && /diagram data error/i.test(msg), '--strict must abort on a diagram data error');
});

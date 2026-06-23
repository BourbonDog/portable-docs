'use strict';
/**
 * Task 9 — Copy-code button on TerminalWindow
 *
 * Verifies that the compiled proposal output for a doc containing a @terminal
 * block includes a copy button wired to the clipboard API and hidden in print.
 *
 * The output is a compiled JS bundle — we assert on substrings that survive
 * compilation and are tightly tied to the actual feature wiring:
 *   - 'navigator.clipboard'   → clipboard API call is present in the bundle
 *   - 'pd-copy-btn'           → the button's className attribute
 *   - 'Copy code'             → the aria-label (accessible label)
 *   - 'pd-no-print'           → print-hide class on the button
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE  = path.join(__dirname, '..');
// sample.md contains two @terminal blocks — the ideal fixture for this test.
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');

async function buildProposalWithTerminalToString() {
  const tmpHtml = path.join(os.tmpdir(), `pd-copy-code-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', FIXTURE, '--out', tmpHtml, '--no-open'];
    await main();
  } finally {
    process.argv = origArgv;
  }
  assert.ok(fs.existsSync(tmpHtml), `output file must exist: ${tmpHtml}`);
  const html = fs.readFileSync(tmpHtml, 'utf8');
  fs.rmSync(tmpHtml, { force: true });
  return html;
}

test('terminal blocks render a copy-code button using the clipboard API', async () => {
  const html = await buildProposalWithTerminalToString();
  assert.ok(html.includes('navigator.clipboard'), 'uses clipboard API');
  assert.ok(html.includes('pd-copy-btn'), 'copy button present');
  assert.ok(html.includes('aria-label": "Copy code"'), 'accessible label present as aria-label attribute');
  assert.ok(html.includes('pd-no-print'), 'hidden in print');
});

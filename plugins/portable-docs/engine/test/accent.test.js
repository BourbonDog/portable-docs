'use strict';
/**
 * Accent-shade derivation is computed at VIEW TIME in the browser (design-tokens
 * is inlined as text). So we assert the WIRING: the color helper is inlined into
 * the bundle and the accent IIFE calls it. The math itself is covered by
 * test/color.test.js. We also prove a 3-digit PD_ACCENT no longer crashes the build.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ENGINE = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');

async function runBuild({ theme, accent } = {}) {
  const tmpHtml = path.join(os.tmpdir(), `pd-accent-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  const origAccent = process.env.PD_ACCENT;
  try {
    process.argv = ['node', 'build-doc.js', '--input', FIXTURE, '--out', tmpHtml, '--no-open'];
    if (theme) process.argv.push('--theme', theme);
    if (accent !== undefined) process.env.PD_ACCENT = accent;
    await main();
  } finally {
    process.argv = origArgv;
    if (origAccent !== undefined) process.env.PD_ACCENT = origAccent;
    else delete process.env.PD_ACCENT;
  }
  assert.ok(fs.existsSync(tmpHtml), `output must exist: ${tmpHtml}`);
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('accent: color helper is inlined into the bundle', async () => {
  const html = await runBuild({ theme: 'brand', accent: '#E11D48' });
  assert.ok(html.includes('function lighten'), 'lighten() must be inlined into the bundle');
  assert.ok(html.includes('function normalizeHex'), 'normalizeHex() must be inlined into the bundle');
});

test('accent: override IIFE calls lighten() for light/muted shades', async () => {
  const html = await runBuild({ theme: 'brand', accent: '#E11D48' });
  assert.ok(html.includes('lighten(primary'), 'IIFE must derive shades via lighten(primary, …)');
  assert.ok(html.includes('#E11D48'), 'injected accent literal must be present');
  assert.ok(!html.includes('process.env'), 'no process.env may leak into the bundle');
});

test('accent: 3-digit PD_ACCENT builds without error', async () => {
  const html = await runBuild({ theme: 'brand', accent: '#E33' });
  assert.ok(html.includes('#E33'), 'injected 3-digit accent literal must be present');
});

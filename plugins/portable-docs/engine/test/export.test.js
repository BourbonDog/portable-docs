'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const exp = require('../scripts/export.js');

test('toFileUrl produces a file:// URL', () => {
  const u = exp.toFileUrl(path.join(os.tmpdir(), 'a b.html'));
  assert.ok(u.startsWith('file://'), 'has file scheme');
  assert.ok(u.includes('a%20b.html'), 'encodes spaces');
});

test('buildPdfArgs uses headless + print-to-pdf + file url', () => {
  const args = exp.buildPdfArgs('/x/in.html', '/x/out.pdf');
  assert.ok(args.includes('--headless=new'));
  assert.ok(args.some((a) => a === '--print-to-pdf=/x/out.pdf'));
  assert.ok(args.some((a) => a.startsWith('file://')));
});

test('detectBrowser honors PD_BROWSER when the path exists', () => {
  const fake = path.join(os.tmpdir(), `pd-fake-browser-${process.hrtime.bigint()}`);
  fs.writeFileSync(fake, '');
  const prev = process.env.PD_BROWSER;
  process.env.PD_BROWSER = fake;
  try {
    assert.strictEqual(exp.detectBrowser(), fake);
  } finally {
    if (prev !== undefined) process.env.PD_BROWSER = prev; else delete process.env.PD_BROWSER;
    fs.rmSync(fake, { force: true });
  }
});

test('runExport with no browser degrades gracefully (no throw)', () => {
  const r = exp.runExport({ htmlPath: '/x/in.html', browser: null, pdf: true });
  assert.deepStrictEqual(r, { skipped: 'no-browser' });
});

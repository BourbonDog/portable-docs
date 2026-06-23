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

test('buildPngArgs takes a screenshot; windowSize is optional', () => {
  const plain = exp.buildPngArgs('/x/in.html', '/x/out.png');
  assert.ok(plain.some((a) => a === '--screenshot=/x/out.png'));
  assert.ok(!plain.some((a) => a.startsWith('--window-size')));
  const sized = exp.buildPngArgs('/x/in.html', '/x/out.png', { windowSize: '1600,900' });
  assert.ok(sized.some((a) => a === '--window-size=1600,900'));
});

test('detectFormat reads data-pd-format', () => {
  const f = path.join(os.tmpdir(), `pd-fmt-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(f, '<html data-pd-theme="dark" data-pd-format="slides"></html>');
  try { assert.strictEqual(exp.detectFormat(f), 'slides'); }
  finally { fs.rmSync(f, { force: true }); }
});

test('runExport reports export-failed only when nothing was produced', () => {
  // A non-existent browser path makes spawnSync fail (ENOENT, status null) for
  // every format, so no output file is produced.
  const r = exp.runExport({ htmlPath: '/x/in.html', browser: '/no/such/browser-xyz', pdf: true });
  assert.strictEqual(r.skipped, 'export-failed');
  assert.ok(!r.pdf && !r.png, 'no format path set when all failed');
});

test('end-to-end export produces non-empty PDF + PNG', { skip: exp.detectBrowser() ? false : 'no system browser available' }, () => {
  const html = path.join(os.tmpdir(), `pd-e2e-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(html, '<!DOCTYPE html><html data-pd-format="proposal"><body><h1>Hello export</h1><p>'.padEnd(2000, 'x') + '</p></body></html>');
  try {
    const r = exp.exportFile(html, { pdf: true, png: true });
    assert.ok(r.pdf && fs.existsSync(r.pdf) && fs.statSync(r.pdf).size > 0, 'PDF written and non-empty');
    assert.ok(r.png && fs.existsSync(r.png) && fs.statSync(r.png).size > 0, 'PNG written and non-empty');
    fs.rmSync(r.pdf, { force: true });
    fs.rmSync(r.png, { force: true });
  } finally { fs.rmSync(html, { force: true }); }
});

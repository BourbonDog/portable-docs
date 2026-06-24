'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { extractContent } = require('../src/utils/parser.js');
const { MARKER_SPEC, lintMarkdown } = require('../scripts/lint.js');

test('MARKER_SPEC has a paired cta entry with required label+href', () => {
  assert.ok(MARKER_SPEC.cta, 'MARKER_SPEC.cta missing');
  assert.strictEqual(MARKER_SPEC.cta.paired, true);
  assert.deepStrictEqual(MARKER_SPEC.cta.required, ['label', 'href']);
  assert.deepStrictEqual(MARKER_SPEC.cta.enums.variant, ['primary', 'secondary']);
});

test('extractContent parses @cta into CONTENT.ctas with label+href', () => {
  const md = ['<!-- @cta label="Start free trial" href="https://x.example/signup" -->', 'No card required.', '<!-- /@cta -->'].join('\n');
  const c = extractContent(md);
  assert.ok(Array.isArray(c.ctas), 'ctas is an array');
  assert.strictEqual(c.ctas.length, 1);
  assert.strictEqual(c.ctas[0].label, 'Start free trial');
  assert.strictEqual(c.ctas[0].href, 'https://x.example/signup');
  assert.strictEqual(c.ctas[0].variant, 'primary');
});

test('lint: @cta missing href is a missing-attr error', () => {
  const md = ['<!-- @cta label="Go" -->', '<!-- /@cta -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'missing-attr' && e.marker === 'cta' && /href/.test(e.message)));
});

test('lint: @cta variant outside the enum is a bad-enum error', () => {
  const md = ['<!-- @cta label="Go" href="https://x" variant="ghost" -->', '<!-- /@cta -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'bad-enum' && e.marker === 'cta'));
});

test('MARKER_SPEC drift guard still passes with @cta in the parser', () => {
  const fs = require('fs'); const path = require('path');
  const parserSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'parser.js'), 'utf-8');
  const found = new Set();
  const re = /<!--\s*@([a-zA-Z][\w]*)\b/g;
  let m;
  while ((m = re.exec(parserSrc)) !== null) found.add(m[1]);
  for (const name of found) assert.ok(MARKER_SPEC[name], `MARKER_SPEC missing "${name}"`);
});

test('a built proposal with @cta renders an anchor to the href', async () => {
  const os = require('os'); const fs = require('fs'); const path = require('path');
  const tmp = path.join(os.tmpdir(), `pd-cta-${process.hrtime.bigint()}.md`);
  const out = path.join(os.tmpdir(), `pd-cta-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(tmp, ['## 1. Get started', '', '<!-- @cta label="Start free trial" href="https://x.example/signup" variant="primary" -->', 'No card required.', '<!-- /@cta -->'].join('\n'));
  const { main } = require('../scripts/build-doc.js');
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', tmp, '--out', out, '--no-open', '--no-config'];
    await main();
    const html = fs.readFileSync(out, 'utf8');
    assert.ok(html.includes('https://x.example/signup'), 'output must contain the CTA href');
    assert.ok(/pd-print-only/.test(html), 'output must contain the print-only URL line');
  } finally {
    process.argv = origArgv;
    fs.rmSync(tmp, { force: true }); fs.rmSync(out, { force: true });
  }
});

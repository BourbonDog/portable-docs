'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { lintMarkdown, MARKER_SPEC, extractIconNames } = require('../scripts/lint.js');

const codes = (r) => [...r.errors, ...r.warnings].map((d) => d.code);

test('clean proposal yields no diagnostics', () => {
  const md = [
    '<!-- @header -->',
    '<!-- @title value="T" -->',
    '<!-- /@header -->',
    '',
    '## 1. Intro',
    '',
    '<!-- @stats -->',
    '<!-- @stat value="3x" label="Growth" source="Internal" -->',
    '<!-- /@stats -->',
  ].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.deepStrictEqual(r.errors, []);
});

test('unclosed block is reported with the open line', () => {
  const md = ['<!-- @stats -->', '<!-- @stat value="3" label="x" source="y" -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'unclosed-block' && e.line === 1));
});

test('stray closing marker is an error', () => {
  const r = lintMarkdown('<!-- /@stats -->', { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'unclosed-block' && e.line === 1));
});

test('unknown marker is an error with its line', () => {
  const r = lintMarkdown('text\n<!-- @stas -->', { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'unknown-marker' && e.line === 2));
});

test('missing required attribute is an error', () => {
  const md = ['<!-- @stats -->', '<!-- @stat value="3" label="x" -->', '<!-- /@stats -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'missing-attr' && /source/.test(e.message)));
});

test('invalid enum value is an error', () => {
  const md = ['<!-- @cards type="bogus" -->', '<!-- @card icon="rocket" title="X" -->', 'body', '<!-- /@card -->', '<!-- /@cards -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'bad-enum' && /type/.test(e.message)));
});

test('MARKER_SPEC covers every marker the parser recognizes (drift guard)', () => {
  const parserSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'parser.js'), 'utf-8');
  const found = new Set();
  const re = /<!--\s*@([a-zA-Z][\w]*)\b/g;
  let m;
  while ((m = re.exec(parserSrc)) !== null) found.add(m[1]);
  // Every opening marker the parser matches must be in the registry.
  for (const name of found) {
    assert.ok(MARKER_SPEC[name], `MARKER_SPEC is missing "${name}" (parser drift)`);
  }
});

test('extractIconNames reads the Icons object keys from design-tokens.js', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'design-tokens.js'), 'utf-8');
  const names = extractIconNames(src);
  assert.ok(names.length >= 25, `expected >=25 icons, got ${names.length}`);
  for (const n of ['rocket', 'brain', 'search', 'placeholder']) {
    assert.ok(names.includes(n), `missing icon "${n}"`);
  }
});

test('unknown icon is a warning, not an error', () => {
  const md = ['<!-- @cards type="feature" -->', '<!-- @card icon="notreal" title="X" -->', 'b', '<!-- /@card -->', '<!-- /@cards -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', iconNames: ['rocket', 'brain'] });
  assert.deepStrictEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.code === 'unknown-icon'));
});

test('unnumbered proposal section is a warning (Citations exempt)', () => {
  const md = ['## Intro', '', 'text', '', '## Citations', '', '[1] x'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.warnings.some((w) => w.code === 'unnumbered-section' && /Intro/.test(w.message)));
  assert.ok(!r.warnings.some((w) => /Citations/.test(w.message)), 'Citations is exempt');
});

test('article format does not flag plain prose or numbered headings', () => {
  const md = ['# Title', '', '## Some Heading', '', 'A paragraph with an @ symbol in it.', '', '## Another'].join('\n');
  const r = lintMarkdown(md, { format: 'article' });
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.warnings, []);
});

const { loadIconNames, formatDiagnostics } = require('../scripts/lint.js');

test('loadIconNames reads the real icon set', () => {
  const names = loadIconNames();
  assert.ok(names.includes('rocket'));
});

test('formatDiagnostics renders sorted, labeled lines', () => {
  const out = formatDiagnostics({
    errors: [{ line: 5, severity: 'error', code: 'missing-attr', message: 'x' }],
    warnings: [{ line: 2, severity: 'warning', code: 'unknown-icon', message: 'y' }],
  }, 'doc.md');
  const lines = out.split('\n');
  assert.ok(lines[0].includes('doc.md:2') && lines[0].includes('[unknown-icon]'));
  assert.ok(lines[1].includes('doc.md:5') && lines[1].includes('ERROR'));
});

test('--lint exits non-zero on a malformed file and does not build', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-lintcli-'));
  const mdPath = path.join(dir, 'bad.md');
  const outHtml = path.join(dir, 'out.html');
  fs.writeFileSync(mdPath, '<!-- @stats -->\n<!-- @stat value="3" label="x" source="y" -->'); // unclosed @stats
  const { main } = require('../scripts/build-doc.js');
  const origArgv = process.argv, origCode = process.exitCode;
  try {
    process.argv = ['node', 'build-doc.js', '--input', mdPath, '--out', outHtml, '--no-open', '--lint', '--no-config'];
    await main();
    assert.strictEqual(process.exitCode, 1, '--lint sets exit code 1 on errors');
    assert.ok(!fs.existsSync(outHtml), '--lint must not build');
  } finally {
    process.argv = origArgv; process.exitCode = origCode;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('--strict aborts a build with lint errors', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-strict-'));
  const mdPath = path.join(dir, 'bad.md');
  fs.writeFileSync(mdPath, '<!-- @stats -->'); // unclosed
  const { main } = require('../scripts/build-doc.js');
  const origArgv = process.argv;
  let threw = false;
  try {
    process.argv = ['node', 'build-doc.js', '--input', mdPath, '--out', path.join(dir, 'o.html'), '--no-open', '--strict', '--no-config'];
    await main();
  } catch (_) { threw = true; }
  finally { process.argv = origArgv; fs.rmSync(dir, { recursive: true, force: true }); }
  assert.ok(threw, '--strict must throw on lint errors');
});

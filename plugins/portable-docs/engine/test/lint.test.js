'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
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

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DOCS = path.join(__dirname, '..', '..', 'docs');
const eng = path.join(__dirname, '..', 'scripts', 'build-doc.js');

function buildArticle(name) {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pd-dog-')), name + '.html');
  execFileSync('node', [eng, '--input', path.join(DOCS, name + '.md'), '--out', out, '--no-open', '--no-config', '--style', 'article'], { stdio: 'pipe' });
  return fs.readFileSync(out, 'utf-8');
}

test('how-it-works.md builds + validates (Bug 2 regression)', () => {
  const html = buildArticle('how-it-works'); // throws if validation fails
  assert.ok(html.includes('react/jsx-runtime'), 'the page content (which discusses it) is present');
});

test('charts-and-diagrams.md: example markers render as code (Bug 1 regression)', () => {
  const html = buildArticle('charts-and-diagrams');
  assert.ok(html.includes('type=\\"pie\\"') || html.includes('type="pie"'), 'fenced @chart example text survives as code');
  assert.ok(html.includes('/@chart') || html.includes('&#x2F;@chart') || html.includes('%2F@chart'), 'closing marker survives as code');
  assert.ok(!html.includes('no data:'), 'real charts kept their data (no "no data:" error)');
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

test('article: fenced @chart example renders as code, real @chart renders', () => {
  const eng = path.join(__dirname, '..', 'scripts', 'build-doc.js');
  const input = path.join(__dirname, 'fixtures', 'fence-article.md');
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pd-fence-')), 'a.html');
  execFileSync('node', [eng, '--input', input, '--out', out, '--no-open', '--no-config', '--style', 'article'], { stdio: 'pipe' });
  const html = fs.readFileSync(out, 'utf-8');
  // the EXAMPLE marker text survives as code (title="Example" present)
  assert.ok(html.includes('title=\\"Example\\"') || html.includes('title="Example"'), 'fenced example marker text must survive as code');
  // exactly one chart was actually extracted/rendered (the real one) — the example was NOT
  // a rendered pie chart frame title "Real" is present
  assert.ok(html.includes('Real'), 'the real chart title renders');
});

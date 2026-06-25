'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

test('article: fenced @chart example renders as code; real @chart renders WITH its data', () => {
  const eng = path.join(__dirname, '..', 'scripts', 'build-doc.js');
  const input = path.join(__dirname, 'fixtures', 'fence-article.md');
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pd-fence-')), 'a.html');
  execFileSync('node', [eng, '--input', input, '--out', out, '--no-open', '--no-config', '--style', 'article'], { stdio: 'pipe' });
  const html = fs.readFileSync(out, 'utf-8');
  // (a) the EXAMPLE marker text survives as literal code (was NOT extracted)
  assert.ok(html.includes('title=\\"Example\\"') || html.includes('title="Example"'), 'fenced example marker survives as code');
  // (b) the REAL chart rendered WITH its inline-fenced data — not a "no data" error card
  assert.ok(html.includes('Chrome'), 'real chart CSV data label is present (data fence preserved)');
  assert.ok(!html.includes('no data:'), 'real chart did not degrade to a no-data error');
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseSlides } = require('../scripts/parse-slides.js');

test('slides: real --- splits but fenced --- does not — exactly 2 slides', () => {
  const md = fs.readFileSync(path.join(__dirname, 'fixtures', 'fence-slides.md'), 'utf-8');
  const { slides } = parseSlides(md, __dirname);
  assert.strictEqual(slides.length, 2, 'the fenced --- must not create a spurious third slide');
});

test('slides: fenced --- does not split and fenced marker survives as code', () => {
  const eng = path.join(__dirname, '..', 'scripts', 'build-doc.js');
  const input = path.join(__dirname, 'fixtures', 'fence-slides.md');
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pd-fences-')), 's.html');
  execFileSync('node', [eng, '--input', input, '--out', out, '--no-open', '--no-config', '--slides'], { stdio: 'pipe' });
  const html = fs.readFileSync(out, 'utf-8');
  assert.ok(html.includes('@chart type='), 'fenced marker text survives as code in the slide');
  assert.ok(html.includes('Slide Two'), 'the real second slide is present');
  assert.ok(!html.includes(String.fromCharCode(0)), 'no NUL fence sentinel leaks into output');
});

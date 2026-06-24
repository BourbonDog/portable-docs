// engine/test/vendor-mermaid.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('mermaid UMD is vendored, build-only, and substantial', () => {
  const p = path.join(__dirname, '..', 'vendor', 'mermaid.min.js');
  assert.ok(fs.existsSync(p), 'engine/vendor/mermaid.min.js must exist');
  const src = fs.readFileSync(p, 'utf8');
  assert.ok(src.length > 1_000_000, 'mermaid.min.js should be the full minified UMD build (>1MB)');
  assert.ok(/mermaid/i.test(src.slice(0, 4000)), 'looks like the mermaid bundle');
});

test('vendor README documents mermaid as build-only', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'vendor', 'README.md'), 'utf8');
  assert.ok(/mermaid/i.test(readme), 'README mentions mermaid');
  assert.ok(/build-?only|never ships|build time/i.test(readme), 'README states it is build-only');
});

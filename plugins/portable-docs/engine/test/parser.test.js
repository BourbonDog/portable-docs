const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { extractContent } = require('../src/utils/parser.js');
test('extractContent parses header + stats + sections', () => {
  const md = fs.readFileSync(path.join(__dirname, 'fixtures/sample.md'), 'utf8');
  const c = extractContent(md);
  assert.ok(c.header, 'header present');
  assert.ok(Array.isArray(c.stats), 'stats is an array');
  assert.ok(c.document.some(d => d.type === 'section'), 'has at least one section');
});

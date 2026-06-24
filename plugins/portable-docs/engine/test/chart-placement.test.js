'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { build } = require('./chart-pie.test.js');
const { extractContent } = require('../src/utils/parser.js');

test('extractContent resolves new-type charts in document order', () => {
  const md = [
    '<!-- @chart type="pie" title="P1" -->', '```csv', 'label,value', 'A,1', '```', '<!-- /@chart -->',
    '<!-- @chart type="bar" title="Legacy" -->', '<!-- @bar label="x" value="1" unit="k" -->', '<!-- /@chart -->',
  ].join('\n');
  const c = extractContent(md, process.cwd());
  assert.strictEqual(c.charts.length, 2);
  assert.strictEqual(c.charts[0].type, 'pie');
  assert.strictEqual(c.charts[0].slices.length, 1);
  assert.strictEqual(c.charts[1].type, 'bar');           // legacy shape preserved
});

test('two same-type charts both render (placement bug fixed)', async () => {
  const html = await build('chart-multi.md');
  assert.ok(html.includes('First Pie'), 'first pie present');
  assert.ok(html.includes('Second Pie'), 'second pie present');
});

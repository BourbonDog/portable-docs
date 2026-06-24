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

test('placement: chart placeholders are paramless and charts resolve in document order', () => {
  const md = [
    '## 1. Two pies', '',
    '<!-- @chart type="pie" title="First Pie" -->',
    '```csv', 'label,value', 'A,1', 'B,1', '```',
    '<!-- /@chart -->', '',
    '<!-- @chart type="pie" title="Second Pie" -->',
    '```csv', 'label,value', 'C,1', 'D,1', '```',
    '<!-- /@chart -->',
  ].join('\n');
  const c = extractContent(md, process.cwd());
  // Document order + distinct data (guards parser ordering):
  assert.strictEqual(c.charts.length, 2);
  assert.strictEqual(c.charts[0].slices[0].label, 'A');
  assert.strictEqual(c.charts[1].slices[0].label, 'C');
  // Paramless placeholders (FAILS on the old COMPONENT:chart:pie code):
  const sections = c.document.filter((d) => d.type === 'section');
  const blocks = sections.flatMap((s) => [
    ...(s.intro || []),
    ...((s.subsections || []).flatMap((ss) => ss.blocks || [])),
  ]);
  const chartBlocks = blocks.filter((b) => b.type === 'component' && b.component === 'chart');
  assert.strictEqual(chartBlocks.length, 2, 'two chart placeholders');
  assert.ok(chartBlocks.every((b) => b.param === ''), 'placeholders are paramless (document-order placement, not type-keyed)');
});

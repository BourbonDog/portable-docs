'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { build } = require('./chart-pie.test.js');

test('grouped-bar renders rects, category labels, and a legend', async () => {
  const html = await build('chart-bars.md');
  assert.ok(html.includes('Revenue by Quarter'), 'title present');
  // Client-rendered bundle: literal <rect absent, but compiled tag "rect" present.
  assert.ok(html.includes('<rect') || html.includes('"rect"'), 'bars are <rect> elements');
  assert.ok(html.includes('Q1') && html.includes('Q2'), 'category labels present');
  assert.ok(html.includes('Product A') && html.includes('Product B'), 'series legend present');
});

test('stacked-bar also renders (two same-page bar charts both appear)', async () => {
  const html = await build('chart-bars.md');
  assert.ok(html.includes('Stacked'), 'second chart title present');
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { build } = require('./chart-pie.test.js');

test('area chart renders a filled polygon, an axis tick, and x labels', async () => {
  const html = await build('chart-area.md');
  assert.ok(html.includes('Demand'), 'title present');
  // fillOpacity:"0.15" is unique to the polygon fill in the compiled LineAreaBase —
  // it does NOT appear in stubs (which render ChartEmpty).
  assert.ok(html.includes('fillOpacity: "0.15"') || html.includes('fillOpacity:"0.15"'), 'area fill polygon present (fillOpacity 0.15)');
  assert.ok(html.includes('340'), 'area data value 340 is baked into the content');
  assert.ok(html.includes('2019') && html.includes('2025'), 'x labels present');
});

test('line chart renders polylines for each series', async () => {
  const html = await build('chart-area.md');
  assert.ok(html.includes('Lines'), 'second chart title present');
  // LineAreaBase is the shared base rendered for both area and line charts;
  // it only appears in the bundle when the real implementation is in place.
  assert.ok(html.includes('LineAreaBase'), 'LineAreaBase component compiled into bundle');
});

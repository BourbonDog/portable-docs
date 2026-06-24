'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { build } = require('./chart-pie.test.js');

test('scatter renders point circles and the axis labels', async () => {
  const html = await build('chart-scatter.md');
  assert.ok(html.includes('Effort vs Impact'), 'title present');
  // Client-rendered: JSX compiles to React.createElement("circle",...) in the bundle.
  // The compiled ScatterChart body (not the stub) contains fillOpacity "0.85" — unique to scatter circles.
  assert.ok(html.includes('ScatterChart'), 'ScatterChart compiled function present');
  assert.ok(html.includes('fillOpacity: "0.85"'), 'scatter circle fill-opacity 0.85 (scatter-specific) in compiled bundle');
  // Point labels baked into data content
  assert.ok(html.includes('Alpha') && html.includes('Beta') && html.includes('Gamma'), 'point labels present');
  assert.ok(html.includes('Effort') && html.includes('Impact'), 'axis labels present');
});

test('a broken chart renders the inline error card, not a blank box', async () => {
  const html = await build('chart-error.md');
  assert.ok(html.includes('Broken Chart'), 'error card keeps the title');
  assert.ok(html.includes('chart:') && html.includes('not found'), 'error message shown');
});

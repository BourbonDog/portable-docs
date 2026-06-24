'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { build } = require('./chart-pie.test.js');

test('doctor charts fixture builds with an SVG chart', async () => {
  const html = await build('charts-doctor.md');
  assert.ok(html.includes('Self-test Pie'), 'chart title present');
  assert.ok(html.includes('<svg') && (html.includes('<path') || html.includes('"path"')), 'pie svg present');
});

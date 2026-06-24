'use strict';
/**
 * Task 16 — chart-showcase template build test.
 *
 * Builds the chart-showcase.md template end-to-end and asserts:
 *  1. All seven chart titles are present in the HTML output (positive signal).
 *  2. No error-message fragments are present (discriminating no-error check).
 *  3. Parser-level confirmation: every chart object has error === null.
 *
 * No-error assertion rationale:
 *   `html.includes('chart:')` would ALWAYS be true even for a healthy build
 *   because (a) the design-tokens icon map has a `chart:` key, and (b)
 *   ChartError's source contains `⚠ chart: `. Instead we check for the
 *   actual error-message fragments that charts.js emits on failure:
 *   "unknown chart type", "data file not found", and "no data: add".
 *   These strings are absent in the fully-resolved showcase output.
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE   = path.join(__dirname, '..');
const TEMPLATE = path.join(ENGINE, '..', 'templates', 'chart-showcase.md');

test('chart-showcase template builds with all chart types', async () => {
  // ── Build ──────────────────────────────────────────────────────────────────
  const tmpHtml = path.join(os.tmpdir(), `pd-showcase-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js',
      '--input', TEMPLATE, '--out', tmpHtml, '--no-open', '--no-config'];
    await main();
  } finally {
    process.argv = origArgv;
  }

  const html = fs.readFileSync(tmpHtml, 'utf8');

  // ── 1. All seven chart titles present ────────────────────────────────────
  for (const title of [
    'Browser Share', 'Budget Split', 'Revenue by Quarter', 'Headcount',
    'Demand Index', 'Two Series', 'Effort vs Impact',
  ]) {
    assert.ok(html.includes(title), `expected chart title "${title}" in output`);
  }

  // ── 2. No error-message fragments (discriminating no-error check) ─────────
  // These strings appear only when a chart fails to resolve; absent = all good.
  assert.ok(!html.includes('unknown chart type'),
    'no "unknown chart type" error cards in output');
  assert.ok(!html.includes('data file not found'),
    'no "data file not found" error cards in output');
  assert.ok(!html.includes('no data: add'),
    'no "no data: add" error cards in output');

  // ── 3. Parser-level: every chart has error === null ───────────────────────
  const { extractContent } = require(path.join(ENGINE, 'src/utils/parser.js'));
  const md = fs.readFileSync(TEMPLATE, 'utf8');
  const content = extractContent(md, path.dirname(TEMPLATE));
  assert.strictEqual(content.charts.length, 7, 'showcase has exactly 7 charts');
  for (const chart of content.charts) {
    assert.strictEqual(chart.error, null,
      `chart "${chart.title}" (${chart.type}) must resolve without error`);
  }
});

// This file replaced a byte-golden test against charts-legacy.golden.html.
// The output is a client-rendered bundle: every task that adds component source
// (Tasks 7-9 grow ChartsSVG; 10-12 touch App/parser) changes the bundle bytes,
// making cross-version byte-equality infeasible — it would force constant golden
// regeneration with no meaningful signal. This structural guard instead checks
// that all four legacy chart types still resolve their titles and representative
// data into the built output, which survives bundle growth.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ENGINE = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'charts-legacy.md');

async function buildLegacy() {
  const tmpHtml = path.join(os.tmpdir(), `pd-legacy-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', FIXTURE, '--out', tmpHtml, '--no-open', '--no-config'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('legacy charts: all four types resolve their data into the built output', async () => {
  const html = await buildLegacy();

  // growth chart
  assert.ok(html.includes('Demand'),    'growth chart title "Demand" must appear in output');
  assert.ok(html.includes('AI/ML roles'), 'growth chart series "AI/ML roles" must appear in output');

  // bar chart
  assert.ok(html.includes('Comp'),  'bar chart title "Comp" must appear in output');
  assert.ok(html.includes('Staff'), 'bar chart label "Staff" must appear in output');
  assert.ok(html.includes('230'),   'bar chart value "230" must appear in output');

  // hierarchy chart
  assert.ok(html.includes('Shift'),    'hierarchy chart title "Shift" must appear in output');
  assert.ok(html.includes('Judgment'), 'hierarchy chart level "Judgment" must appear in output');

  // range chart
  assert.ok(html.includes('Bands'),  'range chart title "Bands" must appear in output');
  assert.ok(html.includes('Senior'), 'range chart label "Senior" must appear in output');
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');
const { build } = require('./chart-pie.test.js');

const ENGINE = path.join(__dirname, '..');

test('--strict aborts when a chart has a data error', async () => {
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  let threw = false;
  let errMsg = '';
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(ENGINE, 'test/fixtures/chart-error.md'),
                    '--out', path.join(os.tmpdir(), `pd-strict-${process.hrtime.bigint()}.html`),
                    '--no-open', '--no-config', '--strict'];
    await main();
  } catch (e) { threw = true; errMsg = e.message || ''; } finally { process.argv = origArgv; }
  assert.ok(threw, '--strict must abort on a chart data error');
  assert.match(errMsg, /chart data error/i, 'abort must come from assertChartsStrict (not a lint bad-enum)');
});

test('without --strict the same chart builds (error card, no abort)', async () => {
  const html = await build('chart-error.md');
  assert.ok(html.includes('Broken Chart'), 'builds and shows the error card');
});

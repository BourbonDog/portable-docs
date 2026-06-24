'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ENGINE = path.join(__dirname, '..');

async function build(fixture) {
  const tmpHtml = path.join(os.tmpdir(), `pd-${path.basename(fixture, '.md')}-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(ENGINE, 'test/fixtures', fixture),
                    '--out', tmpHtml, '--no-open', '--no-config'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('pie chart renders SVG paths and a legend in the proposal', async () => {
  const html = await build('chart-pie.md');
  assert.ok(html.includes('Browser Share'), 'title present');
  assert.ok(html.includes('<svg'), 'svg present');
  assert.ok(html.includes('<path') || html.includes('"path"'), 'pie slices are <path> elements');
  assert.ok(html.includes('Chrome') && html.includes('Safari'), 'legend labels present');
  assert.ok(html.includes('65%') || html.includes('65 %'), 'percentage shown');
});

module.exports = { build };

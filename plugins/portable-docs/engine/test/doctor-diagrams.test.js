'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function build(fixture, args = []) {
  const ENGINE = path.join(__dirname, '..');
  const tmp = path.join(os.tmpdir(), `pd-doc-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(ENGINE, 'test', 'fixtures', fixture), '--out', tmp, '--no-open', '--no-config', ...args];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmp, 'utf8');
}

test('quadrant-doctor fixture builds with an SVG', async () => {
  const html = await build('quadrant-doctor.md');
  assert.ok(html.includes('Self-test Quadrant'), 'title present');
  assert.ok(html.includes('<svg'), 'quadrant svg present');
});

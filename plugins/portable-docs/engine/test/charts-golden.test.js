'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ENGINE = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'charts-legacy.md');
const GOLDEN = path.join(__dirname, 'fixtures', 'charts-legacy.golden.html');
const TIMESTAMP_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/g;
const normalize = (s) => s.replace(TIMESTAMP_RE, '<TIMESTAMP>');

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

test('legacy charts output is byte-stable against the golden', async () => {
  const html = normalize(await buildLegacy());
  assert.ok(fs.existsSync(GOLDEN), 'golden file must exist (generate it once with PD_WRITE_GOLDEN=1)');
  assert.strictEqual(html, normalize(fs.readFileSync(GOLDEN, 'utf8')),
    'legacy chart output changed — a later task altered the legacy render path');
});

// One-shot golden generator: PD_WRITE_GOLDEN=1 node --test test/charts-golden.test.js
test('generate golden when PD_WRITE_GOLDEN=1', async () => {
  if (process.env.PD_WRITE_GOLDEN !== '1') return;
  fs.writeFileSync(GOLDEN, await buildLegacy(), 'utf8');
});

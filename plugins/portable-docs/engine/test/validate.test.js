'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate } = require('../scripts/validate.js');

const ENGINE = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');

async function build() {
  const out = path.join(os.tmpdir(), `pd-validate-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const argv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', FIXTURE, '--out', out, '--no-open'];
    await main();
  } finally { process.argv = argv; }
  return out;
}

test('validate: a built offline doc passes all checks', async () => {
  const out = await build();
  const r = validate({ htmlPath: out });
  assert.ok(r.ok, 'built doc must pass: ' + r.errors.join('; '));
});

test('validate: an injected CDN reference fails', async () => {
  const good = fs.readFileSync(await build(), 'utf8');
  const tmp = path.join(os.tmpdir(), `pd-bad-cdn-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(tmp, good + '\n<script src="https://unpkg.com/react@18"></script>');
  assert.ok(!validate({ htmlPath: tmp }).ok, 'unpkg.com must fail validation');
});

test('validate: removing inlined React fails', async () => {
  const good = fs.readFileSync(await build(), 'utf8');
  const tmp = path.join(os.tmpdir(), `pd-no-react-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(tmp, good.split('react.production.min.js').join('REMOVED'));
  assert.ok(!validate({ htmlPath: tmp }).ok, 'missing React banner must fail');
});

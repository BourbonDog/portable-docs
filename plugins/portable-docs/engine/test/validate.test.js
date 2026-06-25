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

// --- Task 6: scoped validator tests ---

function writeHtml(body) {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pd-val-')), 'x.html');
  fs.writeFileSync(p, body);
  return p;
}
const SHELL_HEAD = '<!doctype html><html><head>' +
  '<script>/*! react.production.min.js */</script>' +
  '<script>/*! react-dom.production.min.js */</script>' +
  '</head><body><div id="root"></div>';

test('validate: forbidden tokens only as CONTENT pass', () => {
  // app script: content strings mention the forbidden tokens
  const app = '<script>ReactDOM.createRoot(document.getElementById("root")).render(' +
    'React.createElement("p", null, "There is no import React and no react/jsx-runtime; ' +
    'no unpkg.com, no @babel/standalone, no type=\\"text/babel\\"."));</script>';
  const p = writeHtml(SHELL_HEAD + app + '</body></html>');
  const r = validate({ htmlPath: p });
  assert.ok(r.ok, 'content-only mentions must pass: ' + JSON.stringify(r.errors));
});

test('validate: real CDN script still fails', () => {
  const head = SHELL_HEAD.replace('</head>', '<script src="https://unpkg.com/react"></script></head>');
  const app = '<script>ReactDOM.createRoot(document.getElementById("root")).render(React.createElement("p",null,"hi"));</script>';
  const r = validate({ htmlPath: writeHtml(head + app + '</body></html>') });
  assert.ok(!r.ok && r.errors.some(e => /unpkg/.test(e)), 'real unpkg CDN must fail');
});

test('validate: real uncompiled import in app body still fails', () => {
  const app = '<script>import React from "react";\nReactDOM.createRoot(document.getElementById("root")).render(React.createElement("p",null,"hi"));</script>';
  const r = validate({ htmlPath: writeHtml(SHELL_HEAD + app + '</body></html>') });
  assert.ok(!r.ok && r.errors.some(e => /import React/.test(e)), 'real ESM import must fail');
});

test('validate: real text/babel script still fails', () => {
  const head = SHELL_HEAD.replace('</head>', '<script type="text/babel">x</script></head>');
  const app = '<script>ReactDOM.createRoot(document.getElementById("root")).render(React.createElement("p",null,"hi"));</script>';
  const r = validate({ htmlPath: writeHtml(head + app + '</body></html>') });
  assert.ok(!r.ok && r.errors.some(e => /text\/babel/.test(e)), 'real text/babel must fail');
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { RELOAD_CLIENT, injectReloadClient, sseFrame, debounce } = require('../scripts/watch.js');

test('injectReloadClient inserts the client before </body>', () => {
  const out = injectReloadClient('<html><body><h1>Hi</h1></body></html>');
  assert.ok(out.includes(RELOAD_CLIENT), 'client present');
  assert.ok(out.indexOf(RELOAD_CLIENT) < out.indexOf('</body>'), 'before </body>');
  assert.ok(out.startsWith('<html><body><h1>Hi</h1>'), 'original body preserved');
});

test('injectReloadClient appends when there is no </body>', () => {
  const out = injectReloadClient('<div>no body tag</div>');
  assert.ok(out.endsWith(RELOAD_CLIENT));
});

test('sseFrame formats data and optional event; collapses newlines', () => {
  assert.strictEqual(sseFrame('reload'), 'data: reload\n\n');
  assert.strictEqual(sseFrame('a\nb', 'builderror'), 'event: builderror\ndata: a | b\n\n');
});

test('debounce coalesces rapid calls into one', async () => {
  let n = 0;
  const d = debounce(() => { n++; }, 20);
  d(); d(); d();
  await new Promise((r) => setTimeout(r, 40));
  assert.strictEqual(n, 1);
  d(); d.cancel();
  await new Promise((r) => setTimeout(r, 40));
  assert.strictEqual(n, 1, 'cancel prevents the pending call');
});

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

// Integration test — requires startWatch (Task 9)
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { startWatch } = require('../scripts/watch.js');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

test('startWatch serves injected HTML and closes cleanly', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-watchsrv-'));
  const htmlPath = path.join(dir, 'out.html');
  const onDisk = '<html><body><h1>Doc</h1></body></html>';
  fs.writeFileSync(htmlPath, onDisk);

  const { port, close } = await startWatch({ htmlPath, watchPaths: [], rebuild: async () => {} });
  try {
    const res = await fetchText(`http://127.0.0.1:${port}/`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes("EventSource('/__pd_reload')"), 'reload client injected');
    assert.ok(res.body.includes('<h1>Doc</h1>'), 'original content served');
    assert.notStrictEqual(res.body, onDisk, 'served body differs from on-disk file');
    assert.strictEqual(fs.readFileSync(htmlPath, 'utf8'), onDisk, 'on-disk file unchanged');
  } finally {
    await close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

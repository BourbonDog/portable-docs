'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ENGINE = path.join(__dirname, '..');
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('build: a local article image is inlined as a data URI', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-imgbuild-'));
  fs.writeFileSync(path.join(dir, 'pic.png'), Buffer.from(PNG_B64, 'base64'));
  fs.writeFileSync(path.join(dir, 'a.md'), '# Doc\n\n*sub*\n\n## Section\n\n![cap](pic.png)\n');
  const out = path.join(dir, 'a.html');
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const argv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(dir, 'a.md'), '--out', out, '--style', 'article', '--no-open'];
    await main();
  } finally { process.argv = argv; }
  const html = fs.readFileSync(out, 'utf8');
  assert.ok(html.includes('data:image/png;base64'), 'local image must be inlined as a data URI');
  assert.ok(!html.includes('](pic.png)') && !html.includes('"pic.png"'), 'raw local path must not survive');
});

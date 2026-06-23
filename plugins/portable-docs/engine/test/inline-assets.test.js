'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { inlineLocalImages, inlineRef } = require('../scripts/inline-assets.js');

// 1x1 transparent PNG
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
function tmpWithPng() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-img-'));
  fs.writeFileSync(path.join(dir, 'dot.png'), Buffer.from(PNG_B64, 'base64'));
  return dir;
}

test('inlineRef: a local png becomes a data URI', () => {
  const dir = tmpWithPng();
  assert.ok(inlineRef('dot.png', dir).startsWith('data:image/png;base64,'), 'local png → data URI');
});
test('inlineRef: remote and data refs are untouched', () => {
  assert.strictEqual(inlineRef('https://x/y.png', os.tmpdir()), 'https://x/y.png');
  assert.strictEqual(inlineRef('data:image/png;base64,AAA', os.tmpdir()), 'data:image/png;base64,AAA');
});
test('inlineRef: a missing local file is left as-is', () => {
  assert.strictEqual(inlineRef('nope.png', os.tmpdir()), 'nope.png');
});
test('inlineLocalImages: walks header images and image blocks', () => {
  const dir = tmpWithPng();
  const content = {
    header: { headshot: 'dot.png', logo: 'https://x/l.png' },
    sections: [{ blocks: [{ type: 'image', src: 'dot.png' }, { type: 'paragraph', text: 'hi' }] }],
  };
  inlineLocalImages(content, dir);
  assert.ok(content.header.headshot.startsWith('data:image/png'), 'headshot inlined');
  assert.strictEqual(content.header.logo, 'https://x/l.png', 'remote logo untouched');
  assert.ok(content.sections[0].blocks[0].src.startsWith('data:image/png'), 'image block inlined');
});

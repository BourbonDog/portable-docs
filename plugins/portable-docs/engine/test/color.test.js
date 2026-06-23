'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { normalizeHex, mixHex, lighten } = require('../src/color.js');

test('normalizeHex expands 3-digit to 6-digit uppercase', () => {
  assert.strictEqual(normalizeHex('#e33'), '#EE3333');
});
test('normalizeHex drops alpha from 4- and 8-digit hex', () => {
  assert.strictEqual(normalizeHex('#e33a'), '#EE3333');
  assert.strictEqual(normalizeHex('#EE3333FF'), '#EE3333');
});
test('normalizeHex tolerates a missing leading hash', () => {
  assert.strictEqual(normalizeHex('EE3333'), '#EE3333');
});
test('mixHex blends black and white at 50% to mid grey', () => {
  assert.strictEqual(mixHex('#000000', '#FFFFFF', 0.5), '#808080');
});
test('lighten with amount 0 is identity (normalized)', () => {
  assert.strictEqual(lighten('#5B21B6', 0), '#5B21B6');
});
test('lighten with amount 1 is white', () => {
  assert.strictEqual(lighten('#5B21B6', 1), '#FFFFFF');
});
test('lighten produces a value distinct from and lighter than input', () => {
  const out = lighten('#5B21B6', 0.2);
  assert.notStrictEqual(out, '#5B21B6');
  assert.match(out, /^#[0-9A-F]{6}$/);
});

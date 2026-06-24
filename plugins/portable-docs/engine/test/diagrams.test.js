'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadJsonData } = require('../src/utils/charts.js');

test('loadJsonData: inline fenced json object', () => {
  const body = '\n```json\n{ "a": 1, "b": [2,3] }\n```\n';
  const r = loadJsonData({ body, baseDir: process.cwd() });
  assert.deepStrictEqual(r.data, { a: 1, b: [2, 3] });
  assert.ok(!r.error);
});

test('loadJsonData: src= file wins over body and resolves relative to baseDir', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-json-'));
  fs.writeFileSync(path.join(dir, 'f.json'), '{ "fromFile": true }');
  const r = loadJsonData({ src: 'f.json', body: '```json\n{"fromBody":true}\n```', baseDir: dir });
  assert.deepStrictEqual(r.data, { fromFile: true });
});

test('loadJsonData: missing src file → error (no throw)', () => {
  const r = loadJsonData({ src: 'nope.json', body: '', baseDir: process.cwd() });
  assert.ok(r.error && /not found/i.test(r.error));
});

test('loadJsonData: no src and no fence → error', () => {
  const r = loadJsonData({ body: 'just prose', baseDir: process.cwd() });
  assert.ok(r.error && /no data/i.test(r.error));
});

test('loadJsonData: malformed json → error (no throw)', () => {
  const r = loadJsonData({ body: '```json\n{ bad,, }\n```', baseDir: process.cwd() });
  assert.ok(r.error && /parse/i.test(r.error));
});

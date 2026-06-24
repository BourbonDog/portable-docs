'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { parseCsv } = require('../src/utils/charts.js');

test('parseCsv: header + simple rows', () => {
  const r = parseCsv('label,value\nChrome,65\nSafari,18');
  assert.deepStrictEqual(r.columns, ['label', 'value']);
  assert.deepStrictEqual(r.rows, [['Chrome', '65'], ['Safari', '18']]);
});

test('parseCsv: quoted field with comma', () => {
  const r = parseCsv('label,value\n"Smith, J.",10');
  assert.deepStrictEqual(r.rows, [['Smith, J.', '10']]);
});

test('parseCsv: quoted field with embedded newline and escaped quote', () => {
  const r = parseCsv('a,b\n"line1\nline2","say ""hi"""');
  assert.deepStrictEqual(r.rows, [['line1\nline2', 'say "hi"']]);
});

test('parseCsv: CRLF and trailing blank line tolerated', () => {
  const r = parseCsv('x,y\r\n1,2\r\n\r\n');
  assert.deepStrictEqual(r.columns, ['x', 'y']);
  assert.deepStrictEqual(r.rows, [['1', '2']]);
});

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadChartData } = require('../src/utils/charts.js');

test('loadChartData: inline csv fence', () => {
  const body = '\n```csv\nlabel,value\nA,1\nB,2\n```\n';
  const r = loadChartData({ src: '', body, baseDir: os.tmpdir() });
  assert.deepStrictEqual(r.columns, ['label', 'value']);
  assert.strictEqual(r.rows.length, 2);
});

test('loadChartData: inline json fence (array of objects)', () => {
  const body = '\n```json\n[{"label":"A","value":1},{"label":"B","value":2}]\n```\n';
  const r = loadChartData({ src: '', body, baseDir: os.tmpdir() });
  assert.deepStrictEqual(r.columns, ['label', 'value']);
  assert.deepStrictEqual(r.rows, [['A', '1'], ['B', '2']]);
});

test('loadChartData: src file wins over fence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-csv-'));
  fs.writeFileSync(path.join(dir, 'd.csv'), 'label,value\nFromFile,9');
  const body = '\n```csv\nlabel,value\nFromFence,1\n```\n';
  const r = loadChartData({ src: 'd.csv', body, baseDir: dir });
  assert.deepStrictEqual(r.rows, [['FromFile', '9']]);
});

test('loadChartData: missing src file → error object (no throw)', () => {
  const r = loadChartData({ src: 'nope.csv', body: '', baseDir: os.tmpdir() });
  assert.ok(/not found/.test(r.error));
});

test('loadChartData: no data at all → error', () => {
  const r = loadChartData({ src: '', body: 'no fence here', baseDir: os.tmpdir() });
  assert.ok(/no data/.test(r.error));
});

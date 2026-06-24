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

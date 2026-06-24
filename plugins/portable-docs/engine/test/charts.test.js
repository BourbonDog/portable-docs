'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseCsv, loadChartData, normalizeChartData, parseChartBlock, extractChartPlaceholders, NEW_CHART_TYPES } = require('../src/utils/charts.js');

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

test('NEW_CHART_TYPES has the seven new types', () => {
  assert.deepStrictEqual(NEW_CHART_TYPES,
    ['pie', 'donut', 'grouped-bar', 'stacked-bar', 'area', 'line', 'scatter']);
});

test('normalize pie → slices with numeric values', () => {
  const r = normalizeChartData('pie', ['label', 'value'], [['A', '65'], ['B', '35']]);
  assert.deepStrictEqual(r.slices, [
    { label: 'A', value: 65, color: '' },
    { label: 'B', value: 35, color: '' },
  ]);
});

test('normalize grouped-bar → categories + series (wide format)', () => {
  const r = normalizeChartData('grouped-bar', ['quarter', 'A', 'B'], [['Q1', '1', '2'], ['Q2', '3', '4']]);
  assert.deepStrictEqual(r.categories, ['Q1', 'Q2']);
  assert.deepStrictEqual(r.series, [
    { name: 'A', values: [1, 3] },
    { name: 'B', values: [2, 4] },
  ]);
});

test('normalize scatter → numeric points with optional label/series', () => {
  const r = normalizeChartData('scatter', ['x', 'y', 'label'], [['3.5', '40', 'Alpha']]);
  assert.deepStrictEqual(r.points, [{ x: 3.5, y: 40, label: 'Alpha', series: '' }]);
});

test('normalize: wrong column count → error', () => {
  const r = normalizeChartData('pie', ['label'], [['A']]);
  assert.ok(/expects/.test(r.error));
});

test('parseChartBlock: pie with inline fence resolves end-to-end', () => {
  const block = [
    '<!-- @chart type="pie" title="Share" subtitle="Q2" -->',
    '```csv',
    'label,value',
    'Chrome,65',
    'Safari,35',
    '```',
    '<!-- /@chart -->',
  ].join('\n');
  const c = parseChartBlock(block, process.cwd());
  assert.strictEqual(c.type, 'pie');
  assert.strictEqual(c.title, 'Share');
  assert.strictEqual(c.error, null);
  assert.strictEqual(c.slices.length, 2);
});

test('parseChartBlock: unknown type → error object', () => {
  const c = parseChartBlock('<!-- @chart type="bogus" -->\n<!-- /@chart -->', process.cwd());
  assert.ok(/unknown chart type/.test(c.error));
});

test('parseChartBlock: new-type chart with no data → error object', () => {
  const c = parseChartBlock('<!-- @chart type="pie" title="x" -->\n<!-- /@chart -->', process.cwd());
  assert.ok(/no data/.test(c.error));
});

test('extractChartPlaceholders: replaces blocks with sentinels in order', () => {
  const text = [
    'intro',
    '<!-- @chart type="pie" -->',
    '```csv',
    'label,value',
    'A,1',
    '```',
    '<!-- /@chart -->',
    'middle',
    '<!-- @chart type="bogus" -->',
    '<!-- /@chart -->',
    'end',
  ].join('\n');
  const { text: out, charts } = extractChartPlaceholders(text, process.cwd());
  assert.ok(out.includes('[[CHART:0]]'));
  assert.ok(out.includes('[[CHART:1]]'));
  assert.ok(!out.includes('@chart'));
  assert.strictEqual(charts.length, 2);
  assert.strictEqual(charts[0].type, 'pie');
  assert.ok(/unknown chart type/.test(charts[1].error));
});

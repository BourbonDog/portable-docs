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

const { parseFlowBlock, extractFlowPlaceholders, FLOW_BLOCK_RE } = require('../src/utils/diagrams.js');

const FLOW_OK = [
  '<!-- @flow title="Arch" -->',
  '```json',
  '{ "systemName":"Hindsight","accentColor":"#5b21b6",',
  '  "tabs":[{"label":"Ingest","stages":[',
  '    {"label":"Input","type":"input"},',
  '    {"label":"Para","lanes":[{"label":"Embed","type":"process"},{"label":"Extract","type":"llm"}]},',
  '    {"label":"Store","type":"store"}]}],',
  '  "callouts":[{"title":"Unique","text":"Dual write."}] }',
  '```',
  '<!-- /@flow -->',
].join('\n');

test('parseFlowBlock: resolves a valid flow', () => {
  const f = parseFlowBlock(FLOW_OK, process.cwd());
  assert.strictEqual(f.kind, 'flow');
  assert.strictEqual(f.error, null);
  assert.strictEqual(f.systemName, 'Hindsight');
  assert.strictEqual(f.tabs.length, 1);
  assert.strictEqual(f.tabs[0].stages.length, 3);
  assert.strictEqual(f.callouts[0].title, 'Unique');
  assert.strictEqual(f.title, 'Arch');
});

test('parseFlowBlock: missing tabs → error (no throw)', () => {
  const block = '<!-- @flow -->\n```json\n{ "systemName":"X" }\n```\n<!-- /@flow -->';
  const f = parseFlowBlock(block, process.cwd());
  assert.ok(f.error && /tabs/i.test(f.error));
});

test('parseFlowBlock: bad json → error', () => {
  const block = '<!-- @flow -->\n```json\n{ nope,, }\n```\n<!-- /@flow -->';
  const f = parseFlowBlock(block, process.cwd());
  assert.ok(f.error && /parse/i.test(f.error));
});

test('extractFlowPlaceholders: emits ordered [[FLOW:N]] sentinels', () => {
  const md = `a\n${FLOW_OK}\nb\n${FLOW_OK}\nc`;
  const { text, flows } = extractFlowPlaceholders(md, process.cwd());
  assert.strictEqual(flows.length, 2);
  assert.ok(text.includes('[[FLOW:0]]'));
  assert.ok(text.includes('[[FLOW:1]]'));
  assert.ok(!/@flow/.test(text), 'flow blocks are replaced');
});

test('FLOW_BLOCK_RE matches a paired block', () => {
  FLOW_BLOCK_RE.lastIndex = 0;
  assert.ok(FLOW_BLOCK_RE.test(FLOW_OK));
});

test('parseFlowBlock: CRLF body still resolves', () => {
  const f = parseFlowBlock(FLOW_OK.replace(/\n/g, '\r\n'), process.cwd());
  assert.strictEqual(f.error, null);
  assert.strictEqual(f.systemName, 'Hindsight');
});

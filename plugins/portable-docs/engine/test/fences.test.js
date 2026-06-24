'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { maskFences } = require('../src/utils/fences.js');

test('no-op on text without fences (byte-identical)', () => {
  const t = 'hello\n\n## 1. Section\n\n<!-- @stats -->\nreal marker\n';
  const { masked } = maskFences(t);
  assert.strictEqual(masked, t);
});

test('round-trip identity restores exactly', () => {
  const t = 'before\n```js\n<!-- @chart type="pie" -->\n```\nafter\n';
  const { masked, restore } = maskFences(t);
  assert.strictEqual(restore(masked), t);
});

test('masks a fenced block so a marker inside is hidden', () => {
  const t = 'p\n```\n<!-- @chart type="pie" -->\n<!-- /@chart -->\n```\nq';
  const { masked } = maskFences(t);
  assert.ok(!masked.includes('@chart'), 'fenced @chart must be masked');
  assert.ok(masked.includes('p') && masked.includes('q'), 'surrounding text survives');
});

test('a real marker OUTSIDE a fence is left untouched', () => {
  const t = '```\n<!-- @stats -->\n```\n\n<!-- @stats -->\nreal\n<!-- /@stats -->';
  const { masked } = maskFences(t);
  // the fenced @stats is masked; the unfenced opening marker survives exactly once
  assert.strictEqual((masked.match(/<!-- @stats -->/g) || []).length, 1);
  assert.ok(masked.includes('real'), 'unfenced marker body survives');
});

test('handles ~~~ fences and info strings', () => {
  const t = '~~~markdown\n<!-- @mermaid -->\n~~~\n';
  const { masked, restore } = maskFences(t);
  assert.ok(!masked.includes('@mermaid'));
  assert.strictEqual(restore(masked), t);
});

test('nested fences: 4-backtick outer swallows 3-backtick inner', () => {
  const t = '````markdown\n```csv\nlabel,value\n```\n<!-- @chart -->\n````\n';
  const { masked, restore } = maskFences(t);
  assert.ok(!masked.includes('@chart'), 'inner content masked as one span');
  assert.strictEqual(restore(masked), t);
});

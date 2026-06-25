'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { maskFencedMarkers } = require('../src/utils/fences.js');

test('no-op when no marker comment is inside a fence (byte-identical)', () => {
  const t = 'hello\n\n## 1. Section\n\n<!-- @stats -->\nreal\n<!-- /@stats -->\n';
  const { masked } = maskFencedMarkers(t);
  assert.strictEqual(masked, t);
});

test('round-trip identity restores exactly', () => {
  const t = 'before\n```js\n<!-- @chart type="pie" -->\n```\nafter\n';
  const { masked, restore } = maskFencedMarkers(t);
  assert.strictEqual(restore(masked), t);
});

test('a marker comment INSIDE a fence is neutralized; the fence survives', () => {
  const t = 'p\n```\n<!-- @chart type="pie" -->\n<!-- /@chart -->\n```\nq';
  const { masked } = maskFencedMarkers(t);
  assert.ok(!masked.includes('@chart'), 'in-fence marker comment is masked');
  assert.ok(masked.includes('```'), 'the fence delimiters survive');
  assert.ok(masked.includes('p') && masked.includes('q'), 'surrounding text survives');
});

test('CRITICAL: a real marker with an inline data fence is fully preserved', () => {
  // markers are top-level; the ```csv``` is the marker's DATA, not an example fence.
  const t = '<!-- @chart type="pie" title="Real" -->\n```csv\nlabel,value\nChrome,70\n```\n<!-- /@chart -->';
  const { masked } = maskFencedMarkers(t);
  assert.strictEqual(masked, t, 'real marker comments AND their data fence are untouched');
});

test('a real marker OUTSIDE a fence survives while a fenced example marker is masked', () => {
  const t = '```\n<!-- @stats -->\n```\n\n<!-- @stats -->\nreal\n<!-- /@stats -->';
  const { masked } = maskFencedMarkers(t);
  assert.strictEqual((masked.match(/<!-- @stats -->/g) || []).length, 1, 'only the unfenced @stats open survives');
  assert.ok(masked.includes('<!-- /@stats -->'), 'the unfenced @stats close survives');
});

test('handles ~~~ fences', () => {
  const t = '~~~markdown\n<!-- @mermaid -->\n~~~\n';
  const { masked, restore } = maskFencedMarkers(t);
  assert.ok(!masked.includes('@mermaid'), 'in-fence marker masked');
  assert.ok(masked.includes('~~~'), 'fence survives');
  assert.strictEqual(restore(masked), t);
});

test('nested fences: 4-backtick outer masks the example markers; inner data fence preserved', () => {
  const t = '````markdown\n<!-- @chart -->\n```csv\nlabel,value\n```\n<!-- /@chart -->\n````\n';
  const { masked, restore } = maskFencedMarkers(t);
  assert.ok(!masked.includes('@chart'), 'example marker comments masked');
  assert.ok(masked.includes('```csv'), 'inner data fence preserved as code');
  assert.strictEqual(restore(masked), t);
});

test('sentinel does not collide with literal "PDMARK0" in prose', () => {
  const t = 'mentions PDMARK0 here\n\n```\n<!-- @x -->\n```\nend';
  const { masked, restore } = maskFencedMarkers(t);
  assert.ok(masked.includes('PDMARK0 here'), 'prose mention untouched');
  assert.strictEqual(restore(masked), t);
});

// engine/test/quadrant.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'QuadrantChart.jsx'), 'utf8');

test('QuadrantChart takes a single `data` prop and guards data.error', () => {
  assert.ok(/const QuadrantChart = \(\{ data \}\)/.test(SRC), 'signature is ({ data })');
  assert.ok(/data\.error/.test(SRC), 'checks data.error');
  assert.ok(/DiagramError/.test(SRC) && /kind="quadrant"/.test(SRC), 'renders DiagramError kind="quadrant"');
});

test('QuadrantChart retains its own IntersectionObserver', () => {
  assert.ok(/IntersectionObserver/.test(SRC), 'uses its own IntersectionObserver');
});

test('QuadrantChart imports DiagramError', () => {
  assert.ok(/import DiagramError from ['"]\.\/DiagramError['"]/.test(SRC), 'imports DiagramError');
});

test('QuadrantChart calls hooks before any conditional return (Rules of Hooks)', () => {
  const firstHook = SRC.search(/use(State|Ref|Effect)\s*\(/);
  const errorReturn = SRC.search(/if \(data && data\.error\) return/);
  assert.ok(firstHook !== -1 && errorReturn !== -1 && firstHook < errorReturn,
    'all hooks must be declared before the data.error early return');
});

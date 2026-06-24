// engine/test/flow.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'FlowDiagram.jsx'), 'utf8');

test('FlowDiagram no longer references the undefined useInView hook', () => {
  assert.ok(!/useInView/.test(SRC), 'useInView must be gone (inline IntersectionObserver instead)');
  assert.ok(/IntersectionObserver/.test(SRC), 'uses its own IntersectionObserver');
});

test('FlowDiagram takes a single `data` prop and guards data.error', () => {
  assert.ok(/const FlowDiagram = \(\{ data \}\)/.test(SRC), 'signature is ({ data })');
  assert.ok(/data\.error/.test(SRC), 'checks data.error');
  assert.ok(/DiagramError/.test(SRC) && /kind="flow"/.test(SRC), 'renders DiagramError kind="flow"');
});

test('FlowDiagram imports React state/effect/ref hooks (not useInView)', () => {
  assert.ok(/useState, useEffect, useRef/.test(SRC), 'imports useState/useEffect/useRef');
});

test('FlowDiagram calls hooks before any conditional return (Rules of Hooks)', () => {
  const firstHook = SRC.search(/use(State|Ref|Effect)\s*\(/);
  const errorReturn = SRC.search(/if \(data && data\.error\) return/);
  assert.ok(firstHook !== -1 && errorReturn !== -1 && firstHook < errorReturn,
    'all hooks must be declared before the data.error early return');
});

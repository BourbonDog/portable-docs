'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { compileToJs } = require('../scripts/compile-jsx.js');

test('compileToJs turns JSX into React.createElement, no raw JSX remains', () => {
  const out = compileToJs('const App = () => <div className="x">hi</div>;');
  assert.ok(out.includes('React.createElement'), 'must emit React.createElement');
  assert.ok(!out.includes('<div'), 'no raw JSX tag may remain');
});
test('compileToJs does not inject ESM imports (classic runtime)', () => {
  const out = compileToJs('const App = () => <span>{1 + 2}</span>;');
  assert.ok(!out.includes('import'), 'classic runtime must not inject imports');
  assert.ok(!out.includes('react/jsx-runtime'), 'no automatic-runtime import');
});
test('compileToJs passes plain JS through', () => {
  const out = compileToJs('const x = 1 + 2;');
  assert.ok(/1 ?\+ ?2/.test(out), 'plain JS preserved');
});

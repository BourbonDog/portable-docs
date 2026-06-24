'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('DiagramError source renders kind + message and uses warning tokens', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'DiagramError.jsx'), 'utf8');
  assert.ok(/⚠ \{kind\}: \{message\}/.test(src), 'shows "⚠ {kind}: {message}"');
  assert.ok(/COLORS\.semantic\.warning/.test(src), 'uses semantic.warning');
  assert.ok(/export default/.test(src), 'has a default export');
});

test('DiagramError is exported from components/index.js', () => {
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'index.js'), 'utf8');
  assert.ok(/DiagramError/.test(idx), 'index re-exports DiagramError');
});

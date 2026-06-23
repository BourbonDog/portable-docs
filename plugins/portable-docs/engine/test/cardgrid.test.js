'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ENGINE = path.join(__dirname, '..');
const CARDGRID_SRC = path.join(ENGINE, 'src', 'components', 'CardGrid.jsx');

test('cardgrid source: no hardcoded white literals remain', () => {
  const src = fs.readFileSync(CARDGRID_SRC, 'utf8');
  assert.ok(!src.includes('#FFFFFF'), 'CardGrid.jsx must not hardcode #FFFFFF');
  assert.ok(!src.includes('rgba(255,255,255'), 'CardGrid.jsx must not hardcode rgba white');
});

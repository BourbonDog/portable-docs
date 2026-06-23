'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const VENDOR = path.join(__dirname, '..', 'vendor');

test('vendor: react UMD present with banner marker', () => {
  const p = path.join(VENDOR, 'react.production.min.js');
  assert.ok(fs.existsSync(p), 'react.production.min.js must exist');
  const s = fs.readFileSync(p, 'utf8');
  assert.ok(s.length > 8000, 'react UMD looks too small');
  assert.ok(s.includes('react.production.min.js'), 'react banner marker present');
});
test('vendor: react-dom UMD present with banner marker', () => {
  const p = path.join(VENDOR, 'react-dom.production.min.js');
  assert.ok(fs.existsSync(p), 'react-dom.production.min.js must exist');
  const s = fs.readFileSync(p, 'utf8');
  assert.ok(s.length > 100000, 'react-dom UMD looks too small');
  assert.ok(s.includes('react-dom.production.min.js'), 'react-dom banner marker present');
});
test('vendor: babel standalone present and large', () => {
  const p = path.join(VENDOR, 'babel.min.js');
  assert.ok(fs.existsSync(p), 'babel.min.js must exist');
  assert.ok(fs.statSync(p).size > 1000000, 'babel.min.js looks too small');
});

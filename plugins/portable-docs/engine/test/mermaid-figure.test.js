// engine/test/mermaid-figure.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'MermaidFigure.jsx'), 'utf8');

test('MermaidFigure injects svg only on the success path', () => {
  assert.ok(/dangerouslySetInnerHTML=\{\{ __html: data\.svg \}\}/.test(SRC), 'injects data.svg');
  assert.ok(/data\.error/.test(SRC), 'branches on error');
  assert.ok(/<pre/.test(SRC), 'fallback renders a <pre> of the source');
});

test('MermaidFigure never injects the raw source — fallback is escaped JSX', () => {
  // The security invariant: injection is ONLY ever paired with data.svg (the
  // build-time, strict-sanitized SVG), never with data.source (raw author text).
  assert.ok(!/__html:\s*data\.source/.test(SRC), 'raw source must never go through dangerouslySetInnerHTML');
  assert.ok(/<pre[\s\S]*\{data\.source\}[\s\S]*<\/pre>/.test(SRC), 'fallback renders {data.source} as escaped JSX children');
});

test('MermaidFigure documents the dangerouslySetInnerHTML rationale', () => {
  assert.ok(/securityLevel|build-time|trusted/i.test(SRC), 'docblock justifies the injection');
});

test('MermaidFigure is exported from components/index.js', () => {
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'index.js'), 'utf8');
  assert.ok(/MermaidFigure/.test(idx));
});

// engine/test/flow-quadrant-proposal.test.js
// Task 9: @flow / @quadrant wired into the PROPOSAL pipeline.
// Tests that extractContent populates content.flows / content.quadrants and
// that parseContentBlocks emits <!--COMPONENT:flow--> / <!--COMPONENT:quadrant-->
// placeholders which get baked into the built HTML CONTENT snapshot.
'use strict';
const test   = require('node:test');
const assert = require('node:assert');
const { build } = require('./chart-pie.test.js');

test('flow data is baked into the proposal HTML output', async () => {
  const html = await build('diagrams-proposal.md');
  assert.ok(html.includes('TestSystem'), 'flow systemName baked into output');
});

test('quadrant data is baked into the proposal HTML output', async () => {
  const html = await build('diagrams-proposal.md');
  assert.ok(html.includes('Positioning Map'), 'quadrant title baked into output');
  assert.ok(html.includes('Leaders'), 'quadrant label baked into output');
});

test('a malformed @flow block bakes the error message into the output', async () => {
  const html = await build('diagrams-proposal.md');
  assert.ok(html.includes('flow expects'), 'flow error message baked into output for the bad block');
});

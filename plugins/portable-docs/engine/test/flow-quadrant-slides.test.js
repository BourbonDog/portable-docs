// engine/test/flow-quadrant-slides.test.js
// Task 11: @flow / @quadrant wired into the SLIDES pipeline.
// Tests that parseSlides populates content.flows / content.quadrants and that
// the SENTINEL mechanism consumes [[FLOW:N]] / [[QUADRANT:N]] into typed blocks
// baked into the built HTML CONTENT snapshot.
'use strict';
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE = path.join(__dirname, '..');

async function buildSlides(fixture) {
  const tmpHtml = path.join(os.tmpdir(), `pd-deck-diag-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(ENGINE, 'test/fixtures', fixture),
                    '--out', tmpHtml, '--slides', '--no-open', '--no-config'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('parseSlides pre-extracts @flow blocks into flows array', () => {
  const { parseSlides } = require(path.join(ENGINE, 'scripts/parse-slides.js'));
  const md = fs.readFileSync(path.join(ENGINE, 'test/fixtures/diagrams-slides.md'), 'utf8');
  const content = parseSlides(md, path.join(ENGINE, 'test/fixtures'));
  assert.ok(Array.isArray(content.flows), 'content.flows must be an array');
  assert.strictEqual(content.flows.length, 1, 'one @flow block extracted');
  assert.strictEqual(content.flows[0].systemName, 'Hindsight', 'flow systemName correct');
});

test('parseSlides pre-extracts @quadrant blocks into quadrants array', () => {
  const { parseSlides } = require(path.join(ENGINE, 'scripts/parse-slides.js'));
  const md = fs.readFileSync(path.join(ENGINE, 'test/fixtures/diagrams-slides.md'), 'utf8');
  const content = parseSlides(md, path.join(ENGINE, 'test/fixtures'));
  assert.ok(Array.isArray(content.quadrants), 'content.quadrants must be an array');
  assert.strictEqual(content.quadrants.length, 1, 'one @quadrant block extracted');
  assert.strictEqual(content.quadrants[0].title, 'Positioning', 'quadrant title correct');
});

test('parseSlides emits flow and quadrant typed blocks on the correct slides', () => {
  const { parseSlides } = require(path.join(ENGINE, 'scripts/parse-slides.js'));
  const md = fs.readFileSync(path.join(ENGINE, 'test/fixtures/diagrams-slides.md'), 'utf8');
  const content = parseSlides(md, path.join(ENGINE, 'test/fixtures'));
  const hasFlowBlock = content.slides.some((s) =>
    s.blocks.some((b) => b.type === 'flow')
  );
  const hasQuadrantBlock = content.slides.some((s) =>
    s.blocks.some((b) => b.type === 'quadrant')
  );
  assert.ok(hasFlowBlock, 'at least one slide has a flow block');
  assert.ok(hasQuadrantBlock, 'at least one slide has a quadrant block');
});

test('slides: @flow and @quadrant resolve; sentinels consumed (fenced json not split on ---)', async () => {
  const html = await buildSlides('diagrams-slides.md');
  assert.ok(html.includes('Hindsight'), 'flow systemName present');
  assert.ok(html.includes('Positioning'), 'quadrant title present');
  assert.ok(!html.includes('[[QUADRANT') && !html.includes('[[FLOW'),
    'sentinels consumed by the block arms — not leaked into rendered output');
});

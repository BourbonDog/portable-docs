// engine/test/flow-quadrant-article.test.js
// Task 10: @flow / @quadrant wired into the ARTICLE pipeline.
// Tests that parseArticle populates content.flows / content.quadrants and that
// the SENTINEL mechanism (like @chart) consumes [[FLOW:N]] / [[QUADRANT:N]]
// into typed blocks that are baked into the built HTML CONTENT snapshot.
'use strict';
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE = path.join(__dirname, '..');

async function buildArticle(fixture) {
  const tmpHtml = path.join(os.tmpdir(), `pd-art-diag-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(ENGINE, 'test/fixtures', fixture),
                    '--out', tmpHtml, '--style', 'article', '--no-open', '--no-config'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('article: @flow systemName and @quadrant title are baked into the output', async () => {
  const html = await buildArticle('diagrams-article.md');
  // These strings must appear in the serialized CONTENT.flows / CONTENT.quadrants
  // JSON — not just as incidental text. The flow block is pre-extracted so
  // "Hindsight" is ONLY present via content.flows[0].systemName; the quadrant
  // block is pre-extracted so "Positioning" is ONLY in content.quadrants[0].title.
  assert.ok(html.includes('Hindsight'),   'flow systemName "Hindsight" must be in the serialized CONTENT');
  assert.ok(html.includes('Positioning'), 'quadrant title "Positioning" must be in the serialized CONTENT');
});

test('article: @flow/@quadrant sentinels are consumed (fenced json not mis-parsed)', async () => {
  const html = await buildArticle('diagrams-article.md');
  assert.ok(!html.includes('[[QUADRANT') && !html.includes('[[FLOW'),
    'sentinels consumed by the block arms — not leaked into rendered output');
});

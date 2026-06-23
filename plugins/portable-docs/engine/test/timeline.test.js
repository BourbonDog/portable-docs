'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ENGINE = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');
const TIMELINE_SRC = path.join(ENGINE, 'src', 'components', 'Timeline.jsx');

test('timeline source: no hardcoded white literals remain', () => {
  const src = fs.readFileSync(TIMELINE_SRC, 'utf8');
  assert.ok(!src.includes('#FFFFFF'), 'Timeline.jsx must not hardcode #FFFFFF');
  assert.ok(!src.includes('rgba(255,255,255'), 'Timeline.jsx must not hardcode rgba white');
});

test('timeline source: computes getCompanyLogo once per card', () => {
  const src = fs.readFileSync(TIMELINE_SRC, 'utf8');
  assert.ok(src.includes('const logo = getCompanyLogo(entry.company, 20)'),
    'TimelineCard must bind the company logo to a single const');
});

async function buildProposal() {
  const tmpHtml = path.join(os.tmpdir(), `pd-timeline-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', FIXTURE, '--out', tmpHtml, '--no-open'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('timeline: proposal builds with the Timeline bundled', async () => {
  const html = await buildProposal();
  assert.ok(html.includes('Career Timeline'), 'Timeline must be bundled into the proposal');
});

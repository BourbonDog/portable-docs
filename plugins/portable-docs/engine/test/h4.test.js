'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseBlocks } = require('../scripts/parse-article.js');

const ENGINE = path.join(__dirname, '..');

test('parseBlocks: #### emits a level-4 heading block, not a paragraph', () => {
  const blocks = parseBlocks('#### Deep Dive\n\nBody text.');
  const heading = blocks.find((b) => b.type === 'heading');
  assert.ok(heading, 'a heading block must exist');
  assert.strictEqual(heading.level, 4);
  assert.strictEqual(heading.text, 'Deep Dive');
  assert.ok(!blocks.some((b) => b.type === 'paragraph' && b.text.includes('####')),
    'no paragraph may contain the literal ####');
});

async function build({ style, slides }) {
  const md = slides
    ? '# Deck\n\n---\n\n## Slide One\n\n#### H4 Marker Slide\n\nUnder the h4.\n'
    : '# Doc\n\n## Section One\n\nIntro.\n\n#### H4 Marker Article\n\nUnder the h4.\n';
  const tmpMd = path.join(os.tmpdir(), `pd-h4-${process.hrtime.bigint()}.md`);
  const tmpHtml = path.join(os.tmpdir(), `pd-h4-${process.hrtime.bigint()}.html`);
  fs.writeFileSync(tmpMd, md, 'utf8');
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', tmpMd, '--out', tmpHtml, '--no-open'];
    if (style) process.argv.push('--style', style);
    if (slides) process.argv.push('--slides');
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('h4: article renders the h4 text and not the literal ####', async () => {
  const html = await build({ style: 'article' });
  assert.ok(html.includes('H4 Marker Article'), 'h4 text must render');
  assert.ok(!html.includes('#### H4 Marker Article'), 'literal #### must not appear');
});

test('h4: slides render the h4 text and not the literal ####', async () => {
  const html = await build({ slides: true });
  assert.ok(html.includes('H4 Marker Slide'), 'h4 text must render');
  assert.ok(!html.includes('#### H4 Marker Slide'), 'literal #### must not appear');
});

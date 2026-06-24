'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseSlides } = require('../scripts/parse-slides.js');

const ENGINE = path.join(__dirname, '..');

async function buildSlides(fixture) {
  const tmpHtml = path.join(os.tmpdir(), `pd-deck-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(ENGINE, 'test/fixtures', fixture),
                    '--out', tmpHtml, '--slides', '--no-open', '--no-config'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('parseSlides extracts charts and emits chart blocks', () => {
  const md = '<!-- @header -->\n<!-- @title value="D" -->\n<!-- /@header -->\n\n---\n\n## S\n\n<!-- @chart type="pie" title="P" -->\n```csv\nlabel,value\nA,1\n```\n<!-- /@chart -->\n';
  const c = parseSlides(md, process.cwd());
  assert.strictEqual(c.charts.length, 1);
  assert.ok(c.slides.some((s) => s.blocks.some((b) => b.type === 'chart')));
});

test('slide build renders a new chart and the error card for a legacy type', async () => {
  const html = await buildSlides('chart-slides.md');
  assert.ok(html.includes('Deck Chart'), 'new grouped-bar chart title present');
  assert.ok(html.includes('<rect') || html.includes('"rect"'), 'grouped-bar rects present');
  assert.ok(html.includes('chart:'), 'legacy-in-slides resolves to the error card');
});

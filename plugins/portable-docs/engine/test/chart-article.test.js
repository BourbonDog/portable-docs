'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseArticle } = require('../scripts/parse-article.js');

const ENGINE = path.join(__dirname, '..');

async function buildArticle(fixture) {
  const tmpHtml = path.join(os.tmpdir(), `pd-art-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', path.join(ENGINE, 'test/fixtures', fixture),
                    '--out', tmpHtml, '--style', 'article', '--no-open', '--no-config'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('parseArticle extracts charts and emits a chart block', () => {
  const md = '## S\n\n<!-- @chart type="pie" title="P" -->\n```csv\nlabel,value\nA,1\n```\n<!-- /@chart -->\n';
  const c = parseArticle(md, process.cwd());
  assert.strictEqual(c.charts.length, 1);
  assert.strictEqual(c.charts[0].type, 'pie');
  const hasChartBlock = c.sections.some((s) =>
    s.blocks.some((b) => b.type === 'chart' && b.index === 0));
  assert.ok(hasChartBlock, 'a {type:chart,index:0} block must be present');
});

test('article build renders the chart SVG and keeps surrounding prose', async () => {
  const html = await buildArticle('chart-article.md');
  assert.ok(html.includes('<svg') || html.includes('"svg"'), 'chart svg present in article');
  assert.ok(html.includes('Some prose before the chart'), 'prose before kept');
  assert.ok(html.includes('More prose after'), 'prose after kept');
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ENGINE = path.join(__dirname, '..');
const ARTICLE_FIXTURE = path.join(__dirname, 'fixtures', 'sample-article.md');

async function buildArticle() {
  const tmpHtml = path.join(os.tmpdir(), `pd-img-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', ARTICLE_FIXTURE, '--out', tmpHtml, '--style', 'article', '--no-open'];
    await main();
  } finally { process.argv = origArgv; }
  return fs.readFileSync(tmpHtml, 'utf8');
}

test('article figure ships an onError fallback placeholder', async () => {
  const html = await buildArticle();
  assert.ok(html.includes('setImgError'), 'ArticleFigure must track image error state');
  assert.ok(html.includes('Image unavailable'), 'ArticleFigure must include a fallback label');
});

test('article figure placeholder exposes image semantics to assistive tech', async () => {
  const html = await buildArticle();
  // JSX is precompiled to React.createElement props, so role="img" becomes role: "img".
  assert.ok(html.includes('role: "img"'), 'ArticleFigure placeholder must have role: "img" (Babel-compiled prop form)');
  assert.ok(
    html.includes('"Image unavailable"'),
    'ArticleFigure placeholder must carry aria-label "Image unavailable"',
  );
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { renderMermaid } = require('../scripts/render-mermaid.js');

test('mermaid: a fenced @mermaid example is not extracted', async () => {
  const md = 'intro\n\n```markdown\n<!-- @mermaid -->\ngraph TD; A-->B\n<!-- /@mermaid -->\n```\n\nend';
  const { md: outMd, mermaids } = await renderMermaid(md, { theme: 'editorial', baseDir: process.cwd(), strict: false });
  assert.strictEqual(mermaids.length, 0, 'no mermaid blocks extracted from inside a fence');
  assert.ok(outMd.includes('@mermaid'), 'fenced @mermaid survives in the returned md');
});

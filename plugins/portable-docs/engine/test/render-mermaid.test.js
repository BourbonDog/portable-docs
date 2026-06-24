// engine/test/render-mermaid.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { extractMermaidBlocks, themeVariables, renderMermaid, buildHarness, safeJson } = require('../scripts/render-mermaid.js');

const MD = [
  '# Doc',
  '<!-- @mermaid title="Flow" -->',
  'graph TD; A-->B',
  '<!-- /@mermaid -->',
  'middle',
  '<!-- @mermaid -->',
  'sequenceDiagram; A->>B: hi',
  '<!-- /@mermaid -->',
].join('\n');

test('extractMermaidBlocks: finds blocks in order with source + title', () => {
  const blocks = extractMermaidBlocks(MD);
  assert.strictEqual(blocks.length, 2);
  assert.strictEqual(blocks[0].title, 'Flow');
  assert.ok(blocks[0].source.includes('graph TD'));
  assert.ok(blocks[1].source.includes('sequenceDiagram'));
});

test('extractMermaidBlocks: CRLF-tolerant', () => {
  const blocks = extractMermaidBlocks(MD.replace(/\n/g, '\r\n'));
  assert.strictEqual(blocks.length, 2);
  assert.ok(blocks[0].source.includes('graph TD'));
});

test('themeVariables: dark theme uses dark base; accent maps to primaryColor', () => {
  const dark = themeVariables('dark', '#22D3EE');
  assert.strictEqual(dark.base, 'dark');
  assert.strictEqual(dark.themeVariables.primaryColor, '#22D3EE');
  const light = themeVariables('editorial', '#5B21B6');
  assert.strictEqual(light.base, 'base');
  assert.strictEqual(light.themeVariables.primaryColor, '#5B21B6');
});

test('renderMermaid: no @mermaid → md unchanged, no render call', async () => {
  let called = false;
  const md = '# plain\n\nno diagrams here';
  const r = await renderMermaid(md, { theme: 'editorial', accent: '', render: async () => { called = true; return []; } });
  assert.strictEqual(r.md, md);
  assert.strictEqual(r.mermaids.length, 0);
  assert.strictEqual(called, false, 'render must NOT be invoked when there are no blocks');
});

test('renderMermaid: rewrites blocks to [[MERMAIDSVG:N]] and threads svg via injected render', async () => {
  const fakeRender = async (sources) => sources.map((s, i) => ({ svg: `<svg data-i="${i}">${s.slice(0, 5)}</svg>` }));
  const r = await renderMermaid(MD, { theme: 'editorial', accent: '', render: fakeRender });
  assert.ok(r.md.includes('[[MERMAIDSVG:0]]') && r.md.includes('[[MERMAIDSVG:1]]'));
  assert.ok(!/@mermaid/.test(r.md), 'mermaid blocks replaced');
  assert.strictEqual(r.mermaids.length, 2);
  assert.ok(r.mermaids[0].svg.includes('<svg'));
});

test('renderMermaid: a render error becomes a fallback {source,error} and flags strict', async () => {
  const fakeRender = async (sources) => sources.map(() => ({ error: 'bad syntax' }));
  const r = await renderMermaid(MD, { theme: 'editorial', accent: '', strict: true, render: fakeRender });
  assert.ok(r.mermaids[0].error && r.mermaids[0].source.includes('graph TD'));
  assert.strictEqual(r.diagnostics.strictAbort, true, 'render error under --strict flags an abort');
});

test('renderMermaid: no-browser default → fallbacks, NOT a strict abort', async () => {
  // Force the default renderer with no browser by injecting a render that mimics it.
  const noBrowser = async (sources) => sources.map((s) => ({ error: 'no headless browser found' }));
  const r = await renderMermaid(MD, { theme: 'editorial', accent: '', strict: true, render: noBrowser });
  assert.ok(r.mermaids[0].source.includes('graph TD'), 'source preserved for fallback');
  assert.strictEqual(r.diagnostics.strictAbort, false, 'a missing browser must NOT abort under --strict');
});

test('buildHarness escapes </script> in the injected library', () => {
  const evilLib = 'var x = "</script><script>alert(1)</script>";';
  const html = buildHarness(evilLib, ['graph TD; A-->B'], { base: 'base', themeVariables: {} });
  // The injected lib must NOT contain a raw closing tag that would end our first <script> early.
  const firstScriptClose = html.indexOf('<\/script>');
  const libStart = html.indexOf('var x =');
  assert.ok(firstScriptClose > libStart, 'the lib content is escaped so the first </script> is our own closing tag, after the lib');
  assert.ok(html.includes('<\\/script>'), 'embedded </script> is backslash-escaped');
});

test('safeJson escapes < to \\u003c so </script> cannot break out', () => {
  assert.ok(!safeJson('</script>').includes('</'), 'no raw </ in JSON-embedded payload');
  assert.ok(safeJson('a<b').includes('\\u003c'), '< is unicode-escaped');
});

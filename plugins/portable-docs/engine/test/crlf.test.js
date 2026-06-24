'use strict';
/**
 * crlf.test.js — CRLF line-ending correctness tests.
 *
 * Guards against parser regressions on Windows CRLF working trees (core.autocrlf=true).
 * Without the normalize fix at each parser entry point, paragraph splitting on \n\n+
 * fails for CRLF input: blank lines are \r\n\r\n which /\n\n+/ does NOT match, so a
 * section with two @chart blocks collapses to 1 block.
 *
 * Tests are RED without `markdown = String(markdown).replace(/\r\n?/g, '\n')` in each
 * parser entry point and GREEN after.
 */

const test = require('node:test');
const assert = require('node:assert');
const { extractContent } = require('../src/utils/parser.js');
const { parseArticle } = require('../scripts/parse-article.js');
const { parseSlides } = require('../scripts/parse-slides.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal @chart block string (LF-terminated) */
function chartBlock(title) {
  return [
    `<!-- @chart type="pie" title="${title}" -->`,
    '```csv',
    'label,value',
    'A,1',
    '```',
    '<!-- /@chart -->',
  ].join('\n');
}

/**
 * Build a proposal-style CRLF markdown with one numbered section that contains
 * TWO @chart blocks separated by a blank line.
 */
function makeCrlfProposal() {
  const lines = [
    '## 1. Showcase',
    '',
    chartBlock('Chart One'),
    '',
    chartBlock('Chart Two'),
    '',
  ];
  // Explicit \r\n join — simulates what git core.autocrlf=true produces on checkout.
  return lines.join('\r\n');
}

// ── Test 1: CRLF proposal section must yield 2 chart blocks (not 1) ──────────

test('CRLF: proposal section with two @chart blocks yields 2 chart component blocks', () => {
  const crlfMd = makeCrlfProposal();
  const c = extractContent(crlfMd, process.cwd());

  const sections = c.document.filter((d) => d.type === 'section');
  assert.ok(sections.length >= 1, 'at least one section parsed');

  const sec = sections[0];
  const chartBlocks = [
    ...(sec.intro || []),
    ...((sec.subsections || []).flatMap((s) => s.blocks || [])),
  ].filter((b) => b.type === 'component' && b.component === 'chart');

  assert.strictEqual(
    chartBlocks.length,
    2,
    `expected 2 chart blocks in section, got ${chartBlocks.length} — CRLF normalization missing`
  );
});

// ── Test 2: CRLF and LF produce the same chart-block count per section ────────

test('CRLF: extractContent(crlf) === extractContent(lf) chart-block count per section', () => {
  const crlfMd = makeCrlfProposal();
  const lfMd   = crlfMd.replace(/\r\n/g, '\n');

  function chartBlocksPerSection(md) {
    const c = extractContent(md, process.cwd());
    return c.document
      .filter((d) => d.type === 'section')
      .map((sec) =>
        [
          ...(sec.intro || []),
          ...((sec.subsections || []).flatMap((s) => s.blocks || [])),
        ].filter((b) => b.type === 'component' && b.component === 'chart').length
      );
  }

  const crlfCounts = chartBlocksPerSection(crlfMd);
  const lfCounts   = chartBlocksPerSection(lfMd);

  assert.deepStrictEqual(
    crlfCounts,
    lfCounts,
    `CRLF and LF produced different per-section chart counts: CRLF=${JSON.stringify(crlfCounts)}, LF=${JSON.stringify(lfCounts)}`
  );
});

// ── Test 3: CRLF smoke — parseArticle resolves charts ────────────────────────

test('CRLF: parseArticle resolves 1 chart from CRLF input', () => {
  const lines = [
    '## Section',
    '',
    chartBlock('Article Chart'),
    '',
  ];
  const crlfMd = lines.join('\r\n');
  const c = parseArticle(crlfMd, process.cwd());
  assert.strictEqual(
    c.charts.length,
    1,
    `parseArticle should resolve 1 chart from CRLF input, got ${c.charts.length}`
  );
});

// ── Test 4: CRLF smoke — parseSlides resolves charts ─────────────────────────

test('CRLF: parseSlides resolves 1 chart from CRLF input', () => {
  const lines = [
    '<!-- @header -->',
    '<!-- @title value="Deck" -->',
    '<!-- /@header -->',
    '',
    '---',
    '',
    '## Slide One',
    '',
    chartBlock('Slide Chart'),
    '',
  ];
  const crlfMd = lines.join('\r\n');
  const c = parseSlides(crlfMd, process.cwd());
  assert.strictEqual(
    c.charts.length,
    1,
    `parseSlides should resolve 1 chart from CRLF input, got ${c.charts.length}`
  );
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { lintMarkdown, MARKER_SPEC, extractIconNames } = require('../scripts/lint.js');

const codes = (r) => [...r.errors, ...r.warnings].map((d) => d.code);

test('clean proposal yields no diagnostics', () => {
  const md = [
    '<!-- @header -->',
    '<!-- @title value="T" -->',
    '<!-- /@header -->',
    '',
    '## 1. Intro',
    '',
    '<!-- @stats -->',
    '<!-- @stat value="3x" label="Growth" source="Internal" -->',
    '<!-- /@stats -->',
  ].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.deepStrictEqual(r.errors, []);
});

test('unclosed block is reported with the open line', () => {
  const md = ['<!-- @stats -->', '<!-- @stat value="3" label="x" source="y" -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'unclosed-block' && e.line === 1));
});

test('stray closing marker is an error', () => {
  const r = lintMarkdown('<!-- /@stats -->', { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'unclosed-block' && e.line === 1));
});

test('unknown marker is an error with its line', () => {
  const r = lintMarkdown('text\n<!-- @stas -->', { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'unknown-marker' && e.line === 2));
});

test('missing required attribute is an error', () => {
  const md = ['<!-- @stats -->', '<!-- @stat value="3" label="x" -->', '<!-- /@stats -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'missing-attr' && /source/.test(e.message)));
});

test('invalid enum value is an error', () => {
  const md = ['<!-- @cards type="bogus" -->', '<!-- @card icon="rocket" title="X" -->', 'body', '<!-- /@card -->', '<!-- /@cards -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'bad-enum' && /type/.test(e.message)));
});

test('MARKER_SPEC covers every marker the parser recognizes (drift guard)', () => {
  const parserSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'parser.js'), 'utf-8');
  const found = new Set();
  const re = /<!--\s*@([a-zA-Z][\w]*)\b/g;
  let m;
  while ((m = re.exec(parserSrc)) !== null) found.add(m[1]);
  // Every opening marker the parser matches must be in the registry.
  for (const name of found) {
    assert.ok(MARKER_SPEC[name], `MARKER_SPEC is missing "${name}" (parser drift)`);
  }
});

test('extractIconNames reads the Icons object keys from design-tokens.js', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'design-tokens.js'), 'utf-8');
  const names = extractIconNames(src);
  assert.ok(names.length >= 25, `expected >=25 icons, got ${names.length}`);
  for (const n of ['rocket', 'brain', 'search', 'placeholder']) {
    assert.ok(names.includes(n), `missing icon "${n}"`);
  }
});

test('unknown icon is a warning, not an error', () => {
  const md = ['<!-- @cards type="feature" -->', '<!-- @card icon="notreal" title="X" -->', 'b', '<!-- /@card -->', '<!-- /@cards -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', iconNames: ['rocket', 'brain'] });
  assert.deepStrictEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.code === 'unknown-icon'));
});

test('unnumbered proposal section is a warning (Citations exempt)', () => {
  const md = ['## Intro', '', 'text', '', '## Citations', '', '[1] x'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.warnings.some((w) => w.code === 'unnumbered-section' && /Intro/.test(w.message)));
  assert.ok(!r.warnings.some((w) => /Citations/.test(w.message)), 'Citations is exempt');
});

test('article format does not flag plain prose or numbered headings', () => {
  const md = ['# Title', '', '## Some Heading', '', 'A paragraph with an @ symbol in it.', '', '## Another'].join('\n');
  const r = lintMarkdown(md, { format: 'article' });
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.warnings, []);
});

const { loadIconNames, formatDiagnostics } = require('../scripts/lint.js');

test('loadIconNames reads the real icon set', () => {
  const names = loadIconNames();
  assert.ok(names.includes('rocket'));
});

test('formatDiagnostics renders sorted, labeled lines', () => {
  const out = formatDiagnostics({
    errors: [{ line: 5, severity: 'error', code: 'missing-attr', message: 'x' }],
    warnings: [{ line: 2, severity: 'warning', code: 'unknown-icon', message: 'y' }],
  }, 'doc.md');
  const lines = out.split('\n');
  assert.ok(lines[0].includes('doc.md:2') && lines[0].includes('[unknown-icon]'));
  assert.ok(lines[1].includes('doc.md:5') && lines[1].includes('ERROR'));
});

test('--lint exits non-zero on a malformed file and does not build', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-lintcli-'));
  const mdPath = path.join(dir, 'bad.md');
  const outHtml = path.join(dir, 'out.html');
  fs.writeFileSync(mdPath, '<!-- @stats -->\n<!-- @stat value="3" label="x" source="y" -->'); // unclosed @stats
  const { main } = require('../scripts/build-doc.js');
  const origArgv = process.argv, origCode = process.exitCode;
  try {
    process.argv = ['node', 'build-doc.js', '--input', mdPath, '--out', outHtml, '--no-open', '--lint', '--no-config'];
    await main();
    assert.strictEqual(process.exitCode, 1, '--lint sets exit code 1 on errors');
    assert.ok(!fs.existsSync(outHtml), '--lint must not build');
  } finally {
    process.argv = origArgv; process.exitCode = origCode;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('inline single-line paired markers do not produce false errors', () => {
  const md = [
    '<!-- @header -->',
    '<!-- @title value="T" -->',
    '<!-- /@header -->',
    '',
    '## 1. Intro',
    '',
    '<!-- @pullquote author="A" -->A one-line pull quote.<!-- /@pullquote -->',
  ].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.deepStrictEqual(r.errors, [], 'inline paired marker is valid (parser is line-agnostic)');
});

test('new chart types are valid enum values', () => {
  const md = ['<!-- @chart type="pie" title="x" -->', '```csv', 'label,value', 'A,1', '```', '<!-- /@chart -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(!r.errors.some((e) => e.code === 'bad-enum'), 'pie is a valid chart type');
});

test('a typo chart type is a bad-enum error', () => {
  const md = ['<!-- @chart type="pdf" -->', '<!-- /@chart -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'bad-enum'));
});

test('a new-type chart with no data is a chart-no-data error', () => {
  const md = ['<!-- @chart type="pie" title="x" -->', '<!-- /@chart -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'chart-no-data'));
});

test('a new-type chart with src= is clean', () => {
  const md = ['<!-- @chart type="pie" src="d.csv" -->', '<!-- /@chart -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(!r.errors.some((e) => e.code === 'chart-no-data'));
});

test('--strict aborts a build with lint errors', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-strict-'));
  const mdPath = path.join(dir, 'bad.md');
  fs.writeFileSync(mdPath, '<!-- @stats -->'); // unclosed
  const { main } = require('../scripts/build-doc.js');
  const origArgv = process.argv;
  let threw = false;
  try {
    process.argv = ['node', 'build-doc.js', '--input', mdPath, '--out', path.join(dir, 'o.html'), '--no-open', '--strict', '--no-config'];
    await main();
  } catch (_) { threw = true; }
  finally { process.argv = origArgv; fs.rmSync(dir, { recursive: true, force: true }); }
  assert.ok(threw, '--strict must throw on lint errors');
});

// ── @flow / @quadrant diagram-no-data checks ────────────────────────────────

test('MARKER_SPEC contains mermaid entry (Task 16)', () => {
  assert.ok(MARKER_SPEC.mermaid, 'mermaid must be in MARKER_SPEC');
  assert.strictEqual(MARKER_SPEC.mermaid.paired, true);
});

test('@flow with no data is a diagram-no-data error', () => {
  const md = ['<!-- @flow title="x" -->', '<!-- /@flow -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'diagram-no-data' && e.marker === 'flow'),
    'expected diagram-no-data for @flow with no data');
});

test('@flow with src= is clean (no diagram-no-data)', () => {
  const md = ['<!-- @flow src="diagram.mermaid" -->', '<!-- /@flow -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(!r.errors.some((e) => e.code === 'diagram-no-data'),
    '@flow with src= should not be a diagram-no-data error');
});

test('@flow with fenced block body is clean (no diagram-no-data)', () => {
  const md = ['<!-- @flow title="x" -->', '```mermaid', 'graph TD', '  A --> B', '```', '<!-- /@flow -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(!r.errors.some((e) => e.code === 'diagram-no-data'),
    '@flow with fenced block should not be a diagram-no-data error');
});

test('@quadrant with src= is clean (no diagram-no-data)', () => {
  const md = ['<!-- @quadrant src="q.csv" -->', '<!-- /@quadrant -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(!r.errors.some((e) => e.code === 'diagram-no-data'),
    '@quadrant with src= should not be a diagram-no-data error');
});

test('@quadrant with no data is a diagram-no-data error', () => {
  const md = ['<!-- @quadrant title="x" -->', '<!-- /@quadrant -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'diagram-no-data' && e.marker === 'quadrant'),
    'expected diagram-no-data for @quadrant with no data');
});

// ── @mermaid mermaid-no-source checks ───────────────────────────────────────

test('@mermaid with non-empty body is clean (no mermaid-no-source)', () => {
  const md = ['<!-- @mermaid -->', 'graph TD', '  A --> B', '<!-- /@mermaid -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(!r.errors.some((e) => e.code === 'mermaid-no-source'),
    '@mermaid with body content should not be a mermaid-no-source error');
});

test('@mermaid with src= is clean (no mermaid-no-source)', () => {
  const md = ['<!-- @mermaid src="diagram.mmd" -->', '<!-- /@mermaid -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(!r.errors.some((e) => e.code === 'mermaid-no-source'),
    '@mermaid with src= should not be a mermaid-no-source error');
});

test('@mermaid with empty body and no src= is a mermaid-no-source error', () => {
  const md = ['<!-- @mermaid -->', '<!-- /@mermaid -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  assert.ok(r.errors.some((e) => e.code === 'mermaid-no-source' && e.marker === 'mermaid'),
    'expected mermaid-no-source for @mermaid with no source');
});

// ── changelog type-aware rules (Phase 5a) ───────────────────────────────────

test('changelog: a non-versioned section warns (changelog-section-not-versioned)', () => {
  const md = ['## Random Heading', '### Added', '- thing'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.ok(r.warnings.some((w) => w.code === 'changelog-section-not-versioned'));
});

test('changelog: a versioned section does not warn', () => {
  const md = ['## 1.2.0 — 2026-06-20', '### Added', '- thing'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.ok(!r.warnings.some((w) => w.code === 'changelog-section-not-versioned'));
});

test('changelog: an unknown group heading warns (changelog-unknown-group)', () => {
  const md = ['## 1.0.0', '### Frobnicated', '- thing'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.ok(r.warnings.some((w) => w.code === 'changelog-unknown-group'));
});

test('changelog: a known group heading does not warn', () => {
  const md = ['## 1.0.0', '### Security', '- thing'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.ok(!r.warnings.some((w) => w.code === 'changelog-unknown-group'));
});

test('changelog: an empty release warns (changelog-empty-release)', () => {
  const md = ['## 1.1.0', '', '## 1.0.0', '### Added', '- thing'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.ok(r.warnings.some((w) => w.code === 'changelog-empty-release'));
});

test('changelog: zero releases is an error (changelog-no-releases)', () => {
  const md = ['# Just a title', '', 'Some prose, no releases.'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.ok(r.errors.some((e) => e.code === 'changelog-no-releases'));
});

test('changelog rules are silent when type is null', () => {
  const md = ['## Random Heading', '### Frobnicated', '- x'].join('\n');
  const r = lintMarkdown(md, { format: 'article' });
  const codes = [...r.errors, ...r.warnings].map((d) => d.code);
  for (const c of ['changelog-section-not-versioned', 'changelog-unknown-group', 'changelog-empty-release', 'changelog-no-releases']) {
    assert.ok(!codes.includes(c), `${c} must not fire when type is null`);
  }
});

test('changelog: a ### under a non-versioned section does NOT warn unknown-group', () => {
  const md = ['## Random Heading', '### Whatever', '- x'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'changelog' });
  assert.ok(r.warnings.some((w) => w.code === 'changelog-section-not-versioned'));
  assert.ok(!r.warnings.some((w) => w.code === 'changelog-unknown-group'), 'group check must not run outside a release');
});

test('newsletter: header without issue label warns (newsletter-no-issue)', () => {
  const md = ['<!-- @header -->', '<!-- @brand value="The Signal" -->', '<!-- @date value="June 2026" -->', '<!-- /@header -->', '## A', '## B'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'newsletter' });
  assert.ok(r.warnings.some((w) => w.code === 'newsletter-no-issue'));
});

test('newsletter: header with @brandsub does not warn no-issue', () => {
  const md = ['<!-- @header -->', '<!-- @brand value="The Signal" -->', '<!-- @brandsub value="Issue 14" -->', '<!-- @date value="June 2026" -->', '<!-- /@header -->', '## A', '## B'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'newsletter' });
  assert.ok(!r.warnings.some((w) => w.code === 'newsletter-no-issue'));
});

test('newsletter: missing date warns (newsletter-no-date)', () => {
  const md = ['<!-- @header -->', '<!-- @brand value="The Signal" -->', '<!-- @eyebrow value="DIGEST" -->', '<!-- /@header -->', '## A', '## B'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'newsletter' });
  assert.ok(r.warnings.some((w) => w.code === 'newsletter-no-date'));
});

test('newsletter: fewer than 2 sections warns (newsletter-thin)', () => {
  const md = ['<!-- @header -->', '<!-- @brand value="X" -->', '<!-- @brandsub value="Issue 1" -->', '<!-- @date value="June 2026" -->', '<!-- /@header -->', '## Only One'].join('\n');
  const r = lintMarkdown(md, { format: 'article', type: 'newsletter' });
  assert.ok(r.warnings.some((w) => w.code === 'newsletter-thin'));
});

test('newsletter rules are silent when type is null', () => {
  const md = ['<!-- @header -->', '<!-- @brand value="X" -->', '<!-- /@header -->', '## Only One'].join('\n');
  const r = lintMarkdown(md, { format: 'article' });
  const codes = [...r.errors, ...r.warnings].map((d) => d.code);
  for (const c of ['newsletter-no-issue', 'newsletter-no-date', 'newsletter-thin']) {
    assert.ok(!codes.includes(c), `${c} must not fire when type is null`);
  }
});

test('case-study: no @stats warns (case-study-missing-metrics)', () => {
  const md = ['## 1. Context', 'prose'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'case-study' });
  assert.ok(r.warnings.some((w) => w.code === 'case-study-missing-metrics'));
});

test('case-study: no quote warns (case-study-missing-quote)', () => {
  const md = ['## 1. Context', '<!-- @stats -->', '<!-- @stat value="3x" label="x" source="y" -->', '<!-- /@stats -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'case-study' });
  assert.ok(r.warnings.some((w) => w.code === 'case-study-missing-quote'));
});

test('case-study: @stats with 2 stats warns (case-study-stats-count)', () => {
  const md = ['<!-- @stats -->', '<!-- @stat value="1" label="a" source="s" -->', '<!-- @stat value="2" label="b" source="s" -->', '<!-- /@stats -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'case-study' });
  assert.ok(r.warnings.some((w) => w.code === 'case-study-stats-count'));
});

test('case-study: @pullquote without author warns (case-study-quote-attribution)', () => {
  const md = ['<!-- @pullquote -->', 'A quote.', '<!-- /@pullquote -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'case-study' });
  assert.ok(r.warnings.some((w) => w.code === 'case-study-quote-attribution'));
});

test('case-study rules are silent when type is null', () => {
  const md = ['## 1. Context', 'prose'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  const codes = [...r.errors, ...r.warnings].map((d) => d.code);
  for (const c of ['case-study-missing-metrics', 'case-study-missing-quote', 'case-study-stats-count', 'case-study-quote-attribution']) {
    assert.ok(!codes.includes(c), `${c} must not fire when type is null`);
  }
});

test('rfp: no backbone section warns (rfp-missing-section)', () => {
  const md = ['## 1. Hello', 'prose'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'rfp' });
  assert.ok(r.warnings.some((w) => w.code === 'rfp-missing-section'));
});

test('rfp: a scope/pricing section clears rfp-missing-section', () => {
  const md = ['## 1. Scope of Work', 'prose', '## 2. Pricing', '<!-- @stats -->', '<!-- @stat value="1" label="a" source="s" -->', '<!-- /@stats -->'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'rfp' });
  assert.ok(!r.warnings.some((w) => w.code === 'rfp-missing-section'));
});

test('rfp: an unrecognized compliance cell warns (rfp-matrix-checkmark)', () => {
  const md = ['| Requirement | Meets | Notes |', '|---|---|---|', '| SSO | Partial | hybrid |'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'rfp' });
  assert.ok(r.warnings.some((w) => w.code === 'rfp-matrix-checkmark'));
});

test('rfp: a checkmark compliance cell does not warn', () => {
  const md = ['| Requirement | Meets | Notes |', '|---|---|---|', '| SSO | ✓ | native |'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'rfp' });
  assert.ok(!r.warnings.some((w) => w.code === 'rfp-matrix-checkmark'));
});

test('rfp: pricing section without table or stats warns (rfp-pricing-no-table)', () => {
  const md = ['## 1. Pricing', 'We charge a fixed fee.'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal', type: 'rfp' });
  assert.ok(r.warnings.some((w) => w.code === 'rfp-pricing-no-table'));
});

test('rfp rules are silent when type is null', () => {
  const md = ['| Requirement | Meets | Notes |', '|---|---|---|', '| SSO | Partial | hybrid |'].join('\n');
  const r = lintMarkdown(md, { format: 'proposal' });
  const codes = [...r.errors, ...r.warnings].map((d) => d.code);
  for (const c of ['rfp-missing-section', 'rfp-matrix-checkmark', 'rfp-pricing-no-table']) {
    assert.ok(!codes.includes(c), `${c} must not fire when type is null`);
  }
});

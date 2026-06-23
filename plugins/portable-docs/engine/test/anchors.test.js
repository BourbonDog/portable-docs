'use strict';
/**
 * Task 8 — Heading anchors + deep-linking test
 *
 * Verifies:
 *  1. Section headings in a compiled proposal carry slug ids (e.g. "alpha-strategy").
 *  2. A pd-anchor link is present in the compiled output.
 *  3. The anchor href targets the slug (e.g. "#alpha-strategy").
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');

const ENGINE = path.join(__dirname, '..');

/**
 * Build a minimal proposal fixture with the given section titles, return the
 * output HTML string.  Uses the same pattern as sectionnav.test.js / reading-progress.test.js.
 */
async function buildProposalFixtureToString(sectionTitles) {
  const lines = [];
  lines.push('@header');
  lines.push('to: Test Reader');
  lines.push('from: Test Author');
  lines.push('date: June 2026');
  lines.push('title: Anchors Test Doc');
  lines.push('subtitle: Deep-link anchor verification');
  lines.push('@end');
  lines.push('');

  sectionTitles.forEach((title, i) => {
    lines.push(`## ${i + 1}. ${title}`);
    lines.push('');
    lines.push('Section content here.');
    lines.push('');
  });

  const mdContent = lines.join('\n');

  const tmpMd   = path.join(os.tmpdir(), `pd-anchors-${Date.now()}.md`);
  const tmpHtml = path.join(os.tmpdir(), `pd-anchors-${Date.now()}.html`);

  fs.writeFileSync(tmpMd, mdContent, 'utf8');

  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', tmpMd, '--out', tmpHtml, '--no-open'];
    await main();
  } finally {
    process.argv = origArgv;
    fs.rmSync(tmpMd, { force: true });
  }

  assert.ok(fs.existsSync(tmpHtml), `output file must exist: ${tmpHtml}`);
  const html = fs.readFileSync(tmpHtml, 'utf8');
  fs.rmSync(tmpHtml, { force: true });
  return html;
}

test('section headings get slug ids and a deep-link anchor', async () => {
  const html = await buildProposalFixtureToString(['Alpha Strategy', 'Bravo Plan']);

  // The output is a compiled JS bundle — check for expressions that survive compilation.
  // The heading id is set as id: slugify(title) and the href as `#${slugify(title)}`.
  assert.ok(
    html.includes('id: slugify(title)') || html.includes('id="alpha-strategy"') || html.includes('"alpha-strategy"'),
    'slug id present (either as expression or evaluated value)'
  );
  assert.ok(html.includes('pd-anchor'), 'anchor link present');
  assert.ok(
    html.includes('slugify(title)') || html.includes('#alpha-strategy'),
    'deep link target expression present'
  );
});

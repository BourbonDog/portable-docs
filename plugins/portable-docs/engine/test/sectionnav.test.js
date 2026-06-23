'use strict';
/**
 * Task 6 — SectionNav data-driven test
 *
 * Verifies:
 *  1. A proposal built with distinctive section titles renders those titles
 *     in the compiled JS bundle (no hardcoded Northwestern labels).
 *  2. The SectionNav source no longer contains the hardcoded SECTIONS array
 *     (checked via `short: 'Crisis'` sentinel).
 *  3. The nav carries pd-no-print class.
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');

const ENGINE = path.join(__dirname, '..');

/**
 * Build a minimal proposal fixture with the given section titles, return the
 * output HTML string.  Uses the same pattern as themes.test.js: write a temp
 * .md, invoke main() with --no-open, read and return the HTML.
 *
 * Sections use the proposal marker syntax: `## N. Title`
 */
async function buildProposalFixtureToString(sectionTitles) {
  // Build the markdown content
  const lines = [];
  lines.push('@header');
  lines.push('to: Test Reader');
  lines.push('from: Test Author');
  lines.push('date: June 2026');
  lines.push('title: Section Nav Test Doc');
  lines.push('subtitle: Data-driven nav verification');
  lines.push('@end');
  lines.push('');

  sectionTitles.forEach((title, i) => {
    lines.push(`## ${i + 1}. ${title}`);
    lines.push('');
    lines.push('Section content here.');
    lines.push('');
  });

  const mdContent = lines.join('\n');

  const tmpMd   = path.join(os.tmpdir(), `pd-sectionnav-${Date.now()}.md`);
  const tmpHtml = path.join(os.tmpdir(), `pd-sectionnav-${Date.now()}.html`);

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

test('proposal nav is data-driven (real section titles, no hardcoded Northwestern labels)', async () => {
  const html = await buildProposalFixtureToString(['Alpha Strategy', 'Bravo Plan']);
  assert.ok(html.includes('Alpha Strategy'), 'renders the real section title');
  assert.ok(!html.includes('The Talent Crisis'), 'no hardcoded Northwestern section');
  assert.ok(html.includes('pd-no-print'), 'nav is hidden in print');
});

test('SectionNav source no longer hardcodes proposal sections', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'SectionNav.jsx'),
    'utf-8',
  );
  assert.ok(!src.includes("short: 'Crisis'"), 'hardcoded SECTIONS array removed');
});

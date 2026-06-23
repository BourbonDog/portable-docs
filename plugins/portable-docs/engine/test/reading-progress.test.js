'use strict';
/**
 * Task 7 — Reading-progress bar test
 *
 * Verifies:
 *  1. Proposal output includes pd-reading-progress bar AND pd-no-print class.
 *  2. Slides output does NOT include pd-reading-progress bar.
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE         = path.join(__dirname, '..');
const SLIDES_FIXTURE = path.join(__dirname, 'fixtures', 'sample-slides.md');

// ---------------------------------------------------------------------------
// Helpers — reuse the proposal build pattern from sectionnav.test.js (Task 6)
// and the slides build pattern from slides.test.js (Task 5)
// ---------------------------------------------------------------------------

/**
 * Build a minimal proposal fixture with the given section titles, return the
 * output HTML string.
 */
async function buildProposalFixtureToString(sectionTitles) {
  const lines = [];
  lines.push('@header');
  lines.push('to: Test Reader');
  lines.push('from: Test Author');
  lines.push('date: June 2026');
  lines.push('title: Reading Progress Test Doc');
  lines.push('subtitle: Progress bar verification');
  lines.push('@end');
  lines.push('');

  sectionTitles.forEach((title, i) => {
    lines.push(`## ${i + 1}. ${title}`);
    lines.push('');
    lines.push('Section content here.');
    lines.push('');
  });

  const mdContent = lines.join('\n');
  const tmpMd   = path.join(os.tmpdir(), `pd-readprog-${Date.now()}.md`);
  const tmpHtml = path.join(os.tmpdir(), `pd-readprog-${Date.now()}.html`);

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

/**
 * Build a slides output and return the HTML string.
 */
async function buildSlidesFixtureToString() {
  const tmpHtml = path.join(os.tmpdir(), `pd-readprog-slides-${process.hrtime.bigint()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js',
      '--input', SLIDES_FIXTURE, '--out', tmpHtml, '--no-open', '--slides'];
    await main();
  } finally {
    process.argv = origArgv;
  }

  assert.ok(fs.existsSync(tmpHtml), `output file must exist: ${tmpHtml}`);
  const html = fs.readFileSync(tmpHtml, 'utf8');
  fs.rmSync(tmpHtml, { force: true });
  return html;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('proposal output includes the reading-progress bar (hidden in print)', async () => {
  const html = await buildProposalFixtureToString(['Alpha Strategy', 'Bravo Plan']);
  assert.ok(html.includes('pd-reading-progress'), 'progress bar present');
  assert.ok(html.includes('pd-no-print'), 'hidden in print');
});

test('slides output does NOT include the reading-progress bar', async () => {
  const html = await buildSlidesFixtureToString();
  assert.ok(!html.includes('pd-reading-progress'), 'no progress bar in slide decks');
});

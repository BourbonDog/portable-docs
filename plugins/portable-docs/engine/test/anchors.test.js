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

  // The output is a compiled JS bundle (JSX → React.createElement; template literals are
  // preserved verbatim).  Each assertion targets an exact substring that would NOT appear
  // if the feature were absent or reduced to a no-op stub.

  // 1. slugify helper is a real implementation — its body must contain toLowerCase AND trim
  //    AND replace, so a no-op `const slugify = s => s` would make this fail.
  assert.ok(
    html.includes('toLowerCase().trim().replace'),
    'slugify helper body must contain toLowerCase().trim().replace (not a no-op stub)'
  );

  // 2. The <h2> id prop is wired to slugify(title) — compiled form is:
  //    id: slugify(title),
  assert.ok(
    html.includes('id: slugify(title)'),
    'h2 id prop must be wired to slugify(title)'
  );

  // 3. The deep-link anchor href is the template literal `#${slugify(title)}` — compiled
  //    form is: href: `#${slugify(title)}`,
  //    A hardcoded href (e.g. href: "#") or a missing href would fail this.
  assert.ok(
    html.includes('href: `#${slugify(title)}`'),
    'anchor href must be the template literal `#${slugify(title)}`'
  );

  // 4. Both CSS classes must be present together on the anchor element.
  assert.ok(
    html.includes('pd-anchor pd-no-print'),
    'anchor must carry both pd-anchor and pd-no-print classes'
  );
});

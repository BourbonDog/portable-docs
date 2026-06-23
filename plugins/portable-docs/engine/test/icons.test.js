'use strict';
/**
 * Task 2.3 — Icons test
 *
 * Verifies through the BUILD OUTPUT (not by importing design-tokens.js, which
 * contains JSX and cannot be require()d in plain node:test):
 *
 *  1. The built HTML contains the `search` icon definition (circle + line glyph)
 *  2. The built HTML contains the `compass` icon definition (circle + polygon glyph)
 *  3. The built HTML contains the `placeholder` icon definition (dashed rect)
 *  4. The fallback for an unknown icon name is NOT Icons.lightbulb (old behaviour)
 *  5. The fallback for an unknown icon name IS Icons.placeholder (the dashed rect)
 *  6. Valid existing icons still present (sanity: lightbulb, briefcase)
 *  7. Icons map inlines all three new/changed keys: `search`, `compass`, `placeholder`
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const ENGINE  = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'icons-fixture.md');

// Helper: run main() with a given out path. Returns the HTML string.
async function runBuild(outFile) {
  const tmpHtml = outFile || path.join(os.tmpdir(), `pd-icons-test-${Date.now()}.html`);
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', FIXTURE, '--out', tmpHtml, '--no-open'];
    await main();
  } finally {
    process.argv = origArgv;
  }

  assert.ok(fs.existsSync(tmpHtml), `output file must exist: ${tmpHtml}`);
  return fs.readFileSync(tmpHtml, 'utf8');
}

let _html; // cache so we only build once

async function getHtml() {
  if (!_html) {
    _html = await runBuild(path.join(os.tmpdir(), `pd-icons-suite-${Date.now()}.html`));
  }
  return _html;
}

// ── 1. search icon is present in the built source ────────────────────────────
// The Icons map is inlined verbatim. `search:` must appear followed by an svg
// with the distinctive magnifying-glass glyph elements.
test('icons: built HTML contains search icon definition', async () => {
  const html = await getHtml();
  assert.ok(html.includes('search:'), 'Icons map must include a `search:` key');
  // Distinctive magnifying-glass: a circle with cx=11 cy=11 r=8.
  // JSX is precompiled to React.createElement props, so check JS prop form:
  assert.ok(html.includes('cx: "11"'), 'search icon must have magnifying-glass circle cx: "11"');
  assert.ok(html.includes('cy: "11"'), 'search icon must have magnifying-glass circle cy: "11"');
  assert.ok(html.includes('r: "8"'), 'search icon must have magnifying-glass circle r: "8"');
});

// ── 2. compass icon is present ───────────────────────────────────────────────
test('icons: built HTML contains compass icon definition', async () => {
  const html = await getHtml();
  assert.ok(html.includes('compass:'), 'Icons map must include a `compass:` key');
  // Distinctive compass needle polygon
  assert.ok(
    html.includes('16.24 7.76 14.12 14.12 7.76 16.24'),
    'compass icon must have its directional needle polygon',
  );
});

// ── 3. placeholder icon is present ───────────────────────────────────────────
test('icons: built HTML contains placeholder icon definition', async () => {
  const html = await getHtml();
  assert.ok(html.includes('placeholder:'), 'Icons map must include a `placeholder:` key');
  // Distinctive dashed rect: strokeDasharray="3 2".
  // JSX is precompiled to React.createElement props, so check JS prop form:
  assert.ok(
    html.includes('strokeDasharray: "3 2"'),
    'placeholder icon must have strokeDasharray: "3 2" (dashed border, Babel-compiled prop form)',
  );
});

// ── 4. fallback no longer uses lightbulb (old silent fallback) ───────────────
// The getIcon helper source is inlined. Check that the fallback line now
// references 'placeholder' rather than 'lightbulb'.
test('icons: getIcon fallback references placeholder not lightbulb', async () => {
  const html = await getHtml();
  // The helper is inlined as source text. Look for the specific fallback expression.
  // Old: Icons.lightbulb(color)  New: Icons.placeholder(color)
  assert.ok(
    html.includes('Icons.placeholder(color)'),
    'getIcon must fall back to Icons.placeholder(color), not Icons.lightbulb(color)',
  );
  assert.ok(
    !html.includes('Icons.lightbulb(color)'),
    'getIcon must NOT fall back to Icons.lightbulb(color) (old silent fallback)',
  );
});

// ── 5. existing icons still present (sanity / no-regression) ─────────────────
test('icons: existing icons (lightbulb, briefcase, rocket) still present', async () => {
  const html = await getHtml();
  assert.ok(html.includes('lightbulb:'), 'lightbulb icon must still be in Icons map');
  assert.ok(html.includes('briefcase:'), 'briefcase icon must still be in Icons map');
  assert.ok(html.includes('rocket:'),    'rocket icon must still be in Icons map');
});

// ── 6. all core icons present in inlined map ─────────────────────────────────
test('icons: all 25 core icon keys are present in the built HTML', async () => {
  const html = await getHtml();
  const expected = [
    'briefcase', 'code', 'rocket', 'palette', 'network', 'graduation',
    'lightbulb', 'chart', 'users', 'shield', 'zap', 'target', 'layers',
    'cpu', 'database', 'arrowRight', 'quote', 'server', 'microphone',
    'brain', 'book', 'gitBranch', 'messageSquare',
    // Task 2.3 additions:
    'search', 'compass', 'placeholder',
  ];
  for (const name of expected) {
    assert.ok(html.includes(`${name}:`), `Icons map must contain key: ${name}`);
  }
});

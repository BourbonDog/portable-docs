const test = require('node:test');
const assert = require('node:assert');
const { parseArgs, applyTypeDefaults, TYPE_MAP } = require('../scripts/build-doc.js');

test('TYPE_MAP has all six types with a baseFormat', () => {
  for (const t of ['resume', 'case-study', 'changelog', 'newsletter', 'landing', 'rfp']) {
    assert.ok(TYPE_MAP[t], `TYPE_MAP missing "${t}"`);
    assert.ok(['proposal', 'article'].includes(TYPE_MAP[t].baseFormat), `${t} baseFormat invalid`);
  }
});

test('parseArgs reads --type (default null)', () => {
  assert.strictEqual(parseArgs(['--input', 'x.md']).type, null);
  assert.strictEqual(parseArgs(['--input', 'x.md', '--type', 'resume']).type, 'resume');
});

test('applyTypeDefaults: article-base type derives style=article', () => {
  const args = parseArgs(['--input', 'x.md', '--type', 'changelog']);
  applyTypeDefaults(args);
  assert.strictEqual(args.style, 'article');
});

test('applyTypeDefaults: proposal-base type leaves style=proposal', () => {
  const args = parseArgs(['--input', 'x.md', '--type', 'resume']);
  applyTypeDefaults(args);
  assert.strictEqual(args.style, 'proposal');
});

test('applyTypeDefaults: type theme default applies only when no explicit --theme', () => {
  const a = parseArgs(['--input', 'x.md', '--type', 'landing']);
  applyTypeDefaults(a);
  assert.strictEqual(a.theme, 'brand');               // type default

  const b = parseArgs(['--input', 'x.md', '--type', 'landing', '--theme', 'dark']);
  applyTypeDefaults(b);
  assert.strictEqual(b.theme, 'dark');                // explicit flag wins
});

test('applyTypeDefaults: an explicit --style wins over the type base format', () => {
  // resume is proposal-base, but an explicit --style article must win (the guard only fires
  // when style is still the 'proposal' default), proving flag > type precedence.
  const a = parseArgs(['--input', 'x.md', '--type', 'resume', '--style', 'article']);
  applyTypeDefaults(a);
  assert.strictEqual(a.style, 'article');
});

test('applyTypeDefaults: --slides is preserved (an article-base type does not force style)', () => {
  const a = parseArgs(['--input', 'x.md', '--type', 'changelog', '--slides']);
  applyTypeDefaults(a);
  assert.strictEqual(a.slides, true);
});

test('applyTypeDefaults: unknown type throws with a helpful message', () => {
  const args = parseArgs(['--input', 'x.md', '--type', 'bogus']);
  assert.throws(() => applyTypeDefaults(args), /unknown --type "bogus"/);
});

test('applyTypeDefaults: type=null is a no-op', () => {
  const args = parseArgs(['--input', 'x.md']);
  const before = JSON.stringify(args);
  applyTypeDefaults(args);
  assert.strictEqual(JSON.stringify(args), before);
});

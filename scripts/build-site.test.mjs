import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteLinks, buildManifest } from './build-site.mjs';

const M = [
  { srcAbs: '', srcRel: 'plugins/portable-docs/docs/README.md', outRel: 'index.html' },
  { srcAbs: '', srcRel: 'plugins/portable-docs/docs/formats.md', outRel: 'formats.html' },
  { srcAbs: '', srcRel: 'plugins/portable-docs/docs/commands-and-cli.md', outRel: 'commands-and-cli.html' },
  { srcAbs: '', srcRel: 'plugins/portable-docs/references/icons.md', outRel: 'references/icons.html' },
];
const DOCS_README = 'plugins/portable-docs/docs/README.md';
const DOCS_FORMATS = 'plugins/portable-docs/docs/formats.md';
const REF_ICONS = 'plugins/portable-docs/references/icons.md';

test('intra-docs link .md -> .html', () => {
  assert.equal(rewriteLinks('see [Formats](formats.md).', DOCS_README, M), 'see [Formats](formats.html).');
});
test('README link maps to index.html', () => {
  assert.equal(rewriteLinks('[home](README.md)', DOCS_FORMATS, M), '[home](index.html)');
});
test('anchor is preserved', () => {
  assert.equal(rewriteLinks('[watch](commands-and-cli.md#watch)', DOCS_README, M), '[watch](commands-and-cli.html#watch)');
});
test('docs -> references link resolves into references/ subdir', () => {
  assert.equal(rewriteLinks('[icons](../references/icons.md)', DOCS_README, M), '[icons](references/icons.html)');
});
test('references -> docs link climbs out of subdir', () => {
  assert.equal(rewriteLinks('[fmt](../docs/formats.md)', REF_ICONS, M), '[fmt](../formats.html)');
});
test('un-built target (project root README) -> GitHub blob URL', () => {
  assert.equal(rewriteLinks('[proj](../../../README.md)', DOCS_README, M),
    '[proj](https://github.com/BourbonDog/portable-docs/blob/main/README.md)');
});
test('external URL is left untouched', () => {
  assert.equal(rewriteLinks('[x](https://example.com/a.md)', DOCS_README, M), '[x](https://example.com/a.md)');
});
test('buildManifest maps README->index and refs into references/', () => {
  const man = buildManifest();
  assert.equal(man.find(e => e.srcRel.endsWith('docs/README.md')).outRel, 'index.html');
  assert.ok(man.some(e => e.srcRel.endsWith('docs/formats.md') && e.outRel === 'formats.html'));
  assert.ok(man.some(e => e.outRel === 'references/markers.html'));
  assert.equal(man.length, 16); // 11 docs (incl. index) + 5 references — verified on disk
});

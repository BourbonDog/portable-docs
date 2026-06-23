'use strict';
/**
 * Task 2.1 — Generic branding test
 *
 * Verifies that:
 *   1. parser extracts @footer from the header block
 *   2. parser extracts @cards label attribute
 *   3. built HTML contains fixture-specific brand strings (Acme Labs, © Acme Labs, Capabilities)
 *   4. built HTML does NOT contain any of the removed org/person literals
 */
const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const FIXTURE = path.join(__dirname, 'fixtures', 'acme-generic.md');
const ENGINE  = path.join(__dirname, '..');

// ── parser unit tests ────────────────────────────────────────────────────────

test('parser: extractContent parses @footer from header block', () => {
  const { extractContent } = require(path.join(ENGINE, 'src/utils/parser.js'));
  const md = fs.readFileSync(FIXTURE, 'utf8');
  const c  = extractContent(md);
  assert.ok(c.header, 'header must be present');
  assert.equal(c.header.footer, '© Acme Labs', 'header.footer must be "© Acme Labs"');
  assert.equal(c.header.brand,  'Acme Labs',   'header.brand must be "Acme Labs"');
  assert.equal(c.header.eyebrow,'Whitepaper',  'header.eyebrow must be "Whitepaper"');
  assert.equal(c.header.logo,   'A',           'header.logo must be "A"');
});

test('parser: extractCards includes label from @cards marker', () => {
  const { extractContent } = require(path.join(ENGINE, 'src/utils/parser.js'));
  const md = fs.readFileSync(FIXTURE, 'utf8');
  const c  = extractContent(md);
  assert.ok(c.cards.length > 0, 'cards must be present');
  const topicGroup = c.cards.find(g => g.type === 'topic');
  assert.ok(topicGroup, 'topic card group must be present');
  assert.equal(topicGroup.label, 'Capabilities', 'card group label must be "Capabilities"');
});

test('parser: extractCards is order-independent — label before section still captured', () => {
  const { extractContent } = require(path.join(ENGINE, 'src/utils/parser.js'));
  // Inline fixture: label appears BEFORE section in the opening tag
  const md = `
<!-- @header -->
<!-- @from name="Test User" email="test@example.com" -->
<!-- @title value="Test Doc" -->
<!-- /@header -->

## 1. Intro

<!-- @cards type="topic" label="Caps" section="1" -->
<!-- @card icon="star" title="Alpha" -->
Alpha content.
<!-- /@card -->
<!-- /@cards -->
`;
  const c = extractContent(md);
  assert.ok(c.cards.length > 0, 'cards must be present');
  const group = c.cards[0];
  assert.equal(group.type,    'topic', 'type must be "topic"');
  assert.equal(group.label,   'Caps',  'label must be "Caps" even when written before section');
  assert.equal(group.section, '1',     'section must be "1"');
  assert.equal(group.columns, 3,       'columns must default to 3');
});

// ── build integration test ───────────────────────────────────────────────────

test('build: output HTML contains generic branding and no hardcoded org literals', async () => {
  const tmpHtml = path.join(os.tmpdir(), 'pd-acme-test.html');

  // Run build-doc orchestrator
  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  // Override argv then run
  const origArgv = process.argv;
  process.argv = [
    'node', 'build-doc.js',
    '--input', FIXTURE,
    '--out',   tmpHtml,
    '--no-open',
  ];

  try {
    await main();
  } finally {
    process.argv = origArgv;
  }

  assert.ok(fs.existsSync(tmpHtml), 'output HTML file must exist');
  const html = fs.readFileSync(tmpHtml, 'utf8');

  // Must contain fixture-specific strings
  assert.ok(html.includes('Acme Labs'),    'HTML must include "Acme Labs"');
  assert.ok(html.includes('© Acme Labs'), 'HTML must include "© Acme Labs" (footer)');
  assert.ok(html.includes('Capabilities'), 'HTML must include "Capabilities" (card label)');

  // Must NOT contain removed hardcoded strings
  assert.ok(!html.includes('McCormick School'),                    'HTML must NOT contain "McCormick School"');
  assert.ok(!html.includes('Northwestern University'),             'HTML must NOT contain "Northwestern University"');
  assert.ok(!html.includes('Faculty Proposal'),                    'HTML must NOT contain "Faculty Proposal"');
  assert.ok(!html.includes('Growth Framework · Prepared for Josh Walinski'),
            'HTML must NOT contain WCP primary footer line');
  assert.ok(!html.includes('Windy City Performance'),              'HTML must NOT contain "Windy City Performance"');
});

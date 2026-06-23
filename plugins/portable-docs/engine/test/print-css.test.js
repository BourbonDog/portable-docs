'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { PRINT_CSS, SLIDES_PRINT_CSS } = require('../scripts/print-css.js');
const { generateHTML } = require('../scripts/wrap-html.js');

const TINY = 'const App = () => React.createElement("div", null, "x");\nexport default App;';

test('PRINT_CSS carries the core print rules', () => {
  assert.match(PRINT_CSS, /@media print/);
  assert.match(PRINT_CSS, /\.pd-no-print\s*\{[^}]*display:\s*none/);
  assert.match(PRINT_CSS, /\.pd-collapsible\s*\{[^}]*max-height:\s*none/);
  assert.match(PRINT_CSS, /break-inside:\s*avoid/);
  assert.match(PRINT_CSS, /print-color-adjust:\s*exact/);
});

test('SLIDES_PRINT_CSS paginates one slide per landscape page', () => {
  assert.match(SLIDES_PRINT_CSS, /size:\s*landscape/);
  assert.match(SLIDES_PRINT_CSS, /break-after:\s*page/);
});

test('generateHTML injects print CSS and data-pd-format', () => {
  const proposal = generateHTML(TINY, 'T', 'editorial');
  assert.match(proposal, /data-pd-format="proposal"/);
  assert.ok(proposal.includes('@media print'), 'print CSS present');
  assert.ok(!proposal.includes('size: landscape'), 'no slides CSS in proposal');

  const slides = generateHTML(TINY, 'T', 'editorial', { format: 'slides', noScroll: true });
  assert.match(slides, /data-pd-format="slides"/);
  assert.ok(slides.includes('size: landscape'), 'slides print CSS present');
});

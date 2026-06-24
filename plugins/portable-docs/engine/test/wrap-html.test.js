'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { wrapHtml, generateHTML } = require('../scripts/wrap-html.js');

test('generateHTML emits data-pd-type on the html tag only when a type is given', () => {
  const bundle = 'const App = () => React.createElement("div", null, "x");';
  const withType = generateHTML(bundle, 'T', 'editorial', { type: 'resume' });
  assert.ok(withType.includes('data-pd-format="proposal" data-pd-type="resume">'),
    'a typed build carries data-pd-type on the <html> tag');
  const noType = generateHTML(bundle, 'T', 'editorial');
  assert.ok(noType.includes('data-pd-format="proposal">'), 'untyped build html tag ends after format');
  assert.ok(!noType.includes('data-pd-type="resume">'), 'untyped build has no data-pd-type attribute');
});

test('generateHTML always includes the (inert) résumé compact CSS block', () => {
  const bundle = 'const App = () => React.createElement("div", null, "x");';
  const out = generateHTML(bundle, 'T', 'editorial');
  // Present but scoped to html[data-pd-type="resume"], so inert for every non-résumé doc.
  assert.ok(out.includes('html[data-pd-type="resume"]'), 'résumé compact CSS present');
  assert.ok(out.includes('.timeline-entry'), 'compact timeline rule present');
});

test('wrapHtml threads type onto the output html tag', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-wraptype-'));
  const out = path.join(dir, 'r.html');
  try {
    wrapHtml({ jsx: 'const App = () => React.createElement("div", null, "x");', title: 'R', out, type: 'resume' });
    const html = fs.readFileSync(out, 'utf8');
    assert.ok(html.includes('data-pd-type="resume">'), 'wrapHtml emits data-pd-type on the html tag');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('generateHTML embeds the portable-docs favicon as a self-contained data URI', () => {
  const bundle = 'const App = () => React.createElement("div", null, "x");';
  const out = generateHTML(bundle, 'T', 'editorial');
  assert.ok(out.includes('rel="icon"'), 'favicon link present in <head>');
  assert.ok(out.includes('type="image/svg+xml"'), 'favicon declared as SVG');
  assert.ok(out.includes('href="data:image/svg+xml;base64,'), 'favicon inlined as data URI (no external request)');
});

test('generateHTML escapes </script> in the inlined app body', () => {
  // A bundle whose compiled output embeds the literal closing tag in content.
  const bundle = 'const App = () => React.createElement("pre", null, "a</script>b");';
  const out = generateHTML(bundle, 'T', 'editorial');
  assert.ok(out.includes('a<\\/script>b'), 'closing tag inside content is escaped');
  assert.ok(!out.includes('a</script>b'), 'no raw </script> survives from content');
});

test('wrapHtml inlines React, precompiles JSX, ships no CDN/Babel', () => {
  const out = path.join(os.tmpdir(), `pd-wrap-${process.hrtime.bigint()}.html`);
  wrapHtml({
    jsx: 'const App = () => React.createElement("div", null, "x");\nexport default App;',
    title: 'T', out,
  });
  const h = fs.readFileSync(out, 'utf8');
  assert.ok(h.includes('react.production.min.js'), 'React UMD inlined (banner present)');
  assert.ok(h.includes('react-dom.production.min.js'), 'ReactDOM UMD inlined (banner present)');
  assert.ok(/ReactDOM\.createRoot/.test(h), 'createRoot present');
  assert.ok(h.includes('<div id="root"'), 'root mount present');
  assert.ok(h.includes('React.createElement'), 'precompiled to React.createElement');
  assert.ok(!h.includes('unpkg.com'), 'no CDN reference');
  assert.ok(!h.includes('@babel/standalone'), 'no in-browser Babel');
  assert.ok(!h.includes('type="text/babel"'), 'no text/babel script');
  assert.ok(!/export default/.test(h), 'default export stripped');
});

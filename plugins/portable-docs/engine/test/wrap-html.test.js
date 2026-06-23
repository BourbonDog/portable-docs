'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { wrapHtml, generateHTML } = require('../scripts/wrap-html.js');

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

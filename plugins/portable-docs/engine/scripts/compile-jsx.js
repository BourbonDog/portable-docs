'use strict';
/**
 * compile-jsx.js — build-time JSX→JS compiler.
 *
 * Loads the vendored @babel/standalone (in Node) ONCE and transforms a JSX
 * source string into plain JS using the CLASSIC runtime: output calls
 * React.createElement against the React global (no `import`, no
 * react/jsx-runtime). This is the build-time replacement for the old
 * in-browser `type="text/babel"` compile — so the output needs no CDN/Babel.
 */
const path = require('path');

let _Babel = null;
function getBabel() {
  if (_Babel) return _Babel;
  const mod = require(path.join(__dirname, '..', 'vendor', 'babel.min.js'));
  // @babel/standalone UMD exports the Babel object; fall back to the Node
  // global if a particular build assigned it there instead.
  _Babel = (mod && typeof mod.transform === 'function') ? mod : global.Babel;
  if (!_Babel || typeof _Babel.transform !== 'function') {
    throw new Error('compile-jsx: vendored Babel did not expose transform()');
  }
  return _Babel;
}

function compileToJs(src) {
  if (typeof src !== 'string') throw new Error('compile-jsx: src must be a string');
  const { code } = getBabel().transform(src, {
    presets: [['react', { runtime: 'classic' }]],
  });
  return code;
}

module.exports = { compileToJs };

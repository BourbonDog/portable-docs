#!/usr/bin/env node
/**
 * wrap-html.js — wraps a bundled JSX file into a self-contained HTML file.
 *
 * React + ReactDOM production UMD files are inlined directly into the output so
 * the document is fully self-contained and renders offline (no CDN). JSX is
 * compiled to plain JS at BUILD TIME via compile-jsx.js (vendored
 * @babel/standalone), so no in-browser Babel and no type="text/babel" are
 * needed.
 *
 * API:  wrapHtml({ jsx, title, out, theme })
 * CLI:  reads PD_JSX_OUT (input bundle), PD_HTML_OUT (output html),
 *       PD_TITLE, PD_THEME from env.
 */

const fs = require('fs');
const path = require('path');
const { compileToJs } = require('./compile-jsx.js');
const { PRINT_CSS, SLIDES_PRINT_CSS } = require('./print-css.js');

// React/ReactDOM production UMD, read once and inlined into every output so the
// document is fully self-contained and renders offline (no CDN, no in-browser Babel).
const VENDOR = path.join(__dirname, '..', 'vendor');
const REACT_UMD = fs.readFileSync(path.join(VENDOR, 'react.production.min.js'), 'utf-8');
const REACTDOM_UMD = fs.readFileSync(path.join(VENDOR, 'react-dom.production.min.js'), 'utf-8');

/**
 * Strip ESM import/export lines that are not valid in a UMD/browser context.
 * The bundle uses React/ReactDOM as globals; we remove:
 *   - import React … from 'react'
 *   - import … from 'react'
 *   - export default App
 */
function stripEsmLines(source) {
  let code = source;
  // Remove the ES module import line - HTML files use UMD globals
  code = code.replace(/^import React.*from ['"]react['"];?\s*$/m, '');
  code = code.replace(/^import.*from ['"]react['"];?\s*$/gm, '');
  // Remove the export default line (any component name)
  code = code.replace(/^export default \w+;?\s*$/m, '');
  return code;
}

// Body background per theme — keeps the browser chrome matching the document.
// editorial/brand use paper white; dark gets the deep base.
// design-tokens.js contains JSX (Icons), so we can't require() it here.
const THEME_BODY_BG = {
  editorial: '#FAFAFA',
  dark:      '#0D1117',
  brand:     '#FAFAFA',
};

/**
 * Generate the HTML wrapper.
 *
 * @param {string} bundle      - Already-stripped JSX bundle text.
 * @param {string} title       - Page <title> text.
 * @param {string} theme       - Theme name: 'editorial' | 'dark' | 'brand' (default: 'editorial').
 * @param {Object} [opts]      - Optional flags.
 * @param {boolean} [opts.noScroll=false] - When true, prepends an
 *   `html, body { height: 100%; overflow: hidden; }` rule to the <style>
 *   block so full-viewport wrappers (e.g. slide decks) have no FOUC before
 *   React mounts its own equivalent rule. Default (falsy) emits output that
 *   is byte-identical to the pre-opts API so proposal/article wrappers are
 *   unchanged.
 */
function generateHTML(bundle, title, theme, opts) {
  const resolvedTheme = theme || 'editorial';
  const format = (opts && opts.format) || 'proposal';
  const themeAttr = ` data-pd-theme="${resolvedTheme}" data-pd-format="${format}"`;
  const bodyBg = THEME_BODY_BG[resolvedTheme] || THEME_BODY_BG.editorial;
  const printCss = PRINT_CSS + (format === 'slides' ? SLIDES_PRINT_CSS : '');
  const noScrollRule = (opts && opts.noScroll)
    ? '    html, body { height: 100%; overflow: hidden; }\n'
    : '';

  // Build the script body as JSX, then compile it to plain JS at BUILD TIME.
  // React/ReactDOM are inlined above, so the output needs no CDN and no
  // in-browser Babel — it renders offline and instantly.
  const scriptBodyJsx = `const { useState, useEffect, useRef, useCallback, useMemo } = React;

${bundle}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
  const compiled = compileToJs(scriptBodyJsx);

  return `<!DOCTYPE html>
<html lang="en"${themeAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>

  <!-- React + ReactDOM (production UMD) inlined for offline, self-contained output. -->
  <script>${REACT_UMD}</script>
  <script>${REACTDOM_UMD}</script>

  <style>
${noScrollRule}    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: ${bodyBg}; }
${printCss}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
${compiled}
  </script>
</body>
</html>`;
}

/**
 * wrapHtml — reads a JSX bundle, strips ESM lines, and writes a single HTML file.
 *
 * @param {Object} opts
 * @param {string} opts.jsx   - Raw JSX bundle text (already read from disk).
 * @param {string} opts.title - Page title.
 * @param {string} opts.out   - Absolute path to write the HTML file.
 * @param {string} [opts.theme] - Theme name (optional; not yet implemented).
 */
function wrapHtml({ jsx, title, out, theme }) {
  if (!jsx) throw new Error('wrapHtml: jsx is required');
  if (!out)  throw new Error('wrapHtml: out (output path) is required');

  const resolvedTitle = title || 'Portable Document';
  const stripped = stripEsmLines(jsx);

  // Ensure output directory exists
  const outDir = path.dirname(out);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const html = generateHTML(stripped, resolvedTitle, theme);
  fs.writeFileSync(out, html, 'utf-8');

  const sizeKB = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`wrap-html: wrote ${out} (${sizeKB} KB)`);
}

module.exports = {
  wrapHtml,
  // Exported for reuse by the article wrapper (scripts/wrap-article-html.js):
  // the ESM-strip pass, the per-theme body-bg map, and the HTML shell that
  // carries the classic-runtime fix all stay defined once here (DRY).
  stripEsmLines,
  THEME_BODY_BG,
  generateHTML,
};

if (require.main === module) {
  const jsxPath = process.env.PD_JSX_OUT;
  const htmlOut  = process.env.PD_HTML_OUT;
  const title    = process.env.PD_TITLE || 'Portable Document';
  const theme    = process.env.PD_THEME;

  if (!jsxPath) {
    console.error('wrap-html: PD_JSX_OUT env var is required (path to the JSX bundle)');
    process.exit(1);
  }
  if (!htmlOut) {
    console.error('wrap-html: PD_HTML_OUT env var is required (path to write the HTML file)');
    process.exit(1);
  }

  const jsx = fs.readFileSync(jsxPath, 'utf-8');
  wrapHtml({ jsx, title, out: htmlOut, theme });
}

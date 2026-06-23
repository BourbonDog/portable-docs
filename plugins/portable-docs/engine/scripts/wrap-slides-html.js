'use strict';
/**
 * wrap-slides-html.js — wraps the SLIDE DECK JSX bundle into a self-contained HTML file.
 *
 * The slide bundle is the same shape as the proposal/article bundle (ESM import
 * header + `export default App`), so the never-blank + classic-runtime
 * requirements are identical. REUSES wrap-html.js's shared pieces (DRY):
 *   - stripEsmLines → removes the ESM import/export lines
 *   - generateHTML  → the classic-runtime HTML shell (THEME_BODY_BG applied)
 *
 * The deck is full-viewport and must NOT scroll at the page level. SlideDeck.jsx
 * injects `html,body { overflow: hidden; height: 100% }` via a useEffect, but
 * the wrapper also sets a matching body style so there is no FOUC on slow loads.
 *
 * API:  wrapSlidesHtml({ jsx, title, out, theme })
 * CLI:  reads PD_JSX_OUT, PD_HTML_OUT, PD_TITLE, PD_THEME from env.
 */

const fs   = require('fs');
const path = require('path');

const { stripEsmLines, generateHTML } = require('./wrap-html.js');

/**
 * Wrap a slide deck JSX bundle into a single HTML file.
 * @param {Object} opts
 * @param {string} opts.jsx     - Raw slide deck JSX bundle text.
 * @param {string} opts.title   - Page <title>.
 * @param {string} opts.out     - Absolute path to write the HTML file.
 * @param {string} [opts.theme] - Theme name ('editorial' | 'dark' | 'brand').
 */
function wrapSlidesHtml({ jsx, title, out, theme }) {
  if (!jsx) throw new Error('wrapSlidesHtml: jsx is required');
  if (!out)  throw new Error('wrapSlidesHtml: out (output path) is required');

  const resolvedTitle = title || 'Slide Deck';
  const resolvedTheme = theme || 'editorial';
  const stripped = stripEsmLines(jsx);

  // generateHTML produces the classic-runtime HTML shell with theme body-bg.
  // The noScroll option adds `html, body { height: 100%; overflow: hidden; }`
  // to the <style> block so the deck never scrolls before React mounts.
  const html = generateHTML(stripped, resolvedTitle, resolvedTheme, { noScroll: true, format: 'slides' });

  const outDir = path.dirname(out);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(out, html, 'utf-8');

  const sizeKB = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`wrap-slides-html: wrote ${out} (${sizeKB} KB)`);
}

module.exports = { wrapSlidesHtml };

if (require.main === module) {
  const jsxPath = process.env.PD_JSX_OUT;
  const htmlOut = process.env.PD_HTML_OUT;
  const title   = process.env.PD_TITLE || 'Slide Deck';
  const theme   = process.env.PD_THEME;

  if (!jsxPath) { console.error('wrap-slides-html: PD_JSX_OUT env var is required'); process.exit(1); }
  if (!htmlOut) { console.error('wrap-slides-html: PD_HTML_OUT env var is required'); process.exit(1); }

  const jsx = fs.readFileSync(jsxPath, 'utf-8');
  wrapSlidesHtml({ jsx, title, out: htmlOut, theme });
}

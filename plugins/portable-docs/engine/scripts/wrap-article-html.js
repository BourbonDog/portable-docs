'use strict';
/**
 * wrap-article-html.js — wraps the ARTICLE JSX bundle into a self-contained HTML file.
 *
 * The article bundle is the same shape as the proposal bundle (ESM import
 * header + `export default App`), and the never-blank requirements are
 * identical (classic JSX runtime, UMD React globals, theme body-bg). So this
 * wrapper REUSES wrap-html.js's shared pieces rather than re-declaring the
 * template (DRY):
 *   - stripEsmLines   → removes the ESM import/export lines
 *   - generateHTML    → the classic-runtime HTML shell (also applies THEME_BODY_BG)
 *
 * API:  wrapArticleHtml({ jsx, title, out, theme })
 * CLI:  reads PD_JSX_OUT, PD_HTML_OUT, PD_TITLE, PD_THEME from env.
 */

const fs   = require('fs');
const path = require('path');

const { stripEsmLines, generateHTML } = require('./wrap-html.js');

/**
 * Wrap an article JSX bundle into a single HTML file.
 * @param {Object} opts
 * @param {string} opts.jsx     - Raw article JSX bundle text.
 * @param {string} opts.title   - Page <title>.
 * @param {string} opts.out     - Absolute path to write the HTML file.
 * @param {string} [opts.theme] - Theme name ('editorial' | 'dark' | 'brand').
 */
function wrapArticleHtml({ jsx, title, out, theme }) {
  if (!jsx) throw new Error('wrapArticleHtml: jsx is required');
  if (!out)  throw new Error('wrapArticleHtml: out (output path) is required');

  const resolvedTitle = title || 'Portable Article';
  const stripped = stripEsmLines(jsx);

  const outDir = path.dirname(out);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const html = generateHTML(stripped, resolvedTitle, theme);
  fs.writeFileSync(out, html, 'utf-8');

  const sizeKB = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`wrap-article-html: wrote ${out} (${sizeKB} KB)`);
}

module.exports = { wrapArticleHtml };

if (require.main === module) {
  const jsxPath = process.env.PD_JSX_OUT;
  const htmlOut = process.env.PD_HTML_OUT;
  const title   = process.env.PD_TITLE || 'Portable Article';
  const theme   = process.env.PD_THEME;

  if (!jsxPath) { console.error('wrap-article-html: PD_JSX_OUT env var is required'); process.exit(1); }
  if (!htmlOut) { console.error('wrap-article-html: PD_HTML_OUT env var is required'); process.exit(1); }

  const jsx = fs.readFileSync(jsxPath, 'utf-8');
  wrapArticleHtml({ jsx, title, out: htmlOut, theme });
}

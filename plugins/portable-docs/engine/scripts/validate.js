'use strict';
/**
 * validate.js — Hardened render validator (never-blank gate)
 *
 * Statically confirms a generated HTML file is offline-ready and will actually
 * render in the browser. Enforces: React + ReactDOM inlined (no CDN), JSX
 * precompiled at build time (no in-browser Babel), root mount present, no ESM
 * leaks.
 *
 * API:  validate({ htmlPath }) → { ok: boolean, errors: string[] }
 * CLI:  node scripts/validate.js --html <path>
 *       (also reads PD_HTML_OUT env var; exits non-zero on failure)
 */

const fs = require('fs');

/**
 * Validate a generated HTML file against offline render-safety checks.
 * @param {{ htmlPath: string }} opts
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validate({ htmlPath }) {
  const errors = [];
  if (!fs.existsSync(htmlPath)) { errors.push(`File not found: ${htmlPath}`); return { ok: false, errors }; }
  const content = fs.readFileSync(htmlPath, 'utf-8');
  if (!content.trim()) { errors.push('File is empty'); return { ok: false, errors }; }

  // React + ReactDOM inlined (UMD banners present)
  if (!content.includes('react.production.min.js')) errors.push('Missing inlined React UMD (react.production.min.js banner not found)');
  if (!content.includes('react-dom.production.min.js')) errors.push('Missing inlined ReactDOM UMD (react-dom.production.min.js banner not found)');

  // Mount + render
  if (!content.includes('ReactDOM.createRoot')) errors.push('Missing ReactDOM.createRoot call');
  if (!content.includes('.render(')) errors.push('Missing .render( call');
  if (!content.includes('<div id="root"')) errors.push('Missing <div id="root" — no mount point');

  // Offline: no CDN
  if (content.includes('unpkg.com')) errors.push('CDN reference found (unpkg.com) — output must be self-contained/offline');

  // No in-browser compile
  if (content.includes('@babel/standalone')) errors.push('In-browser Babel found (@babel/standalone) — JSX must be precompiled at build time');
  if (content.includes('type="text/babel"')) errors.push('type="text/babel" script found — JSX must be precompiled at build time');

  // No ESM/JSX leak (strip HTML comments first)
  const noComments = content.replace(/<!--[\s\S]*?-->/g, '');
  if (noComments.includes('import React')) errors.push('ESM leak: "import React" found — use the inlined UMD global');
  if (noComments.includes('react/jsx-runtime')) errors.push('ESM leak: "react/jsx-runtime" found');

  return { ok: errors.length === 0, errors };
}

module.exports = { validate };

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  let htmlPath = process.env.PD_HTML_OUT || '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--html' && args[i + 1]) {
      htmlPath = args[i + 1];
      break;
    }
  }

  if (!htmlPath) {
    console.error('Usage: node scripts/validate.js --html <path>');
    console.error('       PD_HTML_OUT=<path> node scripts/validate.js');
    process.exit(2);
  }

  const { ok, errors } = validate({ htmlPath });
  if (!ok) {
    console.error('Validation FAILED:');
    errors.forEach(e => console.error('  ✗ ' + e));
    process.exit(1);
  }
  console.log('Validation PASSED');
  process.exit(0);
}

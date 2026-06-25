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

/** Replace the CONTENTS of '…' / "…" / `…` literals with empty, honoring \\ escapes. */
function maskStringLiterals(src) {
  let out = '';
  let i = 0;
  const s = String(src);
  while (i < s.length) {
    const ch = s[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      out += ch; // keep the opening quote
      i++;
      while (i < s.length && s[i] !== ch) {
        if (s[i] === '\\') { i += 2; continue; } // skip escaped char
        i++;
      }
      if (i < s.length) { out += ch; i++; } // keep the closing quote
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

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

  // Locate the app content script (the one that mounts React).
  const scripts = [...content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  const appBody = (scripts.find(m => m[1].includes('ReactDOM.createRoot')) || [,''])[1];
  const shell = appBody ? content.split(appBody).join('') : content;

  // Structural leaks live in real tags (head scripts/links), not in document content.
  if (shell.includes('unpkg.com')) errors.push('CDN reference found (unpkg.com) — output must be self-contained/offline');
  if (shell.includes('@babel/standalone')) errors.push('In-browser Babel found (@babel/standalone) — JSX must be precompiled at build time');
  if (shell.includes('type="text/babel"')) errors.push('type="text/babel" script found — JSX must be precompiled at build time');

  // ESM leaks are CODE in the app body; mask string-literal contents so document
  // text that merely mentions these tokens does not trip the gate. A real leak shows
  // up as an `import … from` STATEMENT — the specific module string (e.g.
  // "react/jsx-runtime") is itself a string literal that masking empties, so we detect
  // the statement SHAPE rather than the module name. Document prose that quotes an
  // import lives inside a string literal and is emptied, so it cannot match.
  const appCode = maskStringLiterals(appBody);
  if (/\bimport\s+React\b/.test(appCode)) errors.push('ESM leak: "import React" found — use the inlined UMD global');
  // `[^;]*?` is newline-tolerant (catches multi-line `import {\n…\n} from`) but stops
  // at the statement-ending `;`, so it can't span two unrelated statements.
  if (/\bimport\b[^;]*?\bfrom\b/.test(appCode)) errors.push('ESM leak: uncompiled "import … from" statement found — JSX must be precompiled');

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

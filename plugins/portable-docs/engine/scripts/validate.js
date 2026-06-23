'use strict';
/**
 * validate.js — Hardened render validator (never-blank gate)
 *
 * Statically confirms a generated HTML file will actually render in the browser.
 * Catches the blank-page failure class caused by a leaked ESM import in a classic
 * <script> tag.
 *
 * API:  validate({ htmlPath }) → { ok: boolean, errors: string[] }
 * CLI:  node scripts/validate.js --html <path>
 *       (also reads PD_HTML_OUT env var; exits non-zero on failure)
 */

const fs = require('fs');

/**
 * Validate a generated HTML file against 8 render-safety checks.
 * @param {{ htmlPath: string }} opts
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validate({ htmlPath }) {
  const errors = [];

  // Check 1: file exists and is non-empty
  if (!fs.existsSync(htmlPath)) {
    errors.push(`File not found: ${htmlPath}`);
    return { ok: false, errors };
  }
  const content = fs.readFileSync(htmlPath, 'utf-8');
  if (!content.trim()) {
    errors.push('File is empty');
    return { ok: false, errors };
  }

  // Check 2: React UMD + ReactDOM UMD
  if (!content.includes('unpkg.com/react@18')) {
    errors.push('Missing React 18 UMD script (unpkg.com/react@18)');
  }
  if (!content.includes('react-dom@18')) {
    errors.push('Missing ReactDOM 18 UMD script (react-dom@18)');
  }

  // Check 3: @babel/standalone
  if (!content.includes('@babel/standalone')) {
    errors.push('Missing @babel/standalone script');
  }

  // Check 4: Babel.registerPreset('react-classic' (single or double quotes)
  if (!content.includes("Babel.registerPreset('react-classic'") &&
      !content.includes('Babel.registerPreset("react-classic"')) {
    errors.push("Missing Babel.registerPreset('react-classic' or \"react-classic\") — classic-runtime preset not registered");
  }

  // Check 5: data-presets="react-classic"
  if (!content.includes('data-presets="react-classic"')) {
    errors.push('Missing data-presets="react-classic" on the Babel script tag');
  }

  // Check 6: ReactDOM.createRoot AND .render(
  if (!content.includes('ReactDOM.createRoot')) {
    errors.push('Missing ReactDOM.createRoot call');
  }
  if (!content.includes('.render(')) {
    errors.push('Missing .render( call');
  }

  // Check 7: no ESM leaks — import React or react/jsx-runtime must NOT be present
  // Strip HTML comments first so an explanatory comment about the problem
  // does not falsely trigger the leak check (the comment in the template
  // mentions "react/jsx-runtime" to explain WHY it is avoided).
  const noComments = content.replace(/<!--[\s\S]*?-->/g, '');
  if (noComments.includes('import React')) {
    errors.push('ESM leak detected: "import React" found — use UMD globals instead');
  }
  if (noComments.includes('react/jsx-runtime')) {
    errors.push('ESM leak detected: "react/jsx-runtime" found — automatic JSX runtime not compatible with classic <script>');
  }

  // Check 8: root mount point
  if (!content.includes('<div id="root"')) {
    errors.push('Missing <div id="root" — no mount point for ReactDOM.createRoot');
  }

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

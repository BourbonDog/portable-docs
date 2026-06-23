#!/usr/bin/env node
/**
 * Build Script
 * Bundles all components into a single JSX file for Claude artifact rendering
 *
 * Usage: node src/utils/build.js
 * Output: dist/ProductEngineerProposal.jsx
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(__dirname, '../../dist');
// OUTPUT_FILE is NOT evaluated at module-load time; it is resolved inside build()
// so that each call picks up the current PD_JSX_OUT (which build-doc.js sets to
// a per-invocation temp path to prevent parallel-build races).

// Read all component files
function readComponent(name) {
  const filePath = path.join(SRC_DIR, 'components', `${name}.jsx`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: Component ${name} not found`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// Read content file.
// The build-doc pipeline ALWAYS sets PD_CONTENT_OUT to a per-invocation temp
// path, so the src/content.js fallback below is for legacy standalone runs only.
// src/content.js is generated scratch (gitignored), never a source file — do not
// commit or hand-edit it.
function readContent() {
  const filePath = process.env.PD_CONTENT_OUT || path.join(SRC_DIR, 'content.js');
  if (!fs.existsSync(filePath)) {
    console.error('Error: content.js not found. Run parser.js first.');
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// Read App component
function readApp() {
  const filePath = path.join(SRC_DIR, 'App.jsx');
  if (!fs.existsSync(filePath)) {
    console.error('Error: App.jsx not found.');
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// Read design tokens file
function readDesignTokens() {
  const filePath = path.join(SRC_DIR, 'design-tokens.js');
  if (!fs.existsSync(filePath)) {
    console.error('Error: design-tokens.js not found.');
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// Read the color helper (color.js) and strip its CommonJS wrapper so it can be
// inlined ahead of the design tokens in the browser bundle. This makes
// normalizeHex()/lighten() available to the design-tokens accent-override IIFE.
function readColorHelper() {
  const filePath = path.join(SRC_DIR, 'color.js');
  if (!fs.existsSync(filePath)) {
    console.error('Error: color.js not found.');
    process.exit(1);
  }
  const src = fs.readFileSync(filePath, 'utf-8');
  return src
    .replace(/^'use strict';?\s*$/m, '')
    // Strip block comments BEFORE removing module.exports: color.js's JSDoc
    // mentions "process.env" as a note, which must not leak into the browser
    // bundle (a themes test asserts the output contains no "process.env").
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^module\.exports\s*=.*$/m, '')
    .trim();
}

// Extract design tokens code (remove imports/exports for inline bundling)
// Also injects build-time literals for PD_THEME and PD_ACCENT so the browser
// bundle contains no `process.env` / `typeof process` references.
function extractDesignTokensCode(source) {
  let code = source;

  // Remove import statements
  code = code.replace(/^import.*$/gm, '');

  // Remove export keywords but keep the declarations
  code = code.replace(/^export const /gm, 'const ');
  code = code.replace(/^export default .*$/gm, '');
  code = code.replace(/^export \{[^}]*\};?\s*$/gm, '');

  // ── Build-time injection ──────────────────────────────────────────────────
  // Replace the ACTIVE_THEME guard with a literal so the browser never sees
  // `process`. Anchored on the const name for robustness.
  const resolvedTheme = process.env.PD_THEME || 'editorial';
  code = code.replace(
    /const ACTIVE_THEME\s*=.*?;/,
    `const ACTIVE_THEME = ${JSON.stringify(resolvedTheme)};`
  );

  // Replace the PD_ACCENT guard inside applyAccentOverride with a literal.
  // The function body reads:  const accent = (typeof process ... PD_ACCENT) || '';
  // Use the 's' (dotall) flag so the match works even if the line ends with \r\n.
  const resolvedAccent = process.env.PD_ACCENT || '';
  code = code.replace(
    /const accent\s*=.*?\|\|\s*''\s*;/s,
    `const accent = ${JSON.stringify(resolvedAccent)};`
  );

  // Inline the color helper BEFORE the design-tokens source so the accent
  // override IIFE can call normalizeHex()/lighten() at view time.
  return (readColorHelper() + '\n\n' + code).trim();
}

// Extract component code (remove imports/exports for inline bundling)
function extractComponentCode(source, componentName) {
  // Remove import statements (including design-tokens imports)
  let code = source.replace(/^import.*$/gm, '');

  // Remove export default
  code = code.replace(/export default \w+;?\s*$/gm, '');

  // Remove named exports at end
  code = code.replace(/export \{[^}]+\};?\s*$/gm, '');

  return code.trim();
}

// Strip ESM import/export syntax for inline bundling, preserving declarations.
// Shared by the proposal App bundling here and the article bundler, so both
// pipelines treat module syntax identically (DRY).
//   - removes `import … from '…'` (single- and multi-line)
//   - removes `export default <name>;`
//   - removes `export { … };`
//   - rewrites `export const ` → `const ` (keeps the declaration)
function stripModuleSyntax(source) {
  let code = source;
  // Single-line:  import X from 'y';   /   import { a, b } from 'y';
  code = code.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Multi-line:   import {\n  a,\n  b,\n} from 'y';
  code = code.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*/gm, '');
  // Bare default import on its own line
  code = code.replace(/^import\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Exports
  code = code.replace(/^export default \w+;?\s*$/gm, '');
  code = code.replace(/^export \{[^}]*\};?\s*$/gm, '');
  code = code.replace(/^export const /gm, 'const ');
  return code.trim();
}

// Build the single-file bundle
function build() {
  // Resolve output path at call time (not module-load time) so that each
  // invocation picks up the current PD_JSX_OUT, which build-doc.js sets to a
  // unique per-invocation temp path to prevent parallel-build file races.
  const outputFile = process.env.PD_JSX_OUT || path.join(DIST_DIR, 'ProductEngineerProposal.jsx');

  console.log('Building production bundle...\n');

  // Ensure dist directory exists (only when writing into DIST_DIR)
  if (outputFile.startsWith(DIST_DIR) && !fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Read design tokens first (single source of truth)
  console.log('  Reading design-tokens...');
  const designTokensSource = readDesignTokens();
  const designTokensCode = extractDesignTokensCode(designTokensSource);

  // Component order - Section must come first as it defines shared useInView hook
  const components = [
    'Section',      // Must be first - defines useInView hook used by other components
    'RichText',
    'Header',
    'CardGrid',
    'StatsGrid',
    'Chart',
    'Convergence',
    'QuoteCarousel',
    'PullQuote',
    'Credentials',
    'Timeline',
    'Testimonials',
    'Table',
    'Citations',
    'TerminalWindow',
    'SectionNav',
    'WorkList',
  ];

  // Read all components
  const componentCode = components.map((name) => {
    console.log(`  Reading ${name}...`);
    const source = readComponent(name);
    return extractComponentCode(source, name);
  }).join('\n\n');

  // Read content
  console.log('  Reading content...');
  let content = readContent();
  // Remove the export line
  content = content.replace(/export default CONTENT;?\s*$/gm, '');

  // Read App
  console.log('  Reading App...');
  let app = readApp();
  // Remove imports and convert to inline
  // Handle single-line imports: import X from 'y';
  app = app.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Handle multi-line imports: import { ... } from 'y';
  app = app.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*/gm, '');
  // Remove any remaining 'import X from' or standalone import lines
  app = app.replace(/^import\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  app = app.replace(/export default App;?\s*$/gm, '');

  // Build the final bundle
  // Note: For ES module environments, uncomment: import React, { useState } from 'react';
  // For browser UMD environments (like preview.html), React and useState should be globals
  const bundle = `/**
 * Product Engineer Proposal - Single File Bundle
 * Generated: ${new Date().toISOString()}
 *
 * This file is auto-generated. Do not edit directly.
 * To modify, edit the source files and run: node src/utils/build.js
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================================================
// CONTENT DATA
// ============================================================================

${content}

// ============================================================================
// DESIGN TOKENS (Single Source of Truth)
// ============================================================================

${designTokensCode}

// ============================================================================
// COMPONENTS
// ============================================================================

${componentCode}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

${app}

// Default export for Claude artifact
export default App;
`;

  // Write the bundle
  fs.writeFileSync(outputFile, bundle);
  console.log(`\n✓ Bundle written to ${outputFile}`);
  console.log(`  Size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
}

module.exports = {
  build,
  // Shared helpers reused by the article bundler (scripts/build-article.js) so
  // theme/accent build-time injection and ESM stripping stay in one place (DRY).
  extractDesignTokensCode,
  stripModuleSyntax,
  readDesignTokens,
  SRC_DIR,
};

// Run build
if (require.main === module) build();

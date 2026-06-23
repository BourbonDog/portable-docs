'use strict';
/**
 * lint.js — marker linter for the proposal DSL (+ the shared @header block).
 *
 * lintMarkdown(md, opts) → { errors, warnings }   (pure; no I/O)
 *   opts.format   : 'proposal' | 'article' | 'slides'  (default 'proposal')
 *   opts.iconNames: string[] of valid icon names (enables the unknown-icon warning)
 *
 * The MARKER_SPEC registry is the single source of truth for which markers
 * exist, which attributes they require, and which attributes are enums. A drift
 * test (lint.test.js) guards it against engine/src/utils/parser.js.
 */
const fs   = require('fs');
const path = require('path');

const MARKER_SPEC = {
  header:       { paired: true,  required: [],                              optional: [],                       enums: {} },
  title:        { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  subtitle:     { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  eyebrow:      { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  brand:        { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  brandsub:     { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  logo:         { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  date:         { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  from:         { paired: false, required: ['name', 'email'],               optional: ['linkedin', 'github'],   enums: {} },
  headshot:     { paired: false, required: ['url'],                         optional: [],                       enums: {} },
  footer:       { paired: false, required: ['value'],                       optional: [],                       enums: {} },
  stats:        { paired: true,  required: [],                              optional: [],                       enums: {} },
  stat:         { paired: false, required: ['value', 'label', 'source'],    optional: [],                       enums: {} },
  chart:        { paired: true,  required: ['type'],                        optional: ['title', 'subtitle'],    enums: { type: ['growth', 'bar', 'hierarchy', 'range'] } },
  series:       { paired: true,  required: ['label'],                       optional: [],                       enums: {} },
  point:        { paired: false, required: ['year', 'value'],               optional: [],                       enums: {} },
  bar:          { paired: false, required: ['label', 'value', 'unit'],      optional: ['source', 'cite'],       enums: {} },
  level:        { paired: false, required: ['from', 'to'],                  optional: [],                       enums: {} },
  range:        { paired: false, required: ['label', 'min', 'max', 'unit'], optional: ['highlight'],            enums: { highlight: ['true', 'false'] } },
  convergence:  { paired: true,  required: [],                              optional: ['position'],             enums: {} },
  role:         { paired: false, required: ['from', 'to', 'description'],   optional: [],                       enums: {} },
  quotes:       { paired: true,  required: [],                              optional: ['section'],              enums: {} },
  quote:        { paired: true,  required: ['author', 'title'],            optional: ['cite'],                 enums: {} },
  pullquote:    { paired: true,  required: [],                              optional: ['author', 'title'],      enums: {} },
  cards:        { paired: true,  required: ['type'],                        optional: ['columns', 'section', 'label'], enums: { type: ['feature', 'profile', 'topic'] } },
  card:         { paired: true,  required: ['icon', 'title'],              optional: ['audience'],             enums: {} },
  expanded:     { paired: false, required: [],                              optional: [],                       enums: {} },
  credentials:  { paired: true,  required: [],                              optional: [],                       enums: {} },
  credential:   { paired: false, required: ['value', 'label'],             optional: [],                       enums: {} },
  timeline:     { paired: true,  required: [],                              optional: [],                       enums: {} },
  entry:        { paired: true,  required: ['year', 'company', 'title', 'highlight'], optional: [],             enums: { highlight: ['true', 'false'] } },
  testimonials: { paired: true,  required: ['type'],                        optional: ['source'],               enums: {} },
  testimonial:  { paired: true,  required: [],                              optional: ['author', 'title', 'subtitle'], enums: {} },
  table:        { paired: false, required: [],                              optional: ['variant'],              enums: {} },
  terminal:     { paired: true,  required: ['title'],                       optional: ['command', 'variant'],   enums: {} },
  worklist:     { paired: true,  required: ['section'],                     optional: [],                       enums: {} },
  workitem:     { paired: true,  required: ['icon', 'title'],              optional: ['technologies'],         enums: {} },
};

// @header + its sub-markers — the only markers linted for attributes in article/slides.
const HEADER_SCOPE = new Set(['header', 'title', 'subtitle', 'eyebrow', 'brand',
  'brandsub', 'logo', 'date', 'from', 'headshot', 'footer']);

const OPEN_RE  = /<!--\s*@([a-zA-Z][\w-]*)\b([^>]*?)-->/g;
const CLOSE_RE = /<!--\s*\/@([a-zA-Z][\w-]*)\s*-->/g;

function parseAttrs(attrStr) {
  const attrs = {};
  const re = /([a-zA-Z][\w-]*)="([^"]*)"/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

function lintMarkdown(md, opts = {}) {
  const format = opts.format || 'proposal';
  const iconNames = opts.iconNames ? new Set(opts.iconNames) : null;
  const errors = [];
  const warnings = [];
  const lines = String(md).split('\n');
  const stack = [];        // { name, line } for open paired markers
  let headerCount = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineNo = li + 1;

    // Closing markers
    CLOSE_RE.lastIndex = 0;
    let m;
    while ((m = CLOSE_RE.exec(line)) !== null) {
      const name = m[1];
      if (!MARKER_SPEC[name]) {
        errors.push({ line: lineNo, severity: 'error', code: 'unknown-marker', marker: '/' + name, message: `Unknown closing marker "/@${name}"` });
        continue;
      }
      if (stack.length && stack[stack.length - 1].name === name) stack.pop();
      else errors.push({ line: lineNo, severity: 'error', code: 'unclosed-block', marker: '/' + name, message: `Closing "/@${name}" with no matching open` });
    }

    // Opening / self-closing markers
    OPEN_RE.lastIndex = 0;
    while ((m = OPEN_RE.exec(line)) !== null) {
      const name = m[1];
      const attrStr = m[2] || '';
      const spec = MARKER_SPEC[name];
      if (!spec) {
        errors.push({ line: lineNo, severity: 'error', code: 'unknown-marker', marker: name, message: `Unknown marker "@${name}"` });
        continue;
      }
      if (name === 'header') headerCount++;

      const inScope = format === 'proposal' || HEADER_SCOPE.has(name);
      if (inScope) {
        const attrs = parseAttrs(attrStr);
        for (const req of spec.required) {
          if (attrs[req] == null) {
            errors.push({ line: lineNo, severity: 'error', code: 'missing-attr', marker: name, message: `@${name} is missing required attribute "${req}"` });
          }
        }
        for (const [ak, allowed] of Object.entries(spec.enums)) {
          if (attrs[ak] != null && !allowed.includes(attrs[ak])) {
            errors.push({ line: lineNo, severity: 'error', code: 'bad-enum', marker: name, message: `@${name} ${ak}="${attrs[ak]}" is not one of: ${allowed.join(', ')}` });
          }
        }
        if ((name === 'card' || name === 'workitem') && iconNames && attrs.icon != null && !iconNames.has(attrs.icon)) {
          warnings.push({ line: lineNo, severity: 'warning', code: 'unknown-icon', marker: name, message: `@${name} icon="${attrs.icon}" is not a known icon (falls back to the placeholder glyph)` });
        }
      }

      if (spec.paired) stack.push({ name, line: lineNo });
    }
  }

  // Any still-open paired markers are unclosed.
  for (const open of stack) {
    errors.push({ line: open.line, severity: 'error', code: 'unclosed-block', marker: open.name, message: `@${open.name} opened but never closed` });
  }

  if (headerCount > 1) {
    warnings.push({ line: 0, severity: 'warning', code: 'duplicate-header', message: `Found ${headerCount} @header blocks; only the first is used` });
  }

  return { errors, warnings };
}

/** Extract the top-level keys of the `export const Icons = { … }` object. */
function extractIconNames(designTokensSrc) {
  const start = designTokensSrc.indexOf('export const Icons = {');
  if (start === -1) return [];
  const rest = designTokensSrc.slice(start);
  const end = rest.indexOf('\n};');
  const block = end === -1 ? rest : rest.slice(0, end);
  const names = [];
  const re = /^\s{2}([a-zA-Z]\w*):\s*\(/gm; // 2-space-indented `name: (color) =>` entries
  let m;
  while ((m = re.exec(block)) !== null) names.push(m[1]);
  return names;
}

module.exports = { MARKER_SPEC, lintMarkdown, extractIconNames };

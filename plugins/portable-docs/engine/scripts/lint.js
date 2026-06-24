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
  chart:        { paired: true,  required: ['type'],                        optional: ['title', 'subtitle', 'src', 'xlabel', 'ylabel'], enums: { type: ['growth', 'bar', 'hierarchy', 'range', 'pie', 'donut', 'grouped-bar', 'stacked-bar', 'area', 'line', 'scatter'] } },
  flow:         { paired: true,  required: [],                              optional: ['title', 'src'],                                  enums: {} },
  quadrant:     { paired: true,  required: [],                              optional: ['title', 'subtitle', 'src'],                      enums: {} },
  mermaid:      { paired: true,  required: [],                              optional: ['title', 'src'],                                  enums: {} },
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
  const type = opts.type || null; // Phase 5a: document-type-aware rules gate on this; null = inert
  const iconNames = opts.iconNames ? new Set(opts.iconNames) : null;
  const errors = [];
  const warnings = [];
  const lines = String(md).split('\n');
  const stack = [];        // { name, line } for open paired markers
  let headerCount = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineNo = li + 1;

    // Collect open + close markers with their character offsets, then process
    // them in SOURCE ORDER. The parser is line-agnostic, so an inline
    // `<!-- @x -->...<!-- /@x -->` on a single line is valid; processing in
    // offset order makes the open push before the close pops (no false errors).
    const events = [];
    OPEN_RE.lastIndex = 0;
    let m;
    while ((m = OPEN_RE.exec(line)) !== null) {
      events.push({ kind: 'open', index: m.index, name: m[1], attrStr: m[2] || '' });
    }
    CLOSE_RE.lastIndex = 0;
    while ((m = CLOSE_RE.exec(line)) !== null) {
      events.push({ kind: 'close', index: m.index, name: m[1] });
    }
    events.sort((a, b) => a.index - b.index);

    for (const ev of events) {
      if (ev.kind === 'close') {
        const name = ev.name;
        if (!MARKER_SPEC[name]) {
          errors.push({ line: lineNo, severity: 'error', code: 'unknown-marker', marker: '/' + name, message: `Unknown closing marker "/@${name}"` });
          continue;
        }
        if (stack.length && stack[stack.length - 1].name === name) stack.pop();
        else errors.push({ line: lineNo, severity: 'error', code: 'unclosed-block', marker: '/' + name, message: `Closing "/@${name}" with no matching open` });
      } else {
        const name = ev.name;
        const attrStr = ev.attrStr;
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
  }

  // Any still-open paired markers are unclosed.
  for (const open of stack) {
    errors.push({ line: open.line, severity: 'error', code: 'unclosed-block', marker: open.name, message: `@${open.name} opened but never closed` });
  }

  if (headerCount > 1) {
    warnings.push({ line: 0, severity: 'warning', code: 'duplicate-header', message: `Found ${headerCount} @header blocks; only the first is used` });
  }

  if (format === 'proposal') {
    for (let li = 0; li < lines.length; li++) {
      const h2 = lines[li].match(/^##\s+(.+?)\s*$/);
      if (!h2) continue;
      const title = h2[1].trim();
      if (title === 'Citations') continue;
      if (!/^\d+\.\s/.test(title)) {
        warnings.push({ line: li + 1, severity: 'warning', code: 'unnumbered-section', message: `Section "## ${title}" lacks an "N." number prefix; the proposal parser will not render it as a section` });
      }
    }
  }

  // New-type charts must carry data: a `src=` attribute or an inline fenced block.
  const NEW_TYPES = new Set(['pie', 'donut', 'grouped-bar', 'stacked-bar', 'area', 'line', 'scatter']);
  const chartBlockRe = /<!--\s*@chart\b([^>]*)-->([\s\S]*?)<!--\s*\/@chart\s*-->/g;
  let cm;
  while ((cm = chartBlockRe.exec(String(md))) !== null) {
    const attrs = parseAttrs(cm[1]);
    if (!NEW_TYPES.has(attrs.type)) continue;
    const hasSrc = !!attrs.src;
    const hasFence = /```/.test(cm[2]);
    if (!hasSrc && !hasFence) {
      const lineNo = String(md).slice(0, cm.index).split('\n').length;
      errors.push({ line: lineNo, severity: 'error', code: 'chart-no-data', marker: 'chart',
        message: `@chart type="${attrs.type}" has no data — add src="…" or an inline \`\`\`csv\`\`\` / \`\`\`json\`\`\` block` });
    }
  }

  // @flow and @quadrant must carry data: a `src=` attribute or an inline fenced block.
  const diagramBlockRe = /<!--\s*@(flow|quadrant)\b([^>]*)-->([\s\S]*?)<!--\s*\/@\1\s*-->/g;
  let dm;
  while ((dm = diagramBlockRe.exec(String(md))) !== null) {
    const name   = dm[1];
    const attrs  = parseAttrs(dm[2]);
    const hasSrc  = !!attrs.src;
    const hasFence = /```/.test(dm[3]);
    if (!hasSrc && !hasFence) {
      const lineNo = String(md).slice(0, dm.index).split('\n').length;
      errors.push({ line: lineNo, severity: 'error', code: 'diagram-no-data', marker: name,
        message: `@${name} has no data — add src="…" or an inline fenced block` });
    }
  }

  // @mermaid must have a non-empty body or a `src=` attribute.
  const mermaidBlockRe = /<!--\s*@mermaid\b([^>]*)-->([\s\S]*?)<!--\s*\/@mermaid\s*-->/g;
  let mm;
  while ((mm = mermaidBlockRe.exec(String(md))) !== null) {
    const attrs  = parseAttrs(mm[1]);
    const hasSrc  = !!attrs.src;
    const hasBody = mm[2].trim().length > 0;
    if (!hasSrc && !hasBody) {
      const lineNo = String(md).slice(0, mm.index).split('\n').length;
      errors.push({ line: lineNo, severity: 'error', code: 'mermaid-no-source', marker: 'mermaid',
        message: `@mermaid has no source — add a Mermaid diagram body or src="…"` });
    }
  }

  // ── Type-aware rules (Phase 5a) — gated on opts.type; inert when type is null ──
  if (type === 'changelog') {
    const VERSION_RE = /^v?\d+[.\d]*\b/;
    const ALLOW = new Set(['unreleased', 'about']);
    const GROUPS = new Set(['added', 'changed', 'deprecated', 'removed', 'fixed', 'security']);
    let releaseCount = 0;
    let pendingReleaseLine = 0;   // line of a versioned release whose content we are still scanning
    let releaseHadContent = false;
    let inRelease = false;        // true only inside a versioned release or the Unreleased section
    const flushEmpty = () => {
      if (pendingReleaseLine && !releaseHadContent) {
        warnings.push({ line: pendingReleaseLine, severity: 'warning', code: 'changelog-empty-release',
          message: `Release section has no recorded changes — add a "### Added/Changed/Fixed" group or a bullet` });
      }
    };
    for (let li = 0; li < lines.length; li++) {
      const h2 = lines[li].match(/^##\s+(.+?)\s*$/);
      if (h2) {
        flushEmpty();
        const title = h2[1].trim();
        const lower = title.toLowerCase();
        pendingReleaseLine = 0; releaseHadContent = false;
        if (ALLOW.has(lower)) { inRelease = (lower === 'unreleased'); continue; }
        if (VERSION_RE.test(title)) { releaseCount++; pendingReleaseLine = li + 1; inRelease = true; }
        else {
          inRelease = false;
          warnings.push({ line: li + 1, severity: 'warning', code: 'changelog-section-not-versioned',
            message: `Changelog section "## ${title}" has no version number (expected e.g. "## 1.2.0 — 2026-06-20")` });
        }
        continue;
      }
      const h3 = lines[li].match(/^###\s+(.+?)\s*$/);
      if (h3) {
        if (inRelease) {
          releaseHadContent = true;
          const g = h3[1].trim().toLowerCase();
          if (!GROUPS.has(g)) {
            warnings.push({ line: li + 1, severity: 'warning', code: 'changelog-unknown-group',
              message: `Changelog group "### ${h3[1].trim()}" is not a Keep-a-Changelog group (Added, Changed, Deprecated, Removed, Fixed, Security)` });
          }
        }
        continue;
      }
      if (inRelease && /^\s*[-*]\s+/.test(lines[li])) releaseHadContent = true;
    }
    flushEmpty();
    if (releaseCount === 0) {
      errors.push({ line: 0, severity: 'error', code: 'changelog-no-releases',
        message: `Changelog has no versioned release sections (expected at least one "## <version>" heading)` });
    }
  }

  if (type === 'newsletter') {
    const src = String(md);
    const hasHeader = /<!--\s*@header\s*-->/.test(src);
    const hasIssue = /<!--\s*@brandsub\b/.test(src) || /<!--\s*@eyebrow\b/.test(src);
    const hasDate = /<!--\s*@date\b/.test(src);
    if (hasHeader && !hasIssue) {
      warnings.push({ line: 0, severity: 'warning', code: 'newsletter-no-issue',
        message: `Newsletter @header has no issue label — add @brandsub value="Issue N" or @eyebrow value="…"` });
    }
    if (hasHeader && !hasDate) {
      warnings.push({ line: 0, severity: 'warning', code: 'newsletter-no-date',
        message: `Newsletter has no @date — add <!-- @date value="Month YYYY" --> to the masthead` });
    }
    const sectionCount = lines.filter((l) => /^##\s+/.test(l)).length;
    if (sectionCount < 2) {
      warnings.push({ line: 0, severity: 'warning', code: 'newsletter-thin',
        message: `Newsletter has ${sectionCount} section(s); a typical issue has an "In This Issue" intro plus 2+ short sections` });
    }
  }

  if (type === 'rfp') {
    const BACKBONE = /scope|requirement|timeline|pricing|cost|terms/i;
    const titles = lines.filter((l) => /^##\s+/.test(l)).map((l) => l.replace(/^##\s+/, '').trim());
    if (!titles.some((t) => BACKBONE.test(t))) {
      warnings.push({ line: 0, severity: 'warning', code: 'rfp-missing-section',
        message: `RFP has no scope/requirements/timeline/pricing/terms section — RFP readers expect that backbone` });
    }
    // Compliance-matrix cells must use a recognized badge token (Table.jsx only badges ✓ ✔ yes ✗ ✘ no).
    const OK = new Set(['✓', '✔', 'yes', '✗', '✘', 'no']);
    const STATUS_COL = /compl|status|meets|support/i;
    const isRow = (s) => /^\s*\|.*\|\s*$/.test(s);
    const isSep = (s) => /^\s*\|[\s:|-]+\|\s*$/.test(s);
    const cellsOf = (s) => s.split('|').slice(1, -1).map((c) => c.trim());
    for (let li = 0; li < lines.length; li++) {
      if (!isRow(lines[li]) || !isSep(lines[li + 1] || '')) continue; // a header row
      const colIdx = cellsOf(lines[li]).findIndex((c) => STATUS_COL.test(c));
      if (colIdx === -1) continue;
      for (let bj = li + 2; bj < lines.length && isRow(lines[bj]); bj++) {
        const raw = (cellsOf(lines[bj])[colIdx] || '').trim();
        if (raw && !OK.has(raw) && !OK.has(raw.toLowerCase())) {
          warnings.push({ line: bj + 1, severity: 'warning', code: 'rfp-matrix-checkmark',
            message: `Compliance cell "${raw}" is not a recognized badge token (✓ / ✔ / yes / ✗ / ✘ / no) — it renders as plain text` });
        }
      }
    }
    // A pricing section should carry a table or @stats.
    const PRICING = /pricing|cost|fees/i;
    for (let li = 0; li < lines.length; li++) {
      const h2 = lines[li].match(/^##\s+(.+?)\s*$/);
      if (!h2 || !PRICING.test(h2[1])) continue;
      let ok = false;
      for (let bj = li + 1; bj < lines.length && !/^##\s+/.test(lines[bj]); bj++) {
        if (isRow(lines[bj]) || /<!--\s*@stats\b/.test(lines[bj])) { ok = true; break; }
      }
      if (!ok) {
        warnings.push({ line: li + 1, severity: 'warning', code: 'rfp-pricing-no-table',
          message: `Pricing section "## ${h2[1].trim()}" has no table or @stats — pricing reads best as a table or stat row` });
      }
    }
  }

  if (type === 'resume') {
    const src = String(md);
    const hasHeader = /<!--\s*@header\s*-->/.test(src);
    const fromM = src.match(/<!--\s*@from\b([^>]*)-->/);
    const fromAttrs = fromM ? parseAttrs(fromM[1]) : {};
    if (!hasHeader || !fromAttrs.name || !fromAttrs.email) {
      warnings.push({ line: 0, severity: 'warning', code: 'resume-no-header',
        message: `Résumé has no @header with @from name/email — add the candidate's identity to the header` });
    }
    if (!/<!--\s*@timeline\s*-->/.test(src)) {
      errors.push({ line: 0, severity: 'error', code: 'resume-no-experience',
        message: `Résumé has no @timeline (Experience) block — experience is the load-bearing résumé section` });
    }
    const entryRe = /<!--\s*@entry\b([^>]*)-->/g;
    let em;
    while ((em = entryRe.exec(src)) !== null) {
      const attrs = parseAttrs(em[1]);
      if (attrs.year != null && !/\d/.test(attrs.year)) {
        const lineNo = src.slice(0, em.index).split('\n').length;
        warnings.push({ line: lineNo, severity: 'warning', code: 'resume-entry-missing-dates',
          message: `@entry year="${attrs.year}" has no date — résumé entries should carry a real year or range` });
      }
    }
    const cardBlocks = (src.match(/<!--\s*@cards\b/g) || []).length + (src.match(/<!--\s*@worklist\b/g) || []).length;
    const entryCount = (src.match(/<!--\s*@entry\b/g) || []).length;
    if (cardBlocks > 2 || entryCount > 6) {
      warnings.push({ line: 0, severity: 'warning', code: 'resume-density-warning',
        message: `Résumé is dense (${entryCount} entries, ${cardBlocks} card/worklist blocks) — keep it scannable: cap entries and prefer concise bullets` });
    }
  }

  if (type === 'case-study') {
    const src = String(md);
    const hasStats = /<!--\s*@stats\b/.test(src);
    const hasPull = /<!--\s*@pullquote\b/.test(src);
    const hasQuotes = /<!--\s*@quotes\b/.test(src);
    if (!hasStats) {
      warnings.push({ line: 0, severity: 'warning', code: 'case-study-missing-metrics',
        message: `Case study has no @stats block — lead the Results with 3–4 hard metrics` });
    }
    if (!hasPull && !hasQuotes) {
      warnings.push({ line: 0, severity: 'warning', code: 'case-study-missing-quote',
        message: `Case study has no customer quote — add a @pullquote or @quotes block` });
    }
    const statsBlockRe = /<!--\s*@stats\b[^>]*-->([\s\S]*?)<!--\s*\/@stats\s*-->/g;
    let sm;
    while ((sm = statsBlockRe.exec(src)) !== null) {
      const n = (sm[1].match(/<!--\s*@stat\b/g) || []).length;
      if (n < 3 || n > 4) {
        const lineNo = src.slice(0, sm.index).split('\n').length;
        warnings.push({ line: lineNo, severity: 'warning', code: 'case-study-stats-count',
          message: `@stats has ${n} @stat(s); 3–4 reads best (StatsGrid uses a hero layout at exactly 4)` });
      }
    }
    const pqRe = /<!--\s*@pullquote\b([^>]*)-->/g;
    let pm;
    while ((pm = pqRe.exec(src)) !== null) {
      const attrs = parseAttrs(pm[1]);
      if (!attrs.author) {
        const lineNo = src.slice(0, pm.index).split('\n').length;
        warnings.push({ line: lineNo, severity: 'warning', code: 'case-study-quote-attribution',
          message: `@pullquote in a case study has no author — an unattributed customer quote undercuts the type` });
      }
    }
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

/** Read valid icon names from the engine's design tokens (I/O; safe on failure). */
function loadIconNames() {
  try {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'design-tokens.js'), 'utf-8');
    return extractIconNames(src);
  } catch (_) { return []; }
}

/** Render diagnostics as human-readable lines, sorted by line number. */
function formatDiagnostics({ errors = [], warnings = [] }, filename) {
  const all = [...errors, ...warnings].sort((a, b) => (a.line || 0) - (b.line || 0));
  return all.map((d) => {
    const loc = d.line ? `${filename}:${d.line}` : filename;
    const tag = d.severity === 'error' ? 'ERROR' : 'warn ';
    return `  ${tag} ${loc}  [${d.code}] ${d.message}`;
  }).join('\n');
}

module.exports = { MARKER_SPEC, lintMarkdown, extractIconNames, loadIconNames, formatDiagnostics };

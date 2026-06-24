'use strict';
/**
 * parse-slides.js — SLIDE DECK parser.
 *
 * Converts plain markdown into a structured CONTENT object for SlideDeck:
 *   { header, slides: [{ title, blocks }] }
 *
 * Reuses:
 *   - extractHeader() from parser.js (same @header block schema as article/proposal)
 *   - parseBlocks() from parse-article.js (same block parser: bullets, tables,
 *     blockquotes, images, paragraphs)
 *
 * Slide splitting:
 *   - Markdown is split on `---` horizontal-rule delimiters (standard deck convention).
 *   - An optional `@header` block (before the first `---`) generates a TITLE slide
 *     as slide 0 (title/subtitle/brand), driven entirely by CONTENT.header data.
 *   - Each body slide → { title, blocks } where title is the slide's leading
 *     `#`/`##` heading (if any) and blocks come from the shared block parser.
 *
 * Env/temp-dir driven (no hardcoded configs):
 *   PD_INPUT               → input markdown path (CLI mode)
 *   PD_SLIDES_CONTENT_OUT  → output content.js path (CLI mode)
 *
 * API:
 *   parseSlides(markdown)           → content object (no I/O)
 *   generateSlidesOutput(content)   → ESM module text exporting CONTENT
 * CLI:
 *   PD_INPUT=<md> PD_SLIDES_CONTENT_OUT=<js> node scripts/parse-slides.js
 */

const fs   = require('fs');
const path = require('path');

const { extractHeader } = require('../src/utils/parser.js');
const { parseBlocks, groupSubsections } = require('./parse-article.js');
const { extractChartPlaceholders } = require('../src/utils/charts.js');

// ── Slide-level header extraction ────────────────────────────────────────────

// Extract the leading #/## heading from a slide body; return { title, body }.
// Any line that starts with `#` or `##` and is the first non-blank line is the
// slide title. Strip it from the body that gets block-parsed.
function extractSlideTitle(text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    if (h1 || h2) {
      const title = (h1 || h2)[1].trim();
      const body = lines.slice(i + 1).join('\n');
      return { title, body };
    }
    // First non-blank, non-heading line → no title
    return { title: '', body: text };
  }
  return { title: '', body: text };
}

// ── Main parse ────────────────────────────────────────────────────────────────

function parseSlides(markdown, baseDir) {
  // 1. Extract @header (shared schema: title/subtitle/brand/brandSub/logo/footer …)
  const header = extractHeader(markdown) || {
    from: '', fromEmail: '', linkedin: '', github: '', headshot: '',
    date: '', title: '', subtitle: '',
    eyebrow: '', brand: '', brandSub: '', logo: '', footer: '',
  };

  // 2. Strip the @header block so its markers never leak into slide bodies.
  let body = markdown.replace(/<!--\s*@header\s*-->[\s\S]*?<!--\s*\/@header\s*-->/, '');

  // 3. Pre-extract @chart blocks BEFORE the `---` split so fenced data can never be
  //    mistaken for a slide delimiter, and so charts render in document order.
  const extracted = extractChartPlaceholders(body, baseDir);
  body = extracted.text;
  const charts = extracted.charts;

  // 4. Split on `---` horizontal-rule delimiters.
  //    We split on lines that are ONLY dashes (at least 3), ignoring surrounding whitespace.
  const rawSlides = body.split(/\n---+\n/);

  // 5. Convert each raw chunk into a { title, blocks } slide.
  const slides = rawSlides
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return null;           // skip empty chunks
      const { title, body: slideBody } = extractSlideTitle(trimmed);
      const blocks = groupSubsections(parseBlocks(slideBody));
      return { title, blocks };
    })
    .filter(Boolean);

  return { header, slides, charts };
}

// Emit the content as an ESM module that the bundler will inline.
function generateSlidesOutput(content) {
  return `// Auto-generated slides content (parse-slides.js)
// Generated: ${new Date().toISOString()}

const CONTENT = ${JSON.stringify(content, null, 2)};

export default CONTENT;
`;
}

module.exports = { parseSlides, generateSlidesOutput };

// ── CLI ───────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const input = process.env.PD_INPUT;
  const out   = process.env.PD_SLIDES_CONTENT_OUT;
  if (!input) { console.error('parse-slides: PD_INPUT env var is required'); process.exit(1); }
  if (!out)   { console.error('parse-slides: PD_SLIDES_CONTENT_OUT env var is required'); process.exit(1); }
  const markdown = fs.readFileSync(path.resolve(input), 'utf-8');
  const content  = parseSlides(markdown);
  fs.writeFileSync(out, generateSlidesOutput(content), 'utf-8');
  console.log(`parse-slides: wrote ${out} (${content.slides.length} slides)`);
}

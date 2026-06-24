'use strict';
/**
 * parse-article.js — Long-form ARTICLE parser.
 *
 * Converts plain markdown into a structured CONTENT object for ArticleApp:
 *   { header: {...}, sections: [{ number, title, short, blocks }] }
 *
 * Vendored and de-branded from northwestern/scripts/parse-article.js. The
 * original carried a per-slug ARTICLE_CONFIGS registry and read SVGs from a
 * per-article diagrams/ directory on disk; both are dropped here so the parser
 * is fully generic and data-driven (no registry, no disk side-channels).
 *
 * Header strategy (Requirement 1):
 *   - If the markdown contains a `<!-- @header -->…<!-- /@header -->` block,
 *     reuse parser.js's extractHeader() so the article shares the proposal's
 *     header schema (title/subtitle/brand/brandSub/eyebrow/logo/footer/from/date).
 *   - Otherwise FALL BACK to `# H1` → title and the first `*italic*` line → subtitle.
 *
 * API:
 *   parseArticle(markdown)            → content object (no I/O)
 *   generateArticleOutput(content)    → ESM module text exporting CONTENT
 * CLI:
 *   PD_INPUT=<md> PD_ARTICLE_CONTENT_OUT=<js> node scripts/parse-article.js
 */

const fs   = require('fs');
const path = require('path');

const { extractHeader } = require('../src/utils/parser.js');
const { extractChartPlaceholders } = require('../src/utils/charts.js');

// ── Block helpers ────────────────────────────────────────────────────────────

// Generate a short nav label from a section title (generic; no per-slug overrides).
// Strips a leading "Part N:" prefix, then takes the first clause / first two words.
function shortLabel(title) {
  const cleaned = title.replace(/^Part\s+\d+:\s*/i, '').trim();
  return cleaned.split(/[,:]/).map(s => s.trim())[0].split(/\s+/).slice(0, 2).join(' ');
}

// Parse a markdown table (header row, separator row, body rows) into a block.
function parseTable(lines) {
  const headers = lines[0].split('|').map(s => s.trim()).filter(Boolean);
  const rows = [];
  for (let i = 2; i < lines.length; i++) {           // skip lines[1] (separator)
    const cells = lines[i].split('|').map(s => s.trim()).filter(Boolean);
    if (cells.length > 0) rows.push(cells);
  }
  return { type: 'table', headers, rows };
}

// Parse a markdown section body into structured blocks.
function parseBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Horizontal rule (intra-section divider) — skip
    if (/^---+\s*$/.test(line.trim())) { i++; continue; }

    // Chart placeholder (charts are pre-extracted before block parsing).
    const chartMatch = line.trim().match(/^\[\[CHART:(\d+)\]\]$/);
    if (chartMatch) {
      blocks.push({ type: 'chart', index: Number(chartMatch[1]) });
      i++;
      continue;
    }

    // H3 subsection marker
    if (line.startsWith('### ')) {
      blocks.push({ type: 'subsectionStart', title: line.slice(4).trim() });
      i++;
      continue;
    }

    // H4 sub-subsection marker (non-grouping heading block)
    if (line.startsWith('#### ')) {
      blocks.push({ type: 'heading', level: 4, text: line.slice(5).trim() });
      i++;
      continue;
    }

    // YouTube embed — ![caption](https://www.youtube.com/watch?v=VIDEO_ID)
    const ytMatch = line.match(/^!\[([^\]]*)\]\(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]+)\)/);
    if (ytMatch) {
      blocks.push({ type: 'youtube', caption: ytMatch[1], videoId: ytMatch[2] });
      i++;
      continue;
    }

    // Image — ![alt](url). Generic: any image URL becomes a figure block.
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      blocks.push({ type: 'image', src: imgMatch[2].trim(), caption: imgMatch[1] });
      i++;
      continue;
    }

    // Table (consecutive lines starting with |)
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 3) blocks.push(parseTable(tableLines));
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    // Bullet list
    if (/^[-*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'bulletList', items });
      continue;
    }

    // Numbered list (tolerate blank lines between items)
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length) {
        if (/^\d+\.\s/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
          continue;
        }
        if (lines[i].trim() === '') {
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === '') j++;
          if (j < lines.length && /^\d+\.\s/.test(lines[j].trim())) { i = j; continue; }
        }
        break;
      }
      blocks.push({ type: 'numberedList', items });
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('### ') &&
      !lines[i].startsWith('#### ') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !/^---+\s*$/.test(lines[i].trim()) &&
      !/^!\[/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      const text = paraLines.join(' ').trim();
      if (text) blocks.push({ type: 'paragraph', text });
    }
  }

  return blocks;
}

// Fold subsectionStart markers + their following blocks into subsection groups.
function groupSubsections(blocks) {
  const result = [];
  let currentSub = null;
  for (const block of blocks) {
    if (block.type === 'subsectionStart') {
      if (currentSub) result.push(currentSub);
      currentSub = { type: 'subsection', title: block.title, blocks: [] };
    } else if (currentSub) {
      currentSub.blocks.push(block);
    } else {
      result.push(block);
    }
  }
  if (currentSub) result.push(currentSub);
  return result;
}

// ── Header ───────────────────────────────────────────────────────────────────

// Build the article header. Prefer the @header block (reused extractHeader);
// fall back to `# H1` (title) and the first `*italic*` line (subtitle).
function buildHeader(markdown) {
  const fromBlock = extractHeader(markdown);

  // H1 / first-italic fallbacks
  const titleMatch    = markdown.match(/^#\s+(.+)$/m);
  const fallbackTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
  const subtitleMatch = markdown.match(/^\*([^*]+)\*\s*$/m);
  const fallbackSub   = subtitleMatch ? subtitleMatch[1].trim() : '';

  if (fromBlock) {
    return {
      ...fromBlock,
      title:    fromBlock.title    || fallbackTitle,
      subtitle: fromBlock.subtitle || fallbackSub,
    };
  }

  // No @header block — synthesize a minimal header from H1/italic only.
  return {
    from: '', fromEmail: '', linkedin: '', github: '', headshot: '',
    date: '', title: fallbackTitle, subtitle: fallbackSub,
    eyebrow: '', brand: '', brandSub: '', logo: '', footer: '',
  };
}

// ── Main parse ────────────────────────────────────────────────────────────────

function parseArticle(markdown, baseDir) {
  const header = buildHeader(markdown);

  // Strip the @header block so its inner markers never get parsed as body.
  let body = markdown.replace(/<!--\s*@header\s*-->[\s\S]*?<!--\s*\/@header\s*-->/, '');

  // Pre-extract @chart blocks → [[CHART:N]] sentinels + resolved chart objects.
  const extracted = extractChartPlaceholders(body, baseDir || process.cwd());
  body = extracted.text;
  const charts = extracted.charts;

  // Split on `## ` headings → sections.
  const sectionSplits = body.split(/^##\s+/m);
  const sections = [];
  for (let idx = 1; idx < sectionSplits.length; idx++) {
    const sectionRaw   = sectionSplits[idx];
    const firstNewline = sectionRaw.indexOf('\n');
    const sectionTitle = (firstNewline === -1 ? sectionRaw : sectionRaw.slice(0, firstNewline)).trim();
    const sectionBody  = firstNewline === -1 ? '' : sectionRaw.slice(firstNewline + 1);

    const blocks = groupSubsections(parseBlocks(sectionBody));
    sections.push({ number: idx, title: sectionTitle, short: shortLabel(sectionTitle), blocks });
  }

  return { header, sections, charts };
}

// Emit the content as an ESM module that default-exports CONTENT (the bundler
// strips the export when inlining).
function generateArticleOutput(content) {
  return `// Auto-generated article content (parse-article.js)
// Generated: ${new Date().toISOString()}

const CONTENT = ${JSON.stringify(content, null, 2)};

export default CONTENT;
`;
}

module.exports = { parseArticle, generateArticleOutput, buildHeader, parseBlocks, groupSubsections };

// ── CLI ───────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const input = process.env.PD_INPUT;
  const out   = process.env.PD_ARTICLE_CONTENT_OUT;
  if (!input) { console.error('parse-article: PD_INPUT env var is required'); process.exit(1); }
  if (!out)   { console.error('parse-article: PD_ARTICLE_CONTENT_OUT env var is required'); process.exit(1); }
  const markdown = fs.readFileSync(path.resolve(input), 'utf-8');
  const content  = parseArticle(markdown);
  fs.writeFileSync(out, generateArticleOutput(content), 'utf-8');
  console.log(`parse-article: wrote ${out} (${content.sections.length} sections)`);
}

'use strict';
/**
 * build-doc.js — End-to-end orchestrator.
 *
 * Reads an input .md → parse → bundle JSX → wrap to HTML → validate → open.
 *
 * CLI:
 *   node scripts/build-doc.js --input <md> [--out <html>] [--title <t>]
 *                              [--theme <name>] [--style proposal|article]
 *                              [--slides] [--jsx] [--no-open]
 *
 * API:
 *   const { parseArgs, resolveOutPath, main } = require('./build-doc.js');
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { inlineLocalImages } = require('./inline-assets.js');
const { exportFile } = require('./export.js');
const { loadConfig, selectBrand, pick, applyIdentity } = require('./config.js');

/**
 * Load + resolve config; mutate args with effective theme/style/out/identity.
 * Precedence per setting: CLI flag > env (PD_*) > config > built-in default.
 */
function loadAndResolveConfig(args, mdPath) {
  const startDir = mdPath ? path.dirname(path.resolve(mdPath)) : process.cwd();
  const { config, path: cfgPath } = loadConfig({
    startDir, explicitPath: args.config, noConfig: args.noConfig,
  });
  const eff = selectBrand(config, args.brand); // null when no config
  if (!eff) return;

  // theme: flag > env > config (build pipelines fall back to 'editorial')
  if (!args.theme) {
    const t = pick(null, process.env.PD_THEME, eff.theme, null);
    if (t) args.theme = t;
  }
  // accent: flag(none) > env PD_ACCENT > config.accent
  if ((process.env.PD_ACCENT == null || process.env.PD_ACCENT === '') && eff.accent) {
    process.env.PD_ACCENT = eff.accent;
  }
  // style: only when the user did not pass an explicit non-default --style or --slides
  if (!args.slides && args.style === 'proposal' && eff.style) {
    args.style = eff.style;
  }
  // output directory default (used by resolveOutPath when --out / PORTABLE_DOCS_OUT unset)
  args._outDir = eff.outDir || null;
  // identity defaults for @header
  args._identity = eff.identity || null;
  args._assetBaseDir = cfgPath ? path.dirname(cfgPath) : null;
}

/** Apply config identity to parsed content (header wins per-field; synthesize if absent). */
function applyConfigToContent(args, content) {
  if (!args._identity) return;
  const fallbackTitle = args.title ||
    (content.header && content.header.title) ||
    path.basename(args.input || 'document').replace(/\.md$/i, '');
  content.header = applyIdentity(content.header, args._identity, {
    fallbackTitle, assetBaseDir: args._assetBaseDir,
  });
}

/** Build-time export hook: PDF/PNG via system browser when --pdf/--png set.
 *  exportFile is async (full-page PNG uses CDP), so this is awaited below. */
async function maybeExport(args, outPath) {
  if (!args.pdf && !args.png) return;
  const r = await exportFile(outPath, { pdf: args.pdf, png: args.png });
  if (r.pdf) console.log(`build-doc: PDF → ${r.pdf}`);
  if (r.png) console.log(`build-doc: PNG → ${r.png}`);
}

// ── Pure helpers (no I/O — unit-testable) ───────────────────────────────────

/**
 * Parse a flat argv array into a structured options object.
 * Flags: --input --out --title --theme --style --slides --jsx --no-open
 *
 * --style selects the document FORMAT:
 *   'proposal' (default, or unset) → the original proposal pipeline (unchanged)
 *   'article'                      → the long-form article pipeline (Task 2.4a)
 *
 * @param {string[]} argv
 * @returns {{ input:string|null, out:string|null, title:string|null,
 *             theme:string|null, style:string, slides:boolean, jsx:boolean,
 *             open:boolean }}
 */
function parseArgs(argv) {
  const opts = {
    input:  null,
    out:    null,
    title:  null,
    theme:  null,
    style:  'proposal',  // default format; --style article switches pipelines
    slides: false,
    jsx:    false,
    pdf:    false,
    png:    false,
    brand:    null,
    config:   null,
    noConfig: false,
    open:   true,        // default open=true; --no-open sets false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--input':  opts.input  = argv[++i]; break;
      case '--out':    opts.out    = argv[++i]; break;
      case '--title':  opts.title  = argv[++i]; break;
      case '--theme':  opts.theme  = argv[++i]; break;
      case '--style':  opts.style  = argv[++i] || 'proposal'; break;
      case '--slides': opts.slides = true;       break;
      case '--jsx':    opts.jsx    = true;       break;
      case '--pdf':    opts.pdf    = true;       break;
      case '--png':    opts.png    = true;       break;
      case '--brand':     opts.brand    = argv[++i]; break;
      case '--config':    opts.config   = argv[++i]; break;
      case '--no-config': opts.noConfig = true;      break;
      case '--no-open':opts.open   = false;      break;
    }
  }
  return opts;
}

/**
 * Resolve the output HTML path.
 * Priority: explicit `out` → env PORTABLE_DOCS_OUT → default slug path.
 * @param {{ out?:string, title?:string, input:string }} opts
 * @returns {string}
 */
function resolveOutPath({ out, title, input, outDir }) {
  if (out) return out;
  const { slugify } = require('./slug.js');
  const { expandHome } = require('./config.js');
  const base = title || path.basename(input || 'document').replace(/\.md$/i, '');
  const slug = slugify(base);
  const dir = outDir ? expandHome(outDir) : path.join(os.homedir(), 'Documents', 'portable-docs');
  return path.join(dir, slug + '.html');
}

// ── Slides pipeline (Task 2.4b) ──────────────────────────────────────────────

/**
 * runSlides — the SLIDE DECK orchestration.
 *
 * Mirrors runArticle()'s structure exactly (per-invocation temp dir, PD_*
 * env with restore-in-finally, build-time theme injection, validator, open)
 * but routes input → slide parser → slide bundler → slide wrapper.
 * REUSES: validate.js, slug.js, open.js, and the shared theme-injection /
 * ESM-strip / body-bg helpers (via build-slides.js and wrap-slides-html.js).
 *
 * Precedence: --slides wins over --style article if both are passed.
 *
 * @param {object} args - parsed CLI options (slides === true).
 * @param {string} md   - the input markdown text (already read by main()).
 */
async function runSlides(args, md) {
  // 1. Parse the slides into a content object.
  const { parseSlides, generateSlidesOutput } = require('./parse-slides.js');
  const content = parseSlides(md);
  applyConfigToContent(args, content);
  inlineLocalImages(content, path.dirname(path.resolve(args.input)));

  // 2. Per-invocation temp dir so parallel builds never clobber each other.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-slides-'));

  // Save previous env so repeated calls in tests don't bleed state.
  const prevSlidesOut = process.env.PD_SLIDES_CONTENT_OUT;
  const prevJsxOut    = process.env.PD_JSX_OUT;
  const prevTheme     = process.env.PD_THEME;
  const prevAccent    = process.env.PD_ACCENT;

  try {
    // 3. Write slide content snapshot into the temp dir.
    const contentJsPath = path.join(tmpDir, 'slides-content.js');
    fs.writeFileSync(contentJsPath, generateSlidesOutput(content), 'utf-8');
    process.env.PD_SLIDES_CONTENT_OUT = contentJsPath;

    // 4. JSX bundle path inside the same temp dir.
    const slug = require('./slug.js').slugify(
      args.title || content.header?.title || path.basename(args.input).replace(/\.md$/i, '')
    );
    const jsxTmpPath = path.join(tmpDir, 'bundle.jsx');
    process.env.PD_JSX_OUT = jsxTmpPath;

    // Forward --theme so the bundler injects the right ACTIVE_THEME literal.
    if (args.theme) {
      process.env.PD_THEME = args.theme;
    } else if (!process.env.PD_THEME) {
      process.env.PD_THEME = 'editorial';
    }

    // 5. Bundle (reads PD_SLIDES_CONTENT_OUT, writes PD_JSX_OUT).
    const { buildSlides } = require('./build-slides.js');
    buildSlides();

    // 6. Resolve output HTML path.
    const outPath = resolveOutPath({
      out:    args.out || process.env.PORTABLE_DOCS_OUT,
      title:  args.title || content.header?.title,
      input:  args.input,
      outDir: args._outDir,
    });
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 7. Wrap to HTML (classic runtime + theme body-bg, no page scroll).
    const jsx = fs.readFileSync(jsxTmpPath, 'utf-8');
    const { wrapSlidesHtml } = require('./wrap-slides-html.js');
    wrapSlidesHtml({
      jsx,
      title: args.title || content.header?.title || slug,
      out:   outPath,
      theme: args.theme,
    });

    // 8. Validate (reuse the generic render validator).
    const { validate } = require('./validate.js');
    const result = validate({ htmlPath: outPath });
    if (!result.ok) {
      throw new Error(`build-doc: slide HTML validation failed:\n  ${result.errors.join('\n  ')}`);
    }

    // 9. --jsx: copy the bundle next to the HTML output BEFORE cleanup.
    if (args.jsx) {
      const jsxOut = path.join(outDir, slug + '.jsx');
      fs.copyFileSync(jsxTmpPath, jsxOut);
      console.log(`build-doc: JSX bundle copied to ${jsxOut}`);
    }

    // 10. Optionally export to PDF/PNG.
    await maybeExport(args, outPath);

    // 11. Optionally open.
    if (args.open) {
      const { openFile } = require('./open.js');
      openFile(outPath);
    }

    console.log(path.resolve(outPath));
  } finally {
    // Restore ALL PD_* env vars to pre-call values, even on throw.
    if (prevTheme !== undefined) process.env.PD_THEME = prevTheme;
    else delete process.env.PD_THEME;
    if (prevAccent !== undefined) process.env.PD_ACCENT = prevAccent;
    else delete process.env.PD_ACCENT;
    if (prevSlidesOut !== undefined) process.env.PD_SLIDES_CONTENT_OUT = prevSlidesOut;
    else delete process.env.PD_SLIDES_CONTENT_OUT;
    if (prevJsxOut !== undefined) process.env.PD_JSX_OUT = prevJsxOut;
    else delete process.env.PD_JSX_OUT;

    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── Article pipeline (Task 2.4a) ──────────────────────────────────────────────

/**
 * runArticle — the long-form ARTICLE orchestration.
 *
 * Mirrors main()'s proposal flow exactly (per-invocation temp dir, PD_* env
 * with restore-in-finally, build-time theme injection, validator, --jsx, open)
 * but routes input → article parser → article bundler → article wrapper.
 * It REUSES the same infrastructure: validate.js, slug.js, open.js, and the
 * shared theme-injection / ESM-strip / body-bg helpers (via the article
 * bundler and wrapper).
 *
 * @param {object} args - parsed CLI options (style === 'article').
 * @param {string} md   - the input markdown text (already read by main()).
 */
async function runArticle(args, md) {
  if (args.slides) console.log('build-doc: NOTE --slides is ignored for --style article (slide deck is Task 2.4b)');

  // 1. Parse the article into a content object (no slug registry).
  const { parseArticle, generateArticleOutput } = require('./parse-article.js');
  const content = parseArticle(md);
  applyConfigToContent(args, content);
  inlineLocalImages(content, path.dirname(path.resolve(args.input)));

  // 2. Per-invocation temp dir so parallel builds never clobber each other.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-article-'));

  // Save previous env so repeated calls in tests don't bleed state.
  const prevArticleOut = process.env.PD_ARTICLE_CONTENT_OUT;
  const prevJsxOut      = process.env.PD_JSX_OUT;
  const prevTheme       = process.env.PD_THEME;
  const prevAccent      = process.env.PD_ACCENT;

  try {
    // 3. Write the article content snapshot into the temp dir; point the bundler at it.
    const contentJsPath = path.join(tmpDir, 'article-content.js');
    fs.writeFileSync(contentJsPath, generateArticleOutput(content), 'utf-8');
    process.env.PD_ARTICLE_CONTENT_OUT = contentJsPath;

    // 4. JSX bundle path inside the same temp dir.
    const slug = require('./slug.js').slugify(
      args.title || content.header?.title || path.basename(args.input).replace(/\.md$/i, '')
    );
    const jsxTmpPath = path.join(tmpDir, 'bundle.jsx');
    process.env.PD_JSX_OUT = jsxTmpPath;

    // Forward --theme so the bundler injects the right ACTIVE_THEME literal
    // (shared extractDesignTokensCode helper). PD_ACCENT is read from env.
    if (args.theme) {
      process.env.PD_THEME = args.theme;
    } else if (!process.env.PD_THEME) {
      process.env.PD_THEME = 'editorial';
    }

    // 5. Bundle (reads PD_ARTICLE_CONTENT_OUT, writes PD_JSX_OUT).
    const { buildArticle } = require('./build-article.js');
    buildArticle();

    // 6. Resolve output HTML path (same resolver as the proposal path).
    const outPath = resolveOutPath({
      out:    args.out || process.env.PORTABLE_DOCS_OUT,
      title:  args.title || content.header?.title,
      input:  args.input,
      outDir: args._outDir,
    });
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 7. Wrap to HTML (classic runtime + theme body-bg, via shared wrap-html pieces).
    const jsx = fs.readFileSync(jsxTmpPath, 'utf-8');
    const { wrapArticleHtml } = require('./wrap-article-html.js');
    wrapArticleHtml({
      jsx,
      title: args.title || content.header?.title || slug,
      out:   outPath,
      theme: args.theme,
    });

    // 8. Validate (reuse the generic render validator).
    const { validate } = require('./validate.js');
    const result = validate({ htmlPath: outPath });
    if (!result.ok) {
      throw new Error(`build-doc: article HTML validation failed:\n  ${result.errors.join('\n  ')}`);
    }

    // 9. --jsx: copy the bundle next to the HTML output BEFORE cleanup.
    if (args.jsx) {
      const jsxOut = path.join(outDir, slug + '.jsx');
      fs.copyFileSync(jsxTmpPath, jsxOut);
      console.log(`build-doc: JSX bundle copied to ${jsxOut}`);
    }

    // 10. Optionally export to PDF/PNG.
    await maybeExport(args, outPath);

    // 11. Optionally open.
    if (args.open) {
      const { openFile } = require('./open.js');
      openFile(outPath);
    }

    console.log(path.resolve(outPath));
  } finally {
    // Restore ALL PD_* env vars to pre-call values, even on throw.
    if (prevTheme !== undefined) process.env.PD_THEME = prevTheme;
    else delete process.env.PD_THEME;
    if (prevAccent !== undefined) process.env.PD_ACCENT = prevAccent;
    else delete process.env.PD_ACCENT;
    if (prevArticleOut !== undefined) process.env.PD_ARTICLE_CONTENT_OUT = prevArticleOut;
    else delete process.env.PD_ARTICLE_CONTENT_OUT;
    if (prevJsxOut !== undefined) process.env.PD_JSX_OUT = prevJsxOut;
    else delete process.env.PD_JSX_OUT;

    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── Proposal pipeline (extracted from main; byte-identical behavior) ─────────
async function runProposal(args, md) {
  // 2. Parse content
  const { extractContent, generateOutput } = require('../src/utils/parser.js');
  const content = extractContent(md);
  applyConfigToContent(args, content);
  inlineLocalImages(content, path.dirname(path.resolve(args.input)));

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-build-'));
  const prevContentOut = process.env.PD_CONTENT_OUT;
  const prevJsxOut     = process.env.PD_JSX_OUT;
  const prevTheme      = process.env.PD_THEME;
  const prevAccent     = process.env.PD_ACCENT;

  try {
    const contentJsPath = path.join(tmpDir, 'content.js');
    fs.writeFileSync(contentJsPath, generateOutput(content), 'utf-8');
    process.env.PD_CONTENT_OUT = contentJsPath;

    const slug = require('./slug.js').slugify(
      args.title || content.header?.title || path.basename(args.input).replace(/\.md$/i, '')
    );
    const jsxTmpPath = path.join(tmpDir, 'bundle.jsx');
    process.env.PD_JSX_OUT = jsxTmpPath;

    if (args.theme) process.env.PD_THEME = args.theme;
    else if (!process.env.PD_THEME) process.env.PD_THEME = 'editorial';

    const { build } = require('../src/utils/build.js');
    build();

    const outPath = resolveOutPath({
      out:    args.out || process.env.PORTABLE_DOCS_OUT,
      title:  args.title || content.header?.title,
      input:  args.input,
      outDir: args._outDir,
    });
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const jsx = fs.readFileSync(jsxTmpPath, 'utf-8');
    const { wrapHtml } = require('./wrap-html.js');
    wrapHtml({ jsx, title: args.title || content.header?.title || slug, out: outPath, theme: args.theme });

    const { validate } = require('./validate.js');
    const result = validate({ htmlPath: outPath });
    if (!result.ok) throw new Error(`build-doc: HTML validation failed:\n  ${result.errors.join('\n  ')}`);

    if (args.jsx) {
      const jsxOut = path.join(outDir, slug + '.jsx');
      fs.copyFileSync(jsxTmpPath, jsxOut);
      console.log(`build-doc: JSX bundle copied to ${jsxOut}`);
    }

    await maybeExport(args, outPath);

    if (args.open) { const { openFile } = require('./open.js'); openFile(outPath); }

    console.log(path.resolve(outPath));
  } finally {
    if (prevTheme !== undefined) process.env.PD_THEME  = prevTheme; else delete process.env.PD_THEME;
    if (prevAccent !== undefined) process.env.PD_ACCENT = prevAccent; else delete process.env.PD_ACCENT;
    if (prevContentOut !== undefined) process.env.PD_CONTENT_OUT = prevContentOut; else delete process.env.PD_CONTENT_OUT;
    if (prevJsxOut !== undefined) process.env.PD_JSX_OUT = prevJsxOut; else delete process.env.PD_JSX_OUT;
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── Orchestration ────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.input) {
    console.error('build-doc: --input <path.md> is required');
    process.exit(1);
  }

  // 1. Read markdown
  const mdPath = path.resolve(args.input);
  if (!fs.existsSync(mdPath)) {
    console.error(`build-doc: input file not found: ${mdPath}`);
    process.exit(1);
  }
  const md = fs.readFileSync(mdPath, 'utf-8');

  // Resolve brand-kit config (mutates args defaults; no-op without a config file).
  loadAndResolveConfig(args, mdPath);

  // ── Format routing ─────────────────────────────────────────────────────────
  // --slides routes to the slide deck pipeline (Task 2.4b). Precedence: --slides
  // wins over --style article when both are passed simultaneously.
  // --style article diverts to the long-form article pipeline (Task 2.4a).
  // Everything below this branch is the original proposal pipeline, byte-for-byte
  // unchanged for the default (proposal / unset) style.
  if (args.slides) {
    return runSlides(args, md);
  }

  if (args.style === 'article') return runArticle(args, md);
  return runProposal(args, md);
}

module.exports = { parseArgs, resolveOutPath, runProposal, main };
if (require.main === module) main().catch((err) => { console.error(err.message); process.exit(1); });

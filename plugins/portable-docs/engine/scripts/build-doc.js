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
function resolveOutPath({ out, title, input }) {
  if (out) return out;
  const { slugify } = require('./slug.js');
  const base = title || path.basename(input || 'document').replace(/\.md$/i, '');
  const slug = slugify(base);
  return path.join(os.homedir(), 'Documents', 'portable-docs', slug + '.html');
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
      out:   args.out || process.env.PORTABLE_DOCS_OUT,
      title: args.title || content.header?.title,
      input: args.input,
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

    // 10. Optionally open.
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
      out:   args.out || process.env.PORTABLE_DOCS_OUT,
      title: args.title || content.header?.title,
      input: args.input,
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

    // 10. Optionally open.
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

  // ── Format routing ─────────────────────────────────────────────────────────
  // --slides routes to the slide deck pipeline (Task 2.4b). Precedence: --slides
  // wins over --style article when both are passed simultaneously.
  // --style article diverts to the long-form article pipeline (Task 2.4a).
  // Everything below this branch is the original proposal pipeline, byte-for-byte
  // unchanged for the default (proposal / unset) style.
  if (args.slides) {
    return runSlides(args, md);
  }

  if (args.style === 'article') {
    return runArticle(args, md);
  }

  // 2. Parse content
  const { extractContent, generateOutput } = require('../src/utils/parser.js');
  const content = extractContent(md);
  inlineLocalImages(content, path.dirname(mdPath));

  // 3. Create a unique temp directory for this invocation so parallel builds
  //    (e.g. multiple test files running concurrently with `node --test`) never
  //    clobber each other's intermediate files.  Both the content.js snapshot
  //    and the JSX bundle go here.  The directory is removed in the finally
  //    block after all work that needs the files is complete.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-build-'));

  // Save previous env values so repeated main() calls in tests don't bleed state.
  const prevContentOut = process.env.PD_CONTENT_OUT;
  const prevJsxOut     = process.env.PD_JSX_OUT;
  const prevTheme      = process.env.PD_THEME;
  const prevAccent     = process.env.PD_ACCENT;

  try {
    // 4. Write content snapshot into the per-invocation temp dir and point
    //    PD_CONTENT_OUT there so build.js picks it up (not the shared
    //    engine/src/content.js, which caused the cross-process race).
    const contentJsPath = path.join(tmpDir, 'content.js');
    fs.writeFileSync(contentJsPath, generateOutput(content), 'utf-8');
    process.env.PD_CONTENT_OUT = contentJsPath;

    // 5. Prepare the JSX bundle path inside the same temp dir; set PD_JSX_OUT.
    const slug = require('./slug.js').slugify(
      args.title || content.header?.title || path.basename(args.input).replace(/\.md$/i, '')
    );
    const jsxTmpPath = path.join(tmpDir, 'bundle.jsx');
    process.env.PD_JSX_OUT = jsxTmpPath;

    // Forward --theme to PD_THEME so build.js injects the right literal.
    // PD_ACCENT is read directly from env (set by caller or inherited).
    if (args.theme) {
      process.env.PD_THEME = args.theme;
    } else if (!process.env.PD_THEME) {
      // Ensure a default so injection is deterministic
      process.env.PD_THEME = 'editorial';
    }

    // Call build() — it reads PD_CONTENT_OUT and writes PD_JSX_OUT.
    const { build } = require('../src/utils/build.js');
    build();

    // 6. Resolve output HTML path.
    const outPath = resolveOutPath({
      out:   args.out || process.env.PORTABLE_DOCS_OUT,
      title: args.title || content.header?.title,
      input: args.input,
    });

    // Ensure parent directory exists.
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Read the JSX bundle that build() just wrote.
    const jsx = fs.readFileSync(jsxTmpPath, 'utf-8');

    // Wrap to HTML.
    const { wrapHtml } = require('./wrap-html.js');
    wrapHtml({
      jsx,
      title: args.title || content.header?.title || slug,
      out:   outPath,
      theme: args.theme,
    });

    // 7. Validate (reads the final HTML outPath, not a temp file).
    const { validate } = require('./validate.js');
    const result = validate({ htmlPath: outPath });
    if (!result.ok) {
      throw new Error(`build-doc: HTML validation failed:\n  ${result.errors.join('\n  ')}`);
    }

    // 8. --jsx: copy the bundle next to the HTML output BEFORE the temp dir is
    //    removed (copy must precede the finally cleanup below).
    if (args.jsx) {
      const jsxOut = path.join(outDir, slug + '.jsx');
      fs.copyFileSync(jsxTmpPath, jsxOut);
      console.log(`build-doc: JSX bundle copied to ${jsxOut}`);
    }

    // 9. Optionally open.
    if (args.open) {
      const { openFile } = require('./open.js');
      openFile(outPath);
    }

    // 10. Report.
    console.log(path.resolve(outPath));
  } finally {
    // Restore ALL four PD_* env vars to their pre-call values so repeated
    // main() calls in the same process (e.g. the themes test suite) never
    // inherit stale values — even when build() or anything after it throws.
    if (prevTheme !== undefined) process.env.PD_THEME  = prevTheme;
    else delete process.env.PD_THEME;
    if (prevAccent !== undefined) process.env.PD_ACCENT = prevAccent;
    else delete process.env.PD_ACCENT;
    if (prevContentOut !== undefined) process.env.PD_CONTENT_OUT = prevContentOut;
    else delete process.env.PD_CONTENT_OUT;
    if (prevJsxOut !== undefined) process.env.PD_JSX_OUT = prevJsxOut;
    else delete process.env.PD_JSX_OUT;

    // Best-effort cleanup of the per-invocation temp directory.
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = { parseArgs, resolveOutPath, main };
if (require.main === module) main().catch((err) => { console.error(err.message); process.exit(1); });

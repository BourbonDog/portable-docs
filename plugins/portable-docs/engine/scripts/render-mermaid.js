'use strict';
/**
 * render-mermaid.js — build-time @mermaid → inline SVG pre-pass.
 *
 * Extracts every @mermaid block, renders each to SVG via the vendored Mermaid
 * UMD inside the system headless browser (reusing export.js's CDP harness),
 * and rewrites each block to a neutral [[MERMAIDSVG:N]] sentinel. The rendered
 * SVG (or a { source, error } fallback) is returned in `mermaids[N]`, threaded
 * into content.mermaids by build-doc.js. NEVER throws.
 *
 * Theme: maps the doc theme (editorial/dark/brand) + PD_ACCENT → Mermaid
 * themeVariables so diagrams sit cohesively in the doc. Deterministic ids keep
 * output stable build-to-build.
 */
const fs = require('fs');
const path = require('path');
const { detectBrowser, withCdpSession } = require('./export.js');
const { maskFencedMarkers } = require('../src/utils/fences.js');

const MERMAID_BLOCK_RE = /<!--\s*@mermaid\b([^>]*)-->([\s\S]*?)<!--\s*\/@mermaid\s*-->/g;
const MERMAID_LIB = path.join(__dirname, '..', 'vendor', 'mermaid.min.js');

function attr(attrStr, name) {
  const m = String(attrStr).match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : '';
}

/** Extract @mermaid blocks in document order. CRLF-tolerant. */
function extractMermaidBlocks(md) {
  const text = String(md).replace(/\r\n?/g, '\n');
  const blocks = [];
  let m;
  MERMAID_BLOCK_RE.lastIndex = 0;
  while ((m = MERMAID_BLOCK_RE.exec(text)) !== null) {
    blocks.push({
      raw: m[0],
      title: attr(m[1], 'title'),
      src: attr(m[1], 'src'),
      source: m[2].trim(),
      index: blocks.length,
    });
  }
  return blocks;
}

// ── Theme → Mermaid themeVariables ───────────────────────────────────────────
const THEME_BASE = {
  editorial: { base: 'base', bg: '#FAFAFA', ink: '#1A1A2E', line: '#9CA3AF' },
  brand:     { base: 'base', bg: '#FFFFFF', ink: '#111827', line: '#9CA3AF' },
  dark:      { base: 'dark', bg: '#0D1117', ink: '#E6EDF3', line: '#6B7280' },
};

/** Map a doc theme + accent → { base, themeVariables } for mermaid.initialize. */
function themeVariables(theme, accent) {
  const t = THEME_BASE[theme] || THEME_BASE.editorial;
  const primary = accent || (theme === 'dark' ? '#22D3EE' : '#5B21B6');
  return {
    base: t.base,
    themeVariables: {
      background: t.bg,
      primaryColor: primary,
      primaryBorderColor: primary,
      primaryTextColor: t.ink,
      lineColor: t.line,
      secondaryColor: t.bg,
      tertiaryColor: t.bg,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    },
  };
}

/** Resolve a block's source from src= file (relative to baseDir) or its body. */
function resolveSource(block, baseDir) {
  if (block.src) {
    const p = path.isAbsolute(block.src) ? block.src : path.join(baseDir || process.cwd(), block.src);
    if (!fs.existsSync(p)) return { error: `mermaid src not found: ${block.src}` };
    return { source: fs.readFileSync(p, 'utf-8').trim() };
  }
  if (!block.source) return { error: 'empty @mermaid block (no source and no src=)' };
  return { source: block.source };
}

/** Escape JSON for safe embedding inside an HTML <script> (prevents </script> / <!-- breakout). */
function safeJson(v) {
  return JSON.stringify(v).replace(/</g, '\\u003c');
}

/** Build the headless render harness HTML. Pure + testable. `lib` is the vendored mermaid UMD. */
function buildHarness(lib, sources, themeCfg) {
  const safeLib = String(lib).replace(/<\/script>/gi, '<\\/script>');
  return `<!doctype html><html><head><meta charset="utf-8"><script>${safeLib}<\/script></head>
<body><div id="host"></div><script>
  window.__SOURCES__ = ${safeJson(sources)};
  window.__CFG__ = ${safeJson(themeCfg)};
<\/script></body></html>`;
}

/**
 * Default renderer: launch ONE headless session, load vendored mermaid, render
 * every source. Returns one { svg } | { error } per source, in order. Graceful:
 * with no browser, every entry is { error:'no headless browser found' }.
 */
async function renderViaBrowser(sources, themeCfg) {
  const browser = detectBrowser();
  if (!browser) return sources.map(() => ({ error: 'no headless browser found' }));
  if (!fs.existsSync(MERMAID_LIB)) return sources.map(() => ({ error: 'mermaid library not vendored (engine/vendor/mermaid.min.js missing)' }));
  const lib = fs.readFileSync(MERMAID_LIB, 'utf-8');
  // Build a harness HTML: load mermaid, expose a render-all function.
  const harness = buildHarness(lib, sources, themeCfg);
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-mmd-'));
  const htmlPath = path.join(tmp, 'mermaid.html');
  fs.writeFileSync(htmlPath, harness, 'utf-8');
  let results = sources.map(() => ({ error: 'render failed' }));
  try {
    const ok = await withCdpSession(browser, htmlPath, async (send) => {
      const expr = `(async () => {
        try {
          const out = [];
          for (let i = 0; i < window.__SOURCES__.length; i++) {
            try {
              mermaid.initialize({ startOnLoad:false, securityLevel:'strict',
                theme: window.__CFG__.base, themeVariables: window.__CFG__.themeVariables,
                deterministicIds:true, deterministicIDSeed: 'pd-' + i });
              const { svg } = await mermaid.render('pd-m-' + i, window.__SOURCES__[i]);
              out.push({ svg });
            } catch (e) { out.push({ error: String(e && e.message || e) }); }
          }
          return JSON.stringify(out);
        } catch (e) { return JSON.stringify({ __fatal__: String(e && e.message || e) }); }
      })()`;
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      const val = r && r.result && r.result.value;
      if (!val) return false;
      const parsed = JSON.parse(val);
      if (parsed && parsed.__fatal__) { results = sources.map(() => ({ error: parsed.__fatal__ })); return false; }
      results = parsed;
      return true;
    });
    if (!ok && results.every((x) => x.error === 'render failed')) {
      results = sources.map(() => ({ error: 'mermaid render session failed' }));
    }
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
  }
  return results;
}

/**
 * Pre-render every @mermaid block in `md`. Returns the rewritten md (blocks →
 * [[MERMAIDSVG:N]]), `mermaids[N] = { svg } | { source, error }`, and diagnostics.
 * `render` is injectable for tests. Never throws.
 */
async function renderMermaid(md, { theme, accent, baseDir, strict = false, render } = {}) {
  const text = String(md).replace(/\r\n?/g, '\n');
  // Mask @-marker comments inside fenced code blocks so fenced examples are
  // not treated as real @mermaid blocks to extract and render.
  const fence = maskFencedMarkers(text);
  const blocks = extractMermaidBlocks(fence.masked);
  const diagnostics = { errors: [], strictAbort: false };
  if (blocks.length === 0) return { md: fence.restore(fence.masked), mermaids: [], diagnostics };

  // Resolve each source (src= file or body); a resolve error is a fallback too.
  const resolved = blocks.map((b) => resolveSource(b, baseDir));
  const sources = resolved.map((r) => r.source || '');
  const themeCfg = themeVariables(theme, accent);
  const renderFn = render || renderViaBrowser;

  let rendered;
  try {
    rendered = await renderFn(sources, themeCfg);
  } catch (e) {
    rendered = sources.map(() => ({ error: `mermaid render crashed: ${e.message}` }));
  }

  const mermaids = blocks.map((b, i) => {
    const res = resolved[i];
    if (res.error) {
      diagnostics.errors.push(`@mermaid #${i}: ${res.error}`);
      // a resolve error (bad src) IS a hard error under --strict
      if (strict) diagnostics.strictAbort = true;
      return { title: b.title, source: b.source, error: res.error };
    }
    const out = rendered[i] || { error: 'no render result' };
    if (out.error) {
      diagnostics.errors.push(`@mermaid #${i}: ${out.error}`);
      // A missing browser degrades; a real render error aborts under --strict.
      if (strict && !/no headless browser/i.test(out.error)) diagnostics.strictAbort = true;
      return { title: b.title, source: sources[i], error: out.error };
    }
    return { title: b.title, svg: out.svg };
  });

  // Rewrite blocks → neutral sentinels, in order (operate on masked text so
  // fenced examples — already neutralized — are not matched).
  let n = 0;
  const sentineled = fence.masked.replace(MERMAID_BLOCK_RE, () => `\n[[MERMAIDSVG:${n++}]]\n`);
  // Restore fenced-block content (in-fence marker comments back to original text).
  // Real [[MERMAIDSVG:N]] sentinels are never inside fences, so they survive intact.
  const outMd = fence.restore(sentineled);
  return { md: outMd, mermaids, diagnostics };
}

module.exports = {
  MERMAID_BLOCK_RE, extractMermaidBlocks, themeVariables, resolveSource,
  renderViaBrowser, renderMermaid, buildHarness, safeJson,
};

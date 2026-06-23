'use strict';
/**
 * export.js — render a built HTML doc to PDF/PNG via a SYSTEM headless browser.
 * Zero npm deps: shells out to Chrome/Edge/Chromium with child_process.spawnSync.
 * Degrades gracefully: if no browser is found, warns and returns { skipped }.
 */
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

function candidateBrowsers() {
  if (process.env.PD_BROWSER) return [process.env.PD_BROWSER];
  const p = process.platform;
  if (p === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pfx86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = process.env['LOCALAPPDATA'] || '';
    return [
      path.join(pfx86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pfx86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      local ? path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    ].filter(Boolean);
  }
  if (p === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
  }
  return ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
}

function detectBrowser() {
  for (const c of candidateBrowsers()) {
    if (path.isAbsolute(c)) {
      if (fs.existsSync(c)) return c;
    } else {
      const r = spawnSync(c, ['--version'], { stdio: 'ignore', timeout: 3000 });
      if (!r.error && r.status === 0) return c;
    }
  }
  return null;
}

function toFileUrl(absPath) {
  return url.pathToFileURL(path.resolve(absPath)).href;
}

function buildPdfArgs(htmlAbs, outAbs) {
  return [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${outAbs}`, toFileUrl(htmlAbs),
  ];
}

function detectFormat(htmlAbs) {
  try {
    const m = fs.readFileSync(htmlAbs, 'utf-8').match(/data-pd-format="(\w+)"/);
    return m ? m[1] : 'proposal';
  } catch (_) { return 'proposal'; }
}

function buildPngArgs(htmlAbs, outAbs, opts = {}) {
  const args = ['--headless=new', '--disable-gpu', '--hide-scrollbars'];
  if (opts.windowSize) args.push(`--window-size=${opts.windowSize}`);
  args.push(`--screenshot=${outAbs}`, toFileUrl(htmlAbs));
  return args;
}

/** GET http://127.0.0.1:<port><pathname> and parse the JSON body. */
function httpGetJson(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: pathname }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
  });
}

const MAX_CAPTURE_PX = 16384; // Chrome/Skia max texture dimension on most platforms
/** True when a page is taller than the browser can capture in a single shot (F5). */
function exceedsCaptureLimit(height) {
  return Number(height) > MAX_CAPTURE_PX;
}

/** Return a CDP navigation's errorText, or null when it succeeded (F4). */
function cdpNavError(navResult) {
  return navResult && navResult.errorText ? navResult.errorText : null;
}

/** Resolve `p`, or reject after `ms` with a labeled timeout. Bounds individual CDP commands. */
function withTimeout(p, ms, label) {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${label}`)), ms);
    to.unref();
    Promise.resolve(p).then(
      (v) => { clearTimeout(to); resolve(v); },
      (e) => { clearTimeout(to); reject(e); },
    );
  });
}

/** Remove a directory tree, retrying briefly on transient Windows lock errors. Never throws. */
function removeDirSafe(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); return true; }
  catch (_) { return false; }
}

/** Resolve once `child` has exited, or after `ms` (whichever comes first). */
function waitForExit(child, ms) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    const to = setTimeout(resolve, ms);
    to.unref();
    child.once('exit', () => { clearTimeout(to); resolve(); });
  });
}

/**
 * Tear down a CDP capture: close the socket, kill the browser, WAIT for it to
 * release its profile lock, then remove the temp profile dir. Returns whether the
 * dir was removed. Never throws. Waiting for exit is the Windows fix (F2) — killing
 * and deleting in the same tick loses a race and leaves multi-MB profiles behind.
 */
async function killAndClean(child, ws, dir) {
  try { if (ws) ws.close(); } catch (_) {}
  if (child && child.pid !== undefined) {
    try { child.kill(); } catch (_) {}
    try { await waitForExit(child, 2000); } catch (_) {}
  }
  return dir ? removeDirSafe(dir) : true;
}

/**
 * Capture the ENTIRE page (beyond the viewport) as a PNG via the Chrome
 * DevTools Protocol. Returns true on success. Never throws — on any failure it
 * warns and returns false so the caller degrades gracefully.
 * Requires Node's global WebSocket (Node >= 22).
 */
async function captureFullPagePng(browser, htmlAbs, outAbs) {
  if (typeof WebSocket === 'undefined') {
    console.warn('export: full-page PNG needs Node >= 22 (global WebSocket); skipping PNG.');
    return false;
  }
  // Fix 1: declare resource vars before try so finally can always guard them.
  let userDataDir, child, ws;
  try {
    // Fix 1: mkdtempSync + spawn moved inside try so any throw is caught.
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-cdp-'));
    child = spawn(browser, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${userDataDir}`, '--remote-debugging-port=0', 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    // F1: a spawn failure (ENOENT/EACCES, AV lock, corrupt binary) emits an async
    // 'error' event. With no listener, EventEmitter THROWS it as an uncaughtException
    // that escapes this try/catch and crashes the process — breaking the no-throw
    // contract. Keep a listener for the child's whole life so it is always handled,
    // and surface it through a promise we can race the in-flight step against.
    let onChildError;
    const childError = new Promise((_, reject) => { onChildError = reject; });
    childError.catch(() => {}); // a late error must not surface as an unhandled rejection
    child.on('error', (e) => onChildError(new Error(`browser failed to launch: ${e.code || e.message}`)));

    // 1. Read the chosen DevTools port from stderr ("DevTools listening on ws://127.0.0.1:<port>/...").
    const port = await Promise.race([childError, new Promise((resolve, reject) => {
      let buf = '';
      const to = setTimeout(() => reject(new Error('timeout waiting for DevTools port')), 10000);
      to.unref(); // an orphaned timer must not hold the process open after a fast-fail
      child.stderr.on('data', (d) => {
        buf += d.toString();
        const m = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
        if (m) { clearTimeout(to); resolve(Number(m[1])); }
      });
      child.on('exit', () => { clearTimeout(to); reject(new Error('browser exited before DevTools was ready')); });
    })]);

    // 2. Find the page target's WebSocket URL (retry briefly while it appears).
    let target;
    for (let i = 0; i < 30 && !target; i++) {
      try {
        const list = await httpGetJson(port, '/json');
        target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      } catch (_) { /* not ready yet */ }
      if (!target) await new Promise((r) => setTimeout(r, 100));
    }
    if (!target) throw new Error('no CDP page target found');

    // 3. Connect, navigate, wait for load, measure, screenshot.
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('CDP websocket error')), { once: true });
    });

    // Fix 2: track both resolve AND reject per pending command; reject all on close/error.
    let nextId = 1;
    const pending = new Map();
    let onLoad = null;
    const rejectAll = (err) => { for (const { reject } of pending.values()) reject(err); pending.clear(); };
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        // Fix 3: surface CDP-level errors instead of silently resolving with undefined.
        if (msg.error) reject(new Error(`CDP ${msg.method || ''} error: ${msg.error.message || JSON.stringify(msg.error)}`));
        else resolve(msg.result);
      } else if (msg.method === 'Page.loadEventFired' && onLoad) { onLoad(); }
    });
    ws.addEventListener('close', () => rejectAll(new Error('CDP websocket closed')));
    ws.addEventListener('error', () => rejectAll(new Error('CDP websocket error')));
    const send = (method, params) => new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });

    // F3: bound every CDP command — rejectAll handles a *crashed* browser, but a
    // browser that stays alive yet never answers would otherwise hang forever.
    await withTimeout(send('Page.enable'), 10000, 'Page.enable');
    const loaded = new Promise((resolve) => { onLoad = resolve; });
    // F4: a failed navigation (missing/blocked file) returns errorText rather than a
    // CDP error — without this check we would screenshot a blank page and report success.
    const nav = await withTimeout(send('Page.navigate', { url: toFileUrl(htmlAbs) }), 15000, 'Page.navigate');
    const navErr = cdpNavError(nav);
    if (navErr) throw new Error(`navigation failed: ${navErr}`);
    await Promise.race([loaded, new Promise((r) => { const t = setTimeout(r, 8000); t.unref(); })]);
    await new Promise((r) => setTimeout(r, 300)); // settle: let React client-render finish

    const metrics = await withTimeout(send('Page.getLayoutMetrics'), 10000, 'Page.getLayoutMetrics');
    const size = metrics.cssContentSize || metrics.contentSize;
    // F5: extreme heights exceed the browser's max capture surface and get clipped.
    // Warn so a short/clipped PNG is explainable; still attempt (the catch handles a hard fail).
    if (exceedsCaptureLimit(size.height)) {
      console.warn(`export: page is ${Math.ceil(size.height)}px tall; the browser may clip the PNG beyond ~${MAX_CAPTURE_PX}px.`);
    }
    const shot = await withTimeout(send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 },
    }), 30000, 'Page.captureScreenshot');
    if (!shot || !shot.data) throw new Error('empty screenshot');
    fs.writeFileSync(outAbs, Buffer.from(shot.data, 'base64'));
    return fs.existsSync(outAbs) && fs.statSync(outAbs).size > 0;
  } catch (e) {
    console.warn(`export: full-page PNG failed: ${e.message}`);
    return false;
  } finally {
    // F2: close ws, kill the browser, wait for it to release the profile lock, then
    // remove the temp dir with retries. killAndClean guards every undefined resource.
    await killAndClean(child, ws, userDataDir);
  }
}

async function runExport({ htmlPath, browser, pdf = false, png = false, outDir } = {}) {
  if (!browser) {
    console.warn('export: No headless Chrome/Edge/Chromium found. Install one, set PD_BROWSER, or open the HTML and use Print → Save as PDF.');
    return { skipped: 'no-browser' };
  }
  const htmlAbs = path.resolve(htmlPath);
  const dir = outDir ? path.resolve(outDir) : path.dirname(htmlAbs);
  const base = path.join(dir, path.basename(htmlAbs).replace(/\.html?$/i, ''));
  const result = { browser };

  if (pdf) {
    const out = `${base}.pdf`;
    const r = spawnSync(browser, buildPdfArgs(htmlAbs, out), { stdio: ['ignore', 'ignore', 'pipe'] });
    if (r.status === 0 && fs.existsSync(out)) result.pdf = out;
    else console.warn(`export: PDF failed${r.stderr && r.stderr.length ? ': ' + r.stderr.toString().slice(-300) : ''}`);
  }

  if (png) {
    const out = `${base}.png`;
    const fmt = detectFormat(htmlAbs);
    if (fmt === 'slides') {
      // Slide decks: a single hero shot of slide 0 (single viewport by design).
      const r = spawnSync(browser, buildPngArgs(htmlAbs, out, { windowSize: '1600,900' }), { stdio: ['ignore', 'ignore', 'pipe'] });
      if (r.status === 0 && fs.existsSync(out)) result.png = out;
      else console.warn(`export: PNG failed${r.stderr && r.stderr.length ? ': ' + r.stderr.toString().slice(-300) : ''}`);
    } else {
      // Proposals/articles: full scrollable page via CDP.
      if (await captureFullPagePng(browser, htmlAbs, out)) result.png = out;
    }
  }

  if ((pdf || png) && !result.pdf && !result.png) result.skipped = 'export-failed';
  return result;
}

async function exportFile(htmlPath, opts = {}) {
  return runExport({ ...opts, htmlPath, browser: detectBrowser() });
}

module.exports = { detectBrowser, toFileUrl, buildPdfArgs, buildPngArgs, detectFormat, runExport, exportFile, killAndClean, withTimeout, cdpNavError };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith('--'));
  let pdf = argv.includes('--pdf');
  let png = argv.includes('--png');
  if (!pdf && !png) { pdf = true; png = true; }
  const outIdx = argv.indexOf('--out');
  const outDir = outIdx >= 0 ? argv[outIdx + 1] : undefined;
  if (!file) { console.error('export: <file.html> is required'); process.exit(1); }
  // exportFile is async (full-page PNG uses CDP); await it.
  exportFile(file, { pdf, png, outDir }).then((r) => {
    if (r.pdf) console.log(r.pdf);
    if (r.png) console.log(r.png);
  });
}

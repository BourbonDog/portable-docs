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

    // 1. Read the chosen DevTools port from stderr ("DevTools listening on ws://127.0.0.1:<port>/...").
    const port = await new Promise((resolve, reject) => {
      let buf = '';
      const to = setTimeout(() => reject(new Error('timeout waiting for DevTools port')), 10000);
      child.stderr.on('data', (d) => {
        buf += d.toString();
        const m = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
        if (m) { clearTimeout(to); resolve(Number(m[1])); }
      });
      child.on('exit', () => { clearTimeout(to); reject(new Error('browser exited before DevTools was ready')); });
    });

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

    await send('Page.enable');
    const loaded = new Promise((resolve) => { onLoad = resolve; });
    await send('Page.navigate', { url: toFileUrl(htmlAbs) });
    await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))]);
    await new Promise((r) => setTimeout(r, 300)); // settle: let React client-render finish

    const metrics = await send('Page.getLayoutMetrics');
    const size = metrics.cssContentSize || metrics.contentSize;
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 },
    });
    if (!shot || !shot.data) throw new Error('empty screenshot');
    fs.writeFileSync(outAbs, Buffer.from(shot.data, 'base64'));
    return fs.existsSync(outAbs) && fs.statSync(outAbs).size > 0;
  } catch (e) {
    console.warn(`export: full-page PNG failed: ${e.message}`);
    return false;
  } finally {
    // Fix 1: guard every cleanup against undefined (mkdtempSync/spawn may not have run).
    try { if (ws) ws.close(); } catch (_) {}
    try { if (child) child.kill(); } catch (_) {}
    if (userDataDir) { try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {} }
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

module.exports = { detectBrowser, toFileUrl, buildPdfArgs, buildPngArgs, detectFormat, runExport, exportFile };

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

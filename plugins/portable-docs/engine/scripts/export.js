'use strict';
/**
 * export.js — render a built HTML doc to PDF/PNG via a SYSTEM headless browser.
 * Zero npm deps: shells out to Chrome/Edge/Chromium with child_process.spawnSync.
 * Degrades gracefully: if no browser is found, warns and returns { skipped }.
 */
const fs = require('fs');
const path = require('path');
const url = require('url');
const { spawnSync } = require('child_process');

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

function runExport({ htmlPath, browser, pdf = false, png = false, outDir } = {}) {
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
    const windowSize = fmt === 'slides' ? '1600,900' : undefined; // slides: hero of slide 0
    const r = spawnSync(browser, buildPngArgs(htmlAbs, out, { windowSize }), { stdio: ['ignore', 'ignore', 'pipe'] });
    if (r.status === 0 && fs.existsSync(out)) result.png = out;
    else console.warn(`export: PNG failed${r.stderr && r.stderr.length ? ': ' + r.stderr.toString().slice(-300) : ''}`);
  }

  if ((pdf || png) && !result.pdf && !result.png) result.skipped = 'export-failed';
  return result;
}

function exportFile(htmlPath, opts = {}) {
  return runExport({ ...opts, htmlPath, browser: detectBrowser() });
}

module.exports = { detectBrowser, toFileUrl, buildPdfArgs, buildPngArgs, detectFormat, runExport, exportFile };

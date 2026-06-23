'use strict';
/**
 * open.js — Cross-platform file opener.
 *
 * API: openFile(filePath) → void
 *   Opens the given path in the OS default handler.
 *   win32  → cmd /c start "" <path>
 *   darwin → open <path>
 *   else   → xdg-open <path>
 */

const { execFile } = require('child_process');
const path = require('path');

/**
 * @param {string} filePath - Absolute path to open.
 */
function openFile(filePath) {
  const abs = path.resolve(filePath);

  if (process.platform === 'win32') {
    // cmd /c start "" "<path>" — the empty "" is the window title; required
    // so that a path containing spaces is not misinterpreted as the title.
    execFile('cmd', ['/c', 'start', '', abs], { windowsHide: true }, (err) => {
      if (err) console.error('open: could not open file:', err.message);
    });
  } else if (process.platform === 'darwin') {
    execFile('open', [abs], (err) => {
      if (err) console.error('open: could not open file:', err.message);
    });
  } else {
    execFile('xdg-open', [abs], (err) => {
      if (err) console.error('open: could not open file:', err.message);
    });
  }
}

/** Open an http(s) URL in the OS default browser. */
function openUrl(url) {
  const cb = (err) => { if (err) console.error('open: could not open url:', err.message); };
  if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', url], { windowsHide: true }, cb);
  else if (process.platform === 'darwin') execFile('open', [url], cb);
  else execFile('xdg-open', [url], cb);
}

module.exports = { openFile, openUrl };

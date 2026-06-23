'use strict';
/**
 * watch.js — live-reload dev server for authoring.
 *
 * Serves the built HTML with a small reload client injected ONLY into the
 * served response (the on-disk file is never modified — G1). Watches the input
 * (and config) for changes, rebuilds debounced, and pushes a reload over SSE.
 * Zero deps: Node http + fs.watch + child_process (via open.js). Authoring-time
 * only; never a runtime dependency of the output.
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const RELOAD_CLIENT = `<script>(function(){
  try {
    var es = new EventSource('/__pd_reload');
    es.onmessage = function(){ location.reload(); };
    es.addEventListener('builderror', function(e){
      var id='__pd_err', el=document.getElementById(id);
      if(!el){ el=document.createElement('div'); el.id=id;
        el.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#b00020;color:#fff;font:12px/1.5 ui-monospace,monospace;padding:10px 14px;white-space:pre-wrap;max-height:40vh;overflow:auto';
        document.body.appendChild(el); }
      el.textContent='portable-docs build error: '+e.data;
    });
  } catch(e){}
})();</script>`;

function injectReloadClient(html) {
  const idx = html.lastIndexOf('</body>');
  if (idx === -1) return html + RELOAD_CLIENT;
  return html.slice(0, idx) + RELOAD_CLIENT + html.slice(idx);
}

function sseFrame(data, event) {
  const safe = String(data).replace(/\r?\n/g, ' | ');
  return (event ? `event: ${event}\n` : '') + `data: ${safe}\n\n`;
}

function debounce(fn, ms) {
  let t = null;
  const wrapped = (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => { t = null; fn(...args); }, ms);
  };
  wrapped.cancel = () => { if (t) { clearTimeout(t); t = null; } };
  return wrapped;
}

module.exports = { RELOAD_CLIENT, injectReloadClient, sseFrame, debounce };

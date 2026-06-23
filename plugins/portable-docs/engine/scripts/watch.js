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

function createServer(htmlPath, clients) {
  return http.createServer((req, res) => {
    if (req.url === '/__pd_reload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (req.url === '/' || req.url === '/index.html') {
      try {
        const html = injectReloadClient(fs.readFileSync(htmlPath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('portable-docs: no build yet (' + e.message + ')');
      }
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });
}

/**
 * Start the live-reload server + file watchers.
 * @returns {Promise<{port:number, server:http.Server, close:()=>Promise<void>,
 *                     notifyReload:()=>void, notifyError:(t:string)=>void}>}
 */
async function startWatch({ htmlPath, watchPaths = [], rebuild, onError } = {}) {
  const clients = new Set();
  const server = createServer(htmlPath, clients);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const notifyReload = () => { for (const res of clients) { try { res.write(sseFrame('reload')); } catch (_) {} } };
  const notifyError = (text) => { for (const res of clients) { try { res.write(sseFrame(text, 'builderror')); } catch (_) {} } };

  const trigger = debounce(async () => {
    try { await rebuild(); notifyReload(); }
    catch (e) { if (onError) onError(e); notifyError(e.message); }
  }, 200);

  // Watch each target's DIRECTORY, filtered by basename — robust to editor
  // save patterns (rename/replace) that break a direct file watch.
  const watchers = [];
  for (const p of watchPaths) {
    try {
      const dir = path.dirname(p);
      const base = path.basename(p);
      const w = fs.watch(dir, { persistent: true }, (_evt, fn) => { if (!fn || fn === base) trigger(); });
      watchers.push(w);
    } catch (_) { /* G4: missing path / unsupported watch — degrade silently */ }
  }

  const close = () => {
    trigger.cancel();
    for (const w of watchers) { try { w.close(); } catch (_) {} }
    for (const res of clients) { try { res.end(); } catch (_) {} }
    clients.clear();
    return new Promise((resolve) => server.close(resolve));
  };

  return { port, server, close, notifyReload, notifyError };
}

module.exports = { RELOAD_CLIENT, injectReloadClient, sseFrame, debounce, startWatch };

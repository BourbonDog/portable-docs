'use strict';
/**
 * fences.js — mask fenced code blocks so marker extractors don't match markers
 * shown as code EXAMPLES. Round-trip identity: restore(maskFences(t).masked)===t;
 * masked===t when t has no fenced code.
 *
 * A fence opens with >=3 backticks or >=3 tildes (indented up to 3 spaces) plus an
 * optional info string, and closes on a line of the SAME fence char and >= length.
 * The >=length rule makes nested fences work (a 4-backtick span swallows 3-backtick
 * fences until a >=4-backtick close).
 */
const NUL = String.fromCharCode(0); // sentinel wrapper — NUL never appears in Markdown

function maskFences(text) {
  const lines = String(text).split('\n');
  const spans = [];
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(/^( {0,3})(`{3,}|~{3,})(.*)$/);
    // a backtick info string may not contain backticks (CommonMark); ~~~ may.
    const validOpen = open && !(open[2][0] === '`' && open[3].includes('`'));
    if (validOpen) {
      const ch = open[2][0];
      const len = open[2].length;
      const closeRe = new RegExp('^ {0,3}\\' + ch + '{' + len + ',}[ \\t]*$');
      const block = [lines[i]];
      i++;
      while (i < lines.length) {
        block.push(lines[i]);
        const closed = closeRe.test(lines[i]);
        i++;
        if (closed) break;
      }
      // NUL-wrapped so the sentinel cannot collide with real document text and
      // contains no `<!--` for marker regexes to match.
      const token = NUL + 'PDFENCE' + spans.length + NUL;
      spans.push({ token, original: block.join('\n') });
      out.push(token);
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  const masked = out.join('\n');
  function restore(t) {
    let r = String(t);
    for (const s of spans) r = r.split(s.token).join(s.original);
    return r;
  }
  return { masked, restore };
}

module.exports = { maskFences };

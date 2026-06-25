'use strict';
/**
 * fences.js — neutralize @-marker COMMENTS that appear INSIDE fenced code blocks,
 * so marker extractors treat them as code EXAMPLES instead of real markers.
 *
 * Only the `<!-- @name … -->` / `<!-- /@name … -->` comments on lines inside a fence
 * are masked. The fences themselves and ALL other content are left intact — crucially
 * including a REAL marker's own inline data fence (e.g. a `@chart`'s ```csv``` block):
 * a real marker's comments sit at top level (the data fence is INSIDE the marker, not
 * the marker inside a fence), so they are never masked.
 *
 *   maskFencedMarkers(text) → { masked, restore }
 *     masked    — in-fence marker comments replaced by NUL-wrapped sentinels (no `<!--`).
 *     restore(t)— swaps the sentinels back to the original comment text.
 *   Round-trip: restore(masked) === text; masked === text when no in-fence marker exists.
 *
 * Fences: >=3 backticks or >=3 tildes (indented up to 3 spaces) + optional info string,
 * closing on the SAME char and >= length (so a longer outer fence nests shorter inner
 * ones — show an example that itself contains a ```data``` fence with a 4-backtick outer).
 */
const NUL = String.fromCharCode(0); // sentinel wrapper — NUL never appears in Markdown
const MARKER_RE = /<!--\s*\/?@[\s\S]*?-->/g;

function maskFencedMarkers(text) {
  const lines = String(text).split('\n');
  const spans = [];
  const out = [];
  let i = 0;
  function maskLine(line) {
    return line.replace(MARKER_RE, (m) => {
      const token = NUL + 'PDMARK' + spans.length + NUL;
      spans.push({ token, original: m });
      return token;
    });
  }
  while (i < lines.length) {
    const open = lines[i].match(/^( {0,3})(`{3,}|~{3,})(.*)$/);
    // a backtick info string may not contain backticks (CommonMark); ~~~ may.
    const validOpen = open && !(open[2][0] === '`' && open[3].includes('`'));
    if (validOpen) {
      const ch = open[2][0];
      const len = open[2].length;
      const closeRe = new RegExp('^ {0,3}\\' + ch + '{' + len + ',}[ \\t]*$');
      out.push(lines[i]); // opening fence line — kept as-is
      i++;
      while (i < lines.length) {
        if (closeRe.test(lines[i])) { out.push(lines[i]); i++; break; }
        out.push(maskLine(lines[i])); // inside the fence: neutralize marker comments only
        i++;
      }
    } else {
      out.push(lines[i]); // outside any fence: real markers stay intact
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

// Return boolean[] where flags[i] === true if line i is inside a fenced code block
// (delimiter lines included). Used to split slides only at `---` OUTSIDE fences.
function fencedLineFlags(text) {
  const lines = String(text).split('\n');
  const flags = new Array(lines.length).fill(false);
  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(/^( {0,3})(`{3,}|~{3,})(.*)$/);
    const validOpen = open && !(open[2][0] === '`' && open[3].includes('`'));
    if (validOpen) {
      const ch = open[2][0];
      const len = open[2].length;
      const closeRe = new RegExp('^ {0,3}\\' + ch + '{' + len + ',}[ \\t]*$');
      flags[i] = true; i++;
      while (i < lines.length) { flags[i] = true; const closed = closeRe.test(lines[i]); i++; if (closed) break; }
    } else { i++; }
  }
  return flags;
}

module.exports = { maskFencedMarkers, fencedLineFlags };

'use strict';
/**
 * charts.js — build-time data layer for data-driven charts (Phase 4a).
 *
 * Pure parsing + a tiny zero-dependency CSV reader, plus block resolution that
 * reads CSV/JSON from an inline fence or a `src=` file and normalizes it to a
 * per-type shape. No runtime dependency leaks into the browser bundle — every
 * function here runs at build time and the result is baked into the content
 * snapshot.
 */
const fs = require('fs');
const path = require('path');

/** Parse CSV text → { columns, rows }. RFC-4180-ish: quotes, "" escapes, CRLF. */
function parseCsv(text) {
  const s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const all = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n') {
      row.push(field); all.push(row); row = []; field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); all.push(row); }
  const cleaned = all.filter((r) => !(r.length === 1 && r[0].trim() === ''));
  if (cleaned.length === 0) return { columns: [], rows: [] };
  const columns = cleaned[0].map((c) => c.trim());
  const rows = cleaned.slice(1).map((r) => r.map((c) => c.trim()));
  return { columns, rows };
}

module.exports = { parseCsv };

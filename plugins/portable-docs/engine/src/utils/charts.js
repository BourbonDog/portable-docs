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

/** Extract the first fenced code block from a chart body → { lang, text } | null. */
function extractFence(body) {
  const m = String(body).replace(/\r\n?/g, '\n').match(/```([A-Za-z0-9]+)?[ \t]*\n([\s\S]*?)\n```/);
  if (!m) return null;
  return { lang: (m[1] || '').toLowerCase(), text: m[2] };
}

/** Resolve chart data from a `src=` file or an inline fence → { columns, rows } | { error }. */
function loadChartData({ src, body, baseDir }) {
  let text, kind;
  if (src) {
    const p = path.isAbsolute(src) ? src : path.join(baseDir || process.cwd(), src);
    if (!fs.existsSync(p)) return { error: `data file not found: ${src}` };
    text = fs.readFileSync(p, 'utf-8');
    kind = /\.json$/i.test(src) ? 'json' : 'csv';
  } else {
    const fence = extractFence(body);
    if (!fence) return { error: 'no data: add src="…" or an inline ```csv``` / ```json``` block' };
    text = fence.text;
    kind = fence.lang === 'json' ? 'json' : 'csv';
  }
  try {
    if (kind === 'json') {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr) || arr.length === 0) return { error: 'JSON must be a non-empty array of row objects' };
      const columns = Object.keys(arr[0]);
      const rows = arr.map((o) => columns.map((c) => (o[c] == null ? '' : String(o[c]))));
      return { columns, rows };
    }
    const { columns, rows } = parseCsv(text);
    if (columns.length === 0 || rows.length === 0) return { error: 'no data rows found' };
    return { columns, rows };
  } catch (e) {
    return { error: `could not parse ${kind.toUpperCase()} data: ${e.message}` };
  }
}

const NEW_CHART_TYPES = ['pie', 'donut', 'grouped-bar', 'stacked-bar', 'area', 'line', 'scatter'];

/** Coerce a cell to a finite number (strips currency/unit punctuation). */
function num(v) {
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Map parsed { columns, rows } → the per-type normalized payload (or { error }). */
function normalizeChartData(type, columns, rows) {
  if (type === 'pie' || type === 'donut') {
    if (columns.length < 2) return { error: `${type} expects columns: label,value` };
    const ci = columns.length > 2 ? 2 : -1;
    return { slices: rows.map((r) => ({ label: r[0], value: num(r[1]), color: ci >= 0 ? (r[ci] || '') : '' })) };
  }
  if (type === 'grouped-bar' || type === 'stacked-bar' || type === 'area' || type === 'line') {
    if (columns.length < 2) return { error: `${type} expects a category/x column plus one or more series columns` };
    const categories = rows.map((r) => r[0]);
    const series = columns.slice(1).map((name, i) => ({ name, values: rows.map((r) => num(r[i + 1])) }));
    return { categories, series };
  }
  if (type === 'scatter') {
    if (columns.length < 2) return { error: 'scatter expects columns: x,y' };
    const xi = columns.indexOf('x'), yi = columns.indexOf('y');
    const X = xi >= 0 ? xi : 0, Y = yi >= 0 ? yi : 1;
    const li = columns.indexOf('label'), si = columns.indexOf('series');
    return { points: rows.map((r) => ({ x: num(r[X]), y: num(r[Y]), label: li >= 0 ? r[li] : '', series: si >= 0 ? r[si] : '' })) };
  }
  return { error: `unknown chart type "${type}"` };
}

/** Read one attribute value from the chart's opening marker. */
function chartAttr(block, name) {
  const m = block.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : '';
}

/** Resolve a full `@chart … /@chart` block → resolvedChart. Never throws. */
function parseChartBlock(block, baseDir) {
  const base = {
    type: chartAttr(block, 'type'),
    title: chartAttr(block, 'title'),
    subtitle: chartAttr(block, 'subtitle'),
    xlabel: chartAttr(block, 'xlabel'),
    ylabel: chartAttr(block, 'ylabel'),
  };
  if (!NEW_CHART_TYPES.includes(base.type)) return { ...base, error: `unknown chart type "${base.type}"` };
  const bodyMatch = block.match(/-->([\s\S]*)<!--\s*\/@chart/);
  const body = bodyMatch ? bodyMatch[1] : '';
  const loaded = loadChartData({ src: chartAttr(block, 'src'), body, baseDir });
  if (loaded.error) return { ...base, error: loaded.error };
  const norm = normalizeChartData(base.type, loaded.columns, loaded.rows);
  if (norm.error) return { ...base, error: norm.error };
  return { ...base, ...norm, error: null };
}

const CHART_BLOCK_RE = /<!--\s*@chart\b[\s\S]*?<!--\s*\/@chart\s*-->/g;

/** Replace each @chart block with a [[CHART:N]] sentinel; collect resolved charts in order. */
function extractChartPlaceholders(text, baseDir) {
  const charts = [];
  const out = String(text).replace(CHART_BLOCK_RE, (block) => {
    const idx = charts.length;
    charts.push(parseChartBlock(block, baseDir));
    return `\n[[CHART:${idx}]]\n`;
  });
  return { text: out, charts };
}

module.exports = {
  parseCsv, extractFence, loadChartData,
  NEW_CHART_TYPES, normalizeChartData, chartAttr, parseChartBlock, extractChartPlaceholders,
  CHART_BLOCK_RE,
};

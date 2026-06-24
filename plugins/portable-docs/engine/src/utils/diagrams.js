'use strict';
/**
 * diagrams.js — build-time resolvers for the structured diagram markers
 * @flow (FlowDiagram) and @quadrant (QuadrantChart). Mirrors charts.js:
 * fenced-JSON or src= data, resolved at build time, normalized to the exact
 * props each component consumes. Every resolver NEVER throws — on any failure
 * it returns { kind, title, error:'<message>' }.
 */
const { loadJsonData, chartAttr } = require('./charts.js');

/** Capture the body between the opening `-->` and the closing `<!-- /@name`. */
function blockBody(block, name) {
  const m = String(block).replace(/\r\n?/g, '\n').match(new RegExp(`-->([\\s\\S]*)<!--\\s*/@${name}`));
  return m ? m[1] : '';
}

// ── @flow ────────────────────────────────────────────────────────────────────
const FLOW_BLOCK_RE = /<!--\s*@flow\b[\s\S]*?<!--\s*\/@flow\s*-->/g;

/** Normalize parsed JSON → FlowDiagram props (or { error }). */
function normalizeFlow(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'flow data must be a JSON object' };
  if (!Array.isArray(data.tabs) || data.tabs.length === 0) return { error: 'flow expects a non-empty "tabs" array' };
  return {
    systemName: data.systemName || '',
    accentColor: data.accentColor || '',
    tabs: data.tabs,
    callouts: Array.isArray(data.callouts) ? data.callouts : [],
  };
}

/** Resolve one `@flow … /@flow` block → resolved flow object. Never throws. */
function parseFlowBlock(block, baseDir) {
  const base = { kind: 'flow', title: chartAttr(block, 'title') };
  const loaded = loadJsonData({ src: chartAttr(block, 'src'), body: blockBody(block, 'flow'), baseDir });
  if (loaded.error) return { ...base, error: loaded.error };
  const norm = normalizeFlow(loaded.data);
  if (norm.error) return { ...base, error: norm.error };
  return { ...base, ...norm, error: null };
}

/** Replace each @flow block with a [[FLOW:N]] sentinel; collect resolved flows in order. */
function extractFlowPlaceholders(text, baseDir) {
  const flows = [];
  const out = String(text).replace(FLOW_BLOCK_RE, (block) => {
    const idx = flows.length;
    flows.push(parseFlowBlock(block, baseDir));
    return `\n[[FLOW:${idx}]]\n`;
  });
  return { text: out, flows };
}

// ── @quadrant ─────────────────────────────────────────────────────────────────
const QUADRANT_BLOCK_RE = /<!--\s*@quadrant\b[\s\S]*?<!--\s*\/@quadrant\s*-->/g;

/** Normalize parsed JSON → QuadrantChart props (or { error }). */
function normalizeQuadrant(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'quadrant data must be a JSON object' };
  if (!Array.isArray(data.dots) || data.dots.length === 0) return { error: 'quadrant expects a non-empty "dots" array' };
  if (!Array.isArray(data.quadrantLabels) || data.quadrantLabels.length !== 4) {
    return { error: 'quadrant expects exactly four "quadrantLabels"' };
  }
  return {
    xAxisLow: data.xAxisLow || '', xAxisHigh: data.xAxisHigh || '',
    yAxisLow: data.yAxisLow || '', yAxisHigh: data.yAxisHigh || '',
    quadrantLabels: data.quadrantLabels,
    dots: data.dots,
  };
}

/** Resolve one `@quadrant … /@quadrant` block → resolved quadrant object. Never throws. */
function parseQuadrantBlock(block, baseDir) {
  const base = { kind: 'quadrant', title: chartAttr(block, 'title'), subtitle: chartAttr(block, 'subtitle') };
  const loaded = loadJsonData({ src: chartAttr(block, 'src'), body: blockBody(block, 'quadrant'), baseDir });
  if (loaded.error) return { ...base, error: loaded.error };
  const norm = normalizeQuadrant(loaded.data);
  if (norm.error) return { ...base, error: norm.error };
  return { ...base, ...norm, error: null };
}

/** Replace each @quadrant block with a [[QUADRANT:N]] sentinel; collect in order. */
function extractQuadrantPlaceholders(text, baseDir) {
  const quadrants = [];
  const out = String(text).replace(QUADRANT_BLOCK_RE, (block) => {
    const idx = quadrants.length;
    quadrants.push(parseQuadrantBlock(block, baseDir));
    return `\n[[QUADRANT:${idx}]]\n`;
  });
  return { text: out, quadrants };
}

module.exports = {
  blockBody,
  FLOW_BLOCK_RE, normalizeFlow, parseFlowBlock, extractFlowPlaceholders,
  QUADRANT_BLOCK_RE, normalizeQuadrant, parseQuadrantBlock, extractQuadrantPlaceholders,
};

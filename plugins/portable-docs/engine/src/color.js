'use strict';
/**
 * color.js — tiny dependency-free hex color helpers.
 *
 * CommonJS so the engine's tests can require() and verify the math directly.
 * The SAME source is also inlined (as text) into every browser bundle by
 * build.js extractDesignTokensCode(), so design-tokens.js's accent-override
 * IIFE can call lighten()/normalizeHex() at view time. Keep it browser-safe:
 * no process.env, no Node APIs.
 */
function normalizeHex(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3 || h.length === 4) {
    h = h.slice(0, 3).split('').map((c) => c + c).join('');
  } else if (h.length >= 6) {
    h = h.slice(0, 6);
  } else {
    // Malformed short input (e.g. a 5-digit hex): pad to a valid 6-digit value.
    h = (h + '000000').slice(0, 6);
  }
  return '#' + h.toUpperCase();
}

function mixHex(hexA, hexB, t) {
  const a = normalizeHex(hexA).slice(1);
  const b = normalizeHex(hexB).slice(1);
  const out = [0, 2, 4].map((i) => {
    const av = parseInt(a.slice(i, i + 2), 16);
    const bv = parseInt(b.slice(i, i + 2), 16);
    const mv = Math.round(av + (bv - av) * t);
    return Math.max(0, Math.min(255, mv)).toString(16).padStart(2, '0');
  }).join('');
  return '#' + out.toUpperCase();
}

function lighten(hex, amount) {
  return mixHex(hex, '#FFFFFF', amount);
}

module.exports = { normalizeHex, mixHex, lighten };

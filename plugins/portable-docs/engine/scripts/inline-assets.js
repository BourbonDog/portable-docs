'use strict';
/**
 * inline-assets.js — inline LOCAL image references as base64 data: URIs so the
 * output HTML is truly self-contained. Remote (http/https) and existing data:
 * refs are left untouched; a missing/unreadable local file warns and is left
 * as-is (Phase 0's onError fallback still covers broken remote images).
 */
const fs = require('fs');
const path = require('path');

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
const SIZE_WARN = 2 * 1024 * 1024; // warn (don't block) above ~2MB

function isRemoteOrData(v) {
  return /^(https?:)?\/\//i.test(v) || /^data:/i.test(v);
}

function inlineRef(ref, baseDir) {
  if (typeof ref !== 'string' || !ref || isRemoteOrData(ref)) return ref;
  const abs = path.isAbsolute(ref) ? ref : path.resolve(baseDir || '.', ref);
  if (!fs.existsSync(abs)) {
    console.warn(`inline-assets: local image not found, leaving as-is: ${ref}`);
    return ref;
  }
  try {
    const buf = fs.readFileSync(abs);
    if (buf.length > SIZE_WARN) {
      console.warn(`inline-assets: large image inlined (${(buf.length / 1048576).toFixed(1)}MB): ${ref}`);
    }
    const mime = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (e) {
    console.warn(`inline-assets: failed to read ${ref}: ${e.message}`);
    return ref;
  }
}

// Recursively replace `type:'image'` block src values in place.
function walk(node, baseDir) {
  if (Array.isArray(node)) { node.forEach((n) => walk(n, baseDir)); return; }
  if (node && typeof node === 'object') {
    if (node.type === 'image' && typeof node.src === 'string') {
      node.src = inlineRef(node.src, baseDir);
    }
    for (const k of Object.keys(node)) {
      if (k !== 'src') walk(node[k], baseDir);
    }
  }
}

function inlineLocalImages(content, baseDir) {
  if (!content || typeof content !== 'object') return content;
  if (content.header && typeof content.header === 'object') {
    if (content.header.headshot) content.header.headshot = inlineRef(content.header.headshot, baseDir);
    if (content.header.logo) content.header.logo = inlineRef(content.header.logo, baseDir);
  }
  walk(content, baseDir);
  return content;
}

module.exports = { inlineLocalImages, inlineRef };

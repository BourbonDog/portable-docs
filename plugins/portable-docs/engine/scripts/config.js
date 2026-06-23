'use strict';
/**
 * config.js — portable-docs brand-kit config loader.
 *
 * Discovers portable-docs.config.json (walk-up from the input file's dir, then
 * ~/.portable-docs.config.json), selects a named brand preset, and resolves
 * effective settings with precedence: flag > env > config > built-in default.
 * Zero deps (Node built-ins only). loadConfig does I/O; the rest are pure.
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CONFIG_NAME = 'portable-docs.config.json';

// Deep-merge plain objects (b over a). Nested plain objects merge; arrays and
// scalars from b replace a.
function deepMerge(a, b) {
  if (!b) return a;
  if (!a) return b;
  const out = { ...a };
  for (const k of Object.keys(b)) {
    const av = a[k], bv = b[k];
    const bothObj = bv && typeof bv === 'object' && !Array.isArray(bv) &&
                    av && typeof av === 'object' && !Array.isArray(av);
    out[k] = bothObj ? deepMerge(av, bv) : bv;
  }
  return out;
}

// Expand a leading ~ to the user's home directory.
function expandHome(p) {
  if (typeof p !== 'string') return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(os.homedir(), p.slice(2));
  return p;
}

// Nearest portable-docs.config.json walking up from startDir to the FS root.
function findConfigUp(startDir) {
  let dir = path.resolve(startDir);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, CONFIG_NAME);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * @param {{startDir?:string, explicitPath?:string|null, noConfig?:boolean}} o
 * @returns {{config: object|null, path: string|null}}
 */
function loadConfig({ startDir = process.cwd(), explicitPath = null, noConfig = false } = {}) {
  if (noConfig || process.env.PD_NO_CONFIG === '1') return { config: null, path: null };

  let file = null;
  if (explicitPath) {
    file = path.resolve(explicitPath);
    if (!fs.existsSync(file)) throw new Error(`config: --config file not found: ${file}`);
  } else {
    file = findConfigUp(startDir);
    if (!file) {
      const global = path.join(os.homedir(), '.' + CONFIG_NAME); // ~/.portable-docs.config.json
      if (fs.existsSync(global)) file = global;
    }
  }
  if (!file) return { config: null, path: null };

  let raw;
  try { raw = JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch (e) { throw new Error(`config: invalid JSON in ${file}: ${e.message}`); }
  return { config: raw, path: file };
}

/**
 * Select the effective brand block: deep-merge the named preset over the
 * top-level defaults (excluding the `brands` map). Throws if a requested brand
 * name is absent.
 */
function selectBrand(config, brandName) {
  if (!config) return null;
  const { brands, ...topDefaults } = config;
  if (!brandName) return topDefaults;
  if (!brands || !brands[brandName]) {
    const available = brands ? Object.keys(brands).join(', ') : '(none)';
    throw new Error(`config: unknown brand "${brandName}". Available: ${available}`);
  }
  return deepMerge(topDefaults, brands[brandName]);
}

// Resolve one setting with precedence flag > env > config > builtin.
// '' (empty string) is treated as "unset" for env/config so blanks fall through.
function pick(flag, env, cfgVal, builtin) {
  if (flag !== undefined && flag !== null && flag !== '') return flag;
  if (env !== undefined && env !== null && env !== '') return env;
  if (cfgVal !== undefined && cfgVal !== null && cfgVal !== '') return cfgVal;
  return builtin;
}

// config.identity keys → header object keys (extractHeader shape).
const IDENTITY_TO_HEADER = {
  from: 'from', email: 'fromEmail', linkedin: 'linkedin', github: 'github',
  headshot: 'headshot', logo: 'logo', brand: 'brand', brandsub: 'brandSub',
  footer: 'footer',
};

const BLANK_HEADER = {
  from: '', fromEmail: '', linkedin: '', github: '', headshot: '',
  date: '', title: '', subtitle: '', eyebrow: '', brand: '', brandSub: '',
  logo: '', footer: '',
};

function isRemoteOrAbsolute(v) {
  return /^(https?:|data:)/i.test(v) || path.isAbsolute(v);
}

/**
 * Fill blank header fields from config identity (header always wins per-field).
 * Synthesizes a header from identity + fallbackTitle when header is null.
 * Relative headshot/logo paths are resolved against assetBaseDir.
 */
function applyIdentity(header, identity, { fallbackTitle = '', assetBaseDir = null } = {}) {
  if (!identity) return header;
  const h = header ? { ...header } : { ...BLANK_HEADER, title: fallbackTitle };
  for (const [ik, hk] of Object.entries(IDENTITY_TO_HEADER)) {
    let val = identity[ik];
    if (val == null || val === '') continue;
    if (h[hk] != null && h[hk] !== '') continue; // header wins
    if ((hk === 'headshot' || hk === 'logo') && assetBaseDir && !isRemoteOrAbsolute(val)) {
      val = expandHome(val);
      val = path.posix.join(assetBaseDir, val);
    } else if (hk === 'headshot' || hk === 'logo') {
      val = expandHome(val);
    }
    h[hk] = val;
  }
  return h;
}

module.exports = { CONFIG_NAME, deepMerge, expandHome, findConfigUp, loadConfig,
                   selectBrand, pick, applyIdentity, IDENTITY_TO_HEADER };

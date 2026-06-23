'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cfg = require('../scripts/config.js');

function tmpDir(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

test('deepMerge merges nested objects, b wins on scalars', () => {
  const a = { theme: 'editorial', identity: { from: 'A', brand: 'X' } };
  const b = { accent: '#0A5', identity: { brand: 'Y' } };
  assert.deepStrictEqual(cfg.deepMerge(a, b), {
    theme: 'editorial', accent: '#0A5', identity: { from: 'A', brand: 'Y' },
  });
});

test('expandHome expands a leading ~', () => {
  assert.strictEqual(cfg.expandHome('~'), os.homedir());
  assert.strictEqual(cfg.expandHome('~/x'), path.join(os.homedir(), 'x'));
  assert.strictEqual(cfg.expandHome('/abs'), '/abs');
});

test('findConfigUp finds the nearest config walking up', () => {
  const root = tmpDir('pd-cfg-');
  const nested = path.join(root, 'a', 'b');
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(root, cfg.CONFIG_NAME), '{}');
  assert.strictEqual(cfg.findConfigUp(nested), path.join(root, cfg.CONFIG_NAME));
  fs.rmSync(root, { recursive: true, force: true });
});

test('loadConfig: --no-config and PD_NO_CONFIG short-circuit', () => {
  assert.deepStrictEqual(cfg.loadConfig({ noConfig: true }), { config: null, path: null });
  const prev = process.env.PD_NO_CONFIG;
  process.env.PD_NO_CONFIG = '1';
  try { assert.deepStrictEqual(cfg.loadConfig({}), { config: null, path: null }); }
  finally { if (prev !== undefined) process.env.PD_NO_CONFIG = prev; else delete process.env.PD_NO_CONFIG; }
});

test('loadConfig: explicitPath loads it; missing throws', () => {
  const dir = tmpDir('pd-cfg-');
  const file = path.join(dir, cfg.CONFIG_NAME);
  fs.writeFileSync(file, JSON.stringify({ theme: 'dark' }));
  assert.deepStrictEqual(cfg.loadConfig({ explicitPath: file }).config, { theme: 'dark' });
  assert.throws(() => cfg.loadConfig({ explicitPath: path.join(dir, 'nope.json') }), /not found/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadConfig: malformed JSON throws with the path', () => {
  const dir = tmpDir('pd-cfg-');
  const file = path.join(dir, cfg.CONFIG_NAME);
  fs.writeFileSync(file, '{ not json');
  assert.throws(() => cfg.loadConfig({ explicitPath: file }), /invalid JSON/);
  fs.rmSync(dir, { recursive: true, force: true });
});

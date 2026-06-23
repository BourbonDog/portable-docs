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

test('selectBrand merges a named preset over top-level defaults', () => {
  const config = {
    theme: 'editorial', accent: '#111', identity: { from: 'Chris', brand: 'Base' },
    brands: { work: { theme: 'brand', identity: { brand: 'Acme' } } },
  };
  assert.deepStrictEqual(cfg.selectBrand(config, null), {
    theme: 'editorial', accent: '#111', identity: { from: 'Chris', brand: 'Base' },
  });
  assert.deepStrictEqual(cfg.selectBrand(config, 'work'), {
    theme: 'brand', accent: '#111', identity: { from: 'Chris', brand: 'Acme' },
  });
  assert.throws(() => cfg.selectBrand(config, 'nope'), /unknown brand "nope"/);
  assert.strictEqual(cfg.selectBrand(null, 'work'), null);
});

test('pick applies flag > env > config > builtin', () => {
  assert.strictEqual(cfg.pick('F', 'E', 'C', 'B'), 'F');
  assert.strictEqual(cfg.pick(null, 'E', 'C', 'B'), 'E');
  assert.strictEqual(cfg.pick(null, '', 'C', 'B'), 'C');
  assert.strictEqual(cfg.pick(null, null, null, 'B'), 'B');
});

test('applyIdentity fills blank header fields; header wins per-field', () => {
  const header = { title: 'Doc', from: '', fromEmail: 'doc@x.com', brand: '' };
  const identity = { from: 'Chris', email: 'cfg@x.com', brand: 'Acme', brandsub: 'Team' };
  const out = cfg.applyIdentity(header, identity, {});
  assert.strictEqual(out.from, 'Chris');         // was blank → filled
  assert.strictEqual(out.fromEmail, 'doc@x.com'); // header wins
  assert.strictEqual(out.brand, 'Acme');          // was blank → filled
  assert.strictEqual(out.brandSub, 'Team');       // brandsub → brandSub
});

test('applyIdentity synthesizes a header when none exists', () => {
  const out = cfg.applyIdentity(null, { from: 'Chris', brand: 'Acme' }, { fallbackTitle: 'T' });
  assert.strictEqual(out.title, 'T');
  assert.strictEqual(out.from, 'Chris');
  assert.strictEqual(out.brand, 'Acme');
});

test('applyIdentity absolutizes relative asset paths against assetBaseDir', () => {
  const base = os.tmpdir();
  const out = cfg.applyIdentity({ title: 'T', logo: '' }, { logo: './a/logo.png' }, { assetBaseDir: base });
  assert.strictEqual(out.logo, path.resolve(base, './a/logo.png'));
  const remote = cfg.applyIdentity({ title: 'T', logo: '' }, { logo: 'https://x/y.png' }, { assetBaseDir: base });
  assert.strictEqual(remote.logo, 'https://x/y.png'); // remote left as-is
});

test('build inherits identity from config when @header omits fields', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-cfgbuild-'));
  fs.writeFileSync(path.join(dir, cfg.CONFIG_NAME), JSON.stringify({
    theme: 'editorial',
    identity: { from: 'Config Author', brand: 'ConfigBrand' },
  }));
  const md = [
    '<!-- @header -->',
    '<!-- @title value="Doc From Config" -->',
    '<!-- /@header -->',
    '',
    '## 1. Intro',
    '',
    'Body text.',
  ].join('\n');
  const mdPath = path.join(dir, 'doc.md');
  const outHtml = path.join(dir, 'out.html');
  fs.writeFileSync(mdPath, md);

  const { main } = require('../scripts/build-doc.js');
  const origArgv = process.argv;
  try {
    process.argv = ['node', 'build-doc.js', '--input', mdPath, '--out', outHtml, '--no-open'];
    await main();
  } finally { process.argv = origArgv; }

  const html = fs.readFileSync(outHtml, 'utf8');
  assert.ok(html.includes('Config Author'), 'identity.from inherited from config');
  assert.ok(html.includes('ConfigBrand'), 'identity.brand inherited from config');
  fs.rmSync(dir, { recursive: true, force: true });
});

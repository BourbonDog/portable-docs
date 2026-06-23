const test=require('node:test');const assert=require('node:assert');
const {slugify}=require('../scripts/slug.js');
const {parseArgs, resolveOutPath}=require('../scripts/build-doc.js');
const os=require('os'); const path=require('path');
test('slugify normalizes to a filename-safe slug',()=>{
  assert.equal(slugify("The North Shore's Coach"),'the-north-shore-s-coach');
  assert.equal(slugify('   '),'document');
});
test('parseArgs reads flags', () => {
  const a = parseArgs(['--input','x.md','--slides','--no-open','--title','Hi']);
  assert.equal(a.input,'x.md'); assert.equal(a.slides,true); assert.equal(a.open,false); assert.equal(a.title,'Hi');
});
test('resolveOutPath honors --out', () => {
  assert.equal(resolveOutPath({out:'/tmp/x.html',input:'a.md'}),'/tmp/x.html');
});
test('resolveOutPath defaults under ~/Documents/portable-docs', () => {
  const p = resolveOutPath({title:'My Doc', input:'a.md'}).replace(/\\/g,'/');
  assert.ok(p.endsWith('/Documents/portable-docs/my-doc.html'), p);
});

// ── Finding 1: PD_THEME must be restored even when build() throws ────────────
// Strategy: inject a throwing stub into the require cache for build.js so that
// main() throws inside its try block (AFTER PD_THEME is mutated, BEFORE the
// old mid-try restore point). Assert PD_THEME returns to its pre-call value.
test('parseArgs recognizes --pdf and --png', () => {
  const { parseArgs } = require('../scripts/build-doc.js');
  const a = parseArgs(['--input', 'x.md', '--pdf', '--png']);
  assert.strictEqual(a.pdf, true);
  assert.strictEqual(a.png, true);
  const b = parseArgs(['--input', 'x.md']);
  assert.strictEqual(b.pdf, false);
  assert.strictEqual(b.png, false);
});

test('build-doc: PD_THEME is restored in finally even when build() throws', async () => {
  const ENGINE = path.join(__dirname, '..');
  const FIXTURE = path.join(__dirname, 'fixtures', 'sample.md');
  const buildJsPath = path.resolve(path.join(ENGINE, 'src/utils/build.js'));

  // Record the real cached module (may be undefined if not yet required)
  const realModule = require.cache[buildJsPath];

  // Inject a stub that throws so main()'s try block fails after PD_THEME is set
  require.cache[buildJsPath] = {
    id: buildJsPath, filename: buildJsPath, loaded: true,
    exports: { build: () => { throw new Error('stub: forced build failure'); } },
  };

  const sentinel = '__pd_theme_sentinel_' + Date.now() + '__';
  const origTheme = process.env.PD_THEME;
  process.env.PD_THEME = sentinel;   // set BEFORE main() — main()'s finally must restore this

  const origArgv = process.argv;
  process.argv = ['node', 'build-doc.js', '--input', FIXTURE, '--no-open',
                  '--out', path.join(os.tmpdir(), 'pd-throw-test.html')];

  const { main } = require(path.join(ENGINE, 'scripts/build-doc.js'));

  let threw = false;
  let themeAfterThrow;
  try {
    await main();
  } catch (_) {
    threw = true;
    // Capture BEFORE this test's own cleanup so we see what main()'s finally left
    themeAfterThrow = process.env.PD_THEME;
  } finally {
    process.argv = origArgv;
    if (realModule) require.cache[buildJsPath] = realModule;
    else delete require.cache[buildJsPath];
    if (origTheme !== undefined) process.env.PD_THEME = origTheme;
    else delete process.env.PD_THEME;
  }

  assert.ok(threw, 'main() must propagate the throw from build()');
  // After main()'s finally ran, PD_THEME must equal sentinel (the pre-call value).
  // Before fix: main() only restored PD_THEME mid-try, so a throw left it mutated.
  // After fix:  main()'s finally always restores it — themeAfterThrow === sentinel.
  assert.strictEqual(themeAfterThrow, sentinel,
    'PD_THEME must be restored to pre-call value by main()\'s finally block, even on throw');
});

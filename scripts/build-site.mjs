import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync, mkdirSync, readFileSync, writeFileSync,
  copyFileSync, rmSync, existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
export const REPO_SLUG = 'BourbonDog/portable-docs';
export const BRANCH = 'main';

const PLUGIN = path.join(REPO_ROOT, 'plugins', 'portable-docs');
const DOCS = path.join(PLUGIN, 'docs');
const REFS = path.join(PLUGIN, 'references');

const toPosix = (p) => p.split(path.sep).join('/');
const repoRel = (abs) => toPosix(path.relative(REPO_ROOT, abs));

export function buildManifest() {
  const entries = [];
  for (const f of readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
    const base = path.basename(f, '.md');
    entries.push({
      srcAbs: path.join(DOCS, f),
      srcRel: repoRel(path.join(DOCS, f)),
      outRel: base === 'README' ? 'index.html' : `${base}.html`,
    });
  }
  for (const f of readdirSync(REFS).filter((f) => f.endsWith('.md'))) {
    const base = path.basename(f, '.md');
    entries.push({
      srcAbs: path.join(REFS, f),
      srcRel: repoRel(path.join(REFS, f)),
      outRel: `references/${base}.html`,
    });
  }
  return entries;
}

// Pure: rewrite `.md` cross-links in one page's markdown.
export function rewriteLinks(md, sourceRel, manifest) {
  const byRepoRel = new Map(manifest.map((e) => [e.srcRel, e.outRel]));
  const thisOut = byRepoRel.get(sourceRel);
  const fromDir = path.posix.dirname(thisOut);
  const srcDir = path.posix.dirname(sourceRel);
  return md.replace(/\]\(([^)\s#]+?\.md)(#[^)\s]*)?\)/g, (full, target, anchor = '') => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return full; // has URL scheme -> skip
    const resolved = path.posix.normalize(path.posix.join(srcDir, target));
    const out = byRepoRel.get(resolved);
    if (out) {
      let rel = path.posix.relative(fromDir, out);
      if (!rel) rel = path.posix.basename(out);
      return `](${rel}${anchor})`;
    }
    return `](https://github.com/${REPO_SLUG}/blob/${BRANCH}/${resolved}${anchor})`;
  });
}

const ENGINE = path.join(PLUGIN, 'engine', 'scripts', 'build-doc.js');
const SITE = path.join(REPO_ROOT, 'site');
const ASSETS = path.join(PLUGIN, 'assets');

function buildPage(entry, manifest, tmpDir, index) {
  const md = readFileSync(entry.srcAbs, 'utf8');
  const rewritten = rewriteLinks(md, entry.srcRel, manifest);
  const tmpMd = path.join(tmpDir, `${index}-${path.basename(entry.srcAbs)}`);
  writeFileSync(tmpMd, rewritten);
  const outAbs = path.join(SITE, entry.outRel);
  mkdirSync(path.dirname(outAbs), { recursive: true });
  try {
    execFileSync(
      'node',
      [ENGINE, '--input', tmpMd, '--out', outAbs, '--no-open', '--no-config', '--style', 'article'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (err) {
    process.stderr.write(`\nEngine failed for ${entry.srcRel}:\n`);
    if (err.stdout) process.stderr.write(err.stdout);
    if (err.stderr) process.stderr.write(err.stderr);
    throw err;
  }
  if (!existsSync(outAbs)) throw new Error(`Engine produced no output for ${entry.outRel}`);
}

function main() {
  const manifest = buildManifest();
  rmSync(SITE, { recursive: true, force: true });
  mkdirSync(SITE, { recursive: true });
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'pd-site-'));
  manifest.forEach((entry, i) => buildPage(entry, manifest, tmpDir, i));
  for (const asset of ['favicon.ico', 'icon-32.png', 'icon-192.png']) {
    const src = path.join(ASSETS, asset);
    if (existsSync(src)) copyFileSync(src, path.join(SITE, asset));
  }
  if (!existsSync(path.join(SITE, 'index.html'))) throw new Error('index.html was not generated');
  console.log(`Built ${manifest.length} pages into ${SITE}`);
}

// Run only when invoked directly (not when imported by the test file).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

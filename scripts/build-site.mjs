import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

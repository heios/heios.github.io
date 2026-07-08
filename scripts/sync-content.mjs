// Copies the ai-commit-attribution submodule Markdown into the Starlight docs
// tree, injecting the `title` frontmatter Starlight requires and rewriting every
// internal `.md#anchor` cross-link to an absolute site URL. The source files in
// research/ai-commit-attribution/ (the submodule) are never modified — they stay
// canonical and github.com-readable. The generated copies under
// src/content/docs/research/2026-07-08/ are gitignored build output.
import {
  readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SUBMODULE = join(ROOT, 'research', 'ai-commit-attribution');
const ENTRY_URL = '/research/2026-07-08/ai-commit-attribution';
const OUT = join(ROOT, 'src', 'content', 'docs', 'research', '2026-07-08', 'ai-commit-attribution');

// The docs that make up the entry, in submodule-relative → output-relative form.
function entryFiles() {
  const files = [
    { srcRel: 'REPORT.md', outRel: 'index.md', url: `${ENTRY_URL}/` },
    { srcRel: 'GLOSSARY.md', outRel: 'glossary.md', url: `${ENTRY_URL}/glossary/` },
  ];
  const sources = readdirSync(join(SUBMODULE, 'sources'))
    .filter((n) => n.endsWith('.md'))
    .sort();
  for (const name of sources) {
    const base = name.replace(/\.md$/, '');
    files.push({
      srcRel: `sources/${name}`,
      outRel: `sources/${name}`,
      url: `${ENTRY_URL}/sources/${base}/`,
    });
  }
  return files;
}

// Map a submodule-relative doc path to its site URL (null = not published).
function docUrl(relPath) {
  const p = relPath.toLowerCase();
  if (p === 'report.md') return `${ENTRY_URL}/`;
  if (p === 'glossary.md') return `${ENTRY_URL}/glossary/`;
  const m = relPath.match(/^sources\/(.+)\.md$/i);
  if (m) return `${ENTRY_URL}/sources/${m[1]}/`;
  return null; // README.md or anything else stays as-authored
}

// Rewrite ](target.md#anchor "title") → ](/abs/url/#anchor "title").
// Same-page anchors ](#x), external http(s) links, and links to non-published
// docs are left untouched. The optional title attribute (tooltip) is preserved.
function rewriteLinks(content, srcRel) {
  const dir = posix.dirname(srcRel);
  return content.replace(
    /\]\((\S+?\.md)(#[^)\s]*)?(\s+"[^"]*")?\)/g,
    (whole, target, anchor = '', title = '') => {
      if (/^https?:/i.test(target)) return whole;
      const base = dir === '.' ? '' : dir;
      const resolved = posix.normalize(posix.join(base, target));
      const url = docUrl(resolved);
      if (!url) return whole;
      return `](${url}${anchor || ''}${title || ''})`;
    },
  );
}

// Pull the leading H1 up into frontmatter (Starlight renders `title` as the page
// heading, so keeping the H1 too would double it). Strip backticks — the title is
// plain text, not Markdown.
function deriveTitleAndBody(raw) {
  const lines = raw.split('\n');
  let title = '';
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.*\S)\s*$/);
    if (m) {
      title = m[1];
      idx = i;
      break;
    }
    if (lines[i].trim() !== '') break;
  }
  title = title.replace(/`/g, '').trim();
  let body = raw;
  if (idx >= 0) {
    lines.splice(idx, 1);
    body = lines.join('\n').replace(/^\n+/, '');
  }
  return { title, body };
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let count = 0;
for (const f of entryFiles()) {
  const raw = readFileSync(join(SUBMODULE, f.srcRel), 'utf8');
  const { title, body } = deriveTitleAndBody(raw);
  if (!title) throw new Error(`No H1 found in ${f.srcRel}; cannot derive a title.`);
  const out = `---\ntitle: ${JSON.stringify(title)}\n---\n\n${rewriteLinks(body, f.srcRel)}`;
  const outPath = join(OUT, f.outRel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, out);
  count += 1;
  console.log(`  ${f.srcRel}  ->  ${f.url}   (“${title}”)`);
}
console.log(`sync-content: wrote ${count} pages to ${OUT.replace(ROOT + '/', '')}`);

/**
 * House-style check for blog posts. Run before publishing:
 *     node scripts/check-posts.mjs            (every post)
 *     node scripts/check-posts.mjs my-post.md (one post)
 *
 * Fails on em or en dashes and banned filler words.
 * Warns on sentences over 25 words so they can be split.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'content/posts');

const BANNED = [
  'delve', 'leverage', 'seamless', 'seamlessly', 'robust', 'game-changer', 'game changer',
  'unlock', 'elevate', 'utilise', 'utilize', 'facilitate', 'commence', 'landscape',
  "in today's", 'fast-paced', 'it is important to note', "it's important to note",
  'in conclusion', 'furthermore', 'moreover', 'embark', 'tapestry', 'paramount',
  'cutting-edge', 'revolutionise', 'revolutionize', 'holistic', 'synergy', 'empower',
];
const MAX_WORDS = 25;

const args = process.argv.slice(2);
const files = args.length ? args.map((f) => path.basename(f)) : (await readdir(DIR)).filter((f) => f.endsWith('.md'));

let errors = 0;
let warnings = 0;
for (const file of files) {
  const raw = await readFile(path.join(DIR, file), 'utf8');
  // Only check what readers see: drop front matter, code, HTML tags and JSON-LD.
  const body = raw
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  raw.split('\n').forEach((line, i) => {
    if (/[—–]/.test(line)) { console.log(`ERROR ${file}:${i + 1} em or en dash`); errors++; }
  });

  const lower = body.toLowerCase();
  for (const w of BANNED) {
    const re = new RegExp(`(^|[^a-z])${w.replace(/[-]/g, '[- ]')}([^a-z]|$)`, 'g');
    const n = (lower.match(re) || []).length;
    if (n) { console.log(`ERROR ${file} banned word "${w}" x${n}`); errors++; }
  }

  const prose = body
    .split('\n')
    .filter((l) => !/^\s*(\||#|---)/.test(l))
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '');
  for (const s of prose.split(/(?<=[.!?])\s+/)) {
    const words = s.trim().split(/\s+/).filter(Boolean).length;
    if (words > MAX_WORDS) { console.log(`WARN  ${file} ${words}-word sentence: "${s.trim().slice(0, 90)}..."`); warnings++; }
  }
}
console.log(`\n${files.length} post(s) checked: ${errors} error(s), ${warnings} long sentence(s).`);
process.exit(errors ? 1 : 0);

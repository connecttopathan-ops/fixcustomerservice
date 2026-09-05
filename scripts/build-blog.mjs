/**
 * Builds the blog, then rewrites everything that has to list the posts:
 * the sitemap, the homepage "Latest writing" block, and llms.txt.
 *
 * Output is committed, so serving the site never needs this to have run.
 * Run it after adding or editing anything in content/posts/.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { loadShell, renderPage, esc, SITE } from './lib/shell.mjs';
import { AUDIT } from './build-audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'content/posts');
const BLOG_DIR = path.join(ROOT, 'public/blog');
const MAX_DESC = 155;

const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

/** Minimal front matter reader. Enough for the fields we define, no dependency. */
function parseFrontMatter(raw, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) {
    fail(file, 'no front matter block');
    return null;
  }
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const i = line.indexOf(':');
    if (i === -1) { fail(file, `cannot parse front matter line: ${line}`); continue; }
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (/^\[.*\]$/.test(value)) {
      value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    data[key] = value;
  }
  return { data, body: m[2] };
}

function validate(post, file, seen) {
  const need = ['title', 'description', 'slug', 'date'];
  for (const k of need) if (!post[k]) fail(file, `missing required front matter: ${k}`);

  if (post.description && post.description.length > MAX_DESC) {
    fail(file, `description is ${post.description.length} characters, limit is ${MAX_DESC}`);
  }
  if (post.slug) {
    if (seen.has(post.slug)) fail(file, `duplicate slug "${post.slug}", also used by ${seen.get(post.slug)}`);
    else seen.set(post.slug, file);
    if (!/^[a-z0-9-]+$/.test(post.slug)) fail(file, `slug "${post.slug}" must be lowercase letters, digits and hyphens`);
  }
  for (const k of ['date', 'updated']) {
    if (post[k] && !/^\d{4}-\d{2}-\d{2}$/.test(post[k])) fail(file, `${k} "${post[k]}" must be YYYY-MM-DD`);
  }
  const SUFFIX = ' | Fix Customer Service';
  const title = `${post.title}${SUFFIX}`;
  if (title.length > 60) {
    fail(file, `title is ${title.length} characters once "${SUFFIX.trim()}" is appended, limit is 60. ` +
               `That leaves ${60 - SUFFIX.length} characters for the title itself; this one is ${post.title.length}.`);
  }
}

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

async function loadPosts() {
  let files;
  try {
    files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  const seen = new Map();
  const posts = [];
  for (const file of files.sort()) {
    const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
    const parsed = parseFrontMatter(raw, file);
    if (!parsed) continue;
    const post = { ...parsed.data, file, markdown: parsed.body };
    validate(post, file, seen);
    post.updated = post.updated || post.date;
    post.readingMinutes = Number(post.readingMinutes) || Math.max(1, Math.round(parsed.body.split(/\s+/).length / 200));
    post.tags = Array.isArray(post.tags) ? post.tags : [];
    posts.push(post);
  }
  // newest first
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

function postHead(post) {
  const url = `${SITE}/blog/${post.slug}`;
  const image = post.image ? `${SITE}/${post.image}` : `${SITE}/og-image.jpg`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    author: { '@id': `${SITE}/#abdullah` },
    publisher: { '@id': `${SITE}/#business` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image,
    url,
  };
  return `<meta property="og:type" content="article">
<meta property="og:site_name" content="Fix Customer Service">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="article:published_time" content="${post.date}">
<meta property="article:modified_time" content="${post.updated}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(post.description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
${BLOG_CSS}`;
}

const BLOG_CSS = `<style>
  .post{max-width:var(--narrow);margin:0 auto;padding:64px 26px 0}
  .post-meta{font-size:.82rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--grey);margin:0 0 20px}
  .post h1{margin:0 0 22px}
  .post-lead{font-size:1.22rem;color:var(--grey);line-height:1.55;margin:0}
  .post-body{margin-top:44px;font-size:18px;line-height:1.65;color:var(--ink)}
  .post-body > *:first-child{margin-top:0}
  .post-body p{margin:0 0 24px}
  .post-body h2{font-weight:800;font-size:1.72rem;letter-spacing:-.03em;line-height:1.1;margin:52px 0 16px}
  .post-body h3{font-weight:700;font-size:1.24rem;letter-spacing:-.02em;margin:38px 0 12px}
  .post-body ul,.post-body ol{margin:0 0 24px;padding-left:22px}
  .post-body li{margin:0 0 10px}
  .post-body a{color:var(--ink);font-weight:700;text-decoration:none;border-bottom:2px solid var(--marker)}
  .post-body a:hover{background:var(--marker)}
  .post-body blockquote{margin:32px 0;padding:4px 0 4px 22px;border-left:4px solid var(--marker)}
  .post-body blockquote p{margin:0;font-size:1.1rem;color:var(--grey)}
  .post-body code{background:var(--paper);border-radius:6px;padding:.14em .38em;font-size:.92em}
  .post-body pre{background:var(--paper);border-radius:6px;padding:18px 20px;overflow-x:auto;margin:0 0 24px}
  .post-body pre code{background:none;padding:0;font-size:.92rem;line-height:1.55}
  .post-body img{max-width:100%;height:auto;border-radius:6px}
  .post-body hr{border:0;border-top:1px solid var(--rule);margin:40px 0}
  .post-nav{max-width:var(--narrow);margin:0 auto;padding:0 26px 8px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .post-nav a{display:block;text-decoration:none;color:var(--ink);border-top:2px solid var(--ink);padding-top:14px}
  .post-nav span{display:block;font-size:.82rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--grey);margin-bottom:6px}
  .post-nav b{font-weight:700;font-size:1.02rem}
  .post-nav a:hover b{border-bottom:2px solid var(--marker)}
  .post-nav .next{text-align:right}
  .post-back{max-width:var(--narrow);margin:0 auto;padding:38px 26px 0}
  .post-back a{font-weight:700;color:var(--ink);text-decoration:none;border-bottom:3px solid var(--mark)}
  .blog-list{margin-top:46px;border-top:1px solid var(--rule)}
  .blog-list article{border-bottom:1px solid var(--rule);padding:26px 0}
  .blog-list h2{font-size:1.5rem;letter-spacing:-.02em;line-height:1.15;margin:0}
  .blog-list h2 a{color:var(--ink);text-decoration:none}
  .blog-list h2 a:hover{border-bottom:3px solid var(--mark)}
  .blog-list p{color:var(--grey);margin:10px 0 0;font-size:1.02rem;max-width:46em}
  .blog-list .when{font-size:.82rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--grey);margin:0 0 9px}
  @media (max-width:820px){
    .post{padding-top:40px}
    .post-body{font-size:17px}
    .post-body h2{font-size:1.45rem;margin-top:40px}
    .post-nav{grid-template-columns:1fr}
    .post-nav .next{text-align:left}
  }
</style>`;

function postBody(post, html, prev, next) {
  const nav = [
    prev ? `<a class="prev" href="/blog/${prev.slug}"><span>Previous</span><b>${esc(prev.title)}</b></a>` : '<span></span>',
    next ? `<a class="next" href="/blog/${next.slug}"><span>Next</span><b>${esc(next.title)}</b></a>` : '<span></span>',
  ].join('\n    ');

  return `
<article class="post">
  <p class="post-meta"><time datetime="${post.date}">${fmtDate(post.date)}</time> &middot; ${post.readingMinutes} min read</p>
  <h1>${esc(post.title)}</h1>
  <p class="post-lead">${esc(post.description)}</p>
  <div class="post-body">
${html}
  </div>
</article>

<div class="post-back"><a href="/blog">All writing</a></div>

<div class="midcta" style="margin-top:56px">
  <div class="wrap">
    <h2>Worth thirty minutes to find out?</h2>
    <p>You'll leave the call knowing your three biggest problems and roughly what they're costing. No slides, no chasing afterwards.</p>
    <div class="acts">
      <a class="btn" href="/#talk">Book a free 30-minute call</a>
      <a class="wa2" href="/customer-service-audit">Or read about the audit</a>
    </div>
  </div>
</div>

<nav class="post-nav" style="margin-top:56px" aria-label="More posts">
    ${nav}
</nav>
`;
}

function indexBody(posts) {
  return `
<section>
  <div class="wrap">
    <p class="eyebrow">Writing</p>
    <h1>Notes on running customer service.</h1>
    <p class="lead">What we keep seeing across support operations, written up plainly. No theory that has not survived a real queue.</p>
    <div class="blog-list">
      ${posts
        .map(
          (p) => `<article>
        <p class="when"><time datetime="${p.date}">${fmtDate(p.date)}</time> &middot; ${p.readingMinutes} min read</p>
        <h2><a href="/blog/${p.slug}">${esc(p.title)}</a></h2>
        <p>${esc(p.description)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<div class="midcta" style="margin-top:64px">
  <div class="wrap">
    <h2>Rather talk about your own numbers?</h2>
    <p>Thirty minutes, free, and you'll leave knowing your three biggest problems and roughly what they're costing.</p>
    <div class="acts">
      <a class="btn" href="/#talk">Book a free 30-minute call</a>
      <a class="wa2" href="/customer-service-audit">Or read about the audit</a>
    </div>
  </div>
</div>
`;
}

/* ---------------------------------------------------------------- outputs */

async function writeSitemap(posts) {
  const urls = [
    { loc: `${SITE}/`, lastmod: today(), changefreq: 'monthly', priority: '1.0' },
    { loc: `${SITE}/${AUDIT.slug}`, lastmod: AUDIT.lastmod, changefreq: 'monthly', priority: '0.9' },
    ...(posts.length ? [{ loc: `${SITE}/blog`, lastmod: posts[0].updated, changefreq: 'weekly', priority: '0.7' }] : []),
    ...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.updated, changefreq: 'yearly', priority: '0.6' })),
    { loc: `${SITE}/privacy`, lastmod: '2026-09-04', changefreq: 'yearly', priority: '0.2' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
  await writeFile(path.join(ROOT, 'public/sitemap.xml'), xml);
}

const today = () => new Date().toISOString().slice(0, 10);

async function writeHomepageBlock(posts) {
  const file = path.join(ROOT, 'public/index.html');
  let html = await readFile(file, 'utf8');
  const START = '<!-- BLOG:START -->';
  const END = '<!-- BLOG:END -->';
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a === -1 || b === -1) throw new Error('index.html is missing the BLOG:START / BLOG:END markers');

  // No posts means no section at all, never an empty heading.
  // Questions, the section immediately above, is .paper. White here keeps the
  // new block from merging into it. (The homepage already has several
  // same-background adjacencies of its own; this adds none.)
  const block = posts.length
    ? `
<section>
  <div class="wrap">
    <p class="eyebrow"><span class="sno">16</span> &middot; Latest writing</p>
    <h2>Notes on running customer service.</h2>
    <div class="three latest">
      ${posts
        .slice(0, 3)
        .map(
          (p) => `<div>
        <p class="when"><time datetime="${p.date}">${fmtDate(p.date)}</time></p>
        <h3><a href="/blog/${p.slug}">${esc(p.title)}</a></h3>
        <p>${esc(p.description)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
    <p class="check-note" style="margin-top:38px"><a href="/blog">Read everything&nbsp;&rarr;</a></p>
  </div>
</section>
`
    : '\n';

  html = html.slice(0, a + START.length) + block + html.slice(b);
  await writeFile(file, html);
}

async function writeLlms(posts) {
  const file = path.join(ROOT, 'public/llms.txt');
  let txt = await readFile(file, 'utf8');
  const heading = '## Writing';
  const section = posts.length
    ? `${heading}\n\n${posts
        .map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`)
        .join('\n')}\n`
    : '';

  const i = txt.indexOf(heading);
  if (i !== -1) {
    // replace through to the next heading, or end of file
    const rest = txt.slice(i + heading.length);
    const nextIdx = rest.indexOf('\n## ');
    txt = txt.slice(0, i) + section + (nextIdx === -1 ? '' : rest.slice(nextIdx + 1));
  } else {
    txt = txt.replace(/\n*$/, '\n\n') + section;
  }
  await writeFile(file, txt);
}

/* ------------------------------------------------------------------- main */

export async function buildBlog() {
  const posts = await loadPosts();

  if (problems.length) {
    console.error('\nBlog build failed:\n');
    for (const p of problems) console.error('  ' + p);
    console.error('');
    process.exit(1);
  }

  const shell = await loadShell(ROOT);
  await mkdir(BLOG_DIR, { recursive: true });

  marked.setOptions({ mangle: false, headerIds: false });

  for (const [i, post] of posts.entries()) {
    const html = marked.parse(post.markdown).trim();
    if (/<h1[\s>]/i.test(html)) {
      console.error(`\n${post.file}: body contains an <h1>. Body headings must start at h2.\n`);
      process.exit(1);
    }
    const prev = posts[i + 1]; // older
    const next = posts[i - 1]; // newer
    const page = renderPage(shell, {
      title: `${post.title} | Fix Customer Service`,
      description: post.description,
      canonical: `${SITE}/blog/${post.slug}`,
      head: postHead(post),
      body: postBody(post, html, prev, next),
    });
    await writeFile(path.join(BLOG_DIR, `${post.slug}.html`), page);
  }

  const index = renderPage(shell, {
    title: 'Writing on customer service | Fix Customer Service',
    description:
      'Plain notes on running customer service: what drives contact volume, what support really costs, and what actually fixes it.',
    canonical: `${SITE}/blog`,
    head: `<meta property="og:type" content="website">
<meta property="og:title" content="Writing on customer service operations">
<meta property="og:url" content="${SITE}/blog">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
${BLOG_CSS}`,
    body: indexBody(posts),
  });
  // Written as public/blog.html, not public/blog/index.html: the asset
  // handler answers a directory index with a 307 to the trailing-slash form,
  // which would make /blog redirect and stop the canonical matching the
  // served path. A sibling .html file is served at /blog directly.
  await writeFile(path.join(ROOT, 'public/blog.html'), index);

  await writeSitemap(posts);
  await writeHomepageBlock(posts);
  await writeLlms(posts);

  return posts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildBlog().then((posts) => {
    console.log(`blog: ${posts.length} post(s)`);
    for (const p of posts) console.log(`  /blog/${p.slug}  ${p.date}  ${p.readingMinutes}min`);
    console.log('  /blog');
    console.log('rewrote sitemap.xml, llms.txt, homepage block');
  });
}

/**
 * Single source of truth for the site chrome.
 *
 * The homepage is hand-written and stays that way. Rather than keeping a
 * second copy of the stylesheet and the header/footer markup, generated
 * pages read them straight out of public/index.html at build time, so the
 * two can never drift.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const SITE = 'https://fixcustomerservice.com';

const FONTS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700;800&display=swap">',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700;800&display=swap" media="print" onload="this.media=\'all\'">',
  '<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700;800&display=swap"></noscript>',
].join('\n');

function between(html, open, close, what) {
  const a = html.indexOf(open);
  if (a === -1) throw new Error(`shell: could not find ${what} (${open}) in index.html`);
  const b = html.indexOf(close, a);
  if (b === -1) throw new Error(`shell: ${what} is not closed`);
  return html.slice(a, b + close.length);
}

/**
 * The homepage can use same-page anchors and relative asset paths because it
 * sits at the root. Away from it both break: anchors point at nothing, and a
 * relative src under /blog/ resolves to /blog/<asset> and 404s.
 */
function absolutise(markup) {
  return markup
    .replace(/href="#top"/g, `href="/"`)
    .replace(/href="#([a-z-]+)"/g, 'href="/#$1"')
    .replace(/src="(?!\/|https?:|data:)([^"]+)"/g, 'src="/$1"');
}

export async function loadShell(root) {
  const html = await readFile(path.join(root, 'public/index.html'), 'utf8');

  const style = between(html, '<style>', '</style>', 'the stylesheet');
  const header = absolutise(between(html, '<header class="topbar">', '</header>', 'the header'));
  const footer = between(html, '<footer>', '</footer>', 'the footer');
  const sticky = absolutise(between(html, '<div class="sticky">', '</div>', 'the sticky bar'));

  return { style, header, footer, sticky, fonts: FONTS };
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/**
 * Assembles a complete page. `head` carries the per-page SEO tags, `body`
 * the content between header and footer.
 */
export function renderPage(shell, { title, description, canonical, head = '', body, bodyEnd = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#141310">
${head}
${shell.fonts}
${shell.style}
</head>
<body>

${shell.header}

<main>
${body}
</main>

${shell.footer}

${shell.sticky}

<script>
(function(){
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rev = [].slice.call(document.querySelectorAll('section > .wrap > *, section > .narrow > *'));
  rev.forEach(function(e){ e.classList.add('rv'); });
  if (!rm && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(en){ en.forEach(function(x){
      if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); },
      { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function(e){ io.observe(e); });
  } else { rev.forEach(function(e){ e.classList.add('in'); }); }

  var sticky = document.querySelector('.sticky');
  if (sticky) {
    function stick(){ sticky.style.display = window.innerWidth > 820 ? 'none' : 'flex'; }
    window.addEventListener('resize', stick); stick();
  }
})();
</script>
${bodyEnd}
</body>
</html>
`;
}

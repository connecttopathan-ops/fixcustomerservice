/*
 * Renders public/og-image.jpg, the card every page shares on social.
 *
 * Run by hand when the card's wording or look changes:
 *     node scripts/build-og.mjs
 * and commit the result. It is deliberately NOT part of `npm run build`:
 * it needs a Chromium, which the site itself has no use for.
 *
 * The card carries the firm, not a person. No headshot, no name, no byline.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og-image.jpg');

const CREDS = [
  ['13 years', 'running support operations'],
  ['200 to 200,000', 'messages a month'],
  ['Fixed price', 'agreed before anything starts'],
];

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--ink:#141310;--grey:#5F594F;--marker:#FBDD5C;--gold:#F0B71E;--paper:#FAF6EE;--rule:#E6DFD3}
  html,body{width:1200px;height:630px}
  body{font-family:'Schibsted Grotesk',system-ui,sans-serif;background:var(--paper);color:var(--ink);
    display:flex;flex-direction:column;overflow:hidden}
  .head{flex:0 0 auto;padding:44px 56px 0}
  .top{flex:1 1 auto;display:grid;grid-template-columns:1fr 356px;gap:48px;padding:0 56px;align-items:center}
  .mark{display:flex;align-items:center;gap:13px}
  .mark svg{width:46px;height:46px;display:block}
  .mark b{font-size:21px;font-weight:800;letter-spacing:-.02em}
  .mark b i{font-style:normal;background:var(--marker);padding:1px 5px;border-radius:3px}
  h1{font-size:61px;font-weight:800;letter-spacing:-.033em;line-height:1.06}
  h1 mark{background:var(--marker);color:var(--ink);padding:.04em .1em;
    -webkit-box-decoration-break:clone;box-decoration-break:clone}
  .sub{margin-top:24px;font-size:21px;line-height:1.45;color:var(--grey);max-width:22em}
  .creds{display:flex;flex-direction:column;gap:14px}
  .cred{background:#fff;border:2px solid var(--ink);border-radius:13px;padding:17px 20px;
    box-shadow:5px 5px 0 var(--gold)}
  .cred b{display:block;font-size:27px;font-weight:800;letter-spacing:-.025em;line-height:1.1}
  .cred span{display:block;margin-top:3px;font-size:15px;font-weight:500;color:var(--grey);line-height:1.3}
  .strip{flex:0 0 74px;background:var(--ink);color:#fff;display:flex;align-items:center;
    justify-content:space-between;padding:0 56px;font-size:19px;font-weight:700}
  .strip .dom{color:var(--gold)}
  .strip .what{color:#B9B4AA;font-weight:500}
</style></head><body>
  <div class="head">
    <div class="mark">
        <svg viewBox="0 0 160 160" aria-hidden="true"><rect width="160" height="160" rx="36" fill="#141310"/><path d="M48,42 h64 a18,18 0 0 1 18,18 v26 a18,18 0 0 1 -18,18 h-34 l-18,19 v-19 h-14 a18,18 0 0 1 -18,-18 v-26 a18,18 0 0 1 18,-18 z" fill="#FBDD5C"/><path d="M59.0,76.0 l10.8,10.8 L92.0,61.0" fill="none" stroke="#141310" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <b>fix<i>customerservice</i></b>
    </div>
  </div>
  <div class="top">
    <div>
      <h1>Fix your customer service <mark>without hiring more people.</mark></h1>
      <p class="sub">We find what is broken, put a number on it, and fix it with your team.</p>
    </div>
    <div class="creds">
      ${CREDS.map(([b, s]) => `<div class="cred"><b>${b}</b><span>${s}</span></div>`).join('\n      ')}
    </div>
  </div>
  <div class="strip">
    <span class="dom">fixcustomerservice.com</span>
    <span class="what">Customer service consultancy</span>
  </div>
</body></html>`;

// playwright is not a dependency of the site, so take it from wherever this
// machine has it rather than adding a browser to the project's install
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const require = createRequire(import.meta.url);
  const paths = ['/opt/node22/lib/node_modules/playwright/index.mjs',
                 '/usr/lib/node_modules/playwright/index.mjs'];
  const found = paths.find(p => { try { require.resolve(p); return true; } catch { return false; } });
  if (!found) throw new Error('playwright not found; install it to regenerate the OG card');
  ({ chromium } = await import(found));
}

// the headline is set in Schibsted Grotesk, which comes from Google Fonts, so
// the render needs whatever egress this machine has
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  args: proxy ? ['--ignore-certificate-errors'] : ['--no-proxy-server'],
  ...(proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {}),
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

// a silent font failure would ship a card in the wrong typeface, so refuse
const gotFont = await page.evaluate(() => document.fonts.check('800 58px "Schibsted Grotesk"'));
if (!gotFont) {
  await browser.close();
  throw new Error('Schibsted Grotesk did not load; refusing to write a card in a fallback face');
}

const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
writeFileSync(OUT, buf);
await browser.close();
console.log(`og-image.jpg written (${(buf.length / 1024).toFixed(0)} KB, 1200x630 at 2x)`);

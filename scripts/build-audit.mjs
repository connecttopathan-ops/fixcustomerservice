/**
 * Generates public/customer-service-audit.html.
 *
 * The page is generated rather than hand-written so it inherits the
 * homepage stylesheet and chrome verbatim. The output is committed, so
 * serving the site still needs no build step.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadShell, renderPage, SITE } from './lib/shell.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const AUDIT = {
  slug: 'customer-service-audit',
  // The brief's suggested title is 63 characters, over its own 60 limit.
  // Trimmed "Find" to fit without losing the keyword or the benefit.
  title: "Customer Service Audit | What's Driving Your Support Costs",
  description:
    'A one week audit of your support operation. We find what is driving your cost and reply times, rank it, and price the fixes.',
  lastmod: '2026-09-05',
};

const GROUPS = [
  {
    name: 'People',
    items: ['Staffing levels against real demand', 'Schedules and cover', 'Quality checks', 'Skills and training gaps'],
  },
  {
    name: 'Processes',
    items: ['Escalation paths', 'Day to day workflows', 'Reply time targets', 'What makes people contact you twice'],
  },
  {
    name: 'Technology',
    items: ['Helpdesk setup', 'Automation and what it answers', 'WhatsApp and other channels', 'CRM and integrations'],
  },
  {
    name: 'Customers',
    items: ['What drives contacts', 'How hard you are to deal with', 'Complaints and where they go'],
  },
  {
    name: 'Economics',
    items: ['Cost per contact', 'Cost per customer', 'Cost per channel', 'Where the money actually goes'],
  },
];

const BANDS = [
  {
    size: 'A few hundred messages a month',
    body: 'The audit is short and mostly about what is missing. Usually there is no record of what came in, so the first job is counting it.',
  },
  {
    size: 'A few thousand messages a month',
    body: 'This is where the audit earns its money. You have hired people, quality varies by who picks up, and nobody can say what customers are contacting about.',
  },
  {
    size: 'Tens of thousands messages a month',
    body: 'The focus moves to contact drivers and staffing models. Headcount has been growing with volume, and the same problems generate messages every month.',
  },
  {
    size: 'Hundreds of thousands messages a month',
    body: 'Structural work. Outsourced partners, self service that does not work, and automation bought before anyone understood what to automate.',
  },
];

const FAQ = [
  {
    q: 'How long does it take?',
    a: 'One week from the day we get access. Some of that is reading your data, some is listening to how your team actually works. You get the report at the end of it.',
  },
  {
    q: 'What do you need from us?',
    a: "Read only access to your inbox and helpdesk, whatever reporting you already have, and about two hours of your team's time spread across the week. We work around them, not the other way round.",
  },
  {
    q: 'What if we have no numbers at all?',
    a: 'Most businesses do not. Establishing them is the first part of the work and it is included. If your systems cannot report something, we say so and tell you what it would take to fix that.',
  },
  {
    q: 'Do we have to buy the fixes from you?',
    a: 'No. The report is yours to keep and it is written so another person could pick it up and do the work. Plenty of clients hand it to their own team.',
  },
  {
    q: 'What does it cost?',
    a: 'A fixed price agreed before anything starts, based on the size of your operation. You get a straight number on the free call. Never hourly, never a surprise.',
  },
  {
    q: 'Is this different from the free call?',
    a: 'Yes. The free call is thirty minutes and gives you an honest read on your three biggest problems. The audit is a week of work with a written report, ranked problems and costed fixes behind it.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE}/${AUDIT.slug}#service`,
  name: 'Customer Service Audit',
  serviceType: 'Customer service operations audit',
  description:
    'A one week review of a business customer service operation covering people, processes, technology, contact drivers and cost, ending in a written report with ranked problems and costed fixes.',
  provider: { '@id': `${SITE}/#business` },
  areaServed: ['AE', 'Worldwide'],
  url: `${SITE}/${AUDIT.slug}`,
};

const li = (items) => items.map((i) => `<li>${i}</li>`).join('');

const body = `
<section>
  <div class="wrap">
    <p class="eyebrow"><span class="sno">01</span> &middot; The one week audit</p>
    <h1>Customer Service Audit</h1>
    <p class="lead">Most support problems are not mysteries. They are just uncounted. We spend a week inside how your business answers customers, work out what is driving your cost and your reply times, and hand you a report that ranks the problems and prices the fixes. You keep it whoever does the work.</p>
    <div class="cta">
      <a class="btn" href="/#talk">Book a free 30-minute call</a>
      <a class="btn-quiet" href="/#cost">See what it's costing you</a>
    </div>
    <small class="audit-hero-note">The call is free and comes first. Nothing is charged until you agree a fixed price for the audit.</small>
  </div>
</section>

<section class="paper">
  <div class="wrap">
    <p class="eyebrow"><span class="sno">02</span> &middot; What gets examined</p>
    <h2>Five things, in one week.</h2>
    <p class="lead">Support problems rarely sit in one place. A slow reply time can be a staffing problem, a tooling problem or a billing page that confuses people. We look at all five so the answer is the real one.</p>
    <div class="audit-groups">
      ${GROUPS.map(
        (g) => `<div><b>${g.name}</b><ul>${li(g.items)}</ul></div>`
      ).join('\n      ')}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow"><span class="sno">03</span> &middot; What you get</p>
    <h2>A report you can act on without us.</h2>
    <div class="three">
      <div>
        <b class="deliver">The written report</b>
        <p>Plain English, no jargon, no slides. What we found, what it is costing you, and the evidence for both. Usually fifteen to twenty pages.</p>
      </div>
      <div>
        <b class="deliver">The ranked problem list</b>
        <p>Every problem in order of what it costs you, not in order of how easy it is to fix. You can see immediately what is worth attention.</p>
      </div>
      <div>
        <b class="deliver">Costed fixes</b>
        <p>What each fix involves, roughly what it costs, and what it should save. Some are free and take an afternoon. Some take months.</p>
      </div>
    </div>
    <p class="check-note" style="margin-top:38px">The report is yours. It is written so your own team, or another consultant, could pick it up and do the work. <a href="/#talk">Talk to us about an audit&nbsp;&rarr;</a></p>
  </div>
</section>

<section class="paper">
  <div class="wrap">
    <p class="eyebrow"><span class="sno">04</span> &middot; Who it suits</p>
    <h2>It breaks differently at every size.</h2>
    <p class="lead">The audit is the same week of work at any volume. What changes is where the problems turn out to be.</p>
    <div class="bands">
      ${BANDS.map(
        (b) => `<div class="band"><b>${b.size}</b><p>${b.body}</p></div>`
      ).join('\n      ')}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow"><span class="sno">05</span> &middot; What it led to</p>
    <h2>Two rebuilds that started this way.</h2>
    <p class="lead">Both from the same fintech in Dubai, where we rebuilt the support function. The numbers come from tracked KPIs, not estimates.</p>
    <div class="audit-proof">
      <div>
        <b>96%</b><span>decrease in average wait time after the WhatsApp rebuild</span>
      </div>
      <div>
        <b>45%</b><span>fewer requests coming in, once the contact drivers were fixed</span>
      </div>
    </div>
    <p class="check-note" style="margin-top:34px"><a href="/#proof">Read both case studies in full&nbsp;&rarr;</a></p>
  </div>
</section>

<section class="paper">
  <div class="wrap narrow-sec">
    <p class="eyebrow"><span class="sno">06</span> &middot; Questions</p>
    <h2>What people ask about the audit.</h2>
    <div style="margin-top:38px">
      ${FAQ.map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>

<div class="midcta">
  <div class="wrap">
    <h2>Worth thirty minutes to find out?</h2>
    <p>Start with the free call. You'll leave it knowing your three biggest problems and roughly what they're costing, whether we end up working together or not.</p>
    <div class="acts">
      <a class="btn" href="/#talk">Book a free 30-minute call</a>
      <a class="wa2" href="https://wa.me/971522771875?text=Hi%20Abdullah%2C%20I%27d%20like%20to%20talk%20about%20a%20customer%20service%20audit.">Or send a WhatsApp instead</a>
    </div>
    <small>Only a few clients are taken on at a time, so the diary is genuinely limited.</small>
  </div>
</div>
`;

const head = `<meta property="og:type" content="website">
<meta property="og:site_name" content="Fix Customer Service">
<meta property="og:title" content="Customer Service Audit">
<meta property="og:description" content="${AUDIT.description}">
<meta property="og:url" content="${SITE}/${AUDIT.slug}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Fix Customer Service, customer service operations in Dubai">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Customer Service Audit">
<meta name="twitter:description" content="${AUDIT.description}">
<meta name="twitter:image" content="${SITE}/og-image.jpg">
<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>`;

const PAGE_CSS = `<style>
  .audit-groups{display:grid;grid-template-columns:repeat(4,1fr);gap:34px 40px;margin-top:48px}
  .audit-groups > div{border-top:2px solid var(--ink);padding-top:18px}
  .audit-groups b{display:block;font-weight:800;font-size:1.08rem;margin-bottom:12px}
  .audit-groups ul{margin:0;padding:0;list-style:none}
  .audit-groups li{color:var(--grey);font-size:.99rem;padding:7px 0;border-bottom:1px solid var(--rule)}
  .audit-groups li:last-child{border-bottom:0}
  /* Five groups in a four column grid leaves a hole on the second row.
     Economics is the summary of the other four, so it runs full width. */
  .audit-groups > div:last-child{grid-column:1/-1;margin-top:8px}
  .audit-groups > div:last-child ul{display:grid;grid-template-columns:repeat(4,1fr);gap:0 40px}
  .audit-hero-note{display:block;color:var(--grey);margin-top:26px;font-size:.97rem;max-width:34em}
  .deliver{display:block;font-weight:800;font-size:1.14rem;border-top:2px solid var(--ink);padding-top:16px}
  .audit-proof{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:46px}
  .audit-proof > div{border-top:2px solid var(--ink);padding-top:18px}
  .audit-proof b{display:block;font-weight:800;font-size:3.2rem;line-height:1;letter-spacing:-.03em}
  .audit-proof span{display:block;color:var(--grey);margin-top:10px;font-size:1.01rem;max-width:22em}
  .narrow-sec{max-width:var(--narrow)}
  @media (max-width:820px){
    .audit-groups{grid-template-columns:1fr;gap:26px}
    .audit-groups > div:last-child ul{grid-template-columns:1fr}
    .audit-proof{grid-template-columns:1fr;gap:28px}
    .audit-proof b{font-size:2.6rem}
  }
</style>`;

export async function buildAudit() {
  const shell = await loadShell(ROOT);
  const html = renderPage(shell, {
    title: AUDIT.title,
    description: AUDIT.description,
    canonical: `${SITE}/${AUDIT.slug}`,
    head: head + '\n' + PAGE_CSS,
    body,
  });
  const out = path.join(ROOT, 'public', `${AUDIT.slug}.html`);
  await writeFile(out, html);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildAudit().then((f) => console.log('wrote', path.relative(ROOT, f)));
}

/**
 * Serves the static site and handles lead capture.
 *
 * Static assets are served by Cloudflare's asset layer without invoking this
 * Worker. Only /api/* is routed here first (see run_worker_first in
 * wrangler.jsonc), so this code runs on form submissions and nothing else.
 *
 * Submissions are forwarded to a Google Apps Script web app, which appends a
 * row to the Leads sheet. That URL is a secret rather than a config value so
 * the endpoint cannot be scraped from the page and posted to directly.
 */

const MAX_BODY_BYTES = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 8000;
const SITE_ORIGIN = 'https://fixcustomerservice.com';

const LIMITS = {
  name: 120,
  business: 120,
  website: 200,
  email: 200,
  phone: 60,
  concern: 2000,
};

const REQUIRED = ['name', 'business', 'email', 'concern'];

const VOLUMES = new Set([
  '0-1k',
  '1k-10k',
  '10k-50k',
  '50k-100k',
  '100k+',
  'I am not sure',
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
      }
      return handleLead(request, env);
    }

    // Belt and braces: anything else falls through to the static site.
    return env.ASSETS.fetch(request);
  },
};

async function handleLead(request, env) {
  const contentType = request.headers.get('content-type') || '';
  // A submission without JS posts the form natively and expects a page back,
  // not JSON it has no way to render.
  const wantsHtml = !contentType.includes('application/json');

  let fields;
  try {
    fields = await readBody(request, contentType);
  } catch (err) {
    return respond(wantsHtml, { ok: false, error: err.message }, err.status || 400);
  }

  // Bots fill in every field they find; a real person never sees this one.
  if (clean(fields.referral_code, 100) !== '') {
    return respond(wantsHtml, { ok: true }, 200);
  }

  const lead = {
    name: clean(fields.name, LIMITS.name),
    business: clean(fields.business, LIMITS.business),
    website: clean(fields.website, LIMITS.website),
    email: clean(fields.email, LIMITS.email),
    phone: clean(fields.phone, LIMITS.phone),
    concern: clean(fields.concern, LIMITS.concern),
    volume: VOLUMES.has(fields.volume) ? fields.volume : 'Unspecified',
  };

  const missing = REQUIRED.filter((key) => !lead[key]);
  if (missing.length) {
    return respond(wantsHtml, { ok: false, error: 'missing_fields', fields: missing }, 400);
  }

  if (!isEmail(lead.email)) {
    return respond(wantsHtml, { ok: false, error: 'invalid_email' }, 400);
  }

  if (!env.SHEETS_WEBHOOK_URL) {
    console.error('SHEETS_WEBHOOK_URL is not set; lead could not be recorded');
    return respond(wantsHtml, { ok: false, error: 'not_configured' }, 503);
  }

  const payload = {
    ...lead,
    secret: env.SHEETS_SHARED_SECRET || '',
    submittedAt: new Date().toISOString(),
    country: request.headers.get('cf-ipcountry') || '',
    referrer: clean(request.headers.get('referer'), 300),
    userAgent: clean(request.headers.get('user-agent'), 300),
  };

  try {
    const upstream = await fetch(env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      console.error(`Sheets webhook returned ${upstream.status}`);
      return respond(wantsHtml, { ok: false, error: 'upstream_error' }, 502);
    }
  } catch (err) {
    console.error(`Sheets webhook failed: ${err.message}`);
    return respond(wantsHtml, { ok: false, error: 'upstream_unreachable' }, 502);
  }

  return respond(wantsHtml, { ok: true }, 200);
}

async function readBody(request, contentType) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw Object.assign(new Error('payload_too_large'), { status: 413 });
  }

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('bad_json');
      return parsed;
    } catch {
      throw Object.assign(new Error('bad_json'), { status: 400 });
    }
  }

  return Object.fromEntries(new URLSearchParams(raw));
}

function clean(value, limit) {
  if (typeof value !== 'string') return '';
  // Collapse control characters so a submission cannot forge rows in the sheet.
  return value.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value);
}

function respond(wantsHtml, body, status) {
  if (!wantsHtml) return json(body, status);
  const target = body.ok ? '/thanks' : '/?submit=failed#talk';
  return Response.redirect(new URL(target, SITE_ORIGIN).toString(), 303);
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

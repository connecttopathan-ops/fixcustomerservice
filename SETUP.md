# Lead capture setup

The contact form posts to `/api/lead` on the Worker, which forwards the
submission to a Google Apps Script web app that appends a row to a Google
Sheet. Until the two secrets below are set, the form returns
`503 not_configured` and the page tells visitors to use WhatsApp instead.

## 1. Create the sheet

1. Create a Google Sheet (name it whatever you like, e.g. "Website leads").
2. **Extensions → Apps Script**. This creates a script bound to that sheet,
   which is what lets `SpreadsheetApp.getActiveSpreadsheet()` find it. A
   standalone script created from script.google.com will not work.
3. Delete the placeholder `myFunction` and paste the contents of
   `scripts/google-apps-script.gs`.
4. Replace `REPLACE_WITH_A_LONG_RANDOM_STRING` at the top with a long random
   string. Generate one with:

   ```
   openssl rand -hex 32
   ```

   Keep it — you need the same value in step 3. Do not paste it into a chat,
   an issue, or a screenshot: it is the only thing standing between the
   public internet and your sheet.
5. Save.

The script creates a `Leads` tab with a header row on the first submission;
you do not need to set up columns yourself.

## 2. Deploy the Apps Script

1. **Deploy → New deployment → Type: Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**.
3. Deploy, approve the permission prompt, and copy the web app URL. It looks
   like `https://script.google.com/macros/s/AKfy.../exec`.

"Anyone" is required because Cloudflare calls it unauthenticated. The shared
secret is what actually protects it — a request without the right secret is
rejected before anything is written.

## 3. Give the Worker the two secrets

From the repo root:

```
npx wrangler secret put SHEETS_WEBHOOK_URL     # paste the /exec URL
npx wrangler secret put SHEETS_SHARED_SECRET   # paste the same random string
```

Or in the dashboard: **Workers & Pages → fix-cs-cx-ab → Settings → Variables
and Secrets**. They must be Secrets, not plaintext variables.

Secrets are not applied by a git push — set them once, and they persist
across deployments.

## 4. Check it

Submit the form on the live site, or:

```
curl -X POST https://fixcustomerservice.com/api/lead \
  -H 'content-type: application/json' \
  -d '{"name":"Test","business":"Test Co","email":"test@example.com","concern":"Checking the form"}'
```

`{"ok":true}` means the row is in the sheet. Delete the test row afterwards.

## Whenever you change the Apps Script

Saving the file changes nothing that is live. The `/exec` URL keeps serving
whichever version was current when you last deployed, so every edit needs a
redeploy:

**Deploy → Manage deployments → pencil icon on the existing deployment →
Version: New version → Deploy.**

Use the pencil on the deployment you already have. **Deploy → New deployment**
looks similar but creates a second, independent web app with its own URL, and
leaves the first one running the old code. If that happens you have two live
endpoints, one of them stale:

- Point `SHEETS_WEBHOOK_URL` at the new URL, and
- **Deploy → Manage deployments → old deployment → ⋮ → Archive**, or it keeps
  accepting submissions with whatever secret the old code carried.

Updating an existing deployment keeps the same URL, so the Worker secret does
not need changing.

To check which version is actually live, post to the URL with a deliberately
wrong secret. `{"ok":false,"error":"unauthorized"}` proves the deployment is
reachable and running a version whose secret is not the one you sent. Nothing
is written to the sheet.

## Running it locally

Create `.dev.vars` (gitignored) in the repo root:

```
SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
SHEETS_SHARED_SECRET="the-same-random-string"
```

Then `npx wrangler dev`.

## Troubleshooting

| Response | Cause |
| --- | --- |
| `503 not_configured` | `SHEETS_WEBHOOK_URL` is not set on the Worker |
| `502 upstream_error` | Apps Script rejected it — usually the secret does not match, or the deployment was never updated to a new version |
| `502 upstream_unreachable` | Apps Script did not respond within 8 seconds |
| `400 missing_fields` | Name, business, email or concern was empty |

Worker-side errors are logged. Watch them live with `npx wrangler tail`.

---

# Adding a blog post

Posts are markdown files in `content/posts/`, one per post. The HTML is
generated and committed, so serving the site never needs a build step.

1. Create `content/posts/<slug>.md` with front matter:

   ```yaml
   ---
   title: How to calculate cost per contact
   description: A benefit-led summary, under 155 characters.
   slug: how-to-calculate-cost-per-contact
   date: 2026-09-10
   updated: 2026-09-10
   tags: [metrics, cost]
   readingMinutes: 6
   ---
   ```

   Body headings start at `##`. The `#` level is the post title, added for you.

2. Run the build and commit what it changes:

   ```
   npm install     # first time only
   npm run build
   ```

It regenerates `public/blog.html`, `public/blog/<slug>.html`,
`public/customer-service-audit.html`, `public/sitemap.xml`, the `## Writing`
section of `public/llms.txt`, and the "Latest writing" block on the homepage
between the `<!-- BLOG:START -->` and `<!-- BLOG:END -->` markers.

The build refuses to run on a duplicate slug, a missing description, a
description over 155 characters, a malformed date, or a title that would
exceed 60 characters once " | Fix Customer Service" is appended. That suffix
costs 23 characters, so keep titles to about 37.

With no posts at all, the homepage block, the sitemap entries and the
`## Writing` section disappear rather than rendering empty.

## How the chrome stays in sync

`scripts/lib/shell.mjs` reads the stylesheet, header and footer straight out
of `public/index.html` at build time, so generated pages cannot drift from the
homepage. Editing the homepage styles and re-running the build updates every
generated page. Relative asset paths and same-page anchors are rewritten to
absolute, because a relative `src` under `/blog/` would otherwise 404.

Remember to bump `<meta name="build">` in `public/index.html` so a deploy can
be confirmed from view-source.

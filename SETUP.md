# Lead capture setup

The contact form posts to `/api/lead` on the Worker, which forwards the
submission to a Google Apps Script web app that appends a row to a Google
Sheet. Until the two secrets below are set, the form returns
`503 not_configured` and the page tells visitors to use WhatsApp instead.

## 1. Create the sheet

1. Create a Google Sheet (name it whatever you like, e.g. "Website leads").
2. **Extensions → Apps Script**.
3. Delete the placeholder `myFunction` and paste the contents of
   `scripts/google-apps-script.gs`.
4. Replace `REPLACE_WITH_A_LONG_RANDOM_STRING` at the top with a long random
   string. Generate one with:

   ```
   openssl rand -hex 32
   ```

   Keep it — you need the same value in step 3.
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

Editing the script is not enough — **Deploy → Manage deployments → edit →
Version: New version**. Without that, the old code keeps running. The URL
stays the same, so the Worker secret does not need updating.

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

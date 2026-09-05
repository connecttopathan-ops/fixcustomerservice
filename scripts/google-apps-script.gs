/**
 * Google Apps Script web app that appends site enquiries to a sheet.
 *
 * Setup lives in SETUP.md. In short: paste this into Extensions > Apps Script
 * on the target spreadsheet, set SHARED_SECRET below, deploy as a web app
 * ("Execute as: Me", "Who has access: Anyone"), then give the deployment URL
 * and the same secret to the Worker as secrets.
 */

// Must match the SHEETS_SHARED_SECRET secret set on the Cloudflare Worker.
var SHARED_SECRET = 'REPLACE_WITH_A_LONG_RANDOM_STRING';

var SHEET_NAME = 'Leads';

var COLUMNS = [
  { header: 'Submitted at (UTC)', key: 'submittedAt' },
  { header: 'Name', key: 'name' },
  { header: 'Business', key: 'business' },
  { header: 'Website', key: 'website' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone' },
  { header: 'Queries per month', key: 'volume' },
  { header: 'Main concern', key: 'concern' },
  { header: 'Country', key: 'country' },
  { header: 'Referrer', key: 'referrer' },
  { header: 'User agent', key: 'userAgent' }
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return reply(false, 'no_body');
    }

    var body = JSON.parse(e.postData.contents);

    if (!SHARED_SECRET || body.secret !== SHARED_SECRET) {
      return reply(false, 'unauthorized');
    }

    appendLead(body);
    return reply(true, null);
  } catch (err) {
    console.error(err);
    return reply(false, String(err));
  }
}

function appendLead(body) {
  // A lock stops two submissions landing in the same instant from
  // overwriting each other's row.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    var row = COLUMNS.map(function (column) {
      return asCell(body[column.key]);
    });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var headers = COLUMNS.map(function (column) {
      return column.header;
    });
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Writes every value as text. Without this a value beginning with "=", "+",
 * "-" or "@" is interpreted as a formula by Sheets and by Excel when the
 * sheet is exported, which is how spreadsheet injection works.
 */
function asCell(value) {
  if (value === null || value === undefined) return '';
  var text = String(value);
  if (/^[=+\-@]/.test(text)) {
    return "'" + text;
  }
  return text;
}

function reply(ok, error) {
  var body = { ok: ok };
  if (error) body.error = error;
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

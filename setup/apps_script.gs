/**
 * Core Progress Assessment: results collector.
 * Paste this into Extensions > Apps Script in a new Google Sheet, then deploy it as a web app
 * (Execute as: Me, Who has access: Anyone). Every learner's results arrive as a new row.
 */
var TEACHER_CODE = "TMC2026";   // must match the teacher dashboard code
var SHEET = "Results";

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    var head = ["Received", "ID", "Name", "Group", "Total", "Max", "Percent", "Band",
      "Electrical %", "Circuits %", "Sectors %", "Design %", "Minutes", "Left page", "Next step", "Record (JSON)"];
    for (var q = 1; q <= 35; q++) head.push("Q" + q);
    sh.appendRow(head); sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var r = JSON.parse(e.postData.contents), sh = sheet_();
    if (r.kind === "pledge") {
      var ids = sh.getRange(2, 2, Math.max(1, sh.getLastRow() - 1), 1).getValues();
      for (var i = ids.length - 1; i >= 0; i--) if (ids[i][0] === r.id) {
        sh.getRange(i + 2, 15).setValue(r.pledge);
        var rec = JSON.parse(sh.getRange(i + 2, 16).getValue()); rec.pledge = r.pledge; sh.getRange(i + 2, 16).setValue(JSON.stringify(rec));
        break;
      }
      return out_({ ok: true });
    }
    var ids2 = sh.getLastRow() > 1 ? sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues().map(function (x) { return x[0]; }) : [];
    if (ids2.indexOf(r.id) >= 0) return out_({ ok: true, duplicate: true });
    var row = [new Date(), r.id, r.name, r.group, r.total, r.max, r.pct, r.band,
      r.units.A, r.units.B, r.units.C, r.units.D, r.minutes, r.leftPage, r.pledge || "", JSON.stringify(r)];
    for (var q = 1; q <= 35; q++) row.push(r.marks[q]);
    sh.appendRow(row);
    return out_({ ok: true });
  } finally { lock.releaseLock(); }
}

function doGet(e) {
  if (!e.parameter || e.parameter.code !== TEACHER_CODE) return out_({ ok: false, error: "code" });
  var sh = sheet_(), n = sh.getLastRow() - 1;
  var recs = n > 0 ? sh.getRange(2, 16, n, 1).getValues().map(function (x) { try { return JSON.parse(x[0]); } catch (err) { return null; } }).filter(Boolean) : [];
  return out_({ ok: true, records: recs });
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* Teacher dashboard: load learners' results files, re-mark them, moderate written answers, export CSV. */
(function () {
  "use strict";
  var QZ = window.QUIZ, E = window.ENGINE, Qs = QZ.questions, root = document.getElementById("t");
  var LS = "tmc-core-progress-teacher-v1";
  var store = load(), view = { tab: "class", sel: null, sort: "name" };

  function load() { try { return JSON.parse(localStorage.getItem(LS)) || { learners: {}, overrides: {} }; } catch (e) { return { learners: {}, overrides: {} }; } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) { } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pc(o) { return o && o.max ? Math.round(o.score / o.max * 100) : 0; }
  function fmt(n) { return (Math.round(n * 2) / 2).toString(); }
  function idOf(r) { return (r.name + "|" + r.group + "|" + r.finished).toLowerCase(); }

  async function sha(s) {
    var b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }
  var PASS = "b7d81ba5e5a6a4191d031a69b507ce6622b5924bc32dfea294088d028f58a4ef"; // SHA-256 of the teacher code

  function gate() {
    if (sessionStorage.getItem("tmc-teacher-ok") === "1") { main(); if (window.RESULTS_URL) pull(); return; }
    root.innerHTML = '<section class="card" style="max-width:520px;margin:40px auto"><h2>Teacher access</h2><p>Enter the teacher code to open the results dashboard.</p>' +
      '<label class="field">Teacher code<input id="code" type="password" autocomplete="off"></label><div class="btn-row"><button class="btn" id="go">Open dashboard</button></div><p id="err" class="warn" hidden>That code is not right.</p></section>';
    var go = async function () {
      var h = await sha(document.getElementById("code").value.trim());
      if (h === PASS) { sessionStorage.setItem("tmc-teacher-ok", "1"); sessionStorage.setItem("tmc-teacher-code", document.getElementById("code").value.trim()); main(); if (window.RESULTS_URL) pull(); } else document.getElementById("err").hidden = false;
    };
    document.getElementById("go").onclick = go;
    document.getElementById("code").onkeydown = function (e) { if (e.key === "Enter") go(); };
  }

  function marked(id) { var r = store.learners[id]; return E.markAll(QZ, r.answers, store.overrides[id]); }

  function addFiles(files) {
    var n = 0, bad = 0, pending = files.length;
    Array.prototype.forEach.call(files, function (f) {
      var rd = new FileReader();
      rd.onload = function () {
        try { var r = JSON.parse(rd.result); if (r.app !== "tmc-core-progress" || !r.answers) throw 0; store.learners[idOf(r)] = r; n++; } catch (e) { bad++; }
        if (--pending === 0) { save(); main(); if (bad) alert(bad + " file(s) were not results files and were skipped."); }
      };
      rd.readAsText(f);
    });
  }

  function main() {
    var ids = Object.keys(store.learners);
    var html = '<section class="card"><h1 style="margin-top:0">Class results</h1>' +
      '<div class="drop" id="drop"><b>Drop learners\' results files here</b><br><span style="font-size:.8rem;color:var(--muted)">or click to choose them (the .json files learners download at the end). You can add more at any time.</span><input type="file" id="file" accept=".json,application/json" multiple hidden></div>' +
      (window.RESULTS_URL ? '<div class="btn-row"><button class="btn green" id="pull">⟳ Get latest results from the results sheet</button><span id="pullMsg" style="font-size:.8rem"></span></div>' : '') +
      '<div class="tabs" style="margin-top:16px"><button class="btn ' + (view.tab === "class" ? "" : "ghost") + '" data-tab="class">Class table (' + ids.length + ')</button>' +
      '<button class="btn ' + (view.tab === "qa" ? "" : "ghost") + '" data-tab="qa">Question analysis</button>' +
      '<button class="btn ' + (view.tab === "key" ? "" : "ghost") + '" data-tab="key">Answer key</button><span class="spacer"></span>' +
      '<button class="btn amber" id="csv"' + (ids.length ? "" : " disabled") + '>⬇ Export CSV</button><button class="btn ghost" id="clear"' + (ids.length ? "" : " disabled") + '>Clear all</button></div></section>';
    if (view.tab === "class") html += classTable(ids);
    else if (view.tab === "qa") html += qa(ids);
    else html += keyView();
    if (view.sel && store.learners[view.sel] && view.tab === "class") html += detail(view.sel);
    root.innerHTML = html;
    wire();
  }

  function classTable(ids) {
    if (!ids.length) return '<section class="card"><p>No results loaded yet. Ask learners to download their results file at the end of the quiz and hand it in through Teams, then drop the files above.</p></section>';
    var rows = ids.map(function (id) { var r = store.learners[id], R = marked(id); return { id: id, r: r, R: R }; });
    rows.sort(function (a, b) { return view.sort === "score" ? b.R.pct - a.R.pct : a.r.name.localeCompare(b.r.name); });
    var avg = Math.round(rows.reduce(function (s, x) { return s + x.R.pct; }, 0) / rows.length);
    return '<section class="card"><p>Class average <b>' + avg + ' %</b> · Click a learner to check and moderate their written answers.</p><div style="overflow-x:auto"><table class="res"><tr><th data-sort="name">Name ▾</th><th>Group</th><th data-sort="score">Score ▾</th><th>%</th><th>Band</th>' +
      Object.keys(QZ.units).map(function (k) { return "<th>" + esc(QZ.units[k].short) + "</th>"; }).join("") + '<th>Minutes</th><th>Left page</th><th>Moderated</th></tr>' +
      rows.map(function (x) {
        var mod = store.overrides[x.id] ? Object.keys(store.overrides[x.id]).filter(function (k) { return store.overrides[x.id][k] !== ""; }).length : 0;
        return '<tr data-id="' + esc(x.id) + '" style="cursor:pointer"><td><b>' + esc(x.r.name) + '</b></td><td>' + esc(x.r.group) + '</td><td>' + fmt(x.R.total) + ' / ' + x.R.max + '</td><td>' + x.R.pct + '</td>' +
          '<td><span class="bandpill" style="background:' + x.R.band.color + ';padding:2px 10px;font-size:.68rem">' + x.R.band.name + '</span></td>' +
          Object.keys(QZ.units).map(function (k) { return "<td>" + pc(x.R.units[k]) + " %</td>"; }).join("") +
          '<td>' + (x.r.minutes || "") + '</td><td>' + (x.r.leftPage ? '<b style="color:var(--red)">' + x.r.leftPage + '×</b>' : "0") + '</td><td>' + (mod ? mod + " Q" : "") + '</td></tr>';
      }).join("") + '</table></div></section>';
  }

  function detail(id) {
    var r = store.learners[id], R = marked(id), ov = store.overrides[id] || {};
    return '<section class="card" id="detail"><h2>' + esc(r.name) + ' · ' + esc(r.group) + ' · ' + fmt(R.total) + ' / ' + R.max + ' (' + R.pct + ' %)</h2>' +
      (r.pledge ? '<div class="info"><b>Learner\'s next step:</b> ' + esc(r.pledge) + '</div>' : '') +
      '<p style="font-size:.8rem">Written answers (amber boxes) are auto-marked against keyword criteria. Type a mark in the box to override it. Overrides save in this browser and are included in the CSV.</p>' +
      Qs.map(function (q) {
        var p = R.per[q.n], a = r.answers[q.n], k = E.KEY[q.n], shown;
        if (q.t === "mcq") shown = a !== undefined && a !== null ? "ABCDEF"[a] + ". " + q.opts[a] : "";
        else if (q.t === "multi") shown = (a || []).map(function (x) { return "ABCDEF"[x]; }).join(", ");
        else shown = (a || "") + (q.unit ? " " + q.unit : "");
        var writ = q.t === "theory" || q.t === "advtheory";
        var extra = "";
        if (writ) extra = '<p><b>Criteria met:</b> ' + (p.hit.length ? p.hit.map(esc).join("; ") : "none") + '</p>' + (k.model ? '<p><b>Mark scheme:</b></p><ul>' + k.model.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul>' : '');
        else extra = '<p><b>Correct:</b> ' + esc(E.correctAnswerText(q)) + (p.msg ? ' · ' + esc(p.msg) : '') + '</p>';
        return '<details class="qr"' + (writ ? " open" : "") + '><summary><span class="mk ' + p.status + '">' + fmt(p.score) + ' / ' + q.pts + '</span><span><b>Q' + q.n + '.</b> ' + esc(q.q.slice(0, 100)) + (q.q.length > 100 ? "…" : "") + '</span>' +
          (writ ? '<span class="spacer"></span><label style="font-size:.72rem">Override <input class="ov" type="number" min="0" max="' + q.pts + '" step="0.5" data-q="' + q.n + '" value="' + (ov[q.n] !== undefined ? ov[q.n] : "") + '" placeholder="' + (p.auto !== undefined ? p.auto : p.score) + '"></label>' : '') +
          '</summary><div class="body"><div class="yours">' + esc(shown) + '</div>' + extra + '</div></details>';
      }).join("") + '</section>';
  }

  function qa(ids) {
    if (!ids.length) return '<section class="card"><p>Load results to see which questions the class found hardest.</p></section>';
    var Rs = ids.map(marked);
    return '<section class="card"><h2>Average mark per question</h2><p style="font-size:.8rem">Red questions need re-teaching. Click a learner in the class table to see individual answers.</p><div class="heat">' +
      Qs.map(function (q) {
        var p = Math.round(Rs.reduce(function (s, R) { return s + R.per[q.n].score / q.pts; }, 0) / Rs.length * 100);
        var col = p >= 75 ? "#2E8B3E" : p >= 50 ? "#2F9AA6" : p >= 30 ? "#E8A33D" : "#C0392B";
        return '<div style="background:' + col + '" title="' + esc(q.q) + '">Q' + q.n + '<br>' + p + ' %</div>';
      }).join("") + '</div><h3>By topic</h3>' + Object.keys(QZ.units).map(function (k) {
        var p = Math.round(Rs.reduce(function (s, R) { return s + pc(R.units[k]); }, 0) / Rs.length);
        return '<div class="meter" style="--c:' + QZ.units[k].color + '"><div class="top"><span>' + esc(QZ.units[k].name) + '</span><span>' + p + ' %</span></div><div class="bar"><i style="width:' + p + '%"></i></div></div>';
      }).join("") + '</section>';
  }

  function keyView() {
    return '<section class="card"><h2>Answer key</h2>' + Qs.map(function (q) {
      var k = E.KEY[q.n], ans = E.correctAnswerText(q);
      var acc = k.accept ? " (also accepts: " + k.accept.slice(1).join(", ") + ")" : k.rng ? " (accepts " + k.rng[0] + " to " + k.rng[1] + ")" : "";
      return '<details class="qr"><summary><span class="mk correct">' + q.pts + ' pt</span><span><b>Q' + q.n + '.</b> ' + esc(q.q.slice(0, 110)) + (q.q.length > 110 ? "…" : "") + '</span></summary><div class="body">' +
        (ans ? '<p><b>Answer:</b> ' + esc(ans + acc) + '</p>' : '') +
        (k.model ? '<ul>' + k.model.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul>' : '') +
        '<p><b>Feedback:</b> ' + esc(k.ok) + '</p><p><b>Feedforward:</b> ' + esc(k.ff) + '</p></div></details>';
    }).join("") + '</section>';
  }

  function csv() {
    var head = ["Name", "Group", "Finished", "Minutes", "Left page", "Total", "Max", "Percent", "Band"].concat(Object.keys(QZ.units).map(function (k) { return QZ.units[k].short + " %"; }), Qs.map(function (q) { return "Q" + q.n; }), ["Next step"]);
    var lines = [head].concat(Object.keys(store.learners).map(function (id) {
      var r = store.learners[id], R = marked(id);
      return [r.name, r.group, r.finished, r.minutes, r.leftPage, R.total, R.max, R.pct, R.band.name].concat(Object.keys(QZ.units).map(function (k) { return pc(R.units[k]); }), Qs.map(function (q) { return R.per[q.n].score; }), [r.pledge || ""]);
    }));
    var txt = lines.map(function (l) { return l.map(function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + txt], { type: "text/csv" })); a.download = "core progress results.csv"; document.body.appendChild(a); a.click(); a.remove();
  }

  function pull() {
    var msg = document.getElementById("pullMsg"); msg.textContent = " Loading…";
    fetch(window.RESULTS_URL + "?code=" + encodeURIComponent(sessionStorage.getItem("tmc-teacher-code") || ""))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) { msg.textContent = " The results sheet refused the teacher code."; return; }
        d.records.forEach(function (r) { store.learners[idOf(r)] = r; }); save(); main();
        var m = document.getElementById("pullMsg"); if (m) m.textContent = " ✓ " + d.records.length + " results loaded.";
      }).catch(function () { msg.textContent = " Could not reach the results sheet. Check the web app URL in js/config.js."; });
  }

  function wire() {
    var drop = document.getElementById("drop"), file = document.getElementById("file");
    drop.onclick = function () { file.click(); };
    file.onchange = function () { if (file.files.length) addFiles(file.files); };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = function () { drop.classList.remove("over"); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove("over"); addFiles(e.dataTransfer.files); };
    Array.prototype.forEach.call(root.querySelectorAll("[data-tab]"), function (b) { b.onclick = function () { view.tab = b.dataset.tab; main(); }; });
    Array.prototype.forEach.call(root.querySelectorAll("[data-sort]"), function (b) { b.onclick = function () { view.sort = b.dataset.sort; main(); }; });
    Array.prototype.forEach.call(root.querySelectorAll("tr[data-id]"), function (tr) { tr.onclick = function () { view.sel = tr.dataset.id; main(); var d = document.getElementById("detail"); if (d) d.scrollIntoView({ behavior: "smooth" }); }; });
    Array.prototype.forEach.call(root.querySelectorAll("input.ov"), function (inp) {
      inp.onclick = function (e) { e.stopPropagation(); };
      inp.onchange = function () { var o = store.overrides[view.sel] = store.overrides[view.sel] || {}; o[inp.dataset.q] = inp.value; save(); var y = window.scrollY; main(); window.scrollTo(0, y); };
    });
    var c = document.getElementById("csv"); if (c) c.onclick = csv;
    var pl = document.getElementById("pull"); if (pl) pl.onclick = pull;
    var cl = document.getElementById("clear"); if (cl) cl.onclick = function () { if (confirm("Remove all loaded results and overrides from this browser?")) { store = { learners: {}, overrides: {} }; save(); view.sel = null; main(); } };
  }

  gate();
})();

/* Learner quiz: start page, one question at a time, compulsory answers, marking and a personal report. */
(function () {
  "use strict";
  var QZ = window.QUIZ, E = window.ENGINE, Qs = QZ.questions, STORE = "tmc-core-progress-v1";
  var app = document.getElementById("app"), mid = document.getElementById("topbarMid");
  var S = load() || fresh();
  var SECTIONS = {
    sentence: { title: "Section 1 · Complete the sentence", intro: "Type the one missing word. Spell technical words carefully: the core exam expects correct terminology." },
    num: { title: "Section 2 · Calculations", intro: "Use your calculator and type the number only. Convert units (mA → A, kW → W, minutes → seconds) before you start." },
    theory: { title: "Section 3 · Explain it", intro: "Write in full sentences. Aim for one clear point per mark, and explain why, not just what." },
    mcq: { title: "Section 4 · Multiple choice", intro: "Choose one answer. Read every option before you decide." },
    multi: { title: "Section 5 · Select all that apply", intro: "Tick every correct answer. Wrong ticks cancel out right ones, so don't guess." },
    advnum: { title: "Section 6 · Advanced calculations", intro: "Very advanced, multi-step problems at core exam level. Write your working on paper, then type the final number." },
    advtheory: { title: "Section 7 · Extended answers", intro: "6-mark questions, like the long questions in the core exam. Plan three points, analyse each one with 'because' or 'this means', and finish with a conclusion." }
  };

  function fresh() { return { stage: "start", name: "", group: "", answers: {}, flags: {}, cur: 0, started: null, finished: null, leaves: 0, pledge: "", a11y: {} }; }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { } }
  function load() { try { return JSON.parse(localStorage.getItem(STORE)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(sel) { return app.querySelector(sel); }

  /* accessibility toggles */
  function applyA11y() {
    document.body.classList.toggle("big", !!S.a11y.big); document.body.classList.toggle("cream", !!S.a11y.cream);
    document.getElementById("btnText").setAttribute("aria-pressed", !!S.a11y.big);
    document.getElementById("btnCream").setAttribute("aria-pressed", !!S.a11y.cream);
  }
  document.getElementById("btnText").onclick = function () { S.a11y.big = !S.a11y.big; applyA11y(); save(); };
  document.getElementById("btnCream").onclick = function () { S.a11y.cream = !S.a11y.cream; applyA11y(); save(); };

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && S.stage === "quiz") { S.leaves++; save(); }
  });

  /* ---------- answered? ---------- */
  function answered(q) {
    var a = S.answers[q.n];
    if (q.t === "mcq") return a !== undefined && a !== null && a !== "";
    if (q.t === "multi") return Array.isArray(a) && a.length > 0;
    if (q.t === "num" || q.t === "advnum") return a !== undefined && !isNaN(E.parseNumber(a));
    if (q.t === "theory" || q.t === "advtheory") return E.words(a) >= (q.minWords || 10);
    return a !== undefined && String(a).trim().length > 0;
  }
  function missing() { return Qs.filter(function (q) { return !answered(q); }); }

  /* ---------- modal ---------- */
  function modal(title, html, actions) {
    var m = document.getElementById("modal");
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalBody").innerHTML = html;
    var box = document.getElementById("modalActions"); box.innerHTML = "";
    actions.forEach(function (a) {
      var b = document.createElement("button"); b.className = "btn " + (a.cls || ""); b.textContent = a.label;
      b.onclick = function () { m.hidden = true; if (a.fn) a.fn(); }; box.appendChild(b);
    });
    m.hidden = false; box.lastChild.focus();
  }

  /* ---------- start page ---------- */
  function unitTags() {
    return Object.keys(QZ.units).map(function (k) { var u = QZ.units[k]; return '<span class="tag" style="background:' + u.color + '">' + esc(u.short) + "</span>"; }).join("");
  }
  function renderStart() {
    mid.innerHTML = "";
    var total = Qs.reduce(function (s, q) { return s + q.pts; }, 0);
    app.innerHTML =
      '<section class="hero card" style="padding:0"><img src="img/hero.png" alt=""><div class="hero-text">' +
      '<div class="kicker">T Level Engineering and Manufacturing · Core</div><h1>' + esc(QZ.title) + '</h1><p>' + esc(QZ.subtitle) + '</p>' +
      '<div class="tags">' + unitTags() + '</div></div></section>' +
      '<section class="card"><div class="facts">' +
      '<div class="fact"><b>' + Qs.length + ' questions</b><span>7 short sections</span></div>' +
      '<div class="fact"><b>' + total + ' marks</b><span>marked when you finish</span></div>' +
      '<div class="fact"><b>About 60 min</b><span>work at your own pace</span></div>' +
      '<div class="fact"><b>Calculator</b><span>and paper for working</span></div></div>' +
      '<h2>Before you start</h2><ul class="rules">' +
      '<li><b>Every question is compulsory.</b> You cannot submit until all ' + Qs.length + ' are answered.</li>' +
      '<li>Written answers need a minimum number of words. Write in full sentences.</li>' +
      '<li>Your answers save on this device as you go, so a refresh will not lose them.</li>' +
      '<li>Work on your own. Leaving this page during the quiz is recorded on your results.</li>' +
      '<li>When you submit, you get your marks, feedback on every question and a personal plan for the core exam.</li></ul>' +
      '<div class="form-row"><label class="field">Full name<input id="inName" autocomplete="name" value="' + esc(S.name) + '"></label>' +
      '<label class="field">Group<input id="inGroup" value="' + esc(S.group) + '"></label></div>' +
      '<label class="check"><input type="checkbox" id="inAgree"> <span>I will answer every question on my own, and I understand this assessment helps me prepare for my core exam.</span></label>' +
      '<div class="btn-row"><button class="btn amber" id="btnStart" disabled>Start the assessment ►</button></div></section>';
    var nm = $("#inName"), gp = $("#inGroup"), ag = $("#inAgree"), bt = $("#btnStart");
    function chk() { bt.disabled = !(nm.value.trim().length > 1 && gp.value.trim().length > 0 && ag.checked); }
    [nm, gp].forEach(function (i) { i.oninput = chk; }); ag.onchange = chk;
    bt.onclick = function () {
      S.name = nm.value.trim(); S.group = gp.value.trim(); S.stage = "quiz"; S.cur = 0; S.started = S.started || new Date().toISOString(); save(); render();
    };
  }

  /* ---------- quiz ---------- */
  function topProgress() {
    var done = Qs.filter(answered).length;
    mid.innerHTML = '<div class="progress"><span>' + done + ' / ' + Qs.length + ' answered</span><div class="bar"><i style="width:' + (done / Qs.length * 100) + '%"></i></div></div>';
  }
  function renderQuiz() {
    var q = Qs[S.cur], info = E.TYPE_INFO[q.t], first = S.cur === 0 || Qs[S.cur - 1].t !== q.t, sec = SECTIONS[q.t];
    var adv = q.t.indexOf("adv") === 0;
    var html = "";
    if (first) html += '<section class="card section-intro"><h2>' + esc(sec.title) + '</h2><p style="margin:0">' + esc(sec.intro) + '</p></section>';
    html += '<section class="card"><div class="qhead"><span class="qtype' + (adv ? " adv" : "") + '">' + info.icon + " " + esc(info.label) + '</span>' +
      '<span class="pts">Question ' + q.n + ' of ' + Qs.length + ' · ' + q.pts + ' mark' + (q.pts > 1 ? "s" : "") + '</span></div>' +
      '<div class="qtext" id="qtext">' + esc(q.q) + '</div>' + (q.img ? '<figure class="qfig"><img src="' + q.img + '" alt="Diagram for question ' + q.n + '"></figure>' : '') + '<div class="how">' + esc(info.how) + '</div><div style="margin-top:14px" id="ansBox"></div>' +
      '<div class="btn-row"><button class="btn ghost" id="btnPrev"' + (S.cur === 0 ? " disabled" : "") + '>◄ Back</button>' +
      '<button class="flagbtn" id="btnFlag" aria-pressed="' + !!S.flags[q.n] + '">⚑ Flag to check later</button><span class="spacer"></span>' +
      (S.cur < Qs.length - 1 ? '<button class="btn" id="btnNext">Next ►</button>' : '<button class="btn amber" id="btnNext">Review and submit ►</button>') + '</div></section>' +
      '<section class="card no-print"><b style="color:var(--navy)">Question map</b><div class="qmap" id="qmap"></div>' +
      '<div class="legend"><span>■ answered</span><span>□ not answered yet</span><span>⚑ flagged</span></div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="btnReview">Review all answers</button></div></section>';
    app.innerHTML = html;
    var box = $("#ansBox"), a = S.answers[q.n];
    if (q.t === "sentence") {
      box.innerHTML = '<input class="answer-input" id="inp" autocomplete="off" spellcheck="false" placeholder="Type the missing word" value="' + esc(a || "") + '">';
      $("#inp").oninput = function (e) { S.answers[q.n] = e.target.value; save(); topProgress(); mapUpdate(); };
    } else if (q.t === "num" || q.t === "advnum") {
      box.innerHTML = '<div class="num-wrap"><input class="answer-input" id="inp" inputmode="decimal" autocomplete="off" placeholder="Number only" value="' + esc(a || "") + '"><span class="unit">' + esc(q.unit || "") + '</span></div><div class="counter" id="cnt"></div>';
      var upd = function () { var v = $("#inp").value; var ok = v.trim() !== "" && !isNaN(E.parseNumber(v));
        $("#cnt").textContent = v.trim() === "" ? "" : (ok ? "✓ Number recorded" : "Type a number only, for example 12.5"); $("#cnt").className = "counter" + (ok ? " ok" : ""); };
      $("#inp").oninput = function (e) { S.answers[q.n] = e.target.value; save(); upd(); topProgress(); mapUpdate(); }; upd();
    } else if (q.t === "theory" || q.t === "advtheory") {
      box.innerHTML = '<textarea class="answer-input" id="inp" placeholder="Write your answer in full sentences…">' + esc(a || "") + '</textarea><div class="counter" id="cnt"></div>';
      var updT = function () { var w = E.words($("#inp").value), need = q.minWords || 10;
        $("#cnt").textContent = w + " words" + (w < need ? " · write at least " + need + " words to continue" : " · ✓ enough to submit. More detail earns more marks.");
        $("#cnt").className = "counter" + (w >= need ? " ok" : ""); };
      $("#inp").oninput = function (e) { S.answers[q.n] = e.target.value; save(); updT(); topProgress(); mapUpdate(); }; updT();
    } else {
      var multi = q.t === "multi";
      box.innerHTML = '<div class="opts" role="' + (multi ? "group" : "radiogroup") + '" aria-labelledby="qtext">' + q.opts.map(function (o, i) {
        var sel = multi ? (Array.isArray(a) && a.indexOf(i) >= 0) : String(a) === String(i);
        return '<label class="opt' + (sel ? " sel" : "") + '"><input type="' + (multi ? "checkbox" : "radio") + '" name="o" value="' + i + '"' + (sel ? " checked" : "") + '><span><span class="letter">' + "ABCDEF"[i] + '.</span> ' + esc(o) + '</span></label>';
      }).join("") + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll("input"), function (inp) {
        inp.onchange = function () {
          if (multi) { S.answers[q.n] = Array.prototype.filter.call(box.querySelectorAll("input"), function (x) { return x.checked; }).map(function (x) { return Number(x.value); }); }
          else S.answers[q.n] = Number(inp.value);
          Array.prototype.forEach.call(box.querySelectorAll(".opt"), function (l) { l.classList.toggle("sel", l.querySelector("input").checked); });
          save(); topProgress(); mapUpdate();
        };
      });
    }
    var inp = $("#inp"); if (inp) { inp.focus(); if (inp.tagName === "INPUT") inp.onkeydown = function (e) { if (e.key === "Enter") $("#btnNext").click(); }; }
    $("#btnPrev").onclick = function () { go(S.cur - 1); };
    $("#btnNext").onclick = function () {
      if (!answered(q)) { nudge(q); return; }
      if (S.cur < Qs.length - 1) go(S.cur + 1); else { S.stage = "review"; save(); render(); }
    };
    $("#btnFlag").onclick = function () { S.flags[q.n] = !S.flags[q.n]; this.setAttribute("aria-pressed", !!S.flags[q.n]); save(); mapUpdate(); };
    $("#btnReview").onclick = function () { S.stage = "review"; save(); render(); };
    mapUpdate(); topProgress();
  }
  function nudge(q) {
    var msg = (q.t === "theory" || q.t === "advtheory") ? "This written answer needs at least " + (q.minWords || 10) + " words. Every question is compulsory, so give it your best attempt: a partly right answer still earns marks."
      : (q.t === "num" || q.t === "advnum") ? "Type a number to continue. If you are stuck, write down what you know, try the formula, and give your best answer."
        : "Every question is compulsory. Choose or type an answer to continue.";
    modal("Answer this question first", "<p>" + esc(msg) + "</p>", [{ label: "Back to the question", fn: function () { var i = $("#inp"); if (i) i.focus(); } }]);
  }
  function go(i) { S.cur = Math.max(0, Math.min(Qs.length - 1, i)); save(); renderQuiz(); window.scrollTo(0, 0); }
  function mapUpdate() {
    var m = $("#qmap"); if (!m) return;
    m.innerHTML = Qs.map(function (q, i) {
      return '<button type="button" data-i="' + i + '" class="' + (answered(q) ? "done " : "") + (i === S.cur ? "cur " : "") + (S.flags[q.n] ? "flag" : "") + '" aria-label="Question ' + q.n + (answered(q) ? ", answered" : ", not answered") + '">' + q.n + "</button>";
    }).join("");
    Array.prototype.forEach.call(m.querySelectorAll("button"), function (b) { b.onclick = function () { go(Number(b.dataset.i)); }; });
  }

  /* ---------- review ---------- */
  function renderReview() {
    topProgress();
    var miss = missing();
    app.innerHTML = '<section class="card"><h2>Review your answers</h2>' +
      (miss.length ? '<div class="warn"><b>' + miss.length + ' question' + (miss.length > 1 ? "s are" : " is") + ' not finished.</b> Every question is compulsory. Click a question below to complete it.</div>'
        : '<div class="info"><b>All ' + Qs.length + ' questions are answered.</b> Check any flagged questions, then submit. You cannot change your answers after submitting.</div>') +
      '<ul class="review-list">' + Qs.map(function (q, i) {
        var a = S.answers[q.n], done = answered(q), shown;
        if (q.t === "mcq") shown = a !== undefined && a !== null && a !== "" ? "ABCDEF"[a] + ". " + q.opts[a] : "";
        else if (q.t === "multi") shown = (a || []).map(function (x) { return "ABCDEF"[x]; }).join(", ");
        else shown = String(a || "");
        if (shown.length > 70) shown = shown.slice(0, 70) + "…";
        return '<li class="' + (done ? "" : "missing") + '"><span><b>Q' + q.n + '.</b> ' + esc(shown || "No answer yet") + (S.flags[q.n] ? " ⚑" : "") + '</span>' +
          '<span class="st">' + (done ? "✓" : "✗ to do") + ' <button class="btn ghost" style="padding:4px 12px" data-i="' + i + '">Edit</button></span></li>';
      }).join("") + '</ul><div class="btn-row"><button class="btn ghost" id="btnBack">◄ Back to questions</button><span class="spacer"></span>' +
      '<button class="btn green" id="btnSubmit"' + (miss.length ? " disabled" : "") + '>Submit for marking ✓</button></div></section>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-i]"), function (b) { b.onclick = function () { S.stage = "quiz"; go(Number(b.dataset.i)); }; });
    $("#btnBack").onclick = function () { S.stage = "quiz"; var m = missing(); go(m.length ? Qs.indexOf(m[0]) : S.cur); };
    $("#btnSubmit").onclick = function () {
      if (missing().length) return;
      modal("Submit your assessment?", "<p>You have answered all " + Qs.length + " questions. Once you submit, your answers are locked and marked straight away.</p>", [
        { label: "Not yet", cls: "ghost" }, { label: "Submit now", cls: "green", fn: submit }]);
    };
  }

  function submit() {
    S.stage = "marking"; S.finished = new Date().toISOString(); save();
    mid.innerHTML = "";
    app.innerHTML = '<section class="card marking"><div class="gear-spin">⚙️</div><h2>Marking your work…</h2><p>Checking ' + Qs.length + ' answers and building your personal feedback.</p></section>';
    setTimeout(function () { S.stage = "results"; save(); render(); confetti(); }, 1800);
  }

  /* ---------- personal feedback ---------- */
  var BADGES = [
    { id: "finisher", ic: "🏁", name: "Finisher", txt: "Answered all 35 questions", test: function () { return true; } },
    { id: "A", ic: "🧲", name: "Field Master", txt: "75 %+ in electrical and magnetic principles", test: function (R) { return pc(R.units.A) >= 75; } },
    { id: "B", ic: "⚡", name: "Circuit Solver", txt: "75 %+ in circuits, AC and protection", test: function (R) { return pc(R.units.B) >= 75; } },
    { id: "C", ic: "🏗️", name: "Sector Specialist", txt: "75 %+ in engineering sectors", test: function (R) { return pc(R.units.C) >= 75; } },
    { id: "D", ic: "📐", name: "Design Thinker", txt: "75 %+ in design principles", test: function (R) { return pc(R.units.D) >= 75; } },
    { id: "adv", ic: "🚀", name: "Stretch Challenger", txt: "50 %+ on the advanced questions", test: function (R) { return pc(R.skills.advanced) >= 50; } }
  ];
  function pc(o) { return o && o.max ? Math.round(o.score / o.max * 100) : 0; }
  function fmt(n) { return (Math.round(n * 2) / 2).toString(); }
  function mins() { var t = (new Date(S.finished) - new Date(S.started)) / 60000; return isFinite(t) ? Math.max(1, Math.round(t)) : null; }

  function personalMessage(R) {
    var first = S.name.split(" ")[0], units = Object.keys(R.units).sort(function (a, b) { return pc(R.units[b]) - pc(R.units[a]); });
    var best = QZ.units[units[0]], worst = QZ.units[units[units.length - 1]];
    var sk = Object.keys(R.skills).sort(function (a, b) { return pc(R.skills[b]) - pc(R.skills[a]); });
    var p = [];
    var open = { secure: "Excellent work, " + first + ". You scored " + R.pct + " %, which puts you in the Secure band.",
      developing: "Good effort, " + first + ". You scored " + R.pct + " %, which puts you in the Developing band.",
      emerging: first + ", you scored " + R.pct + " %, which puts you in the Emerging band.",
      notyet: first + ", you scored " + R.pct + " %. This is below where you need to be, and that is exactly why we test now and not in the exam." }[R.band.key];
    p.push(open + " " + R.band.line);
    p.push("Your strongest area is <b>" + esc(best.short) + "</b> (" + pc(R.units[units[0]]) + " %). Your biggest gap is <b>" + esc(worst.short) + "</b> (" + pc(R.units[units[units.length - 1]]) + " %), so that is where your revision time will earn the most marks.");
    var calc = pc(R.skills.calc), wr = pc(R.skills.writing), rec = pc(R.skills.recall);
    if (calc < 50 && rec >= 60) p.push("You know the facts, but calculations are costing you marks. In the core exam, calculations carry a large share of the paper, so practise them little and often.");
    else if (wr < 50 && calc >= 60) p.push("Your calculations are a strength, but your written explanations are losing marks. The core exam rewards explanations that give a reason for each point, so practise 'point, because, this means'.");
    else if (rec < 50) p.push("Key vocabulary is holding you back. You cannot explain or calculate with confidence until the definitions and units are secure, so make flash cards your first job.");
    else p.push("Your best skill was <b>" + esc(E.SKILLS[sk[0]]) + "</b> and your weakest was <b>" + esc(E.SKILLS[sk[sk.length - 1]]) + "</b>.");
    if (pc(R.skills.advanced) >= 50) p.push("You handled the advanced section well. That is core exam standard, so aim for the top band.");
    else p.push("The advanced section is the standard of the longer core exam questions. Use the plan below to build up to it.");
    return p;
  }

  function errorAdvice(R) {
    var a = [];
    if (R.notes.prefix) a.push("<b>Unit prefixes</b> (" + R.notes.prefix + " answer" + (R.notes.prefix > 1 ? "s" : "") + " out by a factor of 1000): before every calculation, write each value in base units (A, V, Ω, F, H, W, s).");
    if (R.notes.rounding) a.push("<b>Rounding</b> (" + R.notes.rounding + " answer" + (R.notes.rounding > 1 ? "s" : "") + " just outside the range): keep full calculator values until the last step, then round to the decimal places asked for.");
    if (R.notes.spelling) a.push("<b>Spelling of technical words</b> (" + R.notes.spelling + "): add these words to your flash cards and spell them out loud.");
    var shortW = Qs.filter(function (q) { return (q.t === "theory" || q.t === "advtheory") && R.per[q.n].score < q.pts / 2; }).length;
    if (shortW) a.push("<b>Written answers</b> (" + shortW + " scored under half marks): write one point per mark, explain each with 'because', and use the technical words from the lesson.");
    return a;
  }

  function priorities(R) {
    return Object.keys(R.units).sort(function (a, b) { return pc(R.units[a]) - pc(R.units[b]); }).slice(0, 3).map(function (k) { return k; });
  }

  function answerShown(q, a) {
    if (q.t === "mcq") return a !== undefined && a !== null ? "ABCDEF"[a] + ". " + q.opts[a] : "";
    if (q.t === "multi") return (a || []).map(function (x) { return "ABCDEF"[x] + ". " + q.opts[x]; }).join("\n");
    if (q.t === "num" || q.t === "advnum") return (a || "") + " " + (q.unit || "");
    return a || "";
  }

  function renderResults() {
    mid.innerHTML = "";
    var R = E.markAll(QZ, S.answers), C = 2 * Math.PI * 86, pr = priorities(R), m = mins();
    var html = '<section class="card"><div class="score-wrap"><div class="ring"><svg width="200" height="200"><circle cx="100" cy="100" r="86" fill="none" stroke="#e3e9f2" stroke-width="18"/>' +
      '<circle id="arc" cx="100" cy="100" r="86" fill="none" stroke="' + R.band.color + '" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" style="transition:stroke-dashoffset 1.4s ease"/></svg>' +
      '<div class="ring-txt"><span class="big">' + R.pct + '%</span><span class="small">' + fmt(R.total) + ' / ' + R.max + ' marks</span></div></div>' +
      '<div><div class="kicker" style="color:#9c6a12;letter-spacing:.15em;font-weight:bold;font-size:.7rem">YOUR RESULTS</div><h1 style="margin:.2em 0">' + esc(S.name) + '</h1>' +
      '<p style="margin:.2em 0">Group ' + esc(S.group) + ' · ' + new Date(S.finished).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) + (m ? ' · ' + m + ' min' : '') + '</p>' +
      '<p><span class="bandpill" style="background:' + R.band.color + '">' + R.band.name + '</span></p>' +
      '<p style="font-size:.75rem;color:var(--muted)">Written answers are marked automatically against the mark scheme. Your teacher checks and confirms these marks.</p></div></div><div id="sent" class="info"></div></section>';

    html += '<section class="card"><h2>Your personal feedback</h2>' + personalMessage(R).map(function (t) { return "<p>" + t + "</p>"; }).join("") + '</section>';

    html += '<section class="card"><h2>How you did in each topic</h2>' + Object.keys(QZ.units).map(function (k) {
      var u = QZ.units[k], r = R.units[k];
      return '<div class="meter" style="--c:' + u.color + '"><div class="top"><span>' + esc(u.short) + ' <span style="color:var(--muted);font-weight:normal">(' + esc(u.deck) + ')</span></span><span>' + pc(r) + ' %</span></div><div class="bar"><i style="width:' + pc(r) + '%"></i></div></div>';
    }).join("") + '<h3>Skills</h3>' + Object.keys(E.SKILLS).map(function (k) {
      var r = R.skills[k]; return '<div class="meter" style="--c:#2F9AA6"><div class="top"><span>' + esc(E.SKILLS[k]) + '</span><span>' + pc(r) + ' %</span></div><div class="bar"><i style="width:' + pc(r) + '%"></i></div></div>';
    }).join("") + '</section>';

    html += '<section class="card"><h2>Badges</h2><div class="badges">' + BADGES.map(function (b) {
      var got = b.test(R); return '<div class="badge' + (got ? "" : " locked") + '"><div class="ic">' + b.ic + '</div><b>' + b.name + '</b><span>' + b.txt + (got ? "" : " · not yet") + '</span></div>';
    }).join("") + '</div></section>';

    var adv = errorAdvice(R);
    html += '<section class="card"><h2>Feedforward: your plan for the core exam</h2><p>These are your three priority topics, weakest first. Do the actions in order.</p>' +
      pr.map(function (k, i) { var u = QZ.units[k]; return '<div class="prio" style="--c:' + u.color + '"><h3>Priority ' + (i + 1) + ': ' + esc(u.name) + ' (' + pc(R.units[k]) + ' %)</h3><ol>' + u.plan.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + '</ol></div>'; }).join("") +
      (adv.length ? '<h3>Habits to fix in the exam</h3><ul>' + adv.map(function (s) { return "<li>" + s + "</li>"; }).join("") + '</ul>' : '') +
      '<h3>Your 3-week revision plan</h3><table class="plan"><tr><th>Week</th><th>Focus</th><th>What to do</th></tr>' +
      '<tr><td>1</td><td>' + esc(QZ.units[pr[0]].short) + '</td><td>Actions 1 and 2 above. Redo every question from this quiz in that topic until you get full marks.</td></tr>' +
      '<tr><td>2</td><td>' + esc(QZ.units[pr[1]].short) + '</td><td>Actions 1 and 2 above, plus one timed core exam question (about 1 minute per mark).</td></tr>' +
      '<tr><td>3</td><td>' + esc(QZ.units[pr[2]].short) + ' and a mixed review</td><td>Final actions for all three topics, then a timed past-paper section. Compare it with the mark scheme.</td></tr></table></section>';

    var st = S.steps || ["", "", ""];
    html += '<section class="card pledge" id="stepsCard"><h2>My 3 next steps</h2><p>Using your feedback and plan above, write <b>three specific things</b> you will do to prepare for your core exam. You must complete all three to unlock your question-by-question feedback. Your teacher will see them.</p>' +
      [0, 1, 2].map(function (i) {
        return '<label class="field" style="margin:12px 0">Next step ' + (i + 1) + '<input class="answer-input step" data-i="' + i + '" value="' + esc(st[i]) + '" placeholder="' + ["For example: I will redo questions 13 to 16 until I get them all right.", "For example: I will make flash cards for every unit and symbol in Unit 8.1.", "For example: I will do one timed core exam question every Friday."][i] + '"></label>';
      }).join("") + '<div class="counter" id="stepsMsg"></div><div class="btn-row"><button class="btn green" id="btnSteps">' + (S.stepsDone ? "✓ Update my next steps" : "Save my next steps and unlock my feedback") + '</button></div></section>';

    html += '<section class="card" id="qbq"' + (S.stepsDone ? '' : ' hidden') + '><h2>Question by question</h2><p class="no-print" style="font-size:.8rem;color:var(--muted)">Open each question to see your answer, the correct answer and what to do next.</p>' +
      Qs.map(function (q) {
        var r = R.per[q.n], k = E.KEY[q.n], ca = E.correctAnswerText(q), body = "";
        body += '<p><b>Question:</b> ' + esc(q.q) + '</p>' + (q.img ? '<figure class="qfig small"><img src="' + q.img + '" alt=""></figure>' : '') + '<p><b>Your answer:</b></p><div class="yours">' + esc(answerShown(q, S.answers[q.n])) + '</div>';
        if (ca) body += '<p><b>Correct answer:</b> ' + esc(ca) + '</p>';
        if (r.msg) body += '<p><b>Note:</b> ' + esc(r.msg) + '</p>';
        if (r.hit) {
          body += '<p><b>Mark scheme points you covered:</b></p><ul>' + (r.hit.length ? r.hit.map(function (h) { return '<li class="crit-hit">✓ ' + esc(h) + '</li>'; }).join("") : '<li>None yet</li>') + '</ul>';
          if (r.miss.length) body += '<p><b>To gain more marks, also explain:</b></p><ul>' + r.miss.map(function (h) { return '<li class="crit-miss">○ ' + esc(h) + '</li>'; }).join("") + '</ul>';
          if (k.model) body += '<p><b>Model answer points:</b></p><ul>' + k.model.filter(function (x) { return !/^Bands:/.test(x); }).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul>';
        }
        body += '<p><b>' + (r.status === "correct" ? "Feedback" : "Feedforward") + ':</b> ' + esc(r.feedback) + '</p>';
        return '<details class="qr"><summary><span class="mk ' + r.status + '">' + fmt(r.score) + ' / ' + q.pts + '</span><span><b>Q' + q.n + '.</b> ' + esc(q.q.length > 90 ? q.q.slice(0, 90) + "…" : q.q) + '</span></summary><div class="body">' + body + '</div></details>';
      }).join("") + '</section>';

    html += '<section class="card"><h2>Keep your report</h2><p>Save this report as a PDF for your revision folder. It includes your plan and feedback on every question.</p>' +
      '<div class="btn-row"><button class="btn ghost" id="btnPrint">🖨 Save my report as PDF</button><button class="btn amber" id="btnDl"' + (window.RESULTS_URL && S.sent === "yes" ? ' hidden' : '') + '>⬇ Download results file for your teacher</button></div>' +
      (window.RESULTS_URL ? '' : '<div class="info no-print"><b>Hand in:</b> download your results file and upload it to the Teams assignment. Keep the PDF for your revision.</div>') +
      '<p class="no-print" style="font-size:.68rem;color:var(--muted);margin-top:18px">Teacher: to reset this device for another learner, <a href="#" id="lnkReset">reset the quiz</a>.</p></section>';
    app.innerHTML = html;
    setTimeout(function () { var arc = document.getElementById("arc"); if (arc) arc.style.strokeDashoffset = C * (1 - R.pct / 100); }, 80);
    var stepInputs = app.querySelectorAll("input.step");
    function stepsOk() { return Array.prototype.every.call(stepInputs, function (x) { return E.words(x.value) >= 5; }); }
    function stepsMsg() { var n = Array.prototype.filter.call(stepInputs, function (x) { return E.words(x.value) >= 5; }).length;
      $("#stepsMsg").textContent = n + " of 3 next steps written (at least 5 words each)"; $("#stepsMsg").className = "counter" + (n === 3 ? " ok" : ""); }
    Array.prototype.forEach.call(stepInputs, function (x) { x.oninput = function () { S.steps = Array.prototype.map.call(stepInputs, function (y) { return y.value; }); save(); stepsMsg(); }; });
    stepsMsg();
    $("#btnSteps").onclick = function () {
      if (!stepsOk()) { modal("Write all three next steps", "<p>Each next step needs at least 5 words. Make each one specific: what you will do, and when.</p>", [{ label: "OK" }]); return; }
      S.steps = Array.prototype.map.call(stepInputs, function (y) { return y.value.trim(); });
      S.pledge = S.steps.map(function (x, i) { return (i + 1) + ") " + x; }).join("  ");
      S.stepsDone = true; save(); sendPledge(true);
      $("#qbq").hidden = false; $("#btnSteps").textContent = "✓ Update my next steps";
      $("#qbq").scrollIntoView({ behavior: "smooth" });
    };
    sentBadge(); if (S.sent !== "yes") sendResults(R);
    window.__showDl = function () { var b = document.getElementById("btnDl"); if (b) b.hidden = S.sent === "yes" && !!window.RESULTS_URL; };
    $("#btnPrint").onclick = function () { Array.prototype.forEach.call(app.querySelectorAll("details"), function (d) { d.open = true; }); window.print(); };
    $("#btnDl").onclick = function () { download(R); };
    $("#lnkReset").onclick = function (e) {
      e.preventDefault();
      modal("Reset for a new learner?", '<p>This deletes the saved answers on this device. Download the results file first.</p><label class="field">Teacher code<input id="code" type="password"></label>', [
        { label: "Cancel", cls: "ghost" }, { label: "Reset", fn: function () { var c = document.getElementById("code").value; if (c === "TMC2026") { localStorage.removeItem(STORE); S = fresh(); applyA11y(); render(); } } }]);
    };
  }

  function record(R) {
    S.id = S.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    return { app: "tmc-core-progress", version: 1, id: S.id, name: S.name, group: S.group, started: S.started, finished: S.finished, minutes: mins(), leftPage: S.leaves,
      pledge: S.pledge, answers: S.answers, total: R.total, max: R.max, pct: R.pct, band: R.band.name,
      units: Object.keys(R.units).reduce(function (o, k) { o[k] = pc(R.units[k]); return o; }, {}),
      marks: Object.keys(R.per).reduce(function (o, k) { o[k] = R.per[k].score; return o; }, {}) };
  }

  /* automatic sending to the teacher's results sheet */
  function post(obj) {
    return fetch(window.RESULTS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(obj) });
  }
  function sendResults(R, tries) {
    if (!window.RESULTS_URL) { S.sent = "off"; save(); return; }
    tries = tries || 0;
    post(record(R)).then(function () { S.sent = "yes"; save(); sentBadge(); if (window.__showDl) window.__showDl(); })
      .catch(function () { S.sent = "retry"; save(); sentBadge(); if (window.__showDl) window.__showDl(); if (tries < 20) setTimeout(function () { sendResults(R, tries + 1); }, Math.min(60000, 3000 * (tries + 1))); });
  }
  function sentBadge() {
    var el = document.getElementById("sent"); if (!el) return;
    if (S.sent === "yes") { el.className = "info"; el.innerHTML = "<b>✓ Your results have been sent to your teacher.</b> Now read your feedback and write your 3 next steps below."; }
    else if (S.sent === "retry") { el.className = "warn"; el.innerHTML = "<b>Sending your results…</b> Keep this page open until this says sent. It retries automatically. If it never sends, use the Download button at the bottom and give the file to your teacher."; }
    else if (S.sent === "off") { el.className = "info"; el.innerHTML = "Download your results file below and hand it in to your teacher."; }
    else { el.className = "info"; el.innerHTML = "Sending your results to your teacher…"; }
  }
  var pledgeTimer = null;
  function sendPledge(now) {
    if (!window.RESULTS_URL || !S.id) return;
    clearTimeout(pledgeTimer);
    pledgeTimer = setTimeout(function () { post({ kind: "pledge", id: S.id, pledge: S.pledge }).catch(function () { setTimeout(function () { sendPledge(true); }, 5000); }); }, now ? 0 : 1500);
  }

  function download(R) {
    var rec = record(R);
    var blob = new Blob([JSON.stringify(rec, null, 1)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = (S.name + " " + S.group + " core progress results.json").replace(/[^\w .-]/g, "");
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    var x = c.getContext("2d"), W = c.width = innerWidth, H = c.height = innerHeight, cols = ["#E8A33D", "#2F9AA6", "#16335B", "#3AA14A"], P = [];
    for (var i = 0; i < 140; i++) P.push({ x: Math.random() * W, y: -20 - Math.random() * H * .5, r: 4 + Math.random() * 6, c: cols[i % 4], vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, a: Math.random() * 6 });
    var t = 0; (function f() { x.clearRect(0, 0, W, H); P.forEach(function (p) { p.y += p.vy; p.x += p.vx; p.a += .1; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); x.restore(); });
      if (++t < 220) requestAnimationFrame(f); else c.remove(); })();
  }

  function render() {
    applyA11y();
    if (S.stage === "start") renderStart();
    else if (S.stage === "quiz") renderQuiz();
    else if (S.stage === "review") renderReview();
    else if (S.stage === "marking") { S.stage = "results"; save(); renderResults(); }
    else renderResults();
    app.focus({ preventScroll: true });
  }
  render();
})();

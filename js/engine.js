/* Marking engine shared by the learner quiz and the teacher page. */
(function () {
  "use strict";
  var SECRET = "TMC-core-progress-2026";

  function decodeKey(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length);
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  }
  var KEY = decodeKey(window.QKEY);

  var TYPE_INFO = {
    sentence: { label: "Complete the sentence", skill: "recall", icon: "✏️", how: "Type the missing word." },
    num: { label: "Calculation", skill: "calc", icon: "🧮", how: "Type the number only. No units." },
    theory: { label: "Explain it", skill: "writing", icon: "💬", how: "Write in full sentences. Aim for one sentence per mark." },
    mcq: { label: "Multiple choice", skill: "recall", icon: "🔘", how: "Choose one answer." },
    multi: { label: "Select all that apply", skill: "recall", icon: "☑️", how: "Tick every correct answer. Wrong ticks lose marks." },
    advnum: { label: "Advanced calculation", skill: "advanced", icon: "🚀", how: "Multi-step. Type the number only." },
    advtheory: { label: "Extended answer", skill: "advanced", icon: "📝", how: "Plan first. Use 'because' and 'this means' to analyse, and finish with a conclusion." }
  };
  var SKILLS = {
    recall: "Knowledge and vocabulary",
    calc: "Calculations",
    writing: "Explaining (written answers)",
    advanced: "Advanced challenge"
  };

  function norm(s) {
    return String(s || "").toLowerCase().replace(/[“”"'’.,;:!?()]/g, " ").replace(/\s+/g, " ").trim().replace(/^(the|a|an) /, "");
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function words(s) { return (String(s || "").trim().match(/[A-Za-z0-9µΩ°%]+/g) || []).length; }

  function parseNumber(s) {
    var t = String(s || "").trim().replace(/\s+/g, "");
    if (/^-?\d+,\d{1,2}$/.test(t)) t = t.replace(",", ".");
    t = t.replace(/,/g, "").replace(/[^0-9.eE+\-]/g, "");
    if (t === "" || t === "." || t === "-") return NaN;
    return parseFloat(t);
  }

  function markSentence(q, k, ans) {
    var a = norm(ans), acc = k.accept.map(norm);
    if (acc.indexOf(a) >= 0) return { score: q.pts, notes: [] };
    for (var i = 0; i < acc.length; i++) {
      var tol = acc[i].length >= 8 ? 2 : (acc[i].length >= 4 ? 1 : 0);
      if (tol && lev(a, acc[i]) <= tol) return { score: q.pts, notes: ["spelling"], msg: "Accepted, but check the spelling: \"" + k.accept[0] + "\". Spelling counts in the core exam for technical words." };
      if (a.split(" ").indexOf(acc[i]) >= 0 && acc[i].length > 2) return { score: q.pts, notes: [] };
    }
    return { score: 0, notes: [] };
  }

  function markNum(q, k, ans) {
    var v = parseNumber(ans), lo = k.rng[0], hi = k.rng[1], target = parseFloat(k.ans), eps = 1e-9;
    if (isNaN(v)) return { score: 0, notes: ["nan"], msg: "That was not a number. In the exam, always give a numerical answer, even if you are unsure." };
    if (v >= lo - eps && v <= hi + eps) return { score: q.pts, notes: [] };
    var ratio = v / target, notes = [], msg = "";
    var prefix = [1e3, 1e-3, 1e6, 1e-6, 1e9, 1e-9].some(function (f) { return Math.abs(ratio / f - 1) < 0.02; });
    if (prefix) { notes.push("prefix"); msg = "Your working looks right, but the answer is out by a power of 1000. Check your unit prefixes (m, µ, k, M) and the unit the question asks for."; }
    else if (Math.abs(ratio - 1) < 0.02) { notes.push("rounding"); msg = "Very close. Check your rounding and the number of decimal places asked for, and do not round until the final step."; }
    else if (Math.abs(ratio + 1) < 0.02) { notes.push("sign"); msg = "Right size, wrong sign. Check the direction of the current or the order of subtraction."; }
    var part = 0;
    if (notes.length) part = q.pts >= 3 ? q.pts - 1 : 1;
    return { score: part, notes: notes, msg: msg };
  }

  function markMcq(q, k, ans) {
    return { score: (ans !== null && ans !== undefined && k.ans.indexOf(Number(ans)) >= 0) ? q.pts : 0, notes: [] };
  }

  function markMulti(q, k, ans) {
    var sel = (ans || []).map(Number), good = 0, bad = 0;
    sel.forEach(function (i) { if (k.ans.indexOf(i) >= 0) good++; else bad++; });
    var raw = (good - bad) / k.ans.length * q.pts;
    var score = Math.max(0, Math.round(raw * 2) / 2);
    var msg = "";
    if (score < q.pts) msg = "You ticked " + good + " of the " + k.ans.length + " correct options" + (bad ? " and " + bad + " wrong one" + (bad > 1 ? "s" : "") : "") + ".";
    return { score: score, notes: [], msg: msg };
  }

  function markTheory(q, k, ans) {
    var text = String(ans || ""), w = words(text), hit = [], miss = [], raw = 0;
    var gots = [];
    k.crit.forEach(function (c) {
      var n = 0;
      c.re.forEach(function (r) { if (new RegExp(r, "i").test(text)) n++; });
      var got = Math.min(c.max, n);
      if (c.pairWith !== undefined) got = Math.min(got, gots[c.pairWith]);
      gots.push(got);
      raw += got;
      (got > 0 ? hit : miss).push(c.label);
    });
    var score = Math.min(q.pts, raw);
    if (k.band) {
      if (w < 45) score = Math.min(score, 3);
      else if (w < 80) score = Math.min(score, 5);
      var hasAnalysis = hit.some(function (l) { return /^Analysis/.test(l); });
      if (!hasAnalysis) score = Math.min(score, 4);
    } else {
      score = Math.min(score, Math.max(0, Math.floor(w / 5)));
    }
    return { score: score, notes: ["provisional"], hit: hit, miss: miss, words: w };
  }

  function markOne(q, ans) {
    var k = KEY[q.n], r;
    if (q.t === "sentence") r = markSentence(q, k, ans);
    else if (q.t === "num" || q.t === "advnum") r = markNum(q, k, ans);
    else if (q.t === "mcq") r = markMcq(q, k, ans);
    else if (q.t === "multi") r = markMulti(q, k, ans);
    else r = markTheory(q, k, ans);
    r.max = q.pts;
    r.status = r.score >= q.pts ? "correct" : (r.score > 0 ? "partial" : "wrong");
    r.feedback = r.status === "correct" ? k.ok : k.ff;
    return r;
  }

  function correctAnswerText(q) {
    var k = KEY[q.n];
    if (q.t === "sentence") return k.accept[0];
    if (q.t === "num" || q.t === "advnum") return k.ans + " " + (q.unit || "");
    if (q.t === "mcq" || q.t === "multi") return k.ans.map(function (i) { return q.opts[i]; }).join("; ");
    return null;
  }

  function band(pct) {
    if (pct >= 75) return { key: "secure", name: "Secure", color: "#2E8B3E", line: "You are on track for the core exam." };
    if (pct >= 50) return { key: "developing", name: "Developing", color: "#2F9AA6", line: "A solid base, with clear gaps to close before the core exam." };
    if (pct >= 30) return { key: "emerging", name: "Emerging", color: "#E8A33D", line: "Some secure knowledge, but you need a structured revision plan now." };
    return { key: "notyet", name: "Not yet secure", color: "#C0392B", line: "You need to rebuild the basics. Start the plan below this week." };
  }

  function markAll(quiz, answers, overrides) {
    overrides = overrides || {};
    var per = {}, total = 0, max = 0, units = {}, skills = {}, notes = { prefix: 0, rounding: 0, spelling: 0, nan: 0 };
    quiz.questions.forEach(function (q) {
      var r = markOne(q, answers[q.n]);
      if (overrides[q.n] !== undefined && overrides[q.n] !== "") { r.auto = r.score; r.score = Math.max(0, Math.min(q.pts, Number(overrides[q.n]))); r.overridden = true;
        r.status = r.score >= q.pts ? "correct" : (r.score > 0 ? "partial" : "wrong"); }
      per[q.n] = r; total += r.score; max += q.pts;
      var u = units[q.u] = units[q.u] || { score: 0, max: 0 }; u.score += r.score; u.max += q.pts;
      var sk = TYPE_INFO[q.t].skill, s = skills[sk] = skills[sk] || { score: 0, max: 0 }; s.score += r.score; s.max += q.pts;
      (r.notes || []).forEach(function (n) { if (notes[n] !== undefined) notes[n]++; });
    });
    var pct = Math.round(total / max * 100);
    return { per: per, total: total, max: max, pct: pct, band: band(pct), units: units, skills: skills, notes: notes };
  }

  window.ENGINE = { KEY: KEY, TYPE_INFO: TYPE_INFO, SKILLS: SKILLS, markAll: markAll, markOne: markOne, correctAnswerText: correctAnswerText, words: words, parseNumber: parseNumber, band: band };
})();

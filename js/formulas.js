/* Formula sheet tab: only the formulas needed for the questions in this assessment. */
(function () {
  "use strict";
  function mi(x) { return "<mi>" + x + "</mi>"; }
  function mn(x) { return "<mn>" + x + "</mn>"; }
  function mo(x) { return "<mo>" + x + "</mo>"; }
  function sub(a, b) { return "<msub><mrow>" + a + "</mrow><mrow>" + b + "</mrow></msub>"; }
  function sup(a, b) { return "<msup><mrow>" + a + "</mrow><mrow>" + b + "</mrow></msup>"; }
  function fr(a, b) { return "<mfrac><mrow>" + a + "</mrow><mrow>" + b + "</mrow></mfrac>"; }
  function rt(a) { return "<msqrt>" + a + "</msqrt>"; }
  function row() { return "<mrow>" + Array.prototype.join.call(arguments, "") + "</mrow>"; }
  function M() { return '<div class="fm"><math>' + row.apply(null, arguments) + "</math></div>"; }
  function tx(x) { return "<mtext>" + x + "</mtext>"; }
  function p(x) { return "<mrow>" + mo("(") + x + mo(")") + "</mrow>"; }
  var EQ = mo("="), PL = mo("+"), MI = mo("−"), TM = mo("×");
  var I = mi("I"), V = mi("V"), R = mi("R"), P = mi("P"), W = mi("W"), t = mi("t"), L = mi("L"), C = mi("C"), f = mi("f");
  var tau = mi("τ"), XL = sub(mi("X"), mi("L")), XC = sub(mi("X"), mi("C")), Z = mi("Z");
  var R1 = sub(R, mn(1)), R2 = sub(R, mn(2)), R3 = sub(R, mn(3)), RT = sub(R, mi("T"));
  var C1 = sub(C, mn(1)), C2 = sub(C, mn(2)), C3 = sub(C, mn(3)), CT = sub(C, mi("T"));
  var vC = sub(mi("v"), mi("C")), ex = sup(mi("e"), row(MI, t, mo("/"), tau));

  var SHEET = [
    { h: "Power and energy", qs: "Questions 9, 10 and 33", items: [
      ["Ohm's law", M(V, EQ, I, R)],
      ["Power", M(P, EQ, V, I, EQ, sup(I, mn(2)), R, EQ, fr(sup(V, mn(2)), R))],
      ["Energy (work done)", M(W, EQ, P, t), "W in joules (J), P in watts (W), t in seconds (s)"]] },
    { h: "Magnetism and inductance", qs: "Questions 1, 11 and 12", items: [
      ["Magnetic field strength", M(mi("H"), EQ, fr(row(I, mi("N")), mi("l"))), "H in A/m, N = number of turns, l = length of the coil in metres"],
      ["Flux density", M(mi("B"), EQ, fr(mi("Φ"), mi("A"))), "B in tesla (T), Φ in webers (Wb), A = area in m²"],
      ["Energy stored in an inductor", M(W, EQ, fr(mn(1), mn(2)), L, sup(I, mn(2))), "L in henrys (H), I in amps (A), W in joules (J)"]] },
    { h: "DC networks", qs: "Questions 3, 13 and 31", items: [
      ["Resistors in series", M(RT, EQ, R1, PL, R2, PL, R3, PL, mo("…"))],
      ["Resistors in parallel", M(fr(mn(1), RT), EQ, fr(mn(1), R1), PL, fr(mn(1), R2), PL, fr(mn(1), R3), PL, mo("…"))],
      ["Two resistors in parallel", M(RT, EQ, fr(row(R1, TM, R2), row(R1, PL, R2)))],
      ["Kirchhoff's current law", M(mo("Σ"), sub(I, mi("in")), EQ, mo("Σ"), sub(I, mi("out"))), "at any junction"],
      ["Kirchhoff's voltage law", M(mo("Σ"), mi("E"), EQ, mo("Σ"), I, R), "around any closed loop"],
      ["Current divider (two branches)", M(sub(I, mn(1)), EQ, sub(I, mi("T")), TM, fr(R2, row(R1, PL, R2)))]] },
    { h: "Capacitors", qs: "Question 14", items: [
      ["Capacitors in parallel", M(CT, EQ, C1, PL, C2, PL, C3, PL, mo("…"))],
      ["Capacitors in series", M(fr(mn(1), CT), EQ, fr(mn(1), C1), PL, fr(mn(1), C2), PL, mo("…"))],
      ["Two capacitors in series", M(CT, EQ, fr(row(C1, TM, C2), row(C1, PL, C2)))]] },
    { h: "DC transients (RC and RL circuits)", qs: "Questions 4, 15, 30 and 32", items: [
      ["Time constant, RC circuit", M(tau, EQ, R, C), "τ in seconds, R in ohms (Ω), C in farads (F)"],
      ["Time constant, RL circuit", M(tau, EQ, fr(L, R)), "τ in seconds, L in henrys (H), R in ohms (Ω)"],
      ["Capacitor charging voltage", M(vC, EQ, V, p(row(mn(1), MI, ex))), "V = supply voltage, t = time since switch-on"],
      ["Time to reach a voltage", M(t, EQ, MI, tau, mi("ln"), p(row(mn(1), MI, fr(vC, V))))],
      ["RL circuit current (rising)", M(mi("i"), EQ, fr(V, R), p(row(mn(1), MI, ex))), "V ÷ R is the final (steady) current"],
      ["Useful values", M(mi("t"), EQ, mn("1"), tau, mo("→"), mn("63.2"), mo("%"), mn("")) + M(mi("t"), EQ, mn("5"), tau, mo("→"), mn("100"), mo("%")), "after 1τ: 63.2 % of the final value; after 5τ: fully charged (steady state)"]] },
    { h: "AC circuits", qs: "Questions 5, 23, 29 and 33", items: [
      ["Inductive reactance", M(XL, EQ, mn(2), mi("π"), f, L), "f in hertz (Hz), L in henrys (H)"],
      ["Capacitive reactance", M(XC, EQ, fr(mn(1), row(mn(2), mi("π"), f, C))), "C in farads (F)"],
      ["Impedance, series RLC", M(Z, EQ, rt(row(sup(R, mn(2)), PL, sup(p(row(XL, MI, XC)), mn(2)))))],
      ["Impedance, series RL", M(Z, EQ, rt(row(sup(R, mn(2)), PL, sup(XL, mn(2)))))],
      ["Current", M(I, EQ, fr(V, Z))],
      ["Power factor", M(mi("cos"), mi("φ"), EQ, fr(R, Z))],
      ["True power", M(P, EQ, sup(I, mn(2)), R, EQ, V, I, mi("cos"), mi("φ")), "measured in watts (W)"]] },
    { h: "Design: shrinkage allowance", qs: "Question 16", items: [
      ["Size to print or mould", M(tx("printed size"), EQ, fr(tx("final size"), row(mn(1), MI, mi("s")))), "s = shrinkage as a decimal of the printed size (20 % → 0.20)"]] }
  ];
  var PREFIX = [["G", "giga", "× 10⁹"], ["M", "mega", "× 10⁶"], ["k", "kilo", "× 10³"], ["m", "milli", "× 10⁻³"], ["µ", "micro", "× 10⁻⁶"], ["n", "nano", "× 10⁻⁹"]];
  var CONV = ["1 minute = 60 s · 1 hour = 3600 s", "1 kW = 1000 W · 1 MJ = 1 000 000 J", "20 mA = 0.020 A · 1.5 kΩ = 1500 Ω", "200 mH = 0.2 H · 100 µF = 0.0001 F (100 × 10⁻⁶ F)", "Answer in mA: multiply amps by 1000 · answer in ms: multiply seconds by 1000"];
  var TIPS = ["eˣ: use the <b>SHIFT + ln</b> key (shown as eˣ above the ln key).", "ln: use the <b>ln</b> key for time questions.", "1 ÷ x: use the <b>x⁻¹</b> key for parallel resistors and series capacitors.", "Keep full calculator values until the last step, then round."];

  function html() {
    var s = '<section class="card fsheet"><div class="fs-head"><div><h2>Formula sheet</h2><p class="muted">Every formula you need for this assessment. Opening this sheet is allowed and is not counted as leaving the page.</p></div>' +
      '<button class="btn" type="button" data-back>◄ Back to my assessment</button></div><div class="fs-grid">';
    SHEET.forEach(function (sec) {
      s += '<div class="fs-sec"><h3>' + sec.h + '</h3><table class="fs-t"><tbody>';
      sec.items.forEach(function (it) {
        s += '<tr><th scope="row">' + it[0] + '</th><td>' + it[1] + (it[2] ? '<div class="fs-note">' + it[2] + '</div>' : "") + '</td></tr>';
      });
      s += "</tbody></table></div>";
    });
    s += '<div class="fs-sec"><h3>Unit prefixes</h3><table class="fs-t pref"><thead><tr><th>Symbol</th><th>Name</th><th>Multiply by</th></tr></thead><tbody>' +
      PREFIX.map(function (r) { return "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</tbody></table>" +
      '<h3 style="margin-top:14px">Unit conversions</h3><ul class="fs-ul">' + CONV.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
    s += '<div class="fs-sec"><h3>Constants and calculator</h3><ul class="fs-ul"><li>π ≈ 3.142 · e ≈ 2.718</li>' + TIPS.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
    s += '</div><div class="btn-row"><button class="btn" type="button" data-back>◄ Back to my assessment</button></div></section>';
    return s;
  }

  var panel = document.getElementById("formulas"), app = document.getElementById("app");
  var tA = document.getElementById("tabQuiz"), tF = document.getElementById("tabFormula");
  panel.innerHTML = html();
  function show(which) {
    var f = which === "f";
    panel.hidden = !f; app.hidden = f;
    tA.setAttribute("aria-selected", !f); tF.setAttribute("aria-selected", f);
    window.scrollTo(0, 0);
  }
  tA.onclick = function () { show("a"); };
  tF.onclick = function () { show("f"); };
  Array.prototype.forEach.call(panel.querySelectorAll("[data-back]"), function (b) { b.onclick = function () { show("a"); }; });
})();

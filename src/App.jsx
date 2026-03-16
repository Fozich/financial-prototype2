import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const G      = "#C8A94B";
const BG     = "#0B0C0E";
const CARD   = "#131418";
const B2     = "#1A1C21";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT   = "#E2E3E8";
const MUTED  = "#6B6E78";
const GREEN  = "#47B37E";
const RED    = "#E05252";
const AMBER  = "#F5A623";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0B0C0E; color: #E2E3E8; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  input[type="range"] { width: 100%; accent-color: #C8A94B; cursor: pointer; height: 4px; }
  input[type="number"], select { background: #1A1C21; color: #E2E3E8; border: 1px solid rgba(255,255,255,0.07); padding: 12px 16px; border-radius: 8px; font-size: 16px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border-color 0.2s; appearance: none; }
  input[type="number"]:focus, select:focus { border-color: #C8A94B; }
  .btn { background: #C8A94B; color: #0B0C0E; border: none; padding: 14px 36px; border-radius: 8px; font-weight: 500; font-size: 15px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s, transform 0.1s; }
  .btn:hover { opacity: 0.86; }
  .btn:active { transform: scale(0.98); }
  .ghost { background: transparent; color: #6B6E78; border: 1px solid rgba(255,255,255,0.07); padding: 10px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s, color 0.2s; }
  .ghost:hover { border-color: rgba(255,255,255,0.2); color: #E2E3E8; }
  .serif { font-family: 'DM Serif Display', serif; }
`;

const QUESTIONS = [
  { id: "income",   label: "Monthly take-home income",  sub: "After taxes and deductions",           prefix: "€", type: "number", ph: "3500" },
  { id: "expenses", label: "Monthly expenses",           sub: "Rent, food, bills, subscriptions",     prefix: "€", type: "number", ph: "2200" },
  { id: "savings",  label: "Current savings",            sub: "Cash and liquid assets",               prefix: "€", type: "number", ph: "8000" },
  { id: "debt",     label: "Total debt",                 sub: "Loans, credit cards, overdrafts",      prefix: "€", type: "number", ph: "0"    },
  { id: "age",      label: "Your age",                   sub: "Used for retirement projections",      prefix: "",  type: "number", ph: "25"   },
  { id: "goal",     label: "Primary financial goal",     sub: "What matters most right now",          prefix: "",  type: "select",
    options: ["Build emergency fund","Pay off debt faster","Save for retirement","Invest and grow wealth","Save for a home"] },
];

function fmt(n) {
  if (!isFinite(n)) return "0";
  if (n >= 1000000) return "€" + (n / 1000000).toFixed(2) + "M";
  if (n >= 1000)    return "€" + (n / 1000).toFixed(1) + "k";
  return "€" + Math.round(n).toLocaleString();
}
function pct(n) { return Math.abs(n).toFixed(1) + "%"; }

function CTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "#1A1C21", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
      <div style={{ color: "#6B6E78", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#C8A94B", fontFamily: "monospace", fontWeight: 500 }}>
          {typeof p.value === "number" ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

function SliderRow({ label, value, min, max, step, display, onChange }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
        <span style={{ fontFamily: "monospace", fontSize: 13, color: G }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={function(e){ onChange(+e.target.value); }} />
    </div>
  );
}

const cardStyle = { background: "#131418", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "24px" };
const lblStyle  = { fontSize: 11, color: "#6B6E78", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 };

function Intro({ onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: G, textTransform: "uppercase", marginBottom: 28 }}>Rational Finance</div>
        <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,54px)", lineHeight: 1.15, marginBottom: 20, fontWeight: 400 }}>
          Make better decisions<br /><em>with your money</em>
        </h1>
        <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.8, maxWidth: 400, margin: "0 auto 48px" }}>
          A 2-minute questionnaire. Instant clarity on your financial health, 10-year projections, and what to actually do next.
        </p>
        <button className="btn" onClick={onStart} style={{ fontSize: 16, padding: "16px 52px" }}>Get started →</button>
        <div style={{ marginTop: 48, display: "flex", gap: 32, justifyContent: "center" }}>
          {["Dashboard", "3 Calculators", "Personalised advice"].map(function(f){ return <div key={f} style={{ fontSize: 13, color: MUTED }}>{f}</div>; })}
        </div>
      </div>
    </div>
  );
}

function Questionnaire({ answers, setAnswers, onDone, onBack }) {
  const [qStep, setQStep] = useState(0);
  const q      = QUESTIONS[qStep];
  const val    = answers[q.id];
  const isLast = qStep === QUESTIONS.length - 1;
  function next() { if (isLast) { onDone(); } else { setQStep(function(s){ return s + 1; }); } }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 52 }}>
          {QUESTIONS.map(function(_, i){ return <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: i <= qStep ? G : BORDER, transition: "background 0.3s" }} />; })}
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>{qStep + 1} / {QUESTIONS.length}</div>
        <h2 className="serif" style={{ fontSize: 30, fontWeight: 400, marginBottom: 8 }}>{q.label}</h2>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 32, lineHeight: 1.6 }}>{q.sub}</p>
        {q.type === "select" ? (
          <select value={val} onChange={function(e){ setAnswers(function(a){ return Object.assign({}, a, { [q.id]: e.target.value }); }); }}>
            {q.options.map(function(o){ return <option key={o}>{o}</option>; })}
          </select>
        ) : (
          <div style={{ position: "relative" }}>
            {q.prefix && <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: 18, pointerEvents: "none" }}>{q.prefix}</span>}
            <input type="number" value={val} placeholder={q.ph} autoFocus
              onChange={function(e){ setAnswers(function(a){ return Object.assign({}, a, { [q.id]: e.target.value }); }); }}
              onKeyDown={function(e){ if (e.key === "Enter") next(); }}
              style={{ paddingLeft: q.prefix ? 32 : 16 }} />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
          <button className="ghost" onClick={qStep > 0 ? function(){ setQStep(function(s){ return s - 1; }); } : onBack}>{qStep > 0 ? "← Back" : "← Home"}</button>
          <button className="btn" onClick={next}>{isLast ? "See my analysis →" : "Next →"}</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ answers }) {
  var d = useMemo(function() {
    var inc     = +answers.income   || 0;
    var exp     = +answers.expenses || 0;
    var sav     = +answers.savings  || 0;
    var dbt     = +answers.debt     || 0;
    var monthly = Math.max(inc - exp, 0);
    var savRate = inc > 0 ? (monthly / inc * 100) : 0;
    var dti     = inc > 0 ? (dbt / (inc * 12) * 100) : 0;
    var efMo    = exp > 0 ? (sav / exp) : 0;
    var r       = 0.07;
    var projection = [];
    for (var i = 0; i <= 10; i++) {
      var grown    = i === 0 ? sav : sav * Math.pow(1 + r, i) + (monthly * 12) * (Math.pow(1 + r, i) - 1) / r;
      var debtLeft = Math.max(dbt - monthly * 0.3 * 12 * i, 0);
      projection.push({ yr: i === 0 ? "Now" : "+" + i + "y", netWorth: Math.round(Math.max(grown - debtLeft, 0)) });
    }
    var recs = [];
    if (efMo < 3)      recs.push({ tag: "Emergency Fund", text: "You have " + efMo.toFixed(1) + " months saved. Aim for 3-6 months as your first line of defence.", color: RED });
    if (savRate < 15)  recs.push({ tag: "Savings Rate",   text: "Your savings rate is " + pct(savRate) + ". Targeting 20%+ puts you on a clear path to financial independence.", color: AMBER });
    if (dti > 36)      recs.push({ tag: "Debt Load",      text: "Debt-to-income ratio of " + pct(dti) + " exceeds 36%. Prioritise paying down high-interest debt first.", color: RED });
    if (savRate >= 20) recs.push({ tag: "Strong Rate",    text: "Saving " + pct(savRate) + " of your income is excellent. Make sure it goes into diversified, low-cost index funds.", color: GREEN });
    if (efMo >= 6)     recs.push({ tag: "Well Buffered",  text: efMo.toFixed(1) + " months of emergency runway. You can now channel surplus cash into long-term investments.", color: GREEN });
    if (recs.length === 0) recs.push({ tag: "Looking Good", text: "Your core fundamentals are solid. Focus on maximising your savings rate and keeping costs low.", color: GREEN });
    return { inc: inc, exp: exp, monthly: monthly, savRate: savRate, dti: dti, efMo: efMo, projection: projection, recs: recs };
  }, [answers]);

  return (
    <div>
      <div style={{ marginBottom: 44 }}>
        <div style={{ fontSize: 11, color: G, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>Financial Overview</div>
        <h1 className="serif" style={{ fontSize: 34, fontWeight: 400 }}>Your financial picture</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Monthly surplus", value: fmt(d.monthly), color: d.monthly >= 0 ? GREEN : RED },
          { label: "Savings rate",    value: pct(d.savRate),  color: d.savRate >= 20 ? GREEN : d.savRate >= 10 ? AMBER : RED },
          { label: "Emergency fund",  value: d.efMo.toFixed(1) + " mo", color: d.efMo >= 6 ? GREEN : d.efMo >= 3 ? AMBER : RED },
          { label: "Debt / income",   value: pct(d.dti), color: d.dti <= 20 ? GREEN : d.dti <= 36 ? AMBER : RED },
        ].map(function(m){ return (
          <div key={m.label} style={cardStyle}>
            <div style={lblStyle}>{m.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 30, fontWeight: 500, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ); })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 28 }}>
        <div style={cardStyle}>
          <div style={{ marginBottom: 20 }}>
            <div style={lblStyle}>Net worth projection</div>
            <div style={{ fontSize: 13, color: MUTED }}>10-year outlook · 7% annual growth assumed</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.projection}>
              <defs>
                <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={G} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="yr"  tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={68} />
              <Tooltip content={CTip} />
              <Area type="monotone" dataKey="netWorth" stroke={G} strokeWidth={2} fill="url(#gGold)" name="Net worth" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <div style={{ marginBottom: 20 }}><div style={lblStyle}>Monthly budget</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
            {[
              { label: "Income",   val: d.inc,     color: G     },
              { label: "Expenses", val: d.exp,     color: RED   },
              { label: "Surplus",  val: d.monthly, color: GREEN },
            ].map(function(item){ return (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: MUTED }}>{item.label}</span>
                  <span style={{ fontFamily: "monospace", color: item.color }}>{fmt(item.val)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: BORDER }}>
                  <div style={{ height: "100%", borderRadius: 2, background: item.color, width: Math.min((item.val / (d.inc || 1)) * 100, 100) + "%", transition: "width 0.4s" }} />
                </div>
              </div>
            ); })}
          </div>
        </div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 20 }}>Recommendations</div>
        {d.recs.map(function(rec, i){ return (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "18px 0", borderBottom: i < d.recs.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: rec.color, background: rec.color + "1A", borderRadius: 4, padding: "4px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>{rec.tag}</span>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>{rec.text}</p>
          </div>
        ); })}
      </div>
    </div>
  );
}

function Calculators() {
  var calcState = useState("compound");
  var calc = calcState[0]; var setCalc = calcState[1];
  var ciState = useState({ principal: 5000, rate: 7, years: 20 });
  var ci = ciState[0]; var setCi = ciState[1];
  var rtState = useState({ age: 25, retireAge: 65, monthly: 300, rate: 7 });
  var rt = rtState[0]; var setRt = rtState[1];
  var lnState = useState({ balance: 15000, rate: 5.5, payment: 350 });
  var ln = lnState[0]; var setLn = lnState[1];

  var ciData = useMemo(function() {
    var data = [];
    for (var i = 0; i <= ci.years; i++) {
      data.push({ yr: i === 0 ? "Now" : "Y" + i, value: Math.round(ci.principal * Math.pow(1 + ci.rate / 100, i)), flat: ci.principal });
    }
    return data;
  }, [ci]);

  var rtData = useMemo(function() {
    var years = Math.max(rt.retireAge - rt.age, 1);
    var r = rt.rate / 100 / 12;
    var n = years * 12;
    var fv = r > 0 ? rt.monthly * ((Math.pow(1 + r, n) - 1) / r) : rt.monthly * n;
    var step = Math.ceil(years / 10) || 1;
    var chart = [];
    for (var i = 0; i <= years; i += step) {
      var ni = i * 12;
      chart.push({ yr: rt.age + i, val: Math.round(r > 0 ? rt.monthly * ((Math.pow(1 + r, ni) - 1) / r) : rt.monthly * ni) });
    }
    if (chart[chart.length - 1].yr !== rt.retireAge) chart.push({ yr: rt.retireAge, val: Math.round(fv) });
    return { total: Math.round(fv), contributed: rt.monthly * n, chart: chart };
  }, [rt]);

  var lnData = useMemo(function() {
    var r = ln.rate / 100 / 12;
    var minP = ln.balance * r;
    if (ln.payment <= minP) return { months: Infinity, totalInterest: Infinity, chart: [] };
    var months = Math.ceil(-Math.log(1 - (ln.balance * r) / ln.payment) / Math.log(1 + r));
    var totalInterest = ln.payment * months - ln.balance;
    var step = Math.ceil(months / 10) || 1;
    var chart = [];
    var bal = ln.balance;
    for (var i = 0; i <= months; i += step) {
      chart.push({ mo: i === 0 ? "Now" : "M" + i, balance: Math.round(Math.max(bal, 0)) });
      for (var j = 0; j < step && bal > 0; j++) bal -= (ln.payment - bal * r);
    }
    if (chart[chart.length - 1].balance > 0) chart.push({ mo: "M" + months, balance: 0 });
    return { months: months, totalInterest: Math.round(totalInterest), chart: chart };
  }, [ln]);

  var tabs = [["compound","Compound Interest"],["retirement","Retirement Fund"],["loan","Loan Payoff"]];
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: G, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>Tools</div>
        <h1 className="serif" style={{ fontSize: 34, fontWeight: 400 }}>Financial calculators</h1>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
        {tabs.map(function(t){ return (
          <button key={t[0]} onClick={function(){ setCalc(t[0]); }} style={{ padding: "10px 20px", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", border: "1px solid " + (calc === t[0] ? G : BORDER), background: calc === t[0] ? G + "14" : "transparent", color: calc === t[0] ? G : MUTED, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>{t[1]}</button>
        ); })}
      </div>

      {calc === "compound" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 24 }}>Parameters</div>
            <SliderRow label="Principal"     value={ci.principal} min={500}  max={100000} step={500} display={fmt(ci.principal)} onChange={function(v){ setCi(function(c){ return Object.assign({},c,{principal:v}); }); }} />
            <SliderRow label="Annual return" value={ci.rate}      min={1}    max={15}     step={0.5} display={ci.rate + "%"}     onChange={function(v){ setCi(function(c){ return Object.assign({},c,{rate:v}); }); }} />
            <SliderRow label="Time horizon"  value={ci.years}     min={1}    max={40}     step={1}   display={ci.years + " yrs"} onChange={function(v){ setCi(function(c){ return Object.assign({},c,{years:v}); }); }} />
            <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 4 }}>
              <div style={lblStyle}>Final value</div>
              <div style={{ fontFamily: "monospace", fontSize: 30, fontWeight: 500, color: G, marginTop: 4 }}>{fmt(Math.round(ci.principal * Math.pow(1 + ci.rate / 100, ci.years)))}</div>
              <div style={{ fontSize: 12, color: GREEN, marginTop: 6 }}>+{fmt(Math.round(ci.principal * Math.pow(1 + ci.rate / 100, ci.years) - ci.principal))} gain</div>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={lblStyle}>Compound growth curve</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ciData}>
                <defs>
                  <linearGradient id="gCI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={G} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={G} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="yr"  tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={fmt} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={CTip} />
                <Area type="monotone" dataKey="flat"  stroke={BORDER} strokeWidth={1} fill="none" strokeDasharray="4 3" name="No growth" />
                <Area type="monotone" dataKey="value" stroke={G}      strokeWidth={2} fill="url(#gCI)" name="Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {calc === "retirement" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 24 }}>Parameters</div>
            <SliderRow label="Current age"          value={rt.age}       min={18} max={60}   step={1}   display={rt.age + " yrs"}       onChange={function(v){ setRt(function(s){ return Object.assign({},s,{age:v}); }); }} />
            <SliderRow label="Retirement age"       value={rt.retireAge} min={50} max={75}   step={1}   display={rt.retireAge + " yrs"} onChange={function(v){ setRt(function(s){ return Object.assign({},s,{retireAge:v}); }); }} />
            <SliderRow label="Monthly contribution" value={rt.monthly}   min={50} max={2000} step={50}  display={fmt(rt.monthly)}       onChange={function(v){ setRt(function(s){ return Object.assign({},s,{monthly:v}); }); }} />
            <SliderRow label="Expected return"      value={rt.rate}      min={2}  max={12}   step={0.5} display={rt.rate + "%"}         onChange={function(v){ setRt(function(s){ return Object.assign({},s,{rate:v}); }); }} />
            <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 4 }}>
              <div style={lblStyle}>At retirement</div>
              <div style={{ fontFamily: "monospace", fontSize: 30, fontWeight: 500, color: GREEN, marginTop: 4 }}>{fmt(rtData.total)}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Contributed: {fmt(rtData.contributed)}</div>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={lblStyle}>Retirement fund growth</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={rtData.chart}>
                <defs>
                  <linearGradient id="gRT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GREEN} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="yr"  tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={CTip} />
                <Area type="monotone" dataKey="val" stroke={GREEN} strokeWidth={2} fill="url(#gRT)" name="Fund value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {calc === "loan" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 24 }}>Parameters</div>
            <SliderRow label="Loan balance"         value={ln.balance} min={500}  max={100000} step={500} display={fmt(ln.balance)} onChange={function(v){ setLn(function(l){ return Object.assign({},l,{balance:v}); }); }} />
            <SliderRow label="Annual interest rate" value={ln.rate}    min={1}    max={25}     step={0.5} display={ln.rate + "%"}   onChange={function(v){ setLn(function(l){ return Object.assign({},l,{rate:v}); }); }} />
            <SliderRow label="Monthly payment"      value={ln.payment} min={50}   max={5000}   step={50}  display={fmt(ln.payment)} onChange={function(v){ setLn(function(l){ return Object.assign({},l,{payment:v}); }); }} />
            <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 4 }}>
              {lnData.months === Infinity ? (
                <div style={{ fontSize: 13, color: RED }}>Payment too low to cover interest</div>
              ) : (
                <>
                  <div style={lblStyle}>Payoff timeline</div>
                  <div style={{ fontFamily: "monospace", fontSize: 30, fontWeight: 500, color: RED, marginTop: 4 }}>{lnData.months} months</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Total interest: {fmt(lnData.totalInterest)}</div>
                </>
              )}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={lblStyle}>Remaining balance over time</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={lnData.chart}>
                <defs>
                  <linearGradient id="gLN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={RED} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="mo"  tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={CTip} />
                <Area type="monotone" dataKey="balance" stroke={RED} strokeWidth={2} fill="url(#gLN)" name="Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  var screenState  = useState("intro");
  var screen = screenState[0]; var setScreen = screenState[1];
  var tabState = useState("dashboard");
  var tab = tabState[0]; var setTab = tabState[1];
  var answersState = useState({ income: "", expenses: "", savings: "", debt: "", age: "", goal: "Build emergency fund" });
  var answers = answersState[0]; var setAnswers = answersState[1];

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT }}>
      <style>{GLOBAL_CSS}</style>
      {screen === "intro" && <Intro onStart={function(){ setScreen("questionnaire"); }} />}
      {screen === "questionnaire" && (
        <Questionnaire answers={answers} setAnswers={setAnswers}
          onDone={function(){ setScreen("app"); setTab("dashboard"); }}
          onBack={function(){ setScreen("intro"); }} />
      )}
      {screen === "app" && (
        <>
          <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 28px", display: "flex", alignItems: "center", position: "sticky", top: 0, background: BG, zIndex: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: G, padding: "20px 0", letterSpacing: "0.08em", marginRight: 32 }}>RF</div>
            {[["dashboard","Dashboard"],["calculators","Calculators"]].map(function(item){ return (
              <button key={item[0]} onClick={function(){ setTab(item[0]); }} style={{ background: "none", border: "none", padding: "20px 18px", color: tab === item[0] ? TEXT : MUTED, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", borderBottom: tab === item[0] ? "2px solid " + G : "2px solid transparent", transition: "color 0.2s", marginBottom: -1 }}>{item[1]}</button>
            ); })}
            <button className="ghost" onClick={function(){ setScreen("questionnaire"); }} style={{ marginLeft: "auto", fontSize: 12, padding: "8px 16px" }}>Edit answers</button>
          </nav>
          <main style={{ maxWidth: 980, margin: "0 auto", padding: "44px 28px 80px" }}>
            {tab === "dashboard"   && <Dashboard    answers={answers} />}
            {tab === "calculators" && <Calculators />}
          </main>
        </>
      )}
    </div>
  );
}

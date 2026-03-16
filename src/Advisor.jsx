import { useState, useRef, useEffect } from "react";

const G      = "#C8A94B";
const BG     = "#0B0C0E";
const CARD   = "#131418";
const B2     = "#1A1C21";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT   = "#E2E3E8";
const MUTED  = "#6B6E78";
const GREEN  = "#47B37E";
const RED    = "#E05252";

function buildSystemPrompt(answers, extraContext) {
  var inc     = +answers.income   || 0;
  var exp     = +answers.expenses || 0;
  var sav     = +answers.savings  || 0;
  var dbt     = +answers.debt     || 0;
  var age     = +answers.age      || 0;
  var surplus = Math.max(inc - exp, 0);
  var savRate = inc > 0 ? ((surplus / inc) * 100).toFixed(1) : "0";
  var efMo    = exp > 0 ? (sav / exp).toFixed(1) : "0";
  var dti     = inc > 0 ? ((dbt / (inc * 12)) * 100).toFixed(1) : "0";

  var contextStr = extraContext.length > 0
    ? "\nADDITIONAL CONTEXT GATHERED:\n" + extraContext.map(function(c){ return "- " + c; }).join("\n")
    : "";

  return "You are a sharp, honest personal finance advisor for a Gen Z user. Speak plainly. No fluff. Give concrete, actionable advice grounded in rational finance principles (index funds, emergency funds, debt avalanche, compound growth, 50/30/20 rule, etc).\n\nUSER PROFILE:\n- Monthly income: €" + inc + "\n- Monthly expenses: €" + exp + "\n- Monthly surplus: €" + surplus + "\n- Savings rate: " + savRate + "%\n- Current savings: €" + sav + "\n- Total debt: €" + dbt + "\n- Age: " + age + "\n- Emergency fund coverage: " + efMo + " months\n- Debt-to-income ratio: " + dti + "%\n- Primary goal: " + (answers.goal || "not specified") + contextStr + "\n\nRULES:\n1. Answer directly using their actual numbers. Never give generic advice that ignores their situation.\n2. After every answer, ask exactly ONE smart follow-up question to gather more context. Examples: 'Is your debt high-interest (credit card) or low-interest (student loan)?', 'Does your employer match pension contributions?', 'Do you have any investments currently?', 'What is your biggest expense category?', 'Do you have any dependants?', 'Is your income stable or variable?'\n3. Keep answers to 3-5 sentences unless asked for more detail.\n4. If their profile has red flags (savings rate under 10%, no emergency fund, high debt), address it honestly.\n5. Respond in plain text only. No markdown. Short paragraphs.";
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "6px 2px" }}>
      {[0,1,2].map(function(i){
        return <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: MUTED, animation: "rf-pulse 1.2s ease-in-out infinite", animationDelay: (i * 0.2) + "s" }} />;
      })}
      <style>{"@keyframes rf-pulse{0%,80%,100%{opacity:0.25;transform:scale(0.75)}40%{opacity:1;transform:scale(1)}}"}</style>
    </div>
  );
}

function Bubble({ msg }) {
  var isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: G + "18", border: "1px solid " + G + "35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: G, fontWeight: 700, marginRight: 10, flexShrink: 0, marginTop: 2, letterSpacing: "0.02em" }}>RF</div>
      )}
      <div style={{ maxWidth: "74%", background: isUser ? G + "16" : CARD, border: "1px solid " + (isUser ? G + "28" : BORDER), borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "11px 15px", fontSize: 14, lineHeight: 1.65, color: TEXT, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {msg.typing ? <TypingDots /> : msg.content}
      </div>
    </div>
  );
}

var STARTERS = [
  "What should I do with my monthly surplus?",
  "Should I pay off debt or start investing?",
  "Am I on track for retirement?",
  "How do I build my emergency fund faster?",
  "What's the smartest way to use €500 right now?",
];

export default function Advisor({ answers }) {
  var msgsState = useState([
    { role: "assistant", content: "I've looked at your numbers. Ask me anything about your financial situation — I'll give you specific, honest advice based on what you've told me." }
  ]);
  var messages = msgsState[0]; var setMessages = msgsState[1];

  var inputState = useState("");
  var input = inputState[0]; var setInput = inputState[1];

  var loadingState = useState(false);
  var loading = loadingState[0]; var setLoading = loadingState[1];

  var extraContext = useRef([]);
  var bottomRef   = useRef(null);
  var textareaRef = useRef(null);

  useEffect(function() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    var userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");

    var newMsgs = messages.concat([{ role: "user", content: userMsg }]);
    setMessages(newMsgs.concat([{ role: "assistant", typing: true, content: "" }]));
    setLoading(true);

    try {
      var apiMsgs = newMsgs.map(function(m){ return { role: m.role, content: m.content }; });

      var res = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: buildSystemPrompt(answers, extraContext.current) }].concat(apiMsgs),
          model: "openai-large",
          seed: 42,
          private: true,
        }),
      });

      var reply = "";
      if (res.ok) {
        reply = await res.text();
        reply = reply.trim();
        // extract any context clues from the conversation to improve future prompts
        if (userMsg.toLowerCase().includes("credit card") || userMsg.toLowerCase().includes("high interest")) {
          extraContext.current = extraContext.current.concat(["Has high-interest credit card debt"]);
        }
        if (userMsg.toLowerCase().includes("pension") || userMsg.toLowerCase().includes("employer match")) {
          extraContext.current = extraContext.current.concat(["Has pension / employer match context"]);
        }
        if (userMsg.toLowerCase().includes("invest") && userMsg.toLowerCase().includes("already")) {
          extraContext.current = extraContext.current.concat(["Already has some investments"]);
        }
      } else {
        reply = "The AI service is temporarily unavailable. Please try again in a moment.";
      }

      setMessages(newMsgs.concat([{ role: "assistant", content: reply }]));
    } catch (err) {
      setMessages(newMsgs.concat([{ role: "assistant", content: "Network error — please check your connection and try again." }]));
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  var showStarters = messages.length === 1;

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: G, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>AI Advisor</div>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 34, fontWeight: 400 }}>Your financial advisor</h1>
        <p style={{ fontSize: 14, color: MUTED, marginTop: 8, lineHeight: 1.6 }}>Advice based on your actual numbers. Asks follow-up questions to understand you better.</p>
      </div>

      <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 12, display: "flex", flexDirection: "column", height: 560 }}>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 20px 8px" }}>
          {messages.map(function(msg, i){ return <Bubble key={i} msg={msg} />; })}
          <div ref={bottomRef} />
        </div>

        {/* Starter chips */}
        {showStarters && (
          <div style={{ padding: "4px 20px 14px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STARTERS.map(function(s){
              return (
                <button key={s} onClick={function(){ send(s); }}
                  style={{ background: "transparent", border: "1px solid " + BORDER, color: MUTED, fontSize: 12, padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
                  onMouseEnter={function(e){ e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = TEXT; }}
                  onMouseLeave={function(e){ e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
                >{s}</button>
              );
            })}
          </div>
        )}

        {/* Input row */}
        <div style={{ borderTop: "1px solid " + BORDER, padding: "14px 18px", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea ref={textareaRef} value={input}
            onChange={function(e){ setInput(e.target.value); }}
            onKeyDown={handleKey}
            placeholder="Ask about your finances…"
            rows={1}
            style={{ flex: 1, background: B2, border: "1px solid " + BORDER, color: TEXT, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", resize: "none", lineHeight: 1.5, transition: "border-color 0.2s", outline: "none" }}
            onFocus={function(e){ e.currentTarget.style.borderColor = G; }}
            onBlur={function(e){ e.currentTarget.style.borderColor = BORDER; }}
          />
          <button onClick={function(){ send(); }} disabled={loading || !input.trim()}
            style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: (!loading && input.trim()) ? G : "rgba(255,255,255,0.06)", border: "none", cursor: (!loading && input.trim()) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill={(!loading && input.trim()) ? BG : MUTED} />
            </svg>
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: MUTED, marginTop: 10, textAlign: "center" }}>
        Powered by Pollinations AI · Free · No account needed · Not a substitute for professional financial advice
      </p>
    </div>
  );
}

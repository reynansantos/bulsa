import { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";
import { Home, Receipt, Zap, Handshake, User, Plus, Wallet, Repeat } from "lucide-react";

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
  bg:"#0C0C0C", surface:"#141414", card:"#1C1C1C", cardAlt:"#222222",
  border:"#2A2A2A", borderLight:"#383838",
  accent:"#FF6B2B", accentSoft:"#FF9A6B", accentGlow:"rgba(255,107,43,0.18)",
  lime:"#C8F135", sky:"#60CFFF", rose:"#FF4D8C", gold:"#FFD060", mint:"#00E0A0",
  text:"#F5F5F0", textSub:"#A0A09A", textFaint:"#606058",
  green:"#00E096", coral:"#FF4455", overlay:"rgba(12,12,12,0.94)",
  gradAccent:"linear-gradient(135deg,#FF6B2B,#FF9A6B)",
  gradLime:"linear-gradient(135deg,#C8F135,#8FB800)",
  gradSky:"linear-gradient(135deg,#60CFFF,#0099DD)",
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
  { key:"cash",     name:"Cash",     icon:"💵", color:"#00E096" },
  { key:"gcash",    name:"GCash",    icon:"📱", color:"#0070DC" },
  { key:"maya",     name:"Maya",     icon:"💜", color:"#7B5CF6" },
  { key:"bpi",      name:"BPI",      icon:"🏦", color:"#CC0000" },
  { key:"bdo",      name:"BDO",      icon:"🏦", color:"#003087" },
  { key:"maribank", name:"Maribank", icon:"🟢", color:"#00A86B" },
  { key:"seabank",  name:"SeaBank",  icon:"🟠", color:"#EE4D2D" },
  { key:"unionbank",name:"UnionBank",icon:"🏛️", color:"#E67E22" },
  { key:"other",    name:"Other",    icon:"💰", color:"#FFD060" },
];
const WALLET_ICONS  = ["💵","📱","💳","🏦","💰","🪙","💎","🎒","🔐","💼"];
const WALLET_COLORS = ["#00E096","#0070DC","#7B5CF6","#CC0000","#003087","#00A86B","#EE4D2D","#FFD060","#FF6B2B","#60CFFF"];
const SEED_LOANS = [
  { id:1, name:"Maya Credit",       amount:25000, paid:8000,  rate:3.5,   due:"Jun 15", type:"BNPL",     color:C.accent },
  { id:2, name:"BPI Personal Loan", amount:50000, paid:18000, rate:14.88, due:"Jun 30", type:"Personal", color:C.sky },
  { id:3, name:"GCash GLoan",       amount:9000,  paid:5500,  rate:5.9,   due:"Jun 22", type:"Cash Loan",color:C.gold },
];
const SEED_GOALS = [
  { id:1, name:"Japan Trip",     emoji:"✈️", target:80000,  saved:54400, deadline:"Oct 2025", color:C.accent },
  { id:2, name:"Emergency Fund", emoji:"🛡️", target:100000, saved:42000, deadline:"Dec 2025", color:C.sky },
  { id:3, name:"MacBook Pro",    emoji:"💻", target:90000,  saved:31050, deadline:"Mar 2026", color:C.rose },
  { id:4, name:"Move Out Fund",  emoji:"🏠", target:200000, saved:22000, deadline:"Jan 2027", color:C.gold },
];

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
// A raw phone photo can be 3–5MB as base64 — way over localStorage's 5MB total.
// After compression it's typically 30–80KB, safe to persist.
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

        {/* Presets — only on new */}
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
          <Inp value={name} onChange={setName} placeholder="e.g. GCash, BPI Savings, Cash…" autoFocus={editing}/>
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

// ─── WALLETS SCREEN ────────────────────────────────────────────────────────

function WalletsScreen({ wallets, setWallets, setScreen, embedded=false }) {
  const fmt = useFmt();
  const [sheet,   setSheet]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const total = wallets.reduce((s,w) => s + w.balance, 0);

  const saveWallet = w => {
    setWallets(prev => prev.find(x=>x.id===w.id) ? prev.map(x=>x.id===w.id?w:x) : [...prev,w]);
    setSheet(null);
  };
  const deleteWallet = id => { setWallets(prev=>prev.filter(w=>w.id!==id)); setConfirm(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, ...(embedded?{}:{padding:"22px 18px 16px"}) }} className={embedded?"":"screen-wrap"}>
      {sheet && <WalletSheet wallet={sheet==="add"?null:sheet} onSave={saveWallet} onClose={()=>setSheet(null)}/>}

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
        <div style={{ background:"linear-gradient(145deg,#1E1208,#181818)", border:`1px solid ${C.accent}35`, borderRadius:24, padding:"24px 22px 20px", position:"relative", overflow:"hidden" }}>
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
            Add your cash on hand, GCash, Maya, BPI — whatever you have. That's your real balance.
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
              <div style={{ width:50, height:50, borderRadius:16, background:w.color+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0, border:`1px solid ${w.color}30` }}>
                {w.icon}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{w.name}</p>
                <p style={{ margin:0, fontSize:26, fontWeight:800, color:w.color, fontFamily:"DM Sans,sans-serif", letterSpacing:"-0.02em" }}>{fmt(w.balance)}</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setSheet(w)} className="tap-btn" style={{
                  background:C.surface, border:`1px solid ${C.border}`, color:C.textSub,
                  borderRadius:10, padding:"8px 14px", cursor:"pointer",
                  fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700,
                }}>Edit</button>
                {confirm===w.id ? (
                  <button onClick={()=>deleteWallet(w.id)} className="tap-btn" style={{
                    background:C.coral, border:"none", borderRadius:10, padding:"8px 12px",
                    cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif",
                    fontWeight:800, color:"#fff",
                  }}>Confirm</button>
                ) : (
                  <button onClick={()=>setConfirm(w.id)} className="tap-btn" style={{
                    background:`${C.coral}14`, border:`1px solid ${C.coral}30`, color:C.coral,
                    borderRadius:10, padding:"8px 12px", cursor:"pointer",
                    fontSize:14, fontFamily:"DM Sans,sans-serif",
                  }}>🗑</button>
                )}
              </div>
            </div>
            {/* Share of total bar */}
            <Bar pct={total>0?(w.balance/total)*100:0} color={w.color} h={4}/>
            <p style={{ margin:"6px 0 0", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
              {total>0?Math.round((w.balance/total)*100):0}% of total
            </p>
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
        <div><SLabel>Lender / Name</SLabel><Inp value={name} onChange={setName} placeholder="e.g. BPI, Maya, Friend…" autoFocus/></div>
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
        <div><SLabel>Goal Name</SLabel><Inp value={name} onChange={setName} placeholder="e.g. Japan Trip, Emergency Fund…" autoFocus/></div>
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
              {/* Big amount input */}
              <div style={{ display:"flex", alignItems:"center", gap:6, borderBottom:`1px solid ${C.border}`, paddingBottom:14, marginBottom:14 }}>
                <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:32, fontWeight:800, color:C.textSub, lineHeight:1 }}>₱</span>
                <input
                  autoFocus type="text" inputMode="decimal" placeholder="0" value={amount}
                  onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))}
                  onKeyDown={e=>e.key==="Enter" && canProceed && setStep(1)}
                  style={{ background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:52, color:amount?C.text:C.textFaint, width:"100%", caretColor:C.accent, lineHeight:1, padding:"4px 0", WebkitAppearance:"none" }}
                />
              </div>

              {/* Quick amounts — fixed set */}
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

              {/* Additive pills — tap to add on top of current amount */}
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

              {/* Category grid — inline, no next button needed */}
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
                          <span>{w.icon}</span><span>{w.name}</span>
                          <span style={{ fontSize:10, opacity:0.75 }}>{fmt(w.balance)}</span>
                          {insuf&&<span>⚠️</span>}
                        </button>
                      );
                    })}
                  </div>
                  {insufficient && <p style={{ margin:"7px 0 0", fontSize:12, color:C.coral, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>⚠️ Not enough in {selectedWallet.name}</p>}
                </div>
              )}

              {/* Backdate — collapsed by default, expand if needed */}
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

              {/* Name — optional */}
              <div style={{ marginBottom:16 }}>
                <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>
                  Name <span style={{ color:C.textFaint, fontWeight:400, textTransform:"none", letterSpacing:0 }}>— optional</span>
                </p>
                <input
                  ref={nameRef}
                  value={name} onChange={e=>setName(e.target.value)}
                  placeholder={isGrocery ? "e.g. SM Supermarket run…" : `e.g. Jollibee, Grab, ${cat.label}…`}
                  onKeyDown={e=>e.key==="Enter"&&save()}
                  style={{ width:"100%", background:C.card, border:`1px solid ${name.trim()?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:15, fontWeight:600, outline:"none", fontFamily:"DM Sans,sans-serif", caretColor:C.accent, boxSizing:"border-box", transition:"border 0.18s" }}
                />
                <p style={{ margin:"5px 0 0", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Leave blank — will save as "{cat.label}"</p>
              </div>

              {/* Grocery items — only when grocery mode */}
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

              {/* Mood — inline emoji row */}
              <div style={{ marginBottom:22 }}>
                <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>
                  Feeling? <span style={{ color:C.textFaint, fontWeight:400, textTransform:"none", letterSpacing:0 }}>— optional</span>
                  {moodLogsCount<2 && <span style={{ color:C.rose, fontWeight:700 }}> · {2-moodLogsCount} more to unlock insights</span>}
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

        {/* Photo — shown at top if exists */}
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
              <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} · {expense.date}, {expense.time}</p>
            </div>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(expense.amount)}</p>
          </div>

          {m && (
            <div style={{ background:`${m.color}14`, border:`1px solid ${m.color}30`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:26 }}>{m.emoji}</span>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:m.color, fontFamily:"DM Sans,sans-serif" }}>Feeling {m.label.toLowerCase()}</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.id==="stressed"?"Heads up — stress spending adds up.":m.id==="happy"?"Happy purchases are the best kind.":m.id==="motivated"?"Smart spending. In the zone.":"Neutral day, neutral spend."}</p>
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

          {/* Add photo post-save — the whole point! */}
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
  { id:"other",     label:"Other",      icon:"📦", color:C.textSub },
];

const SUB_CYCLES = [
  { id:"monthly",  label:"Monthly",   months:1  },
  { id:"quarterly",label:"Quarterly", months:3  },
  { id:"yearly",   label:"Yearly",    months:12 },
  { id:"weekly",   label:"Weekly",    months:0.25 },
];

const SUB_PRESETS = [
  { name:"Netflix",      icon:"🎬", cat:"streaming", color:"#E50914", amount:269  },
  { name:"Spotify",      icon:"🎵", cat:"music",     color:"#1DB954", amount:159  },
  { name:"Apple Music",  icon:"🍎", cat:"music",     color:"#FC3C44", amount:149  },
  { name:"YouTube Premium",icon:"▶️",cat:"streaming", color:"#FF0000", amount:219  },
  { name:"Disney+",      icon:"✨", cat:"streaming", color:"#113CCF", amount:149  },
  { name:"Crunchyroll",  icon:"🍥", cat:"streaming", color:"#F47521", amount:99   },
  { name:"iCloud+",      icon:"☁️", cat:"cloud",     color:"#0061FF", amount:49   },
  { name:"Google One",   icon:"🔵", cat:"cloud",     color:"#4285F4", amount:99   },
  { name:"Canva Pro",    icon:"🎨", cat:"tools",     color:"#00C4CC", amount:499  },
  { name:"ChatGPT Plus", icon:"🤖", cat:"tools",     color:"#10A37F", amount:1099 },
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
        <div><SLabel>Name</SLabel><Inp autoFocus={editing||presetPicked} value={name} onChange={setName} placeholder="e.g. Netflix, Spotify…"/></div>

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

function SubscriptionsScreen({ subs, setSubs, setScreen, embedded=false }) {
  const [sheet,   setSheet]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [notifOk, setNotifOk] = useState(typeof Notification !== "undefined" && Notification.permission==="granted");
  const [filter,  setFilter]  = useState("active"); // active | all

  const saveSub = s => {
    setSubs(prev=>prev.find(x=>x.id===s.id)?prev.map(x=>x.id===s.id?s:x):[...prev,s]);
    setSheet(null);
  };

  const deleteSub  = id => { setSubs(prev=>prev.filter(s=>s.id!==id)); setConfirm(null); };
  const toggleActive = id => setSubs(prev=>prev.map(s=>s.id===id?{...s,active:!s.active}:s));

  // Mark paid: log payment date and advance next due
  const markPaid = id => {
    setSubs(prev=>prev.map(s=>{
      if (s.id!==id) return s;
      return { ...s, lastPaid:new Date().toISOString().split("T")[0], dueDate:advanceDue(s.dueDate, s.cycle) };
    }));
  };

  const enableNotifs = async () => {
    const ok = await requestNotifPermission();
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

      {/* Header — full screen mode only */}
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
        <div style={{ background:"linear-gradient(145deg,#1E1208,#181818)", border:`1px solid ${C.accent}35`, borderRadius:24, padding:"24px 22px 20px", position:"relative", overflow:"hidden" }}>
          <Orb x="60%" y="-20px" color={C.accent} size={200} opacity={0.2}/>
          <SLabel>Monthly subscriptions</SLabel>
          <h2 style={{ margin:"4px 0 2px", fontFamily:"DM Sans,sans-serif", fontSize:40, fontWeight:800, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>
            ₱{Math.round(monthlyTotal).toLocaleString()}
            <span style={{ fontSize:16, color:C.textSub, fontWeight:500 }}>/mo</span>
          </h2>
          <p style={{ margin:"0 0 14px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
            ₱{Math.round(yearlyTotal).toLocaleString()}/yr · {activeSubs.length} active subscription{activeSubs.length!==1?"s":""}
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
            <div key={s.id} style={{ background:`${urgColor(s.days)}0E`, border:`1.5px solid ${urgColor(s.days)}40`, borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:`${s.color||C.accent}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon||"📦"}</div>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{s.name}</p>
                <p style={{ margin:0, fontSize:11, color:urgColor(s.days), fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{urgLabel(s.days)} · {fmt(s.amount)}</p>
              </div>
              <button onClick={()=>markPaid(s.id)} className="tap-btn"
                style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, color:C.green, borderRadius:10, padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:800, fontFamily:"DM Sans,sans-serif", flexShrink:0 }}>
                ✓ Paid
              </button>
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
          <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Track Netflix, Spotify, iCloud — everything that auto-charges you.</p>
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
                <button onClick={()=>markPaid(s.id)} className="tap-btn"
                  style={{ flex:2, background:`${C.green}12`, border:`1px solid ${C.green}35`, color:C.green, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800 }}>
                  ✓ Mark paid
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
          </Card>
        );
      })}

      {subs.length>0&&(
        <p style={{ textAlign:"center", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif", padding:"4px 0 8px" }}>
          💡 Tap "Mark paid" after you're charged — it auto-advances the next due date.
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
      position:"sticky", bottom:0, zIndex:100,
    }}>
      <NavIcon icon={Home}       active={screen==="home"}     label="Home"     onClick={()=>setScreen("home")}/>
      <NavIcon icon={Receipt}    active={screen==="expenses"}  label="Expenses" onClick={()=>setScreen("expenses")}/>

      {/* Center add button */}
      <button onClick={onAdd} className="tap-btn" style={{
        width:54, height:54, borderRadius:"50%", border:"none",
        background:C.gradAccent, color:"#fff", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 6px 24px ${C.accentGlow}, 0 2px 8px rgba(0,0,0,0.4)`,
        marginTop:-22, flexShrink:0,
      }}>
        <Plus size={24} strokeWidth={2.5} color="#fff"/>
      </button>

      <NavIcon icon={Handshake}  active={screen==="utang"}    label="Utang"    onClick={()=>setScreen("utang")}/>
      <NavIcon icon={Wallet}     active={screen==="accounts"} label="Accounts" onClick={()=>setScreen("accounts")}/>
    </div>
  );
}

// ─── ONBOARDING ────────────────────────────────────────────────────────────

function BulsaLogo({ size=48 }) {
  const r = Math.round(size * 0.224);
  return (
    <div style={{ width:size, height:size, borderRadius:r, background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 20px ${C.accentGlow}`, flexShrink:0 }}>
      <span style={{ fontFamily:"Georgia,serif", fontSize:size*0.62, fontWeight:700, color:"#fff", lineHeight:1, marginTop:size*0.06 }}>b</span>
    </div>
  );
}

function Onboarding({ onDone }) {
  const [step,      setStep]     = useState(0);
  const [nameInput, setNameInput]= useState("");
  const [incInput,  setIncInput] = useState("");

  const isSetup = step === 3;

  const slides=[
    { logo:true,    title:"bulsa.", sub:"Pull money out of your pocket. Log it. Know where it goes. That's it.", cta:"Let's go" },
    { emoji:"📸", title:"Your spend,\nyour story.", sub:"Take a photo of your food, your grocery haul, your splurge. No judgment — just memory.", cta:"Love that" },
    { emoji:"🧠", title:"Feel it.\nTrack it.", sub:"Tag your mood when you spend. Spot the patterns. Break the cycle — or don't. Your call.", cta:"Almost there →" },
  ];

  const handleDone = () => {
    if (!nameInput.trim()) return;
    onDone({ name: nameInput.trim(), income: +incInput||0 });
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:"64px 28px calc(52px + env(safe-area-inset-bottom))", background:C.bg, position:"relative", overflow:"hidden" }}>
      <Orb x="-80px" y="60px" color={C.accent} size={320} opacity={0.13}/>
      <Orb x="100px" y="380px" color={C.lime} size={260} opacity={0.07}/>
      <div style={{ display:"flex", gap:6, zIndex:1 }}>
        {[...slides,{}].map((_,i)=>(<div key={i} style={{ width:i===step?24:6, height:6, borderRadius:99, background:i===step?C.accent:C.border, transition:"all 0.3s" }}/>))}
      </div>

      {!isSetup ? (()=>{ const s=slides[step]; return (
        <div style={{ textAlign:"center", zIndex:1, flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:26 }}>
          {s.logo ? <BulsaLogo size={100}/> : <div style={{ width:100, height:100, borderRadius:30, background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, boxShadow:`0 20px 60px ${C.accentGlow}` }}>{s.emoji}</div>}
          <h1 style={{ fontFamily:"DM Sans,sans-serif", fontSize:44, fontWeight:800, color:C.text, lineHeight:1.1, margin:0, whiteSpace:"pre-line", letterSpacing:"-0.025em" }}>{s.title}</h1>
          <p style={{ fontFamily:"DM Sans,sans-serif", fontSize:15, color:C.textSub, lineHeight:1.75, maxWidth:272, margin:0 }}>{s.sub}</p>
        </div>
      );})() : (
        <div style={{ zIndex:1, flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:24, width:"100%" }}>
          <div style={{ textAlign:"center", marginBottom:8 }}>
            <div style={{ width:72, height:72, borderRadius:22, background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 16px", boxShadow:`0 12px 40px ${C.accentGlow}` }}>👋</div>
            <h1 style={{ fontFamily:"DM Sans,sans-serif", fontSize:32, fontWeight:800, color:C.text, margin:"0 0 6px", letterSpacing:"-0.025em" }}>Set up your profile</h1>
            <p style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, color:C.textSub, margin:0 }}>Just two things and you're in.</p>
          </div>
          <div>
            <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>What's your name?</p>
            <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}
              placeholder="e.g. Reyn, Mico, Jessa..."
              onKeyDown={e=>e.key==="Enter"&&nameInput.trim()&&handleDone()}
              style={{ width:"100%", background:C.card, border:`1px solid ${nameInput.trim()?C.accent+"60":C.border}`, borderRadius:14, padding:"16px 18px", color:C.text, fontSize:18, fontWeight:800, outline:"none", fontFamily:"DM Sans,sans-serif", caretColor:C.accent, boxSizing:"border-box", transition:"border 0.2s" }}/>
          </div>
          <div>
            <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif" }}>Monthly income? (optional)</p>
            <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 18px", gap:8 }}>
              <span style={{ fontSize:18, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
              <input type="text" inputMode="decimal" value={incInput} onChange={e=>setIncInput(e.target.value.replace(/[^0-9]/g,""))}
                placeholder="You can set this later"
                style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:16, fontWeight:800, fontFamily:"DM Sans,sans-serif", caretColor:C.accent }}/>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
              {[15000,20000,25000,30000,40000,50000].map(q=>(<button key={q} onClick={()=>setIncInput(String(q))} style={{ background:incInput===String(q)?C.accentGlow:C.surface, border:`1px solid ${incInput===String(q)?C.accent+"55":C.border}`, color:incInput===String(q)?C.accent:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>₱{(q/1000).toFixed(0)}k</button>))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={()=> isSetup ? handleDone() : setStep(p=>p+1)}
        disabled={isSetup && !nameInput.trim()}
        style={{ background:isSetup&&!nameInput.trim()?C.border:C.gradAccent, color:"#fff", border:"none", borderRadius:16, padding:"18px 0", fontSize:16, fontWeight:800, fontFamily:"DM Sans,sans-serif", cursor:isSetup&&!nameInput.trim()?"not-allowed":"pointer", zIndex:1, width:"100%", boxShadow:isSetup&&!nameInput.trim()?"none":`0 8px 32px ${C.accentGlow}`, transition:"all 0.2s" }}>
        {isSetup ? (nameInput.trim() ? `Let's go, ${nameInput.split(" ")[0]} →` : "Enter your name first") : slides[step].cta}
      </button>
    </div>
  );
}

// ─── HOME ──────────────────────────────────────────────────────────────────

function HomeScreen({ expenses, budgets, income, name, loans, goals, setScreen, onAdd, dailyLimit, setDailyLimit, avatar, utangs, wallets, hidden, setHidden, subs=[], payday="both", showInstallBanner=false, onInstall, onDismissInstall }) {
  const fmt = useFmt();
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
      ? `${fmt(allowedPerDay - todaySpent)} left for today — cutting it close`
      : petsaDePeligro
      ? `Hold it. ${fmt(allowedPerDay - todaySpent)} left for today`
      : todaySpent === 0
      ? `You haven't spent anything today yet`
      : `${fmt(allowedPerDay - todaySpent)} left for today — you're good`;
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
    // Check today first — counts if under limit (even if day isn't done)
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
        ? `Magandang umaga, ${firstName}! 🌅 Yesterday ₱${ydSpent.toLocaleString()} — under budget.`
        : ydOver
        ? `Umaga na, ${firstName}. Yesterday was ₱${ydSpent.toLocaleString()} — a bit over. Fresh start today.`
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
        ? `Tanghali na, ${firstName}. ₱${todaySpent.toLocaleString()} spent so far — you're good. 🟢`
        : `Heads up, ${firstName}. ₱${todaySpent.toLocaleString()} spent today — check your limit. ⚠️`;
      subtext = budgetStreak && budgetStreak > 1
        ? `${budgetStreak}-day streak under budget. Don't break it.`
        : `Log everything — even the ₱35 taho.`;
      color = todaySpent > (runway?.allowedPerDay||dailyLimit||Infinity) ? C.gold : C.green;
    } else if (hour >= 17 && hour < 22) {
      // Evening
      const remaining = runway ? runway.allowedPerDay - todaySpent : dailyLimit - todaySpent;
      greeting = remaining > 0 && dailyLimit > 0
        ? `Gabi na, ${firstName}. ₱${remaining.toLocaleString()} left for today — close the ring. 🎯`
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

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14, position:"relative" }}>
      <Orb x="-50px" y="-30px" color={C.accent} size={260} opacity={0.09}/>

      {/* ── PWA INSTALL BANNER ── */}
      {showInstallBanner && (
        <div style={{ background:"linear-gradient(135deg,#1A1200,#181818)", border:`1px solid ${C.gold}40`, borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, zIndex:2 }}>
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
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <BulsaLogo size={36}/>
          <div>
            <h1 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text, letterSpacing:"-0.04em", lineHeight:1.1 }}>bulsa<span style={{ color:C.accent }}>.</span></h1>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Hey <span style={{ fontWeight:800, color:C.text }}>{name||"there"}</span> 👋</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setHidden(h=>!h)} style={{ background:hidden?`${C.accent}18`:C.surface, border:`1px solid ${hidden?C.accent+"40":C.border}`, borderRadius:99, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, transition:"all 0.2s" }}>
            {hidden ? "🙈" : "👁️"}
          </button>
          <div onClick={()=>setScreen("profile")} className="tap-btn" style={{ cursor:"pointer" }}>
            {avatar?(<img src={avatar} alt="avatar" style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", border:`2.5px solid ${C.accent}70` }}/>):(<div style={{ width:40, height:40, borderRadius:"50%", background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff", fontFamily:"DM Sans,sans-serif", boxShadow:`0 0 14px ${C.accentGlow}` }}>{name?name.charAt(0).toUpperCase():"?"}</div>)}
          </div>
        </div>
      </div>

      {/* ── MORNING BRIEF + RING + STREAK ── */}
      <div style={{ background:`linear-gradient(145deg,#151515,#111)`, border:`1px solid ${morningBrief.color}30`, borderRadius:22, padding:"16px 18px", display:"flex", gap:16, alignItems:"center", position:"relative", overflow:"hidden", zIndex:1 }}>
        <Orb x="80%" y="50%" color={morningBrief.color} size={140} opacity={0.1}/>

        {/* Daily ring — the close-the-ring moment */}
        <div style={{ flexShrink:0, position:"relative" }}>
          <Ring
            pct={ringPct}
            size={72}
            stroke={7}
            color={ringColor}
            bg={ringColor+"22"}
          >
            {dailyLimit > 0 ? (
              <div style={{ textAlign:"center" }}>
                <p style={{ margin:0, fontSize:10, fontWeight:800, color:ringColor, fontFamily:"DM Sans,sans-serif", lineHeight:1 }}>
                  {ringPct >= 100 ? "MAX" : `${Math.round(ringPct)}%`}
                </p>
                <p style={{ margin:0, fontSize:8, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>today</p>
              </div>
            ) : (
              <span style={{ fontSize:22 }}>💰</span>
            )}
          </Ring>
          {/* Streak badge on ring */}
          {budgetStreak !== null && budgetStreak > 0 && (
            <div style={{ position:"absolute", bottom:-4, right:-4, background:budgetStreak>=7?C.gold:budgetStreak>=3?C.lime:C.accent, borderRadius:99, minWidth:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${C.bg}`, padding:"0 4px" }}>
              <span style={{ fontSize:9, fontWeight:800, color:"#111", fontFamily:"DM Sans,sans-serif" }}>{budgetStreak}🔥</span>
            </div>
          )}
        </div>

        {/* Brief text */}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.4 }}>
            {morningBrief.greeting}
          </p>
          <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.4 }}>
            {morningBrief.subtext}
          </p>
          {/* Mini streak row */}
          {budgetStreak !== null && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:7 }}>
              <div style={{ display:"flex", gap:3 }}>
                {Array.from({length:7},(_,i)=>{
                  const d = new Date(); d.setDate(d.getDate()-i);
                  const ds = d.toDateString();
                  const sp = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===ds).reduce((s,e)=>s+e.amount,0);
                  const hl = i===0 ? todaySpent>0 : expenses.some(e=>e.ts&&new Date(e.ts).toDateString()===ds);
                  const ok = hl && (dailyLimit<=0 || sp<=dailyLimit);
                  const over = hl && dailyLimit>0 && sp>dailyLimit;
                  return (
                    <div key={i} style={{ width:8, height:8, borderRadius:"50%", background: over?C.coral:ok?C.green:C.border, transition:"background 0.3s" }}/>
                  );
                }).reverse()}
              </div>
              <span style={{ fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>last 7 days</span>
              {budgetStreak >= 3 && (
                <span style={{ fontSize:10, fontWeight:800, color:budgetStreak>=7?C.gold:C.lime, fontFamily:"DM Sans,sans-serif", marginLeft:"auto" }}>
                  {budgetStreak} day streak 🔥
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 1. TODAY HERO — the main event ── */}
      {(()=>{
        const todayExps  = expenses.filter(e=>e.ts&&new Date(e.ts).toDateString()===todayStr).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
        const todayTotal = todayExps.reduce((s,e)=>s+e.amount,0);
        const overLimit  = dailyLimit>0 && todayTotal>dailyLimit;
        const nearLimit  = dailyLimit>0 && !overLimit && (todayTotal/dailyLimit)>0.8;
        const heroColor  = overLimit?C.coral:nearLimit?C.gold:C.accent;
        const todayPct   = dailyLimit>0?Math.min((todayTotal/dailyLimit)*100,100):0;
        return (
          <div style={{ background:"linear-gradient(145deg,#1E1208,#181818)", border:`1px solid ${heroColor}40`, borderRadius:24, padding:"24px 22px 20px", position:"relative", overflow:"hidden", zIndex:1 }}>
            <Orb x="80%" y="-20px" color={heroColor} size={200} opacity={0.2}/>
            {/* Date label */}
            <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:800, color:C.textFaint, textTransform:"uppercase", letterSpacing:"0.09em", fontFamily:"DM Sans,sans-serif", zIndex:1, position:"relative" }}>
              {new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric"})}
            </p>
            {/* Main number */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16, position:"relative", zIndex:1 }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Spent today</p>
                <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:52, fontWeight:800, color:overLimit?C.coral:nearLimit?C.gold:C.text, letterSpacing:"-0.04em", lineHeight:1 }}>{fmt(todayTotal)}</h2>
              </div>
              <div style={{ textAlign:"right", paddingBottom:6 }}>
                <p style={{ margin:"0 0 4px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{todayExps.length} transaction{todayExps.length!==1?"s":""}</p>
                {overLimit&&<Tag color={C.coral}>Over limit</Tag>}
                {nearLimit&&<Tag color={C.gold}>Almost there</Tag>}
                {!overLimit&&!nearLimit&&todayExps.length>0&&<Tag color={C.green}>On track</Tag>}
              </div>
            </div>
            {/* Daily limit bar */}
            {dailyLimit>0&&(
              <div style={{ marginBottom:10, position:"relative", zIndex:1 }}>
                <Bar pct={todayPct} color={heroColor} h={6}/>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span style={{ fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{fmt(dailyLimit)} daily limit</span>
                  <span style={{ fontSize:10, fontWeight:700, color:heroColor, fontFamily:"DM Sans,sans-serif" }}>{overLimit?`over by ${fmt(todayTotal-dailyLimit)}`:`${fmt(dailyLimit-todayTotal)} left`}</span>
                </div>
              </div>
            )}
            {/* Balance strip — available + can spend/day only, no wallet breakdown */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", paddingTop:12, borderTop:`1px solid ${C.accent}20`, position:"relative", zIndex:1 }}>
              <div style={{ background:C.surface+"CC", borderRadius:9, padding:"6px 12px" }}>
                <p style={{ margin:"0 0 1px", fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Available</p>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(balance)}</p>
              </div>
              {runway && (
                <div style={{ background:`${runway.color}15`, border:`1px solid ${runway.color}25`, borderRadius:9, padding:"6px 12px" }}>
                  <p style={{ margin:"0 0 1px", fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Can spend/day</p>
                  <p style={{ margin:0, fontSize:13, fontWeight:800, color:runway.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(runway.allowedPerDay)}</p>
                </div>
              )}
            </div>
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
                        <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} · {e.time}</p>
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

      {/* ── 3. ALERTS — only if triggered ── */}
      {budgetOver>0&&(<Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}30` }} glow danger onClick={()=>setScreen("expenses")}><div style={{ display:"flex", gap:12, alignItems:"center" }}><span style={{ fontSize:22 }}>⚠️</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Over budget in {budgetOver} {budgetOver===1?"category":"categories"}</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Tap to review →</p></div></div></Card>)}

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
                <p style={{ margin:"0 0 8px", fontSize:13, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.55 }}><strong style={{ color:C.coral }}>{fmt(stressAmt)}</strong> spent while stressed — {Math.round((stressAmt/totalSpent)*100)}% of your total.</p>
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
          if(totalAll>0&&totalAll/income>0.8) tip={ icon:"🚨", text:"You've spent over 80% of your income. Try withdrawing only what you plan to use — leave the rest in your account." };
          else if(foodAmt/totalAll>0.4) tip={ icon:"🍜", text:`Food is ${Math.round((foodAmt/totalAll)*100)}% of your spending. Try cooking 2x a week — kahit simpleng ulam. Malaking tipid over a month.` };
          else if(shopAmt/totalAll>0.25) tip={ icon:"🛍️", text:"Wait 48 hours before any purchase over ₱500. Madalas, mawawala na yung gusto mo." };
          else if(fri>wkAvg*1.8||sat>wkAvg*1.8) tip={ icon:"📅", text:"Weekends are where your money disappears. Set a cash allowance on Friday morning — once it's gone, it's gone." };
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
    if (income>0 && totalSpent/income>0.8) tips.push({ icon:"🚨", tip:`You've spent ${Math.round((totalSpent/income)*100)}% of your income. Classic one-day-millionaire move. Withdraw only what you plan to spend — leave the rest in your account.` });
    if (foodPct>0.4) tips.push({ icon:"🍜", tip:`Food is ${Math.round(foodPct*100)}% of your spending. Try cooking 2x a week — kahit simpleng ulam lang. Malaking tipid over a month.` });
    if (shopPct>0.25) tips.push({ icon:"🛍️", tip:`Shopping is at ${Math.round(shopPct*100)}% this month. Use the 48-hour rule — wait 2 days before buying anything over ₱500. Madalas, mawawala na yung gusto.` });
    if (fri>weekdayAvg*1.8||sat>weekdayAvg*1.8) tips.push({ icon:"📅", tip:"Weekends are where your money disappears. Set a weekend allowance on Friday morning — once it's gone, it's gone." });
    if (dailyLimit>0&&todaySpent>dailyLimit*0.9) tips.push({ icon:"⚠️", tip:`You're ${dailyOver?"over":"near"} your daily limit today. Avoid GCash or GrabFood tonight — those small orders add up fast.` });
    if (tips.length===0) tips.push({ icon:"✅", tip:"Your spending looks balanced this month. Keep logging — mas magiging clear ang pattern mo over time." });
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
              <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>spent this week · {thisWeek.length} transactions</p>
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
            {byDay[peakDayIdx]>0&&<p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>You spend the most on <strong style={{ color:C.accent }}>{DAYS[peakDayIdx]}</strong> — {fmt(byDay[peakDayIdx])} total. Plan ahead for it.</p>}
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
                  <div style={{ textAlign:"right" }}><span style={{ fontSize:13, fontWeight:800, color:c.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(c.total)}</span><span style={{ fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}> · {totalSpent?Math.round((c.total/totalSpent)*100):0}%</span></div>
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
    ? `${weekStart.toLocaleDateString("en-PH",{month:"short",day:"numeric"})} – ${now.toLocaleDateString("en-PH",{month:"short",day:"numeric"})}`
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
                  <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{catOf(e.catId).label} · {e.time}{e.groceryItems?.length>0&&<span style={{ color:C.lime }}> · 🛒{e.groceryItems.length}</span>}{e.photo&&<span style={{ color:C.textFaint }}> · 📸</span>}</p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ margin:"0 0 3px", fontSize:14, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(e.amount)}</p>
                  {m?<span style={{ fontSize:13 }}>{m.emoji}</span>:<span style={{ fontSize:10, color:C.textFaint }}>—</span>}
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
                            <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} · {e.time}{e.groceryItems?.length>0&&<span style={{ color:C.lime }}> · 🛒{e.groceryItems.length}</span>}{e.photo&&<span style={{ color:C.textFaint }}> · 📸</span>}</p>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <p style={{ margin:"0 0 3px", fontSize:14, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(e.amount)}</p>
                            {m?<span style={{ fontSize:13 }}>{m.emoji}</span>:<span style={{ fontSize:10, color:C.textFaint }}>—</span>}
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

// ─── EXPENSES ──────────────────────────────────────────────────────────────

function ExpensesScreen({ expenses, setExpenses, budgets, setBudgets, onAdd, dailyLimit, setDailyLimit, income, subs, setSubs }) {
  const fmt = useFmt();
  const [view,      setView]     = useState("list");
  const [detail,    setDetail]   = useState(null);
  const [editExp,   setEditExp]  = useState(null);
  const [editB,     setEditB]    = useState(null);
  const [bInput,    setBInput]   = useState("");
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

  const TABS = [["list","List"],["budget","Budget"],["subs","Subs"],["mood","Mood"],["insights","Insights"]];

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
      {view==="budget"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <Card style={{ background:`${C.accent}0A`, border:`1px solid ${C.accent}20`, padding:"12px 14px" }}><p style={{ margin:0, fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Set monthly limits per category. Tap <strong style={{ color:C.accentSoft }}>Set / Edit</strong> to customize.</p></Card>
          {CATS.map(c=>{ const spent=expenses.filter(e=>e.catId===c.id).reduce((s,e)=>s+e.amount,0),limit=budgets[c.id]||0,pct=limit?Math.min((spent/limit)*100,100):0,over=spent>limit&&limit>0,isEdit=editB===c.id; return (
            <Card key={c.id} style={{ border:`1px solid ${over?C.coral+"40":C.border}` }} glow={over} danger={over}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:limit>0?12:0 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:c.color+"1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{c.icon}</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{c.label}</p>
                  {isEdit?(
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:4 }}>
                      <span style={{ fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
                      <input autoFocus type="number" value={bInput} onChange={e=>setBInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ setBudgets(b=>({...b,[c.id]:+bInput||0})); setEditB(null); } if(e.key==="Escape") setEditB(null); }} style={{ background:C.surface, border:`1px solid ${C.accent}50`, borderRadius:8, padding:"4px 8px", color:C.text, fontSize:14, outline:"none", fontFamily:"DM Sans,sans-serif", width:90 }}/>
                      <button onClick={()=>{ setBudgets(b=>({...b,[c.id]:+bInput||0})); setEditB(null); }} style={{ background:C.accentGlow, border:`1px solid ${C.accent}40`, color:C.accent, borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Set</button>
                    </div>
                  ):(
                    <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(spent)} {limit>0?`of ${fmt(limit)}`:"— no limit set"}{over&&<strong style={{ color:C.coral }}> · OVER!</strong>}</p>
                  )}
                </div>
                {!isEdit&&<button onClick={()=>{ setEditB(c.id); setBInput(String(limit||"")); }} style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:9, padding:"5px 10px", cursor:"pointer", fontSize:11, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{limit>0?"Edit":"Set"}</button>}
              </div>
              {limit>0&&<Bar pct={pct} color={over?C.coral:pct>80?C.gold:c.color} h={5}/>}
            </Card>
          );})}
        </div>
      )}

      {view==="subs"&&(
        <SubscriptionsScreen subs={subs||[]} setSubs={setSubs} embedded/>
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
              {bymood.map(m=>(<Card key={m.id}><div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}><span style={{ fontSize:32 }}>{m.emoji}</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{m.label}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.count} purchase{m.count>1?"s":""} · {m.pct}% of spending</p></div><p style={{ margin:0, fontSize:16, fontWeight:800, color:m.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(m.amount)}</p></div><Bar pct={m.pct} color={m.color} h={6}/></Card>))}
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

function PaymentSheet({ utang, onSave, onClose }) {
  const color     = utang.direction==="iowe" ? C.coral : C.green;
  const remaining = utang.amount - (utang.payments||[]).reduce((s,p)=>s+p.amount,0);
  const today     = new Date().toISOString().split("T")[0];
  const [amt,  setAmt]  = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  const save = () => {
    if (!amt || +amt<=0) return;
    onSave({ id:uid(), amount:+amt, date, note:note.trim(),
      label:new Date(date+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) });
  };

  return (
    <BottomSheet onClose={onClose} title={`Log payment · ${utang.person}`}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:`${color}10`, border:`1px solid ${color}30`, borderRadius:14, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Still remaining</p>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color, fontFamily:"DM Sans,sans-serif" }}>{fmt(remaining)}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ margin:"0 0 2px", fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Original</p>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(utang.amount)}</p>
          </div>
        </div>

        <div>
          <SLabel>Payment amount</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.cardAlt, border:`1px solid ${amt?color+"60":C.border}`, borderRadius:14, padding:"12px 16px", gap:8 }}>
            <span style={{ fontSize:22, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
            <input autoFocus type="text" inputMode="decimal" value={amt}
              onChange={e=>setAmt(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:28, fontWeight:800, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {[100,200,500,1000].filter(q=>q<remaining).map(q=>(
              <button key={q} onClick={()=>setAmt(String(q))} className="tap-btn"
                style={{ background:amt===String(q)?`${color}20`:C.card, border:`1px solid ${amt===String(q)?color+"55":C.border}`, color:amt===String(q)?color:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>
                ₱{q.toLocaleString()}
              </button>
            ))}
            <button onClick={()=>setAmt(String(Math.round(remaining)))} className="tap-btn"
              style={{ background:amt===String(Math.round(remaining))?`${color}20`:C.card, border:`1px solid ${amt===String(Math.round(remaining))?color+"55":C.border}`, color:amt===String(Math.round(remaining))?color:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:800, fontFamily:"DM Sans,sans-serif" }}>
              Full ({fmt(remaining)})
            </button>
          </div>
          {+amt>0&&(
            <p style={{ margin:"8px 0 0", fontSize:11, fontFamily:"DM Sans,sans-serif", color:remaining-+amt<=0?C.green:C.textSub }}>
              After: <strong style={{ color:remaining-+amt<=0?C.green:C.text }}>{remaining-+amt<=0?"🎉 Fully settled!":fmt(Math.max(remaining-+amt,0))+" remaining"}</strong>
            </p>
          )}
        </div>

        <div>
          <SLabel>Date paid</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${date!==today?color+"60":C.border}`, borderRadius:14, padding:"10px 14px", gap:10 }}>
            <span style={{ fontSize:16 }}>📅</span>
            <input type="date" value={date} max={today} onChange={e=>setDate(e.target.value)}
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:14, fontWeight:700, fontFamily:"DM Sans,sans-serif", caretColor:color }}/>
            {date!==today&&<Tag color={color}>Past date</Tag>}
          </div>
        </div>

        <div>
          <SLabel>Note (optional)</SLabel>
          <Inp value={note} onChange={setNote} placeholder="e.g. GCash transfer, cash bayad…"/>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:+amt>0?1:0.4, background:`linear-gradient(135deg,${color},${color}bb)`, boxShadow:"none" }}>Log payment</Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

function UtangScreen({ utangs, setUtangs, loans, setLoans, setScreen }) {
  const [utangTab, setUtangTab] = useState("personal"); // "personal" | "loans"
  const fmt = useFmt();
  const [view,     setView]     = useState("all");
  const [sheet,    setSheet]    = useState(null);
  const [paySheet, setPaySheet] = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [expanded, setExpanded] = useState({});

  const saveUtang  = u => { setUtangs(prev=>prev.find(x=>x.id===u.id)?prev.map(x=>x.id===u.id?u:x):[...prev,u]); setSheet(null); };
  const deleteUtang= id=> { setUtangs(prev=>prev.filter(x=>x.id!==id)); setConfirm(null); };
  const markSettled= id=> setUtangs(prev=>prev.map(x=>x.id===id?{...x,settled:!x.settled}:x));

  const logPayment = (utangId, payment) => {
    setUtangs(prev=>prev.map(u=>{
      if (u.id!==utangId) return u;
      const payments  = [...(u.payments||[]), payment];
      const totalPaid = payments.reduce((s,p)=>s+p.amount,0);
      return { ...u, payments, settled: totalPaid>=u.amount };
    }));
    setPaySheet(null);
  };

  const remaining  = u => Math.max(u.amount-(u.payments||[]).reduce((s,p)=>s+p.amount,0), 0);
  const iOwe       = utangs.filter(u=>u.direction==="iowe"   &&!u.settled);
  const theyOwe    = utangs.filter(u=>u.direction==="theyowe"&&!u.settled);
  const settled    = utangs.filter(u=>u.settled);
  const iOweTotal  = iOwe.reduce((s,u)=>s+remaining(u),0);
  const theyOweTotal=theyOwe.reduce((s,u)=>s+remaining(u),0);
  const filtered   = view==="iowe"?iOwe:view==="theyowe"?theyOwe:[...iOwe,...theyOwe,...settled];

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {sheet&&<UtangSheet utang={sheet==="add"?null:sheet} onSave={saveUtang} onClose={()=>setSheet(null)}/>}
      {paySheet&&<PaymentSheet utang={paySheet} onSave={p=>logPayment(paySheet.id,p)} onClose={()=>setPaySheet(null)}/>}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <BackBtn onClick={()=>setScreen("home")}/>
          <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Utang</h2>
          <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Loans & personal IOUs</p>
        </div>
        {utangTab === "personal" && (
          <button onClick={()=>setSheet("add")} className="tap-btn" style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", background:C.surface, borderRadius:14, padding:4, border:`1px solid ${C.border}`, gap:2 }}>
        {[["personal","🤝 Personal Utang"],["loans","💳 Loans & Installments"]].map(([v,l])=>(
          <button key={v} onClick={()=>setUtangTab(v)} className="tap-btn"
            style={{ flex:1, padding:"10px 6px", borderRadius:11, border:"none", cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontSize:12, fontWeight:800,
              background: utangTab===v ? C.accent : "none",
              color: utangTab===v ? "#fff" : C.textSub,
              transition:"all 0.18s",
            }}>{l}</button>
        ))}
      </div>

      {/* Loans tab — embed LoansScreen content inline */}
      {utangTab === "loans" && (
        <LoansScreen loans={loans} setLoans={setLoans} setScreen={setScreen} embedded/>
      )}

      {/* Personal utang tab */}
      {utangTab === "personal" && (<>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28` }}>
          <SLabel>I still owe</SLabel>
          <p style={{ margin:"4px 0 2px", fontSize:24, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{fmt(iOweTotal)}</p>
          <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{iOwe.length} pending</p>
        </Card>
        <Card style={{ background:`${C.green}08`, border:`1px solid ${C.green}28` }}>
          <SLabel>They still owe</SLabel>
          <p style={{ margin:"4px 0 2px", fontSize:24, fontWeight:800, color:C.green, fontFamily:"DM Sans,sans-serif" }}>{fmt(theyOweTotal)}</p>
          <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{theyOwe.length} pending</p>
        </Card>
      </div>

      {(iOwe.length>0||theyOwe.length>0)&&(
        <Card style={{ textAlign:"center", padding:"12px 16px" }}>
          <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
            Net position: {theyOweTotal>=iOweTotal
              ?<strong style={{ color:C.green }}>+{fmt(theyOweTotal-iOweTotal)} in your favor</strong>
              :<strong style={{ color:C.coral }}>-{fmt(iOweTotal-theyOweTotal)} you owe more</strong>}
          </p>
        </Card>
      )}

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
          <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Track who owes who — for lunches, GCash, or basta.</p>
          <button onClick={()=>setSheet("add")} className="tap-btn" style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:16, padding:"14px 32px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add utang</button>
        </div>
      )}

      {filtered.map((u,i)=>{
        const color     = u.direction==="iowe" ? C.coral : C.green;
        const payments  = u.payments||[];
        const totalPaid = payments.reduce((s,p)=>s+p.amount,0);
        const rem       = Math.max(u.amount-totalPaid, 0);
        const pct       = Math.min((totalPaid/u.amount)*100, 100);
        const isExp     = expanded[u.id];
        return (
          <Card key={u.id} animDelay={i*40} style={{ opacity:u.settled?0.65:1, border:`1.5px solid ${u.settled?C.border:color+"40"}` }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:u.direction==="iowe"?`${C.coral}15`:`${C.green}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                {u.direction==="iowe"?"😬":"🤑"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{u.person}</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>
                  {u.direction==="iowe"?"I owe them":"They owe me"}
                  {u.note&&<span style={{ color:C.textFaint }}> · "{u.note}"</span>}
                </p>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                {u.settled?(
                  <Tag color={C.green}>Settled ✓</Tag>
                ):(
                  <>
                    <p style={{ margin:"0 0 1px", fontSize:20, fontWeight:800, color, fontFamily:"DM Sans,sans-serif", letterSpacing:"-0.02em" }}>{fmt(rem)}</p>
                    {totalPaid>0&&<p style={{ margin:0, fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>of {fmt(u.amount)}</p>}
                  </>
                )}
              </div>
            </div>

            {!u.settled&&totalPaid>0&&(
              <div style={{ marginBottom:10 }}>
                <Bar pct={pct} color={color} h={6}/>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                  <span style={{ fontSize:10, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Paid {fmt(totalPaid)}</span>
                  <span style={{ fontSize:10, color, fontWeight:800, fontFamily:"DM Sans,sans-serif" }}>{Math.round(pct)}%</span>
                </div>
              </div>
            )}

            {payments.length>0&&(
              <div style={{ marginBottom:10 }}>
                <button onClick={()=>setExpanded(p=>({...p,[u.id]:!p[u.id]}))} className="tap-btn"
                  style={{ background:"none", border:"none", color:C.textSub, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif", padding:"0 0 6px", display:"flex", alignItems:"center", gap:4 }}>
                  {isExp?"▾":"▸"} {payments.length} payment{payments.length!==1?"s":""} logged
                </button>
                {isExp&&(
                  <div style={{ background:C.bg, borderRadius:12, padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
                    {payments.slice().reverse().map((p,pi)=>(
                      <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:pi<payments.length-1?6:0, borderBottom:pi<payments.length-1?`1px solid ${C.border}`:undefined }}>
                        <div>
                          <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(p.amount)}</p>
                          {p.note&&<p style={{ margin:0, fontSize:10, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{p.note}</p>}
                        </div>
                        <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{p.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!u.settled&&(
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setPaySheet(u)} className="tap-btn"
                  style={{ flex:2, background:`${color}15`, border:`1px solid ${color}40`, color, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800 }}>
                  💸 Log payment
                </button>
                <button onClick={()=>markSettled(u.id)} className="tap-btn"
                  style={{ flex:1, background:`${C.green}10`, border:`1px solid ${C.green}30`, color:C.green, borderRadius:10, padding:"9px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>
                  ✓ Settle
                </button>
                <button onClick={()=>setSheet(u)} className="tap-btn"
                  style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:10, padding:"9px 12px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>
                  ✎
                </button>
                {confirm===u.id?(
                  <button onClick={()=>deleteUtang(u.id)} className="tap-btn"
                    style={{ background:C.coral, border:"none", borderRadius:10, padding:"9px 12px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800, color:"#fff" }}>✓</button>
                ):(
                  <button onClick={()=>setConfirm(u.id)} className="tap-btn"
                    style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}35`, color:C.coral, borderRadius:10, padding:"9px 10px", cursor:"pointer", fontSize:13, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>🗑</button>
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
  const [amount,    setAmount]    = useState(utang?.amount?String(utang.amount):"");
  const [direction, setDirection] = useState(utang?.direction||"iowe");
  const [note,      setNote]      = useState(utang?.note||"");

  const save = () => {
    if (!person.trim()||!amount||+amount<=0) return;
    onSave({ id:utang?.id||uid(), person:person.trim(), amount:+amount, direction, note:note.trim(),
      settled:utang?.settled||false, payments:utang?.payments||[], ts:utang?.ts||new Date().toISOString() });
  };

  return (
    <BottomSheet onClose={onClose} title={utang?"Edit utang":"Log utang"}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[{ val:"iowe", label:"I owe them", emoji:"😬", color:C.coral },{ val:"theyowe", label:"They owe me", emoji:"🤑", color:C.green }].map(opt=>(
            <button key={opt.val} onClick={()=>setDirection(opt.val)} className="tap-btn"
              style={{ padding:"14px 10px", borderRadius:14, border:`2px solid ${direction===opt.val?opt.color+"80":C.border}`, background:direction===opt.val?`${opt.color}12`:C.card, cursor:"pointer", textAlign:"center" }}>
              <p style={{ margin:"0 0 4px", fontSize:22 }}>{opt.emoji}</p>
              <p style={{ margin:0, fontSize:12, fontWeight:800, color:direction===opt.val?opt.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{opt.label}</p>
            </button>
          ))}
        </div>
        <div><SLabel>Who?</SLabel><Inp autoFocus value={person} onChange={setPerson} placeholder="e.g. Mico, Jessa, Sir JA…"/></div>
        <div>
          <SLabel>Total amount</SLabel>
          <div style={{ display:"flex", alignItems:"center", background:C.card, border:`1px solid ${amount?C.accent+"60":C.border}`, borderRadius:14, padding:"12px 16px", gap:8 }}>
            <span style={{ fontSize:22, fontWeight:800, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱</span>
            <input type="text" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:28, fontWeight:800, fontFamily:"DM Sans,sans-serif", caretColor:C.accent }}/>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
            {[50,100,200,500,1000].map(q=>(<button key={q} onClick={()=>setAmount(String(q))} className="tap-btn" style={{ background:amount===String(q)?C.accentGlow:C.card, border:`1px solid ${amount===String(q)?C.accent+"55":C.border}`, color:amount===String(q)?C.accent:C.textSub, borderRadius:99, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>₱{q}</button>))}
          </div>
        </div>
        <div><SLabel>For what? (optional)</SLabel><Inp value={note} onChange={setNote} placeholder="e.g. lunch, GCash load, taxi share…"/></div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} style={{ opacity:person.trim()&&+amount>0?1:0.4 }}>Log it</Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── LOANS ─────────────────────────────────────────────────────────────────

function LoansScreen({ loans, setLoans, setScreen, embedded=false }) {
  const fmt = useFmt();
  const [sheet,   setSheet]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const total     = loans.reduce((s,l)=>s+l.amount,0);
  const paid      = loans.reduce((s,l)=>s+l.paid,0);
  const saveLoan  = loan=>{ setLoans(prev=>prev.find(l=>l.id===loan.id)?prev.map(l=>l.id===loan.id?loan:l):[...prev,loan]); setSheet(null); };
  const deleteLoan= id=>{ setLoans(prev=>prev.filter(l=>l.id!==id)); setConfirm(null); };

  return (
    <div className="screen-wrap" style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {sheet&&<LoanSheet loan={sheet==="add"?null:sheet} onSave={saveLoan} onClose={()=>setSheet(null)}/>}
      {!embedded && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <BackBtn onClick={()=>setScreen("home")}/>
            <h2 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Loans & Debt</h2>
          </div>
          <button onClick={()=>setSheet("add")} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>
        </div>
      )}
      {embedded && (
        <button onClick={()=>setSheet("add")} className="tap-btn" style={{ alignSelf:"flex-end", background:C.gradAccent, border:"none", borderRadius:12, padding:"8px 16px", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add loan</button>
      )}

      {loans.length===0?(
        <div style={{ textAlign:"center", padding:"60px 0 40px", animation:"scaleIn 0.3s ease" }}>
          <div style={{ width:88, height:88, borderRadius:28, background:`${C.green}12`, border:`2px dashed ${C.green}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 18px" }}>🎉</div>
          <p style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Debt-free!</p>
          <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>No loans tracked. Add one if needed.</p>
          <button onClick={()=>setSheet("add")} className="tap-btn" style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:16, padding:"14px 32px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add a loan</button>
        </div>
      ):(
        <>
          <Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28` }}>
            <SLabel>Total Remaining Debt</SLabel>
            <p style={{ margin:"0 0 14px", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:36, color:C.text }}>{fmt(total-paid)}</p>
            <Bar pct={total?(paid/total)*100:0} color={C.green} h={7}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Paid: {fmt(paid)}</span>
              <span style={{ fontSize:11, color:C.green, fontWeight:800, fontFamily:"DM Sans,sans-serif" }}>{total?Math.round((paid/total)*100):0}% done</span>
            </div>
          </Card>

          {loans.map(loan=>{ const pct=Math.round((loan.paid/loan.amount)*100); return (
            <Card key={loan.id} glow>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ flex:1 }}><p style={{ margin:"0 0 6px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{loan.name}</p><Tag color={loan.color}>{loan.type}</Tag></div>
                <Ring pct={pct} size={56} stroke={5} color={loan.color}><span style={{ fontSize:10, fontWeight:800, color:loan.color, fontFamily:"DM Sans,sans-serif" }}>{pct}%</span></Ring>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                {[["Total",fmt(loan.amount)],["Remaining",fmt(loan.amount-loan.paid)],["Rate",`${loan.rate}%`]].map(([l,v])=>(<div key={l}><SLabel>{l}</SLabel><p style={{ margin:0, fontSize:14, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{v}</p></div>))}
              </div>
              <Bar pct={pct} color={loan.color} h={5}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{loan.due?`Due ${loan.due}`:"No due date"}</span>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setSheet(loan)} style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Edit</button>
                  {confirm===loan.id?(
                    <button onClick={()=>deleteLoan(loan.id)} style={{ background:C.coral, border:"none", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:800, color:"#fff" }}>Confirm</button>
                  ):(
                    <button onClick={()=>setConfirm(loan.id)} style={{ background:`${C.coral}18`, border:`1px solid ${C.coral}40`, color:C.coral, borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Delete</button>
                  )}
                </div>
              </div>
            </Card>
          );})}
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

      {/* Embedded screens — no header, no back btn */}
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
      tip:"Start here. This covers one bad month — job loss, hospital visit, broken phone.",
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
          <div style={{ background:`linear-gradient(145deg,#0E1A10,#181818)`, border:`1px solid ${tiers[activeTier].color}40`, borderRadius:22, padding:"24px 20px", position:"relative", overflow:"hidden" }}>
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
                {fmt(tiers[activeTier].target-efSaved)} to go · save <strong style={{ color:tiers[activeTier].color }}>{fmt(Math.round((tiers[activeTier].target-efSaved)/6))}/mo</strong> to get there in 6 months
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
                      <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:isDone?t.color:isActive?C.text:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Level {t.level} · {t.name}</p>
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

function SurviveScreen({ expenses, income, loans, goals, payday, setScreen }) {
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
    statusMsg="Ayos ka pa. Keep going — huwag lang mag-justify ng unnecessary purchases.";
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
      <Card style={{ background:"linear-gradient(145deg,#1E1208,#181818)", border:`1px solid ${spendPerDay>0?C.accent+"45":C.coral+"45"}`, textAlign:"center", padding:"28px 20px" }}>
        <SLabel>You can spend per day</SLabel>
        <p style={{ margin:"10px 0 6px", fontFamily:"DM Sans,sans-serif", fontSize:56, fontWeight:800, color:spendPerDay>0?C.accent:C.coral, letterSpacing:"-0.035em", lineHeight:1 }}>{fmt(spendPerDay)}</p>
        <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{daysLeft} day{daysLeft!==1?"s":""} until {cycle.label} · <span style={{ color:C.text, fontWeight:700 }}>{fmt(balance)}</span> left</p>
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

      {totalDebt>0&&(<Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28`, padding:"14px 16px" }}><div style={{ display:"flex", gap:10, alignItems:"center" }}><span style={{ fontSize:22 }}>⊗</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Don't forget your loans</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalDebt)} total remaining debt</p></div></div></Card>)}
      {topGoal&&(<Card style={{ background:`${topGoal.color}0C`, border:`1px solid ${topGoal.color}28`, padding:"14px 16px" }}><div style={{ display:"flex", gap:10, alignItems:"center" }}><span style={{ fontSize:22 }}>{topGoal.emoji}</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{topGoal.name}</p><p style={{ margin:0, fontSize:12, color:topGoal.color, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{fmt(topGoal.target-topGoal.saved)} to go</p></div><Ring pct={Math.round((topGoal.saved/topGoal.target)*100)} size={44} stroke={4} color={topGoal.color}><span style={{ fontSize:9, fontWeight:800, color:topGoal.color, fontFamily:"DM Sans,sans-serif" }}>{Math.round((topGoal.saved/topGoal.target)*100)}%</span></Ring></div></Card>)}

      <p style={{ margin:"4px 0 0", textAlign:"center", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Kaya mo 'yan. 🇵🇭</p>
    </div>
  );
}

// ─── PROFILE ───────────────────────────────────────────────────────────────

function ProfileScreen({ income, setIncome, name, setName, avatar, setAvatar, expenses, setExpenses, setScreen, payday, setPayday }) {
  const fmt = useFmt();
  const [editIncome,  setEditIncome]  = useState(false);
  const [editName,    setEditName]    = useState(false);
  const [incInput,    setIncInput]    = useState(String(income));
  const [nameInput,   setNameInput]   = useState(name);
  const [confirmClear, setCC]       = useState(false);
  const avatarRef = useRef(null);
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const moodLogs   = expenses.filter(e=>e.moodId).length;
  const photoLogs  = expenses.filter(e=>e.photo).length;
  const savePct    = Math.max(Math.round(((income-totalSpent)/income)*100),0);

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
      <Card style={{ background:"linear-gradient(145deg,#1E1208,#1C1C1C)", border:`1px solid ${C.accent}30` }}>
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
        <SLabel>Financial Settings</SLabel>
        <Card style={{ border:`1px solid ${C.accent}30` }} glow>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:editIncome?14:0 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`${C.accent}1A`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>💰</div>
            <div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Monthly Income</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Drives balance, forecast & savings rate</p></div>
            {!editIncome&&(<div style={{ textAlign:"right" }}><p style={{ margin:"0 0 4px", fontSize:16, fontWeight:800, color:C.accent, fontFamily:"DM Sans,sans-serif" }}>{fmt(income)}</p><button onClick={()=>{ setIncInput(String(income)); setEditIncome(true); }} style={{ background:C.accentGlow, border:`1px solid ${C.accent}40`, color:C.accent, borderRadius:8, padding:"4px 10px", fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Edit</button></div>)}
          </div>
          {editIncome&&(
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:14, borderBottom:`1px solid ${C.border}`, paddingBottom:12 }}>
                <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:28, fontWeight:800, color:C.textSub }}>₱</span>
                <input autoFocus type="number" value={incInput} onChange={e=>setIncInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ if(+incInput>0) setIncome(+incInput); setEditIncome(false); } if(e.key==="Escape") setEditIncome(false); }} style={{ background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:36, color:C.text, width:"100%", caretColor:C.accent }}/>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {[15000,20000,25000,30000,40000,50000,65000,80000].map(q=>(<button key={q} onClick={()=>setIncInput(String(q))} style={{ background:incInput===String(q)?C.accentGlow:C.surface, border:`1px solid ${incInput===String(q)?C.accent+"55":C.border}`, color:incInput===String(q)?C.accent:C.textSub, borderRadius:99, padding:"6px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>₱{(q/1000).toFixed(0)}k</button>))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="outline" onClick={()=>setEditIncome(false)}>Cancel</Btn>
                <Btn onClick={()=>{ if(+incInput>0) setIncome(+incInput); setEditIncome(false); }}>Save income</Btn>
              </div>
            </div>
          )}
        </Card>
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
              { val:"both",  label:"15th & 30th",    sub:"Semi-monthly — most common in PH", emoji:"🏆" },
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
        <SLabel>Data</SLabel>
        {!confirmClear?(
          <Card style={{ padding:"14px 16px" }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:38, height:38, borderRadius:11, background:`${C.coral}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🗑️</div><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Clear all expenses</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Resets your transaction history</p></div><button onClick={()=>setCC(true)} style={{ background:`${C.coral}14`, border:`1px solid ${C.coral}30`, color:C.coral, borderRadius:9, padding:"6px 12px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Clear</button></div></Card>
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
          Set up Back Tap (iPhone) or Quick Tap (Android) to open the add expense sheet instantly — no unlocking, no navigating.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { icon:"🍎", label:"iPhone — Back Tap", steps:"Settings → Accessibility → Touch → Back Tap → Double Tap → Open URL → " + window.location.origin + "/?action=add" },
            { icon:"🤖", label:"Android — Quick Tap (Pixel)", steps:"Settings → System → Gestures → Quick Tap → Open app → bulsa." },
            { icon:"📱", label:"Android — Tap,Tap app", steps:"Install Tap,Tap from GitHub → Double tap action → Open URL → " + window.location.origin + "/?action=add" },
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

      <p style={{ margin:"4px 0 0", textAlign:"center", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>bulsa. v1.2 · built for Filipinos 🇵🇭</p>
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
  const [income,    setIncome]    = useLocalStorage("bulsa_income", 0);
  const [name,      setName]      = useLocalStorage("bulsa_name", "");
  const [dailyLimit,setDailyLimit]= useLocalStorage("bulsa_dailylimit", 0);
  const [avatar,    setAvatar]    = useLocalStorage("bulsa_avatar", null);
  const [payday,    setPayday]    = useLocalStorage("bulsa_payday", "both");
  const [utangs,    setUtangs]    = useLocalStorage("bulsa_utangs", []);
  const [wallets,   setWallets]   = useLocalStorage("bulsa_wallets", []);
  const [subs,      setSubs]      = useLocalStorage("bulsa_subs", []);
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
        background_color: "#111111",
        theme_color: "#111111",
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
      const meta = Object.assign(document.createElement("meta"), { name:"theme-color", content:"#111111" });
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
        const CACHE = "bulsa-v1";
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
      else if (days===1) sendNotif(`${s.name} due tomorrow 🔔`, `₱${s.amount.toLocaleString()} — don't forget!`);
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
        // No state means we've gone back past our seed — re-push it
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

  const handleOnboardDone = ({ name:n, income:inc }) => {
    if (n) setName(n);
    if (inc>0) setIncome(inc);
    setOnboarded(true);
  };

  const screens = {
    home:     <HomeScreen expenses={expenses} budgets={budgets} income={income} name={name} loans={loans} goals={goals} setScreen={setScreen} onAdd={()=>setAddOpen(true)} dailyLimit={dailyLimit} setDailyLimit={setDailyLimit} avatar={avatar} utangs={utangs} wallets={wallets} hidden={hidden} setHidden={setHidden} subs={subs} payday={payday} showInstallBanner={showInstallBanner} onInstall={handleInstall} onDismissInstall={()=>setShowInstallBanner(false)}/>,
    expenses: <ExpensesScreen expenses={expenses} setExpenses={setExpenses} budgets={budgets} setBudgets={setBudgets} onAdd={()=>setAddOpen(true)} dailyLimit={dailyLimit} setDailyLimit={setDailyLimit} income={income} subs={subs} setSubs={setSubs}/>,
    // legacy deep routes (still reachable from HomeScreen quick links)
    loans:    <LoansScreen loans={loans} setLoans={setLoans} setScreen={setScreen}/>,
    goals:    <GoalsScreen goals={goals} setGoals={setGoals} income={income} setScreen={setScreen}/>,
    wallets:  <WalletsScreen wallets={wallets} setWallets={setWallets} setScreen={setScreen}/>,
    subs:     <SubscriptionsScreen subs={subs} setSubs={setSubs} setScreen={setScreen}/>,
    // new combined screens
    utang:    <UtangScreen utangs={utangs} setUtangs={setUtangs} loans={loans} setLoans={setLoans} setScreen={setScreen}/>,
    accounts: <AccountsScreen wallets={wallets} setWallets={setWallets} goals={goals} setGoals={setGoals} income={income} setScreen={setScreen}/>,
    survive:  <SurviveScreen expenses={expenses} income={income} loans={loans} goals={goals} payday={payday} setScreen={setScreen}/>,
    profile:  <ProfileScreen income={income} setIncome={setIncome} name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} expenses={expenses} setExpenses={setExpenses} setScreen={setScreen} payday={payday} setPayday={setPayday}/>,
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
            <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>{screens[screen]}</div>
            <NavBar screen={screen} setScreen={setScreen} onAdd={()=>setAddOpen(true)}/>
            {addOpen&&<AddExpenseSheet onClose={()=>setAddOpen(false)} onSave={handleSave} moodLogsCount={moodCount} wallets={wallets} onDeductWallet={handleDeductWallet}/>}
          </>
        )}
      </div>
    </div>
    </HideCtx.Provider>
  );
}

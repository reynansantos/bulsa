import { useState, useCallback, useRef, useEffect } from "react";

// ─── LOCAL STORAGE HOOK ────────────────────────────────────────────────────
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(prev => {
        const next = typeof value === "function" ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.warn("localStorage write failed:", err);
    }
  }, [key]);

  return [storedValue, setValue];
}

// ─── TOKENS ────────────────────────────────────────────────────────────────
const C = {
  bg:"#0C0C0C", surface:"#141414", card:"#1C1C1C", cardAlt:"#222222",
  border:"#2A2A2A", borderLight:"#333333",
  accent:"#FF6B2B", accentSoft:"#FF9A6B", accentGlow:"rgba(255,107,43,0.18)",
  lime:"#C8F135", sky:"#60CFFF", rose:"#FF4D8C", gold:"#FFD060", mint:"#00E0A0",
  text:"#F5F5F0", textSub:"#888880", textFaint:"#333330",
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
const catOf  = id => CATS.find(c => c.id === id) || CATS[7];
const moodOf = id => MOODS.find(m => m.id === id);
const uid    = ()  => Date.now() + Math.random();

// ─── PRIMITIVES ────────────────────────────────────────────────────────────

function Orb({ x, y, color=C.accent, size=300, opacity=0.1 }) {
  return <div style={{ position:"absolute", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, filter:"blur(100px)", opacity, pointerEvents:"none", zIndex:0 }}/>;
}

function Card({ children, style, onClick, glow, danger }) {
  const [h, setH] = useState(false);
  const gc = danger ? C.coral : C.accent;
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:C.card, borderRadius:18, border:`1px solid ${h&&glow?gc+"55":C.border}`,
        padding:"16px 18px", boxShadow:h&&glow?`0 0 28px ${gc}22`:"none", transition:"all 0.18s",
        cursor:onClick?"pointer":"default", position:"relative", overflow:"hidden", ...style }}>
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
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray 0.9s ease" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{children}</div>
    </div>
  );
}

function Bar({ pct, color=C.accent, h=6 }) {
  return (
    <div style={{ background:C.border, borderRadius:99, height:h, overflow:"hidden" }}>
      <div style={{ height:"100%", borderRadius:99, background:color, width:`${Math.min(pct,100)}%`, transition:"width 0.9s ease" }}/>
    </div>
  );
}

function Tag({ children, color=C.accent }) {
  return <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.06em", padding:"3px 9px", borderRadius:99, background:color+"22", color, textTransform:"uppercase", fontFamily:"DM Sans,sans-serif", whiteSpace:"nowrap" }}>{children}</span>;
}

function SLabel({ children }) {
  return <p style={{ margin:"0 0 5px", fontSize:10, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{children}</p>;
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
    <button onClick={onClick} style={{ padding:"14px", borderRadius:14, border:bdr, background:bg, color:clr,
      fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif",
      boxShadow:variant==="primary"?`0 4px 16px ${C.accentGlow}`:"none", width:"100%", ...style }}>
      {children}
    </button>
  );
}

// ─── BOTTOM SHEET WRAPPER ──────────────────────────────────────────────────

function BottomSheet({ children, onClose, title }) {
  const [vis, setVis] = useState(false);
  useState(()=>{ setTimeout(()=>setVis(true),20); });
  const close = ()=>{ setVis(false); setTimeout(onClose,300); };
  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:C.overlay, zIndex:200, opacity:vis?1:0, transition:"opacity 0.28s" }}/>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:`translateX(-50%) translateY(${vis?0:"110%"})`,
        width:"100%", maxWidth:420, background:C.surface, borderRadius:"24px 24px 0 0",
        border:`1px solid ${C.border}`, borderBottom:"none", zIndex:201,
        transition:"transform 0.34s cubic-bezier(0.32,0.72,0,1)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"center", paddingTop:14, position:"sticky", top:0, background:C.surface, zIndex:1 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:C.border }}/>
        </div>
        <div style={{ padding:"14px 22px 40px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <h3 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:20, fontWeight:800, color:C.text }}>{title}</h3>
            <button onClick={close} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.textSub, width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── PHOTO PICKER ──────────────────────────────────────────────────────────

function PhotoPicker({ onPhoto }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }}
        onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>onPhoto(ev.target.result); r.readAsDataURL(f); }}/>
      <div style={{ display:"flex", gap:10 }}>
        {[["🖼️","Gallery",false],["📷","Camera",true]].map(([ic,lbl,cam])=>(
          <button key={lbl} onClick={()=>{ cam?ref.current.setAttribute("capture","environment"):ref.current.removeAttribute("capture"); ref.current.click(); }}
            style={{ flex:1, padding:"13px", borderRadius:14, border:`1.5px dashed ${C.border}`, background:C.cardAlt, color:C.textSub, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"DM Sans,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>{ic}</span>{lbl}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── LOAN SHEET ────────────────────────────────────────────────────────────

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

function AddExpenseSheet({ onClose, onSave, moodLogsCount }) {
  const [step,   setStep]   = useState(0);
  const [amount, setAmount] = useState("");
  const [name,   setName]   = useState("");
  const [catId,  setCatId]  = useState("food");
  const [moodId, setMoodId] = useState(null);
  const [photo,  setPhoto]  = useState(null);
  const [isGrocery, setIsGrocery] = useState(false);
  const [gInput, setGInput] = useState("");
  const [gItems, setGItems] = useState([]);
  const [vis,    setVis]    = useState(false);
  useState(()=>{ setTimeout(()=>setVis(true),20); });

  const close = ()=>{ setVis(false); setTimeout(onClose,300); };
  const save  = ()=>{
    if (!amount || +amount<=0) return;
    const now=new Date(), h=now.getHours(), mn=now.getMinutes().toString().padStart(2,"0");
    onSave({ id:uid(), name:name.trim()||catOf(catId).label, amount:+amount,
      catId:isGrocery?"grocery":catId, moodId, photo, groceryItems:gItems,
      date:"Today", time:`${h%12||12}:${mn} ${h>=12?"PM":"AM"}` });
    close();
  };

  const addGItem = ()=>{ if(!gInput.trim()) return; setGItems(p=>[...p,gInput.trim()]); setGInput(""); };
  const QUICK=[50,100,150,200,500,1000];
  const titles=["How much?", isGrocery?"What did you buy?":"What was it?", "How were you feeling?", "Add a memory?"];

  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:C.overlay, zIndex:200, opacity:vis?1:0, transition:"opacity 0.28s" }}/>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:`translateX(-50%) translateY(${vis?0:"110%"})`,
        width:"100%", maxWidth:420, background:C.surface, borderRadius:"24px 24px 0 0",
        border:`1px solid ${C.border}`, borderBottom:"none", zIndex:201,
        transition:"transform 0.34s cubic-bezier(0.32,0.72,0,1)", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"center", paddingTop:14, position:"sticky", top:0, background:C.surface, zIndex:1 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:C.border }}/>
        </div>
        <div style={{ padding:"16px 22px 40px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <div>
              <div style={{ display:"flex", gap:5, marginBottom:6 }}>
                {titles.map((_,i)=>(<div key={i} style={{ width:i===step?18:5, height:5, borderRadius:99, background:i===step?C.accent:i<step?C.green:C.border, transition:"all 0.25s" }}/>))}
              </div>
              <h3 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:22, fontWeight:800, color:C.text }}>{titles[step]}</h3>
            </div>
            <button onClick={close} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.textSub, width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>

          {step===0&&(
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:10, borderBottom:`1px solid ${C.border}`, paddingBottom:14 }}>
                <span style={{ fontFamily:"DM Sans,sans-serif", fontSize:32, fontWeight:800, color:C.textSub }}>₱</span>
                <input autoFocus type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&amount&&+amount>0&&setStep(1)}
                  style={{ background:"none", border:"none", outline:"none", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:52, color:amount?C.text:C.textFaint, width:"100%", caretColor:C.accent }}/>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
                {QUICK.map(q=>(
                  <button key={q} onClick={()=>setAmount(String(q))} style={{ background:amount===String(q)?C.accentGlow:C.card, border:`1px solid ${amount===String(q)?C.accent+"55":C.border}`, color:amount===String(q)?C.accent:C.textSub, borderRadius:99, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"DM Sans,sans-serif" }}>₱{q.toLocaleString()}</button>
                ))}
              </div>
              <div style={{ background:`${C.lime}12`, border:`1px solid ${C.lime}30`, borderRadius:14, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:20 }}>🛒</span>
                <div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Grocery mode</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Track individual items</p></div>
                <Toggle on={isGrocery} setOn={setIsGrocery} color={C.lime}/>
              </div>
              <Btn onClick={()=>amount&&+amount>0&&setStep(1)} style={{ opacity:amount&&+amount>0?1:0.4 }}>Continue →</Btn>
            </div>
          )}

          {step===1&&(
            <div>
              <Inp value={name} onChange={setName} placeholder={isGrocery?"e.g. SM Supermarket run…":"e.g. Fishball, Jollibee, Grab…"} autoFocus onKeyDown={e=>e.key==="Enter"&&!isGrocery&&setStep(2)} style={{ marginBottom:16 }}/>
              {isGrocery?(
                <div>
                  <SLabel>Items in this haul</SLabel>
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    <Inp value={gInput} onChange={setGInput} placeholder="Add item (press Enter)" onKeyDown={e=>e.key==="Enter"&&addGItem()} style={{ marginBottom:0 }}/>
                    <button onClick={addGItem} style={{ background:C.lime, border:"none", borderRadius:12, padding:"0 16px", fontSize:18, cursor:"pointer", color:"#000", fontWeight:800, flexShrink:0 }}>+</button>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20, minHeight:28 }}>
                    {gItems.map((item,i)=>(<span key={i} onClick={()=>setGItems(p=>p.filter((_,j)=>j!==i))} style={{ background:C.lime+"1A", border:`1px solid ${C.lime}40`, color:C.lime, borderRadius:99, padding:"5px 12px", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:700, cursor:"pointer" }}>{item} ×</span>))}
                    {gItems.length===0&&<p style={{ margin:0, fontSize:12, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>Type and press Enter or tap +</p>}
                  </div>
                </div>
              ):(
                <div>
                  <SLabel>Category</SLabel>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                    {CATS.filter(c=>c.id!=="grocery").map(c=>(
                      <button key={c.id} onClick={()=>setCatId(c.id)} style={{ background:catId===c.id?c.color+"1E":C.card, border:`1px solid ${catId===c.id?c.color+"60":C.border}`, borderRadius:14, padding:"10px 12px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", transition:"all 0.15s" }}>
                        <span style={{ fontSize:17 }}>{c.icon}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:catId===c.id?c.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Btn onClick={()=>setStep(2)}>Next →</Btn>
            </div>
          )}

          {step===2&&(
            <div>
              {moodLogsCount<5&&(
                <div style={{ background:`${C.rose}12`, border:`1px solid ${C.rose}28`, borderRadius:14, padding:"10px 14px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:18 }}>🔓</span>
                  <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Log <strong style={{ color:C.rose }}>{5-moodLogsCount} more moods</strong> to unlock your emotional spending profile.</p>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                {MOODS.map(m=>(
                  <button key={m.id} onClick={()=>setMoodId(moodId===m.id?null:m.id)} style={{ background:moodId===m.id?m.color+"1E":C.card, border:`2px solid ${moodId===m.id?m.color:C.border}`, borderRadius:16, padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:7, cursor:"pointer", transition:"all 0.15s" }}>
                    <span style={{ fontSize:30 }}>{m.emoji}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:moodId===m.id?m.color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.label}</span>
                  </button>
                ))}
              </div>
              <Btn onClick={()=>setStep(3)}>Next →</Btn>
              <Btn variant="ghost" onClick={save} style={{ marginTop:8 }}>Skip mood, save anyway</Btn>
            </div>
          )}

          {step===3&&(
            <div>
              <p style={{ margin:"0 0 18px", fontSize:14, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.65 }}>Attach a photo — your food, receipt, grocery haul. It's your memory, not a flex.</p>
              {photo?(
                <div style={{ position:"relative", borderRadius:18, overflow:"hidden", marginBottom:16 }}>
                  <img src={photo} alt="preview" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
                  <button onClick={()=>setPhoto(null)} style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.7)", border:"none", borderRadius:"50%", width:32, height:32, color:"#fff", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                  <div style={{ position:"absolute", bottom:10, left:12 }}><Tag color={C.green}>Photo attached ✓</Tag></div>
                </div>
              ):(
                <div style={{ marginBottom:16 }}>
                  <PhotoPicker onPhoto={setPhoto}/>
                  <div style={{ marginTop:10, borderRadius:14, border:`1.5px dashed ${C.border}`, height:100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <span style={{ fontSize:28 }}>📸</span>
                    <p style={{ margin:0, fontSize:12, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>No photo selected</p>
                  </div>
                </div>
              )}
              <Btn onClick={save}>Save to Bulsa ✓</Btn>
              <Btn variant="ghost" onClick={save} style={{ marginTop:8 }}>Skip photo, save anyway</Btn>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── EXPENSE DETAIL ────────────────────────────────────────────────────────

function ExpenseDetail({ expense, onClose }) {
  const [vis, setVis] = useState(true);
  const c=catOf(expense.catId), m=moodOf(expense.moodId);
  const close=()=>{ setVis(false); setTimeout(onClose,280); };
  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:C.overlay, zIndex:300, opacity:vis?1:0, transition:"opacity 0.28s" }}/>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:`translateX(-50%) translateY(${vis?0:"100%"})`, width:"100%", maxWidth:420, background:C.surface, borderRadius:"24px 24px 0 0", border:`1px solid ${C.border}`, borderBottom:"none", zIndex:301, transition:"transform 0.32s cubic-bezier(0.32,0.72,0,1)", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"center", paddingTop:14 }}><div style={{ width:36, height:4, borderRadius:99, background:C.border }}/></div>
        {expense.photo&&(
          <div style={{ width:"100%", height:220, overflow:"hidden", position:"relative" }}>
            <img src={expense.photo} alt="memory" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(20,20,20,0.8) 0%,transparent 60%)" }}/>
            <div style={{ position:"absolute", bottom:14, left:18 }}><p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.6)", fontFamily:"DM Sans,sans-serif" }}>📍 Memory</p></div>
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
          {m&&(
            <div style={{ background:`${m.color}14`, border:`1px solid ${m.color}30`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:26 }}>{m.emoji}</span>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:m.color, fontFamily:"DM Sans,sans-serif" }}>Feeling {m.label.toLowerCase()}</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.id==="stressed"?"Heads up — stress spending adds up.":m.id==="happy"?"Happy purchases are the best kind.":m.id==="motivated"?"Smart spending. In the zone.":"Neutral day, neutral spend."}</p>
              </div>
            </div>
          )}
          {expense.groceryItems?.length>0&&(
            <div style={{ marginBottom:14 }}>
              <SLabel>Grocery items ({expense.groceryItems.length})</SLabel>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:6 }}>
                {expense.groceryItems.map((item,i)=>(<span key={i} style={{ background:C.lime+"1A", border:`1px solid ${C.lime}40`, color:C.lime, borderRadius:99, padding:"4px 10px", fontSize:12, fontFamily:"DM Sans,sans-serif", fontWeight:600 }}>{item}</span>))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── NAV ───────────────────────────────────────────────────────────────────

function NavBar({ screen, setScreen, onAdd }) {
  const tabs=[
    { id:"home",     icon:"◈", label:"Home" },
    { id:"expenses", icon:"⊡", label:"Expenses" },
    null,
    { id:"goals",    icon:"◎", label:"Goals" },
    { id:"profile",  icon:"⊙", label:"Profile" },
  ];
  return (
    <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center", padding:"8px 4px calc(20px + env(safe-area-inset-bottom))", background:C.surface, borderTop:`1px solid ${C.border}`, position:"sticky", bottom:0, zIndex:100 }}>
      {tabs.map((t,i)=>{
        if (!t) return <button key="add" onClick={onAdd} style={{ width:52, height:52, borderRadius:"50%", border:"none", background:C.gradAccent, fontSize:26, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 20px ${C.accentGlow}`, marginTop:-18, flexShrink:0 }}>+</button>;
        const active=screen===t.id;
        return <button key={t.id} onClick={()=>setScreen(t.id)} style={{ background:"none", border:"none", cursor:"pointer", minWidth:52, display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:active?C.accent:C.textFaint, transition:"color 0.2s", padding:"4px 8px" }}><span style={{ fontSize:19 }}>{t.icon}</span><span style={{ fontSize:10, fontFamily:"DM Sans,sans-serif", fontWeight:active?800:500 }}>{t.label}</span></button>;
      })}
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
  const [step, setStep] = useState(0);
  const steps=[
    { bg:C.gradAccent, logo:true,    title:"bulsa.", sub:"Pull money out of your pocket. Log it. Know where it goes. That's it.", cta:"Let's go" },
    { bg:C.gradLime,   emoji:"📸", title:"Your spend,\nyour story.", sub:"Take a photo of your food, your grocery haul, your splurge. No judgment — just memory.", cta:"Love that" },
    { bg:C.gradSky,    emoji:"🧠", title:"Feel it.\nTrack it.", sub:"Tag your mood when you spend. Spot the patterns. Break the cycle — or don't. Your call.", cta:"Start tracking →" },
  ];
  const s=steps[step];
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:"64px 28px calc(52px + env(safe-area-inset-bottom))", background:C.bg, position:"relative", overflow:"hidden" }}>
      <Orb x="-80px" y="60px" color={C.accent} size={320} opacity={0.13}/>
      <Orb x="100px" y="380px" color={C.lime} size={260} opacity={0.07}/>
      <div style={{ display:"flex", gap:6, zIndex:1 }}>{steps.map((_,i)=>(<div key={i} style={{ width:i===step?24:6, height:6, borderRadius:99, background:i===step?C.accent:C.border, transition:"all 0.3s" }}/>))}</div>
      <div style={{ textAlign:"center", zIndex:1, flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:26 }}>
        {s.logo ? <BulsaLogo size={100}/> : <div style={{ width:100, height:100, borderRadius:30, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, boxShadow:`0 20px 60px ${C.accentGlow}`, transition:"background 0.4s" }}>{s.emoji}</div>}
        <h1 style={{ fontFamily:"DM Sans,sans-serif", fontSize:44, fontWeight:800, color:C.text, lineHeight:1.1, margin:0, whiteSpace:"pre-line", letterSpacing:"-0.025em" }}>{s.title}</h1>
        <p style={{ fontFamily:"DM Sans,sans-serif", fontSize:15, color:C.textSub, lineHeight:1.75, maxWidth:272, margin:0 }}>{s.sub}</p>
      </div>
      <button onClick={()=>step<steps.length-1?setStep(p=>p+1):onDone()} style={{ background:C.gradAccent, color:"#fff", border:"none", borderRadius:16, padding:"18px 0", fontSize:16, fontWeight:800, fontFamily:"DM Sans,sans-serif", cursor:"pointer", zIndex:1, width:"100%", boxShadow:`0 8px 32px ${C.accentGlow}` }}>{s.cta}</button>
    </div>
  );
}

// ─── HOME ──────────────────────────────────────────────────────────────────

function HomeScreen({ expenses, budgets, income, name, loans, goals, setScreen, onAdd }) {
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const balance    = income - totalSpent;
  const savePct    = Math.max(Math.round(((income-totalSpent)/income)*100),0);
  const moodLogs   = expenses.filter(e=>e.moodId).length;
  const stressAmt  = expenses.filter(e=>e.moodId==="stressed").reduce((s,e)=>s+e.amount,0);
  const budgetOver = Object.entries(budgets).filter(([id,lim])=>expenses.filter(e=>e.catId===id).reduce((s,e)=>s+e.amount,0)>lim).length;
  const photoMems  = expenses.filter(e=>e.photo).slice(0,4);
  const totalDebt  = loans.reduce((s,l)=>s+(l.amount-l.paid),0);
  const totalSaved = goals.reduce((s,g)=>s+g.saved,0);

  return (
    <div style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14, position:"relative" }}>
      <Orb x="-50px" y="-30px" color={C.accent} size={260} opacity={0.09}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, zIndex:1 }}>
          <BulsaLogo size={36}/>
          <div>
            <h1 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:28, fontWeight:800, color:C.text, letterSpacing:"-0.04em" }}>bulsa<span style={{ color:C.accent }}>.</span></h1>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Hey {name} 👋</p>
          </div>
        </div>
        <button onClick={()=>setScreen("forecast")} style={{ background:C.accentGlow, border:`1px solid ${C.accent}40`, color:C.accent, borderRadius:12, padding:"8px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Forecast →</button>
      </div>

      <div style={{ background:"linear-gradient(145deg,#1E1208,#1C1C1C)", border:`1px solid ${C.accent}30`, borderRadius:22, padding:"26px 20px 20px", position:"relative", overflow:"hidden", zIndex:1 }}>
        <Orb x="50%" y="-20px" color={C.accent} size={200} opacity={0.22}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <SLabel>Available Balance</SLabel>
            <h2 style={{ margin:"0 0 4px", fontFamily:"DM Sans,sans-serif", fontSize:40, fontWeight:800, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>{fmt(balance)}</h2>
            <p style={{ margin:0, fontSize:12, color:savePct>=20?C.green:C.coral, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{savePct>=20?`↑ Saving ${savePct}% this month`:"↓ Watch your spending"}</p>
          </div>
          <Ring pct={savePct} size={60} stroke={5} color={savePct>=20?C.green:C.coral}><span style={{ fontSize:11, fontWeight:800, color:savePct>=20?C.green:C.coral, fontFamily:"DM Sans,sans-serif" }}>{savePct}%</span></Ring>
        </div>
        <div style={{ marginTop:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalSpent)} spent of {fmt(income)}</span>
            <span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>EOM: <strong style={{ color:C.accentSoft }}>{fmt(Math.max(balance*1.25,0))}</strong></span>
          </div>
          <Bar pct={(totalSpent/income)*100} color={totalSpent/income>0.8?C.coral:C.accent} h={6}/>
        </div>
      </div>

      {budgetOver>0&&(<Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}30` }} glow danger onClick={()=>setScreen("expenses")}><div style={{ display:"flex", gap:12, alignItems:"center" }}><span style={{ fontSize:22 }}>⚠️</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Over budget in {budgetOver} {budgetOver===1?"category":"categories"}</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Tap to review →</p></div></div></Card>)}

      {moodLogs>=5&&stressAmt>0&&(
        <Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}28` }} glow onClick={()=>setScreen("expenses")}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:42, height:42, borderRadius:13, background:`${C.coral}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>😰</div>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 2px", fontSize:10, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Mood Insight</p>
              <p style={{ margin:"0 0 8px", fontSize:14, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.55 }}><strong style={{ color:C.coral }}>{fmt(stressAmt)}</strong> spent while stressed — {Math.round((stressAmt/totalSpent)*100)}% of your total.</p>
              <Tag color={C.coral}>See mood breakdown →</Tag>
            </div>
          </div>
        </Card>
      )}

      {moodLogs>0&&moodLogs<5&&(<Card style={{ background:`${C.rose}0A`, border:`1px solid ${C.rose}22`, padding:"12px 16px" }}><div style={{ display:"flex", gap:10, alignItems:"center" }}><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:13, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>🔓 {5-moodLogs} more mood logs to unlock insights</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Tag how you feel when you spend.</p></div><Ring pct={(moodLogs/5)*100} size={44} stroke={4} color={C.rose}><span style={{ fontSize:10, fontWeight:800, color:C.rose, fontFamily:"DM Sans,sans-serif" }}>{moodLogs}/5</span></Ring></div></Card>)}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Card glow onClick={()=>setScreen("loans")}><span style={{ fontSize:18, color:C.coral }}>⊗</span><p style={{ margin:"10px 0 2px", fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalDebt)}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Remaining debt</p></Card>
        <Card glow onClick={()=>setScreen("goals")}><span style={{ fontSize:18, color:C.sky }}>◎</span><p style={{ margin:"10px 0 2px", fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalSaved)}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Total saved</p></Card>
      </div>

      {photoMems.length>0&&(
        <div>
          <h3 style={{ margin:"0 0 10px", fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:800, color:C.text }}>📸 Spending memories</h3>
          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
            {photoMems.map(e=>(
              <div key={e.id} style={{ flexShrink:0, width:110, borderRadius:16, overflow:"hidden", position:"relative", border:`1px solid ${C.border}` }}>
                <img src={e.photo} alt={e.name} style={{ width:"100%", height:100, objectFit:"cover", display:"block" }}/>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(12,12,12,0.85) 0%,transparent 55%)" }}/>
                <div style={{ position:"absolute", bottom:7, left:8, right:8 }}><p style={{ margin:0, fontSize:11, fontWeight:700, color:"#fff", fontFamily:"DM Sans,sans-serif", lineHeight:1.2 }}>{e.name}</p><p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.6)", fontFamily:"DM Sans,sans-serif" }}>{fmt(e.amount)}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:800, color:C.text }}>Recent</h3>
          <button onClick={()=>setScreen("expenses")} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>See all</button>
        </div>
        {expenses.length===0?(
          <button onClick={onAdd} style={{ width:"100%", padding:"22px", borderRadius:18, border:`2px dashed ${C.accent}40`, background:C.accentGlow, color:C.accent, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Log your first bulsa</button>
        ):(
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {expenses.slice(0,4).map(e=>{ const c=catOf(e.catId),m=moodOf(e.moodId); return (
              <Card key={e.id} style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  {e.photo?<img src={e.photo} alt={e.name} style={{ width:42, height:42, borderRadius:12, objectFit:"cover", flexShrink:0 }}/>:<div style={{ width:42, height:42, borderRadius:12, background:c.color+"1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{c.icon}</div>}
                  <div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{e.name}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} · {e.time}{e.groceryItems?.length>0&&<span style={{ color:C.lime }}> · {e.groceryItems.length} items</span>}</p></div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>{m&&<span style={{ fontSize:14 }}>{m.emoji}</span>}<p style={{ margin:0, fontSize:14, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(e.amount)}</p></div>
                </div>
              </Card>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EXPENSES ──────────────────────────────────────────────────────────────

function ExpensesScreen({ expenses, budgets, setBudgets, onAdd }) {
  const [view,   setView]   = useState("list");
  const [detail, setDetail] = useState(null);
  const [editB,  setEditB]  = useState(null);
  const [bInput, setBInput] = useState("");
  const total    = expenses.reduce((s,e)=>s+e.amount,0);
  const moodLogs = expenses.filter(e=>e.moodId).length;
  const bymood   = MOODS.map(m=>{ const amt=expenses.filter(e=>e.moodId===m.id).reduce((s,e)=>s+e.amount,0),cnt=expenses.filter(e=>e.moodId===m.id).length; return {...m,amount:amt,count:cnt,pct:total?Math.round((amt/total)*100):0}; }).filter(m=>m.count>0);

  return (
    <div style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {detail&&<ExpenseDetail expense={detail} onClose={()=>setDetail(null)}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Expenses</h2>
        <button onClick={onAdd} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Card style={{ background:`${C.coral}10`, border:`1px solid ${C.coral}28` }}><SLabel>Total Spent</SLabel><p style={{ margin:0, fontSize:24, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{fmt(total)}</p></Card>
        <Card style={{ background:`${C.accent}0C`, border:`1px solid ${C.accent}28` }}><SLabel>Transactions</SLabel><p style={{ margin:0, fontSize:24, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{expenses.length}</p></Card>
      </div>
      <div style={{ display:"flex", background:C.surface, borderRadius:12, padding:4, border:`1px solid ${C.border}` }}>
        {[["list","Transactions"],["budget","Budget"],["mood","Mood"]].map(([v,lbl])=>(<button key={v} onClick={()=>setView(v)} style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", cursor:"pointer", background:view===v?C.card:"none", color:view===v?C.text:C.textSub, fontSize:12, fontWeight:700, fontFamily:"DM Sans,sans-serif", transition:"all 0.18s" }}>{lbl}</button>))}
      </div>

      {view==="list"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {expenses.length===0&&<div style={{ textAlign:"center", padding:"56px 0" }}><div style={{ fontSize:48, marginBottom:12 }}>👛</div><p style={{ margin:"0 0 4px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Nothing logged yet</p><p style={{ margin:0, fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Tap + to log your first expense.</p></div>}
          {expenses.map(e=>{ const c=catOf(e.catId),m=moodOf(e.moodId); return (
            <Card key={e.id} onClick={()=>setDetail(e)} glow>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {e.photo?<img src={e.photo} alt={e.name} style={{ width:44, height:44, borderRadius:13, objectFit:"cover", flexShrink:0 }}/>:<div style={{ width:44, height:44, borderRadius:13, background:c.color+"1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{c.icon}</div>}
                <div style={{ flex:1, minWidth:0 }}><p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.name}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{c.label} · {e.date}, {e.time}{e.groceryItems?.length>0&&<span style={{ color:C.lime }}> · 🛒{e.groceryItems.length}</span>}{e.photo&&<span style={{ color:C.textFaint }}> · 📸</span>}</p></div>
                <div style={{ textAlign:"right", flexShrink:0 }}><p style={{ margin:"0 0 3px", fontSize:14, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>-{fmt(e.amount)}</p>{m?<span style={{ fontSize:13 }}>{m.emoji}</span>:<span style={{ fontSize:10, color:C.textFaint }}>—</span>}</div>
              </div>
            </Card>
          );})}
        </div>
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

      {view==="mood"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {moodLogs<5?(
            <div style={{ textAlign:"center", padding:"48px 20px" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:`${C.rose}14`, border:`2px dashed ${C.rose}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 18px" }}>🔒</div>
              <p style={{ margin:"0 0 8px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Emotional profile locked</p>
              <p style={{ margin:"0 0 18px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>Tag your mood on {5-moodLogs} more expense{5-moodLogs!==1?"s":""} to unlock.</p>
              <Ring pct={(moodLogs/5)*100} size={80} stroke={6} color={C.rose}><span style={{ fontSize:14, fontWeight:800, color:C.rose, fontFamily:"DM Sans,sans-serif" }}>{moodLogs}/5</span></Ring>
            </div>
          ):(
            <>
              <Card style={{ background:`${C.rose}0C`, border:`1px solid ${C.rose}28` }}><p style={{ margin:"0 0 2px", fontSize:10, fontWeight:800, color:C.rose, fontFamily:"DM Sans,sans-serif", textTransform:"uppercase", letterSpacing:"0.08em" }}>Emotional Finance Profile</p><p style={{ margin:0, fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>How you feel shapes how you spend.</p></Card>
              {bymood.map(m=>(<Card key={m.id}><div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}><span style={{ fontSize:32 }}>{m.emoji}</span><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{m.label}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{m.count} purchase{m.count>1?"s":""} · {m.pct}% of spending</p></div><p style={{ margin:0, fontSize:16, fontWeight:800, color:m.color, fontFamily:"DM Sans,sans-serif" }}>{fmt(m.amount)}</p></div><Bar pct={m.pct} color={m.color} h={6}/></Card>))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LOANS ─────────────────────────────────────────────────────────────────

function LoansScreen({ loans, setLoans }) {
  const [sheet,   setSheet]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const total     = loans.reduce((s,l)=>s+l.amount,0);
  const paid      = loans.reduce((s,l)=>s+l.paid,0);
  const saveLoan  = loan=>{ setLoans(prev=>prev.find(l=>l.id===loan.id)?prev.map(l=>l.id===loan.id?loan:l):[...prev,loan]); setSheet(null); };
  const deleteLoan= id=>{ setLoans(prev=>prev.filter(l=>l.id!==id)); setConfirm(null); };

  return (
    <div style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {sheet&&<LoanSheet loan={sheet==="add"?null:sheet} onSave={saveLoan} onClose={()=>setSheet(null)}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Loans & Debt</h2>
        <button onClick={()=>setSheet("add")} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>
      </div>

      {loans.length===0?(
        <div style={{ textAlign:"center", padding:"56px 0" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
          <p style={{ margin:"0 0 4px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Debt-free!</p>
          <p style={{ margin:"0 0 20px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>No loans tracked. Add one if needed.</p>
          <button onClick={()=>setSheet("add")} style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:14, padding:"14px 28px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add a loan</button>
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

function GoalsScreen({ goals, setGoals }) {
  const [sheet,   setSheet]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const totalSaved  = goals.reduce((s,g)=>s+g.saved,0);
  const totalTarget = goals.reduce((s,g)=>s+g.target,0);
  const overallPct  = totalTarget?Math.round((totalSaved/totalTarget)*100):0;
  const saveGoal    = goal=>{ setGoals(prev=>prev.find(g=>g.id===goal.id)?prev.map(g=>g.id===goal.id?goal:g):[...prev,goal]); setSheet(null); };
  const deleteGoal  = id=>{ setGoals(prev=>prev.filter(g=>g.id!==id)); setConfirm(null); };

  return (
    <div style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      {sheet&&<GoalSheet goal={sheet==="add"?null:sheet} onSave={saveGoal} onClose={()=>setSheet(null)}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Goals</h2>
        <button onClick={()=>setSheet("add")} style={{ background:C.gradAccent, border:"none", borderRadius:12, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif", boxShadow:`0 4px 16px ${C.accentGlow}` }}>+ Add</button>
      </div>

      {goals.length>0&&(
        <Card style={{ background:`${C.sky}0C`, border:`1px solid ${C.sky}28` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><SLabel>All Goals</SLabel><p style={{ margin:"0 0 4px", fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:32, color:C.text }}>{fmt(totalSaved)}</p><p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>of {fmt(totalTarget)} across {goals.length} goal{goals.length!==1?"s":""}</p></div>
            <Ring pct={overallPct} size={72} stroke={6} color={C.sky}><span style={{ fontSize:12, fontWeight:800, color:C.sky, fontFamily:"DM Sans,sans-serif" }}>{overallPct}%</span></Ring>
          </div>
        </Card>
      )}

      {goals.length===0?(
        <div style={{ textAlign:"center", padding:"56px 0" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
          <p style={{ margin:"0 0 4px", fontSize:16, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>No goals yet</p>
          <p style={{ margin:"0 0 20px", fontSize:13, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>Set your first savings goal.</p>
          <button onClick={()=>setSheet("add")} style={{ background:C.accentGlow, border:`2px dashed ${C.accent}40`, color:C.accent, borderRadius:14, padding:"14px 28px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>+ Add a goal</button>
        </div>
      ):(
        goals.map(g=>{ const pct=Math.round((g.saved/g.target)*100); return (
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
            <p style={{ margin:"10px 0 8px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>💡 Save <strong style={{ color:g.color }}>{fmt(Math.round((g.target-g.saved)/6))}/mo</strong> to hit this on time</p>
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
    </div>
  );
}

// ─── FORECAST ──────────────────────────────────────────────────────────────

function ForecastScreen({ expenses, income, loans, goals }) {
  const [extra,   setExtra]   = useState(0);
  const [cutSubs, setCutSubs] = useState(false);
  const [newLoan, setNewLoan] = useState(false);
  const [gadget,  setGadget]  = useState(false);
  const spent      = expenses.reduce((s,e)=>s+e.amount,0);
  const base       = Math.max(income-spent,0);
  const eom        = Math.max(base+base*0.28+extra*1.1+(cutSubs?1200:0)-(newLoan?5000:0)-(gadget?8000:0),0);
  const diff       = eom-base;
  const lc         = diff>=0?C.green:C.coral;
  const totalDebt  = loans.reduce((s,l)=>s+(l.amount-l.paid),0);
  const topGoal    = [...goals].sort((a,b)=>(b.saved/b.target)-(a.saved/a.target))[0];
  const pts=[income-spent,base*0.94,base,base*1.06,base*0.97,eom,eom*1.07,eom*1.02,eom*1.13];
  const maxP=Math.max(...pts),minP=Math.min(...pts)*0.93,range=maxP-minP||1;
  const W=290,H=110,gx=i=>(i/(pts.length-1))*W,gy=v=>H-((v-minP)/range)*H*0.88-6;
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${gx(i).toFixed(1)},${gy(p).toFixed(1)}`).join(" ");

  return (
    <div style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Forecast</h2>
        <Tag color={C.accentSoft}>Live model</Tag>
      </div>
      <Card style={{ padding:"20px 18px 14px" }}>
        <SLabel>Projected balance</SLabel>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
          <p style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:32, color:C.text }}>{fmt(Math.round(eom))}</p>
          <span style={{ fontSize:13, fontWeight:800, color:lc, fontFamily:"DM Sans,sans-serif" }}>{diff>=0?`↑ +${fmt(Math.round(diff))}`:`↓ -${fmt(Math.round(Math.abs(diff)))}`}</span>
        </div>
        <p style={{ margin:"0 0 14px", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>end of month projection</p>
        <svg width={W} height={H+10} style={{ display:"block", overflow:"visible" }}>
          <defs><linearGradient id="fgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lc} stopOpacity="0.22"/><stop offset="100%" stopColor={lc} stopOpacity="0"/></linearGradient></defs>
          <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#fgb)"/>
          <path d={path} fill="none" stroke={lc} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {pts.map((p,i)=>(<circle key={i} cx={gx(i)} cy={gy(p)} r={i===5?5:3} fill={i===5?lc:C.card} stroke={lc} strokeWidth="2"/>))}
        </svg>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>{["Now","W1","W2","W3","W4","EOM","+1M","+2M","+3M"].map(l=>(<span key={l} style={{ fontSize:8, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>{l}</span>))}</div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Card style={{ background:`${C.coral}0C`, border:`1px solid ${C.coral}25` }}><SLabel>Remaining Debt</SLabel><p style={{ margin:0, fontSize:18, fontWeight:800, color:C.coral, fontFamily:"DM Sans,sans-serif" }}>{fmt(totalDebt)}</p></Card>
        {topGoal&&(<Card style={{ background:`${topGoal.color}0C`, border:`1px solid ${topGoal.color}25` }}><SLabel>Top Goal</SLabel><p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{topGoal.emoji} {topGoal.name}</p><p style={{ margin:0, fontSize:12, color:topGoal.color, fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>{Math.round((topGoal.saved/topGoal.target)*100)}% there</p></Card>)}
      </div>

      <h3 style={{ margin:"4px 0 0", fontFamily:"DM Sans,sans-serif", fontSize:15, fontWeight:800, color:C.text }}>What-If Simulator</h3>
      <Card>
        <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>Extra loan payment / month</p>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={{ fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>₱0</span><span style={{ fontSize:14, fontWeight:800, color:C.accent, fontFamily:"DM Sans,sans-serif" }}>+{fmt(extra)}</span></div>
        <input type="range" min={0} max={10000} step={500} value={extra} onChange={e=>setExtra(+e.target.value)} style={{ width:"100%", accentColor:C.accent }}/>
      </Card>
      {[
        { label:"Cut subscriptions",  sub:"Save ~₱1,200/mo",       val:cutSubs, set:setCutSubs, color:C.mint },
        { label:"Take a new loan",    sub:"−₱5,000/mo commitment", val:newLoan, set:setNewLoan, color:C.coral },
        { label:"Buy a gadget (₱8k)", sub:"One-time expense",       val:gadget,  set:setGadget,  color:C.gold },
      ].map(item=>(<Card key={item.label} style={{ padding:"14px 16px" }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ flex:1 }}><p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{item.label}</p><p style={{ margin:0, fontSize:11, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>{item.sub}</p></div><Toggle on={item.val} setOn={item.set} color={item.color}/></div></Card>))}

      <Card style={{ background:diff>=0?`${C.green}0C`:`${C.coral}0C`, border:`1px solid ${lc}35` }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
          <span style={{ fontSize:22, flexShrink:0 }}>{diff>=0?"🟢":"🔴"}</span>
          <p style={{ margin:0, fontSize:14, color:C.text, fontFamily:"DM Sans,sans-serif", lineHeight:1.6 }}>
            {diff>=0?`These choices add ${fmt(Math.round(diff))} to your month-end balance.`:`This costs you ${fmt(Math.round(Math.abs(diff)))} by month-end.`}
            {topGoal&&diff>=0?` ${topGoal.emoji} ${topGoal.name} stays on track.`:""}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── PROFILE ───────────────────────────────────────────────────────────────

function ProfileScreen({ income, setIncome, name, setName, expenses, setExpenses, setScreen }) {
  const [editIncome, setEditIncome] = useState(false);
  const [editName,   setEditName]   = useState(false);
  const [incInput,   setIncInput]   = useState(String(income));
  const [nameInput,  setNameInput]  = useState(name);
  const [confirmClear, setCC]       = useState(false);
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const moodLogs   = expenses.filter(e=>e.moodId).length;
  const photoLogs  = expenses.filter(e=>e.photo).length;
  const savePct    = Math.max(Math.round(((income-totalSpent)/income)*100),0);

  return (
    <div style={{ padding:"22px 18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Profile</h2>
        <button onClick={()=>setScreen("forecast")} style={{ background:C.accentGlow, border:`1px solid ${C.accent}40`, color:C.accent, borderRadius:12, padding:"8px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Forecast →</button>
      </div>

      <Card style={{ background:"linear-gradient(145deg,#1E1208,#1C1C1C)", border:`1px solid ${C.accent}30` }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:C.gradAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, color:"#fff", fontFamily:"DM Sans,sans-serif", flexShrink:0, boxShadow:`0 0 20px ${C.accentGlow}` }}>{name.charAt(0).toUpperCase()}</div>
          <div style={{ flex:1 }}>
            {editName?(
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ if(nameInput.trim()) setName(nameInput.trim()); setEditName(false); } if(e.key==="Escape") setEditName(false); }} style={{ flex:1, background:C.surface, border:`1px solid ${C.accent}50`, borderRadius:10, padding:"8px 12px", color:C.text, fontSize:16, fontWeight:800, outline:"none", fontFamily:"DM Sans,sans-serif" }}/>
                <button onClick={()=>{ if(nameInput.trim()) setName(nameInput.trim()); setEditName(false); }} style={{ background:C.gradAccent, border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Save</button>
              </div>
            ):(
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <p style={{ margin:0, fontSize:20, fontWeight:800, color:C.text, fontFamily:"DM Sans,sans-serif" }}>{name}</p>
                <button onClick={()=>{ setNameInput(name); setEditName(true); }} style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, borderRadius:8, padding:"4px 10px", fontSize:11, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:700 }}>Edit</button>
              </div>
            )}
            <p style={{ margin:"4px 0 0", fontSize:12, color:C.textSub, fontFamily:"DM Sans,sans-serif" }}>bulsa. member</p>
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
          { id:"forecast", icon:"⟁", clr:C.accent, label:"Forecast Simulator",  sub:"Run what-if scenarios" },
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

      <p style={{ margin:"4px 0 0", textAlign:"center", fontSize:11, color:C.textFaint, fontFamily:"DM Sans,sans-serif" }}>bulsa. v1.0 · built for Filipinos 🇵🇭</p>
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
  const [income,    setIncome]    = useLocalStorage("bulsa_income", 65000);
  const [name,      setName]      = useLocalStorage("bulsa_name", "Reynan");

  const moodCount  = expenses.filter(e=>e.moodId).length;
  const handleSave = useCallback(exp=>setExpenses(prev=>[exp,...prev]),[]);

  const screens = {
    home:     <HomeScreen expenses={expenses} budgets={budgets} income={income} name={name} loans={loans} goals={goals} setScreen={setScreen} onAdd={()=>setAddOpen(true)}/>,
    expenses: <ExpensesScreen expenses={expenses} budgets={budgets} setBudgets={setBudgets} onAdd={()=>setAddOpen(true)}/>,
    loans:    <LoansScreen loans={loans} setLoans={setLoans}/>,
    goals:    <GoalsScreen goals={goals} setGoals={setGoals}/>,
    forecast: <ForecastScreen expenses={expenses} income={income} loans={loans} goals={goals}/>,
    profile:  <ProfileScreen income={income} setIncome={setIncome} name={name} setName={setName} expenses={expenses} setExpenses={setExpenses} setScreen={setScreen}/>,
  };

  return (
    <div style={{ background:C.bg, height:"100dvh", display:"flex", justifyContent:"center", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%", maxWidth:420, height:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        {!onboarded?(
          <Onboarding onDone={()=>setOnboarded(true)}/>
        ):(
          <>
            <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>{screens[screen]}</div>
            <NavBar screen={screen} setScreen={setScreen} onAdd={()=>setAddOpen(true)}/>
            {addOpen&&<AddExpenseSheet onClose={()=>setAddOpen(false)} onSave={handleSave} moodLogsCount={moodCount}/>}
          </>
        )}
      </div>
    </div>
  );
}

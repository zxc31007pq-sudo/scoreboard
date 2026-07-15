import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MatchEndModal from "./MatchEndModal";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4", "OT"];
const AD_H = 56;
const HDR_H = 48;

function useCountdown(init) {
  const [secs, setSecs] = useState(init);
  const [on, setOn] = useState(false);
  const tid = useRef(null);
  useEffect(() => {
    if (on && secs > 0) { tid.current = setInterval(() => setSecs(s => s - 1), 1000); }
    else { clearInterval(tid.current); if (secs === 0) setOn(false); }
    return () => clearInterval(tid.current);
  }, [on, secs]);
  return {
    secs, on,
    start:  () => setOn(true),
    stop:   () => setOn(false),
    toggle: () => setOn(r => !r),
    reset:  (v) => { setOn(false); setSecs(v); },
    fmt: () => `${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}`,
  };
}

function useSecondBlink(active, secs) {
  const [bright, setBright] = useState(true);
  useEffect(() => {
    if (!active) { setBright(true); return; }
    setBright(true);
    const t = setTimeout(() => setBright(false), 500);
    return () => clearTimeout(t);
  }, [active, secs]);
  return bright;
}

// 偵測手機是否為直向(用於提示切換橫向以獲得完整計分板視野)
function useIsPortrait() {
  const [portrait, setPortrait] = useState(
    () => typeof window !== "undefined" && window.innerHeight > window.innerWidth
  );
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  return portrait;
}

function RotateHint({ onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"#000000cc",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:150,
      padding:16,
    }}>
      <div style={{
        background:"#0f0f0f", border:"1px solid #2a2a2a",
        borderRadius:20, padding:"32px 28px",
        textAlign:"center", maxWidth:320,
      }}>
        <div style={{fontSize:44, marginBottom:14}}>📱↻</div>
        <div style={{fontSize:16, fontWeight:800, color:"#f0f0f0", marginBottom:8}}>建議橫向使用</div>
        <div style={{fontSize:13, color:"#888", lineHeight:1.7, marginBottom:20}}>
          將手機轉為橫向，計分板可以顯示更完整的資訊，操作起來也更順手。
        </div>
        <button onClick={onClose} style={{
          width:"100%", padding:"11px 0", borderRadius:10,
          background:"#cc0000", border:"none",
          color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer",
        }}>知道了，繼續使用</button>
      </div>
    </div>
  );
}

function Dots({ total, filled, color }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {Array.from({length:total}).map((_,i) => (
        <div key={i} style={{
          width:14, height:14, borderRadius:"50%",
          background: i < filled ? color : "#1e1e1e",
          border: `2px solid ${i < filled ? color : "#333"}`,
        }}/>
      ))}
    </div>
  );
}

function TBtn({ label, onClick, color="#c00", w=64, h=58, fs=24 }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick}
      onPointerDown={()=>setP(true)} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      style={{
        width:w, height:h, borderRadius:10,
        background: p ? color+"99" : color,
        border:`2px solid ${color}`,
        color:"#fff", fontSize:fs, fontWeight:800,
        cursor:"pointer", transform: p?"scale(.91)":"scale(1)",
        transition:"transform .1s", flexShrink:0, fontFamily:"inherit",
      }}>{label}</button>
  );
}

function Sm({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:36, height:36, borderRadius:7,
      background:"#1a1a1a", border:"1px solid #333",
      color:"#888", fontSize:20, cursor:"pointer", lineHeight:1,
    }}>{label}</button>
  );
}

function TimeoutTimer({ onClose }) {
  const t = useCountdown(60);
  useEffect(() => { t.start(); }, []);
  const urgent = t.secs <= 10 && t.secs > 0;
  const blink  = useSecondBlink(urgent, t.secs);
  return (
    <div style={{
      position:"fixed", inset:0, background:"#000000cc",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:100,
    }}>
      <div style={{
        background:"#0f0f0f",
        border: urgent ? `4px solid ${blink ? "#fff" : "transparent"}` : "4px solid #333",
        borderRadius:20, padding:"32px 48px",
        textAlign:"center", minWidth:240,
        transition: urgent ? "none" : "border-color .3s",
      }}>
        <div style={{fontSize:14, color:"#555", letterSpacing:3, marginBottom:8}}>TIMEOUT</div>
        <div style={{
          fontSize:80, fontWeight:900,
          color: urgent ? "#ef4444" : "#f59e0b",
          fontFamily:"'Bebas Neue', sans-serif",
          fontVariantNumeric:"tabular-nums", lineHeight:1,
        }}>{String(t.secs).padStart(2,"0")}</div>
        <div style={{display:"flex", gap:12, justifyContent:"center", marginTop:20}}>
          <button onClick={t.toggle} style={{
            padding:"8px 24px", borderRadius:9, fontSize:14, fontWeight:800,
            background: t.on ? "#7f1d1d" : "#14532d", border:"none", color:"#fff", cursor:"pointer",
          }}>{t.on ? "⏸" : "▶"}</button>
          <button onClick={()=>{ t.reset(60); t.start(); }} style={{
            padding:"8px 20px", borderRadius:9, fontSize:14,
            background:"#1a1a1a", border:"1px solid #333", color:"#666", cursor:"pointer",
          }}>↺</button>
          <button onClick={onClose} style={{
            padding:"8px 20px", borderRadius:9, fontSize:14,
            background:"#1a1a1a", border:"1px solid #333", color:"#666", cursor:"pointer",
          }}>✕ 關閉</button>
        </div>
      </div>
    </div>
  );
}

function TeamPanel({ team, idx, poss, onScore, onUndo, onFoul, onFoulSub,
                     onTech, onTechSub, onTO, onTOSub, onPoss,
                     onNameClick, editing, onNameChange, onNameBlur, onOpenTimeout }) {
  const isLeft = idx === 0;
  const active = poss === idx;
  return (
    <div style={{
      flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:9, padding:"10px 14px",
      background: active ? "#0d1a0d" : "#0a0a0a",
      borderRight: isLeft ? "2px solid #1a1a1a" : "none",
      borderLeft:  !isLeft ? "2px solid #1a1a1a" : "none",
      transition:"background .3s", overflowY:"auto",
    }}>
      {/* Team name */}
      <div onClick={onNameClick} style={{
        background:"#cc0000", borderRadius:8, padding:"8px 14px",
        textAlign:"center", cursor:"pointer",
      }}>
        {editing ? (
          <input autoFocus value={team.name}
            onChange={e=>onNameChange(e.target.value)}
            onBlur={onNameBlur}
            onKeyDown={e=>e.key==="Enter"&&onNameBlur()}
            style={{
              background:"transparent", border:"none", outline:"none",
              color:"#fff", fontSize:20, fontWeight:800,
              textAlign:"center", width:"100%", fontFamily:"inherit",
            }}/>
        ) : (
          <span style={{fontSize:20, fontWeight:800, color:"#fff", letterSpacing:2}}>
            {team.name} <span style={{fontSize:13, color:"#ffffff55"}}>✏</span>
          </span>
        )}
      </div>

      {/* Score */}
      <div style={{
        flex:1, textAlign:"center", lineHeight:1,
        display:"flex", flexDirection:"column", justifyContent:"center",
      }}>
        <div style={{fontSize:13, color:"#555", letterSpacing:3, marginBottom:2}}>SCORE</div>
        <div style={{
          fontSize:"min(16vw, 130px)",
          fontWeight:900, color:"#f0f0f0",
          fontVariantNumeric:"tabular-nums", letterSpacing:"-0.04em",
          fontFamily:"'Bebas Neue', sans-serif",
        }}>{String(team.score).padStart(2,"0")}</div>
      </div>

      {/* Score buttons */}
      <div style={{display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", minWidth:0}}>
        <TBtn label="+1" onClick={()=>onScore(1)} color="#b91c1c" />
        <TBtn label="+2" onClick={()=>onScore(2)} color="#b91c1c" />
        <TBtn label="+3" onClick={()=>onScore(3)} color="#b91c1c" />
        <TBtn label="↩"  onClick={onUndo}         color="#3a1a1a" w={52} fs={18}/>
      </div>

      {/* TIME OUT */}
      <div style={{
        background:"#111", border:"1px solid #222", borderRadius:9,
        padding:"9px 14px", display:"flex", alignItems:"center", gap:10,
      }}>
        <span style={{fontSize:13, color:"#555", letterSpacing:2, flex:1}}>TIME OUT</span>
        <Dots total={3} filled={team.timeouts} color="#f59e0b"/>
        <button onClick={onOpenTimeout} style={{
          padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:700,
          background:"#f59e0b22", border:"1px solid #f59e0b66",
          color:"#f59e0b", cursor:"pointer",
        }}>倒數</button>
        <Sm label="+" onClick={onTO}/>
        <Sm label="−" onClick={onTOSub}/>
      </div>

      {/* TEAM FOUL */}
      <div style={{
        background:"#111", border:"1px solid #222", borderRadius:9,
        padding:"9px 14px", display:"flex", alignItems:"center", gap:10,
      }}>
        <span style={{fontSize:13, color:"#555", letterSpacing:2}}>TEAM FOUL</span>
        <span style={{
          fontSize:36, fontWeight:900, color:"#f97316",
          fontFamily:"'Courier New', monospace", minWidth:38, textAlign:"center",
        }}>{team.fouls}</span>
        {team.fouls >= 5 && (
          <span style={{fontSize:11, background:"#f97316", color:"#fff", borderRadius:5, padding:"2px 8px", fontWeight:700}}>+罰球</span>
        )}
        <div style={{marginLeft:"auto", display:"flex", gap:5}}>
          <Sm label="+" onClick={onFoul}/>
          <Sm label="−" onClick={onFoulSub}/>
        </div>
      </div>

      {/* TECH FOUL */}
      <div style={{
        background:"#111", border:"1px solid #222", borderRadius:9,
        padding:"9px 14px", display:"flex", alignItems:"center", gap:10,
      }}>
        <span style={{fontSize:13, color:"#555", letterSpacing:2}}>TECH FOUL</span>
        <span style={{
          fontSize:36, fontWeight:900, color:"#facc15",
          fontFamily:"'Courier New', monospace", minWidth:38, textAlign:"center",
        }}>{team.techFouls}</span>
        <div style={{marginLeft:"auto", display:"flex", gap:5}}>
          <Sm label="+" onClick={onTech}/>
          <Sm label="−" onClick={onTechSub}/>
        </div>
      </div>

      {/* POSSESSION */}
      <button onClick={onPoss} style={{
        borderRadius:9, padding:"10px",
        background: active ? "#14530d" : "#111",
        border: `2px solid ${active ? "#22c55e" : "#222"}`,
        color: active ? "#22c55e" : "#333",
        fontSize:15, fontWeight:800, cursor:"pointer",
        letterSpacing:2, transition:"all .2s",
      }}>
        {active ? "▶  持球中" : "POSSESSION"}
      </button>
    </div>
  );
}

function AdBanner() {
  return (
    <div style={{
      height:AD_H, flexShrink:0,
      background:"#060606", borderTop:"1px solid #1a1a1a",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        width:"100%", maxWidth:728, height:40,
        background:"#0d0d0d", border:"1px dashed #222",
        borderRadius:6, margin:"0 16px",
        display:"flex", alignItems:"center", justifyContent:"center", gap:12,
      }}>
        <span style={{fontSize:9, color:"#2a2a2a", letterSpacing:2}}>廣告</span>
        <div style={{flex:1, height:1, background:"#1a1a1a"}}/>
        <span style={{fontSize:11, color:"#333"}}>728 × 90 — Google AdSense</span>
        <div style={{flex:1, height:1, background:"#1a1a1a"}}/>
        <span style={{fontSize:9, color:"#2a2a2a"}}>AD</span>
      </div>
    </div>
  );
}

export default function Basketball() {
  const navigate = useNavigate();
  const main = useCountdown(10*60);
  const shot = useCountdown(24);
  const [quarter, setQ] = useState(0);
  const [poss, setPoss] = useState(0);
  const [editing, setEditing] = useState(null);
  const [log, setLog] = useState([]);
  const [showTimeout, setShowTimeout] = useState(false);
  const [showMatchEnd, setShowMatchEnd] = useState(false);
  const isPortrait = useIsPortrait();
  const [rotateHintDismissed, setRotateHintDismissed] = useState(false);
  const showRotateHint = isPortrait && !rotateHintDismissed;
  const [teams, setTeams] = useState([
    {name:"主　隊", score:0, fouls:0, techFouls:0, timeouts:0, history:[]},
    {name:"客　隊", score:0, fouls:0, techFouls:0, timeouts:0, history:[]},
  ]);

  const mainUrgent = main.secs <= 10 && main.secs > 0 && main.on;
  const shotUrgent = shot.secs <= 10 && shot.secs > 0 && shot.on;
  const mainBlink  = useSecondBlink(mainUrgent, main.secs);
  const shotBlink  = useSecondBlink(shotUrgent, shot.secs);

  const addLog = msg => setLog(p=>[{t:main.fmt(), msg, id:Date.now()+Math.random()},...p].slice(0,40));
  const upd = (i,patch) => setTeams(p=>{ const n=[...p]; n[i]={...n[i],...patch}; return n; });

  const syncToggle = () => {
    if (main.on) { main.stop(); shot.stop(); }
    else         { main.start(); shot.start(); }
  };
  const resetShot = (v) => {
    shot.reset(v);
    if (main.on) setTimeout(() => shot.start(), 50);
  };

  const score = (i,pts) => {
    upd(i,{score:teams[i].score+pts, history:[...teams[i].history,pts]});
    addLog(`${teams[i].name} +${pts}`);
  };
  const undo = (i) => {
    const h=[...teams[i].history]; if(!h.length) return;
    const last=h.pop();
    upd(i,{score:Math.max(0,teams[i].score-last), history:h});
    addLog(`${teams[i].name} 取消 +${last}`);
  };
  const foul = (i,d) => { const v=Math.max(0,teams[i].fouls+d); upd(i,{fouls:v}); if(d>0) addLog(`${teams[i].name} 犯規(${v})`); };
  const tech = (i,d) => { const v=Math.max(0,teams[i].techFouls+d); upd(i,{techFouls:v}); if(d>0) addLog(`${teams[i].name} 技術犯規(${v})`); };
  const to   = (i,d) => { upd(i,{timeouts:Math.min(3,Math.max(0,teams[i].timeouts+d))}); if(d>0) addLog(`${teams[i].name} 請求暫停`); };
  const possession = (i) => { setPoss(i); addLog(`球權 → ${teams[i].name}`); };

  const nextQ = () => {
    if(quarter >= QUARTERS.length-1) return;
    const nq=quarter+1;
    setQ(nq); main.reset(nq>=4?5*60:10*60); shot.reset(24);
    setTeams(p=>p.map(t=>({...t,fouls:0,timeouts:0})));
    addLog(`──── ${QUARTERS[nq]} ────`);
  };

  // Possession arrow: points toward the team that has the ball
  // poss===0 → left team has ball → arrow points LEFT (◀)
  // poss===1 → right team has ball → arrow points RIGHT (▶)
  const PossArrow = ({ side }) => {
    const isLeft  = side === "left";
    const hasBall = (isLeft && poss === 0) || (!isLeft && poss === 1);
    return (
      <div
        onClick={() => possession(isLeft ? 0 : 1)}
        style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", gap:4, cursor:"pointer",
          opacity: hasBall ? 1 : 0.18,
          transition:"opacity .3s",
          padding:"0 6px",
        }}
      >
        <div style={{
          fontSize:42, color:"#22c55e", lineHeight:1,
          transform: isLeft ? "none" : "none",
        }}>{isLeft ? "◀" : "▶"}</div>
        <div style={{fontSize:10, color:"#22c55e", fontWeight:700, letterSpacing:1, textAlign:"center"}}>
          {hasBall ? "持球" : ""}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      height:"100vh", width:"100vw", maxWidth:"100vw", background:"#0a0a0a",
      fontFamily:"'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      color:"#e0e0e0", display:"flex", flexDirection:"column",
      overflowX:"hidden", overflowY:"hidden",
    }}>
      {showRotateHint && <RotateHint onClose={()=>setRotateHintDismissed(true)}/>}
      {showTimeout && <TimeoutTimer onClose={()=>setShowTimeout(false)}/>}
      {showMatchEnd && (
        <MatchEndModal
          sport="basketball" mode="5v5"
          teamA={teams[0].name.trim()} teamB={teams[1].name.trim()}
          scoreA={teams[0].score} scoreB={teams[1].score}
          winner={teams[0].score > teams[1].score ? "A" : "B"}
          onClose={() => setShowMatchEnd(false)}
        />
      )}

      {/* HEADER */}
      <div style={{
        height:HDR_H, flexShrink:0, background:"#0d0d0d",
        borderBottom:"1px solid #1a1a1a",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 16px", overflow:"hidden", minWidth:0,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:12, flexShrink:0}}>
          <button onClick={()=>navigate("/")} style={{
            padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700,
            background:"#1a1a1a", border:"1px solid #2a2a2a",
            color:"#555", cursor:"pointer", letterSpacing:1,
          }}>← 首頁</button>
          <span style={{fontSize:22}}>🏀</span>
          <span style={{fontSize:13, fontWeight:800, letterSpacing:3, color:"#cc0000"}}>KEEGOING</span>
        </div>
        <div style={{display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", minWidth:0, justifyContent:"center"}}>
          {QUARTERS.map((q,i)=>(
            <button key={q} onClick={()=>setQ(i)} style={{
              padding:"4px 16px", borderRadius:20, fontSize:15, fontWeight:800,
              border: i===quarter?"2px solid #cc0000":"1px solid #222",
              background: i===quarter?"#cc000022":"transparent",
              color: i===quarter?"#cc0000":"#444",
              cursor:"pointer", letterSpacing:2,
            }}>{q}</button>
          ))}
          <button onClick={nextQ} style={{
            marginLeft:6, padding:"4px 14px", borderRadius:20, fontSize:14,
            background:"#1a1a1a", border:"1px solid #2a2a2a", color:"#555", cursor:"pointer",
          }}>NEXT →</button>
        </div>
        <button onClick={() => setShowMatchEnd(true)} style={{
          padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700,
          background:"#cc000022", border:"1px solid #cc000044",
          color:"#cc0000", cursor:"pointer",
        }}>結束比賽</button>
      </div>

      {/* MAIN */}
      <div style={{flex:1, display:"flex", minHeight:0, minWidth:0, overflow:"hidden"}}>

        <TeamPanel team={teams[0]} idx={0} poss={poss}
          onScore={p=>score(0,p)} onUndo={()=>undo(0)}
          onFoul={()=>foul(0,1)} onFoulSub={()=>foul(0,-1)}
          onTech={()=>tech(0,1)} onTechSub={()=>tech(0,-1)}
          onTO={()=>to(0,1)} onTOSub={()=>to(0,-1)}
          onPoss={()=>possession(0)} onOpenTimeout={()=>setShowTimeout(true)}
          onNameClick={()=>setEditing(0)} editing={editing===0}
          onNameChange={v=>upd(0,{name:v})} onNameBlur={()=>setEditing(null)}
        />

        {/* ── CENTER COLUMN — 1/3 total width ── */}
        <div style={{
          flex:"0 0 33.333%", minWidth:0,
          background:"#080808",
          borderLeft:"1px solid #1a1a1a", borderRight:"1px solid #1a1a1a",
          display:"flex", flexDirection:"column",
          overflowY:"auto", overflowX:"hidden",
        }}>

          {/* ── TOP 1/3: Main clock with possession arrows on sides ── */}
          <div style={{
            flex:1,
            display:"flex", alignItems:"stretch",
            borderBottom:"1px solid #1a1a1a",
            border: `4px solid ${mainUrgent ? (mainBlink ? "#fff" : "transparent") : "transparent"}`,
            background:"#0f0f0f",
            transition: mainUrgent ? "none" : "border-color .3s",
            position:"relative", overflow:"hidden",
          }}>
            {/* Left possession arrow */}
            <div style={{flexShrink:0, display:"flex", alignItems:"center"}}>
              <PossArrow side="left"/>
            </div>

            {/* Main clock — fills remaining space */}
            <div style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              textAlign:"center",
            }}>
              <div style={{fontSize:11, color:"#444", letterSpacing:3, marginBottom:2}}>TIME</div>
              <div style={{
                fontSize:"min(6.5vw, 11vh)",
                fontWeight:900,
                color: main.secs<=10 && main.secs>0 ? "#ef4444" : "#f0f0f0",
                fontFamily:"'Bebas Neue', sans-serif",
                fontVariantNumeric:"tabular-nums",
                transition:"color .3s", lineHeight:1,
                width:"100%", textAlign:"center",
                whiteSpace:"nowrap", overflow:"hidden",
                letterSpacing:"-0.03em",
              }}>{main.fmt()}</div>
            </div>

            {/* Right possession arrow */}
            <div style={{flexShrink:0, display:"flex", alignItems:"center"}}>
              <PossArrow side="right"/>
            </div>
          </div>

          {/* ── MIDDLE 1/3: Shot clock — fills block ── */}
          <div style={{
            flex:1,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            borderTop:"1px solid #1a1a1a", borderBottom:"1px solid #1a1a1a",
            background:"#0c0c0c",
            border: `4px solid ${shotUrgent ? (shotBlink ? "#fff" : "transparent") : "transparent"}`,
            transition: shotUrgent ? "none" : "border-color .3s",
            overflow:"hidden",
          }}>
            <div style={{fontSize:11, color:"#444", letterSpacing:3, marginBottom:2}}>SHOT CLOCK</div>
            <div style={{
              fontSize:"min(18vw, 22vh)",
              fontWeight:900,
              color: shot.secs<=10 && shot.secs>0 ? "#ef4444" : "#f59e0b",
              fontFamily:"'Bebas Neue', sans-serif",
              fontVariantNumeric:"tabular-nums",
              transition:"color .3s", lineHeight:1,
            }}>{String(shot.secs).padStart(2,"0")}</div>
            <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:8}}>
              <button onClick={()=>resetShot(24)} style={{
                padding:"5px 16px", borderRadius:8, fontSize:14, fontWeight:700,
                background:"#1a1a1a", border:"1px solid #2a2a2a", color:"#777", cursor:"pointer",
              }}>24</button>
              <button onClick={()=>resetShot(14)} style={{
                padding:"5px 16px", borderRadius:8, fontSize:14, fontWeight:700,
                background:"#1a1a1a", border:"1px solid #2a2a2a", color:"#777", cursor:"pointer",
              }}>14</button>
            </div>
          </div>

          {/* ── BOTTOM 1/3: Controls + log ── */}
          <div style={{
            flex:1,
            display:"flex", flexDirection:"column", alignItems:"center",
            padding:"10px 12px", gap:8, overflow:"hidden",
          }}>
            {/* Sync + reset */}
            <button onClick={syncToggle} style={{
              width:"100%", padding:"12px 0", borderRadius:10, fontSize:15, fontWeight:800,
              background: main.on
                ? "linear-gradient(135deg,#7f1d1d,#991b1b)"
                : "linear-gradient(135deg,#14532d,#15803d)",
              border:"none", color:"#fff", cursor:"pointer", letterSpacing:1, flexShrink:0,
            }}>
              {main.on ? "⏸ 暫停" : "▶ 同步啟動"}
            </button>

            <button onClick={()=>{ main.reset(quarter>=4?5*60:10*60); shot.reset(24); }} style={{
              width:"100%", padding:"7px 0", borderRadius:10, fontSize:13, flexShrink:0,
              background:"#111", border:"1px solid #222", color:"#555", cursor:"pointer",
            }}>↺ 重設</button>

            {/* Log */}
            <div style={{
              flex:1, width:"100%", overflowY:"auto",
              borderTop:"1px solid #111", paddingTop:6,
            }}>
              <div style={{fontSize:9, color:"#2a2a2a", letterSpacing:2, marginBottom:4}}>LOG</div>
              {log.map(l=>(
                <div key={l.id} style={{fontSize:10, color:"#383838", marginBottom:3, lineHeight:1.4}}>
                  <span style={{color:"#555"}}>{l.t} </span>{l.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        <TeamPanel team={teams[1]} idx={1} poss={poss}
          onScore={p=>score(1,p)} onUndo={()=>undo(1)}
          onFoul={()=>foul(1,1)} onFoulSub={()=>foul(1,-1)}
          onTech={()=>tech(1,1)} onTechSub={()=>tech(1,-1)}
          onTO={()=>to(1,1)} onTOSub={()=>to(1,-1)}
          onPoss={()=>possession(1)} onOpenTimeout={()=>setShowTimeout(true)}
          onNameClick={()=>setEditing(1)} editing={editing===1}
          onNameChange={v=>upd(1,{name:v})} onNameBlur={()=>setEditing(null)}
        />
      </div>

      <AdBanner/>
    </div>
  );
}

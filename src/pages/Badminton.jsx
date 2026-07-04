import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MatchEndModal from "./MatchEndModal";

const AD_H = 56;
const WIN_SCORE = 21;
const MAX_SCORE = 30;
const SWITCH_SCORE = 11;
const COLORS = ["#c2410c", "#1d4ed8"];
const LIGHT_BG = ["#fff3ee", "#eef3ff"];

function calcWinner(a, b) {
  const diff = Math.abs(a - b);
  if ((a >= WIN_SCORE || b >= WIN_SCORE) && diff >= 2) return a > b ? 0 : 1;
  if (a >= MAX_SCORE || b >= MAX_SCORE) return a > b ? 0 : 1;
  return null;
}

function AdBanner() {
  return (
    <div style={{
      height:AD_H, flexShrink:0,
      background:"#f5f5f5", borderTop:"1px solid #ddd",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        width:"100%", maxWidth:728, height:40,
        background:"#ebebeb", border:"1px dashed #ccc",
        borderRadius:6, margin:"0 16px",
        display:"flex", alignItems:"center", justifyContent:"center", gap:12,
      }}>
        <span style={{fontSize:9, color:"#bbb", letterSpacing:2}}>廣告</span>
        <div style={{flex:1, height:1, background:"#ddd"}}/>
        <span style={{fontSize:11, color:"#bbb"}}>728 × 90 — Google AdSense</span>
        <div style={{flex:1, height:1, background:"#ddd"}}/>
        <span style={{fontSize:9, color:"#bbb"}}>AD</span>
      </div>
    </div>
  );
}

function ScoreCard({ score, color, lightBg, serving, name, onScore, onUndo,
                     onNameClick, editing, onNameChange, onNameBlur,
                     side, doubles, server }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      borderRight: side==="left" ? "3px solid #e0e0e0" : "none",
      borderLeft:  side==="right"? "3px solid #e0e0e0" : "none",
    }}>
      {/* Name bar */}
      <div onClick={onNameClick} style={{
        background: color, padding:"8px 16px",
        textAlign:"center", cursor:"pointer", flexShrink:0,
      }}>
        {editing ? (
          <input autoFocus value={name}
            onChange={e=>onNameChange(e.target.value)}
            onBlur={onNameBlur}
            onKeyDown={e=>e.key==="Enter"&&onNameBlur()}
            style={{
              background:"transparent", border:"none", outline:"none",
              color:"#fff", fontSize:18, fontWeight:800,
              textAlign:"center", width:"100%", fontFamily:"inherit",
            }}/>
        ) : (
          <span style={{fontSize:18, fontWeight:800, color:"#fff", letterSpacing:2}}>
            {name} <span style={{fontSize:12, opacity:.6}}>✏</span>
          </span>
        )}
      </div>

      {/* Big score card — tap to score */}
      <div
        onPointerDown={()=>setPressed(true)}
        onPointerUp={()=>{ setPressed(false); onScore(); }}
        onPointerLeave={()=>setPressed(false)}
        style={{
          flex:1,
          background: serving ? color : lightBg,
          border: serving ? `6px solid ${color}` : `6px solid transparent`,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer",
          transform: pressed ? "scale(.97)" : "scale(1)",
          transition:"transform .1s, background .25s, border .25s",
          userSelect:"none",
          position:"relative",
        }}>

        {/* Score number — fills the card */}
        <span style={{
          fontSize:"22vw",
          fontWeight:900,
          color: serving ? "#fff" : color,
          fontFamily:"'Courier New', monospace",
          letterSpacing:"-0.05em",
          lineHeight:1,
          transition:"color .25s",
          userSelect:"none",
        }}>{String(score).padStart(2,"0")}</span>

        {/* Serving dot top-center */}
        {serving && (
          <div style={{
            position:"absolute", top:14, left:"50%",
            transform:"translateX(-50%)",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <div style={{
              width:14, height:14, borderRadius:"50%",
              background:"#fff", opacity:.9,
            }}/>
            <span style={{fontSize:13, color:"#fff", fontWeight:700, letterSpacing:2, opacity:.9}}>
              發球中{doubles && server ? ` — ${server}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:12, padding:"10px 16px", background:"#f8f8f8",
        borderTop:"1px solid #e0e0e0", flexShrink:0,
      }}>
        <button
          onPointerDown={()=>setPressed(true)}
          onPointerUp={()=>{ setPressed(false); onScore(); }}
          style={{
            padding:"8px 28px", borderRadius:10, fontSize:16, fontWeight:800,
            background: color, border:"none", color:"#fff", cursor:"pointer",
          }}>+1</button>
        <button onClick={onUndo} style={{
          padding:"8px 18px", borderRadius:10, fontSize:14,
          background:"none", border:"1.5px solid #ddd",
          color:"#999", cursor:"pointer",
        }}>↩ 取消</button>
      </div>
    </div>
  );
}

export default function Badminton() {
  const navigate = useNavigate();
  const [mode, setMode]         = useState(null);
  const [names, setNames]       = useState(["左隊","右隊"]);
  const [doubles, setDoubles]   = useState([["A","B"],["C","D"]]);
  const [editing, setEditing]   = useState(null);
  const [setupDone, setSetupDone] = useState(false);

  const [scores, setScores]     = useState([[0,0]]);
  const [serving, setServing]   = useState(0);
  const [serverIdx, setServerIdx] = useState([0,0]);
  const [setWins, setSetWins]   = useState([0,0]);
  const [history, setHistory]   = useState([]);
  const [alert, setAlert]       = useState(null);
  const [showMatchEnd, setShowMatchEnd] = useState(false);

  const curSet = scores.length - 1;
  const [s0, s1] = scores[curSet];
  const winner = calcWinner(s0, s1);

  const showAlert = (msg, dur=2800) => {
    setAlert(msg);
    setTimeout(()=>setAlert(null), dur);
  };

  const score = (team) => {
    if (winner !== null) return;
    setHistory(h=>[...h,{
      scores:scores.map(r=>[...r]),
      serving, serverIdx:[...serverIdx], setWins:[...setWins],
    }]);

    const cur = [...scores[curSet]];
    cur[team]++;

    if (curSet===2 && cur[0]+cur[1]===SWITCH_SCORE) showAlert("⇄ 換邊！",3200);

    const w = calcWinner(cur[0], cur[1]);
    if (w !== null) {
      const nw=[...setWins]; nw[w]++;
      setSetWins(nw);
      setScores(prev=>{ const n=[...prev]; n[curSet]=[...cur]; return n; });
      if (nw[w]>=2) { showAlert(`🏆 ${names[w]} 獲勝！`,8000); return; }
      setTimeout(()=>{
        setScores(prev=>[...prev,[0,0]]);
        setServing(w); setServerIdx([0,0]);
        showAlert(`第 ${scores.length+1} 局開始`,2200);
      },1400);
      return;
    }

    let ns=serving, ni=[...serverIdx];
    if (team!==serving) {
      ns=team;
      if (mode==="doubles") ni[team]=(serverIdx[team]+1)%2;
    }
    setServing(ns); setServerIdx(ni);
    setScores(prev=>{ const n=[...prev]; n[curSet]=[...cur]; return n; });
  };

  const undo = () => {
    if (!history.length) return;
    const last=history[history.length-1];
    setScores(last.scores); setServing(last.serving);
    setServerIdx(last.serverIdx); setSetWins(last.setWins);
    setHistory(h=>h.slice(0,-1)); setAlert(null);
  };

  // ── Setup screen ──
  if (!setupDone) {
    return (
      <div style={{
        height:"100vh", background:"#fff",
        fontFamily:"'Inter','Helvetica Neue',sans-serif",
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", gap:24, color:"#222",
      }}>
        <button onClick={()=>navigate("/")} style={{
          position:"absolute", top:16, left:16,
          padding:"4px 12px", borderRadius:6, fontSize:11, fontWeight:700,
          background:"#f0f0f0", border:"1px solid #ddd",
          color:"#888", cursor:"pointer",
        }}>← 首頁</button>
        <div style={{fontSize:36}}>🏸</div>
        <div style={{fontSize:16, fontWeight:800, letterSpacing:4, color:"#111"}}>羽球計分板</div>

        <div style={{display:"flex", gap:12}}>
          {["singles","doubles"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              padding:"11px 30px", borderRadius:10, fontSize:14, fontWeight:700,
              background: mode===m ? COLORS[0] : "#f5f5f5",
              border:`2px solid ${mode===m ? COLORS[0] : "#ddd"}`,
              color: mode===m ? "#fff" : "#555",
              cursor:"pointer", letterSpacing:1,
            }}>
              {m==="singles"?"單打":"雙打"}
            </button>
          ))}
        </div>

        {mode && (
          <div style={{display:"flex", gap:28, marginTop:4}}>
            {[0,1].map(i=>(
              <div key={i} style={{display:"flex", flexDirection:"column", gap:8, alignItems:"center"}}>
                <div style={{width:14, height:14, borderRadius:"50%", background:COLORS[i]}}/>
                <input value={names[i]}
                  onChange={e=>{ const n=[...names]; n[i]=e.target.value; setNames(n); }}
                  placeholder={i===0?"左隊名稱":"右隊名稱"}
                  style={{
                    background:"#f8f8f8", border:`1.5px solid ${COLORS[i]}`,
                    borderRadius:8, color:"#222", fontSize:14,
                    padding:"8px 14px", outline:"none", textAlign:"center",
                    fontFamily:"inherit",
                  }}/>
                {mode==="doubles" && doubles[i].map((p,j)=>(
                  <input key={j} value={p}
                    onChange={e=>{ const d=doubles.map(r=>[...r]); d[i][j]=e.target.value; setDoubles(d); }}
                    placeholder={`球員 ${j+1}`}
                    style={{
                      background:"#f8f8f8", border:"1px solid #ddd",
                      borderRadius:6, color:"#555", fontSize:13,
                      padding:"6px 12px", outline:"none", textAlign:"center",
                      fontFamily:"inherit", width:110,
                    }}/>
                ))}
              </div>
            ))}
          </div>
        )}

        {mode && (
          <button onClick={()=>setSetupDone(true)} style={{
            marginTop:8, padding:"12px 40px", borderRadius:10,
            background:"#22c55e", border:"none",
            color:"#fff", fontSize:15, fontWeight:800,
            cursor:"pointer", letterSpacing:2,
          }}>開始比賽</button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      height:"100vh", background:"#fff",
      fontFamily:"'Inter','Helvetica Neue',sans-serif",
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>

      {/* HEADER */}
      <div style={{
        height:46, flexShrink:0, background:"#fff",
        borderBottom:"1px solid #e0e0e0",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 16px",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <button onClick={()=>navigate("/")} style={{
            padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700,
            background:"#f0f0f0", border:"1px solid #ddd",
            color:"#888", cursor:"pointer",
          }}>← 首頁</button>
          <span style={{fontSize:20}}>🏸</span>
          <span style={{fontSize:12, fontWeight:800, letterSpacing:3, color:"#333"}}>羽球計分板</span>
          <span style={{
            fontSize:10, background:"#f0f0f0", border:"1px solid #ddd",
            borderRadius:4, padding:"2px 8px", color:"#888", marginLeft:4,
          }}>{mode==="doubles"?"雙打":"單打"}</span>
        </div>

        {/* Set wins */}
        <div style={{display:"flex", gap:24, alignItems:"center"}}>
          {[0,1].map(i=>(
            <div key={i} style={{display:"flex", alignItems:"center", gap:8}}>
              <span style={{fontSize:12, color:COLORS[i], fontWeight:700}}>{names[i]}</span>
              <div style={{display:"flex", gap:4}}>
                {Array.from({length:2}).map((_,j)=>(
                  <div key={j} style={{
                    width:13, height:13, borderRadius:"50%",
                    background: j<setWins[i] ? COLORS[i] : "#eee",
                    border:`1.5px solid ${j<setWins[i] ? COLORS[i] : "#ddd"}`,
                  }}/>
                ))}
              </div>
            </div>
          ))}
          <span style={{fontSize:12, color:"#aaa"}}>第 {curSet+1} 局</span>
        </div>

        <button onClick={()=>{ setSetupDone(false); setScores([[0,0]]); setSetWins([0,0]); setServing(0); setServerIdx([0,0]); setHistory([]); }} style={{
          fontSize:11, padding:"4px 12px", borderRadius:6,
          background:"#f5f5f5", border:"1px solid #ddd",
          color:"#888", cursor:"pointer",
        }}>重新設定</button>
      </div>

      {showMatchEnd && (
        <MatchEndModal
          sport="badminton" mode={mode === "doubles" ? "雙打" : "單打"}
          teamA={names[0]} teamB={names[1]}
          scoreA={setWins[0]} scoreB={setWins[1]}
          winner={setWins[0] > setWins[1] ? "A" : "B"}
          onClose={() => setShowMatchEnd(false)}
        />
      )}
      {/* Alert */}
      {alert && (
        <div style={{
          background:"#f0fdf4", borderBottom:"2px solid #22c55e",
          padding:"10px", textAlign:"center",
          fontSize:16, fontWeight:800, color:"#15803d", letterSpacing:2,
          flexShrink:0,
        }}>{alert}</div>
      )}

      {/* MAIN — two big score cards */}
      <div style={{flex:1, display:"flex", minHeight:0}}>
        <ScoreCard
          score={s0} color={COLORS[0]} lightBg={LIGHT_BG[0]}
          serving={serving===0} name={names[0]} side="left"
          doubles={mode==="doubles"} server={mode==="doubles"?doubles[0][serverIdx[0]]:null}
          onScore={()=>score(0)} onUndo={undo}
          onNameClick={()=>setEditing(0)} editing={editing===0}
          onNameChange={v=>{const n=[...names];n[0]=v;setNames(n);}}
          onNameBlur={()=>setEditing(null)}
        />

        {/* Center strip */}
        <div style={{
          width:80, flexShrink:0, background:"#f8f8f8",
          borderLeft:"1px solid #e8e8e8", borderRight:"1px solid #e8e8e8",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:10,
          padding:"8px 0",
        }}>
          <span style={{fontSize:11, color:"#ccc", letterSpacing:3}}>VS</span>
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
            {scores.map(([a,b],i)=>(
              <div key={i} style={{
                fontSize:12, fontWeight: i===curSet?800:400,
                color: i===curSet?"#333":"#ccc",
                textAlign:"center",
              }}>
                {i===curSet && <span style={{color:COLORS[0], marginRight:2}}>▸</span>}
                {a}:{b}
              </div>
            ))}
          </div>
          {mode==="doubles" && (
            <div style={{
              fontSize:10, color:"#bbb", textAlign:"center",
              marginTop:6, lineHeight:1.6,
            }}>
              發球<br/>
              <span style={{color:COLORS[serving], fontWeight:700}}>
                {doubles[serving][serverIdx[serving]]}
              </span>
            </div>
          )}
        </div>

        <ScoreCard
          score={s1} color={COLORS[1]} lightBg={LIGHT_BG[1]}
          serving={serving===1} name={names[1]} side="right"
          doubles={mode==="doubles"} server={mode==="doubles"?doubles[1][serverIdx[1]]:null}
          onScore={()=>score(1)} onUndo={undo}
          onNameClick={()=>setEditing(1)} editing={editing===1}
          onNameChange={v=>{const n=[...names];n[1]=v;setNames(n);}}
          onNameBlur={()=>setEditing(null)}
        />
      </div>

      <AdBanner/>
    </div>
  );
}

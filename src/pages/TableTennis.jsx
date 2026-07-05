import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MatchEndModal from "./MatchEndModal";

const AD_H = 56;
const WIN_SCORE = 11;
const COLORS = ["#c2410c", "#1d4ed8"];
const LIGHT_BG = ["#fff3ee", "#eef3ff"];

function calcWinner(a, b) {
  const diff = Math.abs(a - b);
  if ((a >= WIN_SCORE || b >= WIN_SCORE) && diff >= 2) return a > b ? 0 : 1;
  return null;
}

function AdBanner() {
  return (
    <div style={{
      height: AD_H, flexShrink: 0,
      background: "#f5f5f5", borderTop: "1px solid #ddd",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 728, height: 40,
        background: "#ebebeb", border: "1px dashed #ccc",
        borderRadius: 6, margin: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <span style={{ fontSize: 9, color: "#bbb", letterSpacing: 2 }}>廣告</span>
        <div style={{ flex: 1, height: 1, background: "#ddd" }} />
        <span style={{ fontSize: 11, color: "#bbb" }}>728 × 90 — Google AdSense</span>
        <div style={{ flex: 1, height: 1, background: "#ddd" }} />
        <span style={{ fontSize: 9, color: "#bbb" }}>AD</span>
      </div>
    </div>
  );
}

function ScoreCard({ score, color, lightBg, name, onScore, onUndo,
                     onNameClick, editing, onNameChange, onNameBlur, side }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{
      flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
      borderRight: side === "left" ? "3px solid #e0e0e0" : "none",
      borderLeft: side === "right" ? "3px solid #e0e0e0" : "none",
    }}>
      {/* Name bar */}
      <div onClick={onNameClick} style={{
        background: color, padding: "8px 16px",
        textAlign: "center", cursor: "pointer", flexShrink: 0,
      }}>
        {editing ? (
          <input autoFocus value={name}
            onChange={e => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            onKeyDown={e => e.key === "Enter" && onNameBlur()}
            style={{
              background: "transparent", border: "none", outline: "none",
              color: "#fff", fontSize: 18, fontWeight: 800,
              textAlign: "center", width: "100%", fontFamily: "inherit",
            }} />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>
            {name} <span style={{ fontSize: 12, opacity: .6 }}>✏</span>
          </span>
        )}
      </div>

      {/* Big score card */}
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); onScore(); }}
        onPointerLeave={() => setPressed(false)}
        style={{
          flex: 1,
          background: lightBg,
          border: "6px solid transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          transform: pressed ? "scale(.97)" : "scale(1)",
          transition: "transform .1s",
          userSelect: "none",
        }}>
        <span style={{
          fontSize: "22vw",
          fontWeight: 900,
          color: color,
          fontFamily: "'Courier New', monospace",
          letterSpacing: "-0.05em",
          lineHeight: 1,
          userSelect: "none",
        }}>{String(score).padStart(2, "0")}</span>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 12, padding: "10px 16px", background: "#f8f8f8",
        borderTop: "1px solid #e0e0e0", flexShrink: 0, flexWrap: "wrap", minWidth: 0,
      }}>
        <button
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => { setPressed(false); onScore(); }}
          style={{
            padding: "8px 28px", borderRadius: 10, fontSize: 16, fontWeight: 800,
            background: color, border: "none", color: "#fff", cursor: "pointer",
          }}>+1</button>
        <button onClick={onUndo} style={{
          padding: "8px 18px", borderRadius: 10, fontSize: 14,
          background: "none", border: "1.5px solid #ddd",
          color: "#999", cursor: "pointer",
        }}>↩ 取消</button>
      </div>
    </div>
  );
}

export default function TableTennis() {
  const navigate = useNavigate();
  const [format, setFormat] = useState(null); // "bo3" | "bo5"
  const [names, setNames] = useState(["左方", "右方"]);
  const [editing, setEditing] = useState(null);
  const [setupDone, setSetupDone] = useState(false);

  const maxSets = format === "bo3" ? 3 : 5;
  const winsNeeded = format === "bo1" ? 1 : format === "bo3" ? 2 : 3;

  const [scores, setScores] = useState([[0, 0]]);
  const [setWins, setSetWins] = useState([0, 0]);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showMatchEnd, setShowMatchEnd] = useState(false);

  const curSet = scores.length - 1;
  const [s0, s1] = scores[curSet];
  const winner = calcWinner(s0, s1);

  const showAlert = (msg, dur = 2800) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), dur);
  };

  const score = (team) => {
    if (winner !== null) return;
    setHistory(h => [...h, {
      scores: scores.map(r => [...r]),
      setWins: [...setWins],
    }]);

    const cur = [...scores[curSet]];
    cur[team]++;

    const w = calcWinner(cur[0], cur[1]);
    if (w !== null) {
      const nw = [...setWins]; nw[w]++;
      setSetWins(nw);
      setScores(prev => { const n = [...prev]; n[curSet] = [...cur]; return n; });
      if (nw[w] >= winsNeeded) {
        showAlert(`🏆 ${names[w]} 獲勝！`, 8000);
        return;
      }
      setTimeout(() => {
        setScores(prev => [...prev, [0, 0]]);
        showAlert(`第 ${scores.length + 1} 局開始`, 2200);
      }, 1400);
      return;
    }

    setScores(prev => { const n = [...prev]; n[curSet] = [...cur]; return n; });
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setScores(last.scores);
    setSetWins(last.setWins);
    setHistory(h => h.slice(0, -1));
    setAlert(null);
  };

  // ── Setup screen ──
  if (!setupDone) {
    return (
      <div style={{
        height: "100vh", background: "#fff",
        fontFamily: "'Inter','Helvetica Neue',sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 24, color: "#222", position: "relative",
      }}>
        <button onClick={() => navigate("/")} style={{
          position: "absolute", top: 16, left: 16,
          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#f0f0f0", border: "1px solid #ddd",
          color: "#888", cursor: "pointer",
        }}>← 首頁</button>

        <div style={{ fontSize: 36 }}>🏓</div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 4, color: "#111" }}>桌球計分板</div>

        {/* Format selection */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#888", letterSpacing: 2 }}>選擇賽制</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ key: "bo1", label: "一局決勝" }, { key: "bo3", label: "三局兩勝" }, { key: "bo5", label: "五局三勝" }].map(f => (
              <button key={f.key} onClick={() => setFormat(f.key)} style={{
                padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: format === f.key ? COLORS[0] : "#f5f5f5",
                border: `2px solid ${format === f.key ? COLORS[0] : "#ddd"}`,
                color: format === f.key ? "#fff" : "#555",
                cursor: "pointer", letterSpacing: 1,
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Team names */}
        {format && (
          <div style={{ display: "flex", gap: 28, marginTop: 4 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS[i] }} />
                <input value={names[i]}
                  onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                  placeholder={i === 0 ? "左方名稱" : "右方名稱"}
                  style={{
                    background: "#f8f8f8", border: `1.5px solid ${COLORS[i]}`,
                    borderRadius: 8, color: "#222", fontSize: 14,
                    padding: "8px 14px", outline: "none", textAlign: "center",
                    fontFamily: "inherit",
                  }} />
              </div>
            ))}
          </div>
        )}

        {format && (
          <button onClick={() => setSetupDone(true)} style={{
            marginTop: 8, padding: "12px 40px", borderRadius: 10,
            background: "#22c55e", border: "none",
            color: "#fff", fontSize: 15, fontWeight: 800,
            cursor: "pointer", letterSpacing: 2,
          }}>開始比賽</button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh", width: "100vw", maxWidth: "100vw", background: "#fff",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", overflowX: "hidden", overflowY: "hidden",
    }}>

      {/* HEADER */}
      <div style={{
        height: 46, flexShrink: 0, background: "#fff",
        borderBottom: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/")} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: "#f0f0f0", border: "1px solid #ddd",
            color: "#888", cursor: "pointer",
          }}>← 首頁</button>
          <span style={{ fontSize: 20 }}>🏓</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "#333" }}>桌球計分板</span>
          <span style={{
            fontSize: 10, background: "#f0f0f0", border: "1px solid #ddd",
            borderRadius: 4, padding: "2px 8px", color: "#888",
          }}>{format === "bo1" ? "一局決勝" : format === "bo3" ? "三局兩勝" : "五局三勝"}</span>
        </div>

        {/* Set wins */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: COLORS[i], fontWeight: 700 }}>{names[i]}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: winsNeeded }).map((_, j) => (
                  <div key={j} style={{
                    width: 13, height: 13, borderRadius: "50%",
                    background: j < setWins[i] ? COLORS[i] : "#eee",
                    border: `1.5px solid ${j < setWins[i] ? COLORS[i] : "#ddd"}`,
                  }} />
                ))}
              </div>
            </div>
          ))}
          <span style={{ fontSize: 12, color: "#aaa" }}>第 {curSet + 1} 局</span>
        </div>

        {winner !== null && (
          <button onClick={() => setShowMatchEnd(true)} style={{
            fontSize: 11, padding: "4px 12px", borderRadius: 6,
            background: "#cc000022", border: "1px solid #cc000044",
            color: "#cc0000", cursor: "pointer", marginRight: 6,
          }}>結束比賽</button>
        )}
        <button onClick={() => { setSetupDone(false); setScores([[0, 0]]); setSetWins([0, 0]); setHistory([]); setAlert(null); }} style={{
          fontSize: 11, padding: "4px 12px", borderRadius: 6,
          background: "#f5f5f5", border: "1px solid #ddd",
          color: "#888", cursor: "pointer",
        }}>重新設定</button>
      </div>

      {showMatchEnd && (
        <MatchEndModal
          sport="tabletennis" mode="桌球"
          teamA={names[0]} teamB={names[1]}
          scoreA={setWins[0]} scoreB={setWins[1]}
          winner={setWins[0] > setWins[1] ? "A" : "B"}
          onClose={() => setShowMatchEnd(false)}
        />
      )}
      {/* Alert */}
      {alert && (
        <div style={{
          background: "#f0fdf4", borderBottom: "2px solid #22c55e",
          padding: "10px", textAlign: "center",
          fontSize: 16, fontWeight: 800, color: "#15803d", letterSpacing: 2,
          flexShrink: 0,
        }}>{alert}</div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0, overflow: "hidden" }}>
        <ScoreCard
          score={s0} color={COLORS[0]} lightBg={LIGHT_BG[0]}
          name={names[0]} side="left"
          onScore={() => score(0)} onUndo={undo}
          onNameClick={() => setEditing(0)} editing={editing === 0}
          onNameChange={v => { const n = [...names]; n[0] = v; setNames(n); }}
          onNameBlur={() => setEditing(null)}
        />

        {/* Center strip */}
        <div style={{
          width: 80, flexShrink: 0, background: "#f8f8f8",
          borderLeft: "1px solid #e8e8e8", borderRight: "1px solid #e8e8e8",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span style={{ fontSize: 11, color: "#ccc", letterSpacing: 3 }}>VS</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {scores.map(([a, b], i) => (
              <div key={i} style={{
                fontSize: 12, fontWeight: i === curSet ? 800 : 400,
                color: i === curSet ? "#333" : "#ccc", textAlign: "center",
              }}>
                {i === curSet && <span style={{ color: COLORS[0], marginRight: 2 }}>▸</span>}
                {a}:{b}
              </div>
            ))}
          </div>
        </div>

        <ScoreCard
          score={s1} color={COLORS[1]} lightBg={LIGHT_BG[1]}
          name={names[1]} side="right"
          onScore={() => score(1)} onUndo={undo}
          onNameClick={() => setEditing(1)} editing={editing === 1}
          onNameChange={v => { const n = [...names]; n[1] = v; setNames(n); }}
          onNameBlur={() => setEditing(null)}
        />
      </div>

      <AdBanner />
    </div>
  );
}

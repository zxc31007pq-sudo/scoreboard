import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MatchEndModal from "./MatchEndModal";
import sportBasketball from "../assets/icons/sport_basketball.png";

const COLORS = ["#cc0000", "#1d4ed8"];
const LIGHT_BG = ["#fff0f0", "#eef3ff"];
const AD_H = 56;

function calcWinner(a, b, limit) {
  if (a >= limit && a > b) return 0;
  if (b >= limit && b > a) return 1;
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

function ScoreCard({ score, color, lightBg, name, limit, onScore, onUndo,
                     onNameClick, editing, onNameChange, onNameBlur, side, winner }) {
  const [pressed, setPressed] = useState(false);
  const isWinner = winner !== null && ((side === "left" && winner === 0) || (side === "right" && winner === 1));

  return (
    <div style={{
      flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto",
      borderRight: side === "left" ? "3px solid #e0e0e0" : "none",
      borderLeft: side === "right" ? "3px solid #e0e0e0" : "none",
    }}>
      {/* Name bar */}
      <div onClick={onNameClick} style={{
        background: color, padding: "8px 16px",
        textAlign: "center", cursor: "pointer", flexShrink: 0,
        position: "relative",
      }}>
        {isWinner && (
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 16,
          }}>🏆</span>
        )}
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

      {/* Score progress bar */}
      <div style={{
        height: 4, background: "#e0e0e0", flexShrink: 0,
      }}>
        <div style={{
          height: "100%", background: color,
          width: `${Math.min(100, (score / limit) * 100)}%`,
          transition: "width .3s",
        }} />
      </div>

      {/* Big score */}
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); if (winner === null) onScore(1); }}
        onPointerLeave={() => setPressed(false)}
        style={{
          flex: 1, background: lightBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: winner === null ? "pointer" : "default",
          transform: pressed && winner === null ? "scale(.97)" : "scale(1)",
          transition: "transform .1s",
          userSelect: "none", position: "relative",
        }}>
        <span style={{
          fontSize: "22vw", fontWeight: 900, color,
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: "-0.05em", lineHeight: 1,
          userSelect: "none",
        }}>{String(score).padStart(2, "0")}</span>

        {/* Score limit indicator */}
        <div style={{
          position: "absolute", bottom: 10,
          fontSize: 11, color: "#ccc", letterSpacing: 1,
        }}>/ {limit}</div>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "10px 16px", background: "#f8f8f8",
        borderTop: "1px solid #e0e0e0", flexShrink: 0, flexWrap: "wrap", minWidth: 0,
      }}>
        {[1, 2, 3].map(pts => (
          <button key={pts}
            onClick={() => winner === null && onScore(pts)}
            disabled={winner !== null}
            style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 16, fontWeight: 800,
              background: winner === null ? color : "#e0e0e0",
              border: "none", color: "#fff",
              cursor: winner === null ? "pointer" : "not-allowed",
            }}>+{pts}</button>
        ))}
        <button onClick={onUndo} style={{
          padding: "8px 14px", borderRadius: 10, fontSize: 14,
          background: "none", border: "1.5px solid #ddd",
          color: "#999", cursor: "pointer",
        }}>↩</button>
      </div>
    </div>
  );
}

export default function Basketball3v3() {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(null);
  const [customLimit, setCustomLimit] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const [names, setNames] = useState(["主隊", "客隊"]);
  const [editing, setEditing] = useState(null);
  const [scores, setScores] = useState([0, 0]);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showMatchEnd, setShowMatchEnd] = useState(false);

  const winner = limit ? calcWinner(scores[0], scores[1], limit) : null;

  const showAlert = (msg, dur = 4000) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), dur);
  };

  const score = (team, pts) => {
    if (winner !== null) return;
    setHistory(h => [...h, [...scores]]);
    const next = [...scores];
    next[team] += pts;
    setScores(next);
    const w = calcWinner(next[0], next[1], limit);
    if (w !== null) showAlert(`🏆 ${names[w]} 獲勝！`, 99999);
  };

  const undo = () => {
    if (!history.length) return;
    setScores(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    setAlert(null);
  };

  const reset = () => {
    setSetupDone(false);
    setScores([0, 0]);
    setHistory([]);
    setAlert(null);
    setLimit(null);
    setCustomLimit("");
  };

  // Setup screen
  if (!setupDone) {
    const presets = [11, 15, 21];
    return (
      <div style={{
        height: "100vh", background: "#0a0a0a",
        fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 24, color: "#f0f0f0", position: "relative",
        padding: "0 20px", boxSizing: "border-box",
      }}>
        <button onClick={() => navigate("/basketball-select")} style={{
          position: "absolute", top: 16, left: 16,
          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          color: "#555", cursor: "pointer",
        }}>← 返回</button>

        <img src={sportBasketball} alt="籃球" style={{ width: 40, height: 40, objectFit: "contain" }} />
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 4, color: "#f0f0f0" }}>
          3 vs 3 籃球
        </div>

        {/* Score limit */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "#444", letterSpacing: 3 }}>設定得分上限</div>
          <div style={{ display: "flex", gap: 10 }}>
            {presets.map(p => (
              <button key={p} onClick={() => { setLimit(p); setCustomLimit(""); }} style={{
                width: 64, height: 64, borderRadius: 12, fontSize: 22, fontWeight: 900,
                background: limit === p ? "#cc0000" : "#1a1a1a",
                border: `2px solid ${limit === p ? "#cc0000" : "#2a2a2a"}`,
                color: limit === p ? "#fff" : "#555",
                cursor: "pointer", fontFamily: "'Courier New', monospace",
              }}>{p}</button>
            ))}
          </div>
          {/* Custom input */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#444" }}>自訂</span>
            <input
              type="number" min="5" max="99"
              value={customLimit}
              onChange={e => { setCustomLimit(e.target.value); setLimit(parseInt(e.target.value) || null); }}
              placeholder="輸入分數"
              style={{
                width: 90, padding: "8px 12px", borderRadius: 8,
                background: "#1a1a1a", border: `1.5px solid ${customLimit ? "#cc0000" : "#2a2a2a"}`,
                color: "#f0f0f0", fontSize: 14, outline: "none", textAlign: "center",
                fontFamily: "'Courier New', monospace",
              }} />
          </div>
        </div>

        {/* Team names */}
        <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 340, minWidth: 0 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS[i] }} />
              <input value={names[i]}
                onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                placeholder={i === 0 ? "主隊" : "客隊"}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#1a1a1a", border: `1.5px solid ${COLORS[i]}`,
                  borderRadius: 8, color: "#f0f0f0", fontSize: 14,
                  padding: "8px 10px", outline: "none", textAlign: "center",
                  fontFamily: "inherit",
                }} />
            </div>
          ))}
        </div>

        <button
          onClick={() => limit && setSetupDone(true)}
          disabled={!limit}
          style={{
            padding: "12px 40px", borderRadius: 10,
            background: limit ? "#22c55e" : "#1a1a1a",
            border: "none", color: limit ? "#fff" : "#333",
            fontSize: 15, fontWeight: 800, cursor: limit ? "pointer" : "not-allowed",
            letterSpacing: 2,
          }}>開始比賽</button>

        <button onClick={() => navigate("/quick-record?sport=basketball&mode=3v3")} style={{
          background: "none", border: "none", color: "#555", fontSize: 12,
          textDecoration: "underline", cursor: "pointer", fontFamily: "inherit",
        }}>不想一分一分計？直接輸入結果 →</button>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh", width: "100vw", maxWidth: "100vw", background: "#fff",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", overflowX: "hidden", overflowY: "hidden",
    }}>

      {/* Header */}
      <div style={{
        height: 46, flexShrink: 0, background: "#fff",
        borderBottom: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/basketball-select")} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: "#f0f0f0", border: "1px solid #ddd", color: "#888", cursor: "pointer",
          }}>← 返回</button>
          <span style={{ fontSize: 18 }}>🏀</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "#333" }}>
            3 vs 3 籃球
          </span>
          <span style={{
            fontSize: 10, background: "#fff0f0", border: "1px solid #fca5a5",
            borderRadius: 4, padding: "2px 8px", color: "#cc0000", fontWeight: 700,
          }}>先得 {limit} 分勝</span>
        </div>

        <button onClick={() => setShowMatchEnd(true)} style={{
          fontSize: 11, padding: "4px 12px", borderRadius: 6,
          background: "#cc000022", border: "1px solid #cc000044",
          color: "#cc0000", cursor: "pointer", marginRight: 8,
        }}>結束比賽</button>
        <button onClick={reset} style={{
          fontSize: 11, padding: "4px 12px", borderRadius: 6,
          background: "#f5f5f5", border: "1px solid #ddd", color: "#888", cursor: "pointer",
        }}>重新設定</button>
      </div>

      {showMatchEnd && (
        <MatchEndModal
          sport="basketball" mode="3v3"
          teamA={names[0]} teamB={names[1]}
          scoreA={scores[0]} scoreB={scores[1]}
          winner={scores[0] > scores[1] ? "A" : "B"}
          onClose={() => setShowMatchEnd(false)}
        />
      )}
      {/* Alert */}
      {alert && (
        <div style={{
          background: "#f0fdf4", borderBottom: "2px solid #22c55e",
          padding: "10px", textAlign: "center",
          fontSize: 16, fontWeight: 800, color: "#15803d", letterSpacing: 2, flexShrink: 0,
        }}>{alert}</div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0, overflow: "hidden" }}>
        <ScoreCard
          score={scores[0]} color={COLORS[0]} lightBg={LIGHT_BG[0]}
          name={names[0]} limit={limit} side="left" winner={winner}
          onScore={pts => score(0, pts)} onUndo={undo}
          onNameClick={() => setEditing(0)} editing={editing === 0}
          onNameChange={v => { const n = [...names]; n[0] = v; setNames(n); }}
          onNameBlur={() => setEditing(null)}
        />

        {/* Center */}
        <div style={{
          width: 80, flexShrink: 0, background: "#f8f8f8",
          borderLeft: "1px solid #e8e8e8", borderRight: "1px solid #e8e8e8",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <span style={{ fontSize: 11, color: "#ccc", letterSpacing: 3 }}>VS</span>
          <div style={{
            fontSize: 11, color: "#aaa", textAlign: "center", lineHeight: 1.8,
          }}>
            <span style={{ color: COLORS[0], fontWeight: 700 }}>{scores[0]}</span>
            {" — "}
            <span style={{ color: COLORS[1], fontWeight: 700 }}>{scores[1]}</span>
          </div>
          <div style={{ fontSize: 9, color: "#ccc", letterSpacing: 1 }}>
            上限 {limit}
          </div>
        </div>

        <ScoreCard
          score={scores[1]} color={COLORS[1]} lightBg={LIGHT_BG[1]}
          name={names[1]} limit={limit} side="right" winner={winner}
          onScore={pts => score(1, pts)} onUndo={undo}
          onNameClick={() => setEditing(1)} editing={editing === 1}
          onNameChange={v => { const n = [...names]; n[1] = v; setNames(n); }}
          onNameBlur={() => setEditing(null)}
        />
      </div>

      <AdBanner />
    </div>
  );
}

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

// 發球區判斷：分數為偶數從右區發，奇數從左區發
function getServeZone(score) {
  return score % 2 === 0 ? "右區" : "左區";
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

function ScoreCard({ score, color, lightBg, serving, name, onScore, onUndo,
                     onNameClick, editing, onNameChange, onNameBlur,
                     side, mode, serverIdx, players }) {
  const [pressed, setPressed] = useState(false);
  const zone = getServeZone(score);

  const handleScore = () => {
    if (!serving) return; // 非發球方不能得分
    onScore();
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      borderRight: side === "left" ? "3px solid #e0e0e0" : "none",
      borderLeft: side === "right" ? "3px solid #e0e0e0" : "none",
      opacity: serving ? 1 : 0.92,
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

      {/* Serve indicator */}
      <div style={{
        background: serving ? color + "15" : "#f8f8f8",
        borderBottom: "1px solid #e8e8e8",
        padding: "6px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, transition: "background .2s",
      }}>
        {serving ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: color,
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color }}>發球中</span>
            </div>
            <div style={{
              background: color, color: "#fff",
              borderRadius: 6, padding: "2px 10px",
              fontSize: 12, fontWeight: 800, letterSpacing: 1,
            }}>{zone}</div>
            {mode === "doubles" && players && (
              <span style={{ fontSize: 11, color, fontWeight: 600 }}>
                {players[serverIdx]}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 11, color: "#bbb", letterSpacing: 1 }}>接球方</span>
        )}
      </div>

      {/* Big score card */}
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); handleScore(); }}
        onPointerLeave={() => setPressed(false)}
        style={{
          flex: 1,
          background: serving ? lightBg : "#f8f8f8",
          border: serving ? `6px solid ${color}` : "6px solid transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: serving ? "pointer" : "not-allowed",
          transform: pressed && serving ? "scale(.97)" : "scale(1)",
          transition: "transform .1s, background .2s, border .2s",
          userSelect: "none",
          position: "relative",
        }}>
        {/* Zone diagram */}
        {serving && (
          <div style={{
            position: "absolute", top: 10,
            left: side === "left" ? 10 : undefined,
            right: side === "right" ? 10 : undefined,
            display: "flex", gap: 3,
          }}>
            {/* Left zone */}
            <div style={{
              width: 24, height: 16, borderRadius: 3,
              background: zone === "左區" ? color : "#e0e0e0",
              transition: "background .2s",
            }} />
            {/* Right zone */}
            <div style={{
              width: 24, height: 16, borderRadius: 3,
              background: zone === "右區" ? color : "#e0e0e0",
              transition: "background .2s",
            }} />
          </div>
        )}

        <span style={{
          fontSize: "22vw",
          fontWeight: 900,
          color: serving ? color : "#ccc",
          fontFamily: "'Courier New', monospace",
          letterSpacing: "-0.05em",
          lineHeight: 1,
          userSelect: "none",
          transition: "color .2s",
        }}>{String(score).padStart(2, "0")}</span>

        {/* Not serving hint */}
        {!serving && (
          <div style={{
            position: "absolute", bottom: 16,
            fontSize: 11, color: "#ccc", letterSpacing: 1,
          }}>非發球方，無法得分</div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 12, padding: "10px 16px", background: "#f8f8f8",
        borderTop: "1px solid #e0e0e0", flexShrink: 0,
      }}>
        <button
          onClick={handleScore}
          disabled={!serving}
          style={{
            padding: "8px 28px", borderRadius: 10, fontSize: 16, fontWeight: 800,
            background: serving ? color : "#e0e0e0",
            border: "none", color: "#fff", cursor: serving ? "pointer" : "not-allowed",
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

export default function Pickleball() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // "singles" | "doubles"
  const [format, setFormat] = useState(null); // "bo1" | "bo3"
  const [names, setNames] = useState(["左方", "右方"]);
  const [players, setPlayers] = useState([["A", "B"], ["C", "D"]]);
  const [editing, setEditing] = useState(null);
  const [setupDone, setSetupDone] = useState(false);

  const winsNeeded = format === "bo3" ? 2 : 1;

  // Game state
  const [scores, setScores] = useState([[0, 0]]);
  const [setWins, setSetWins] = useState([0, 0]);
  const [serving, setServing] = useState(0); // team index
  const [serverIdx, setServerIdx] = useState([0, 0]); // doubles player index
  const [firstServe, setFirstServe] = useState(true); // 第一局第一發只有一次發球權
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
    if (team !== serving) return; // 傳統規則：只有發球方得分

    setHistory(h => [...h, {
      scores: scores.map(r => [...r]),
      serving, serverIdx: [...serverIdx],
      setWins: [...setWins], firstServe,
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
      // Next set — loser serves first
      const loser = w === 0 ? 1 : 0;
      setTimeout(() => {
        setScores(prev => [...prev, [0, 0]]);
        setServing(loser);
        setServerIdx([0, 0]);
        setFirstServe(false);
        showAlert(`第 ${scores.length + 1} 局開始`, 2200);
      }, 1400);
      return;
    }

    setScores(prev => { const n = [...prev]; n[curSet] = [...cur]; return n; });
  };

  // 失分 → 換發球
  const fault = () => {
    if (winner !== null) return;

    setHistory(h => [...h, {
      scores: scores.map(r => [...r]),
      serving, serverIdx: [...serverIdx],
      setWins: [...setWins], firstServe,
    }]);

    const newServerIdx = [...serverIdx];

    if (mode === "doubles") {
      // 雙打：同隊還有另一個人可以發球
      const partner = (serverIdx[serving] + 1) % 2;
      // 第一局開始第一隊只有一次發球權
      if (firstServe) {
        // 直接換對方
        const opp = serving === 0 ? 1 : 0;
        setServing(opp);
        setFirstServe(false);
      } else {
        // 看同隊是否還有人
        if (newServerIdx[serving] === 0) {
          // 還有第二人
          newServerIdx[serving] = 1;
          setServerIdx(newServerIdx);
        } else {
          // 換對方
          const opp = serving === 0 ? 1 : 0;
          newServerIdx[opp] = 0;
          setServerIdx(newServerIdx);
          setServing(opp);
        }
      }
    } else {
      // 單打：直接換對方
      const opp = serving === 0 ? 1 : 0;
      setServing(opp);
    }

    addAlert("發球權移交");
  };

  const addAlert = (msg) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 1500);
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setScores(last.scores);
    setServing(last.serving);
    setServerIdx(last.serverIdx);
    setSetWins(last.setWins);
    setFirstServe(last.firstServe);
    setHistory(h => h.slice(0, -1));
    setAlert(null);
  };

  const reset = () => {
    setSetupDone(false);
    setScores([[0, 0]]);
    setSetWins([0, 0]);
    setServing(0);
    setServerIdx([0, 0]);
    setFirstServe(true);
    setHistory([]);
    setAlert(null);
  };

  // ── Setup ──
  if (!setupDone) {
    return (
      <div style={{
        height: "100vh", background: "#fff",
        fontFamily: "'Inter','Helvetica Neue',sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 20, color: "#222", position: "relative",
      }}>
        <button onClick={() => navigate("/")} style={{
          position: "absolute", top: 16, left: 16,
          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#f0f0f0", border: "1px solid #ddd", color: "#888", cursor: "pointer",
        }}>← 首頁</button>

        <div style={{ fontSize: 36 }}>🏓</div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 4, color: "#111" }}>匹克球計分板</div>

        {/* Mode */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#888", letterSpacing: 2 }}>選擇模式</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ key: "singles", label: "單打" }, { key: "doubles", label: "雙打" }].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)} style={{
                padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: mode === m.key ? COLORS[0] : "#f5f5f5",
                border: `2px solid ${mode === m.key ? COLORS[0] : "#ddd"}`,
                color: mode === m.key ? "#fff" : "#555", cursor: "pointer",
              }}>{m.label}</button>
            ))}
          </div>
        </div>

        {/* Format */}
        {mode && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#888", letterSpacing: 2 }}>選擇賽制</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ key: "bo1", label: "一局決勝" }, { key: "bo3", label: "三局兩勝" }].map(f => (
                <button key={f.key} onClick={() => setFormat(f.key)} style={{
                  padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: format === f.key ? COLORS[1] : "#f5f5f5",
                  border: `2px solid ${format === f.key ? COLORS[1] : "#ddd"}`,
                  color: format === f.key ? "#fff" : "#555", cursor: "pointer",
                }}>{f.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Names */}
        {mode && format && (
          <div style={{ display: "flex", gap: 28 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS[i] }} />
                <input value={names[i]}
                  onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                  placeholder={i === 0 ? "左方名稱" : "右方名稱"}
                  style={{
                    background: "#f8f8f8", border: `1.5px solid ${COLORS[i]}`,
                    borderRadius: 8, color: "#222", fontSize: 14,
                    padding: "8px 14px", outline: "none", textAlign: "center", fontFamily: "inherit",
                  }} />
                {mode === "doubles" && players[i].map((p, j) => (
                  <input key={j} value={p}
                    onChange={e => { const d = players.map(r => [...r]); d[i][j] = e.target.value; setPlayers(d); }}
                    placeholder={`球員 ${j + 1}`}
                    style={{
                      background: "#f8f8f8", border: "1px solid #ddd",
                      borderRadius: 6, color: "#555", fontSize: 13,
                      padding: "6px 12px", outline: "none", textAlign: "center",
                      fontFamily: "inherit", width: 110,
                    }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {mode && format && (
          <button onClick={() => setSetupDone(true)} style={{
            marginTop: 8, padding: "12px 40px", borderRadius: 10,
            background: "#22c55e", border: "none",
            color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: 2,
          }}>開始比賽</button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh", background: "#fff",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", overflow: "hidden",
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
            background: "#f0f0f0", border: "1px solid #ddd", color: "#888", cursor: "pointer",
          }}>← 首頁</button>
          <span style={{ fontSize: 20 }}>🏓</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "#333" }}>匹克球計分板</span>
          <span style={{
            fontSize: 10, background: "#f0f0f0", border: "1px solid #ddd",
            borderRadius: 4, padding: "2px 8px", color: "#888",
          }}>{mode === "doubles" ? "雙打" : "單打"} · {format === "bo3" ? "三局兩勝" : "一局決勝"}</span>
        </div>

        {/* Set wins */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: COLORS[i], fontWeight: 700 }}>{names[i]}</span>
              {format === "bo3" && (
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} style={{
                      width: 13, height: 13, borderRadius: "50%",
                      background: j < setWins[i] ? COLORS[i] : "#eee",
                      border: `1.5px solid ${j < setWins[i] ? COLORS[i] : "#ddd"}`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {format === "bo3" && <span style={{ fontSize: 12, color: "#aaa" }}>第 {curSet + 1} 局</span>}
        </div>

        <button onClick={reset} style={{
          fontSize: 11, padding: "4px 12px", borderRadius: 6,
          background: "#f5f5f5", border: "1px solid #ddd", color: "#888", cursor: "pointer",
        }}>重新設定</button>
        {winner !== null && (
          <button onClick={() => setShowMatchEnd(true)} style={{
            fontSize: 11, padding: "4px 12px", borderRadius: 6,
            background: "#cc000022", border: "1px solid #cc000044",
            color: "#cc0000", cursor: "pointer", marginLeft: 6,
          }}>結束比賽</button>
        )}
      </div>

      {showMatchEnd && (
        <MatchEndModal
          sport="pickleball" mode="匹克球"
          teamA={names[0]} teamB={names[1]}
          scoreA={s0} scoreB={s1}
          winner={s0 > s1 ? "A" : "B"}
          onClose={() => setShowMatchEnd(false)}
        />
      )}
      {/* Alert */}
      {alert && (
        <div style={{
          background: "#f0fdf4", borderBottom: "2px solid #22c55e",
          padding: "8px", textAlign: "center",
          fontSize: 14, fontWeight: 800, color: "#15803d", letterSpacing: 2, flexShrink: 0,
        }}>{alert}</div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <ScoreCard
          score={s0} color={COLORS[0]} lightBg={LIGHT_BG[0]}
          serving={serving === 0} name={names[0]} side="left"
          mode={mode} serverIdx={serverIdx[0]} players={mode === "doubles" ? players[0] : null}
          onScore={() => score(0)} onUndo={undo}
          onNameClick={() => setEditing(0)} editing={editing === 0}
          onNameChange={v => { const n = [...names]; n[0] = v; setNames(n); }}
          onNameBlur={() => setEditing(null)}
        />

        {/* Center */}
        <div style={{
          width: 90, flexShrink: 0, background: "#f8f8f8",
          borderLeft: "1px solid #e8e8e8", borderRight: "1px solid #e8e8e8",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 0",
        }}>
          <span style={{ fontSize: 11, color: "#ccc", letterSpacing: 3 }}>VS</span>

          {/* 失誤換發球按鈕 */}
          <button onClick={fault} style={{
            width: 64, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: "#fee2e2", border: "1.5px solid #fca5a5",
            color: "#dc2626", cursor: "pointer", textAlign: "center", lineHeight: 1.4,
          }}>失誤<br/>換發球</button>

          {/* Set scores */}
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

          {/* 比分讀法提示 */}
          {serving !== null && (
            <div style={{ fontSize: 9, color: "#aaa", textAlign: "center", lineHeight: 1.6, padding: "0 4px" }}>
              {s0}-{s1}<br/>
              <span style={{ color: COLORS[serving] }}>
                {serving === 0 ? names[0] : names[1]}
              </span><br/>發球
            </div>
          )}
        </div>

        <ScoreCard
          score={s1} color={COLORS[1]} lightBg={LIGHT_BG[1]}
          serving={serving === 1} name={names[1]} side="right"
          mode={mode} serverIdx={serverIdx[1]} players={mode === "doubles" ? players[1] : null}
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

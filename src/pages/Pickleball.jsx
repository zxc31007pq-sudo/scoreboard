import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MatchEndModal from "./MatchEndModal";
import sportPickleball from "../assets/icons/sport_pickleball.png";

const AD_H = 56;
const WIN_SCORE = 11;
const COLORS = ["#c2410c", "#1d4ed8"];
const LIGHT_BG = ["#fff3ee", "#eef3ff"];

function calcWinner(a, b, target = WIN_SCORE) {
  const diff = Math.abs(a - b);
  if ((a >= target || b >= target) && diff >= 2) return a > b ? 0 : 1;
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
                     side, mode, serverIdx, players, canScore = serving, showServerName = true }) {
  const [pressed, setPressed] = useState(false);
  const zone = getServeZone(score);

  const handleScore = () => {
    if (!canScore) return; // 發球得分制:非發球方不能得分;落地得分制:兩邊皆可得分
    onScore();
  };

  return (
    <div style={{
      flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto",
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
            {mode === "doubles" && players && showServerName && (
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
          background: canScore ? lightBg : "#f8f8f8",
          border: canScore ? `6px solid ${color}` : "6px solid transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: canScore ? "pointer" : "not-allowed",
          transform: pressed && canScore ? "scale(.97)" : "scale(1)",
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
          fontSize: "min(22vw, 30vh)",
          fontWeight: 900,
          color: canScore ? color : "#ccc",
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: "-0.05em",
          lineHeight: 1,
          userSelect: "none",
          transition: "color .2s",
        }}>{String(score).padStart(2, "0")}</span>

        {/* Not serving hint(僅發球得分制顯示) */}
        {!canScore && (
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
        borderTop: "1px solid #e0e0e0", flexShrink: 0, flexWrap: "wrap", minWidth: 0,
      }}>
        <button
          onClick={handleScore}
          disabled={!canScore}
          style={{
            padding: "8px 28px", borderRadius: 10, fontSize: 16, fontWeight: 800,
            background: canScore ? color : "#e0e0e0",
            border: "none", color: "#fff", cursor: canScore ? "pointer" : "not-allowed",
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
  const [scoringType, setScoringType] = useState(null); // "sideout"(發球得分制) | "rally"(落地得分制)
  const [targetScore, setTargetScore] = useState(null); // 落地得分制專用:11 | 15
  const [names, setNames] = useState(["左方", "右方"]);
  const [players, setPlayers] = useState([["A", "B"], ["C", "D"]]);
  const [editing, setEditing] = useState(null);
  const [setupDone, setSetupDone] = useState(false);
  const [swapped, setSwapped] = useState(false); // 純顯示層級換場,不動任何比分/隊名資料
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);
  const [showAutoSwapPrompt, setShowAutoSwapPrompt] = useState(false);
  const [swapPromptedFor, setSwapPromptedFor] = useState(-1); // 已提示過換場的局數(curSet),避免重複跳出

  const winsNeeded = format === "bo3" ? 2 : 1;
  const winTarget = scoringType === "rally" ? targetScore : WIN_SCORE;
  const readyForNames = mode && format && scoringType && (scoringType === "sideout" || targetScore);

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
  const winner = calcWinner(s0, s1, winTarget);
  const canScore = (team) => scoringType === "rally" ? true : serving === team;
  const leftTeam = swapped ? 1 : 0;
  const rightTeam = swapped ? 0 : 1;

  // 正式規則:打11分全程不換場;打15分,任一方先到8分時換場一次(21分制才是11分,此計分板無21分選項故不適用)
  useEffect(() => {
    if (
      scoringType === "rally" && targetScore === 15 && winner === null &&
      (s0 === 8 || s1 === 8) && swapPromptedFor !== curSet
    ) {
      setShowAutoSwapPrompt(true);
      setSwapPromptedFor(curSet);
    }
  }, [s0, s1, scoringType, targetScore, curSet, winner, swapPromptedFor]);

  const showAlert = (msg, dur = 2800) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), dur);
  };

  const score = (team) => {
    if (winner !== null) return;
    // 發球得分制:只有發球方得分;落地得分制:任一方贏球都能得分,發球權轉移邏輯不受影響
    if (scoringType === "sideout" && team !== serving) return;

    setHistory(h => [...h, {
      scores: scores.map(r => [...r]),
      serving, serverIdx: [...serverIdx],
      setWins: [...setWins], firstServe,
    }]);

    // 落地得分制:贏得這一球的一方立刻取得發球權(正式規則:誰贏球誰發下一球,
    // 沒有側手/失誤的中間狀態)。雙打不做官方版位置輪轉那麼細,換發球時固定從隊內第1位開始。
    if (scoringType === "rally" && team !== serving) {
      setServing(team);
      if (mode === "doubles") {
        setServerIdx(prev => { const n = [...prev]; n[team] = 0; return n; });
      }
    }

    const cur = [...scores[curSet]];
    cur[team]++;

    const w = calcWinner(cur[0], cur[1], winTarget);
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
    setSwapped(false);
    setSwapPromptedFor(-1);
  };

  // 換場:純顯示層級,只改變左右渲染順序,不動任何比分/隊名/發球方資料
  const doSwap = () => {
    setShowSwapConfirm(false);
    setIsSwapping(true);
    setSwapped(s => !s);
    setTimeout(() => setIsSwapping(false), 260);
  };

  // ── Setup ──
  if (!setupDone) {
    return (
      <div style={{
        height: "100vh", background: "#fff",
        fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 20, color: "#222", position: "relative",
        padding: "0 20px", boxSizing: "border-box",
      }}>
        <button onClick={() => navigate("/")} style={{
          position: "absolute", top: 16, left: 16,
          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#f0f0f0", border: "1px solid #ddd", color: "#888", cursor: "pointer",
        }}>← 首頁</button>

        <img src={sportPickleball} alt="匹克球" style={{ width: 40, height: 40, objectFit: "contain" }} />
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

        {/* Scoring type */}
        {mode && format && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#888", letterSpacing: 2 }}>計分方式</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ key: "sideout", label: "發球得分制" }, { key: "rally", label: "落地得分制" }].map(s => (
                <button key={s.key} onClick={() => { setScoringType(s.key); if (s.key === "sideout") setTargetScore(null); }} style={{
                  padding: "11px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: scoringType === s.key ? COLORS[0] : "#f5f5f5",
                  border: `2px solid ${scoringType === s.key ? COLORS[0] : "#ddd"}`,
                  color: scoringType === s.key ? "#fff" : "#555", cursor: "pointer",
                }}>{s.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Target score(僅落地得分制) */}
        {mode && format && scoringType === "rally" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#888", letterSpacing: 2 }}>目標分數</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[11, 15].map(t => (
                <button key={t} onClick={() => setTargetScore(t)} style={{
                  padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: targetScore === t ? COLORS[1] : "#f5f5f5",
                  border: `2px solid ${targetScore === t ? COLORS[1] : "#ddd"}`,
                  color: targetScore === t ? "#fff" : "#555", cursor: "pointer",
                }}>{t} 分</button>
              ))}
            </div>
          </div>
        )}

        {/* Names */}
        {readyForNames && (
          <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 340, minWidth: 0 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS[i] }} />
                <input value={names[i]}
                  onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                  placeholder={i === 0 ? "左方名稱" : "右方名稱"}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#f8f8f8", border: `1.5px solid ${COLORS[i]}`,
                    borderRadius: 8, color: "#222", fontSize: 14,
                    padding: "8px 10px", outline: "none", textAlign: "center", fontFamily: "inherit",
                  }} />
                {mode === "doubles" && players[i].map((p, j) => (
                  <input key={j} value={p}
                    onChange={e => { const d = players.map(r => [...r]); d[i][j] = e.target.value; setPlayers(d); }}
                    placeholder={`球員 ${j + 1}`}
                    style={{
                      width: "100%", maxWidth: 110, boxSizing: "border-box",
                      background: "#f8f8f8", border: "1px solid #ddd",
                      borderRadius: 6, color: "#555", fontSize: 13,
                      padding: "6px 8px", outline: "none", textAlign: "center",
                      fontFamily: "inherit",
                    }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {readyForNames && (
          <button onClick={() => setSetupDone(true)} style={{
            marginTop: 8, padding: "12px 40px", borderRadius: 10,
            background: "#22c55e", border: "none",
            color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: 2,
          }}>開始比賽</button>
        )}

        <button onClick={() => navigate("/quick-record?sport=pickleball" + (mode ? "&mode=" + encodeURIComponent(mode === "doubles" ? "雙打" : "單打") : ""))} style={{
          background: "none", border: "none", color: "#aaa", fontSize: 12,
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

      {/* HEADER */}
      <div style={{
        minHeight: 46, flexShrink: 0, background: "#fff",
        borderBottom: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", rowGap: 6, columnGap: 8,
        padding: "8px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flexWrap: "wrap", rowGap: 4 }}>
          <button onClick={() => navigate("/")} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: "#f0f0f0", border: "1px solid #ddd", color: "#888", cursor: "pointer",
          }}>← 首頁</button>
          <span style={{ fontSize: 20 }}>🏓</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "#333" }}>匹克球計分板</span>
          <span style={{
            fontSize: 10, background: "#f0f0f0", border: "1px solid #ddd",
            borderRadius: 4, padding: "2px 8px", color: "#888",
          }}>{mode === "doubles" ? "雙打" : "單打"} · {format === "bo3" ? "三局兩勝" : "一局決勝"} · {scoringType === "rally" ? `落地得分制(${targetScore}分)` : "發球得分制"}</span>
        </div>

        {/* Set wins(依換場順序顯示,跟下方比分卡片位置對齊) */}
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", rowGap: 4, minWidth: 0 }}>
          {(swapped ? [1, 0] : [0, 1]).map(i => (
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

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={reset} style={{
            fontSize: 11, padding: "4px 12px", borderRadius: 6,
            background: "#f5f5f5", border: "1px solid #ddd", color: "#888", cursor: "pointer",
          }}>重新設定</button>
          {winner !== null && (
            <button onClick={() => setShowMatchEnd(true)} style={{
              fontSize: 11, padding: "4px 12px", borderRadius: 6,
              background: "#cc000022", border: "1px solid #cc000044",
              color: "#cc0000", cursor: "pointer",
            }}>結束比賽</button>
          )}
        </div>
      </div>

      {/* 換場確認彈窗 */}
      {showSwapConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 250, padding: 16,
        }}>
          <div style={{
            width: "100%", maxWidth: 320,
            background: "#fff", borderRadius: 20, padding: "24px 20px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#222" }}>確定要換場嗎？</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowSwapConfirm(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#f5f5f5", border: "1px solid #ddd",
                color: "#888", fontSize: 13, cursor: "pointer",
              }}>取消</button>
              <button onClick={doSwap} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: COLORS[1], border: "none",
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
              }}>確認</button>
            </div>
          </div>
        </div>
      )}

      {/* 自動換場提示(依正式規則:15分制任一方先到8分時提示換場一次) */}
      {showAutoSwapPrompt && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 250, padding: 16,
        }}>
          <div style={{
            width: "100%", maxWidth: 320,
            background: "#fff", borderRadius: 20, padding: "24px 20px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#222", marginBottom: 4 }}>已有一方先達到8分</div>
              <div style={{ fontSize: 12, color: "#888" }}>依規則此時建議換場一次,要換場嗎？</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAutoSwapPrompt(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#f5f5f5", border: "1px solid #ddd",
                color: "#888", fontSize: 13, cursor: "pointer",
              }}>略過</button>
              <button onClick={() => { doSwap(); setShowAutoSwapPrompt(false); }} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: COLORS[1], border: "none",
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
              }}>換場</button>
            </div>
          </div>
        </div>
      )}

      {showMatchEnd && (
        <MatchEndModal
          sport="pickleball" mode={mode === "doubles" ? "雙打" : "單打"}
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
      <div style={{
        flex: 1, display: "flex", minHeight: 0, minWidth: 0, overflow: "hidden",
        opacity: isSwapping ? 0.3 : 1, transition: "opacity .25s",
      }}>
        <ScoreCard key={leftTeam}
          score={scores[curSet][leftTeam]} color={COLORS[leftTeam]} lightBg={LIGHT_BG[leftTeam]}
          serving={serving === leftTeam} name={names[leftTeam]} side="left"
          mode={mode} serverIdx={serverIdx[leftTeam]} players={mode === "doubles" ? players[leftTeam] : null}
          onScore={() => score(leftTeam)} onUndo={undo}
          onNameClick={() => setEditing(leftTeam)} editing={editing === leftTeam}
          onNameChange={v => { const n = [...names]; n[leftTeam] = v; setNames(n); }}
          onNameBlur={() => setEditing(null)}
          canScore={canScore(leftTeam)}
          showServerName={scoringType !== "rally"}
        />

        {/* Center */}
        <div style={{
          width: 90, flexShrink: 0, background: "#f8f8f8",
          borderLeft: "1px solid #e8e8e8", borderRight: "1px solid #e8e8e8",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 0",
        }}>
          <span style={{ fontSize: 11, color: "#ccc", letterSpacing: 3 }}>VS</span>

          {/* 換場按鈕 */}
          <button onClick={() => setShowSwapConfirm(true)} style={{
            width: 64, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: "#f5f5f5", border: "1.5px solid #ddd",
            color: "#888", cursor: "pointer", textAlign: "center", lineHeight: 1.4,
          }}>🔄<br/>換場</button>

          {/* 失誤換發球按鈕:僅發球得分制顯示,落地得分制沒有「失誤但不得分」這個狀態,
              贏球方已透過 score() 自動取得發球權 */}
          {scoringType !== "rally" && (
            <button onClick={fault} style={{
              width: 64, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: "#fee2e2", border: "1.5px solid #fca5a5",
              color: "#dc2626", cursor: "pointer", textAlign: "center", lineHeight: 1.4,
            }}>失誤<br/>換發球</button>
          )}

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

        <ScoreCard key={rightTeam}
          score={scores[curSet][rightTeam]} color={COLORS[rightTeam]} lightBg={LIGHT_BG[rightTeam]}
          serving={serving === rightTeam} name={names[rightTeam]} side="right"
          mode={mode} serverIdx={serverIdx[rightTeam]} players={mode === "doubles" ? players[rightTeam] : null}
          onScore={() => score(rightTeam)} onUndo={undo}
          onNameClick={() => setEditing(rightTeam)} editing={editing === rightTeam}
          onNameChange={v => { const n = [...names]; n[rightTeam] = v; setNames(n); }}
          onNameBlur={() => setEditing(null)}
          canScore={canScore(rightTeam)}
          showServerName={scoringType !== "rally"}
        />
      </div>

      <AdBanner />
    </div>
  );
}

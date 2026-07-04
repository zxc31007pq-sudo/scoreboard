import { useState } from "react";
import StatsCard from "./StatsCard";

const SPORT_LABELS = { basketball:"籃球", badminton:"羽球", tabletennis:"桌球", pickleball:"匹克球" };
const SPORT_ICONS  = { basketball:"🏀", badminton:"🏸", tabletennis:"🏓", pickleball:"🥒" };
const BASE_URL = "https://scoreboard-neon-nine.vercel.app";

export default function ShareCardModal({ user, records, displayName, onClose }) {
  const [step, setStep] = useState(1); // 1=選球類 2=預覽分享

  // Get unique sports from records
  const availableSports = [...new Set(records.map(r => r.sport))];
  const [selected, setSelected] = useState(availableSports); // default all selected

  const toggleSport = (sport) => {
    setSelected(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  const profileUrl = `${BASE_URL}/profile/${user.uid}?sports=${selected.join(",")}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000dd",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 300, padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: 20, padding: "24px 20px",
        display: "flex", flexDirection: "column", gap: 16,
        maxHeight: "90vh", overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0" }}>
            {step === 1 ? "選擇顯示球類" : "戰績卡預覽"}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#555",
            fontSize: 20, cursor: "pointer", lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Step 1: Sport selection */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 12, color: "#555" }}>
              選擇要在戰績卡上顯示的球類
            </div>

            {availableSports.length === 0 ? (
              <div style={{
                padding: "20px", textAlign: "center",
                background: "#0a0a0a", borderRadius: 12, color: "#555", fontSize: 13,
              }}>
                還沒有比賽紀錄，先去認領比賽吧！
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {availableSports.map(sport => {
                  const sportRecords = records.filter(r => r.sport === sport);
                  const wins = sportRecords.filter(r => r.result === "勝").length;
                  const isSelected = selected.includes(sport);
                  return (
                    <div key={sport} onClick={() => toggleSport(sport)} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                      background: isSelected ? "#cc000018" : "#0a0a0a",
                      border: `1.5px solid ${isSelected ? "#cc0000" : "#1e1e1e"}`,
                      transition: "all .2s",
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: `2px solid ${isSelected ? "#cc0000" : "#333"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {isSelected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#cc0000" }} />}
                      </div>
                      <span style={{ fontSize: 18 }}>{SPORT_ICONS[sport]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>
                          {SPORT_LABELS[sport]}
                        </div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                          {sportRecords.length}場 · {wins}勝 {sportRecords.length - wins}敗
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={selected.length === 0}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 10,
                background: selected.length === 0 ? "#333" : "#cc0000",
                border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
                cursor: selected.length === 0 ? "not-allowed" : "pointer",
              }}>
              下一步：預覽 →
            </button>
          </>
        )}

        {/* Step 2: Preview + Share */}
        {step === 2 && (
          <>
            {/* Card preview */}
            <StatsCard
              name={displayName}
              records={records}
              selectedSports={selected}
            />

            <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>
              截圖後可分享到任何社群媒體
            </div>

            {/* Copy link */}
            <div style={{
              background: "#0a0a0a", borderRadius: 10,
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{
                flex: 1, fontSize: 11, color: "#555",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{profileUrl}</div>
              <button onClick={handleCopy} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: copied ? "#14532d" : "#cc0000",
                border: "none", color: "#fff", cursor: "pointer",
                flexShrink: 0, transition: "background .2s",
              }}>
                {copied ? "✓ 已複製" : "複製連結"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>
              複製後可分享到 LINE・IG・FB・任何地方
            </div>

            <button onClick={() => setStep(1)} style={{
              width: "100%", padding: "8px 0", borderRadius: 10,
              background: "none", border: "1px solid #1e1e1e",
              color: "#555", fontSize: 12, cursor: "pointer",
            }}>← 返回修改</button>
          </>
        )}
      </div>
    </div>
  );
}

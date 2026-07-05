import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createMatch, claimMatch } from "../matchService";
import { auth } from "../firebase";

// QR Code 用 qrcode.react 套件
// 需要安裝: npm install qrcode.react

// 自動偵測目前網域(dev預覽/正式版/本機皆適用),不再寫死正式版網址
const BASE_URL = window.location.origin;

export default function MatchEndModal({ sport, mode, teamA, teamB, scoreA, scoreB, winner, onClose }) {
  const [step, setStep] = useState("end"); // "end" | "qr" | "loading"
  const [matchId, setMatchId] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedSide, setSelectedSide] = useState(null); // 給已登入使用者直接認領用
  const [selfClaimResult, setSelfClaimResult] = useState(null);

  const currentUser = auth.currentUser;
  const claimUrl = matchId ? `${BASE_URL}/claim/${matchId}` : "";

  // 只產生分享連結(不自行認領),給隊友使用
  const handleGenerateLink = async () => {
    setStep("loading");
    setError("");
    try {
      const id = matchId || await createMatch({ sport, mode, teamA, teamB, scoreA, scoreB, winner });
      if (!matchId) setMatchId(id);
      setStep("qr");
    } catch (e) {
      setError("產生連結失敗，請再試一次");
      setStep("end");
    }
  };

  // 已登入使用者直接認領自己的隊伍(不用再另外掃描/點擊連結)
  const handleSelfClaim = async () => {
    if (!selectedSide || !currentUser) return;
    setStep("loading");
    setError("");
    try {
      const id = matchId || await createMatch({ sport, mode, teamA, teamB, scoreA, scoreB, winner });
      if (!matchId) setMatchId(id);
      const result = await claimMatch(id, currentUser.uid, {
        name: currentUser.displayName || "球員",
        side: selectedSide,
      });
      setSelfClaimResult(result);
      setStep("qr");
    } catch (e) {
      setError(e.message || "認領失敗，請再試一次");
      setStep("end");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(claimUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const SPORT_NAMES = {
    basketball:  "🏀 籃球",
    badminton:   "🏸 羽球",
    tabletennis: "🏓 桌球",
    pickleball:  "🥒 匹克球",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: 20, padding: "28px 24px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14, color: "#555" }}>產生比賽連結中...</div>
          </div>
        )}

        {step === "end" && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 8 }}>
                {SPORT_NAMES[sport]} · {mode}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f0", marginBottom: 4 }}>
                比賽結束！
              </div>
            </div>

            {/* Score */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#0a0a0a", borderRadius: 12, padding: "16px",
            }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{teamA}</div>
                <div style={{
                  fontSize: 44, fontWeight: 900,
                  color: winner === "A" ? "#22c55e" : "#f0f0f0",
                  fontFamily: "'Courier New',monospace",
                }}>{scoreA}</div>
                {winner === "A" && <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>🏆 勝</div>}
              </div>
              <div style={{ fontSize: 14, color: "#333", fontWeight: 900, padding: "0 8px" }}>VS</div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{teamB}</div>
                <div style={{
                  fontSize: 44, fontWeight: 900,
                  color: winner === "B" ? "#22c55e" : "#f0f0f0",
                  fontFamily: "'Courier New',monospace",
                }}>{scoreB}</div>
                {winner === "B" && <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>🏆 勝</div>}
              </div>
            </div>

            {error && (
              <div style={{
                background: "#ef444418", border: "1px solid #ef444444",
                borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171",
              }}>{error}</div>
            )}

            {/* 已登入使用者:可以直接認領自己的隊伍,不需另外掃碼/點連結 */}
            {currentUser && (
              <div style={{
                background: "#0a0a0a", borderRadius: 12, padding: "14px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontSize: 11, color: "#555" }}>你是哪一隊？（直接認領）</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ key: "A", label: teamA }, { key: "B", label: teamB }].map(s => (
                    <button key={s.key} onClick={() => setSelectedSide(s.key)} style={{
                      flex: 1, padding: "10px 8px", borderRadius: 8,
                      background: selectedSide === s.key ? "#cc000022" : "#1a1a1a",
                      border: `1.5px solid ${selectedSide === s.key ? "#cc0000" : "#2a2a2a"}`,
                      color: selectedSide === s.key ? "#cc0000" : "#888",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>{s.label}</button>
                  ))}
                </div>
                <button onClick={handleSelfClaim} disabled={!selectedSide} style={{
                  width: "100%", padding: "10px 0", borderRadius: 8,
                  background: selectedSide ? "#22c55e" : "#333",
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 800,
                  cursor: selectedSide ? "pointer" : "not-allowed",
                }}>✅ 直接認領</button>
              </div>
            )}

            <button onClick={handleGenerateLink} style={{
              width: "100%", padding: "12px 0", borderRadius: 10,
              background: "#cc0000", border: "none",
              color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}>
              📲 產生分享連結（給其他球員認領）
            </button>

            <button onClick={onClose} style={{
              width: "100%", padding: "8px 0", borderRadius: 10,
              background: "none", border: "1px solid #1e1e1e",
              color: "#444", fontSize: 12, cursor: "pointer",
            }}>不認領，繼續</button>
          </>
        )}

        {step === "qr" && (
          <>
            {selfClaimResult && (
              <div style={{
                background: selfClaimResult.result === "勝" ? "#14532d33" : "#7f1d1d33",
                border: `1px solid ${selfClaimResult.result === "勝" ? "#22c55e" : "#ef4444"}`,
                borderRadius: 12, padding: "12px 14px", textAlign: "center",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: selfClaimResult.result === "勝" ? "#22c55e" : "#ef4444" }}>
                  你已經認領：{selfClaimResult.result} +{selfClaimResult.pts}積分
                  {selfClaimResult.streak >= 3 && <span style={{ marginLeft: 6, color: "#f97316" }}>🔥{selfClaimResult.streak}連勝</span>}
                </div>
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#f0f0f0", marginBottom: 4 }}>
                📲 {selfClaimResult ? "分享給其他球員" : "認領比賽"}
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>
                球員掃描 QR Code 或點擊連結即可認領
              </div>
              <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>
                連結 3 小時內有效
              </div>
            </div>

            {/* QR Code */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: "16px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <QRCodeSVG
                value={claimUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={false}
              />
              <div style={{ fontSize: 9, color: "#999", wordBreak: "break-all", textAlign: "center", maxWidth: 180 }}>
                {claimUrl}
              </div>
            </div>

            {/* Copy link */}
            <button onClick={handleCopy} style={{
              width: "100%", padding: "11px 0", borderRadius: 10,
              background: copied ? "#14532d" : "#1a1a1a",
              border: `1px solid ${copied ? "#22c55e" : "#2a2a2a"}`,
              color: copied ? "#22c55e" : "#f0f0f0",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "all .2s",
            }}>
              {copied ? "✓ 已複製連結" : "複製分享連結"}
            </button>

            <button onClick={onClose} style={{
              width: "100%", padding: "8px 0", borderRadius: 10,
              background: "none", border: "1px solid #1e1e1e",
              color: "#444", fontSize: 12, cursor: "pointer",
            }}>關閉</button>
          </>
        )}
      </div>
    </div>
  );
}

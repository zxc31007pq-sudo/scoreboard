import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getMatch, claimMatch } from "../matchService";

const SPORT_NAMES = {
  basketball: "🏀 籃球",
  badminton:  "🏸 羽球",
  tabletennis:"🏓 桌球",
  pickleball: "🥒 匹克球",
};

export default function ClaimMatch() {
  const { matchId } = useParams();
  const isLineBrowser = /Line/i.test(navigator.userAgent);
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");
  const [selectedSide, setSelectedSide] = useState(null);
  const [claimResult, setClaimResult] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    // Load match data
    getMatch(matchId).then(m => {
      setMatch(m);
      setLoading(false);
    }).catch(() => {
      setError("找不到這場比賽");
      setLoading(false);
    });

    // Watch auth state
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, [matchId]);

  const handleClaim = async () => {
    if (!selectedSide) { setError("請選擇你是哪一隊"); return; }
    if (!user) { navigate(`/auth?redirect=/claim/${matchId}`); return; }

    setClaiming(true);
    setError("");
    try {
      const result = await claimMatch(matchId, user.uid, {
        name: user.displayName || "球員",
        side: selectedSide,
      });
      setClaimResult(result);
      setClaimed(true);
    } catch (e) {
      setError(e.message);
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh", background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#555", fontSize: 14, fontFamily: "'Inter',sans-serif",
      }}>載入比賽資料...</div>
    );
  }

  if (error && !match) {
    return (
      <div style={{
        height: "100vh", background: "#0a0a0a",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, fontFamily: "'Inter',sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>❌</div>
        <div style={{ fontSize: 16, color: "#f0f0f0", fontWeight: 700 }}>比賽不存在或已過期</div>
        <button onClick={() => navigate("/")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#cc0000",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>回首頁</button>
      </div>
    );
  }

  // Check expiry
  const now = new Date();
  const expires = match?.expiresAt?.toDate ? match.expiresAt.toDate() : new Date(match?.expiresAt);
  const isExpired = now > expires;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: 20, padding: "28px 24px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>

        {claimed ? (
          // Success state
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0", marginBottom: 8 }}>認領成功！</div>
            <div style={{
              fontSize: 32, fontWeight: 900, marginBottom: 8,
              color: claimResult?.result === "勝" ? "#22c55e" : "#ef4444",
            }}>{claimResult?.result}</div>
            <div style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
              +{claimResult?.pts} 積分已加入你的帳號
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => navigate("/player")} style={{
                padding: "10px 24px", borderRadius: 10, background: "#cc0000",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>查看我的紀錄</button>
              <button onClick={() => navigate("/")} style={{
                padding: "10px 24px", borderRadius: 10, background: "#1a1a1a",
                border: "1px solid #2a2a2a", color: "#555", fontSize: 13, cursor: "pointer",
              }}>回首頁</button>
            </div>
          </div>
        ) : (
          <>
            {/* Match info */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
                {SPORT_NAMES[match?.sport]} · {match?.mode}
              </div>
              <div style={{ fontSize: 11, color: "#333", marginBottom: 16 }}>
                {isExpired ? "⚠️ 此比賽連結已過期" : "比賽結果"}
              </div>
            </div>

            {/* Score display */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#0a0a0a", borderRadius: 12, padding: "16px",
            }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{match?.teamA}</div>
                <div style={{
                  fontSize: 48, fontWeight: 900, color: match?.winner === "A" ? "#22c55e" : "#f0f0f0",
                  fontFamily: "'Courier New',monospace",
                }}>{match?.scoreA}</div>
                {match?.winner === "A" && <div style={{ fontSize: 10, color: "#22c55e" }}>勝</div>}
              </div>
              <div style={{ fontSize: 16, color: "#333", fontWeight: 900 }}>VS</div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{match?.teamB}</div>
                <div style={{
                  fontSize: 48, fontWeight: 900, color: match?.winner === "B" ? "#22c55e" : "#f0f0f0",
                  fontFamily: "'Courier New',monospace",
                }}>{match?.scoreB}</div>
                {match?.winner === "B" && <div style={{ fontSize: 10, color: "#22c55e" }}>勝</div>}
              </div>
            </div>

            {!isExpired && (
              <>
                {/* Side selection */}
                <div>
                  <div style={{ fontSize: 12, color: "#555", letterSpacing: 2, marginBottom: 10 }}>
                    你是哪一隊？
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { key: "A", label: match?.teamA },
                      { key: "B", label: match?.teamB },
                    ].map(s => (
                      <button key={s.key} onClick={() => setSelectedSide(s.key)} style={{
                        flex: 1, padding: "12px 8px", borderRadius: 10,
                        background: selectedSide === s.key ? "#cc000022" : "#1a1a1a",
                        border: `2px solid ${selectedSide === s.key ? "#cc0000" : "#2a2a2a"}`,
                        color: selectedSide === s.key ? "#cc0000" : "#555",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}>{s.label}</button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: "#ef444418", border: "1px solid #ef444444",
                    borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171",
                  }}>{error}</div>
                )}

                {/* CTA */}
                {isLineBrowser && (
                  <div style={{
                    background: "#06C75518", border: "1px solid #06C75544",
                    borderRadius: 10, padding: "10px 14px", marginBottom: 4,
                    fontSize: 11, color: "#888", lineHeight: 1.6,
                  }}>
                    ⚠️ 請用 <strong style={{ color: "#f0f0f0" }}>Chrome 或 Safari</strong> 開啟此頁面才能登入認領。<br/>
                    點右下角「⋯」→「用瀏覽器開啟」
                  </div>
                )}
                {user ? (
                  <button onClick={() => { if (!selectedSide) { setError("請選擇你是哪一隊"); return; } setConfirming(true); }} disabled={claiming || !selectedSide} style={{
                    width: "100%", padding: "12px 0", borderRadius: 10,
                    background: claiming || !selectedSide ? "#333" : "#cc0000",
                    border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
                    cursor: claiming || !selectedSide ? "not-allowed" : "pointer",
                  }}>
                    {claiming ? "認領中..." : "認領這場比賽"}
                  </button>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>
                      需要登入才能認領比賽
                    </div>
                    <button onClick={() => navigate(`/auth`)} style={{
                      width: "100%", padding: "12px 0", borderRadius: 10,
                      background: "#cc0000", border: "none",
                      color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    }}>登入 / 註冊</button>
                  </div>
                )}
              </>
            )}

            <button onClick={() => navigate("/")} style={{
              width: "100%", padding: "8px 0", borderRadius: 10,
              background: "none", border: "1px solid #1e1e1e",
              color: "#444", fontSize: 12, cursor: "pointer",
            }}>回首頁</button>
          </>
        )}
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 300, padding: 16,
        }}>
          <div style={{
            width: "100%", maxWidth: 360,
            background: "#111", border: "1px solid #1e1e1e",
            borderRadius: 20, padding: "28px 24px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤔</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#f0f0f0", marginBottom: 4 }}>確認認領</div>
              <div style={{ fontSize: 12, color: "#555" }}>請確認以下資訊正確</div>
            </div>

            <div style={{
              background: "#0a0a0a", borderRadius: 12, padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#555" }}>你的隊伍</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>
                  {selectedSide === "A" ? match?.teamA : match?.teamB}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#555" }}>比賽結果</span>
                <span style={{ fontSize: 13, fontWeight: 800,
                  color: match?.winner === selectedSide ? "#22c55e" : "#ef4444"
                }}>
                  {match?.winner === selectedSide ? "🏆 勝" : "敗"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#555" }}>積分</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>
                  +{match?.winner === selectedSide ? 10 : 3}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#444", textAlign: "center", lineHeight: 1.6 }}>
              認領後 3 小時內可修改隊伍選擇
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirming(false)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                color: "#555", fontSize: 13, cursor: "pointer",
              }}>返回修改</button>
              <button onClick={() => { setConfirming(false); handleClaim(); }} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#cc0000", border: "none",
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
              }}>確認認領</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createMatch } from "../matchService";
import sportBasketball  from "../assets/icons/sport_basketball.png";
import sportBadminton   from "../assets/icons/sport_badminton.png";
import sportTabletennis from "../assets/icons/sport_tabletennis.png";
import sportPickleball  from "../assets/icons/sport_pickleball.png";

// 快速計分模式:跳過即時計分,直接輸入比賽最終結果,建立比賽後導向認領頁
// 各球類的 mode 字串與分數語意,必須跟對應計分板傳給 MatchEndModal 的值完全一致:
//   籃球 5v5/3v3 → 最終比分;桌球(mode固定"桌球")/羽球(單打/雙打) → 局數比;匹克球(單打/雙打) → 最終比分
const SPORT_CONFIG = {
  basketball:  { icon: sportBasketball,  name: "籃球",   modes: ["5v5", "3v3"],  scoreType: "score", defaults: ["主隊", "客隊"] },
  badminton:   { icon: sportBadminton,   name: "羽球",   modes: ["單打", "雙打"], scoreType: "sets",  defaults: ["左隊", "右隊"] },
  tabletennis: { icon: sportTabletennis, name: "桌球",   modes: ["桌球"],         scoreType: "sets",  defaults: ["左方", "右方"] },
  pickleball:  { icon: sportPickleball,  name: "匹克球", modes: ["單打", "雙打"], scoreType: "score", defaults: ["左方", "右方"] },
};

export default function QuickRecord() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sport = searchParams.get("sport");
  const cfg = SPORT_CONFIG[sport];

  // mode:路由參數有帶且合法就直接用(不再顯示選擇);只有一種模式的球類自動選定
  const modeParam = searchParams.get("mode");
  const initialMode = cfg
    ? (cfg.modes.includes(modeParam) ? modeParam : (cfg.modes.length === 1 ? cfg.modes[0] : null))
    : null;
  const modeLocked = initialMode !== null && (cfg?.modes.includes(modeParam) || cfg?.modes.length === 1);

  const [mode, setMode] = useState(initialMode);
  const [names, setNames] = useState(cfg ? [...cfg.defaults] : ["", ""]);
  const [scores, setScores] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!cfg) {
    return (
      <div style={{
        height: "100vh", background: "#F8FAFC",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>❓</div>
        <div style={{ fontSize: 16, color: "#0F172A", fontWeight: 700 }}>無效的球類參數</div>
        <button onClick={() => navigate("/")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#2563EB",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>回首頁</button>
      </div>
    );
  }

  const isSets = cfg.scoreType === "sets";
  const a = scores[0] === "" ? NaN : parseInt(scores[0], 10);
  const b = scores[1] === "" ? NaN : parseInt(scores[1], 10);
  const scoresValid = Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0;
  const tied = scoresValid && a === b;
  // 資料正確性優先:平手無法判定勝方,直接擋下,不硬猜
  const canSubmit = mode !== null && scoresValid && !tied && !submitting;
  const winner = scoresValid && !tied ? (a > b ? "A" : "B") : null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const id = await createMatch({
        sport, mode,
        teamA: names[0].trim() || cfg.defaults[0],
        teamB: names[1].trim() || cfg.defaults[1],
        scoreA: a, scoreB: b, winner,
        source: "quick",
      });
      navigate(`/claim/${id}`);
    } catch {
      setError("建立比賽失敗，請再試一次");
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 20, padding: "28px 24px",
        display: "flex", flexDirection: "column", gap: 18,
      }}>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <img src={cfg.icon} alt={cfg.name} style={{ width: 40, height: 40, objectFit: "contain", marginBottom: 6 }} />
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
            快速計分{modeLocked ? ` · ${cfg.name}${mode !== cfg.name ? ` ${mode}` : ""}` : ` · ${cfg.name}`}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
            直接輸入比賽結果，不用一分一分計
          </div>
        </div>

        {/* Mode selection(路由未帶模式時才顯示) */}
        {!modeLocked && (
          <div>
            <div style={{ fontSize: 11, color: "#64748B", letterSpacing: 2, marginBottom: 8 }}>選擇模式</div>
            <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
              {cfg.modes.map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex: 1, minWidth: 0, padding: "11px 8px", borderRadius: 10,
                  background: mode === m ? "#2563EB22" : "#F1F5F9",
                  border: `2px solid ${mode === m ? "#2563EB" : "#CBD5E1"}`,
                  color: mode === m ? "#2563EB" : "#64748B",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>{m}</button>
              ))}
            </div>
          </div>
        )}

        {/* Team names */}
        <div>
          <div style={{ fontSize: 11, color: "#64748B", letterSpacing: 2, marginBottom: 8 }}>隊伍名稱</div>
          <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
            {[0, 1].map(i => (
              <input key={i} value={names[i]}
                onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                placeholder={cfg.defaults[i]}
                style={{
                  flex: 1, minWidth: 0, background: "#F1F5F9", border: "1px solid #CBD5E1",
                  borderRadius: 10, color: "#0F172A", fontSize: 14,
                  padding: "10px 12px", outline: "none", textAlign: "center",
                  fontFamily: "inherit",
                }} />
            ))}
          </div>
        </div>

        {/* Score input */}
        <div>
          <div style={{ fontSize: 11, color: "#64748B", letterSpacing: 2, marginBottom: 8 }}>
            {isSets ? "輸入局數比（各贏幾局）" : "輸入最終比分"}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, justifyContent: "center",
            background: "#F8FAFC", borderRadius: 12, padding: "16px", minWidth: 0,
          }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, color: "#64748B", maxWidth: "100%",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{names[i].trim() || cfg.defaults[i]}</div>
                <input
                  type="number" min="0" max={isSets ? 9 : 999}
                  inputMode="numeric"
                  value={scores[i]}
                  onChange={e => { const s = [...scores]; s[i] = e.target.value; setScores(s); }}
                  placeholder="0"
                  style={{
                    width: "100%", maxWidth: 96, background: "#F1F5F9",
                    border: `2px solid ${winner === (i === 0 ? "A" : "B") ? "#22c55e" : "#CBD5E1"}`,
                    borderRadius: 10, color: "#0F172A",
                    fontSize: 36, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif",
                    padding: "6px 0", outline: "none", textAlign: "center",
                  }} />
              </div>
            ))}
          </div>
          {winner && (
            <div style={{ fontSize: 12, color: "#22c55e", textAlign: "center", marginTop: 8, fontWeight: 700 }}>
              🏆 獲勝：{(winner === "A" ? names[0] : names[1]).trim() || cfg.defaults[winner === "A" ? 0 : 1]}
            </div>
          )}
          {tied && (
            <div style={{ fontSize: 12, color: "#f87171", textAlign: "center", marginTop: 8 }}>
              平手無法建立紀錄，請確認{isSets ? "局數" : "比分"}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "#ef444418", border: "1px solid #ef444444",
            borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
          }}>{error}</div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          width: "100%", padding: "13px 0", borderRadius: 10,
          background: canSubmit ? "#2563EB" : "#E2E8F0",
          border: "none", color: canSubmit ? "#fff" : "#94A3B8",
          fontSize: 14, fontWeight: 800,
          cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit",
        }}>
          {submitting ? "建立中..." : "建立比賽 → 前往認領"}
        </button>

        <button onClick={() => navigate(-1)} style={{
          width: "100%", padding: "8px 0", borderRadius: 10,
          background: "none", border: "1px solid #E2E8F0",
          color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>← 返回</button>
      </div>
    </div>
  );
}

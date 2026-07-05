import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SPORTS = [
  { id: "basketball", emoji: "🏀", name: "籃球", nameEn: "BASKETBALL", accent: "#cc0000", score: "24", features: ["節次管理", "24秒進攻計時", "犯規記錄", "球權顯示"] },
  { id: "badminton",  emoji: "🏸", name: "羽球", nameEn: "BADMINTON",  accent: "#1d4ed8", score: "21", features: ["單打 / 雙打", "21分制", "發球權", "局數記錄"] },
  { id: "tabletennis",emoji: "🏓", name: "桌球", nameEn: "TABLE TENNIS",accent: "#059669", score: "11", features: ["三局兩勝 / 五局三勝", "11分制", "單打"] },
  { id: "pickleball", emoji: "🥒", name: "匹克球",nameEn: "PICKLEBALL", accent: "#7c3aed", score: "11", features: ["單打 / 雙打", "傳統規則", "發球區提示", "一局 / 三局兩勝"] },
];

function SportCard({ sport, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", background: hovered ? "#1a1a1a" : "#111",
        border: `1.5px solid ${hovered ? sport.accent : "#222"}`,
        borderRadius: 16, padding: "20px 20px 16px", cursor: "pointer",
        transition: "border-color .2s, background .2s, transform .15s",
        transform: hovered ? "translateY(-3px)" : "none",
        overflow: "hidden", display: "flex", flexDirection: "column", gap: 12, minHeight: 180,
      }}>
      <div style={{
        position: "absolute", right: -10, bottom: -16, fontSize: 110, fontWeight: 900,
        fontFamily: "'Courier New', monospace", color: sport.accent, opacity: 0.07,
        lineHeight: 1, pointerEvents: "none", userSelect: "none", letterSpacing: -4,
      }}>{sport.score}</div>
      <span style={{ fontSize: 28, lineHeight: 1 }}>{sport.emoji}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f0", letterSpacing: 1, lineHeight: 1 }}>{sport.name}</div>
        <div style={{ fontSize: 9, color: "#555", letterSpacing: 3, marginTop: 3, fontFamily: "'Courier New', monospace" }}>{sport.nameEn}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
        {sport.features.map(f => (
          <span key={f} style={{ fontSize: 10, color: "#666", background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 6, padding: "2px 8px" }}>{f}</span>
        ))}
      </div>
      {hovered && <div style={{ position: "absolute", bottom: 16, right: 16, fontSize: 18, color: sport.accent, fontWeight: 900 }}>→</div>}
    </div>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("scoreboard"); // "scoreboard" | "player"

  return (
    <div style={{
      minHeight: "100vh", background: "#0e0e0e",
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      color: "#f5f5f5", display: "flex", flexDirection: "column",
    }}>

      {/* NAV */}
      <nav style={{
        height: 52, flexShrink: 0, borderBottom: "1px solid #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", background: "#0e0e0e",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: "#cc0000",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff", fontFamily: "'Courier New', monospace",
          }}>S</div>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: "#f5f5f5" }}>SCOREBOARD</span>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "#1a1a1a", borderRadius: 10,
          padding: 3, gap: 2,
        }}>
          {[
            { key: "scoreboard", label: "⚡ 計分板" },
            { key: "player",     label: "👤 球員版" },
          ].map(t => (
            <button key={t.key} onClick={() => t.key === "player" ? navigate("/player") : setTab(t.key)} style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: tab === t.key ? "#cc0000" : "transparent",
              border: "none", color: tab === t.key ? "#fff" : "#555",
              cursor: "pointer", letterSpacing: 1, transition: "all .2s",
            }}>{t.label}</button>
          ))}
        </div>

        <span style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>FREE VERSION</span>
      </nav>

      {/* HERO */}
      <div style={{
        padding: "48px 28px 40px", borderBottom: "1px solid #141414",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, right: 28,
          fontSize: "clamp(80px, 18vw, 180px)", fontWeight: 900,
          fontFamily: "'Courier New', monospace", color: "#cc0000", opacity: 0.05,
          lineHeight: 1, pointerEvents: "none", userSelect: "none", letterSpacing: -8,
        }}>00 VS 00</div>

        <h1 style={{
          fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.1,
          color: "#f5f5f5", margin: "0 0 14px", letterSpacing: -1,
        }}>
          每一場對決，都值得被記錄。<br/>
          <span style={{ color: "#cc0000" }}>現在就揪朋友，開始比賽！</span>
        </h1>
        <p style={{ fontSize: 14, color: "#555", margin: 0, maxWidth: 400, lineHeight: 1.7 }}>
          認領比賽，建立個人戰績、勝率與歷史紀錄。
        </p>
      </div>

      {/* SPORT GRID */}
      <div style={{
        flex: 1, padding: "28px 28px 24px",
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14, alignContent: "start",
      }}>
        {SPORTS.map(sport => (
          <SportCard key={sport.id} sport={sport}
            onClick={() => navigate(sport.id === "basketball" ? "/basketball-select" : `/${sport.id}`)} />
        ))}
      </div>

      {/* Player version banner */}
      <div onClick={() => navigate("/player")} style={{
        margin: "0 28px 28px",
        background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
        border: "1px solid #2a2a2a", borderRadius: 14,
        padding: "18px 24px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "border-color .2s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#cc0000"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "#cc000022",
            border: "1px solid #cc000044",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>👤</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f0", marginBottom: 4 }}>球員版</div>
            <div style={{ fontSize: 11, color: "#555" }}>紀錄你的每場比賽・段位積分・個人履歷卡</div>
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#333" }}>→</div>
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop: "1px solid #141414", padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>SCOREBOARD © 2026</span>
        <span style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: 1 }}>廣告支援營運</span>
      </div>
    </div>
  );
}

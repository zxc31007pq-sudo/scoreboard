import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SPORTS = [
  {
    id: "basketball",
    emoji: "🏀",
    name: "籃球",
    nameEn: "BASKETBALL",
    accent: "#cc0000",
    score: "24",
    features: ["節次管理", "24秒進攻計時", "犯規記錄", "球權顯示"],
  },
  {
    id: "badminton",
    emoji: "🏸",
    name: "羽球",
    nameEn: "BADMINTON",
    accent: "#1d4ed8",
    score: "21",
    features: ["單打 / 雙打", "21分制", "發球權", "局數記錄"],
  },
];

function SportCard({ sport, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: hovered ? "#1a1a1a" : "#111",
        border: `1.5px solid ${hovered ? sport.accent : "#222"}`,
        borderRadius: 16,
        padding: "20px 20px 16px",
        cursor: "pointer",
        transition: "border-color .2s, background .2s, transform .15s",
        transform: hovered ? "translateY(-3px)" : "none",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 180,
      }}
    >
      {/* Watermark score */}
      <div style={{
        position: "absolute", right: -10, bottom: -16,
        fontSize: 110, fontWeight: 900,
        fontFamily: "'Courier New', monospace",
        color: sport.accent, opacity: 0.07,
        lineHeight: 1, pointerEvents: "none", userSelect: "none",
        letterSpacing: -4,
      }}>{sport.score}</div>

      {/* Top: emoji + free badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{sport.emoji}</span>

      </div>

      {/* Name */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f0", letterSpacing: 1, lineHeight: 1 }}>
          {sport.name}
        </div>
        <div style={{ fontSize: 9, color: "#555", letterSpacing: 3, marginTop: 3, fontFamily: "'Courier New', monospace" }}>
          {sport.nameEn}
        </div>
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
        {sport.features.map(f => (
          <span key={f} style={{
            fontSize: 10, color: "#666",
            background: "#0a0a0a", border: "1px solid #1e1e1e",
            borderRadius: 6, padding: "2px 8px",
          }}>{f}</span>
        ))}
      </div>

      {/* Hover arrow */}
      {hovered && (
        <div style={{
          position: "absolute", bottom: 16, right: 16,
          fontSize: 18, color: sport.accent, fontWeight: 900,
        }}>→</div>
      )}
    </div>
  );
}

function ComingSoonCard() {
  return (
    <div style={{
      border: "1.5px dashed #1e1e1e",
      borderRadius: 16, padding: "20px",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 10, minHeight: 180,
    }}>
      <div style={{ fontSize: 26, color: "#2a2a2a" }}>⋯</div>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#383838" }}>陸續推出</div>
      <div style={{ fontSize: 11, color: "#2a2a2a", textAlign: "center", lineHeight: 1.8 }}>
        排球・桌球<br/>足球・網球
      </div>
    </div>
  );
}

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0e0e",
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      color: "#f5f5f5",
      display: "flex", flexDirection: "column",
    }}>

      {/* NAV */}
      <nav style={{
        height: 52, flexShrink: 0,
        borderBottom: "1px solid #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", background: "#0e0e0e",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: "#cc0000",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff",
            fontFamily: "'Courier New', monospace",
          }}>S</div>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: "#f5f5f5" }}>
            SCOREBOARD
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>FREE VERSION</span>
      </nav>

      {/* HERO */}
      <div style={{
        padding: "48px 28px 40px",
        borderBottom: "1px solid #141414",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, right: 28,
          fontSize: "clamp(80px, 18vw, 180px)",
          fontWeight: 900, fontFamily: "'Courier New', monospace",
          color: "#cc0000", opacity: 0.05,
          lineHeight: 1, pointerEvents: "none", userSelect: "none",
          letterSpacing: -8,
        }}>00 VS 00</div>

        <h1 style={{
          fontSize: "clamp(28px, 5vw, 52px)",
          fontWeight: 900, lineHeight: 1.1,
          color: "#f5f5f5", margin: "0 0 14px",
          letterSpacing: -1,
        }}>
          選一項運動，<br/>
          <span style={{ color: "#cc0000" }}>立刻開始計分</span>
        </h1>

        <p style={{
          fontSize: 14, color: "#555", margin: 0,
          maxWidth: 400, lineHeight: 1.7,
        }}>
          專為現場裁判設計。計分、計時、犯規記錄一次到位，不用安裝 app。
        </p>
      </div>

      {/* SPORT GRID */}
      <div style={{
        flex: 1,
        padding: "28px 28px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14,
        alignContent: "start",
      }}>
        {SPORTS.map(sport => (
          <SportCard key={sport.id} sport={sport} onClick={() => navigate(`/${sport.id}`)} />
        ))}
        <ComingSoonCard />
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop: "1px solid #141414",
        padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>SCOREBOARD © 2026</span>
        <span style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: 1 }}>廣告支援營運</span>
      </div>
    </div>
  );
}

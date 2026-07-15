import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

import sportBasketball  from "../assets/icons/sport_basketball.png";
import sportBadminton   from "../assets/icons/sport_badminton.png";
import sportTabletennis from "../assets/icons/sport_tabletennis.png";
import sportPickleball  from "../assets/icons/sport_pickleball.png";

const SPORTS = [
  { id: "pickleball", icon: sportPickleball, emoji: "🥒", name: "匹克球",nameEn: "PICKLEBALL", accent: "#7c3aed", score: "11", features: ["單打 / 雙打", "傳統規則", "發球區提示", "一局 / 三局兩勝"] },
  { id: "badminton", icon: sportBadminton,  emoji: "🏸", name: "羽球", nameEn: "BADMINTON",  accent: "#1d4ed8", score: "21", features: ["單打 / 雙打", "21分制", "發球權", "局數記錄"] },
  { id: "basketball", icon: sportBasketball, emoji: "🏀", name: "籃球", nameEn: "BASKETBALL", accent: "#2563EB", score: "24", features: ["節次管理", "24秒進攻計時", "犯規記錄", "球權顯示"] },
  { id: "tabletennis", icon: sportTabletennis,emoji: "🏓", name: "桌球", nameEn: "TABLE TENNIS",accent: "#059669", score: "11", features: ["三局兩勝 / 五局三勝", "11分制", "單打"] },
];

function SportCard({ sport, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", background: hovered ? "#F1F5F9" : "#FFFFFF",
        border: `1.5px solid ${hovered ? sport.accent : "#E2E8F0"}`,
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
      <img src={sport.icon} alt={sport.name} style={{ width: 34, height: 34, objectFit: "contain" }} />
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", letterSpacing: 1, lineHeight: 1 }}>{sport.name}</div>
        <div style={{ fontSize: 9, color: "#64748B", letterSpacing: 3, marginTop: 3, fontFamily: "'Courier New', monospace" }}>{sport.nameEn}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
        {sport.features.map(f => (
          <span key={f} style={{ fontSize: 10, color: "#94A3B8", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "2px 8px" }}>{f}</span>
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
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Noto Sans TC', 'Inter', 'Helvetica Neue', sans-serif",
      color: "#0F172A", display: "flex", flexDirection: "column",
    }}>

      {/* NAV */}
      <nav style={{
        height: 52, flexShrink: 0, borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", background: "#F8FAFC",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="KEEGOING" style={{ height: 34, width: "auto" }} />
          <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: 2, color: "#0F172A" }}>KEEGOING</span>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "#F1F5F9", borderRadius: 10,
          padding: 3, gap: 2,
        }}>
          {[
            { key: "scoreboard", label: "⚡ 計分板" },
            { key: "player",     label: "👤 個人" },
          ].map(t => (
            <button key={t.key} onClick={() => t.key === "player" ? navigate("/player") : setTab(t.key)} style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: tab === t.key ? "#2563EB" : "transparent",
              border: "none", color: tab === t.key ? "#fff" : "#64748B",
              cursor: "pointer", letterSpacing: 1, transition: "all .2s",
            }}>{t.label}</button>
          ))}
        </div>

        <span style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 1 }}>FREE VERSION</span>
      </nav>

      {/* HERO */}
      <div style={{
        padding: "48px 28px 40px", borderBottom: "1px solid #CBD5E1",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, right: 28,
          fontSize: "clamp(80px, 18vw, 180px)", fontWeight: 900,
          fontFamily: "'Courier New', monospace", color: "#2563EB", opacity: 0.05,
          lineHeight: 1, pointerEvents: "none", userSelect: "none", letterSpacing: -8,
        }}>00 VS 00</div>

        <h1 style={{
          fontSize: "clamp(28px, 5vw, 52px)", fontWeight: "normal", lineHeight: 1.1,
          color: "#0F172A", margin: "0 0 14px", letterSpacing: -1,
          fontFamily: "'MantouSans', 'Noto Sans TC', sans-serif",
        }}>
          每一場對決，都值得被記錄。<br/>
          <span style={{ color: "#2563EB" }}>現在就揪朋友，開始比賽！</span>
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0, maxWidth: 400, lineHeight: 1.7 }}>
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
        background: "linear-gradient(135deg, #F1F5F9 0%, #FFFFFF 100%)",
        border: "1px solid #CBD5E1", borderRadius: 14,
        padding: "18px 24px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "border-color .2s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#2563EB"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD5E1"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "#2563EB22",
            border: "1px solid #2563EB44",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>👤</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>個人</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>紀錄你的每場比賽・段位積分・個人戰績卡</div>
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#94A3B8" }}>→</div>
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop: "1px solid #CBD5E1", padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 1 }}>KEEGOING © 2026</span>
        <span style={{ fontSize: 10, color: "#CBD5E1", letterSpacing: 1 }}>廣告支援營運</span>
      </div>
    </div>
  );
}

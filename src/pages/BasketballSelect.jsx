import { useNavigate } from "react-router-dom";

export default function BasketballSelect() {
  const navigate = useNavigate();

  return (
    <div style={{
      height: "100vh", width: "100vw", maxWidth: "100vw", background: "#0a0a0a",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column",
      overflowX: "hidden", overflowY: "auto",
    }}>

      {/* Header */}
      <div style={{
        height: 48, flexShrink: 0,
        background: "#0d0d0d", borderBottom: "1px solid #1a1a1a",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
      }}>
        <button onClick={() => navigate("/")} style={{
          padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          color: "#555", cursor: "pointer",
        }}>← 首頁</button>
        <span style={{ fontSize: 20 }}>🏀</span>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: "#cc0000" }}>籃球</span>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 4, marginBottom: 10 }}>
          SELECT MODE
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#f0f0f0", letterSpacing: -1 }}>
          選擇比賽模式
        </div>
      </div>

      {/* Mode cards */}
      <div style={{
        flex: 1, display: "flex", gap: 20, flexWrap: "wrap", minWidth: 0,
        padding: "0 40px 40px", alignItems: "center", justifyContent: "center",
      }}>

        {/* 5v5 card */}
        <ModeCard
          label="5 vs 5"
          sub="標準籃球"
          desc="節次管理・計時器・24秒進攻・犯規記錄"
          color="#cc0000"
          court={<Court5v5 />}
          onClick={() => navigate("/basketball")}
        />

        {/* 3v3 card */}
        <ModeCard
          label="3 vs 3"
          sub="半場籃球"
          desc="11分制・快速比賽・得分即計"
          color="#f97316"
          court={<Court3v3 />}
          onClick={() => navigate("/basketball3v3")}
        />
      </div>

      {/* 快速計分入口:直接輸入結果,頁面內再選 5v5/3v3 */}
      <div style={{ textAlign: "center", padding: "0 16px 28px" }}>
        <button onClick={() => navigate("/quick-record?sport=basketball")} style={{
          background: "none", border: "none", color: "#555", fontSize: 12,
          textDecoration: "underline", cursor: "pointer", fontFamily: "inherit",
        }}>不想一分一分計？直接輸入結果 →</button>
      </div>
    </div>
  );
}

function ModeCard({ label, sub, desc, color, court, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: "1 1 260px", minWidth: 0, maxWidth: 360,
        background: "#111", border: `1.5px solid #222`,
        borderRadius: 20, padding: "28px 24px",
        cursor: "pointer", display: "flex", flexDirection: "column", gap: 16,
        transition: "border-color .2s, transform .15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#222";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Court diagram */}
      <div style={{
        background: "#0a0a0a", borderRadius: 12,
        padding: "20px", display: "flex",
        alignItems: "center", justifyContent: "center",
        height: 160, minWidth: 0, overflow: "hidden",
      }}>
        {court}
      </div>

      {/* Label */}
      <div>
        <div style={{
          fontSize: 32, fontWeight: 900, color: "#f0f0f0",
          letterSpacing: -1, lineHeight: 1,
          fontFamily: "'Courier New', monospace",
        }}>{label}</div>
        <div style={{
          fontSize: 12, color, fontWeight: 700,
          letterSpacing: 2, marginTop: 4,
        }}>{sub}</div>
      </div>

      {/* Features */}
      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
        {desc.split("・").map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, flexShrink: 0 }} />
            {f}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        marginTop: "auto",
        padding: "10px 0", borderRadius: 10,
        background: color + "18", border: `1px solid ${color}44`,
        textAlign: "center", fontSize: 13, fontWeight: 700,
        color, letterSpacing: 1,
      }}>
        開始比賽 →
      </div>
    </div>
  );
}

// Full court diagram for 5v5
function Court5v5() {
  const s = "#1a1a1a"; // stroke
  const a = "#cc000066"; // accent
  return (
    <svg width="200" height="120" viewBox="0 0 200 120" style={{ width: "100%", height: "auto", maxWidth: 200 }}>
      {/* Court outline */}
      <rect x="4" y="4" width="192" height="112" rx="4" fill="none" stroke={s} strokeWidth="1.5" />
      {/* Center line */}
      <line x1="100" y1="4" x2="100" y2="116" stroke={s} strokeWidth="1" />
      {/* Center circle */}
      <circle cx="100" cy="60" r="18" fill="none" stroke={s} strokeWidth="1" />
      {/* Left key */}
      <rect x="4" y="30" width="40" height="60" fill={a} stroke={s} strokeWidth="1" />
      <semicircle />
      <path d="M 44 30 A 20 20 0 0 1 44 90" fill="none" stroke={s} strokeWidth="1" />
      {/* Right key */}
      <rect x="156" y="30" width="40" height="60" fill={a} stroke={s} strokeWidth="1" />
      <path d="M 156 30 A 20 20 0 0 0 156 90" fill="none" stroke={s} strokeWidth="1" />
      {/* Left 3pt */}
      <path d="M 4 15 A 55 55 0 0 1 4 105" fill="none" stroke={s} strokeWidth="1" strokeDasharray="3,2" />
      {/* Right 3pt */}
      <path d="M 196 15 A 55 55 0 0 0 196 105" fill="none" stroke={s} strokeWidth="1" strokeDasharray="3,2" />
      {/* Players left */}
      {[[25,40],[25,80],[55,30],[55,90],[70,60]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#cc0000" opacity="0.8" />
      ))}
      {/* Players right */}
      {[[175,40],[175,80],[145,30],[145,90],[130,60]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#334155" opacity="0.8" />
      ))}
    </svg>
  );
}

// Half court diagram for 3v3
function Court3v3() {
  const s = "#1a1a1a";
  const a = "#f9731622";
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" style={{ width: "100%", height: "auto", maxWidth: 160 }}>
      {/* Half court */}
      <rect x="4" y="4" width="152" height="112" rx="4" fill="none" stroke={s} strokeWidth="1.5" />
      {/* Key */}
      <rect x="4" y="30" width="52" height="60" fill={a} stroke={s} strokeWidth="1" />
      <path d="M 56 30 A 25 25 0 0 1 56 90" fill="none" stroke={s} strokeWidth="1" />
      {/* 3pt arc */}
      <path d="M 4 8 A 75 75 0 0 1 4 112" fill="none" stroke={s} strokeWidth="1" strokeDasharray="3,2" />
      {/* Basket */}
      <circle cx="16" cy="60" r="5" fill="none" stroke="#f97316" strokeWidth="1.5" />
      <line x1="4" y1="60" x2="21" y2="60" stroke="#f97316" strokeWidth="1" />
      {/* Players */}
      {[[80,35],[80,85],[110,60]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#f97316" opacity="0.8" />
      ))}
      {[[40,35],[40,85],[60,60]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#334155" opacity="0.8" />
      ))}
      {/* Half court label */}
      <text x="120" y="115" fontSize="8" fill="#333" textAnchor="middle">半場</text>
    </svg>
  );
}

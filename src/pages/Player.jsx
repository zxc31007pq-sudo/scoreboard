import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Mock data ──
const MOCK_USER = {
  name: "陳小明",
  avatar: null,
  mainSports: ["basketball", "badminton"],
};

const RANK_SYSTEM = [
  { name: "新手",   min: 0,    max: 10,   color: "#94a3b8", emoji: "🆕" },
  { name: "銅牌",   min: 11,   max: 99,   color: "#b45309", emoji: "🥉" },
  { name: "銀牌",   min: 100,  max: 199,  color: "#64748b", emoji: "🥈" },
  { name: "金牌",   min: 200,  max: 499,  color: "#d97706", emoji: "🥇" },
  { name: "鉑金",   min: 500,  max: 799,  color: "#7c3aed", emoji: "💎" },
  { name: "鑽石",   min: 800,  max: 1199, color: "#0ea5e9", emoji: "💠" },
  { name: "大師",   min: 1200, max: Infinity, color: "#cc0000", emoji: "👑" },
];

const MOCK_RANKS = [
  { sport: "籃球", mode: "5v5", pts: 87,  best: "銀牌" },
  { sport: "籃球", mode: "3v3", pts: 45,  best: "銅牌" },
  { sport: "羽球", mode: "單打", pts: 210, best: "金牌" },
  { sport: "匹克球", mode: "單打", pts: 23, best: "銅牌" },
];

const MOCK_RECORDS = [
  { id:1, date:"2026/07/01", sport:"🏀", sportName:"籃球 5v5", opponent:"台大隊",   result:"勝", score:"82:71", pts:10, streak:1, expired:false },
  { id:2, date:"2026/06/28", sport:"🏸", sportName:"羽球 單打", opponent:"李大華",   result:"勝", score:"21:18 21:15", pts:15, streak:2, expired:false },
  { id:3, date:"2026/06/25", sport:"🏸", sportName:"羽球 單打", opponent:"王小明",   result:"勝", score:"21:19 18:21 21:16", pts:15, streak:3, expired:false },
  { id:4, date:"2026/06/20", sport:"🏀", sportName:"籃球 3v3", opponent:"系隊B",    result:"敗", score:"9:11",  pts:3,  streak:0, expired:false },
  { id:5, date:"2026/06/10", sport:"🥒", sportName:"匹克球 單打", opponent:"張三",  result:"勝", score:"11:7",  pts:10, streak:1, expired:true  },
];

const MOCK_ACHIEVEMENTS = [
  { id:"first_win",   emoji:"🏆", name:"首勝",       desc:"贏得第一場比賽",   unlocked:true,  date:"2026/06/10" },
  { id:"streak5",     emoji:"🔥", name:"五連勝",     desc:"同模式連勝 5 場",  unlocked:false, date:null },
  { id:"played10",    emoji:"🎯", name:"十場老將",   desc:"參加 10 場比賽",   unlocked:false, date:null },
];

function getRank(pts) {
  return RANK_SYSTEM.find(r => pts >= r.min && pts <= r.max) || RANK_SYSTEM[0];
}

function RankBadge({ pts, small }) {
  const rank = getRank(pts);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: small ? 4 : 6,
      background: rank.color + "18", border: `1px solid ${rank.color}44`,
      borderRadius: small ? 6 : 8, padding: small ? "2px 8px" : "4px 12px",
    }}>
      <span style={{ fontSize: small ? 12 : 16 }}>{rank.emoji}</span>
      <span style={{ fontSize: small ? 10 : 13, fontWeight: 700, color: rank.color }}>{rank.name}</span>
    </div>
  );
}

function Avatar({ name, size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size/2,
      background: "linear-gradient(135deg, #cc0000, #7c3aed)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 900, color: "#fff", flexShrink: 0,
    }}>{name[0]}</div>
  );
}

// ── Tabs ──
const TABS = [
  { key: "home",    label: "首頁",   icon: "🏠" },
  { key: "records", label: "紀錄",   icon: "📋" },
  { key: "rank",    label: "段位",   icon: "🏅" },
  { key: "profile", label: "個人",   icon: "👤" },
];

export default function Player() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");

  return (
    <div style={{
      height: "100vh", background: "#0a0a0a",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      color: "#f0f0f0", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{
        height: 48, flexShrink: 0, background: "#0d0d0d",
        borderBottom: "1px solid #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <button onClick={() => navigate("/")} style={{
          padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#555", cursor: "pointer",
        }}>← 首頁</button>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: "#f0f0f0" }}>球員版</span>
        <button style={{
          padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#cc000022", border: "1px solid #cc000044", color: "#cc0000", cursor: "pointer",
        }}>登入 / 註冊</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {tab === "home"    && <HomeTab navigate={navigate} />}
        {tab === "records" && <RecordsTab />}
        {tab === "rank"    && <RankTab />}
        {tab === "profile" && <ProfileTab />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        height: 60, flexShrink: 0, background: "#0d0d0d",
        borderTop: "1px solid #1a1a1a",
        display: "flex", alignItems: "center",
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              color: tab === t.key ? "#cc0000" : "#444",
            }}>{t.label}</span>
            {tab === t.key && (
              <div style={{ width: 20, height: 2, background: "#cc0000", borderRadius: 2, marginTop: 1 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Home Tab ──
function HomeTab({ navigate }) {
  const totalGames = MOCK_RECORDS.length;
  const wins = MOCK_RECORDS.filter(r => r.result === "勝").length;
  const totalPts = MOCK_RECORDS.reduce((a, r) => a + r.pts, 0);
  const latestAchievement = MOCK_ACHIEVEMENTS.find(a => a.unlocked);

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Profile card */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 16,
        padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Avatar name={MOCK_USER.name} size={56} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>{MOCK_USER.name}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {MOCK_USER.mainSports.map(s => (
                <span key={s} style={{
                  fontSize: 9, color: "#555", background: "#1a1a1a",
                  border: "1px solid #222", borderRadius: 4, padding: "2px 7px",
                }}>
                  {s === "basketball" ? "🏀 籃球" : s === "badminton" ? "🏸 羽球" : s}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => navigate("/player/share")} style={{
            marginLeft: "auto", padding: "6px 14px", borderRadius: 8,
            background: "#cc000022", border: "1px solid #cc000044",
            color: "#cc0000", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>分享履歷卡</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 0, borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
          {[
            { label: "總場次", value: totalGames },
            { label: "勝場",   value: wins },
            { label: "勝率",   value: `${Math.round(wins/totalGames*100)}%` },
            { label: "總積分", value: totalPts },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center",
              borderRight: i < 3 ? "1px solid #1e1e1e" : "none",
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0", fontFamily: "'Courier New',monospace" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest achievement */}
      {latestAchievement && (
        <div style={{
          background: "#111", border: "1px solid #1e1e1e", borderRadius: 14,
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#d9770622", border: "1px solid #d9770644",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>{latestAchievement.emoji}</div>
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 2 }}>最新解鎖成就</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f0" }}>{latestAchievement.name}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{latestAchievement.desc}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: "#333" }}>{latestAchievement.date}</div>
        </div>
      )}

      {/* Recent records */}
      <div>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, marginBottom: 10 }}>最近比賽</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MOCK_RECORDS.slice(0, 3).map(r => (
            <RecordRow key={r.id} record={r} />
          ))}
        </div>
      </div>

      {/* Login prompt */}
      <div style={{
        background: "#111", border: "1px solid #cc000033", borderRadius: 14,
        padding: "16px", textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 700, marginBottom: 6 }}>
          登入後開始記錄你的比賽
        </div>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 12 }}>
          以上為示範資料，登入後顯示你的真實紀錄
        </div>
        <button style={{
          padding: "8px 28px", borderRadius: 10,
          background: "#cc0000", border: "none",
          color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
        }}>登入 / 註冊（即將開放）</button>
      </div>
    </div>
  );
}

function RecordRow({ record }) {
  return (
    <div style={{
      background: "#111", border: "1px solid #1e1e1e", borderRadius: 10,
      padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
      opacity: record.expired ? 0.5 : 1,
    }}>
      <span style={{ fontSize: 20 }}>{record.sport}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>{record.sportName}</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
          vs {record.opponent} · {record.date}
        </div>
        {record.expired && (
          <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>詳細紀錄已過期</div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontSize: 13, fontWeight: 800,
          color: record.result === "勝" ? "#22c55e" : "#ef4444",
        }}>{record.result}</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>+{record.pts} 積分</div>
      </div>
    </div>
  );
}

// ── Records Tab ──
function RecordsTab() {
  const [filter, setFilter] = useState("全部");
  const filters = ["全部", "🏀 籃球", "🏸 羽球", "🏓 桌球", "🥒 匹克球"];
  const filtered = filter === "全部" ? MOCK_RECORDS : MOCK_RECORDS.filter(r => r.sport === filter[0]);

  return (
    <div style={{ padding: 16 }}>
      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: filter === f ? "#cc0000" : "#1a1a1a",
            border: `1px solid ${filter === f ? "#cc0000" : "#2a2a2a"}`,
            color: filter === f ? "#fff" : "#555",
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(r => <RecordRow key={r.id} record={r} />)}
      </div>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#333" }}>登入後查看所有比賽紀錄</div>
      </div>
    </div>
  );
}

// ── Rank Tab ──
function RankTab() {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, marginBottom: 4 }}>本季段位</div>

      {MOCK_RANKS.map((r, i) => {
        const rank = getRank(r.pts);
        const next = RANK_SYSTEM.find(rs => rs.min > r.pts);
        const progress = next ? (r.pts - rank.min) / (rank.max - rank.min) * 100 : 100;
        return (
          <div key={i} style={{
            background: "#111", border: "1px solid #1e1e1e", borderRadius: 12,
            padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f0" }}>{r.sport} {r.mode}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>生涯最高：{r.best}</div>
              </div>
              <RankBadge pts={r.pts} />
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: "#1e1e1e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: rank.color,
                width: `${Math.min(100, progress)}%`, borderRadius: 2,
                transition: "width .5s",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 9, color: "#444" }}>{r.pts} 積分</span>
              {next && <span style={{ fontSize: 9, color: "#444" }}>下一段位 {next.min} 分</span>}
            </div>
          </div>
        );
      })}

      {/* Season info */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 12,
        padding: "12px 16px", textAlign: "center",
      }}>
        <div style={{ fontSize: 11, color: "#555" }}>本季結束於 <span style={{ color: "#f0f0f0", fontWeight: 700 }}>2026/09/30</span></div>
        <div style={{ fontSize: 10, color: "#333", marginTop: 4 }}>季末重置，歷史最高段位永久保留</div>
      </div>
    </div>
  );
}

// ── Profile Tab ──
function ProfileTab() {
  const [privacy, setPrivacy] = useState("private");

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Avatar & name */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 14,
        padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <Avatar name={MOCK_USER.name} size={72} />
        <div style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>{MOCK_USER.name}</div>
        <button style={{
          padding: "6px 20px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#666", cursor: "pointer",
        }}>編輯個人資料</button>
      </div>

      {/* Privacy */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "16px",
      }}>
        <div style={{ fontSize: 12, color: "#555", letterSpacing: 2, marginBottom: 12 }}>隱私設定</div>
        {[
          { key: "private", label: "完全私人", desc: "只有自己看得到" },
          { key: "friends", label: "朋友可見", desc: "追蹤者才能查看" },
          { key: "public",  label: "完全公開", desc: "任何人都可以搜尋" },
        ].map(p => (
          <div key={p.key} onClick={() => setPrivacy(p.key)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0", borderBottom: "1px solid #1a1a1a", cursor: "pointer",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `2px solid ${privacy === p.key ? "#cc0000" : "#333"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {privacy === p.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#cc0000" }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{p.label}</div>
              <div style={{ fontSize: 11, color: "#555" }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Account */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "16px",
      }}>
        <div style={{ fontSize: 12, color: "#555", letterSpacing: 2, marginBottom: 12 }}>帳號管理</div>
        {[
          { label: "升級 PRO 版", color: "#cc0000" },
          { label: "清除所有比賽紀錄", color: "#ef4444" },
          { label: "刪除帳號", color: "#ef4444" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "12px 0", borderBottom: i < 2 ? "1px solid #1a1a1a" : "none",
            fontSize: 13, fontWeight: 600, color: item.color, cursor: "pointer",
          }}>{item.label}</div>
        ))}
      </div>
    </div>
  );
}

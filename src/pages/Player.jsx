import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const RANK_SYSTEM = [
  { name: "新手",  min: 0,    max: 10,   color: "#94a3b8", emoji: "🆕" },
  { name: "銅牌",  min: 11,   max: 99,   color: "#b45309", emoji: "🥉" },
  { name: "銀牌",  min: 100,  max: 199,  color: "#64748b", emoji: "🥈" },
  { name: "金牌",  min: 200,  max: 499,  color: "#d97706", emoji: "🥇" },
  { name: "鉑金",  min: 500,  max: 799,  color: "#7c3aed", emoji: "💎" },
  { name: "鑽石",  min: 800,  max: 1199, color: "#0ea5e9", emoji: "💠" },
  { name: "大師",  min: 1200, max: Infinity, color: "#cc0000", emoji: "👑" },
];

const MOCK_RECORDS = [
  { id:1, date:"2026/07/01", sport:"🏀", sportName:"籃球 5v5", opponent:"台大隊", result:"勝", pts:10, expired:false },
  { id:2, date:"2026/06/28", sport:"🏸", sportName:"羽球 單打", opponent:"李大華", result:"勝", pts:15, expired:false },
  { id:3, date:"2026/06/20", sport:"🏀", sportName:"籃球 3v3", opponent:"系隊B", result:"敗", pts:3,  expired:false },
];

function getRank(pts) {
  return RANK_SYSTEM.find(r => pts >= r.min && pts <= r.max) || RANK_SYSTEM[0];
}

function Avatar({ name, size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size/2,
      background: "linear-gradient(135deg, #cc0000, #7c3aed)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 900, color: "#fff", flexShrink: 0,
    }}>{name ? name[0].toUpperCase() : "?"}</div>
  );
}

const TABS = [
  { key: "home",    label: "首頁", icon: "🏠" },
  { key: "records", label: "紀錄", icon: "📋" },
  { key: "rank",    label: "段位", icon: "🏅" },
  { key: "profile", label: "個人", icon: "👤" },
];

export default function Player() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);       // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore profile
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Load Firestore profile
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) setProfile(snap.data());

          // Load records
          const rSnap = await getDocs(
            query(collection(db, "users", u.uid, "records"), orderBy("createdAt", "desc"), limit(20))
          );
          setRecords(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("Profile load error:", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh", background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#555", fontSize: 14, fontFamily: "'Inter',sans-serif",
      }}>載入中...</div>
    );
  }

  const displayName = profile?.name || user?.displayName || "球員";

  return (
    <div style={{
      height: "100vh", background: "#0a0a0a",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      color: "#f0f0f0", display: "flex", flexDirection: "column", overflow: "hidden",
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

        {user ? (
          <button onClick={handleSignOut} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#555", cursor: "pointer",
          }}>登出</button>
        ) : (
          <button onClick={() => navigate("/auth")} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: "#cc000022", border: "1px solid #cc000044", color: "#cc0000", cursor: "pointer",
          }}>登入 / 註冊</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {tab === "home"    && <HomeTab user={user} profile={profile} displayName={displayName} records={records} navigate={navigate} />}
        {tab === "records" && <RecordsTab user={user} records={records} navigate={navigate} />}
        {tab === "rank"    && <RankTab user={user} records={records} navigate={navigate} />}
        {tab === "profile" && <ProfileTab user={user} profile={profile} displayName={displayName} onSignOut={handleSignOut} navigate={navigate} />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        height: 60, flexShrink: 0, background: "#0d0d0d",
        borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center",
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: tab === t.key ? "#cc0000" : "#444" }}>{t.label}</span>
            {tab === t.key && <div style={{ width: 20, height: 2, background: "#cc0000", borderRadius: 2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

const SPORT_ICONS = { basketball:"🏀", badminton:"🏸", tabletennis:"🏓", pickleball:"🥒" };

// ── Home Tab ──
function HomeTab({ user, profile, displayName, records, navigate }) {
  const pts = records.reduce((a, r) => a + (r.pts || 0), 0);
  const wins = records.filter(r => r.result === "勝").length;
  const rank = getRank(pts);

  if (!user) {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Guest preview */}
        <div style={{
          background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", marginBottom: 8 }}>球員版</div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 }}>
            記錄你的每場比賽<br/>段位積分・個人履歷卡
          </div>
          <button onClick={() => navigate("/auth")} style={{
            padding: "10px 32px", borderRadius: 10,
            background: "#cc0000", border: "none",
            color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
          }}>登入 / 註冊</button>
        </div>

        {/* Feature preview */}
        {[
          { icon: "🏆", title: "段位積分", desc: "籃球、羽球、匹克球各自獨立段位" },
          { icon: "📊", title: "比賽紀錄", desc: "每場比賽的得分、勝負、積分變化" },
          { icon: "🎖️", title: "個人履歷卡", desc: "分享你的戰績到社群媒體" },
        ].map((f, i) => (
          <div key={i} style={{
            background: "#111", border: "1px solid #1e1e1e", borderRadius: 12,
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile card */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Avatar name={displayName} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>{displayName}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{user.email}</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
              background: rank.color + "18", border: `1px solid ${rank.color}44`,
              borderRadius: 6, padding: "2px 8px",
            }}>
              <span style={{ fontSize: 12 }}>{rank.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: rank.color }}>{rank.name}</span>
            </div>
          </div>
          <button onClick={() => navigate("/auth")} style={{
            padding: "6px 14px", borderRadius: 8,
            background: "#cc000022", border: "1px solid #cc000044",
            color: "#cc0000", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>分享履歷卡</button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
          {[
            { label: "總場次", value: records.length },
            { label: "勝場",   value: wins },
            { label: "勝率",   value: records.length ? Math.round(wins/records.length*100)+"%" : "-%"  },
            { label: "總積分", value: pts },
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

      {/* Recent records */}
      {records.length === 0 ? (
        <div style={{
          background: "#111", border: "1px dashed #1e1e1e", borderRadius: 14,
          padding: "24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>還沒有比賽紀錄</div>
          <div style={{ fontSize: 12, color: "#555" }}>打完比賽後掃 QR Code 認領紀錄</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, marginBottom: 10 }}>最近比賽</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {records.slice(0,3).map(r => <RecordRow key={r.id} record={r} user={user} onUpdate={() => window.location.reload()} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Record Row ──
function RecordRow({ record, user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  const icon = { basketball:"🏀", badminton:"🏸", tabletennis:"🏓", pickleball:"🥒" }[record.sport] || "🏅";
  const date = record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString("zh-TW") : "";

  // Check if within 3 hours (editable)
  const createdAt = record.createdAt?.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
  const editable = record.matchId && (new Date() - createdAt) < 3 * 60 * 60 * 1000;

  const handleUpdate = async (newSide) => {
    setUpdating(true);
    setEditError("");
    try {
      const { updateClaimSide } = await import("../matchService");
      const result = await updateClaimSide(record.matchId, user.uid, newSide);
      setEditing(false);
      onUpdate && onUpdate();
    } catch (e) {
      setEditError(e.message);
    }
    setUpdating(false);
  };

  return (
    <div style={{
      background: "#111", border: "1px solid #1e1e1e", borderRadius: 10,
      padding: "12px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>
            {record.sport === "basketball" ? "籃球" : record.sport === "badminton" ? "羽球" : record.sport === "tabletennis" ? "桌球" : "匹克球"} {record.mode}
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
            vs {record.opponent} · {date}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: record.result === "勝" ? "#22c55e" : "#ef4444" }}>
            {record.result} {record.score}
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>+{record.pts} 積分</div>
        </div>
        {editable && (
          <button onClick={() => setEditing(!editing)} style={{
            padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: "#1a1a1a", border: "1px solid #2a2a2a",
            color: "#555", cursor: "pointer", flexShrink: 0,
          }}>修改</button>
        )}
      </div>

      {editing && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>選擇正確的隊伍：</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["A", "B"].map(side => (
              <button key={side} onClick={() => handleUpdate(side)} disabled={updating} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: record.side === side ? "#cc000022" : "#1a1a1a",
                border: `1px solid ${record.side === side ? "#cc0000" : "#2a2a2a"}`,
                color: record.side === side ? "#cc0000" : "#555",
                cursor: updating ? "not-allowed" : "pointer",
              }}>
                {side === "A" ? "主隊" : "客隊"} {record.side === side ? "（目前）" : ""}
              </button>
            ))}
          </div>
          {editError && <div style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>{editError}</div>}
        </div>
      )}
    </div>
  );
}

// ── Records Tab ──
function RecordsTab({ user, records, navigate }) {
  const [filter, setFilter] = useState("全部");
  const filters = ["全部", "籃球", "羽球", "桌球", "匹克球"];
  const sportMap = { "籃球":"basketball", "羽球":"badminton", "桌球":"tabletennis", "匹克球":"pickleball" };
  const filtered = filter === "全部" ? records : records.filter(r => r.sport === sportMap[filter]);

  if (!user) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 32, margin: "32px 0 12px" }}>📋</div>
        <div style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>登入後查看比賽紀錄</div>
        <button onClick={() => navigate("/auth")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#cc0000",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>登入 / 註冊</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
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
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, color: "#555" }}>還沒有比賽紀錄</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(r => <RecordRow key={r.id} record={r} user={user} onUpdate={() => window.location.reload()} />)}
        </div>
      )}
    </div>
  );
}

// ── Rank Tab ──
function RankTab({ user, records, navigate }) {
  if (!user) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 32, margin: "32px 0 12px" }}>🏅</div>
        <div style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>登入後查看段位</div>
        <button onClick={() => navigate("/auth")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#cc0000",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>登入 / 註冊</button>
      </div>
    );
  }

  // Calculate pts per sport+mode from records
  const calcPts = (sport, mode) =>
    records
      .filter(r => r.sport === sport && r.mode === mode)
      .reduce((sum, r) => sum + (r.pts || 0), 0);

  const modes = [
    { label: "籃球", sport: "basketball", mode: "5v5" },
    { label: "籃球", sport: "basketball", mode: "3v3" },
    { label: "羽球", sport: "badminton",  mode: "單打" },
    { label: "羽球", sport: "badminton",  mode: "雙打" },
    { label: "匹克球", sport: "pickleball", mode: "單打" },
    { label: "匹克球", sport: "pickleball", mode: "雙打" },
    { label: "桌球", sport: "tabletennis", mode: "單打" },
  ].map(m => ({ ...m, pts: calcPts(m.sport, m.mode) }))
   .filter(m => m.pts > 0 || true); // show all modes

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, marginBottom: 4 }}>本季段位</div>
      {modes.map((r, i) => {
        const rank = getRank(r.pts);
        const next = RANK_SYSTEM.find(rs => rs.min > r.pts);
        const progress = next
          ? Math.min(100, ((r.pts - rank.min) / (rank.max - rank.min)) * 100)
          : 100;
        return (
          <div key={i} style={{
            background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f0" }}>{r.label} {r.mode}</div>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: rank.color + "18", border: `1px solid ${rank.color}44`,
                borderRadius: 8, padding: "4px 12px",
              }}>
                <span>{rank.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: rank.color }}>{rank.name}</span>
              </div>
            </div>
            <div style={{ height: 4, background: "#1e1e1e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: rank.color,
                width: `${progress}%`, borderRadius: 2,
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
function ProfileTab({ user, profile, displayName, onSignOut, navigate }) {
  const [privacy, setPrivacy] = useState(profile?.privacy || "private");

  if (!user) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 32, margin: "32px 0 12px" }}>👤</div>
        <div style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>登入後管理個人資料</div>
        <button onClick={() => navigate("/auth")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#cc0000",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>登入 / 註冊</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Avatar & name */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 14,
        padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <Avatar name={displayName} size={72} />
        <div style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>{displayName}</div>
        <div style={{ fontSize: 12, color: "#555" }}>{user.email}</div>
        <div style={{
          fontSize: 10, background: "#cc000022", border: "1px solid #cc000044",
          borderRadius: 4, padding: "2px 8px", color: "#cc0000",
        }}>免費版</div>
      </div>

      {/* Privacy */}
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "16px" }}>
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
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
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
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "16px" }}>
        <div style={{ fontSize: 12, color: "#555", letterSpacing: 2, marginBottom: 12 }}>帳號管理</div>
        <div onClick={onSignOut} style={{
          padding: "12px 0", borderBottom: "1px solid #1a1a1a",
          fontSize: 13, fontWeight: 600, color: "#f0f0f0", cursor: "pointer",
        }}>登出</div>
        <div style={{
          padding: "12px 0", borderBottom: "1px solid #1a1a1a",
          fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer",
        }}>清除所有比賽紀錄</div>
        <div style={{
          padding: "12px 0",
          fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer",
        }}>刪除帳號</div>
      </div>
    </div>
  );
}

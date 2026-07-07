import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { RANK_SYSTEM, getRank, getAllRankData, getNextResetInfo } from "../rankService";
import ShareCardModal from "./ShareCardModal";

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
  const [rankData, setRankData] = useState([]); // users/{uid}/ranks 子集合資料
  const [deleteQuota, setDeleteQuota] = useState({ used: 0, limit: 3, remaining: 3 });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showShareCard, setShowShareCard] = useState(false);

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

          // 讀取段位資料（各球類模式獨立計算，會自動偵測跨季並重置）
          const ranks = await getAllRankData(u.uid);
          setRankData(ranks);

          // 讀取本季刪除額度使用狀況
          const { getDeleteQuotaStatus } = await import("../matchService");
          const quota = await getDeleteQuotaStatus(u.uid);
          setDeleteQuota(quota);
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

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid), { name: nameInput.trim() });
      setProfile(p => ({ ...p, name: nameInput.trim() }));
    } catch (e) { console.error(e); }
    setEditingName(false);
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh", background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#555", fontSize: 14, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>載入中...</div>
    );
  }

  const displayName = profile?.name || user?.displayName || "球員";

  return (
    <div style={{
      height: "100vh", background: "#0a0a0a",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
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

      {showShareCard && user && (
        <ShareCardModal
          user={user}
          records={records}
          displayName={displayName}
          onClose={() => setShowShareCard(false)}
        />
      )}
      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {tab === "home"    && <HomeTab user={user} profile={profile} displayName={displayName} records={records} rankData={rankData} deleteQuota={deleteQuota} navigate={navigate} editingName={editingName} setEditingName={setEditingName} nameInput={nameInput} setNameInput={setNameInput} onSaveName={handleSaveName} onShareCard={() => setShowShareCard(true)} />}
        {tab === "records" && <RecordsTab user={user} records={records} deleteQuota={deleteQuota} navigate={navigate} />}
        {tab === "rank"    && <RankTab user={user} rankData={rankData} navigate={navigate} />}
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
const SPORT_LABELS = { basketball:"籃球", badminton:"羽球", tabletennis:"桌球", pickleball:"匹克球" };


// ── Home Tab ──
function HomeTab({ user, profile, displayName, records, rankData, deleteQuota, navigate, editingName, setEditingName, nameInput, setNameInput, onSaveName, onShareCard }) {
  const [statFilter, setStatFilter] = useState("全部");
  const sportMap = { "全部": null, "籃球": "basketball", "羽球": "badminton", "匹克球": "pickleball", "桌球": "tabletennis" };
  const filteredRecords = statFilter === "全部" ? records : records.filter(r => r.sport === sportMap[statFilter]);
  const pts = records.reduce((a, r) => a + (r.pts || 0), 0);
  const wins = filteredRecords.filter(r => r.result === "勝").length;
  const totalFiltered = filteredRecords.length;

  // 段位是各球類模式獨立計算，首頁徽章顯示「目前所有球類模式中最高的段位」
  const bestRank = rankData.length
    ? rankData.reduce((best, r) => {
        const rk = getRank(r.pts || 0);
        return RANK_SYSTEM.indexOf(rk) > RANK_SYSTEM.indexOf(best) ? rk : best;
      }, RANK_SYSTEM[0])
    : RANK_SYSTEM[0];
  const rank = bestRank;

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
            {editingName ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && onSaveName()}
                  style={{
                    background: "#1a1a1a", border: "1px solid #cc0000",
                    borderRadius: 8, color: "#f0f0f0", fontSize: 15,
                    padding: "4px 10px", outline: "none", flex: 1,
                    fontFamily: "inherit",
                  }}
                />
                <button onClick={onSaveName} style={{
                  padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: "#cc0000", border: "none", color: "#fff", cursor: "pointer",
                }}>儲存</button>
              </div>
            ) : (
              <div onClick={() => { setNameInput(displayName); setEditingName(true); }} style={{
                fontSize: 18, fontWeight: 800, color: "#f0f0f0", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {displayName}
                <span style={{ fontSize: 12, color: "#444" }}>✏</span>
              </div>
            )}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
              background: rank.color + "18", border: `1px solid ${rank.color}44`,
              borderRadius: 6, padding: "2px 8px",
            }}>
              <span style={{ fontSize: 12 }}>{rank.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: rank.color }}>{rank.name}</span>
            </div>
          </div>
          <button onClick={onShareCard} style={{
            padding: "6px 14px", borderRadius: 8,
            background: "#cc000022", border: "1px solid #cc000044",
            color: "#cc0000", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>分享戰績卡</button>
        </div>

        {/* Sport filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {["全部", "籃球", "羽球", "匹克球", "桌球"].map(f => (
            <button key={f} onClick={() => setStatFilter(f)} style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: statFilter === f ? "#cc0000" : "#1a1a1a",
              border: `1px solid ${statFilter === f ? "#cc0000" : "#2a2a2a"}`,
              color: statFilter === f ? "#fff" : "#555", cursor: "pointer",
            }}>{f}</button>
          ))}
        </div>
        {/* Stats */}
        <div style={{ display: "flex", borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
          {[
            { label: "場次", value: totalFiltered },
            { label: "勝場",  value: wins },
            { label: "勝率",  value: totalFiltered ? Math.round(wins/totalFiltered*100)+"%" : "-%"  },
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
            {records.slice(0,3).map(r => <RecordRow key={r.id} record={r} user={user} deleteQuota={deleteQuota} onUpdate={() => window.location.reload()} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Record Row ──
function RecordRow({ record, user, deleteQuota, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");
  const [showDeleteInfo, setShowDeleteInfo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const icon = { basketball:"🏀", badminton:"🏸", tabletennis:"🏓", pickleball:"🥒" }[record.sport] || "🏅";
  const date = record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString("zh-TW") : "";

  // Check if within 3 hours (editable)
  const createdAt = record.createdAt?.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
  const editable = record.matchId && (new Date() - createdAt) < 3 * 60 * 60 * 1000;
  const shareUrl = record.matchId ? `${window.location.origin}/claim/${record.matchId}` : "";

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // 只有段位系統上線後的新格式紀錄(有 rankBefore/rankAfter 快照)才支援刪除
  const deletable = !!(record.rankBefore && record.rankAfter);
  const quotaExhausted = deleteQuota && deleteQuota.remaining <= 0;

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

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const { deleteRecord } = await import("../matchService");
      await deleteRecord(user.uid, record.id);
      onUpdate && onUpdate();
    } catch (e) {
      setDeleteError(e.message);
      setDeleting(false);
    }
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
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {editable && (
            <button onClick={() => setEditing(!editing)} style={{
              padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: "#1a1a1a", border: "1px solid #2a2a2a",
              color: "#555", cursor: "pointer",
            }}>修改</button>
          )}
          {deletable && (
            <button onClick={() => setShowDeleteInfo(true)} style={{
              padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: "#1a1a1a", border: "1px solid #2a2a2a",
              color: "#ef4444", cursor: "pointer",
            }}>刪除</button>
          )}
        </div>
      </div>

      {editable && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1a1a",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 10, color: "#444", flexShrink: 0 }}>📲 分享給隊友（3小時內有效）</span>
          <div style={{
            flex: 1, fontSize: 10, color: "#555",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{shareUrl}</div>
          <button onClick={handleCopyShareLink} style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: linkCopied ? "#14532d" : "#1a1a1a",
            border: `1px solid ${linkCopied ? "#22c55e" : "#2a2a2a"}`,
            color: linkCopied ? "#22c55e" : "#888", cursor: "pointer", flexShrink: 0,
          }}>{linkCopied ? "✓ 已複製" : "複製"}</button>
        </div>
      )}

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

      {/* 刪除說明 + 確認彈窗 */}
      {showDeleteInfo && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 250, padding: 16,
        }}>
          <div style={{
            width: "100%", maxWidth: 360,
            background: "#111", border: "1px solid #1e1e1e",
            borderRadius: 20, padding: "24px 20px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#f0f0f0", marginBottom: 6 }}>確認刪除這場紀錄？</div>
            </div>

            <div style={{
              background: "#0a0a0a", borderRadius: 10, padding: "12px 14px",
              fontSize: 11, color: "#888", lineHeight: 1.8,
            }}>
              • 免費版每季（1/4/7/10月）最多可刪除 <strong style={{ color: "#f0f0f0" }}>{deleteQuota?.limit ?? 3} 場</strong>，本季已使用 <strong style={{ color: "#f0f0f0" }}>{deleteQuota?.used ?? 0}/{deleteQuota?.limit ?? 3}</strong><br/>
              • 只能刪除該模式「最新一筆」紀錄，積分與連勝會正確扣回<br/>
              • 刪除後無法復原，且無法再次認領同一場比賽
            </div>

            {quotaExhausted && (
              <div style={{
                background: "#ef444418", border: "1px solid #ef444444",
                borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
              }}>本季刪除額度已用完</div>
            )}

            {deleteError && (
              <div style={{
                background: "#ef444418", border: "1px solid #ef444444",
                borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
              }}>{deleteError}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowDeleteInfo(false); setDeleteError(""); }} disabled={deleting} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                color: "#555", fontSize: 13, cursor: "pointer",
              }}>取消</button>
              <button onClick={handleDelete} disabled={deleting || quotaExhausted} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: deleting || quotaExhausted ? "#333" : "#ef4444",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 800,
                cursor: deleting || quotaExhausted ? "not-allowed" : "pointer",
              }}>{deleting ? "刪除中..." : "確認刪除"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Records Tab ──
function RecordsTab({ user, records, deleteQuota, navigate }) {
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
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 10,
        padding: "8px 14px", marginBottom: 12, fontSize: 11, color: "#555",
      }}>
        <span>本季刪除額度</span>
        <span style={{ color: (deleteQuota?.remaining ?? 3) <= 0 ? "#ef4444" : "#f0f0f0", fontWeight: 700 }}>
          {deleteQuota?.used ?? 0} / {deleteQuota?.limit ?? 3}
        </span>
      </div>
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
          {filtered.map(r => <RecordRow key={r.id} record={r} user={user} deleteQuota={deleteQuota} onUpdate={() => window.location.reload()} />)}
        </div>
      )}
    </div>
  );
}

// ── Rank Tab ──
// 段位資料現在來自 users/{uid}/ranks 子集合（各球類模式獨立累積，含連勝加成），
// 不再從 records 即時加總計算。
function RankTab({ user, rankData, navigate }) {
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

  // 注意：此對照表的 key 必須跟各計分板實際傳給 MatchEndModal 的 mode 值完全一致
  // (籃球/羽球已依單打雙打/5v5/3v3分開,匹克球已修正為單打/雙打分開;桌球目前僅單打無雙打模式)
  const MODE_LABELS = {
    basketball_5v5:    { label: "籃球",   mode: "5v5" },
    basketball_3v3:    { label: "籃球",   mode: "3v3" },
    badminton_單打:     { label: "羽球",   mode: "單打" },
    badminton_雙打:     { label: "羽球",   mode: "雙打" },
    pickleball_單打:    { label: "匹克球", mode: "單打" },
    pickleball_雙打:    { label: "匹克球", mode: "雙打" },
    tabletennis_桌球:   { label: "桌球",   mode: "桌球" },
  };

  // 顯示所有已知模式，沒打過的顯示 0 分新手
  const modes = Object.entries(MODE_LABELS).map(([key, info]) => {
    const found = rankData.find(r => r.modeKey === key);
    return { key, ...info, pts: found?.pts || 0, streak: found?.streak || 0 };
  });

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, marginBottom: 4 }}>本季段位</div>
      {modes.map((r) => {
        const rank = getRank(r.pts);
        const next = RANK_SYSTEM.find(rs => rs.min > r.pts);
        const progress = next
          ? Math.min(100, ((r.pts - rank.min) / (rank.max - rank.min)) * 100)
          : 100;
        return (
          <div key={r.key} style={{
            background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f0" }}>
                {r.label} {r.mode}
                {r.streak >= 3 && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: "#f97316" }}>🔥{r.streak}連勝</span>
                )}
              </div>
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
        <div style={{ fontSize: 11, color: "#555" }}>本季結束於 <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{
          (() => {
            const { seasonEndDate } = getNextResetInfo();
            return `${seasonEndDate.getFullYear()}/${String(seasonEndDate.getMonth()+1).padStart(2,"0")}/${String(seasonEndDate.getDate()).padStart(2,"0")}`;
          })()
        }</span></div>
        <div style={{ fontSize: 10, color: "#333", marginTop: 4 }}>季末重置，歷史最高段位永久保留</div>
      </div>
    </div>
  );
}

// ── Profile Tab ──
function ProfileTab({ user, profile, displayName, onSignOut, navigate }) {
  const [deleting, setDeleting] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [delError, setDelError] = useState("");

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDelError("");
    try {
      // Re-authenticate with Google first (Firebase requires recent login)
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);

      // Delete all records
      const rSnap = await getDocs(collection(db, "users", user.uid, "records"));
      for (const d of rSnap.docs) {
        await deleteDoc(doc(db, "users", user.uid, "records", d.id));
      }
      // Delete user profile
      await deleteDoc(doc(db, "users", user.uid));
      // Delete auth account
      await deleteUser(user);
      navigate("/");
    } catch (e) {
      if (e.code === "auth/popup-closed-by-user") {
        setDelError("取消刪除");
      } else {
        setDelError(`刪除失敗：${e.message}`);
      }
      setDeleting(false);
    }
  };

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

      {/* Account */}
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "16px" }}>
        <div style={{ fontSize: 12, color: "#555", letterSpacing: 2, marginBottom: 12 }}>帳號管理</div>
        <div onClick={onSignOut} style={{
          padding: "12px 0", borderBottom: "1px solid #1a1a1a",
          fontSize: 13, fontWeight: 600, color: "#f0f0f0", cursor: "pointer",
        }}>登出</div>
        <div onClick={() => setDelConfirm(true)} style={{
          padding: "12px 0",
          fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer",
        }}>刪除帳號</div>
      </div>

      {/* Delete confirm modal */}
      {delConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 16,
        }}>
          <div style={{
            width: "100%", maxWidth: 360,
            background: "#111", border: "1px solid #1e1e1e",
            borderRadius: 20, padding: "28px 24px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#f0f0f0", marginBottom: 6 }}>確認刪除帳號</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
                此操作無法復原。<br/>
                所有比賽紀錄、段位積分將永久刪除。<br/>
                需要重新登入 Google 帳號確認身份。
              </div>
            </div>
            {delError && (
              <div style={{
                background: "#ef444418", border: "1px solid #ef444444",
                borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
              }}>{delError}</div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setDelConfirm(false); setDelError(""); }} disabled={deleting} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                color: "#555", fontSize: 13, cursor: "pointer",
              }}>取消</button>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: deleting ? "#333" : "#ef4444",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 800,
                cursor: deleting ? "not-allowed" : "pointer",
              }}>{deleting ? "刪除中..." : "確認刪除"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

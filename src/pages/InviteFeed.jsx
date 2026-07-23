import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getInvites, LEVEL_OPTIONS, SPORT_NAMES, SPORT_ACCENTS, GENDER_LABELS, TAIWAN_DISTRICTS } from "../inviteService";

import sportBasketball  from "../assets/icons/sport_basketball.png";
import sportBadminton   from "../assets/icons/sport_badminton.png";
import sportTabletennis from "../assets/icons/sport_tabletennis.png";
import sportPickleball  from "../assets/icons/sport_pickleball.png";

const SPORT_IMGS = {
  basketball: sportBasketball, badminton: sportBadminton,
  tabletennis: sportTabletennis, pickleball: sportPickleball,
};

const SPORTS = ["basketball", "badminton", "tabletennis", "pickleball"];
const REGIONS = Object.entries(TAIWAN_DISTRICTS).flatMap(([city, districts]) =>
  districts.map(district => ({ city, district, label: `${city}${district}` }))
);

function InviteCard({ invite, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14,
      padding: "16px", cursor: "pointer", opacity: invite.isFull ? 0.55 : 1,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <img src={SPORT_IMGS[invite.sport]} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{SPORT_NAMES[invite.sport]}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
          background: `${SPORT_ACCENTS[invite.sport]}18`, color: SPORT_ACCENTS[invite.sport],
        }}>{invite.type === "temporary" ? "臨時局" : "預約局"}</span>
        {invite.levelTag && (
          <span style={{ fontSize: 10, color: "#64748B", background: "#F1F5F9", borderRadius: 6, padding: "2px 8px" }}>
            程度 {invite.levelTag}
          </span>
        )}
        {invite.newbieFriendly && (
          <span style={{ fontSize: 10, color: "#059669", background: "#05966918", borderRadius: 6, padding: "2px 8px" }}>
            新手友善
          </span>
        )}
        <span style={{ fontSize: 10, color: "#64748B", background: "#F1F5F9", borderRadius: 6, padding: "2px 8px" }}>
          {GENDER_LABELS[invite.genderRestriction]}
        </span>
        {invite.isFull && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#ef444418", borderRadius: 6, padding: "2px 8px" }}>
            已額滿
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>{invite.city}{invite.district}</div>
      {invite.locationNote && (
        <div style={{ fontSize: 12, color: "#64748B" }}>{invite.locationNote}</div>
      )}
      <div style={{ fontSize: 12, color: "#64748B" }}>
        {invite.date} · {invite.startTime}–{invite.endTime}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>已報名 {invite.participants?.length || 0} 人</span>
        {invite.isFull ? (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#94A3B8",
            background: "#F1F5F9", borderRadius: 8, padding: "5px 12px",
          }}>已額滿</span>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#2563EB",
            background: "#2563EB18", borderRadius: 8, padding: "5px 12px",
          }}>查看詳情 →</span>
        )}
      </div>
    </div>
  );
}

export default function InviteFeed() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined = 尚未確認登入狀態
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sportFilter, setSportFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) navigate("/auth?redirect=/invites");
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const region = REGIONS.find(r => r.label === regionFilter);
    getInvites({
      sport: sportFilter || undefined,
      city: region?.city,
      district: region?.district,
      level: levelFilter || undefined,
    }).then(list => {
      setInvites(list);
      setLoading(false);
    }).catch(() => {
      setError("讀取邀約列表失敗");
      setLoading(false);
    });
  }, [user, sportFilter, regionFilter, levelFilter]);

  useEffect(() => {
    setLevelFilter(""); // 切換球類時重置程度篩選(避免殘留不合法的分級值)
  }, [sportFilter]);

  if (user === undefined || (user && loading && invites.length === 0)) {
    return (
      <div style={{
        height: "100vh", background: "#F8FAFC",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#64748B", fontSize: 14, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>載入中...</div>
    );
  }
  if (!user) return null; // 導向登入頁中

  const levelOptions = sportFilter ? LEVEL_OPTIONS[sportFilter] : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        height: 52, flexShrink: 0, background: "#FFFFFF",
        borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <button onClick={() => navigate(-1)} style={{
          padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#64748B", cursor: "pointer",
        }}>← 返回</button>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, color: "#0F172A" }}>揪打</span>
        <button onClick={() => navigate("/invites/create")} style={{
          padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: "#2563EB", border: "none", color: "#fff", cursor: "pointer",
        }}>+ 發起</button>
      </div>

      {/* Filters */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", minWidth: 0 }}>
          {[{ id: "", name: "全部" }, ...SPORTS.map(s => ({ id: s, name: SPORT_NAMES[s] }))].map(s => (
            <button key={s.id} onClick={() => setSportFilter(s.id)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 8,
              background: sportFilter === s.id ? "#2563EB" : "#FFFFFF",
              border: `1px solid ${sportFilter === s.id ? "#2563EB" : "#E2E8F0"}`,
              color: sportFilter === s.id ? "#fff" : "#64748B",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{s.name}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, minWidth: 0 }}>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{
            flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 8,
            background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A",
            fontSize: 12, fontFamily: "inherit",
          }}>
            <option value="">所有地區</option>
            {REGIONS.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
          </select>

          {levelOptions && (
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{
              flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 8,
              background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A",
              fontSize: 12, fontFamily: "inherit",
            }}>
              <option value="">所有程度</option>
              {levelOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        {error && (
          <div style={{
            background: "#ef444418", border: "1px solid #ef444444",
            borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
          }}>{error}</div>
        )}
        {!loading && invites.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>
            目前沒有符合條件的邀約，發起一個吧！
          </div>
        )}
        {invites.map(inv => (
          <InviteCard key={inv.id} invite={inv} onClick={() => navigate(`/invites/${inv.id}`)} />
        ))}
      </div>
    </div>
  );
}

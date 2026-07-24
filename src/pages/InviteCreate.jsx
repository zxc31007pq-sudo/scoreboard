import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { createInvite, LEVEL_OPTIONS, TAIWAN_DISTRICTS, SPORT_NAMES, MAX_DURATION_MS } from "../inviteService";

import sportBasketball  from "../assets/icons/sport_basketball.png";
import sportBadminton   from "../assets/icons/sport_badminton.png";
import sportTabletennis from "../assets/icons/sport_tabletennis.png";
import sportPickleball  from "../assets/icons/sport_pickleball.png";

const SPORT_IMGS = {
  basketball: sportBasketball, badminton: sportBadminton,
  tabletennis: sportTabletennis, pickleball: sportPickleball,
};
const SPORTS = ["basketball", "badminton", "tabletennis", "pickleball"];
const CITIES = Object.keys(TAIWAN_DISTRICTS);

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function InviteCreate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);

  const [type, setType] = useState("temporary");
  const [sport, setSport] = useState("basketball");
  const [city, setCity] = useState(CITIES[0]);
  const [district, setDistrict] = useState(TAIWAN_DISTRICTS[CITIES[0]][0]);
  const [address, setAddress] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [levelTag, setLevelTag] = useState("");
  const [genderRestriction, setGenderRestriction] = useState("open");
  const [newbieFriendly, setNewbieFriendly] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) navigate("/auth?redirect=/invites/create");
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (type === "temporary") setDate(todayStr());
  }, [type]);

  useEffect(() => {
    setDistrict(TAIWAN_DISTRICTS[city][0]);
  }, [city]);

  useEffect(() => {
    setLevelTag(""); // 切換球類時重置分級選擇
  }, [sport]);

  const levelOptions = LEVEL_OPTIONS[sport];
  const showNewbieFriendly = sport !== "basketball";

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);
  const durationMs = end.getTime() - start.getTime();
  const durationInvalid = !date || durationMs <= 0 || durationMs > MAX_DURATION_MS;

  const canSubmit = !!(date && startTime && endTime && address.trim() && !durationInvalid && !submitting);

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setError("");
    try {
      const id = await createInvite({
        sport, type, city, district,
        address: address.trim(),
        locationNote: locationNote.trim(),
        message: message.trim(),
        date, startTime, endTime,
        levelTag: levelOptions ? (levelTag || null) : null,
        newbieFriendly: showNewbieFriendly && newbieFriendly,
        genderRestriction,
        hostUid: user.uid,
      });
      navigate(`/invites/${id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  if (user === undefined) {
    return (
      <div style={{
        height: "100vh", background: "#F8FAFC",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#64748B", fontSize: 14, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>載入中...</div>
    );
  }
  if (!user) return null;

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "0 0 32px",
    }}>
      <div style={{
        width: "100%", height: 52, flexShrink: 0, background: "#FFFFFF",
        borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{
          padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#64748B", cursor: "pointer",
        }}>← 返回</button>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, color: "#0F172A" }}>發起揪打</span>
        <div style={{ width: 56 }} />
      </div>

      <div style={{
        width: "100%", maxWidth: 480, padding: "16px",
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Type */}
          <div>
            <div style={label}>局的類型</div>
            <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
              {[{ id: "temporary", name: "臨時局" }, { id: "booking", name: "預約局" }].map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  flex: 1, minWidth: 0, padding: "11px 8px", borderRadius: 10,
                  background: type === t.id ? "#2563EB22" : "#F1F5F9",
                  border: `2px solid ${type === t.id ? "#2563EB" : "#CBD5E1"}`,
                  color: type === t.id ? "#2563EB" : "#64748B",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>{t.name}</button>
              ))}
            </div>
          </div>

          {/* Sport */}
          <div>
            <div style={label}>球類</div>
            <div style={{ display: "flex", gap: 8, minWidth: 0 }}>
              {SPORTS.map(s => (
                <button key={s} onClick={() => setSport(s)} style={{
                  flex: 1, minWidth: 0, padding: "10px 4px", borderRadius: 10,
                  background: sport === s ? "#2563EB22" : "#F1F5F9",
                  border: `2px solid ${sport === s ? "#2563EB" : "#CBD5E1"}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  <img src={SPORT_IMGS[s]} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: sport === s ? "#2563EB" : "#64748B" }}>{SPORT_NAMES[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <div style={label}>地點</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, minWidth: 0 }}>
              <select value={city} onChange={e => setCity(e.target.value)} style={selectStyle}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={district} onChange={e => setDistrict(e.target.value)} style={selectStyle}>
                {TAIWAN_DISTRICTS[city].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="明確地址，例如：中山北路二段45號" style={{ ...inputStyle, marginBottom: 8 }} />
            <input value={locationNote} onChange={e => setLocationNote(e.target.value)}
              placeholder="地點備註（選填），例如：地下停車場旁側門進入" style={inputStyle} />
          </div>

          {/* Message to teammates */}
          <div>
            <div style={label}>想跟球友說的話</div>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="跟大家說說這場約打的期待、風格、想找什麼樣的球友⋯⋯（選填）"
              rows={3} style={{ ...inputStyle, resize: "none" }} />
          </div>

          {/* Date & time */}
          <div>
            <div style={label}>{type === "temporary" ? "日期（臨時局固定為今天）" : "日期"}</div>
            <input type="date" value={date} min={type === "booking" ? todayStr() : undefined}
              disabled={type === "temporary"} onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, opacity: type === "temporary" ? 0.6 : 1 }} />
          </div>

          <div>
            <div style={label}>時間區間（最長4小時）</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <span style={{ color: "#94A3B8", fontSize: 12 }}>至</span>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            {durationInvalid && (startTime && endTime) && (
              <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>
                時間區間需大於0且不超過4小時，請重新設定
              </div>
            )}
          </div>

          {/* Level */}
          {levelOptions && (
            <div>
              <div style={label}>程度分級</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {levelOptions.map(l => (
                  <button key={l} onClick={() => setLevelTag(l)} style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: levelTag === l ? "#2563EB" : "#F1F5F9",
                    border: `1px solid ${levelTag === l ? "#2563EB" : "#CBD5E1"}`,
                    color: levelTag === l ? "#fff" : "#64748B",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>{l}</button>
                ))}
              </div>
            </div>
          )}

          {/* Gender restriction */}
          <div>
            <div style={label}>性別限制</div>
            <div style={{ display: "flex", gap: 8, minWidth: 0 }}>
              {[
                { id: "open", name: "男女不拘" },
                { id: "male_only", name: "僅限男生" },
                { id: "female_only", name: "僅限女生" },
              ].map(g => (
                <button key={g.id} onClick={() => setGenderRestriction(g.id)} style={{
                  flex: 1, minWidth: 0, padding: "9px 4px", borderRadius: 8,
                  background: genderRestriction === g.id ? "#2563EB22" : "#F1F5F9",
                  border: `1.5px solid ${genderRestriction === g.id ? "#2563EB" : "#CBD5E1"}`,
                  color: genderRestriction === g.id ? "#2563EB" : "#64748B",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>{g.name}</button>
              ))}
            </div>
          </div>

          {/* Newbie friendly */}
          {showNewbieFriendly && (
            <div onClick={() => setNewbieFriendly(v => !v)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
            }}>
              <div style={label}>新手友善</div>
              <div style={{
                width: 40, height: 22, borderRadius: 11, position: "relative",
                background: newbieFriendly ? "#2563EB" : "#E2E8F0", transition: "background .2s",
              }}>
                <div style={{
                  position: "absolute", top: 2, left: newbieFriendly ? 20 : 2,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  transition: "left .2s",
                }} />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "#ef444418", border: "1px solid #ef444444",
            borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
          }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          width: "100%", padding: "13px 0", borderRadius: 10,
          background: canSubmit ? "#2563EB" : "#E2E8F0",
          border: "none", color: canSubmit ? "#fff" : "#94A3B8",
          fontSize: 14, fontWeight: 800,
          cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit",
        }}>
          {submitting ? "發起中..." : "發起邀約"}
        </button>
      </div>
    </div>
  );
}

const label = { fontSize: 11, color: "#64748B", letterSpacing: 1, marginBottom: 8, fontWeight: 700 };
const inputStyle = {
  width: "100%", background: "#F1F5F9", border: "1px solid #CBD5E1",
  borderRadius: 10, color: "#0F172A", fontSize: 13,
  padding: "10px 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
const selectStyle = { ...inputStyle, flex: 1, minWidth: 0 };

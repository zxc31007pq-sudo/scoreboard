import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import StatsCard from "./StatsCard";

export default function PublicProfile() {
  const { uid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Parse selected sports from URL
  const sportsParam = searchParams.get("sports");
  const selectedSports = sportsParam ? sportsParam.split(",") : null;

  useEffect(() => {
    const load = async () => {
      try {
        const pSnap = await getDoc(doc(db, "users", uid));
        if (!pSnap.exists()) { setError("找不到此用戶"); setLoading(false); return; }
        setProfile(pSnap.data());

        const rSnap = await getDocs(collection(db, "users", uid, "records"));
        setRecords(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        setError("載入失敗");
      }
      setLoading(false);
    };
    load();
  }, [uid]);

  if (loading) {
    return (
      <div style={{
        height: "100vh", background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#555", fontSize: 14, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>載入中...</div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: "100vh", background: "#0a0a0a",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>😢</div>
        <div style={{ fontSize: 16, color: "#f0f0f0" }}>{error}</div>
        <button onClick={() => navigate("/")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#cc0000",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>回首頁</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#070707",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 16px 40px",
    }}>
      {/* Top bar */}
      <div style={{
        width: "100%", maxWidth: 400,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20,
      }}>
        <button onClick={() => navigate("/")} style={{
          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          color: "#555", cursor: "pointer",
        }}>← 首頁</button>
        <span style={{ fontSize: 11, color: "#cc0000", fontWeight: 800, letterSpacing: 3 }}>
          KEEGOING
        </span>
        <div style={{ width: 60 }} />
      </div>

      {/* Stats Card */}
      <div style={{ width: "100%", maxWidth: 400 }}>
        <StatsCard
          name={profile?.name || "球員"}
          records={records}
          selectedSports={selectedSports}
        />
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 24, textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <div style={{ fontSize: 12, color: "#444" }}>截圖後分享到任何地方</div>
        <button onClick={() => navigate("/auth")} style={{
          padding: "10px 28px", borderRadius: 10,
          background: "#cc0000", border: "none",
          color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
        }}>建立我的戰績卡</button>
      </div>
    </div>
  );
}

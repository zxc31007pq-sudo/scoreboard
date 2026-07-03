import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from "firebase/auth";
import { useEffect } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

async function createUserProfile(user, extraData = {}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: extraData.name || user.displayName || "球員",
      email: user.email,
      plan: "free",
      mainSports: [],
      privacy: "private",
      createdAt: serverTimestamp(),
      ...extraData,
    });
  }
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmail = async () => {
    if (!email || !password) { setError("請填寫所有欄位"); return; }
    if (mode === "register" && !name) { setError("請填寫姓名"); return; }
    if (password.length < 6) { setError("密碼至少 6 個字元"); return; }

    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await createUserProfile(cred.user, { name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/player");
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "此 Email 已被註冊",
        "auth/user-not-found": "找不到此帳號",
        "auth/wrong-password": "密碼錯誤",
        "auth/invalid-email": "Email 格式不正確",
        "auth/invalid-credential": "Email 或密碼錯誤",
      };
      setError(msgs[e.code] || "發生錯誤，請再試一次");
    }
    setLoading(false);
  };

  // Handle redirect result on page load
  useEffect(() => {
    getRedirectResult(auth).then(async (cred) => {
      if (cred) {
        await createUserProfile(cred.user);
        navigate("/player");
      }
    }).catch(() => {});
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (e) {
      setError("Google 登入失敗，請再試一次");
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh", background: "#0a0a0a",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 24px",
    }}>

      {/* Back */}
      <button onClick={() => navigate("/")} style={{
        position: "absolute", top: 16, left: 16,
        padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: "#1a1a1a", border: "1px solid #2a2a2a",
        color: "#555", cursor: "pointer",
      }}>← 首頁</button>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: 20, padding: "32px 28px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f0f0f0" }}>
            {mode === "login" ? "登入球員版" : "建立帳號"}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {mode === "login" ? "記錄你的每場比賽" : "免費開始使用，7天試用期"}
          </div>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: "100%", padding: "11px 0", borderRadius: 10,
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          color: "#f0f0f0", fontSize: 13, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>G</span>
          使用 Google 帳號{mode === "login" ? "登入" : "註冊"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          <span style={{ fontSize: 11, color: "#444" }}>或用 Email</span>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
        </div>

        {/* Name (register only) */}
        {mode === "register" && (
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="你的名字"
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 10,
              background: "#1a1a1a", border: "1px solid #2a2a2a",
              color: "#f0f0f0", fontSize: 13, outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }} />
        )}

        {/* Email */}
        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10,
            background: "#1a1a1a", border: "1px solid #2a2a2a",
            color: "#f0f0f0", fontSize: 13, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box",
          }} />

        {/* Password */}
        <input value={password} onChange={e => setPassword(e.target.value)}
          placeholder="密碼（至少 6 個字元）"
          type="password"
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10,
            background: "#1a1a1a", border: "1px solid #2a2a2a",
            color: "#f0f0f0", fontSize: 13, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box",
          }} />

        {/* Error */}
        {error && (
          <div style={{
            background: "#ef444418", border: "1px solid #ef444444",
            borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: "#f87171",
          }}>{error}</div>
        )}

        {/* Submit */}
        <button onClick={handleEmail} disabled={loading} style={{
          width: "100%", padding: "12px 0", borderRadius: 10,
          background: loading ? "#333" : "#cc0000",
          border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer", letterSpacing: 1,
        }}>
          {loading ? "處理中..." : mode === "login" ? "登入" : "建立帳號"}
        </button>

        {/* Switch mode */}
        <div style={{ textAlign: "center", fontSize: 12, color: "#555" }}>
          {mode === "login" ? (
            <>還沒有帳號？<span onClick={() => { setMode("register"); setError(""); }} style={{ color: "#cc0000", cursor: "pointer", fontWeight: 700 }}>建立帳號</span></>
          ) : (
            <>已有帳號？<span onClick={() => { setMode("login"); setError(""); }} style={{ color: "#cc0000", cursor: "pointer", fontWeight: 700 }}>登入</span></>
          )}
        </div>
      </div>
    </div>
  );
}

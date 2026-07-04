import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from "firebase/auth";
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
  const [mode, setMode] = useState("login");

  // Detect LINE browser
  const isLineBrowser = /Line/i.test(navigator.userAgent);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle redirect result
  useEffect(() => {
    setLoading(true);
    getRedirectResult(auth)
      .then(async (cred) => {
        if (cred) {
          await createUserProfile(cred.user);
          navigate("/player");
        }
      })
      .catch((e) => {
        console.error("Redirect error:", e);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEmail = async () => {
    if (!email || !password) { setError("請填寫所有欄位"); return; }
    if (mode === "register" && !name) { setError("請填寫姓名"); return; }
    if (password.length < 6) { setError("密碼至少 6 個字元"); return; }
    setLoading(true); setError("");
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
      setError(msgs[e.code] || `發生錯誤：${e.code}`);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    // 先試 popup，失敗再用 redirect
    try {
      setLoading(true);
      const cred = await signInWithPopup(auth, provider);
      await createUserProfile(cred.user);
      navigate("/player");
    } catch (e) {
      console.error("Popup error:", e.code, e.message);
      if (
        e.code === "auth/popup-blocked" ||
        e.code === "auth/popup-closed-by-user" ||
        e.code === "auth/cancelled-popup-request"
      ) {
        // Fallback to redirect
        try {
          await signInWithRedirect(auth, provider);
        } catch (e2) {
          setError("Google 登入失敗，請使用 Email 註冊");
          setLoading(false);
        }
      } else {
        setError(`Google 登入失敗：${e.code}`);
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      height: "100vh", background: "#0a0a0a",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "0 24px",
    }}>
      <button onClick={() => navigate("/")} style={{
        position: "absolute", top: 16, left: 16,
        padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: "#1a1a1a", border: "1px solid #2a2a2a",
        color: "#555", cursor: "pointer",
      }}>← 首頁</button>

      {isLineBrowser && (
        <div style={{
          width: "100%", maxWidth: 380, marginBottom: 12,
          background: "#06C75518", border: "1px solid #06C75544",
          borderRadius: 12, padding: "12px 16px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>
              請用瀏覽器開啟
            </div>
            <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
              LINE 內建瀏覽器不支援 Google 登入。<br/>
              請點右下角 <strong style={{ color: "#f0f0f0" }}>「⋯」→「用瀏覽器開啟」</strong><br/>
              或複製連結貼到 Chrome / Safari。
            </div>
          </div>
        </div>
      )}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: 20, padding: "32px 28px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f0f0f0" }}>
            {mode === "login" ? "登入球員版" : "建立帳號"}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {mode === "login" ? "記錄你的每場比賽" : "免費開始使用，7天試用期"}
          </div>
        </div>

        <button onClick={handleGoogle} disabled={loading || isLineBrowser} style={{
          width: "100%", padding: "11px 0", borderRadius: 10,
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          color: isLineBrowser ? "#444" : "#f0f0f0", fontSize: 13, fontWeight: 700,
          cursor: isLineBrowser ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>G</span>
          {isLineBrowser ? "Google 登入（請用 Chrome 開啟）" : `使用 Google 帳號${mode === "login" ? "登入" : "註冊"}`}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          <span style={{ fontSize: 11, color: "#444" }}>或用 Email</span>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
        </div>

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

        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email" type="email"
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10,
            background: "#1a1a1a", border: "1px solid #2a2a2a",
            color: "#f0f0f0", fontSize: 13, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box",
          }} />

        <input value={password} onChange={e => setPassword(e.target.value)}
          placeholder="密碼（至少 6 個字元）" type="password"
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10,
            background: "#1a1a1a", border: "1px solid #2a2a2a",
            color: "#f0f0f0", fontSize: 13, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box",
          }} />

        {error && (
          <div style={{
            background: "#ef444418", border: "1px solid #ef444444",
            borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: "#f87171",
          }}>{error}</div>
        )}

        <button onClick={handleEmail} disabled={loading} style={{
          width: "100%", padding: "12px 0", borderRadius: 10,
          background: loading ? "#333" : "#cc0000",
          border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer", letterSpacing: 1,
        }}>
          {loading ? "處理中..." : mode === "login" ? "登入" : "建立帳號"}
        </button>

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

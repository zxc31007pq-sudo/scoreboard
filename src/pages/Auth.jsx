import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

async function createUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || "球員",
      plan: "free",
      mainSports: [],
      privacy: "private",
      createdAt: serverTimestamp(),
    });
  }
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/player";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLineBrowser = /Line/i.test(navigator.userAgent);

  useEffect(() => {
    setLoading(true);
    getRedirectResult(auth)
      .then(async (cred) => {
        if (cred) {
          await createUserProfile(cred.user);
          navigate(redirectTo);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGoogle = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      setLoading(true);
      const cred = await signInWithPopup(auth, provider);
      await createUserProfile(cred.user);
      navigate(redirectTo);
    } catch (e) {
      if (
        e.code === "auth/popup-blocked" ||
        e.code === "auth/popup-closed-by-user" ||
        e.code === "auth/cancelled-popup-request"
      ) {
        try {
          await signInWithRedirect(auth, provider);
        } catch {
          setError("登入失敗，請再試一次");
          setLoading(false);
        }
      } else {
        setError(`登入失敗：${e.code}`);
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      height: "100vh", background: "#0a0a0a",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "0 24px",
    }}>
      <button onClick={() => navigate("/")} style={{
        position: "absolute", top: 16, left: 16,
        padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: "#1a1a1a", border: "1px solid #2a2a2a",
        color: "#555", cursor: "pointer",
      }}>← 首頁</button>

      <div style={{
        width: "100%", maxWidth: 380,
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: 20, padding: "36px 28px",
        display: "flex", flexDirection: "column", gap: 20, alignItems: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0", marginBottom: 6 }}>
            個人
          </div>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
            記錄比賽・段位積分・戰績卡
          </div>
        </div>

        {isLineBrowser && (
          <div style={{
            width: "100%", background: "#06C75518", border: "1px solid #06C75544",
            borderRadius: 12, padding: "12px 16px",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
              LINE 內建瀏覽器不支援 Google 登入。<br/>
              請點右下角 <strong style={{ color: "#f0f0f0" }}>「⋯」→「用瀏覽器開啟」</strong>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            width: "100%", background: "#ef444418", border: "1px solid #ef444444",
            borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
          }}>{error}</div>
        )}

        <button onClick={handleGoogle} disabled={loading || isLineBrowser} style={{
          width: "100%", padding: "14px 0", borderRadius: 12,
          background: loading || isLineBrowser ? "#1a1a1a" : "#fff",
          border: "none",
          color: loading || isLineBrowser ? "#444" : "#333",
          fontSize: 14, fontWeight: 700,
          cursor: loading || isLineBrowser ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          {/* Google G icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading ? "登入中..." : "使用 Google 帳號繼續"}
        </button>

        <div style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.6 }}>
          登入即表示你同意我們的服務條款<br/>首次登入將自動建立帳號
        </div>
      </div>
    </div>
  );
}

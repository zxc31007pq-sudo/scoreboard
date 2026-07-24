import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { ADMIN_EMAILS, getBlacklist, addToBlacklist, removeFromBlacklist } from "../blacklistService";
import { getPendingReports, deleteReportedComment, dismissReport } from "../adminService";

function formatTime(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
  if (!d) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function BlacklistTab({ adminEmail }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBlacklist();
      setList(data);
    } catch {
      setError("讀取黑名單失敗");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const email = newEmail.trim();
    if (!email) return;
    setSubmitting(true);
    setError("");
    try {
      await addToBlacklist(email, newReason.trim(), adminEmail);
      setNewEmail("");
      setNewReason("");
      await load();
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  const handleRemove = async (email) => {
    setRemovingEmail(email);
    setError("");
    try {
      await removeFromBlacklist(email);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setRemovingEmail(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Add form */}
      <div style={{
        background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16,
        padding: "20px", display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>新增黑名單</div>
        <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
          placeholder="要限制的電子信箱" style={{
            width: "100%", background: "#F1F5F9", border: "1px solid #CBD5E1",
            borderRadius: 10, color: "#0F172A", fontSize: 13,
            padding: "10px 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          }} />
        <input value={newReason} onChange={e => setNewReason(e.target.value)}
          placeholder="原因（選填）" style={{
            width: "100%", background: "#F1F5F9", border: "1px solid #CBD5E1",
            borderRadius: 10, color: "#0F172A", fontSize: 13,
            padding: "10px 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          }} />
        <button onClick={handleAdd} disabled={submitting || !newEmail.trim()} style={{
          width: "100%", padding: "11px 0", borderRadius: 10,
          background: submitting || !newEmail.trim() ? "#E2E8F0" : "#ef4444",
          border: "none", color: submitting || !newEmail.trim() ? "#94A3B8" : "#fff",
          fontSize: 13, fontWeight: 800,
          cursor: submitting || !newEmail.trim() ? "not-allowed" : "pointer", fontFamily: "inherit",
        }}>{submitting ? "新增中..." : "新增到黑名單"}</button>
      </div>

      {error && (
        <div style={{
          background: "#ef444418", border: "1px solid #ef444444",
          borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
        }}>{error}</div>
      )}

      {/* List */}
      <div style={{
        background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16,
        padding: "20px", display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>目前黑名單（{list.length}）</div>
        {loading && <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>載入中...</div>}
        {!loading && list.length === 0 && (
          <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>目前沒有被限制的帳號</div>
        )}
        {list.map(item => (
          <div key={item.email} style={{
            borderBottom: "1px solid #F1F5F9", paddingBottom: 10,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", wordBreak: "break-all" }}>{item.email}</div>
              {item.reason && <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>原因：{item.reason}</div>}
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                {formatTime(item.bannedAt)}{item.bannedBy ? ` · 由 ${item.bannedBy} 新增` : ""}
              </div>
            </div>
            <button onClick={() => handleRemove(item.email)} disabled={removingEmail === item.email} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 8,
              background: "#F1F5F9", border: "1px solid #CBD5E1",
              color: "#64748B", fontSize: 12, fontWeight: 700,
              cursor: removingEmail === item.email ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}>{removingEmail === item.email ? "移除中..." : "移除"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // report對象
  const [processingId, setProcessingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingReports();
      setReports(data);
    } catch {
      setError("讀取檢舉紀錄失敗");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (report) => {
    setProcessingId(report.id);
    setError("");
    try {
      await deleteReportedComment(report.inviteId, report.commentId, report.id);
      setReports(list => list.filter(r => r.id !== report.id));
      setConfirmDelete(null);
    } catch {
      setError("刪除留言失敗");
    }
    setProcessingId(null);
  };

  const handleDismiss = async (report) => {
    setProcessingId(report.id);
    setError("");
    try {
      await dismissReport(report.id);
      setReports(list => list.filter(r => r.id !== report.id));
    } catch {
      setError("忽略檢舉失敗");
    }
    setProcessingId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <div style={{
          background: "#ef444418", border: "1px solid #ef444444",
          borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
        }}>{error}</div>
      )}

      <div style={{
        background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16,
        padding: "20px", display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>待處理檢舉（{reports.length}）</div>
        {loading && <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>載入中...</div>}
        {!loading && reports.length === 0 && (
          <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>目前沒有待處理的檢舉</div>
        )}
        {reports.map(r => (
          <div key={r.id} style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{
              background: "#F8FAFC", borderRadius: 10, padding: "10px 12px",
              fontSize: 13, color: "#0F172A", lineHeight: 1.6,
            }}>
              {r.commentAuthor && <div style={{ fontSize: 11, color: "#64748B", marginBottom: 3 }}>留言作者：{r.commentAuthor}</div>}
              <div style={{ fontStyle: r.commentText === "留言已不存在" ? "italic" : "normal", color: r.commentText === "留言已不存在" ? "#94A3B8" : "#0F172A" }}>
                {r.commentText}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#64748B" }}>
              檢舉人：{r.reporterUid}
            </div>
            {r.reason && <div style={{ fontSize: 11, color: "#64748B" }}>檢舉原因：{r.reason}</div>}
            <div style={{ fontSize: 11, color: "#94A3B8" }}>{formatTime(r.createdAt)}</div>

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setConfirmDelete(r)} disabled={processingId === r.id} style={{
                flex: 1, padding: "8px 0", borderRadius: 8,
                background: "#ef4444", border: "none",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: processingId === r.id ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>刪除留言</button>
              <button onClick={() => handleDismiss(r)} disabled={processingId === r.id} style={{
                flex: 1, padding: "8px 0", borderRadius: 8,
                background: "#F1F5F9", border: "1px solid #CBD5E1",
                color: "#64748B", fontSize: 12, fontWeight: 700,
                cursor: processingId === r.id ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>{processingId === r.id ? "處理中..." : "忽略"}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 16,
        }}>
          <div style={{
            width: "100%", maxWidth: 360,
            background: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: 20, padding: "28px 24px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>確認刪除這則留言？</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>此操作無法復原</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#F1F5F9", border: "1px solid #CBD5E1",
                color: "#64748B", fontSize: 13, cursor: "pointer",
              }}>取消</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={processingId === confirmDelete.id} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "#ef4444", border: "none",
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
              }}>{processingId === confirmDelete.id ? "刪除中..." : "確認刪除"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState("blacklist"); // "blacklist" | "reports"

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) navigate("/auth?redirect=/admin");
    });
    return unsub;
  }, [navigate]);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

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

  if (!isAdmin) {
    return (
      <div style={{
        height: "100vh", background: "#F8FAFC",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontSize: 16, color: "#0F172A", fontWeight: 700 }}>沒有權限訪問此頁面</div>
        <button onClick={() => navigate("/")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#2563EB",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>回首頁</button>
      </div>
    );
  }

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
        <button onClick={() => navigate("/")} style={{
          padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#64748B", cursor: "pointer",
        }}>← 首頁</button>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, color: "#0F172A" }}>管理後台</span>
        <div style={{ width: 56 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 560, padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[{ id: "blacklist", name: "黑名單管理" }, { id: "reports", name: "檢舉處理" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 0", borderRadius: 10,
              background: tab === t.id ? "#2563EB" : "#FFFFFF",
              border: `1px solid ${tab === t.id ? "#2563EB" : "#E2E8F0"}`,
              color: tab === t.id ? "#fff" : "#64748B",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{t.name}</button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 560, padding: "0 16px" }}>
        {tab === "blacklist" ? <BlacklistTab adminEmail={user.email} /> : <ReportsTab />}
      </div>
    </div>
  );
}

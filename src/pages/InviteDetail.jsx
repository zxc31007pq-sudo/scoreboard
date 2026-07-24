import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import {
  getInvite, getComments, joinInvite, leaveInvite, toggleFull,
  addComment, reportComment, SPORT_NAMES, SPORT_ACCENTS, GENDER_LABELS,
} from "../inviteService";

import sportBasketball  from "../assets/icons/sport_basketball.png";
import sportBadminton   from "../assets/icons/sport_badminton.png";
import sportTabletennis from "../assets/icons/sport_tabletennis.png";
import sportPickleball  from "../assets/icons/sport_pickleball.png";

const SPORT_IMGS = {
  basketball: sportBasketball, badminton: sportBadminton,
  tabletennis: sportTabletennis, pickleball: sportPickleball,
};

function formatTime(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
  if (!d) return "";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function InviteDetail() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [invite, setInvite] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [joining, setJoining] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // commentId
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) navigate(`/auth?redirect=/invites/${inviteId}`);
    });
    return unsub;
  }, [navigate, inviteId]);

  const load = useCallback(async () => {
    try {
      const [inv, cmts] = await Promise.all([getInvite(inviteId), getComments(inviteId)]);
      if (!inv) { setError("找不到這筆邀約"); setLoading(false); return; }
      setInvite(inv);
      setComments(cmts);
    } catch {
      setError("讀取邀約資料失敗");
    }
    setLoading(false);
  }, [inviteId]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  const handleJoinToggle = async () => {
    if (!user || !invite) return;
    setActionError("");
    setJoining(true);
    try {
      const alreadyIn = invite.participants?.includes(user.uid);
      if (alreadyIn) await leaveInvite(inviteId, user.uid);
      else await joinInvite(inviteId, user.uid);
      await load();
    } catch (e) {
      setActionError(e.message);
    }
    setJoining(false);
  };

  const handleToggleFull = async () => {
    if (!invite) return;
    try {
      await toggleFull(inviteId, !invite.isFull);
      await load();
    } catch {
      setActionError("切換額滿狀態失敗");
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !user) return;
    setPosting(true);
    try {
      await addComment(inviteId, commentText, user);
      setCommentText("");
      await load();
    } catch (e) {
      setActionError(e.message);
    }
    setPosting(false);
  };

  const handleReportSubmit = async () => {
    if (!user || !reportTarget) return;
    try {
      await reportComment(inviteId, reportTarget, user.uid, reportReason);
      setReportSent(true);
    } catch {
      setActionError("送出檢舉失敗");
    }
  };

  const closeReportModal = () => {
    setReportTarget(null);
    setReportReason("");
    setReportSent(false);
  };

  if (user === undefined || loading) {
    return (
      <div style={{
        height: "100vh", background: "#F8FAFC",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#64748B", fontSize: 14, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>載入中...</div>
    );
  }
  if (!user) return null;

  if (error || !invite) {
    return (
      <div style={{
        height: "100vh", background: "#F8FAFC",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, fontFamily: "'Noto Sans TC','Inter',sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>❌</div>
        <div style={{ fontSize: 16, color: "#0F172A", fontWeight: 700 }}>{error || "找不到這筆邀約"}</div>
        <button onClick={() => navigate("/invites")} style={{
          padding: "8px 24px", borderRadius: 10, background: "#2563EB",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>回揪打列表</button>
      </div>
    );
  }

  const isHost = user.uid === invite.hostUid;
  const isJoined = invite.participants?.includes(user.uid);
  const canJoin = !invite.isFull || isJoined;

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 0 32px",
    }}>
      {/* Header */}
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
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, color: "#0F172A" }}>邀約詳情</span>
        <div style={{ width: 56 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 560, padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Main card */}
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16,
          padding: "20px", display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <img src={SPORT_IMGS[invite.sport]} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
            <span style={{ fontSize: 17, fontWeight: 900, color: "#0F172A" }}>{SPORT_NAMES[invite.sport]}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
              background: `${SPORT_ACCENTS[invite.sport]}18`, color: SPORT_ACCENTS[invite.sport],
            }}>{invite.type === "temporary" ? "臨時局" : "預約局"}</span>
            {invite.isFull && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#ef444418", borderRadius: 6, padding: "3px 10px" }}>
                已額滿
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {invite.levelTag && (
              <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", borderRadius: 6, padding: "3px 10px" }}>
                程度 {invite.levelTag}
              </span>
            )}
            {invite.newbieFriendly && (
              <span style={{ fontSize: 11, color: "#059669", background: "#05966918", borderRadius: 6, padding: "3px 10px" }}>
                新手友善
              </span>
            )}
            <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", borderRadius: 6, padding: "3px 10px" }}>
              {GENDER_LABELS[invite.genderRestriction]}
            </span>
          </div>

          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 13, color: "#0F172A" }}>
              📍 {invite.city}{invite.district}{invite.address}
            </div>
            {invite.locationNote && (
              <div style={{ fontSize: 12, color: "#64748B" }}>{invite.locationNote}</div>
            )}
            {invite.message && (
              <div style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.7 }}>{invite.message}</div>
            )}
            <div style={{ fontSize: 13, color: "#0F172A" }}>
              🗓 {invite.date} · {invite.startTime}–{invite.endTime}
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              已報名 {invite.participants?.length || 0} 人
            </div>
          </div>

          {actionError && (
            <div style={{
              background: "#ef444418", border: "1px solid #ef444444",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", textAlign: "center",
            }}>{actionError}</div>
          )}

          <button onClick={handleJoinToggle} disabled={joining || !canJoin} style={{
            width: "100%", padding: "12px 0", borderRadius: 10,
            background: !canJoin ? "#E2E8F0" : isJoined ? "#F1F5F9" : "#2563EB",
            border: isJoined ? "1px solid #CBD5E1" : "none",
            color: !canJoin ? "#94A3B8" : isJoined ? "#64748B" : "#fff",
            fontSize: 14, fontWeight: 800,
            cursor: joining || !canJoin ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
            {!canJoin ? "已額滿" : joining ? "處理中..." : isJoined ? "取消報名" : "我要參加"}
          </button>

          {isHost && (
            <button onClick={handleToggleFull} style={{
              width: "100%", padding: "10px 0", borderRadius: 10,
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              color: "#0F172A", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              {invite.isFull ? "標記為未額滿" : "標記為已額滿"}
            </button>
          )}
        </div>

        {/* Comments */}
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16,
          padding: "20px", display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>留言（{comments.length}）</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.length === 0 && (
              <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>還沒有留言</div>
            )}
            {comments.map(c => (
              <div key={c.id} style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{c.authorName}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{formatTime(c.createdAt)}</span>
                    <button onClick={() => setReportTarget(c.id)} style={{
                      background: "none", border: "none", color: "#94A3B8",
                      fontSize: 10, cursor: "pointer", padding: 0, textDecoration: "underline",
                    }}>檢舉</button>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#0F172A", marginTop: 4, lineHeight: 1.6 }}>{c.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="留言..." style={{
                flex: 1, minWidth: 0, background: "#F1F5F9", border: "1px solid #CBD5E1",
                borderRadius: 10, color: "#0F172A", fontSize: 13,
                padding: "10px 12px", outline: "none", fontFamily: "inherit",
              }} />
            <button onClick={handlePostComment} disabled={posting || !commentText.trim()} style={{
              padding: "0 18px", borderRadius: 10,
              background: posting || !commentText.trim() ? "#E2E8F0" : "#2563EB",
              border: "none", color: posting || !commentText.trim() ? "#94A3B8" : "#fff",
              fontSize: 13, fontWeight: 700,
              cursor: posting || !commentText.trim() ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}>送出</button>
          </div>
        </div>
      </div>

      {/* Report modal */}
      {reportTarget && (
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
            {reportSent ? (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>檢舉已送出</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>我們會儘快處理，謝謝回報</div>
                </div>
                <button onClick={closeReportModal} style={{
                  width: "100%", padding: "11px 0", borderRadius: 10,
                  background: "#2563EB", border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                }}>關閉</button>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>檢舉這則留言</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>可選填檢舉原因</div>
                </div>
                <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
                  placeholder="檢舉原因（選填）" rows={3} style={{
                    width: "100%", background: "#F1F5F9", border: "1px solid #CBD5E1",
                    borderRadius: 10, color: "#0F172A", fontSize: 13,
                    padding: "10px 12px", outline: "none", fontFamily: "inherit", resize: "none",
                    boxSizing: "border-box",
                  }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={closeReportModal} style={{
                    flex: 1, padding: "11px 0", borderRadius: 10,
                    background: "#F1F5F9", border: "1px solid #CBD5E1",
                    color: "#64748B", fontSize: 13, cursor: "pointer",
                  }}>取消</button>
                  <button onClick={handleReportSubmit} style={{
                    flex: 1, padding: "11px 0", borderRadius: 10,
                    background: "#ef4444", border: "none",
                    color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                  }}>送出檢舉</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

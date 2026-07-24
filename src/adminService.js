import { collection, getDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// 讀取所有待處理檢舉，並附上對應留言內容(若留言已被刪除仍正常回傳該筆檢舉，
// commentText 標示「留言已不存在」，不視為錯誤)
// 用單一 orderBy 讀全部再前端過濾 status,避免 where+orderBy 組合查詢需要額外建立複合索引
export async function getPendingReports() {
  const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
  const reports = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.status === "pending");

  return Promise.all(reports.map(async r => {
    try {
      const commentSnap = await getDoc(doc(db, "invites", r.inviteId, "comments", r.commentId));
      if (commentSnap.exists()) {
        const c = commentSnap.data();
        return { ...r, commentText: c.text, commentAuthor: c.authorName };
      }
      return { ...r, commentText: "留言已不存在", commentAuthor: null };
    } catch {
      return { ...r, commentText: "留言已不存在", commentAuthor: null };
    }
  }));
}

// 刪除被檢舉的留言，並將該筆檢舉標記為已處理(已刪除)
export async function deleteReportedComment(inviteId, commentId, reportId) {
  await deleteDoc(doc(db, "invites", inviteId, "comments", commentId));
  await updateDoc(doc(db, "reports", reportId), { status: "resolved_deleted" });
}

// 忽略檢舉，留言本身不受影響
export async function dismissReport(reportId) {
  await updateDoc(doc(db, "reports", reportId), { status: "resolved_dismissed" });
}

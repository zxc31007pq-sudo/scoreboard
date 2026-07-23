import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// 管理員email清單：這份清單必須跟 Firestore 安全性規則裡的 admin清單保持一致，
// 這裡只用來做前端UI的顯示/隱藏判斷，真正的權限控管在 Firestore 規則那一份，
// 兩邊改動時要同步更新，不能只改其中一邊。
export const ADMIN_EMAILS = ["zxc31007pq@gmail.com"];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// 查詢單一email是否在黑名單中(登入流程用，任何登入使用者都能查自己的)
export async function isBlacklisted(email) {
  const ref = doc(db, "blacklist", normalizeEmail(email));
  const snap = await getDoc(ref);
  return snap.exists();
}

// 讀取完整黑名單清單(僅管理員可執行，受 Firestore 規則的 list 權限保護)
export async function getBlacklist() {
  const snap = await getDocs(collection(db, "blacklist"));
  return snap.docs.map(d => ({ email: d.id, ...d.data() }));
}

// 新增一筆黑名單(僅管理員)
export async function addToBlacklist(email, reason, adminEmail) {
  const normalized = normalizeEmail(email);
  await setDoc(doc(db, "blacklist", normalized), {
    reason: reason || "",
    bannedBy: adminEmail,
    bannedAt: serverTimestamp(),
  });
}

// 移除一筆黑名單(僅管理員)
export async function removeFromBlacklist(email) {
  await deleteDoc(doc(db, "blacklist", normalizeEmail(email)));
}

import {
  collection, addDoc, getDoc, getDocs, doc, updateDoc,
  query, orderBy, arrayUnion, arrayRemove, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const MAX_DURATION_MS = 4 * 60 * 60 * 1000; // 時間區間上限4小時

export const SPORT_NAMES = {
  basketball: "籃球", badminton: "羽球", tabletennis: "桌球", pickleball: "匹克球",
};

export const SPORT_ACCENTS = {
  basketball: "#2563EB", badminton: "#1d4ed8", tabletennis: "#059669", pickleball: "#7c3aed",
};

export const GENDER_LABELS = {
  male_only: "僅限男生", female_only: "僅限女生", open: "男女不拘",
};

// 各球類程度分級選項，籃球不分級(null)
export const LEVEL_OPTIONS = {
  basketball: null,
  badminton: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  tabletennis: ["初級", "中級", "高級"],
  pickleball: ["1", "2", "3", "4", "5"],
};

// 常見縣市＋行政區清單(涵蓋主要都會區,非全台完整清單)
export const TAIWAN_DISTRICTS = {
  台北市: ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
  新北市: ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "土城區", "蘆洲區", "樹林區", "汐止區", "淡水區", "三峽區"],
  桃園市: ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "龜山區", "大溪區"],
  台中市: ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "豐原區"],
  台南市: ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區"],
  高雄市: ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "三民區", "左營區", "楠梓區", "前鎮區", "小港區", "鳳山區"],
  新竹市: ["東區", "北區", "香山區"],
};

function isExpired(invite) {
  const endDateTime = new Date(`${invite.date}T${invite.endTime}:00`);
  return Date.now() > endDateTime.getTime();
}

// 建立新邀約
export async function createInvite(data) {
  const start = new Date(`${data.date}T${data.startTime}:00`);
  const end = new Date(`${data.date}T${data.endTime}:00`);
  if (end.getTime() - start.getTime() <= 0 || end.getTime() - start.getTime() > MAX_DURATION_MS) {
    throw new Error("時間區間需大於0且不超過4小時");
  }

  const ref = await addDoc(collection(db, "invites"), {
    sport: data.sport,
    type: data.type,
    city: data.city,
    district: data.district,
    address: data.address,
    locationNote: data.locationNote || "",
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    levelTag: data.levelTag ?? null,
    newbieFriendly: !!data.newbieFriendly,
    genderRestriction: data.genderRestriction || "open",
    hostUid: data.hostUid,
    isFull: false,
    participants: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 讀取邀約列表，支援 sport / city / district / level 篩選
// 惰性過期檢查：只在前端過濾不顯示已過期的邀約，不刪除資料庫紀錄(比照現有比賽紀錄的保留模式)
export async function getInvites(filters = {}) {
  const snap = await getDocs(query(collection(db, "invites"), orderBy("createdAt", "desc")));
  let invites = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  invites = invites.filter(inv => !isExpired(inv));

  if (filters.sport) invites = invites.filter(inv => inv.sport === filters.sport);
  if (filters.city) invites = invites.filter(inv => inv.city === filters.city);
  if (filters.district) invites = invites.filter(inv => inv.district === filters.district);
  if (filters.level) invites = invites.filter(inv => inv.levelTag === filters.level);

  return invites;
}

// 讀取單一邀約
export async function getInvite(inviteId) {
  const snap = await getDoc(doc(db, "invites", inviteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// 報名參加
export async function joinInvite(inviteId, uid) {
  const ref = doc(db, "invites", inviteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("邀約不存在");
  const invite = snap.data();

  if (invite.isFull) throw new Error("此邀約已額滿");
  if (invite.participants?.includes(uid)) throw new Error("你已經報名過了");

  await updateDoc(ref, { participants: arrayUnion(uid) });
}

// 取消報名(不動 isFull)
export async function leaveInvite(inviteId, uid) {
  await updateDoc(doc(db, "invites", inviteId), { participants: arrayRemove(uid) });
}

// 發起人手動切換已額滿狀態
export async function toggleFull(inviteId, isFull) {
  await updateDoc(doc(db, "invites", inviteId), { isFull });
}

// 新增留言
export async function addComment(inviteId, text, user) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("留言內容不能為空");
  await addDoc(collection(db, "invites", inviteId, "comments"), {
    text: trimmed,
    authorUid: user.uid,
    authorName: user.displayName || "球員",
    createdAt: serverTimestamp(),
  });
}

// 讀取留言列表
export async function getComments(inviteId) {
  const snap = await getDocs(
    query(collection(db, "invites", inviteId, "comments"), orderBy("createdAt", "asc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 檢舉留言(只寫入 reports 集合，供之後管理端處理)
export async function reportComment(inviteId, commentId, reporterUid, reason) {
  await addDoc(collection(db, "reports"), {
    inviteId,
    commentId,
    reporterUid,
    reason: reason || "",
    createdAt: serverTimestamp(),
    status: "pending",
  });
}

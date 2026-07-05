import { collection, addDoc, getDoc, getDocs, doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getRankData, applyMatchResult, saveRankData } from "./rankService";

// 產生比賽紀錄並存入 Firestore
export async function createMatch({ sport, mode, teamA, teamB, scoreA, scoreB, winner }) {
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3小時後失效

  const ref = await addDoc(collection(db, "matches"), {
    sport,        // "basketball" | "badminton" | "tabletennis" | "pickleball"
    mode,         // "5v5" | "3v3" | "單打" | "雙打"
    teamA,        // 隊伍A名稱
    teamB,        // 隊伍B名稱
    scoreA,       // 隊伍A分數
    scoreB,       // 隊伍B分數
    winner,       // "A" | "B"
    claimedBy: [], // 已認領的 uid 列表
    createdAt: serverTimestamp(),
    expiresAt,
    status: "active",
  });

  return ref.id; // 回傳比賽 ID
}

// 讀取比賽資料
export async function getMatch(matchId) {
  const snap = await getDoc(doc(db, "matches", matchId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// 球員認領比賽（含段位積分計算 + 連勝加成）
export async function claimMatch(matchId, uid, { name, side }) {
  // side: "A" | "B" — 球員選擇自己是哪隊
  const matchRef = doc(db, "matches", matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error("比賽不存在");

  const match = snap.data();

  // 檢查是否已過期
  const now = new Date();
  const expires = match.expiresAt.toDate ? match.expiresAt.toDate() : new Date(match.expiresAt);
  if (now > expires) throw new Error("此比賽連結已過期（超過3小時）");

  // 檢查是否已認領
  if (match.claimedBy?.includes(uid)) throw new Error("你已經認領過這場比賽");

  const isWinner = match.winner === side;
  const score = side === "A"
    ? `${match.scoreA}:${match.scoreB}`
    : `${match.scoreB}:${match.scoreA}`;

  // 段位系統：讀取該球類模式目前狀態 → 套用連勝加成 → 寫回 users/{uid}/ranks
  const rankCurrent = await getRankData(uid, match.sport, match.mode);
  const rankResult = applyMatchResult(rankCurrent, isWinner);
  await saveRankData(uid, match.sport, match.mode, rankResult);

  // 寫入球員個人紀錄（pts 為套用連勝加成後的實際積分）
  await addDoc(collection(db, "users", uid, "records"), {
    matchId,
    sport: match.sport,
    mode: match.mode,
    opponent: side === "A" ? match.teamB : match.teamA,
    score,
    result: isWinner ? "勝" : "敗",
    pts: rankResult.earned,
    streakAtMatch: rankResult.streak,
    side,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // PRO: 30天, 免費: 14天
  });

  // 標記已認領
  await updateDoc(matchRef, {
    claimedBy: arrayUnion(uid),
  });

  return {
    result: isWinner ? "勝" : "敗",
    pts: rankResult.earned,
    streak: rankResult.streak,
    rank: rankResult.rankKey,
  };
}

// 修改已認領的隊伍（3小時內有效）
// 注意：目前此函式尚未同步回溯修正段位積分/連勝資料，
// 屬於已知邊角案例，待日後用 Firestore transaction 處理。
export async function updateClaimSide(matchId, uid, newSide) {
  const matchRef = doc(db, "matches", matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error("比賽不存在");

  const match = snap.data();

  // 檢查是否已過期
  const now = new Date();
  const expires = match.expiresAt.toDate ? match.expiresAt.toDate() : new Date(match.expiresAt);
  if (now > expires) throw new Error("修改時間已過期（超過3小時）");

  // 找到該用戶的紀錄
  const recordsRef = collection(db, "users", uid, "records");
  const q = await getDocs(recordsRef);
  const record = q.docs.find(d => d.data().matchId === matchId);
  if (!record) throw new Error("找不到此比賽紀錄");

  // 重新計算勝負
  const isWinner = match.winner === newSide;
  const score = newSide === "A"
    ? `${match.scoreA}:${match.scoreB}`
    : `${match.scoreB}:${match.scoreA}`;

  await updateDoc(doc(db, "users", uid, "records", record.id), {
    side: newSide,
    opponent: newSide === "A" ? match.teamB : match.teamA,
    score,
    result: isWinner ? "勝" : "敗",
    pts: isWinner ? 10 : 3,
  });

  return { result: isWinner ? "勝" : "敗", pts: isWinner ? 10 : 3 };
}

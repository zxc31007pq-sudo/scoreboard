import { collection, addDoc, getDoc, getDocs, doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getRankData, applyMatchResult, saveRankData } from "./rankService";

// 產生比賽紀錄並存入 Firestore
export async function createMatch({ sport, mode, teamA, teamB, scoreA, scoreB, winner }) {
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3小時後失效

  const ref = await addDoc(collection(db, "matches"), {
    sport,        // "basketball" | "badminton" | "tabletennis" | "pickleball"
    mode,         // "5v5" | "3v3" | "單打" | "雙打" 等,依各計分板實際傳入值而定
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
  const rankBefore = await getRankData(uid, match.sport, match.mode);
  const rankResult = applyMatchResult(rankBefore, isWinner);
  await saveRankData(uid, match.sport, match.mode, rankResult);

  // 寫入球員個人紀錄
  // rankBefore/rankAfter 是完整快照，供之後「修改隊伍」時安全回溯用
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
    rankBefore: {
      pts: rankBefore.pts || 0,
      streak: rankBefore.streak || 0,
      rankKey: rankBefore.rankKey || "newbie",
      highestRankKey: rankBefore.highestRankKey || "newbie",
    },
    rankAfter: {
      pts: rankResult.pts,
      streak: rankResult.streak,
      rankKey: rankResult.rankKey,
      highestRankKey: rankResult.highestRankKey,
    },
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
// 會同步回溯修正段位積分/連勝，但僅在「安全」情況下才執行：
// 如果偵測到這個模式在此筆紀錄之後,又有更新的比賽紀錄(段位資料已經前進),
// 為避免算錯,會直接擋下修改並提示錯誤。
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
  const recordDoc = q.docs.find(d => d.data().matchId === matchId);
  if (!recordDoc) throw new Error("找不到此比賽紀錄");
  const recordData = recordDoc.data();

  // 重新計算勝負
  const isWinner = match.winner === newSide;
  const score = newSide === "A"
    ? `${match.scoreA}:${match.scoreB}`
    : `${match.scoreB}:${match.scoreA}`;

  // 舊資料相容：如果這筆紀錄是段位系統上線前建立的,沒有 rankBefore/rankAfter 快照,
  // 就不進行段位回溯，只更新基本欄位（維持原本行為）
  if (!recordData.rankBefore || !recordData.rankAfter) {
    await updateDoc(doc(db, "users", uid, "records", recordDoc.id), {
      side: newSide,
      opponent: newSide === "A" ? match.teamB : match.teamA,
      score,
      result: isWinner ? "勝" : "敗",
      pts: isWinner ? 10 : 3,
    });
    return { result: isWinner ? "勝" : "敗", pts: isWinner ? 10 : 3 };
  }

  // 安全檢查：目前段位資料是否仍然等於這筆紀錄「認領當下」記錄的結果狀態
  // 如果不一樣，代表這個模式在這之後又有新比賽發生，回溯會算錯，直接擋下
  const rankNow = await getRankData(uid, match.sport, match.mode);
  const unchanged =
    rankNow.pts === recordData.rankAfter.pts &&
    rankNow.streak === recordData.rankAfter.streak;

  if (!unchanged) {
    throw new Error("無法修改：你在此模式已有更新的比賽紀錄，為避免積分算錯，這筆紀錄不支援修改隊伍");
  }

  // 安全：回溯到「認領前」狀態，再套用新的勝負結果
  const newRankResult = applyMatchResult(recordData.rankBefore, isWinner);
  await saveRankData(uid, match.sport, match.mode, newRankResult);

  await updateDoc(doc(db, "users", uid, "records", recordDoc.id), {
    side: newSide,
    opponent: newSide === "A" ? match.teamB : match.teamA,
    score,
    result: isWinner ? "勝" : "敗",
    pts: newRankResult.earned,
    streakAtMatch: newRankResult.streak,
    rankAfter: {
      pts: newRankResult.pts,
      streak: newRankResult.streak,
      rankKey: newRankResult.rankKey,
      highestRankKey: newRankResult.highestRankKey,
    },
  });

  return {
    result: isWinner ? "勝" : "敗",
    pts: newRankResult.earned,
    streak: newRankResult.streak,
    rank: newRankResult.rankKey,
  };
}

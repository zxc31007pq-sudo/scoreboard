import { collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getRankData, applyMatchResult, saveRankData, getSeasonKey } from "./rankService";

const FREE_DELETE_LIMIT = 3;
const PRO_DELETE_LIMIT = 10; // 付費版功能,待 PRO 判斷邏輯上線後啟用

// 依球類模式判斷每隊最多可被認領的人數上限,防止同一場比賽被無限重複認領盜刷積分
function getMaxClaimsForMode(sport, mode) {
  if (sport === "basketball" && mode === "5v5") return Infinity; // 有換人制度,不限制人數
  if (sport === "basketball" && mode === "3v3") return 3;
  if (mode === "雙打") return 2;
  if (mode === "單打") return 1;
  if (sport === "tabletennis") return 1; // 桌球僅單打
  return 5; // 未知模式時的保守預設值,避免誤擋合理使用情境
}

// 產生比賽紀錄並存入 Firestore
export async function createMatch({ sport, mode, teamA, teamB, scoreA, scoreB, winner, source }) {
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3小時後失效

  const ref = await addDoc(collection(db, "matches"), {
    sport,        // "basketball" | "badminton" | "tabletennis" | "pickleball"
    mode,         // "5v5" | "3v3" | "單打" | "雙打" 等,依各計分板實際傳入值而定
    teamA,        // 隊伍A名稱
    teamB,        // 隊伍B名稱
    scoreA,       // 隊伍A分數
    scoreB,       // 隊伍B分數
    winner,       // "A" | "B"
    claimedBy: [],  // 已認領的 uid 列表(所有隊伍合併,用於防止同一人重複認領)
    claimsA: [],    // A隊已認領的 uid 列表(用於人數上限檢查)
    claimsB: [],    // B隊已認領的 uid 列表(用於人數上限檢查)
    createdAt: serverTimestamp(),
    expiresAt,
    status: "active",
    ...(source ? { source } : {}), // 可選欄位:快速計分模式標記 "quick",未傳入則不寫入(向下相容)
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

  // 檢查該隊認領人數是否已達上限(防止同一場比賽被無限重複認領)
  const maxClaims = getMaxClaimsForMode(match.sport, match.mode);
  const sideClaims = side === "A" ? (match.claimsA || []) : (match.claimsB || []);
  if (sideClaims.length >= maxClaims) {
    throw new Error(`此隊認領人數已達上限（${maxClaims}人），可能隊友已經認領過了`);
  }

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
  });

  // 標記已認領(同時記錄到對應隊伍的 claims 陣列,供人數上限檢查用)
  await updateDoc(matchRef, {
    claimedBy: arrayUnion(uid),
    [side === "A" ? "claimsA" : "claimsB"]: arrayUnion(uid),
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

// 查詢目前的刪除額度使用狀況(自動處理跨季重置)
export async function getDeleteQuotaStatus(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const profile = snap.exists() ? snap.data() : {};
  const currentSeason = getSeasonKey();
  const quota = profile.deleteQuota || {};
  const used = quota.seasonKey === currentSeason ? (quota.used || 0) : 0;
  const limit = profile.plan === "pro" ? PRO_DELETE_LIMIT : FREE_DELETE_LIMIT;
  return { used, limit, remaining: Math.max(0, limit - used), seasonKey: currentSeason };
}

// 刪除比賽紀錄
// 限制:
// 1. 每季有刪除次數上限(免費版3次,PRO版10次,額度隨段位季度重置一起重置)
// 2. 只能刪除該球類模式「目前最新一筆」紀錄,並會正確回溯扣回積分/連勝
//    (若不是最新一筆,代表之後又有新比賽,回溯會算錯,直接擋下)
export async function deleteRecord(uid, recordId) {
  const recordRef = doc(db, "users", uid, "records", recordId);
  const recordSnap = await getDoc(recordRef);
  if (!recordSnap.exists()) throw new Error("找不到此比賽紀錄");
  const record = recordSnap.data();

  // 舊資料相容:段位系統上線前的紀錄沒有快照,無法安全回溯積分,不允許刪除
  if (!record.rankBefore || !record.rankAfter) {
    throw new Error("此紀錄為系統升級前的舊資料，暫不支援刪除");
  }

  // 額度檢查
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const profile = userSnap.exists() ? userSnap.data() : {};
  const currentSeason = getSeasonKey();
  const quota = profile.deleteQuota || {};
  const usedSoFar = quota.seasonKey === currentSeason ? (quota.used || 0) : 0;
  const limit = profile.plan === "pro" ? PRO_DELETE_LIMIT : FREE_DELETE_LIMIT;
  if (usedSoFar >= limit) {
    throw new Error(`本季刪除次數已達上限（${limit}次），如需更多刪除次數請升級 PRO 版`);
  }

  // 安全檢查:必須是該模式目前最新一筆紀錄,才能安全回溯積分
  const rankNow = await getRankData(uid, record.sport, record.mode);
  const isLatest =
    rankNow.pts === record.rankAfter.pts &&
    rankNow.streak === record.rankAfter.streak;
  if (!isLatest) {
    throw new Error("只能刪除此模式最新一筆紀錄，請先刪除較新的紀錄");
  }

  // 回溯積分/連勝到刪除前的狀態
  await saveRankData(uid, record.sport, record.mode, { ...record.rankBefore });

  // 刪除紀錄本身
  await deleteDoc(recordRef);

  // 更新本季刪除額度(注意:不會把 uid 從 match 的 claimedBy/claimsA/claimsB 移除,
  // 避免刪除後又能重新認領同一場比賽,重複賺取積分)
  await setDoc(userRef, {
    deleteQuota: { used: usedSoFar + 1, seasonKey: currentSeason },
  }, { merge: true });

  return { remaining: limit - (usedSoFar + 1), limit };
}


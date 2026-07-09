import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

import rankNewbie   from "./assets/icons/rank_newbie.png";
import rankBronze   from "./assets/icons/rank_bronze.png";
import rankSilver   from "./assets/icons/rank_silver.png";
import rankGold     from "./assets/icons/rank_gold.png";
import rankPlatinum from "./assets/icons/rank_platinum.png";
import rankDiamond  from "./assets/icons/rank_diamond.png";
import rankMaster   from "./assets/icons/rank_master.png";

export const RANK_SYSTEM = [
  { key: "newbie",   name: "新手", min: 0,    max: 10,       color: "#94a3b8", emoji: "🆕", icon: rankNewbie },
  { key: "bronze",   name: "銅牌", min: 11,   max: 99,       color: "#b45309", emoji: "🥉", icon: rankBronze },
  { key: "silver",   name: "銀牌", min: 100,  max: 199,      color: "#64748b", emoji: "🥈", icon: rankSilver },
  { key: "gold",     name: "金牌", min: 200,  max: 499,      color: "#d97706", emoji: "🥇", icon: rankGold },
  { key: "platinum", name: "鉑金", min: 500,  max: 799,      color: "#7c3aed", emoji: "💎", icon: rankPlatinum },
  { key: "diamond",  name: "鑽石", min: 800,  max: 1499,     color: "#0ea5e9", emoji: "💠", icon: rankDiamond },
  { key: "master",   name: "大師", min: 1500, max: Infinity, color: "#cc0000", emoji: "👑", icon: rankMaster },
];

export function getRank(pts) {
  return RANK_SYSTEM.find(r => pts >= r.min && pts <= r.max) || RANK_SYSTEM[0];
}

function rankIndex(key) {
  return RANK_SYSTEM.findIndex(r => r.key === key);
}

// 球類+模式 → 唯一 key，例如 "basketball_5v5"、"badminton_單打"
export function modeKey(sport, mode) {
  return `${sport}_${mode}`;
}

// ── 季度重置相關 ──
// 重置月份：1 / 4 / 7 / 10 月。回傳目前所屬「季度區間」的識別字串，例如 "2026-07"
export function getSeasonKey(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  const quarterStart = month >= 10 ? 10 : month >= 7 ? 7 : month >= 4 ? 4 : 1;
  return `${year}-${String(quarterStart).padStart(2, "0")}`;
}

// 回傳下一次重置的日期,以及本季結束日期(下次重置日期的前一天),供畫面顯示用
export function getNextResetInfo(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let nextMonth, nextYear;
  if (month < 4)       { nextMonth = 4;  nextYear = year; }
  else if (month < 7)  { nextMonth = 7;  nextYear = year; }
  else if (month < 10) { nextMonth = 10; nextYear = year; }
  else                 { nextMonth = 1;  nextYear = year + 1; }

  const resetDate = new Date(nextYear, nextMonth - 1, 1);
  const seasonEndDate = new Date(resetDate.getTime() - 24 * 60 * 60 * 1000);
  return { resetDate, seasonEndDate };
}

// 套用季度重置規則到單一筆段位資料上,回傳重置後的資料(不寫入 Firestore)
// 規則:新手 → 歸0；銅牌以上 → 歸10,回銅牌；連勝歸0；歷史最高段位永久保留
function applySeasonReset(data) {
  const wasNewbie = (data.rankKey || "newbie") === "newbie";
  return {
    pts: wasNewbie ? 0 : 10,
    streak: 0,
    rankKey: wasNewbie ? "newbie" : "bronze",
    highestRankKey: data.highestRankKey || (wasNewbie ? "newbie" : "bronze"), // 永久保留
    lastResetPeriod: getSeasonKey(),
  };
}

// 讀取該球員在該球類模式下目前的段位資料(自動處理跨季重置)
export async function getRankData(uid, sport, mode) {
  const ref = doc(db, "users", uid, "ranks", modeKey(sport, mode));
  const snap = await getDoc(ref);
  const currentSeason = getSeasonKey();

  if (!snap.exists()) {
    return { pts: 0, streak: 0, rankKey: "newbie", highestRankKey: "newbie", lastResetPeriod: currentSeason };
  }

  const data = snap.data();

  // 舊資料沒有 lastResetPeriod 欄位:視為「剛升級的新功能」,先蓋上目前季度戳記,不執行重置
  // (避免功能上線當下,誤把使用者當季正在使用的資料判定為跨季而重置)
  if (!data.lastResetPeriod) {
    const stamped = { ...data, lastResetPeriod: currentSeason };
    await setDoc(ref, { lastResetPeriod: currentSeason }, { merge: true });
    return stamped;
  }

  // 已跨季:套用重置規則並寫回
  if (data.lastResetPeriod !== currentSeason) {
    const resetData = applySeasonReset(data);
    await setDoc(ref, {
      pts: resetData.pts,
      streak: resetData.streak,
      rankKey: resetData.rankKey,
      highestRankKey: resetData.highestRankKey,
      lastResetPeriod: resetData.lastResetPeriod,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return resetData;
  }

  // 同一季度內,直接回傳
  return data;
}

// 讀取該球員「所有球類模式」的段位資料,同樣會自動處理跨季重置(用於段位分頁整體顯示)
export async function getAllRankData(uid) {
  const colRef = collection(db, "users", uid, "ranks");
  const snap = await getDocs(colRef);
  const currentSeason = getSeasonKey();
  const results = [];

  for (const d of snap.docs) {
    const data = d.data();
    const key = d.id;

    if (!data.lastResetPeriod) {
      await setDoc(d.ref, { lastResetPeriod: currentSeason }, { merge: true });
      results.push({ modeKey: key, ...data, lastResetPeriod: currentSeason });
      continue;
    }

    if (data.lastResetPeriod !== currentSeason) {
      const resetData = applySeasonReset(data);
      await setDoc(d.ref, {
        pts: resetData.pts,
        streak: resetData.streak,
        rankKey: resetData.rankKey,
        highestRankKey: resetData.highestRankKey,
        lastResetPeriod: resetData.lastResetPeriod,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      results.push({ modeKey: key, ...resetData });
    } else {
      results.push({ modeKey: key, ...data });
    }
  }

  return results;
}

// 套用一場比賽結果，回傳更新後的段位資料（尚未寫入 Firestore）
// current: { pts, streak, rankKey, highestRankKey }
export function applyMatchResult(current, isWinner) {
  const { pts = 0, streak = 0, highestRankKey = "newbie" } = current;

  let newStreak, earned;

  if (isWinner) {
    newStreak = streak + 1;
    let multiplier = 1;
    if (newStreak >= 10) multiplier = 2.0;
    else if (newStreak >= 3) multiplier = 1.5;
    earned = Math.round(10 * multiplier);
  } else {
    newStreak = 0;
    earned = 3;
  }

  const newPts = pts + earned;
  const newRank = getRank(newPts);
  const highestRankKeyNext =
    rankIndex(newRank.key) > rankIndex(highestRankKey) ? newRank.key : highestRankKey;

  return {
    pts: newPts,
    streak: newStreak,
    rankKey: newRank.key,
    highestRankKey: highestRankKeyNext,
    earned,
  };
}

// 寫入 Firestore（users/{uid}/ranks/{sport_mode}）
export async function saveRankData(uid, sport, mode, data) {
  const ref = doc(db, "users", uid, "ranks", modeKey(sport, mode));
  await setDoc(ref, {
    pts: data.pts,
    streak: data.streak,
    rankKey: data.rankKey,
    highestRankKey: data.highestRankKey,
    lastResetPeriod: data.lastResetPeriod || getSeasonKey(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

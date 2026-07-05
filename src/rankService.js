import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const RANK_SYSTEM = [
  { key: "newbie",   name: "新手", min: 0,    max: 10,       color: "#94a3b8", emoji: "🆕" },
  { key: "bronze",   name: "銅牌", min: 11,   max: 99,       color: "#b45309", emoji: "🥉" },
  { key: "silver",   name: "銀牌", min: 100,  max: 199,      color: "#64748b", emoji: "🥈" },
  { key: "gold",     name: "金牌", min: 200,  max: 499,      color: "#d97706", emoji: "🥇" },
  { key: "platinum", name: "鉑金", min: 500,  max: 799,      color: "#7c3aed", emoji: "💎" },
  { key: "diamond",  name: "鑽石", min: 800,  max: 1499,     color: "#0ea5e9", emoji: "💠" },
  { key: "master",   name: "大師", min: 1500, max: Infinity, color: "#cc0000", emoji: "👑" },
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

// 讀取該球員在該球類模式下目前的段位資料
export async function getRankData(uid, sport, mode) {
  const ref = doc(db, "users", uid, "ranks", modeKey(sport, mode));
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { pts: 0, streak: 0, rankKey: "newbie", highestRankKey: "newbie" };
  }
  return snap.data();
}

// 套用一場比賽結果，回傳更新後的段位資料（尚未寫入 Firestore）
// current: { pts, streak, highestRankKey }
// isWinner: boolean
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
    newStreak = 0; // 連勝中斷，重新計算
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
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

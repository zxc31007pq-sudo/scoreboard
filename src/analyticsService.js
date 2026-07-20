import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";

// 所有追蹤函式都是靜默失敗:分析事件記錄不到不該影響主要功能
// (登入、建立比賽、認領比賽),失敗只印到 console,不拋出例外。
function track(eventName, params) {
  if (!analytics) return;
  try {
    logEvent(analytics, eventName, params);
  } catch (e) {
    console.error(`Analytics 事件記錄失敗(${eventName}):`, e);
  }
}

export function trackSignup() {
  track("user_signup");
}

export function trackMatchCreated(sport, mode) {
  track("match_created", { sport, mode });
}

export function trackMatchClaimed(sport, mode) {
  track("match_claimed", { sport, mode });
}

export function trackQuickRecordUsed(sport, mode) {
  track("quick_record_used", { sport, mode });
}

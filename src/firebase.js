import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDBJGqvlt1iadbapQa8L1mc4mSA0HV37wk",
  authDomain: "scoreboard-dev-e124d.firebaseapp.com",
  projectId: "scoreboard-dev-e124d",
  storageBucket: "scoreboard-dev-e124d.firebasestorage.app",
  messagingSenderId: "622932369401",
  appId: "1:622932369401:web:fc8d131ba88c0634dea728",
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// firebase.js 是全站每個頁面都會載入的檔案,Analytics 初始化失敗
// (例如瀏覽器擴充功能封鎖、專案尚未連結 GA 屬性)不能讓整個網站掛掉,
// 所以這裡包一層防護,失敗就讓 analytics 維持 null,呼叫端自行判斷。
export let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.error("Analytics 初始化失敗:", e);
}

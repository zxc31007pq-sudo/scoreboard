import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDc8J33lUuk3FY6JDQEe9hnRVEmOawMWwY",
  authDomain: "scoreboard-1b6b3.firebaseapp.com",
  projectId: "scoreboard-1b6b3",
  storageBucket: "scoreboard-1b6b3.firebasestorage.app",
  messagingSenderId: "132139914097",
  appId: "1:132139914097:web:84216a6e454599dd0d1cd0",
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
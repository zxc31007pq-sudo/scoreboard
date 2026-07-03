import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

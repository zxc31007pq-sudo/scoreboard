import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

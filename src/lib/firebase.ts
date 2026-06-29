import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAnqCgao7asUHBb-0sEV6Rfvv6SURojHhY",
  authDomain: "gen-lang-client-0641138069.firebaseapp.com",
  projectId: "gen-lang-client-0641138069",
  storageBucket: "gen-lang-client-0641138069.firebasestorage.app",
  messagingSenderId: "466729324795",
  appId: "1:466729324795:web:4a9cfb13457ee1f807a05e"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-1c4c9ebb-36bf-4bc1-9063-7795a3326bd8");
export const auth = getAuth(app);

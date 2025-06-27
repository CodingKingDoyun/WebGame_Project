// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1nSHhIHcObW-EowCEeeyfzGHSnGxoJ6s",
  authDomain: "farmgame-bb055.firebaseapp.com",
  projectId: "farmgame-bb055",
  storageBucket: "farmgame-bb055.firebasestorage.app",
  messagingSenderId: "171589908691",
  appId: "1:171589908691:web:c3314b8d6d74ea7c08fc26"
};



const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

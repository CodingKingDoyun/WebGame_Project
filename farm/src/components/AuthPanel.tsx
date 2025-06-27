// src/components/AuthPanel.tsx
import { useEffect, useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup, signOut, User } from "firebase/auth";

export default function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: "1rem", color: "white", background: "#333" }}>
      {user ? (
        <>
          <p>👋 안녕, {user.displayName}!</p>
          <button onClick={() => signOut(auth)}>로그아웃</button>
        </>
      ) : (
        <button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</button>
      )}
    </div>
  );
}

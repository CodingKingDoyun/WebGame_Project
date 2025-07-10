import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function FarmGame() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <p className="loading-message">
        🔐 로그인 중입니다...
      </p>
    );
  }

  return (
    <div className="farm-game">
      <h2>🌾 {user.displayName}님의 농장</h2>
    </div>
  );
}

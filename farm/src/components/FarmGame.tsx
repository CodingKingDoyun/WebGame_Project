import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export default function FarmGame() {
  const [user, setUser] = useState<User | null>(null);
  const [gold, setGold] = useState(0);
  const [potato, setPotato] = useState(0);

  const potatoRef = useRef(potato);
  const goldRef = useRef(gold);

  useEffect(() => {
    potatoRef.current = potato;
    goldRef.current = gold;
  }, [potato, gold]);

  // 🔥 로그인 감지 + 유저 데이터 로딩 + 오프라인 생산 계산
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;
      setUser(firebaseUser);

      const uid = firebaseUser.uid;
      const userDoc = doc(db, "users", uid);
      const snapshot = await getDoc(userDoc);

      const now = Date.now();
      const intervalMs = 5000;

      if (snapshot.exists()) {
        const data = snapshot.data();

        const lastUpdated = data.lastUpdated || now;
        const elapsed = now - lastUpdated;
        const produced = Math.floor(elapsed / intervalMs);

        const newPotato = (data.potato || 0) + produced;
        const newGold = (data.gold || 0) + produced * 5;

        setPotato(newPotato);
        setGold(newGold);

        await setDoc(
          userDoc,
          {
            potato: newPotato,
            gold: newGold,
            lastUpdated: now,
          },
          { merge: true }
        );
      } else {
        await setDoc(userDoc, {
          gold: 0,
          potato: 0,
          lastUpdated: now,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // ⏱️ 자동 감자 생산
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const newPotato = potatoRef.current + 1;

      setPotato(newPotato);

      const userDoc = doc(db, "users", user.uid);
      await setDoc(
        userDoc,
        {
          potato: newPotato,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleHarvest = async () => {
    if (!user) return;

    const newPotato = potatoRef.current + 1;

    setPotato(newPotato);

    const userDoc = doc(db, "users", user.uid);
    await setDoc(
      userDoc,
      {
        potato: newPotato,
        lastUpdated: Date.now(),
      },
      { merge: true }
    );
  };

  const handleSell = async () => {
    if (!user) return;

    const sellPricePerPotato = 10;
    const earned = potato * sellPricePerPotato;
    const newGold = gold + earned;

    setGold(newGold);
    setPotato(0);

    const userDoc = doc(db, "users", user.uid);
    await setDoc(
      userDoc,
      {
        potato: 0,
        gold: newGold,
        lastUpdated: Date.now(),
      },
      { merge: true }
    );
  };

  if (!user) {
    return (
      <p style={{ color: "white", padding: "1rem" }}>🔐 로그인 중입니다...</p>
    );
  }

  return (
    <div style={{ padding: "1rem", color: "white" }}>
      <h2>🌾 당신의 농장</h2>
      <p>🥔 감자: {potato}</p>
      <p>💰 골드: {gold}</p>
      <button onClick={handleHarvest}>💪 수확하기</button>
      <button onClick={handleSell}>💰 감자 판매하기</button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import PotatoStatus from "./PotatoStatus";
import HarvestButton from "./HarvestButton";
import SellButton from "./SellButton";
import PotatoProducer from "./PotatoProducer";

export default function FarmGame() {
  const [user, setUser] = useState<User | null>(null);
  const [gold, setGold] = useState(0);
  const [potato, setPotato] = useState(0);

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
        const newGold = data.gold || 0;

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

  const handleHarvest = async () => {
    if (!user) return;

    const newPotato = potato + 1;
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

    const sellPrice = 10;
    const newGold = gold + potato * sellPrice;

    setGold(newGold);
    setPotato(0);

    const userDoc = doc(db, "users", user.uid);
    await setDoc(
      userDoc,
      {
        gold: newGold,
        potato: 0,
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
      <PotatoStatus potato={potato} gold={gold} />
      <HarvestButton onHarvest={handleHarvest} />
      <SellButton onSell={handleSell} />
      <PotatoProducer user={user} potato={potato} setPotato={setPotato} />
    </div>
  );
}

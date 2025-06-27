// components/PotatoProducer.tsx
import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { User } from "firebase/auth";

interface Props {
  user: User;
  potato: number;
  setPotato: (v: number) => void;
}

export default function PotatoProducer({ user, potato, setPotato }: Props) {
  useEffect(() => {
    const interval = setInterval(async () => {
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
    }, 5000);

    return () => clearInterval(interval);
  }, [user, potato, setPotato]);

  return null;
}

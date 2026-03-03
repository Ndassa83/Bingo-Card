import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";
import type { CardData } from "../types";

export const useCards = (userId: string | null) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", userId, "cards"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const result = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CardData[];
      setCards(result);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { cards, loading };
};

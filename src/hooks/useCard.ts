import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import type { CardData } from "../types";

export const useCard = (userId: string | null, cardId: string | undefined) => {
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !cardId) {
      setCard(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", userId, "cards", cardId),
      (snap) => {
        setCard(snap.exists() ? ({ id: snap.id, ...snap.data() } as CardData) : null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId, cardId]);

  return { card, loading };
};

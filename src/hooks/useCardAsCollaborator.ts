import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import type { CardData } from "../types";

// Like useCard but takes an explicit ownerUid (may differ from the current user).
// Used when a collaborator navigates to a card they don't own.
export const useCardAsCollaborator = (
  ownerUid: string | null,
  cardId: string | undefined,
): { card: CardData | null; loading: boolean } => {
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerUid || !cardId) {
      setCard(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", ownerUid, "cards", cardId),
      (snap) => {
        setCard(
          snap.exists() ? ({ id: snap.id, ...snap.data() } as CardData) : null,
        );
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [ownerUid, cardId]);

  return { card, loading };
};

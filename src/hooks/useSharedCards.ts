import { useEffect, useState } from "react";
import {
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { CardData, SharedCardData, UserProfile } from "../types";

const toShared = (role: "editor" | "viewer") => (d: QueryDocumentSnapshot): SharedCardData => ({
  id: d.id,
  ownerUid: d.ref.parent.parent?.id ?? "",
  ownerDisplayName: null,
  ownerEmail: null,
  role,
  ...(d.data() as Omit<CardData, "id">),
});

export const useSharedCards = (
  email: string | null,
): { sharedCards: SharedCardData[]; loading: boolean } => {
  const [sharedCards, setSharedCards] = useState<SharedCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setSharedCards([]);
      setLoading(false);
      return;
    }

    // Reset so the section shows a spinner while re-fetching (e.g. on page refresh)
    setLoading(true);

    const normalized = email.toLowerCase();
    let editorCards: SharedCardData[] = [];
    let viewerCards: SharedCardData[] = [];
    let editorReady = false;
    let viewerReady = false;

    const merge = () => {
      if (!editorReady || !viewerReady) return;

      const seen = new Set<string>();
      const merged = [...editorCards, ...viewerCards].filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      setSharedCards(merged);
      setLoading(false);

      // Fetch owner display names and emails, then patch into state
      const ownerUids = [...new Set(merged.map((c) => c.ownerUid).filter(Boolean))];
      if (ownerUids.length === 0) return;

      Promise.all(ownerUids.map((uid) => getDoc(doc(db, "users", uid))))
        .then((snaps) => {
          const profiles: Record<string, { displayName: string | null; email: string | null }> = {};
          snaps.forEach((snap, i) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              profiles[ownerUids[i]] = { displayName: data.displayName, email: data.email };
            }
          });
          setSharedCards((prev) =>
            prev.map((c) => ({
              ...c,
              ownerDisplayName: profiles[c.ownerUid]?.displayName ?? null,
              ownerEmail: profiles[c.ownerUid]?.email ?? null,
            })),
          );
        })
        .catch(console.error);
    };

    const unsubEditor = onSnapshot(
      query(collectionGroup(db, "cards"), where("editorEmails", "array-contains", normalized)),
      (snap) => { editorCards = snap.docs.map(toShared("editor")); editorReady = true; merge(); },
      (err) => { console.error("useSharedCards editorEmails:", err); editorReady = true; merge(); },
    );

    const unsubViewer = onSnapshot(
      query(collectionGroup(db, "cards"), where("viewerEmails", "array-contains", normalized)),
      (snap) => { viewerCards = snap.docs.map(toShared("viewer")); viewerReady = true; merge(); },
      (err) => { console.error("useSharedCards viewerEmails:", err); viewerReady = true; merge(); },
    );

    return () => { unsubEditor(); unsubViewer(); };
  }, [email]);

  return { sharedCards, loading };
};

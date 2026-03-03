import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./config";
import type { Goal, CardData } from "../types";

// ─── User Profile ────────────────────────────────────────────────────────────

export const createUserProfile = async (
  uid: string,
  data: { email: string | null; displayName: string | null; photoURL: string | null }
) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  }
};

// ─── Cards ────────────────────────────────────────────────────────────────────

type NewCardInput = {
  name: string;
  gridDim: 3 | 4 | 5 | 6;
  backgroundColor: string;
  gradientKey: string | null;
  goals: Goal[];
};

export const createCard = async (
  userId: string,
  data: NewCardInput
): Promise<string> => {
  const ref = await addDoc(collection(db, "users", userId, "cards"), {
    ...data,
    shareId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateCardMeta = async (
  userId: string,
  cardId: string,
  data: Partial<Pick<CardData, "name" | "backgroundColor" | "gradientKey">>
) => {
  await updateDoc(doc(db, "users", userId, "cards", cardId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const updateGoals = async (
  userId: string,
  cardId: string,
  goals: Goal[]
) => {
  await updateDoc(doc(db, "users", userId, "cards", cardId), {
    goals,
    updatedAt: serverTimestamp(),
  });
};

export const updateGoal = async (
  userId: string,
  cardId: string,
  currentGoals: Goal[],
  goalIndex: number,
  updates: Partial<Goal>
) => {
  const newGoals = currentGoals.map((g, i) =>
    i === goalIndex ? { ...g, ...updates } : g
  );
  await updateGoals(userId, cardId, newGoals);
};

export const deleteCard = async (userId: string, cardId: string) => {
  await deleteDoc(doc(db, "users", userId, "cards", cardId));
};

// ─── Sharing ──────────────────────────────────────────────────────────────────

export const enableSharing = async (
  userId: string,
  cardId: string
): Promise<string> => {
  const shareRef = await addDoc(collection(db, "shares"), {
    userId,
    cardId,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", userId, "cards", cardId), {
    shareId: shareRef.id,
    updatedAt: serverTimestamp(),
  });
  return shareRef.id;
};

export const getShareTarget = async (
  shareId: string
): Promise<{ userId: string; cardId: string } | null> => {
  const snap = await getDoc(doc(db, "shares", shareId));
  if (!snap.exists()) return null;
  return snap.data() as { userId: string; cardId: string };
};

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./config";
import type { Goal, CardData, CollaboratorRole } from "../types";

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
  gridDim: 3 | 5 | 7;
  backgroundColor: string;
  gradientKey: string | null;
  freeImageUrl: string | null;
  freeCellText: string | null;
  freeCellColor: string | null;
  cellStyleColor: string | null;
  goals: Goal[];
};

export const createCard = async (
  userId: string,
  data: NewCardInput
): Promise<string> => {
  const ref = await addDoc(collection(db, "users", userId, "cards"), {
    ...data,
    shareId: null,
    editorEmails: [],
    viewerEmails: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateCardMeta = async (
  userId: string,
  cardId: string,
  data: Partial<Pick<CardData, "name" | "backgroundColor" | "gradientKey" | "freeImageUrl" | "freeCellText" | "freeCellColor" | "cellStyleColor">>
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

// ─── Collaboration ─────────────────────────────────────────────────────────────

export const inviteCollaborator = async (
  ownerUid: string,
  ownerEmail: string,
  cardId: string,
  inviteeEmail: string,
  role: CollaboratorRole,
): Promise<void> => {
  const normalized = inviteeEmail.toLowerCase().trim();
  if (normalized === ownerEmail.toLowerCase().trim()) {
    throw new Error("You cannot invite yourself.");
  }

  const cardRef = doc(db, "users", ownerUid, "cards", cardId);
  const snap = await getDoc(cardRef);
  if (!snap.exists()) throw new Error("Card not found.");

  const data = snap.data() as Pick<CardData, "editorEmails" | "viewerEmails">;
  const editorEmails: string[] = data.editorEmails ?? [];
  const viewerEmails: string[] = data.viewerEmails ?? [];

  if (editorEmails.includes(normalized) || viewerEmails.includes(normalized)) {
    throw new Error("This person already has access.");
  }

  const field = role === "editor" ? "editorEmails" : "viewerEmails";
  await updateDoc(cardRef, {
    [field]: arrayUnion(normalized),
    updatedAt: serverTimestamp(),
  });
};

export const revokeCollaborator = async (
  ownerUid: string,
  cardId: string,
  email: string,
  role: CollaboratorRole,
): Promise<void> => {
  const normalized = email.toLowerCase().trim();
  const field = role === "editor" ? "editorEmails" : "viewerEmails";
  await updateDoc(doc(db, "users", ownerUid, "cards", cardId), {
    [field]: arrayRemove(normalized),
    updatedAt: serverTimestamp(),
  });
};

export const removeSelfFromCard = async (
  ownerUid: string,
  cardId: string,
  email: string,
): Promise<void> => {
  const normalized = email.toLowerCase().trim();
  const cardRef = doc(db, "users", ownerUid, "cards", cardId);

  // Check current state so we only send necessary arrayRemove calls
  const snap = await getDoc(cardRef);
  if (!snap.exists()) return;
  const data = snap.data() as Pick<CardData, "editorEmails" | "viewerEmails">;
  const editorEmails: string[] = data.editorEmails ?? [];
  const viewerEmails: string[] = data.viewerEmails ?? [];

  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (editorEmails.includes(normalized)) updates.editorEmails = arrayRemove(normalized);
  if (viewerEmails.includes(normalized)) updates.viewerEmails = arrayRemove(normalized);

  await updateDoc(cardRef, updates);
};


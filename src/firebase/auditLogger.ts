import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export const logAudit = async (
  userId: string,
  action: string,
  details: Record<string, string | null>
): Promise<void> => {
  try {
    await addDoc(collection(db, "auditLogs"), {
      userId,
      action,
      ...details,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Audit logging must never break the main flow
  }
};

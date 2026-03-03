import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";

export const uploadGoalImage = async (
  userId: string,
  cardId: string,
  goalIndex: number,
  file: File
): Promise<string> => {
  const storageRef = ref(
    storage,
    `users/${userId}/cards/${cardId}/goal_${goalIndex}`
  );
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const deleteGoalImage = async (
  userId: string,
  cardId: string,
  goalIndex: number
): Promise<void> => {
  const storageRef = ref(
    storage,
    `users/${userId}/cards/${cardId}/goal_${goalIndex}`
  );
  await deleteObject(storageRef);
};

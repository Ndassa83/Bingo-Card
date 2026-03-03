import type { Timestamp } from "firebase/firestore";

export type Goal = {
  index: number;
  title: string;
  description: string;
  curCount: number;
  finalCount: number;
  completeDate: string; // "MM/DD/YYYY"
  completed: boolean;
  cellColor: string | null;
  imageUrl: string | null;
  reminderActive: boolean;
};

export type CardData = {
  id: string;
  name: string;
  gridDim: 3 | 4 | 5 | 6;
  backgroundColor: string; // hex
  gradientKey: string | null;
  shareId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  goals: Goal[];
};

export type UserProfile = {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
};

export const GRADIENTS: Record<string, string> = {
  sunset:   "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  ocean:    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  forest:   "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  gold:     "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  midnight: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  fire:     "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
};

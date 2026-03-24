import type { Timestamp } from "firebase/firestore";

export type Goal = {
  index: number;
  title: string;
  description: string;
  curCount: number;
  finalCount: number;
  completeDate: string; // "MM/DD/YYYY"
  completed: boolean;
  completedAt: string | null; // ISO timestamp when goal was actually completed
  cellColor: string | null;
  imageUrl: string | null;
  reminderActive: boolean;
  fontSizeScale: number | null; // per-cell multiplier (0.5–2.0), null = inherit board scale
};

export type CollaboratorRole = "viewer" | "editor";

export type CardData = {
  id: string;
  name: string;
  gridDim: 3 | 5 | 7;
  backgroundColor: string; // hex
  gradientKey: string | null;
  freeImageUrl: string | null;
  freeCellText: string | null;
  freeCellColor: string | null;
  cellStyleColor: string | null;
  fontColor: string | null;
  fontSizeScale: number | null; // board-level multiplier (0.5–2.0), null = 1.0
  shareId: string | null;
  editorEmails: string[];  // lowercase emails with edit access
  viewerEmails: string[];  // lowercase emails with view-only access
  createdAt: Timestamp;
  updatedAt: Timestamp;
  goals: Goal[];
};

// CardData augmented with owner info (ownerUid from path, name/email from users/{uid})
export type SharedCardData = CardData & {
  ownerUid: string;
  ownerDisplayName: string | null;
  ownerEmail: string | null;
  role: CollaboratorRole;
};

export type UserProfile = {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
};

export type GoalNotification = {
  cardId: string;
  cardName: string;
  ownerDisplayName: string | null;
  newlyCompletedGoals: Array<{ index: number; title: string; completedAt: string | null }>;
};

export const GRADIENTS: Record<string, string> = {
  sunset:   "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  ocean:    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  forest:   "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  gold:     "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  midnight: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  fire:     "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
  aurora:   "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  royal:    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  peach:    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  mint:     "linear-gradient(135deg, #a1ffce 0%, #faffd1 100%)",
  dusk:     "linear-gradient(135deg, #2c3e50 0%, #fd746c 100%)",
  cosmos:   "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
  spring:   "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
  electric: "linear-gradient(135deg, #0099f7 0%, #f11712 100%)",
  candy:    "linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)",
  steel:    "linear-gradient(135deg, #616161 0%, #9bc5c3 100%)",
};

export const CELL_GRADIENTS: Record<string, string> = {
  rose:    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  sky:     "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  lime:    "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  amber:   "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  violet:  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  teal:    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  blush:   "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  fire:    "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
  slate:   "linear-gradient(135deg, #434343 0%, #000000 100%)",
  royal:   "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
};

export const CELL_SOLID_COLORS: string[] = [
  "#ffffff", "#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3",
  "#fee2e2", "#ede9fe", "#ffedd5", "#e0f2fe", "#fdf4ff",
  "#1e40af", "#15803d", "#9f1239", "#7e22ce", "#c2410c",
  "#0369a1", "#374151", "#1a1a1a",
];

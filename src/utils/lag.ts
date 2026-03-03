import type { Goal } from "../types";
import type { Timestamp } from "firebase/firestore";

type LagStatus = "on-track" | "behind" | "far-behind";

const parseMDY = (dateStr: string): Date => {
  const [m, d, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
};

const daysBetween = (a: Date, b: Date): number =>
  Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86_400_000));

export const getLagStatus = (
  goal: Goal,
  cardCreatedAt: Timestamp
): LagStatus => {
  if (goal.completed || goal.finalCount <= 1) return "on-track";

  const start = cardCreatedAt.toDate();
  const end = parseMDY(goal.completeDate);
  const today = new Date();

  const totalDays = daysBetween(start, end);
  const elapsed = daysBetween(start, today);

  if (totalDays <= 0 || elapsed <= 0) return "on-track";

  const expected = goal.finalCount * (elapsed / totalDays);
  if (expected <= 0) return "on-track";

  const ratio = goal.curCount / expected;
  if (ratio < 0.7) return "far-behind";
  if (ratio < 1.0) return "behind";
  return "on-track";
};

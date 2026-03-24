import { useEffect, useRef, useState } from "react";
import type { GoalNotification, SharedCardData } from "../types";

const SNAPSHOT_KEY = "bingo_notify_snapshot";

type SnapshotEntry = { completedIndices: number[] };
type Snapshot = Record<string, SnapshotEntry>;

function loadSnapshot(): Snapshot {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as Snapshot) : {};
  } catch {
    return {};
  }
}

function saveSnapshot(snapshot: Snapshot): void {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export const useNotifications = (
  sharedCards: SharedCardData[],
  loading: boolean,
): { notifications: GoalNotification[]; dismiss: () => void } => {
  const [notifications, setNotifications] = useState<GoalNotification[]>([]);
  const hasComputed = useRef(false);

  useEffect(() => {
    if (loading || hasComputed.current) return;
    hasComputed.current = true;

    const snapshot = loadSnapshot();
    const newNotifications: GoalNotification[] = [];
    const updatedSnapshot: Snapshot = { ...snapshot };

    for (const card of sharedCards) {
      const completedNow = card.goals.filter((g) => g.completed);
      updatedSnapshot[card.id] = { completedIndices: completedNow.map((g) => g.index) };

      const prevEntry = snapshot[card.id];
      const prevSet = new Set(prevEntry?.completedIndices ?? []);

      // If no previous snapshot: card is new to this user — notify about all
      // already-completed goals so they see the current state of the board.
      // If snapshot exists: only notify about goals completed since last visit.
      const newlyCompleted = completedNow.filter((g) => !prevSet.has(g.index));

      if (newlyCompleted.length > 0) {
        newNotifications.push({
          cardId: card.id,
          cardName: card.name,
          ownerDisplayName: card.ownerDisplayName,
          newlyCompletedGoals: newlyCompleted.map((g) => ({
            index: g.index,
            title: g.title,
            completedAt: g.completedAt ?? null,
          })),
        });
      }
    }

    saveSnapshot(updatedSnapshot);
    setNotifications(newNotifications);
  }, [sharedCards, loading]);

  const dismiss = () => setNotifications([]);

  return { notifications, dismiss };
};

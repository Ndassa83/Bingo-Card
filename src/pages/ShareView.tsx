import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { getShareTarget } from "../firebase/firestore";
import { BingoCard } from "../BingoCard";
import type { CardData } from "../types";
import { GRADIENTS } from "../types";

export const ShareView = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return; }

    let unsubscribe: (() => void) | undefined;

    getShareTarget(shareId).then((target) => {
      if (!target) { setNotFound(true); setLoading(false); return; }

      unsubscribe = onSnapshot(
        doc(db, "users", target.userId, "cards", target.cardId),
        (snap) => {
          setCard(snap.exists() ? ({ id: snap.id, ...snap.data() } as CardData) : null);
          setLoading(false);
        }
      );
    });

    return () => unsubscribe?.();
  }, [shareId]);

  // Build marked array from completed goals — read-only, no interaction
  const marked = useMemo(() => {
    if (!card) return [];
    const { gridDim, goals } = card;
    const total = gridDim * gridDim;
    const freeIdx = Math.floor(gridDim / 2) * gridDim + Math.floor(gridDim / 2);
    let gi = 0;
    return Array.from({ length: total }, (_, i) => {
      if (i === freeIdx) return true;
      return goals[gi++]?.completed ?? false;
    });
  }, [card]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !card) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">This share link is invalid or has been removed.</Typography>
      </Box>
    );
  }

  const background = card.gradientKey
    ? GRADIENTS[card.gradientKey] ?? card.backgroundColor
    : card.backgroundColor;

  const completed = card.goals.filter((g) => g.completed).length;
  const total = card.goals.length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "grey.200",
          bgcolor: "white",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={900}
          sx={{
            color: "#1565C0",
          }}
        >
          Resolution Bingo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Read-only view
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 4 }, py: 3, maxWidth: 800, mx: "auto" }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          {card.name}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {completed}/{total} goals completed
        </Typography>

        <Box
          sx={{
            background,
            borderRadius: 3,
            p: { xs: 1, sm: 2 },
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          }}
        >
          {/* Read-only: onCellClick is a no-op */}
          <BingoCard card={card} marked={marked} onCellClick={() => {}} />
        </Box>
      </Box>
    </Box>
  );
};

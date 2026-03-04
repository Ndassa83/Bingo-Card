import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import type { CardData, Goal } from "./types";
import { BingoCell } from "./components/BingoCell";
import { getLagStatus } from "./utils/lag";

type BingoCardProps = {
  card: CardData;
  marked: boolean[];
  onCellClick: (goalIndex: number | null) => void; // null = FREE cell
};

function buildCells(goals: Goal[], gridDim: number): (Goal | null)[] {
  const total = gridDim * gridDim;
  const freeIdx = Math.floor(gridDim / 2) * gridDim + Math.floor(gridDim / 2);
  const cells: (Goal | null)[] = [];
  let gi = 0;
  for (let i = 0; i < total; i++) {
    cells.push(i === freeIdx ? null : goals[gi++]);
  }
  return cells;
}

function getBingoIndices(marked: boolean[], gridDim: number): Set<number> {
  const winning = new Set<number>();
  const check = (indices: number[]) => {
    if (indices.every((i) => marked[i])) indices.forEach((i) => winning.add(i));
  };
  for (let r = 0; r < gridDim; r++) {
    check(Array.from({ length: gridDim }, (_, c) => r * gridDim + c));
  }
  for (let c = 0; c < gridDim; c++) {
    check(Array.from({ length: gridDim }, (_, r) => r * gridDim + c));
  }
  check(Array.from({ length: gridDim }, (_, i) => i * gridDim + i));
  check(
    Array.from({ length: gridDim }, (_, i) => i * gridDim + (gridDim - 1 - i)),
  );
  return winning;
}

export const BingoCard = ({ card, marked, onCellClick }: BingoCardProps) => {
  const { gridDim, goals, createdAt } = card;

  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const cells = useMemo(() => buildCells(goals, gridDim), [goals, gridDim]);
  const bingoSet = useMemo(
    () => getBingoIndices(marked, gridDim),
    [marked, gridDim],
  );
  const hasBingo = bingoSet.size > 0;

  const fontSize =
    gridDim >= 5 ? "0.5rem" : gridDim === 4 ? "0.6rem" : "0.7rem";

  const freeIdx = Math.floor(gridDim / 2) * gridDim + Math.floor(gridDim / 2);
  let goalCounter = 0;
  const cellToGoalIndex: (number | null)[] = cells.map((_, i) =>
    i === freeIdx ? null : goalCounter++,
  );

  return (
    <Box sx={{ p: { xs: 0, sm: 2 } }}>
      {hasBingo && (
        <Typography
          variant="h3"
          align="center"
          fontWeight={900}
          sx={{
            mb: 2,
            background: "linear-gradient(135deg, #43e97b, #38f9d7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 6,
          }}
        >
          BINGO!
        </Typography>
      )}

      <Box
        id="bingo-card-grid"
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridDim}, 1fr)`,
          gap: 0.75,
          width: "100%",
        }}
      >
        {cells.map((cell, i) => {
          const goalIdx = cellToGoalIndex[i];
          return (
            <BingoCell
              key={i}
              goal={cell}
              marked={marked[i]}
              inBingo={bingoSet.has(i)}
              lagStatus={
                cell && goalIdx !== null && createdAt
                  ? getLagStatus(cell, createdAt)
                  : undefined
              }
              fontSize={fontSize}
              freeImageUrl={
                cell === null ? (card.freeImageUrl ?? null) : undefined
              }
              onClick={() => onCellClick(goalIdx)}
            />
          );
        })}
      </Box>

      {/* Progress stats */}
      <Box sx={{ mt: 1.5, px: { xs: 0.5, sm: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            {completedCount} / {totalCount} goals completed
          </Typography>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            {pct}%
          </Typography>
        </Box>
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <Box
            sx={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, #f093fb, #f5576c)",
              borderRadius: 3,
              transition: "width 0.4s ease",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

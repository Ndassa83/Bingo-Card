import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Goal } from "../types";
import { getContrastColor } from "../utils/contrast";

type LagStatus = "on-track" | "behind" | "far-behind";

type BingoCellProps = {
  goal: Goal | null; // null = FREE cell
  marked: boolean;
  inBingo: boolean;
  lagStatus?: LagStatus;
  fontSize?: string;
  freeImageUrl?: string | null;
  freeCellLabel?: string;
  freeCellColor?: string | null;
  cellStyleColor?: string | null;
  onClick: () => void;
};

export const BingoCell = ({
  goal,
  marked,
  inBingo,
  lagStatus,
  fontSize = "0.75rem",
  freeImageUrl,
  freeCellLabel,
  freeCellColor,
  cellStyleColor,
  onClick,
}: BingoCellProps) => {
  const isFree = goal === null;

  const bgColor = (() => {
    if (isFree && freeCellColor) return freeCellColor;
    if (goal?.cellColor) return goal.cellColor;
    if (inBingo) return "#d4edda";
    if (marked) return "#e8f4fd";
    // Partial left-to-right fill for in-progress multi-count goals
    if (goal && goal.finalCount > 1 && goal.curCount > 0 && !goal.completed) {
      const pct = Math.min(
        100,
        Math.round((goal.curCount / goal.finalCount) * 100),
      );
      return `linear-gradient(to right, rgba(76,175,80,0.3) ${pct}%, ${cellStyleColor ?? "white"} ${pct}%)`;
    }
    return cellStyleColor ?? "white";
  })();

  const borderColor = inBingo ? "#28a745" : marked ? "#2196f3" : "#e0e0e0";

  const textColor = goal?.cellColor
    ? getContrastColor(goal.cellColor)
    : cellStyleColor
    ? getContrastColor(cellStyleColor)
    : undefined;

  const lagDot: Record<Exclude<LagStatus, "on-track">, string> = {
    behind: "#ff9800",
    "far-behind": "#f44336",
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        aspectRatio: "1",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 0.75,
        background: bgColor,
        border: "2px solid",
        borderColor,
        borderRadius: 1.5,
        cursor: isFree ? "default" : "pointer",
        transition: "all 0.15s ease",
        userSelect: "none",
        overflow: "hidden",
        boxShadow: inBingo
          ? "0 0 0 3px rgba(40,167,69,0.3)"
          : marked
            ? "0 0 0 3px rgba(33,150,243,0.2)"
            : "0 1px 4px rgba(0,0,0,0.08)",
        "&:hover": isFree
          ? {}
          : {
              transform: "scale(1.04)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
      }}
    >
      {/* Lag indicator dot */}
      {!isFree && !goal?.completed && lagStatus && lagStatus !== "on-track" && (
        <Box
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: lagDot[lagStatus],
            boxShadow: `0 0 4px ${lagDot[lagStatus]}`,
          }}
        />
      )}

      {/* Completion checkmark */}
      {marked && !isFree && (
        <CheckCircleIcon
          sx={{
            position: "absolute",
            top: 3,
            left: 3,
            fontSize: "0.9rem",
            color: inBingo ? "#28a745" : "#2196f3",
            opacity: 0.8,
          }}
        />
      )}

      {isFree ? (
        <>
          {freeImageUrl && (
            <Box
              component="img"
              src={freeImageUrl}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.75,
                borderRadius: 1,
              }}
            />
          )}
          <Typography
            sx={{
              position: "relative",
              fontSize,
              fontWeight: 800,
              color: freeImageUrl ? "white" : freeCellColor ? getContrastColor(freeCellColor) : "text.secondary",
              letterSpacing: 1,
              textShadow: freeImageUrl ? "0 1px 3px rgba(0,0,0,0.5)" : "none",
              textAlign: "center",
              lineHeight: 1.2,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {freeCellLabel ?? "FREE"}
          </Typography>
        </>
      ) : (
        <>
          {/* Image thumbnail */}
          {goal?.imageUrl && (
            <Box
              component="img"
              src={goal.imageUrl}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: marked ? 0.8 : 0.6,
                borderRadius: 1,
              }}
            />
          )}

          <Typography
            sx={{
              position: "relative",
              fontSize,
              fontWeight: marked ? 900 : 700,
              lineHeight: 1.2,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              color: textColor ?? (marked ? "text.primary" : "text.secondary"),
            }}
          >
            {goal?.title || "(untitled)"}
          </Typography>

          {goal && goal.finalCount > 1 && (
            <Typography
              sx={{
                position: "relative",
                fontSize: "0.6rem",
                mt: 0.5,
                color: textColor ? `${textColor}99` : "text.disabled",
                fontWeight: 600,
              }}
            >
              {goal.curCount}/{goal.finalCount}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

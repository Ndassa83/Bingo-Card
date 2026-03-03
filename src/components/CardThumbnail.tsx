import { Box, Card, CardActionArea, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { GRADIENTS } from "../types";
import type { CardData } from "../types";

type CardThumbnailProps = {
  card: CardData;
  onClick: () => void;
  onDelete: () => void;
};

export const CardThumbnail = ({ card, onClick, onDelete }: CardThumbnailProps) => {
  const background = card.gradientKey
    ? GRADIENTS[card.gradientKey] ?? card.backgroundColor
    : card.backgroundColor;

  const completed = card.goals.filter((g) => g.completed).length;
  const total = card.goals.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        "&:hover .delete-btn": { opacity: 1 },
      }}
      elevation={3}
    >
      <CardActionArea onClick={onClick}>
        {/* Mini grid preview */}
        <Box
          sx={{
            height: 140,
            background,
            display: "grid",
            gridTemplateColumns: `repeat(${card.gridDim}, 1fr)`,
            gap: 0.5,
            p: 1,
          }}
        >
          {card.goals.slice(0, card.gridDim * card.gridDim - 1).map((goal, i) => (
            <Box
              key={i}
              sx={{
                borderRadius: 0.5,
                bgcolor: goal.completed
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {goal.imageUrl && (
                <Box
                  component="img"
                  src={goal.imageUrl}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Card info */}
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={700} noWrap>
            {card.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {card.gridDim}×{card.gridDim} · {completed}/{total} goals · {pct}%
          </Typography>
          {/* Progress bar */}
          <Box
            sx={{
              mt: 1,
              height: 4,
              borderRadius: 2,
              bgcolor: "grey.200",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, #f093fb, #f5576c)",
                borderRadius: 2,
                transition: "width 0.4s ease",
              }}
            />
          </Box>
        </Box>
      </CardActionArea>

      {/* Delete button */}
      <IconButton
        className="delete-btn"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          bgcolor: "rgba(0,0,0,0.4)",
          color: "white",
          opacity: 0,
          transition: "opacity 0.2s",
          "&:hover": { bgcolor: "rgba(200,0,0,0.7)" },
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Card>
  );
};

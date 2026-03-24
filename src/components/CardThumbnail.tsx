import { Box, Card, CardActionArea, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PeopleIcon from "@mui/icons-material/People";
import { GRADIENTS } from "../types";
import type { CardData } from "../types";

type CardThumbnailProps = {
  card: CardData;
  onClick: () => void;
  onDelete: () => void;
  onShare?: () => void;
  variant?: "grid" | "list";
  isShared?: boolean;
  ownerDisplayName?: string | null;
  ownerEmail?: string | null;
};

export const CardThumbnail = ({ card, onClick, onDelete, onShare, variant = "grid", isShared = false, ownerDisplayName, ownerEmail }: CardThumbnailProps) => {
  const background = card.gradientKey
    ? GRADIENTS[card.gradientKey] ?? card.backgroundColor
    : card.backgroundColor;

  const completed = card.goals.filter((g) => g.completed).length;
  const total = card.goals.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Build the full grid with FREE cell at center
  const gridTotal = card.gridDim * card.gridDim;
  const freeIdx = Math.floor(card.gridDim / 2) * card.gridDim + Math.floor(card.gridDim / 2);
  let gi = 0;
  const gridCells = Array.from({ length: gridTotal }, (_, i) => {
    if (i === freeIdx) return { isFree: true, goal: null as (typeof card.goals)[0] | null };
    return { isFree: false, goal: card.goals[gi++] ?? null };
  });

  const miniGrid = (size: number) => (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        background,
        display: "grid",
        gridTemplateColumns: `repeat(${card.gridDim}, 1fr)`,
        gridTemplateRows: `repeat(${card.gridDim}, 1fr)`,
        gap: 0.25,
        p: 0.5,
        borderRadius: variant === "list" ? "8px 0 0 8px" : 1,
      }}
    >
      {gridCells.map((cell, i) => (
        <Box
          key={i}
          sx={{
            borderRadius: 0.25,
            bgcolor: cell.isFree
              ? "rgba(255,255,255,0.9)"
              : cell.goal?.completed
              ? "rgba(255,255,255,0.8)"
              : "rgba(255,255,255,0.25)",
            overflow: "hidden",
          }}
        >
          {cell.isFree && card.freeImageUrl ? (
            <Box
              component="img"
              src={card.freeImageUrl}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : !cell.isFree && cell.goal?.imageUrl ? (
            <Box
              component="img"
              src={cell.goal.imageUrl}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </Box>
      ))}
    </Box>
  );

  if (variant === "list") {
    return (
      <Card
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
          "&:hover .delete-btn": { opacity: 1 },
          "&:hover .share-btn": { opacity: 1 },
        }}
        elevation={2}
      >
        <CardActionArea
          onClick={onClick}
          sx={{ display: "flex", flexDirection: "row", alignItems: "stretch", p: 0 }}
        >
          {/* Mini grid */}
          {miniGrid(90)}

          {/* Info */}
          <Box
            sx={{
              flex: 1,
              px: 2,
              py: 1.5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <Typography fontWeight={700} noWrap>
              {card.name}
            </Typography>
            {isShared && (ownerDisplayName || ownerEmail) && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontStyle: "italic" }}>
                {ownerDisplayName ?? ownerEmail}
                {ownerDisplayName && ownerEmail ? ` · ${ownerEmail}` : ""}
              </Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {card.gridDim}×{card.gridDim} · {completed}/{total} goals · {pct}%
              </Typography>
              {isShared && (
                <Chip
                  icon={<PeopleIcon sx={{ fontSize: "0.75rem !important" }} />}
                  label="Shared"
                  size="small"
                  sx={{ height: 16, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.75 } }}
                />
              )}
            </Box>
            <Box
              sx={{
                mt: 0.75,
                height: 3,
                borderRadius: 2,
                bgcolor: "grey.200",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #1565C0, #F9A825)",
                  borderRadius: 2,
                  transition: "width 0.4s ease",
                }}
              />
            </Box>
          </Box>

          {/* Arrow */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              pr: 5,
              color: "text.disabled",
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: "0.85rem" }} />
          </Box>
        </CardActionArea>

        {/* Share with Friends button — owner cards only */}
        {!isShared && onShare && (
          <Tooltip title="Share with Friends">
            <IconButton
              className="share-btn"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              sx={{
                position: "absolute",
                top: "50%",
                right: 40,
                transform: "translateY(-50%)",
                bgcolor: "rgba(21,101,192,0.75)",
                color: "white",
                opacity: { xs: 1, sm: 0 },
                transition: "opacity 0.2s",
                "&:hover": { bgcolor: "#1565C0" },
              }}
            >
              <PeopleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Delete / Remove button */}
        <Tooltip title={isShared ? "Remove from my dashboard" : "Delete card"}>
          <IconButton
            className="delete-btn"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(0,0,0,0.3)",
              color: "white",
              opacity: { xs: 1, sm: 0 },
              transition: "opacity 0.2s",
              "&:hover": { bgcolor: "rgba(200,0,0,0.7)" },
            }}
          >
            {isShared ? <PersonRemoveIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Card>
    );
  }

  // ── Grid variant (original layout) ───────────────────────────────────
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
            gridTemplateRows: `repeat(${card.gridDim}, 1fr)`,
            gap: 0.5,
            p: 1,
          }}
        >
          {gridCells.map((cell, i) => (
            <Box
              key={i}
              sx={{
                borderRadius: 0.5,
                bgcolor: cell.isFree
                  ? "rgba(255,255,255,0.9)"
                  : cell.goal?.completed
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {cell.isFree && card.freeImageUrl ? (
                <Box
                  component="img"
                  src={card.freeImageUrl}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : !cell.isFree && cell.goal?.imageUrl ? (
                <Box
                  component="img"
                  src={cell.goal.imageUrl}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
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
          <Box sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: "grey.200", overflow: "hidden" }}>
            <Box
              sx={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, #1565C0, #F9A825)",
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
          opacity: { xs: 1, sm: 0 },
          transition: "opacity 0.2s",
          "&:hover": { bgcolor: "rgba(200,0,0,0.7)" },
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Card>
  );
};

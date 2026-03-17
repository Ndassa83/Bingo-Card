import { useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/Edit";
import type { Goal } from "../types";
import { CELL_GRADIENTS, CELL_SOLID_COLORS } from "../types";
import { getContrastColor } from "../utils/contrast";

type GoalModalProps = {
  goal: Goal;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Goal>) => void;
  onImageUpload?: (file: File) => void;
};

export const GoalModal = ({
  goal,
  open,
  onClose,
  onUpdate,
  onImageUpload,
}: GoalModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDescription, setEditDescription] = useState(goal.description);
  const [editFinalCount, setEditFinalCount] = useState(goal.finalCount);
  const [editDate, setEditDate] = useState(goal.completeDate);
  const [editCellColor, setEditCellColor] = useState<string | null>(goal.cellColor);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pct =
    goal.finalCount > 1
      ? Math.min(100, Math.round((goal.curCount / goal.finalCount) * 100))
      : goal.completed
      ? 100
      : 0;

  const handleIncrement = () => {
    const newCount = Math.min(goal.curCount + 1, goal.finalCount);
    onUpdate({ curCount: newCount, completed: newCount >= goal.finalCount });
  };

  const handleDecrement = () => {
    onUpdate({ curCount: Math.max(0, goal.curCount - 1), completed: false });
  };

  const handleCountInput = (raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return;
    const clamped = Math.max(0, Math.min(n, goal.finalCount));
    onUpdate({ curCount: clamped, completed: clamped >= goal.finalCount });
  };

  const handleToggleComplete = () => {
    if (goal.finalCount === 1) {
      onUpdate({ completed: !goal.completed, curCount: goal.completed ? 0 : 1 });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) onImageUpload(file);
    // Reset input so same file can be re-selected if needed
    e.target.value = "";
  };

  const handleEditOpen = () => {
    setEditTitle(goal.title);
    setEditDescription(goal.description);
    setEditFinalCount(goal.finalCount);
    setEditDate(goal.completeDate);
    setEditCellColor(goal.cellColor);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const newFinalCount = Math.max(1, editFinalCount);
    const newCurCount = Math.min(goal.curCount, newFinalCount);
    onUpdate({
      title: editTitle.trim() || goal.title,
      description: editDescription,
      finalCount: newFinalCount,
      curCount: newCurCount,
      completeDate: editDate,
      completed: newCurCount >= newFinalCount,
      cellColor: editCellColor,
    });
    setIsEditing(false);
  };

  // Convert MM/DD/YYYY ↔ YYYY-MM-DD for the date input
  const toInputDate = (d: string) => {
    const [m, day, y] = d.split("/");
    if (!y) return "";
    return `${y}-${m?.padStart(2, "0")}-${day?.padStart(2, "0")}`;
  };
  const fromInputDate = (d: string) => {
    const [y, m, day] = d.split("-");
    if (y && m && day) return `${m}/${day}/${y}`;
    return editDate;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}
      >
        <Typography fontWeight={700} fontSize="1.1rem" sx={{ pr: 1 }}>
          {isEditing ? "Edit Goal" : goal.title || "(untitled)"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {!isEditing && (
            <IconButton size="small" onClick={handleEditOpen}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Hidden file input — triggered imperatively via ref */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {isEditing ? (
          // ── Edit mode ──────────────────────────────────────────────────
          <>
            <TextField
              label="Goal title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Details (optional)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                How many times?
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setEditFinalCount((n) => Math.max(1, n - 1))}
                  sx={{ border: "1px solid", borderColor: "grey.300" }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <TextField
                  size="small"
                  type="number"
                  value={editFinalCount}
                  onChange={(e) =>
                    setEditFinalCount(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  inputProps={{ min: 1, max: 365, style: { textAlign: "center" } }}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => setEditFinalCount((n) => Math.min(365, n + 1))}
                  sx={{ border: "1px solid", borderColor: "grey.300" }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <TextField
              label="Target date"
              type="date"
              value={toInputDate(editDate)}
              onChange={(e) => setEditDate(fromInputDate(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            {/* Cell color picker */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cell color (optional)
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }}>
                {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
                  <Box
                    key={key}
                    onClick={() => setEditCellColor(editCellColor === value ? null : value)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1.5,
                      background: value,
                      cursor: "pointer",
                      border: editCellColor === value ? "3px solid #333" : "3px solid transparent",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.12)" },
                    }}
                    title={key}
                  />
                ))}
              </Box>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {CELL_SOLID_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setEditCellColor(editCellColor === color ? null : color)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1.5,
                      bgcolor: color,
                      cursor: "pointer",
                      border: editCellColor === color ? "3px solid #333" : "3px solid #e0e0e0",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.12)" },
                    }}
                  />
                ))}
              </Box>
              {editCellColor && (
                <Box
                  sx={{
                    mt: 1.5,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    background: editCellColor,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: getContrastColor(editCellColor) }}
                  >
                    Preview
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setEditCellColor(null)}
                    sx={{
                      minWidth: 0,
                      p: 0,
                      fontSize: "0.65rem",
                      color: getContrastColor(editCellColor),
                      textDecoration: "underline",
                      "&:hover": { background: "none" },
                    }}
                  >
                    clear
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleEditSave}
                sx={{
                  bgcolor: "#1565C0",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#0D47A1" },
                }}
              >
                Save
              </Button>
            </Box>
          </>
        ) : (
          // ── Progress / view mode ────────────────────────────────────────
          <>
            {/* Description */}
            {goal.description && (
              <Typography variant="body2" color="text.secondary">
                {goal.description}
              </Typography>
            )}

            {/* Image */}
            {goal.imageUrl ? (
              <Box>
                <Box
                  component="img"
                  src={goal.imageUrl}
                  sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 2, mb: 1 }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change photo
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    color="error"
                    onClick={() => onUpdate({ imageUrl: null })}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderStyle: "dashed", color: "text.secondary" }}
              >
                + Add a photo
              </Button>
            )}

            {/* Progress */}
            {goal.finalCount > 1 ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {goal.curCount} / {goal.finalCount} ({pct}%)
                  </Typography>
                </Box>
                <Box
                  sx={{ height: 8, bgcolor: "grey.200", borderRadius: 4, overflow: "hidden", mb: 2 }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "linear-gradient(90deg, #1565C0, #F9A825)",
                      borderRadius: 4,
                      transition: "width 0.3s ease",
                    }}
                  />
                </Box>

                {/* Counter controls */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={handleDecrement}
                    disabled={goal.curCount <= 0}
                    sx={{ border: "1px solid", borderColor: "grey.300" }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>

                  <TextField
                    size="small"
                    value={goal.curCount}
                    onChange={(e) => handleCountInput(e.target.value)}
                    inputProps={{ style: { textAlign: "center", width: 48 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" color="text.disabled">
                            /{goal.finalCount}
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <IconButton
                    size="small"
                    onClick={handleIncrement}
                    disabled={goal.curCount >= goal.finalCount}
                    sx={{
                      border: "1px solid",
                      borderColor: "grey.300",
                      bgcolor: "primary.light",
                      color: "primary.main",
                      "&:hover": { bgcolor: "primary.main", color: "white" },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              // Single-completion goal
              <Button
                variant={goal.completed ? "contained" : "outlined"}
                fullWidth
                onClick={handleToggleComplete}
                sx={
                  goal.completed
                    ? {
                        bgcolor: "#F9A825",
                        fontWeight: 700,
                      }
                    : { fontWeight: 700 }
                }
              >
                {goal.completed ? "Completed! (undo)" : "Mark as Complete"}
              </Button>
            )}

            {/* Target date */}
            <Typography variant="caption" color="text.disabled">
              Target: {goal.completeDate}
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

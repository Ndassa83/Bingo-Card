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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
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
  readOnly?: boolean;
};

type SwatchProps = {
  background: string;
  selected: boolean;
  label: string;
  onClick: () => void;
};

const Swatch = ({ background, selected, label, onClick }: SwatchProps) => (
  <Box
    component="button"
    aria-label={label}
    aria-pressed={selected}
    onClick={onClick}
    onKeyDown={(e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    }}
    sx={{
      width: 44,
      height: 44,
      minWidth: 44,
      borderRadius: 1.5,
      background,
      cursor: "pointer",
      border: selected ? "3px solid #333" : "3px solid transparent",
      transition: "transform 0.15s",
      outline: "none",
      padding: 0,
      "&:hover": { transform: "scale(1.12)" },
      "&:focus-visible": { outline: "2px solid #1565C0", outlineOffset: 2 },
    }}
    title={label}
  />
);

const SolidSwatch = ({ background, selected, label, onClick }: SwatchProps) => (
  <Box
    component="button"
    aria-label={label}
    aria-pressed={selected}
    onClick={onClick}
    onKeyDown={(e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    }}
    sx={{
      width: 44,
      height: 44,
      minWidth: 44,
      borderRadius: 1.5,
      bgcolor: background,
      cursor: "pointer",
      border: selected ? "3px solid #333" : "3px solid #e0e0e0",
      transition: "transform 0.15s",
      outline: "none",
      padding: 0,
      "&:hover": { transform: "scale(1.12)" },
      "&:focus-visible": { outline: "2px solid #1565C0", outlineOffset: 2 },
    }}
    title={label}
  />
);

// MM/DD/YYYY → Dayjs
const parseMDY = (d: string): Dayjs | null => {
  const [m, day, y] = d.split("/");
  if (!y) return null;
  return dayjs(`${y}-${m?.padStart(2, "0")}-${day?.padStart(2, "0")}`);
};

// Dayjs → MM/DD/YYYY
const toDMY = (d: Dayjs | null): string => {
  if (!d || !d.isValid()) return "";
  return d.format("MM/DD/YYYY");
};

export const GoalModal = ({
  goal,
  open,
  onClose,
  onUpdate,
  onImageUpload,
  readOnly = false,
}: GoalModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDescription, setEditDescription] = useState(goal.description);
  const [editFinalCount, setEditFinalCount] = useState(goal.finalCount);
  const [editDate, setEditDate] = useState<Dayjs | null>(parseMDY(goal.completeDate));
  const [editCellColor, setEditCellColor] = useState<string | null>(goal.cellColor);
  const [editFontSizeScale, setEditFontSizeScale] = useState<number>(goal.fontSizeScale ?? 1.0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimistic local counter state for view mode
  const [localCount, setLocalCount] = useState(goal.curCount);
  const [localCompleted, setLocalCompleted] = useState(goal.completed);

  // Keep in sync when parent updates (e.g. from Firebase)
  const syncedCount = goal.curCount;
  const syncedCompleted = goal.completed;
  if (localCount !== syncedCount && !isEditing) {
    setLocalCount(syncedCount);
  }
  if (localCompleted !== syncedCompleted && !isEditing) {
    setLocalCompleted(syncedCompleted);
  }

  const pct =
    goal.finalCount > 1
      ? Math.min(100, Math.round((localCount / goal.finalCount) * 100))
      : localCompleted
      ? 100
      : 0;

  const handleIncrement = () => {
    const newCount = Math.min(localCount + 1, goal.finalCount);
    const newCompleted = newCount >= goal.finalCount;
    setLocalCount(newCount);
    setLocalCompleted(newCompleted);
    onUpdate({
      curCount: newCount,
      completed: newCompleted,
      completedAt: newCompleted && !goal.completed ? new Date().toISOString() : goal.completedAt,
    });
  };

  const handleDecrement = () => {
    const newCount = Math.max(0, localCount - 1);
    setLocalCount(newCount);
    setLocalCompleted(false);
    onUpdate({ curCount: newCount, completed: false, completedAt: null });
  };

  const handleCountInput = (raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return;
    const clamped = Math.max(0, Math.min(n, goal.finalCount));
    const newCompleted = clamped >= goal.finalCount;
    setLocalCount(clamped);
    setLocalCompleted(newCompleted);
    onUpdate({
      curCount: clamped,
      completed: newCompleted,
      completedAt: newCompleted && !goal.completed ? new Date().toISOString() : (newCompleted ? goal.completedAt : null),
    });
  };

  const handleToggleComplete = () => {
    if (goal.finalCount === 1) {
      const newCompleted = !localCompleted;
      setLocalCompleted(newCompleted);
      setLocalCount(newCompleted ? 1 : 0);
      onUpdate({
        completed: newCompleted,
        curCount: newCompleted ? 1 : 0,
        completedAt: newCompleted ? new Date().toISOString() : null,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) onImageUpload(file);
    e.target.value = "";
  };

  const handleEditOpen = () => {
    setEditTitle(goal.title);
    setEditDescription(goal.description);
    setEditFinalCount(goal.finalCount);
    setEditDate(parseMDY(goal.completeDate));
    setEditCellColor(goal.cellColor);
    setEditFontSizeScale(goal.fontSizeScale ?? 1.0);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const newFinalCount = Math.max(1, editFinalCount);
    const newCurCount = Math.min(goal.curCount, newFinalCount);
    const newCompleted = newCurCount >= newFinalCount;
    onUpdate({
      title: editTitle.trim() || goal.title,
      description: editDescription,
      finalCount: newFinalCount,
      curCount: newCurCount,
      completeDate: toDMY(editDate) || goal.completeDate,
      completed: newCompleted,
      completedAt: newCompleted && !goal.completed
        ? new Date().toISOString()
        : (!newCompleted ? null : goal.completedAt),
      cellColor: editCellColor,
      fontSizeScale: editFontSizeScale === 1.0 ? null : editFontSizeScale,
    });
    setIsEditing(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}
        >
          <Typography fontWeight={700} fontSize="1.1rem" sx={{ pr: 1 }}>
            {isEditing ? "Edit Goal" : goal.title || "(untitled)"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            {!isEditing && !readOnly && (
              <IconButton size="small" onClick={handleEditOpen} aria-label="Edit goal">
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={onClose} aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Hidden file input */}
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
                inputProps={{ maxLength: 200 }}
              />
              <TextField
                label="Details (optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                inputProps={{ maxLength: 500 }}
              />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  How many times?
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setEditFinalCount((n) => Math.max(1, n - 1))}
                    aria-label="Decrease count"
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
                    aria-label="Increase count"
                    sx={{ border: "1px solid", borderColor: "grey.300" }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <DatePicker
                label="Target date"
                value={editDate}
                onChange={(d) => setEditDate(d)}
                slotProps={{
                  textField: { size: "small", fullWidth: true },
                }}
              />

              {/* Cell color picker */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cell color (optional)
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }} role="radiogroup" aria-label="Cell gradient">
                  {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
                    <Swatch
                      key={key}
                      background={value}
                      selected={editCellColor === value}
                      label={`${key} gradient`}
                      onClick={() => setEditCellColor(editCellColor === value ? null : value)}
                    />
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }} role="radiogroup" aria-label="Cell solid color">
                  {CELL_SOLID_COLORS.map((color) => (
                    <SolidSwatch
                      key={color}
                      background={color}
                      selected={editCellColor === color}
                      label={`Cell color ${color}`}
                      onClick={() => setEditCellColor(editCellColor === color ? null : color)}
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

              {/* Per-cell font size */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cell font size
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setEditFontSizeScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10))}
                    disabled={editFontSizeScale <= 0.5}
                    aria-label="Decrease font size"
                    sx={{ border: "1px solid", borderColor: "grey.300" }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 48, textAlign: "center", fontWeight: 600 }}>
                    {Math.round(editFontSizeScale * 100)}%
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setEditFontSizeScale((s) => Math.min(2.0, Math.round((s + 0.1) * 10) / 10))}
                    disabled={editFontSizeScale >= 2.0}
                    aria-label="Increase font size"
                    sx={{ border: "1px solid", borderColor: "grey.300" }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  {editFontSizeScale !== 1.0 && (
                    <Button
                      size="small"
                      onClick={() => setEditFontSizeScale(1.0)}
                      sx={{ ml: "auto", color: "text.secondary", fontSize: "0.7rem" }}
                    >
                      Reset
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="outlined" fullWidth onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleEditSave}
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
                    alt={`${goal.title || "Goal"} photo`}
                    sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 2, mb: 1 }}
                  />
                  {!readOnly && (
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
                  )}
                </Box>
              ) : readOnly ? (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                  No photo added
                </Typography>
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
                      {localCount} / {goal.finalCount} ({pct}%)
                    </Typography>
                  </Box>
                  <Box
                    sx={{ height: 8, bgcolor: "grey.200", borderRadius: 4, overflow: "hidden", mb: readOnly ? 0 : 2 }}
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

                  {/* Counter controls — hidden in read-only mode */}
                  {!readOnly && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={handleDecrement}
                        disabled={localCount <= 0}
                        aria-label="Decrease progress"
                        sx={{ border: "1px solid", borderColor: "grey.300" }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>

                      <TextField
                        size="small"
                        value={localCount}
                        onChange={(e) => handleCountInput(e.target.value)}
                        inputProps={{ style: { textAlign: "center", width: 48 }, "aria-label": "Current count" }}
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
                        disabled={localCount >= goal.finalCount}
                        aria-label="Increase progress"
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
                  )}
                </Box>
              ) : !readOnly ? (
                // Single-completion goal
                <Button
                  variant={localCompleted ? "contained" : "outlined"}
                  fullWidth
                  onClick={handleToggleComplete}
                  sx={
                    localCompleted
                      ? { bgcolor: "#F9A825", fontWeight: 700 }
                      : { fontWeight: 700 }
                  }
                >
                  {localCompleted ? "Completed! (undo)" : "Mark as Complete"}
                </Button>
              ) : null}

              {/* Target date */}
              <Typography variant="caption" color="text.disabled">
                Target: {goal.completeDate}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
};

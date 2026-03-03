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
import type { Goal } from "../types";

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
  const pct =
    goal.finalCount > 1
      ? Math.min(100, Math.round((goal.curCount / goal.finalCount) * 100))
      : goal.completed
      ? 100
      : 0;

  const handleIncrement = () => {
    const newCount = Math.min(goal.curCount + 1, goal.finalCount);
    const completed = newCount >= goal.finalCount;
    onUpdate({ curCount: newCount, completed });
  };

  const handleDecrement = () => {
    const newCount = Math.max(0, goal.curCount - 1);
    onUpdate({ curCount: newCount, completed: false });
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
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}
      >
        <Typography fontWeight={700} fontSize="1.1rem" sx={{ pr: 2 }}>
          {goal.title || "(untitled)"}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Description */}
        {goal.description && (
          <Typography variant="body2" color="text.secondary">
            {goal.description}
          </Typography>
        )}

        {/* Image */}
        {goal.imageUrl ? (
          <Box
            component="img"
            src={goal.imageUrl}
            sx={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 2 }}
          />
        ) : (
          <Button
            component="label"
            variant="outlined"
            size="small"
            sx={{ borderStyle: "dashed", color: "text.secondary" }}
          >
            + Add a photo
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
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
            <Box sx={{ height: 8, bgcolor: "grey.200", borderRadius: 4, overflow: "hidden", mb: 2 }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #f093fb, #f5576c)",
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
                    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
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
      </DialogContent>
    </Dialog>
  );
};

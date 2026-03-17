import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Box,
} from "@mui/material";

type CreateCardDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, gridDim: 3 | 5 | 7) => void;
};

const GRID_OPTIONS: { label: string; value: 3 | 5 | 7; goals: number }[] = [
  { label: "3×3", value: 3, goals: 8 },
  { label: "5×5", value: 5, goals: 24 },
  { label: "7×7", value: 7, goals: 48 },
];

export const CreateCardDialog = ({
  open,
  onClose,
  onCreate,
}: CreateCardDialogProps) => {
  const [name, setName] = useState("");
  const [gridDim, setGridDim] = useState<3 | 5 | 7 | null>(null);

  const handleClose = () => {
    setName("");
    setGridDim(null);
    onClose();
  };

  const handleCreate = () => {
    if (!name.trim() || !gridDim) return;
    onCreate(name.trim(), gridDim);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.3rem" }}>
        Create a new bingo card
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
        <TextField
          label="Card name"
          placeholder="e.g. 2026 Fitness Goals"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          fullWidth
        />

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Grid size
          </Typography>
          <ToggleButtonGroup
            value={gridDim}
            exclusive
            onChange={(_, v) => v && setGridDim(v)}
            sx={{ gap: 1 }}
          >
            {GRID_OPTIONS.map((opt) => (
              <ToggleButton
                key={opt.value}
                value={opt.value}
                sx={{
                  borderRadius: "10px !important",
                  px: 2.5,
                  flexDirection: "column",
                  gap: 0.25,
                }}
              >
                <Typography fontWeight={700} fontSize="1rem">
                  {opt.label}
                </Typography>
                <Typography fontSize="0.65rem" color="text.secondary">
                  {opt.goals} goals
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!name.trim() || !gridDim}
          sx={{
            bgcolor: "#1565C0",
            fontWeight: 700,
            "&:hover": { bgcolor: "#0D47A1" },
          }}
        >
          Next: Add Goals
        </Button>
      </DialogActions>
    </Dialog>
  );
};

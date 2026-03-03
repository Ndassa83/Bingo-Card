import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GRADIENTS } from "../types";

type ColorPickerProps = {
  open: boolean;
  onClose: () => void;
  currentColor: string;
  currentGradient: string | null;
  onColorChange: (color: string, gradientKey: string | null) => void;
};

const SOLID_COLORS = [
  "#ffffff", "#f8f9fa", "#fff3cd", "#d1ecf1",
  "#d4edda", "#f8d7da", "#e2e3e5", "#1a1a2e",
  "#16213e", "#0f3460", "#533483", "#e94560",
];

export const ColorPicker = ({
  open,
  onClose,
  currentColor,
  currentGradient,
  onColorChange,
}: ColorPickerProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography fontWeight={700}>Card Background</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Gradient presets */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Gradients
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {Object.entries(GRADIENTS).map(([key, value]) => (
              <Box
                key={key}
                onClick={() => onColorChange(currentColor, key)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: value,
                  cursor: "pointer",
                  border: currentGradient === key ? "3px solid #333" : "3px solid transparent",
                  transition: "transform 0.15s",
                  "&:hover": { transform: "scale(1.1)" },
                }}
                title={key}
              />
            ))}
          </Box>
        </Box>

        {/* Solid colors */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Solid colors
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {SOLID_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => onColorChange(color, null)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: color,
                  cursor: "pointer",
                  border:
                    !currentGradient && currentColor === color
                      ? "3px solid #333"
                      : "3px solid #e0e0e0",
                  transition: "transform 0.15s",
                  "&:hover": { transform: "scale(1.1)" },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Custom hex */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Custom color
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="input"
              type="color"
              value={currentColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onColorChange(e.target.value, null)
              }
              sx={{
                width: 44,
                height: 44,
                border: "none",
                borderRadius: 2,
                cursor: "pointer",
                p: 0.25,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {currentColor}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

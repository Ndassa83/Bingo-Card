import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GRADIENTS, CELL_GRADIENTS, CELL_SOLID_COLORS } from "../types";
import type { CardData } from "../types";

const SOLID_COLORS = [
  "#ffffff", "#f8f9fa", "#fff3cd", "#d1ecf1",
  "#d4edda", "#f8d7da", "#e2e3e5", "#fce7f3",
  "#ede9fe", "#ffedd5", "#e0f2fe", "#fdf4ff",
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#e94560", "#1e40af", "#15803d", "#9f1239",
];

const FONT_COLOR_PRESETS = [
  "#ffffff", "#1a1a1a", "#1565C0", "#15803d", "#9f1239",
  "#7e22ce", "#c2410c", "#F9A825", "#0369a1", "#374151",
];

type EditBoardDialogProps = {
  open: boolean;
  onClose: () => void;
  card: CardData;
  onColorChange: (color: string, gradientKey: string | null) => void;
  onCellColorChange: (color: string | null) => void;
  onFontColorChange: (color: string | null) => void;
  onFontSizeScaleChange: (scale: number | null) => void;
  onNameChange: (name: string) => void;
  onFreeCellChange: (text: string, color: string | null) => void;
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
      "&:hover": { transform: "scale(1.1)" },
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
      "&:hover": { transform: "scale(1.1)" },
      "&:focus-visible": { outline: "2px solid #1565C0", outlineOffset: 2 },
      boxShadow: background === "#ffffff" ? "inset 0 0 0 1px #ddd" : "none",
    }}
    title={label}
  />
);

export const EditBoardDialog = ({
  open,
  onClose,
  card,
  onColorChange,
  onCellColorChange,
  onFontColorChange,
  onFontSizeScaleChange,
  onNameChange,
  onFreeCellChange,
}: EditBoardDialogProps) => {
  const [nameValue, setNameValue] = useState(card.name);
  const [freeCellText, setFreeCellText] = useState(card.freeCellText ?? "");
  const [freeCellColor, setFreeCellColor] = useState<string | null>(card.freeCellColor ?? null);

  const handleNameBlur = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== card.name) {
      onNameChange(trimmed);
    }
  };

  const handleFreeCellBlur = () => {
    const trimmed = freeCellText.trim();
    if (trimmed !== (card.freeCellText ?? "") || freeCellColor !== (card.freeCellColor ?? null)) {
      onFreeCellChange(trimmed, freeCellColor);
    }
  };

  const handleFreeCellColorSelect = (color: string | null) => {
    const next = freeCellColor === color ? null : color;
    setFreeCellColor(next);
    onFreeCellChange(freeCellText.trim() || card.name, next);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography fontWeight={700}>Edit Board</Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close dialog">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Board name */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Board name
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === "Enter") handleNameBlur(); }}
            autoFocus
          />
        </Box>

        {/* Background gradients */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Background
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }} role="radiogroup" aria-label="Background gradient">
            {Object.entries(GRADIENTS).map(([key, value]) => (
              <Swatch
                key={key}
                background={value}
                selected={card.gradientKey === key}
                label={`${key} gradient`}
                onClick={() => onColorChange(card.backgroundColor, key)}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }} role="radiogroup" aria-label="Background solid color">
            {SOLID_COLORS.map((color) => (
              <SolidSwatch
                key={color}
                background={color}
                selected={!card.gradientKey && card.backgroundColor === color}
                label={`Background color ${color}`}
                onClick={() => onColorChange(color, null)}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Box
              component="input"
              type="color"
              value={card.backgroundColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onColorChange(e.target.value, null)
              }
              aria-label="Custom background color"
              sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
            />
            <Typography variant="caption" color="text.secondary">
              Custom color
            </Typography>
          </Box>
        </Box>

        {/* Cell style */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Cell style
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }} role="radiogroup" aria-label="Cell gradient">
            {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
              <Swatch
                key={key}
                background={value}
                selected={card.cellStyleColor === value}
                label={`${key} cell gradient`}
                onClick={() => onCellColorChange(card.cellStyleColor === value ? null : value)}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }} role="radiogroup" aria-label="Cell solid color">
            {CELL_SOLID_COLORS.map((color) => (
              <SolidSwatch
                key={color}
                background={color}
                selected={card.cellStyleColor === color}
                label={`Cell color ${color}`}
                onClick={() => onCellColorChange(card.cellStyleColor === color ? null : color)}
              />
            ))}
          </Box>
          {card.cellStyleColor && (
            <Button size="small" onClick={() => onCellColorChange(null)} sx={{ mt: 1, color: "text.secondary" }}>
              Clear cell color
            </Button>
          )}
        </Box>

        {/* Font color */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Font color
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }} role="radiogroup" aria-label="Font color">
            {FONT_COLOR_PRESETS.map((color) => (
              <SolidSwatch
                key={color}
                background={color}
                selected={card.fontColor === color}
                label={`Font color ${color}`}
                onClick={() => onFontColorChange(card.fontColor === color ? null : color)}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="input"
              type="color"
              value={card.fontColor ?? "#1a1a1a"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFontColorChange(e.target.value)}
              aria-label="Custom font color"
              sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
            />
            <Typography variant="caption" color="text.secondary">Custom color</Typography>
            {card.fontColor && (
              <Button size="small" onClick={() => onFontColorChange(null)} sx={{ ml: "auto", color: "text.secondary" }}>
                Clear (auto)
              </Button>
            )}
          </Box>
        </Box>

        {/* Font size */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Font size — <Typography component="span" variant="body2">{Math.round((card.fontSizeScale ?? 1.0) * 100)}%</Typography>
          </Typography>
          <Slider
            value={Math.round((card.fontSizeScale ?? 1.0) * 100)}
            onChange={(_, v) => {
              const pct = v as number;
              onFontSizeScaleChange(pct === 100 ? null : pct / 100);
            }}
            min={50}
            max={200}
            step={5}
            marks={[
              { value: 50, label: "50%" },
              { value: 100, label: "100%" },
              { value: 150, label: "150%" },
              { value: 200, label: "200%" },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}%`}
            aria-label="Font size"
            sx={{
              "& .MuiSlider-thumb": { bgcolor: "#1565C0" },
              "& .MuiSlider-track": { bgcolor: "#1565C0", border: "none" },
              "& .MuiSlider-markLabel": { fontSize: { xs: "0.8rem", sm: "0.65rem" } },
            }}
          />
        </Box>

        {/* Free cell */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Free cell label
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder={card.name}
            value={freeCellText}
            onChange={(e) => setFreeCellText(e.target.value)}
            onBlur={handleFreeCellBlur}
            onKeyDown={(e) => { if (e.key === "Enter") handleFreeCellBlur(); }}
            helperText="Defaults to board name if left empty"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 1 }}>
            Free cell color
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }} role="radiogroup" aria-label="Free cell color">
            {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
              <Swatch
                key={key}
                background={value}
                selected={freeCellColor === value}
                label={`${key} free cell color`}
                onClick={() => handleFreeCellColorSelect(value)}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

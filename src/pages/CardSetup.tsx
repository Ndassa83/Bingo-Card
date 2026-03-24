import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useAuth } from "../hooks/useAuth";
import { createCard, updateCardMeta, updateGoals } from "../firebase/firestore";
import { uploadFreeCellImage, uploadGoalImage } from "../firebase/storage";
import { useToast } from "../contexts/ToastContext";
import type { Goal } from "../types";
import { GRADIENTS, CELL_GRADIENTS, CELL_SOLID_COLORS } from "../types";
import { getContrastColor } from "../utils/contrast";

type LocationState = {
  name: string;
  gridDim: 3 | 5 | 7;
};

const makeGoals = (count: number): Goal[] =>
  Array.from({ length: count }, (_, i) => ({
    index: i,
    title: "",
    description: "",
    curCount: 0,
    finalCount: 1,
    completeDate: "12/31/2026",
    completed: false,
    completedAt: null,
    cellColor: null,
    imageUrl: null,
    reminderActive: true,
    fontSizeScale: null,
  }));

const GOAL_COUNT: Record<number, number> = { 3: 8, 5: 24, 7: 48 };

// Swatch components for color pickers
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
    }}
    title={label}
  />
);

export const CardSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const state = location.state as LocationState | null;

  const gridDim: 3 | 5 | 7 = state?.gridDim ?? 5;
  const cardName = state?.name ?? "My Bingo Card";
  const goalCount = GOAL_COUNT[gridDim];

  const [goals, setGoals] = useState<Goal[]>(() => makeGoals(goalCount));
  // step 0 = FREE cell, step 1 = style, steps 2..goalCount+1 = goals
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [freeFile, setFreeFile] = useState<File | null>(null);
  const [freePreview, setFreePreview] = useState<string | null>(null);
  const freeFileInputRef = useRef<HTMLInputElement>(null);
  const [goalFiles, setGoalFiles] = useState<(File | null)[]>(() => Array(goalCount).fill(null));
  const [goalPreviews, setGoalPreviews] = useState<(string | null)[]>(() => Array(goalCount).fill(null));
  const goalFileInputRef = useRef<HTMLInputElement>(null);
  const [bgGradientKey, setBgGradientKey] = useState<string | null>("sunset");
  const [bgSolidColor, setBgSolidColor] = useState<string>("#ffffff");
  const [cellStyleColor, setCellStyleColor] = useState<string | null>(null);
  const [fontColor, setFontColor] = useState<string | null>(null);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);
  const [freeCellText, setFreeCellText] = useState<string>("");
  const [freeCellColor, setFreeCellColor] = useState<string | null>(null);
  const [goalDates, setGoalDates] = useState<(Dayjs | null)[]>(() =>
    Array(goalCount).fill(dayjs("2026-12-31"))
  );

  const isFreeStep = step === 0;
  const isStyleStep = step === 1;
  const isLastStep = step === goalCount + 1;
  const goalIdx = step - 2; // 0-based goal index when on a goal step
  const goal = goals[goalIdx];

  // Step phase label for the header
  const getStepLabel = () => {
    if (isFreeStep) return { phase: "Step 1 of 3", title: "Center Cell" };
    if (isStyleStep) return { phase: "Step 2 of 3", title: "Card Style" };
    return { phase: `Step 3 of 3`, title: `Goal ${goalIdx + 1} of ${goalCount}` };
  };
  const stepLabel = getStepLabel();

  const update = <K extends keyof Goal>(field: K, value: Goal[K]) => {
    setGoals((prev) =>
      prev.map((g, i) => (i === goalIdx ? { ...g, [field]: value } : g))
    );
  };

  const allFilled = goals.every((g) => g.title.trim() !== "");

  const handleFreeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFreeFile(file);
    setFreePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleGoalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGoalFiles((prev) => prev.map((f, i) => (i === goalIdx ? file : f)));
    setGoalPreviews((prev) => prev.map((p, i) => (i === goalIdx ? URL.createObjectURL(file) : p)));
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!user || !allFilled) return;
    setSaving(true);

    // Apply goal dates back to goals array
    const goalsWithDates = goals.map((g, i) => {
      const d = goalDates[i];
      if (d && d.isValid()) {
        return { ...g, completeDate: d.format("MM/DD/YYYY") };
      }
      return g;
    });

    let cardId: string;
    try {
      cardId = await createCard(user.uid, {
        name: cardName,
        gridDim,
        backgroundColor: bgGradientKey ? "#ffffff" : bgSolidColor,
        gradientKey: bgGradientKey,
        freeImageUrl: null,
        freeCellText: freeCellText.trim() || null,
        freeCellColor,
        cellStyleColor,
        fontColor,
        fontSizeScale: fontSizeScale === 1.0 ? null : fontSizeScale,
        goals: goalsWithDates,
      });
    } catch (err) {
      showToast(`Card creation failed: ${err instanceof Error ? err.message : String(err)}`, "error");
      setSaving(false);
      return;
    }

    // Upload images — failures are non-fatal
    if (freeFile) {
      try {
        const url = await uploadFreeCellImage(user.uid, cardId, freeFile);
        await updateCardMeta(user.uid, cardId, { freeImageUrl: url });
      } catch (uploadErr) {
        console.error("Free cell image upload failed:", uploadErr);
      }
    }

    const updatedGoals = [...goalsWithDates];
    let anyUploaded = false;
    for (let i = 0; i < goalFiles.length; i++) {
      const f = goalFiles[i];
      if (f) {
        try {
          const url = await uploadGoalImage(user.uid, cardId, i, f);
          updatedGoals[i] = { ...updatedGoals[i], imageUrl: url };
          anyUploaded = true;
        } catch (uploadErr) {
          console.error(`Goal ${i} image upload failed:`, uploadErr);
        }
      }
    }
    if (anyUploaded) {
      try {
        await updateGoals(user.uid, cardId, updatedGoals);
      } catch (updateErr) {
        console.error("Failed to save goal image URLs:", updateErr);
      }
    }

    navigate(`/card/${cardId}`, { replace: true });
  };

  const canAdvance = isFreeStep || isStyleStep || (goal?.title.trim() !== "");

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
        {/* Header */}
        <Box
          sx={{
            px: { xs: 2, sm: 4 },
            py: 2,
            borderBottom: "1px solid",
            borderColor: "grey.200",
            bgcolor: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ color: "text.secondary" }}
            aria-label="Back to dashboard"
          >
            Dashboard
          </Button>
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography variant="h6" fontWeight={700}>
              {cardName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <Chip
                label={stepLabel.phase}
                size="small"
                sx={{ fontSize: "0.7rem", bgcolor: "#E3F2FD", color: "#1565C0", fontWeight: 700 }}
              />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {stepLabel.title}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {gridDim}×{gridDim}
          </Typography>
        </Box>

        {/* Progress bar — goal steps only */}
        <Box sx={{ height: 4, bgcolor: "grey.100" }}>
          <Box
            sx={{
              height: "100%",
              width: `${step <= 1 ? 0 : (goalIdx / goalCount) * 100}%`,
              background: "linear-gradient(90deg, #1565C0, #F9A825)",
              transition: "width 0.4s ease",
            }}
          />
        </Box>

        <Box
          sx={{
            maxWidth: 560,
            mx: "auto",
            px: { xs: 2, sm: 4 },
            pt: 5,
            pb: 12,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* ── FREE cell step ── */}
          {isFreeStep ? (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  CENTER CELL
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                  Customize your center cell
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  All fields are optional — you can skip this step.
                </Typography>
              </Box>

              <TextField
                label="Center cell text"
                placeholder={`Defaults to "${cardName}"`}
                value={freeCellText}
                onChange={(e) => setFreeCellText(e.target.value)}
                fullWidth
                inputProps={{ maxLength: 40 }}
                helperText="Leave blank to show the card title"
                autoFocus
              />

              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Cell color
                </Typography>

                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    GRADIENTS
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }} role="radiogroup" aria-label="Free cell gradient">
                  {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
                    <Swatch
                      key={key}
                      background={value}
                      selected={freeCellColor === value}
                      label={`${key} gradient`}
                      onClick={() => setFreeCellColor(freeCellColor === value ? null : value)}
                    />
                  ))}
                </Box>

                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    SOLID
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", justifyContent: "center", mb: 1.5 }} role="radiogroup" aria-label="Free cell solid color">
                  {CELL_SOLID_COLORS.map((color) => (
                    <SolidSwatch
                      key={color}
                      background={color}
                      selected={freeCellColor === color}
                      label={`Cell color ${color}`}
                      onClick={() => setFreeCellColor(freeCellColor === color ? null : color)}
                    />
                  ))}
                </Box>

                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    CUSTOM
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Box
                    component="input"
                    type="color"
                    value={freeCellColor ?? "#ffffff"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFreeCellColor(e.target.value)}
                    aria-label="Custom free cell color"
                    sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
                  />
                  <Typography variant="caption" color="text.secondary">Pick any color</Typography>
                </Box>

                {freeCellColor && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setFreeCellColor(null)}
                      sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                    >
                      Clear color
                    </Button>
                  </Box>
                )}
              </Box>

              <input
                ref={freeFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFreeFileChange}
              />

              {freePreview ? (
                <Box>
                  <Box
                    component="img"
                    src={freePreview}
                    alt="Free cell preview"
                    sx={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 3, mb: 1.5 }}
                  />
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => freeFileInputRef.current?.click()}
                  >
                    Change image
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => freeFileInputRef.current?.click()}
                  sx={{ borderStyle: "dashed", py: 4, color: "text.secondary", fontSize: "1rem" }}
                >
                  + Add a photo (optional)
                </Button>
              )}
            </>
          ) : isStyleStep ? (
            /* ── Style step ── */
            <>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  CARD STYLE
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                  Choose your card's look
                </Typography>
              </Box>

              {/* Live preview */}
              <Box
                sx={{
                  maxWidth: "100%",
                  borderRadius: 3,
                  background: bgGradientKey ? (GRADIENTS[bgGradientKey] ?? bgSolidColor) : bgSolidColor,
                  p: 1.5,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 0.75,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => {
                  const isFreeCell = i === 4;
                  const cellBg = cellStyleColor ?? "rgba(255,255,255,0.82)";
                  const freeBg = freeCellColor ?? cellBg;
                  const bg = isFreeCell ? freeBg : cellBg;
                  const textCol = fontColor
                    ?? (isFreeCell
                      ? getContrastColor(freeBg)
                      : cellStyleColor
                      ? getContrastColor(cellStyleColor)
                      : "#555");
                  const freeLabel = freeCellText.trim() || cardName;
                  return (
                    <Box
                      key={i}
                      sx={{
                        aspectRatio: "1",
                        borderRadius: 1.5,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 0.5,
                        overflow: "hidden",
                      }}
                    >
                      {isFreeCell && (
                        <Typography sx={{
                          fontSize: "0.5rem",
                          fontWeight: 800,
                          color: textCol,
                          letterSpacing: 0.5,
                          textAlign: "center",
                          lineHeight: 1.2,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}>
                          {freeLabel}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Background */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Background
                </Typography>
                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    GRADIENTS
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }} role="radiogroup" aria-label="Background gradient">
                  {Object.entries(GRADIENTS).map(([key, value]) => (
                    <Swatch
                      key={key}
                      background={value}
                      selected={bgGradientKey === key}
                      label={`${key} gradient`}
                      onClick={() => { setBgGradientKey(key); }}
                    />
                  ))}
                </Box>
                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    SOLID
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }} role="radiogroup" aria-label="Background solid color">
                  {[
                    "#ffffff", "#f8f9fa", "#1a1a2e", "#16213e", "#0f3460",
                    "#374151", "#1e40af", "#15803d", "#9f1239", "#7e22ce",
                  ].map((color) => (
                    <SolidSwatch
                      key={color}
                      background={color}
                      selected={!bgGradientKey && bgSolidColor === color}
                      label={`Background color ${color}`}
                      onClick={() => { setBgGradientKey(null); setBgSolidColor(color); }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 0.5 }}>
                  <Box
                    component="input"
                    type="color"
                    value={bgSolidColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setBgGradientKey(null);
                      setBgSolidColor(e.target.value);
                    }}
                    aria-label="Custom background color"
                    sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
                  />
                  <Typography variant="caption" color="text.secondary">Custom color</Typography>
                </Box>
              </Box>

              {/* Cell color */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Cell style
                </Typography>

                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    GRADIENTS
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }} role="radiogroup" aria-label="Cell gradient">
                  {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
                    <Swatch
                      key={key}
                      background={value}
                      selected={cellStyleColor === value}
                      label={`${key} cell gradient`}
                      onClick={() => setCellStyleColor(cellStyleColor === value ? null : value)}
                    />
                  ))}
                </Box>

                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    SOLID
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", justifyContent: "center", mb: 1.5 }} role="radiogroup" aria-label="Cell solid color">
                  {CELL_SOLID_COLORS.map((color) => (
                    <SolidSwatch
                      key={color}
                      background={color}
                      selected={cellStyleColor === color}
                      label={`Cell color ${color}`}
                      onClick={() => setCellStyleColor(cellStyleColor === color ? null : color)}
                    />
                  ))}
                </Box>

                <Divider sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                    CUSTOM
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Box
                    component="input"
                    type="color"
                    value={cellStyleColor ?? "#ffffff"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCellStyleColor(e.target.value)}
                    aria-label="Custom cell color"
                    sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
                  />
                  <Typography variant="caption" color="text.secondary">Pick any color</Typography>
                </Box>

                {cellStyleColor && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setCellStyleColor(null)}
                      sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                    >
                      Clear cell color
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Font color */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Font color
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }} role="radiogroup" aria-label="Font color">
                  {[
                    "#ffffff", "#1a1a1a", "#1565C0", "#15803d", "#9f1239",
                    "#7e22ce", "#c2410c", "#F9A825", "#0369a1", "#374151",
                  ].map((color) => (
                    <SolidSwatch
                      key={color}
                      background={color}
                      selected={fontColor === color}
                      label={`Font color ${color}`}
                      onClick={() => setFontColor(fontColor === color ? null : color)}
                    />
                  ))}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Box
                    component="input"
                    type="color"
                    value={fontColor ?? "#1a1a1a"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFontColor(e.target.value)}
                    aria-label="Custom font color"
                    sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
                  />
                  <Typography variant="caption" color="text.secondary">Custom color</Typography>
                </Box>
                {fontColor && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setFontColor(null)}
                      sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                    >
                      Clear (auto)
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Font size */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Font size — <Typography component="span" variant="body2" color="text.secondary">{Math.round(fontSizeScale * 100)}%</Typography>
                </Typography>
                <Slider
                  value={Math.round(fontSizeScale * 100)}
                  onChange={(_, v) => setFontSizeScale((v as number) / 100)}
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
            </>
          ) : (
            /* ── Goal step ── */
            <>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  GOAL {goalIdx + 1} OF {goalCount}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                  What's goal #{goalIdx + 1}?
                </Typography>
              </Box>

              <TextField
                label="Goal title"
                placeholder="e.g. Run a 5K"
                value={goal.title}
                onChange={(e) => update("title", e.target.value)}
                fullWidth
                autoFocus
                required
                error={goal.title.trim() === "" && goalIdx > 0}
                inputProps={{ maxLength: 200 }}
              />

              <TextField
                label="Details (optional)"
                placeholder="Any extra context or notes"
                value={goal.description}
                onChange={(e) => update("description", e.target.value)}
                fullWidth
                multiline
                rows={2}
                inputProps={{ maxLength: 500 }}
              />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  How many times?{" "}
                  <strong>{goal.finalCount === 1 ? "Once" : `${goal.finalCount}×`}</strong>
                </Typography>
                <Slider
                  value={goal.finalCount}
                  onChange={(_, v) => update("finalCount", v as number)}
                  min={1}
                  max={365}
                  valueLabelDisplay="auto"
                  aria-label="How many times"
                  sx={{
                    "& .MuiSlider-thumb": { bgcolor: "#1565C0" },
                    "& .MuiSlider-track": { bgcolor: "#1565C0", border: "none" },
                  }}
                />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => update("finalCount", Math.max(1, goal.finalCount - 1))}
                    aria-label="Decrease goal count"
                    sx={{ border: "1px solid", borderColor: "grey.300" }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 52, textAlign: "center", fontWeight: 600 }}>
                    {goal.finalCount === 1 ? "Once" : `${goal.finalCount}×`}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => update("finalCount", Math.min(365, goal.finalCount + 1))}
                    aria-label="Increase goal count"
                    sx={{ border: "1px solid", borderColor: "grey.300" }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Per-goal image upload */}
              <input
                ref={goalFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleGoalFileChange}
              />
              {goalPreviews[goalIdx] ? (
                <Box>
                  <Box
                    component="img"
                    src={goalPreviews[goalIdx]!}
                    alt={`Goal ${goalIdx + 1} preview`}
                    sx={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 2, mb: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => goalFileInputRef.current?.click()}
                  >
                    Change photo
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => goalFileInputRef.current?.click()}
                  sx={{ borderStyle: "dashed", color: "text.secondary" }}
                >
                  + Add a photo (optional)
                </Button>
              )}

              <DatePicker
                label="Target date"
                value={goalDates[goalIdx]}
                onChange={(d) => {
                  setGoalDates((prev) => prev.map((x, i) => (i === goalIdx ? d : x)));
                }}
                slotProps={{
                  textField: { size: "small", fullWidth: true },
                }}
              />
            </>
          )}
        </Box>

        {/* Sticky bottom nav */}
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "white",
            borderTop: "1px solid",
            borderColor: "grey.200",
            px: { xs: 2, sm: 4 },
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 10,
            boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => (step === 0 ? navigate("/") : setStep((p) => p - 1))}
            sx={{ color: "text.secondary", fontWeight: 600 }}
            aria-label="Previous step"
          >
            Back
          </Button>

          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {isFreeStep ? "CENTER" : isStyleStep ? "STYLE" : `GOAL ${goalIdx + 1}/${goalCount}`}
          </Typography>

          {isLastStep ? (
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!allFilled || saving}
              startIcon={<CheckIcon />}
            >
              {saving ? "Creating…" : "Create Card"}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => setStep((p) => p + 1)}
              disabled={!canAdvance}
              aria-label="Next step"
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

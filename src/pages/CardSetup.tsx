import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  IconButton,
  LinearProgress,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useAuth } from "../hooks/useAuth";
import { createCard, updateCardMeta, updateGoals } from "../firebase/firestore";
import { uploadFreeCellImage, uploadGoalImage } from "../firebase/storage";
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
    cellColor: null,
    imageUrl: null,
    reminderActive: true,
  }));

const GOAL_COUNT: Record<number, number> = { 3: 8, 5: 24, 7: 48 };

export const CardSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const gridDim: 3 | 5 | 7 = state?.gridDim ?? 5;
  const cardName = state?.name ?? "My Bingo Card";
  const goalCount = GOAL_COUNT[gridDim];

  const [goals, setGoals] = useState<Goal[]>(() => makeGoals(goalCount));
  // step 0 = FREE cell, steps 1..goalCount = goals
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
  const [freeCellText, setFreeCellText] = useState<string>("");
  const [freeCellColor, setFreeCellColor] = useState<string | null>(null);

  const isFreeStep = step === 0;
  const isStyleStep = step === 1;
  const isLastStep = step === goalCount + 1;
  const goalIdx = step - 2; // 0-based goal index when on a goal step
  const goal = goals[goalIdx];

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

    // Step 1: create the card document — only failure that blocks navigation
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
        goals,
      });
    } catch (err) {
      console.error("Failed to create card:", err);
      alert(`Card creation failed: ${err instanceof Error ? err.message : String(err)}`);
      setSaving(false);
      return;
    }

    // Step 2: upload images — failures are non-fatal, navigation always happens
    if (freeFile) {
      try {
        const url = await uploadFreeCellImage(user.uid, cardId, freeFile);
        await updateCardMeta(user.uid, cardId, { freeImageUrl: url });
      } catch (uploadErr) {
        console.error("Free cell image upload failed:", uploadErr);
      }
    }

    const updatedGoals = [...goals];
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

    // Step 3: navigate — outside ALL try-catch blocks so it can never be swallowed
    navigate(`/card/${cardId}`, { replace: true });
  };

  const canAdvance = isFreeStep || isStyleStep || (goal?.title.trim() !== "");

  return (
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
        >
          Dashboard
        </Button>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, textAlign: "center" }}>
          {cardName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {gridDim}×{gridDim}
        </Typography>
      </Box>

      {/* Progress bar — only counts goal steps */}
      <LinearProgress
        variant="determinate"
        value={step <= 1 ? 0 : (goalIdx / goalCount) * 100}
        sx={{
          height: 4,
          "& .MuiLinearProgress-bar": {
            background: "linear-gradient(90deg, #1565C0, #F9A825)",
          },
        }}
      />

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
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }}>
                {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
                  <Box
                    key={key}
                    onClick={() => setFreeCellColor(freeCellColor === value ? null : value)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      background: value,
                      cursor: "pointer",
                      border: freeCellColor === value ? "3px solid #333" : "3px solid transparent",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                    title={key}
                  />
                ))}
              </Box>

              <Divider sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                  SOLID
                </Typography>
              </Divider>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", justifyContent: "center", mb: 1.5 }}>
                {CELL_SOLID_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFreeCellColor(freeCellColor === color ? null : color)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      bgcolor: color,
                      cursor: "pointer",
                      border: freeCellColor === color ? "3px solid #333" : "3px solid #e0e0e0",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
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
                  sx={{ width: 36, height: 36, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
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
                  sx={{
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 3,
                    mb: 1.5,
                  }}
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
                const textCol = isFreeCell
                  ? getContrastColor(freeBg)
                  : cellStyleColor
                  ? getContrastColor(cellStyleColor)
                  : "#555";
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
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }}>
                {Object.entries(GRADIENTS).map(([key, value]) => (
                  <Box
                    key={key}
                    onClick={() => { setBgGradientKey(key); }}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      background: value,
                      cursor: "pointer",
                      border: bgGradientKey === key ? "3px solid #333" : "3px solid transparent",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                    title={key}
                  />
                ))}
              </Box>
              <Divider sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                  SOLID
                </Typography>
              </Divider>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }}>
                {[
                  "#ffffff", "#f8f9fa", "#1a1a2e", "#16213e", "#0f3460",
                  "#374151", "#1e40af", "#15803d", "#9f1239", "#7e22ce",
                ].map((color) => (
                  <Box
                    key={color}
                    onClick={() => { setBgGradientKey(null); setBgSolidColor(color); }}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      bgcolor: color,
                      cursor: "pointer",
                      border:
                        !bgGradientKey && bgSolidColor === color
                          ? "3px solid #333"
                          : "3px solid #e0e0e0",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
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
                  sx={{ width: 36, height: 36, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
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
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5, justifyContent: "center" }}>
                {Object.entries(CELL_GRADIENTS).map(([key, value]) => (
                  <Box
                    key={key}
                    onClick={() => setCellStyleColor(cellStyleColor === value ? null : value)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      background: value,
                      cursor: "pointer",
                      border: cellStyleColor === value ? "3px solid #333" : "3px solid transparent",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                    title={key}
                  />
                ))}
              </Box>

              <Divider sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                  SOLID
                </Typography>
              </Divider>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", justifyContent: "center", mb: 1.5 }}>
                {CELL_SOLID_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setCellStyleColor(cellStyleColor === color ? null : color)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      bgcolor: color,
                      cursor: "pointer",
                      border: cellStyleColor === color ? "3px solid #333" : "3px solid #e0e0e0",
                      transition: "transform 0.15s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
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
                  sx={{ width: 36, height: 36, border: "none", borderRadius: 1.5, cursor: "pointer", p: 0.25 }}
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
            />

            <TextField
              label="Details (optional)"
              placeholder="Any extra context or notes"
              value={goal.description}
              onChange={(e) => update("description", e.target.value)}
              fullWidth
              multiline
              rows={2}
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
                sx={{
                  "& .MuiSlider-thumb": { bgcolor: "#1565C0" },
                  "& .MuiSlider-track": { bgcolor: "#1565C0", border: "none" },
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mt: 1,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => update("finalCount", Math.max(1, goal.finalCount - 1))}
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

          <TextField
              label="Target date"
              type="date"
              value={goal.completeDate
                .split("/")
                .reduce(
                  (_, __, _i, arr) =>
                    `${arr[2]}-${arr[0].padStart(2, "0")}-${arr[1].padStart(2, "0")}`,
                  ""
                )}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split("-");
                if (y && m && d) update("completeDate", `${m}/${d}/${y}`);
              }}
              fullWidth
              InputLabelProps={{ shrink: true }}
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
        >
          Back
        </Button>

        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {step + 1} / {goalCount + 2}
        </Typography>

        {isLastStep ? (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!allFilled || saving}
            startIcon={<CheckIcon />}
            sx={{
              bgcolor: "#1565C0",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              "&:hover": { bgcolor: "#0D47A1" },
            }}
          >
            {saving ? "Creating…" : "Create Card"}
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setStep((p) => p + 1)}
            disabled={!canAdvance}
            sx={{
              bgcolor: "#1565C0",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              "&:hover": { bgcolor: "#0D47A1" },
            }}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};

import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  MobileStepper,
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
import { createCard } from "../firebase/firestore";
import { uploadFreeCellImage } from "../firebase/storage";
import { updateCardMeta } from "../firebase/firestore";
import type { Goal } from "../types";

type LocationState = {
  name: string;
  gridDim: 3 | 4 | 5 | 6;
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

const GOAL_COUNT: Record<number, number> = { 3: 8, 4: 15, 5: 24, 6: 35 };

export const CardSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const gridDim = state?.gridDim ?? 5;
  const cardName = state?.name ?? "My Bingo Card";
  const goalCount = GOAL_COUNT[gridDim];

  const [goals, setGoals] = useState<Goal[]>(() => makeGoals(goalCount));
  // step 0 = FREE cell, steps 1..goalCount = goals
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [freeFile, setFreeFile] = useState<File | null>(null);
  const [freePreview, setFreePreview] = useState<string | null>(null);
  const freeFileInputRef = useRef<HTMLInputElement>(null);

  const isFreeStep = step === 0;
  const isLastStep = step === goalCount;
  const goalIdx = step - 1; // 0-based goal index when on a goal step
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

  const handleCreate = async () => {
    if (!user || !allFilled) return;
    setSaving(true);
    try {
      const cardId = await createCard(user.uid, {
        name: cardName,
        gridDim,
        backgroundColor: "#ffffff",
        gradientKey: "sunset",
        freeImageUrl: null,
        goals,
      });

      if (freeFile) {
        const url = await uploadFreeCellImage(user.uid, cardId, freeFile);
        await updateCardMeta(user.uid, cardId, { freeImageUrl: url });
      }

      navigate(`/card/${cardId}`, { replace: true });
    } catch (err) {
      console.error("Failed to create card:", err);
      setSaving(false);
    }
  };

  const canAdvance = isFreeStep || (goal?.title.trim() !== "");

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
        value={isFreeStep ? 0 : (goalIdx / goalCount) * 100}
        sx={{
          height: 4,
          "& .MuiLinearProgress-bar": {
            background: "linear-gradient(90deg, #f093fb, #f5576c)",
          },
        }}
      />

      <Box
        sx={{
          maxWidth: 560,
          mx: "auto",
          px: { xs: 2, sm: 4 },
          py: 5,
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
                FREE CELL
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                Add an image to your center FREE cell
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Optional — you can skip this step.
              </Typography>
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
                sx={{ borderStyle: "dashed", py: 5, color: "text.secondary", fontSize: "1rem" }}
              >
                + Add a photo
              </Button>
            )}
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
                  "& .MuiSlider-thumb": { background: "#f5576c" },
                  "& .MuiSlider-track": {
                    background: "linear-gradient(90deg, #f093fb, #f5576c)",
                    border: "none",
                  },
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

        {/* Navigation */}
        <MobileStepper
          variant="dots"
          steps={goalCount + 1}
          position="static"
          activeStep={step}
          sx={{ bgcolor: "transparent", justifyContent: "center" }}
          nextButton={
            isLastStep ? (
              <Box sx={{ width: 64 }} />
            ) : (
              <Button
                size="small"
                onClick={() => setStep((p) => p + 1)}
                disabled={!canAdvance}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )
          }
          backButton={
            <Button
              size="small"
              onClick={() => (step === 0 ? navigate("/") : setStep((p) => p - 1))}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
          }
        />

        {/* Create button — full-width below dots on last step */}
        {isLastStep && (
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreate}
            disabled={!allFilled || saving}
            startIcon={<CheckIcon />}
            sx={{
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "1rem",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              boxShadow: "0 4px 14px rgba(240,147,251,0.35)",
              "&:hover": { background: "linear-gradient(135deg, #e07aef 0%, #e04455 100%)" },
            }}
          >
            {saving ? "Creating…" : "Create My Bingo Card"}
          </Button>
        )}
      </Box>
    </Box>
  );
};

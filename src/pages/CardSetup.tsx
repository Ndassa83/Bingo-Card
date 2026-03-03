import { useState } from "react";
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
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);

  const goal = goals[current];

  const update = <K extends keyof Goal>(field: K, value: Goal[K]) => {
    setGoals((prev) =>
      prev.map((g, i) => (i === current ? { ...g, [field]: value } : g))
    );
  };

  const allFilled = goals.every((g) => g.title.trim() !== "");
  const isLastStep = current === goalCount - 1;

  const handleCreate = async () => {
    if (!user || !allFilled) return;
    setSaving(true);
    try {
      const cardId = await createCard(user.uid, {
        name: cardName,
        gridDim,
        backgroundColor: "#ffffff",
        gradientKey: "sunset",
        goals,
      });
      navigate(`/card/${cardId}`, { replace: true });
    } catch (err) {
      console.error("Failed to create card:", err);
      setSaving(false);
    }
  };

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

      {/* Progress */}
      <LinearProgress
        variant="determinate"
        value={((current + 1) / goalCount) * 100}
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
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            GOAL {current + 1} OF {goalCount}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            What's goal #{current + 1}?
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
          error={goal.title.trim() === "" && current > 0}
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

        {/* Count — slider + increment buttons */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            How many times? <strong>{goal.finalCount === 1 ? "Once" : `${goal.finalCount}×`}</strong>
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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 1 }}>
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
            .reduce((_, __, _i, arr) => `${arr[2]}-${arr[0].padStart(2, "0")}-${arr[1].padStart(2, "0")}`, "")}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-");
            if (y && m && d) update("completeDate", `${m}/${d}/${y}`);
          }}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        {/* Navigation */}
        <MobileStepper
          variant="dots"
          steps={goalCount}
          position="static"
          activeStep={current}
          sx={{ bgcolor: "transparent", justifyContent: "center" }}
          nextButton={
            isLastStep ? (
              // Empty spacer to keep dots centered on last step
              <Box sx={{ width: 64 }} />
            ) : (
              <Button
                size="small"
                onClick={() => setCurrent((p) => p + 1)}
                disabled={!goal.title.trim()}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )
          }
          backButton={
            <Button
              size="small"
              onClick={() => setCurrent((p) => p - 1)}
              disabled={current === 0}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
          }
        />

        {/* Create button — only shown on last step, full-width below dots */}
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

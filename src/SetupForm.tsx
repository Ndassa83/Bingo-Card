import { useState } from "react";
import type { Goal } from "./types";
import {
  Button,
  Checkbox,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

type SetupFormProps = {
  onComplete: (goals: Goal[]) => void;
};

export const SetupForm = ({ onComplete }: SetupFormProps) => {
  const [gridSize, setGridSize] = useState<null | number>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [currentView, setCurrentView] = useState<number>(0);

  const nextView = () => {
    if (goals && currentView < goals.length - 1) {
      setCurrentView((prev) => prev + 1);
    }
  };
  const prevView = () => {
    if (currentView > 0) {
      setCurrentView((prev) => prev - 1);
    }
  };

  const handleGridSizeChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: number | null,
  ) => {
    if (newValue !== null) {
      setGridSize(newValue);
      setCurrentView(0);
      const newGoals: Goal[] = Array.from({ length: newValue }, (_, i) => ({
        index: i,
        title: "",
        description: "",
        curCount: 0,
        finalCount: 1,
        completeDate: "12/31/2026",
        completed: false,
        cellColor: null,
        imageUrl: null,
        reminderActive: false,
      }));
      setGoals(newGoals);
    }
  };

  const handleGoalChange = (field: keyof Goal, value: Goal[keyof Goal]) => {
    if (!goals) return;
    const updatedGoals = goals.map((goal, index) =>
      index === currentView ? { ...goal, [field]: value } : goal,
    );
    setGoals(updatedGoals);
  };

  const options = [
    { label: "3x3", value: 8 },
    { label: "5x5", value: 24 },
    { label: "7x7", value: 48 },
  ];

  const allGoalsFilled = goals?.every((g) => g.title.trim() !== "") ?? false;

  return (
    <div>
      <form>
        <label>Choose grid size</label>
        <ToggleButtonGroup
          value={gridSize}
          exclusive
          onChange={handleGridSizeChange}
        >
          {options.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <label>Set your goals for 2026</label>

        {goals && (
          <div>
            <Button disabled={currentView < 1} onClick={prevView}>
              Prev
            </Button>
            <Typography component="span" sx={{ mx: 1 }}>
              Goal {currentView + 1} of {gridSize}
            </Typography>
            <Button
              disabled={currentView >= goals.length - 1}
              onClick={nextView}
            >
              Next
            </Button>

            <div>
              What is your goal?
              <TextField
                onChange={(e) => handleGoalChange("title", e.target.value)}
                value={goals[currentView].title}
              />
            </div>

            <div>
              Any extra details?
              <TextField
                onChange={(e) =>
                  handleGoalChange("description", e.target.value)
                }
                value={goals[currentView].description}
              />
            </div>

            <div>
              How many times would you like to do this goal?
              <Slider
                value={goals[currentView].finalCount}
                onChange={(_, value) => handleGoalChange("finalCount", value)}
                aria-label="Goal count"
                valueLabelDisplay="auto"
                min={1}
                max={365}
              />
            </div>

            <div>
              Would you like reminders?
              <Checkbox
                checked={goals[currentView].reminderActive}
                onChange={(e) =>
                  handleGoalChange("reminderActive", e.target.checked)
                }
              />
            </div>

            <Button
              variant="contained"
              disabled={!allGoalsFilled}
              onClick={() => goals && onComplete(goals)}
              sx={{ mt: 2 }}
            >
              Create My Bingo Card
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

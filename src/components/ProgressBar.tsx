import { Box } from "@mui/material";

type ProgressBarProps = {
  value: number; // 0–100
  height?: number;
};

export const ProgressBar = ({ value, height = 4 }: ProgressBarProps) => (
  <Box sx={{ height, bgcolor: "grey.100" }}>
    <Box
      sx={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: "linear-gradient(90deg, #1565C0, #F9A825)",
        transition: "width 0.4s ease",
      }}
    />
  </Box>
);

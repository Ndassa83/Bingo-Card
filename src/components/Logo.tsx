import { Box, Typography } from "@mui/material";

type LogoProps = {
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { resolution: "0.95rem", bingo: "1.05rem" },
  md: { resolution: "1.2rem", bingo: "1.35rem" },
  lg: { resolution: "2rem", bingo: "2.25rem" },
};

export const Logo = ({ size = "md" }: LogoProps) => {
  const s = sizeMap[size];
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, userSelect: "none" }}>
      <Typography
        component="span"
        sx={{
          fontWeight: 500,
          fontSize: s.resolution,
          color: "#1565C0",
          letterSpacing: 0.2,
          lineHeight: 1,
        }}
      >
        Resolution
      </Typography>
      <Box
        component="span"
        sx={{
          fontWeight: 900,
          fontSize: s.bingo,
          color: "white",
          bgcolor: "#F9A825",
          px: 0.9,
          py: 0.15,
          borderRadius: 1.25,
          lineHeight: 1.4,
          letterSpacing: 1,
          display: "inline-block",
          textTransform: "uppercase",
          boxShadow: "0 2px 6px rgba(249,168,37,0.35)",
        }}
      >
        Bingo
      </Box>
    </Box>
  );
};

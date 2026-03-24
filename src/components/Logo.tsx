import { Box, Typography } from "@mui/material";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
};

const sizeMap = {
  sm: { resolution: "0.95rem", bingo: "1.05rem" },
  md: { resolution: "1.2rem", bingo: "1.35rem" },
  lg: { resolution: "2rem", bingo: "2.25rem" },
};

export const Logo = ({ size = "md", onDark = false }: LogoProps) => {
  const s = sizeMap[size];
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, userSelect: "none" }}>
      <Typography
        component="span"
        sx={{
          fontWeight: 500,
          fontSize: s.resolution,
          color: onDark ? "rgba(255,255,255,0.9)" : "#FF6B6B",
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
          color: onDark ? "#1A0A2E" : "white",
          bgcolor: onDark ? "rgba(255,255,255,0.92)" : "#FECA57",
          px: 0.9,
          py: 0.15,
          borderRadius: 1.25,
          lineHeight: 1.4,
          letterSpacing: 1,
          display: "inline-block",
          textTransform: "uppercase",
          boxShadow: onDark
            ? "0 2px 8px rgba(0,0,0,0.2)"
            : "0 2px 6px rgba(254,202,87,0.45)",
        }}
      >
        Bingo
      </Box>
    </Box>
  );
};

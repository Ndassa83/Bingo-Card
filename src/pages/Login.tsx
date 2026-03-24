import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { AuthContext } from "../auth/AuthContext";
import { signInWithGoogle } from "../firebase/auth";
import { Logo } from "../components/Logo";
import { FireworksCanvas } from "../components/FireworksCanvas";

const MOCK_CELLS = [
  { label: "Run a 5K", done: true },
  { label: "Read 12 Books", done: false },
  { label: "Meditate Daily", done: true },
  { label: "Save $1,000", done: true },
  { label: "FREE", done: false, free: true },
  { label: "Learn Guitar", done: false },
  { label: "Cook at Home", done: true },
  { label: "Travel Solo", done: false },
  { label: "Sleep 8 hrs", done: true },
];

export const Login = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign-in error:", err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        position: "relative",
      }}
    >
      <FireworksCanvas />

      {/* Frosted card */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          bgcolor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: 4,
          px: { xs: 3, sm: 5 },
          py: 5,
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 24px 80px rgba(255,107,107,0.3), 0 4px 20px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Logo size="lg" />
        </Box>

        <Typography
          variant="body2"
          sx={{
            mb: 3.5,
            textAlign: "center",
            color: "#6B4A4A",
            lineHeight: 1.65,
            maxWidth: 280,
          }}
        >
          Pick your goals, check them off one by one, and shout{" "}
          <Box component="span" sx={{ fontWeight: 800, color: "#FF6B6B" }}>
            BINGO!
          </Box>{" "}
          🎉
          <br />
          Make this the year you actually follow through.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleSignIn}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 3,
            fontSize: "1rem",
            fontWeight: 700,
            bgcolor: "#FF6B6B",
            boxShadow: "0 4px 20px rgba(255,107,107,0.4)",
            "&:hover": {
              bgcolor: "#E05555",
              boxShadow: "0 6px 28px rgba(255,107,107,0.5)",
            },
            mb: 4,
          }}
          startIcon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          }
        >
          Sign in with Google
        </Button>

        {/* Decorative mock bingo grid */}
        <Box sx={{ width: "100%", maxWidth: 260 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 0.75,
            }}
          >
            {MOCK_CELLS.map((cell, i) => (
              <Box
                key={i}
                sx={{
                  aspectRatio: "1",
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 0.75,
                  bgcolor: cell.free
                    ? "#FECA57"
                    : cell.done
                      ? "#FF6B6B"
                      : "#FFF5F5",
                  border: "2px solid",
                  borderColor: cell.free
                    ? "#F0B800"
                    : cell.done
                      ? "#FF6B6B"
                      : "#FFD5D5",
                  boxShadow:
                    cell.done || cell.free
                      ? "0 2px 10px rgba(255,107,107,0.25)"
                      : "none",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: cell.done || cell.free ? "#fff" : "#FFAAAA",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {cell.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

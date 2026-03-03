import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Paper } from "@mui/material";
import { AuthContext } from "../auth/AuthContext";
import { signInWithGoogle } from "../firebase/auth";

const GRID_WORDS = [
  "Run 5K", "Read 12 Books", "Cook Daily", "Meditate",
  "Learn Guitar", "Drink Water", "Journal", "Save $500",
  "FREE", "Sleep 8h", "No Sugar", "Walk 10k",
  "Call Family", "Learn Spanish", "Volunteer", "Stretch",
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
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      {/* Decorative mini-grid background */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: 1.5,
          p: 3,
          opacity: 0.12,
          pointerEvents: "none",
        }}
      >
        {GRID_WORDS.map((word, i) => (
          <Box
            key={i}
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#333", textAlign: "center", px: 0.5 }}
            >
              {word}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Login card */}
      <Paper
        elevation={12}
        sx={{
          position: "relative",
          p: { xs: 4, sm: 6 },
          borderRadius: 4,
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            background: "linear-gradient(135deg, #f093fb, #f5576c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
            letterSpacing: -1,
          }}
        >
          BingoGoals
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Turn your goals into a game. Track progress, celebrate wins, get BINGO.
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSignIn}
          sx={{
            py: 1.5,
            borderRadius: 3,
            fontSize: "1rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #e07aef 0%, #e04455 100%)",
              boxShadow: "0 6px 24px rgba(240, 147, 251, 0.5)",
            },
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
          Continue with Google
        </Button>

        <Typography variant="caption" color="text.disabled" sx={{ mt: 3, display: "block" }}>
          Free to use. Your goals, your privacy.
        </Typography>
      </Paper>
    </Box>
  );
};

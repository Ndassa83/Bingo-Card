import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../hooks/useAuth";
import { useCards } from "../hooks/useCards";
import { signOut } from "../firebase/auth";
import { createUserProfile, deleteCard } from "../firebase/firestore";
import { CardThumbnail } from "../components/CardThumbnail";
import { CreateCardDialog } from "../components/CreateCardDialog";
import { useEffect } from "react";

export const Dashboard = () => {
  const { user } = useAuth();
  const { cards, loading } = useCards(user?.uid ?? null);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Ensure user profile doc exists on first load
  useEffect(() => {
    if (user) {
      createUserProfile(user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    }
  }, [user]);

  const handleCreate = (name: string, gridDim: 3 | 4 | 5 | 6) => {
    // Navigate to setup wizard with name + gridDim as state
    navigate("/create", { state: { name, gridDim } });
  };

  const handleDelete = async (cardId: string) => {
    if (!user) return;
    if (!confirm("Delete this card? This can't be undone.")) return;
    await deleteCard(user.uid, cardId);
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "grey.200",
          bgcolor: "white",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={900}
          sx={{
            background: "linear-gradient(135deg, #f093fb, #f5576c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Resolution Bingo
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            src={user?.photoURL ?? undefined}
            alt={user?.displayName ?? "User"}
            sx={{ width: 36, height: 36 }}
          />
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {user?.displayName}
          </Typography>
          <Tooltip title="Sign out">
            <IconButton size="small" onClick={signOut}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 4, maxWidth: 1100, mx: "auto" }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>
            Your Cards
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {cards.length === 0
              ? "No cards yet — create your first one!"
              : `${cards.length} card${cards.length !== 1 ? "s" : ""}`}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              boxShadow: "0 4px 14px rgba(240,147,251,0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #e07aef 0%, #e04455 100%)",
              },
            }}
          >
            New Card
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : cards.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 12,
              border: "2px dashed",
              borderColor: "grey.300",
              borderRadius: 4,
            }}
          >
            <Typography fontSize="3rem">🎯</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
              Ready to crush your goals?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create a bingo card and start tracking.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              Create My First Card
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {cards.map((card) => (
              <Grid key={card.id} size={{ xs: 12 }}>
                <CardThumbnail
                  card={card}
                  variant="list"
                  onClick={() => navigate(`/card/${card.id}`)}
                  onDelete={() => handleDelete(card.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <CreateCardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </Box>
  );
};

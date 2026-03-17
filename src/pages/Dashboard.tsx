import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../hooks/useAuth";
import { useCards } from "../hooks/useCards";
import { useSharedCards } from "../hooks/useSharedCards";
import { signOut } from "../firebase/auth";
import { createUserProfile, deleteCard, removeSelfFromCard } from "../firebase/firestore";
import { CardThumbnail } from "../components/CardThumbnail";
import { CreateCardDialog } from "../components/CreateCardDialog";
import { Logo } from "../components/Logo";

export const Dashboard = () => {
  const { user } = useAuth();
  const { cards, loading } = useCards(user?.uid ?? null);
  const { sharedCards, loading: sharedLoading } = useSharedCards(user?.email ?? null);
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

  const handleCreate = (name: string, gridDim: 3 | 5 | 7) => {
    // Navigate to setup wizard with name + gridDim as state
    navigate("/create", { state: { name, gridDim } });
  };

  const handleDelete = async (cardId: string) => {
    if (!user) return;
    if (!confirm("Delete this card? This can't be undone.")) return;
    await deleteCard(user.uid, cardId);
  };

  const handleRemoveShared = async (ownerUid: string, cardId: string) => {
    if (!user?.email) return;
    if (!confirm("Remove this card from your dashboard? You'll lose access.")) return;
    await removeSelfFromCard(ownerUid, cardId, user.email);
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
        <Logo size="md" />
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
              bgcolor: "#1565C0",
              boxShadow: "0 4px 14px rgba(21,101,192,0.3)",
              "&:hover": { bgcolor: "#0D47A1" },
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
                bgcolor: "#1565C0", "&:hover": { bgcolor: "#0D47A1" },
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

        {/* Shared with Me — always rendered for authenticated users */}
        <>
          <Divider sx={{ my: 4 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={800}>
              Shared with Me
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {sharedLoading
                ? "Loading..."
                : sharedCards.length === 0
                  ? "No shared cards yet."
                  : `${sharedCards.length} card${sharedCards.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>
          {sharedLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : sharedCards.length > 0 ? (
            <Grid container spacing={2}>
              {sharedCards.map((card) => (
                <Grid key={card.id} size={{ xs: 12 }}>
                  <CardThumbnail
                    card={card}
                    variant="list"
                    isShared
                    ownerDisplayName={card.ownerDisplayName}
                    ownerEmail={card.ownerEmail}
                    onClick={() =>
                      navigate(`/card/${card.id}`, {
                        state: { ownerUid: card.ownerUid },
                      })
                    }
                    onDelete={() => handleRemoveShared(card.ownerUid, card.id)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : null}
        </>
      </Box>

      <CreateCardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </Box>
  );
};

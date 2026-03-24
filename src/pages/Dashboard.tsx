import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import {
  createUserProfile,
  deleteCard,
  removeSelfFromCard,
} from "../firebase/firestore";
import { CardThumbnail } from "../components/CardThumbnail";
import { CreateCardDialog } from "../components/CreateCardDialog";
import { PeopleDialog } from "../components/PeopleDialog";
import { Logo } from "../components/Logo";
import { FireworksCanvas } from "../components/FireworksCanvas";
import { NotificationBanner } from "../components/NotificationBanner";
import { useNotifications } from "../hooks/useNotifications";
import type { CardData } from "../types";

const WELCOME_KEY = "bingo_welcome_seen";

export const Dashboard = () => {
  const { user } = useAuth();
  const { cards, loading } = useCards(user?.uid ?? null);
  const { sharedCards, loading: sharedLoading } = useSharedCards(
    user?.email ?? null,
  );
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sharingCard, setSharingCard] = useState<CardData | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(
    () => !localStorage.getItem(WELCOME_KEY),
  );
  const [fireworks, setFireworks] = useState(false);

  const handleCloseWelcome = () => {
    localStorage.setItem(WELCOME_KEY, "1");
    setWelcomeOpen(false);
  };

  const { notifications, dismiss: dismissNotifications } = useNotifications(
    sharedCards,
    sharedLoading,
  );

  // Split shared cards into collaborations (editor) and viewer-only
  const collaborations = sharedCards.filter((c) => c.role === "editor");
  const viewerSharedCards = sharedCards.filter((c) => c.role === "viewer");

  // Collect suggested emails: owners of cards shared with the current user
  const suggestedEmails = [
    ...new Set(
      sharedCards
        .map((c) => c.ownerEmail)
        .filter(
          (e): e is string => !!e && e !== (user?.email?.toLowerCase() ?? ""),
        ),
    ),
  ];

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
    navigate("/create", { state: { name, gridDim } });
  };

  const handleDelete = async (cardId: string) => {
    if (!user) return;
    if (!confirm("Delete this card? This can't be undone.")) return;
    await deleteCard(user.uid, cardId);
  };

  const handleRemoveShared = async (ownerUid: string, cardId: string) => {
    if (!user?.email) return;
    if (!confirm("Remove this card from your dashboard? You'll lose access."))
      return;
    await removeSelfFromCard(ownerUid, cardId, user.email);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: fireworks ? "transparent" : "#FFF8F4",
        transition: "background-color 0.9s ease",
        position: "relative",
      }}
    >
      {/* Always mounted so it can fade out smoothly */}
      <Box
        sx={{
          opacity: fireworks ? 1 : 0,
          transition: "opacity 0.9s ease",
          pointerEvents: "none",
        }}
      >
        <FireworksCanvas />
      </Box>

      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #FF6B6B 0%, #FF9500 60%, #FECA57 100%)",
          boxShadow: "0 2px 20px rgba(255,107,107,0.3)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          onClick={() => setFireworks((f) => !f)}
          sx={{ cursor: "pointer" }}
        >
          <Logo size="md" onDark />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            src={user?.photoURL ?? undefined}
            alt={user?.displayName ?? "User"}
            sx={{ width: 36, height: 36, border: "2px solid rgba(255,255,255,0.6)" }}
          />
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ display: { xs: "none", sm: "block" }, color: "white" }}
          >
            {user?.displayName}
          </Typography>
          <Tooltip title="Sign out">
            <IconButton size="small" onClick={signOut} aria-label="Sign out" sx={{ color: "white" }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 4, maxWidth: 1100, mx: "auto", position: "relative", zIndex: 1 }}>
        <NotificationBanner
          notifications={notifications}
          onDismiss={dismissNotifications}
        />
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              color: fireworks ? "white" : "text.primary",
              textShadow: fireworks ? "0 2px 12px rgba(0,0,0,0.8)" : "none",
              transition: "color 0.6s ease, text-shadow 0.6s ease",
            }}
          >
            Your Cards
          </Typography>
          <Typography
            sx={{
              mb: 2,
              color: fireworks ? "rgba(255,255,255,0.7)" : "text.secondary",
              transition: "color 0.6s ease",
            }}
          >
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
              bgcolor: "#FF6B6B",
              boxShadow: "0 4px 14px rgba(255,107,107,0.35)",
              "&:hover": { bgcolor: "#E05555" },
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
              borderColor: "#FFCCC5",
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
                bgcolor: "#1565C0",
                "&:hover": { bgcolor: "#0D47A1" },
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
                  onShare={() => setSharingCard(card)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Collaborations — cards where the user is an editor */}
        <>
          <Divider sx={{ my: 4, borderColor: fireworks ? "rgba(255,255,255,0.2)" : "divider", transition: "border-color 0.6s ease" }} />
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: fireworks ? "white" : "text.primary",
                textShadow: fireworks ? "0 2px 12px rgba(0,0,0,0.8)" : "none",
                transition: "color 0.6s ease, text-shadow 0.6s ease",
              }}
            >
              Collaborations
            </Typography>
            <Typography
              sx={{
                mb: 2,
                color: fireworks ? "rgba(255,255,255,0.7)" : "text.secondary",
                transition: "color 0.6s ease",
              }}
            >
              {sharedLoading
                ? "Loading..."
                : collaborations.length === 0
                  ? "No collaboration boards yet."
                  : `${collaborations.length} board${collaborations.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>
          {sharedLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : collaborations.length > 0 ? (
            <Grid container spacing={2}>
              {collaborations.map((card) => (
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

        {/* Shared with Me — viewer-only cards */}
        <>
          <Divider sx={{ my: 4, borderColor: fireworks ? "rgba(255,255,255,0.2)" : "divider", transition: "border-color 0.6s ease" }} />
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: fireworks ? "white" : "text.primary",
                textShadow: fireworks ? "0 2px 12px rgba(0,0,0,0.8)" : "none",
                transition: "color 0.6s ease, text-shadow 0.6s ease",
              }}
            >
              Shared with Me
            </Typography>
            <Typography
              sx={{
                mb: 2,
                color: fireworks ? "rgba(255,255,255,0.7)" : "text.secondary",
                transition: "color 0.6s ease",
              }}
            >
              {sharedLoading
                ? "Loading..."
                : viewerSharedCards.length === 0
                  ? "No shared cards yet."
                  : `${viewerSharedCards.length} card${viewerSharedCards.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>
          {sharedLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : viewerSharedCards.length > 0 ? (
            <Grid container spacing={2}>
              {viewerSharedCards.map((card) => (
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

      {/* Share with Friends dialog — triggered from thumbnail */}
      {sharingCard && user && (
        <PeopleDialog
          open
          onClose={() => setSharingCard(null)}
          ownerUid={user.uid}
          ownerEmail={user.email ?? ""}
          card={sharingCard}
          suggestedEmails={suggestedEmails}
        />
      )}

      {/* Welcome dialog — shown once to first-time users */}
      <Dialog
        open={welcomeOpen}
        onClose={handleCloseWelcome}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1.4rem",
            textAlign: "center",
            pt: 3,
          }}
        >
          Welcome to Resolution Bingo!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", px: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Turn your goals into a bingo card. Complete goals to fill your board
            — get a full row, column, or diagonal and shout{" "}
            <strong>BINGO!</strong>
          </Typography>
          <Box sx={{ textAlign: "left", display: "inline-block" }}>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              ✅ Create a card with 8, 24, or 48 goals
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              📈 Track progress on each goal over time
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              👥 Invite friends to collaborate or view
            </Typography>
            <Typography variant="body2">
              📄 Export your card as a PDF anytime
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" onClick={handleCloseWelcome} size="large">
            Let's Go!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

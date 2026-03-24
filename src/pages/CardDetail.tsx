import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TuneIcon from "@mui/icons-material/Tune";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PeopleIcon from "@mui/icons-material/People";
import { useAuth } from "../hooks/useAuth";
import { useCardAsCollaborator } from "../hooks/useCardAsCollaborator";
import {
  updateGoal,
  updateCardMeta,
  getUserProfile,
} from "../firebase/firestore";
import { uploadGoalImage } from "../firebase/storage";
import { BingoCard } from "../BingoCard";
import { GoalModal } from "../components/GoalModal";
import { EditBoardDialog } from "../components/EditBoardDialog";
import { PeopleDialog } from "../components/PeopleDialog";
import { ProgressBar } from "../components/ProgressBar";
import { useToast } from "../contexts/ToastContext";
import type { Goal } from "../types";
import { GRADIENTS } from "../types";

export const CardDetail = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ownerUid comes from navigation state when a collaborator navigates to this card
  const ownerUid: string =
    (location.state as { ownerUid?: string } | null)?.ownerUid ?? user?.uid ?? "";

  const isOwner = ownerUid === user?.uid;

  const { card, loading } = useCardAsCollaborator(ownerUid, cardId);

  const [selectedGoalIdx, setSelectedGoalIdx] = useState<number | null>(null);
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [peopleDialogOpen, setPeopleDialogOpen] = useState(false);

  // Fetch owner profile when viewing someone else's board
  const [ownerProfile, setOwnerProfile] = useState<{ displayName: string | null; email: string | null } | null>(null);
  useEffect(() => {
    if (isOwner || !ownerUid) return;
    getUserProfile(ownerUid).then(setOwnerProfile).catch(console.error);
  }, [isOwner, ownerUid]);

  // Derive role for the current user
  const userEmail = user?.email?.toLowerCase() ?? "";
  const canEdit =
    isOwner ||
    (card?.editorEmails ?? []).map((e) => e.toLowerCase()).includes(userEmail);

  // Derive "marked" array from goals.completed state
  const marked = useMemo(() => {
    if (!card) return [];
    const { gridDim, goals } = card;
    const total = gridDim * gridDim;
    const freeIdx = Math.floor(gridDim / 2) * gridDim + Math.floor(gridDim / 2);
    let gi = 0;
    return Array.from({ length: total }, (_, i) => {
      if (i === freeIdx) return true; // FREE is always marked
      return goals[gi++]?.completed ?? false;
    });
  }, [card]);

  const handleCellClick = (goalIdx: number | null) => {
    if (goalIdx === null) return;
    setSelectedGoalIdx(goalIdx);
  };

  const handleGoalUpdate = async (updates: Partial<Goal>) => {
    if (!card || selectedGoalIdx === null) return;
    await updateGoal(ownerUid, card.id, card.goals, selectedGoalIdx, updates);
  };

  const handleImageUpload = async (file: File) => {
    if (!card || selectedGoalIdx === null) return;
    try {
      const url = await uploadGoalImage(ownerUid, card.id, selectedGoalIdx, file);
      await updateGoal(ownerUid, card.id, card.goals, selectedGoalIdx, {
        imageUrl: url,
      });
    } catch (err) {
      showToast(
        `Image upload failed: ${err instanceof Error ? err.message : String(err)}`,
        "error"
      );
    }
  };

  const handleColorChange = async (color: string, gradientKey: string | null) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { backgroundColor: color, gradientKey });
  };

  const handleCellColorChange = async (cellStyleColor: string | null) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { cellStyleColor });
  };

  const handleNameChange = async (name: string) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { name });
  };

  const handleFreeCellChange = async (freeCellText: string, freeCellColor: string | null) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { freeCellText: freeCellText || null, freeCellColor });
  };

  const handleFontColorChange = async (fontColor: string | null) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { fontColor });
  };

  const handleFontSizeScaleChange = async (fontSizeScale: number | null) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { fontSizeScale });
  };

  const handlePdfClean = async () => {
    const { exportCardPdf } = await import("../components/PdfExport");
    if (card) {
      setPdfDialogOpen(false);
      await exportCardPdf(card);
    }
  };

  const handlePdfReport = async () => {
    const { exportReportPdf } = await import("../components/PdfExport");
    if (card) {
      setPdfDialogOpen(false);
      exportReportPdf(card);
    }
  };

  const background = card
    ? card.gradientKey
      ? (GRADIENTS[card.gradientKey] ?? card.backgroundColor)
      : card.backgroundColor
    : "white";

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!card) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Card not found.</Typography>
        <Button onClick={() => navigate("/")} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const completed = card.goals.filter((g) => g.completed).length;
  const total = card.goals.length;
  const ownerName = ownerProfile?.displayName ?? ownerProfile?.email ?? null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "grey.200",
          bgcolor: "white",
        }}
      >
        <IconButton onClick={() => navigate("/")} size="small" aria-label="Go back to dashboard">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} noWrap>
            {card.name}
          </Typography>
          {!isOwner && ownerName && (
            <Chip
              label={`Shared by ${ownerName}`}
              size="small"
              sx={{ fontSize: "0.68rem", height: 20, bgcolor: "#E3F2FD", color: "#1565C0", mt: 0.25 }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {completed}/{total} goals
        </Typography>
        {!canEdit && (
          <Chip label="View only" size="small" color="default" sx={{ fontSize: "0.7rem" }} />
        )}
        {/* Editor + owner controls */}
        {canEdit && (
          <Tooltip title="Edit Board">
            <IconButton size="small" onClick={() => setEditBoardOpen(true)} aria-label="Edit board">
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {/* Owner-only controls */}
        {isOwner && (
          <Tooltip title="Share with Friends">
            <IconButton size="small" onClick={() => setPeopleDialogOpen(true)} aria-label="Share with friends">
              <PeopleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Export PDF">
          <IconButton size="small" onClick={() => setPdfDialogOpen(true)} aria-label="Export PDF">
            <PictureAsPdfIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Progress bar */}
      <ProgressBar value={total > 0 ? (completed / total) * 100 : 0} height={4} />

      {/* Card */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 3 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            background,
            borderRadius: 3,
            p: { xs: 1, sm: 2 },
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
            width: "100%",
            maxWidth: `${card.gridDim * 130 + 32}px`,
          }}
        >
          <BingoCard
            card={card}
            marked={marked}
            onCellClick={handleCellClick}
          />
        </Box>
      </Box>

      {/* PDF choice dialog */}
      <Dialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Export PDF</DialogTitle>
        <DialogActions sx={{ flexDirection: "column", gap: 1, p: 3, pt: 0 }}>
          <Button fullWidth variant="outlined" onClick={handlePdfClean}>
            Clean Card (grid only)
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handlePdfReport}
          >
            Full Progress Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Board Dialog — editors/owner only */}
      {canEdit && (
        <EditBoardDialog
          open={editBoardOpen}
          onClose={() => setEditBoardOpen(false)}
          card={card}
          onColorChange={handleColorChange}
          onCellColorChange={handleCellColorChange}
          onFontColorChange={handleFontColorChange}
          onFontSizeScaleChange={handleFontSizeScaleChange}
          onNameChange={handleNameChange}
          onFreeCellChange={handleFreeCellChange}
        />
      )}

      {/* Goal Modal — visible to all; read-only for viewers */}
      {selectedGoalIdx !== null && (
        <GoalModal
          goal={card.goals[selectedGoalIdx]}
          open
          onClose={() => setSelectedGoalIdx(null)}
          onUpdate={handleGoalUpdate}
          onImageUpload={handleImageUpload}
          readOnly={!canEdit}
        />
      )}

      {/* People Dialog — owner only */}
      {isOwner && (
        <PeopleDialog
          open={peopleDialogOpen}
          onClose={() => setPeopleDialogOpen(false)}
          ownerUid={ownerUid}
          ownerEmail={user?.email ?? ""}
          card={card}
        />
      )}
    </Box>
  );
};

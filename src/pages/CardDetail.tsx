import { useMemo, useState } from "react";
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
import PaletteIcon from "@mui/icons-material/Palette";
import ShareIcon from "@mui/icons-material/Share";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PeopleIcon from "@mui/icons-material/People";
import { useAuth } from "../hooks/useAuth";
import { useCardAsCollaborator } from "../hooks/useCardAsCollaborator";
import {
  updateGoal,
  updateCardMeta,
  enableSharing,
} from "../firebase/firestore";
import { uploadGoalImage } from "../firebase/storage";
import { BingoCard } from "../BingoCard";
import { GoalModal } from "../components/GoalModal";
import { ColorPicker } from "../components/ColorPicker";
import { PeopleDialog } from "../components/PeopleDialog";
import type { Goal } from "../types";
import { GRADIENTS } from "../types";

export const CardDetail = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ownerUid comes from navigation state when a collaborator navigates to this card
  const ownerUid: string =
    (location.state as { ownerUid?: string } | null)?.ownerUid ?? user?.uid ?? "";

  const isOwner = ownerUid === user?.uid;

  const { card, loading } = useCardAsCollaborator(ownerUid, cardId);

  const [selectedGoalIdx, setSelectedGoalIdx] = useState<number | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [peopleDialogOpen, setPeopleDialogOpen] = useState(false);

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
    if (!canEdit || goalIdx === null) return;
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
      console.error("Image upload failed:", err);
      alert(
        `Image upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleColorChange = async (
    color: string,
    gradientKey: string | null,
  ) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { backgroundColor: color, gradientKey });
  };

  const handleCellColorChange = async (cellStyleColor: string | null) => {
    if (!card) return;
    await updateCardMeta(ownerUid, card.id, { cellStyleColor });
  };

  const handleShare = async () => {
    if (!user || !card) return;
    const id = card.shareId ?? (await enableSharing(ownerUid, card.id));
    const url = `${window.location.origin}/share/${id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    alert(`Share link copied!\n\n${url}`);
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
      </Box>
    );
  }

  const completed = card.goals.filter((g) => g.completed).length;
  const total = card.goals.length;

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
        <IconButton onClick={() => navigate("/")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography fontWeight={700} sx={{ flex: 1 }} noWrap>
          {card.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {completed}/{total} goals
        </Typography>
        {!canEdit && (
          <Chip label="View only" size="small" color="default" sx={{ fontSize: "0.7rem" }} />
        )}
        {/* Editor + owner controls */}
        {canEdit && (
          <Tooltip title="Change background">
            <IconButton size="small" onClick={() => setColorPickerOpen(true)}>
              <PaletteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {/* Owner-only controls */}
        {isOwner && (
          <>
            <Tooltip title="Share (read-only link)">
              <IconButton size="small" onClick={handleShare}>
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manage collaborators">
              <IconButton size="small" onClick={() => setPeopleDialogOpen(true)}>
                <PeopleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="Export PDF">
          <IconButton size="small" onClick={() => setPdfDialogOpen(true)}>
            <PictureAsPdfIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Progress bar */}
      <Box sx={{ height: 4, bgcolor: "grey.100" }}>
        <Box
          sx={{
            height: "100%",
            width: `${total > 0 ? (completed / total) * 100 : 0}%`,
            background: "linear-gradient(90deg, #1565C0, #F9A825)",
            transition: "width 0.4s ease",
          }}
        />
      </Box>

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
            sx={{ bgcolor: "#1565C0", "&:hover": { bgcolor: "#0D47A1" } }}
          >
            Full Progress Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Color Picker */}
      {canEdit && (
        <ColorPicker
          open={colorPickerOpen}
          onClose={() => setColorPickerOpen(false)}
          currentColor={card.backgroundColor}
          currentGradient={card.gradientKey}
          currentCellColor={card.cellStyleColor ?? null}
          onColorChange={handleColorChange}
          onCellColorChange={handleCellColorChange}
        />
      )}

      {/* Goal Modal — only for editors/owner */}
      {canEdit && selectedGoalIdx !== null && (
        <GoalModal
          goal={card.goals[selectedGoalIdx]}
          open
          onClose={() => setSelectedGoalIdx(null)}
          onUpdate={handleGoalUpdate}
          onImageUpload={handleImageUpload}
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

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { inviteCollaborator, revokeCollaborator } from "../firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import type { CardData, CollaboratorRole } from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PeopleDialogProps = {
  open: boolean;
  onClose: () => void;
  ownerUid: string;
  ownerEmail: string;
  card: CardData;
  suggestedEmails?: string[];
};

export const PeopleDialog = ({
  open,
  onClose,
  ownerUid,
  ownerEmail,
  card,
  suggestedEmails = [],
}: PeopleDialogProps) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [editorEmails, setEditorEmails] = useState<string[]>(card.editorEmails ?? []);
  const [viewerEmails, setViewerEmails] = useState<string[]>(card.viewerEmails ?? []);

  // Sync from real-time card prop updates
  useEffect(() => {
    setEditorEmails(card.editorEmails ?? []);
    setViewerEmails(card.viewerEmails ?? []);
  }, [card.editorEmails, card.viewerEmails]);

  const isValidEmail = EMAIL_REGEX.test(email.trim());

  // Filter suggestions: exclude owner, already-invited people, and filter by current input
  const filteredSuggestions = suggestedEmails.filter(
    (e) =>
      e !== ownerEmail.toLowerCase() &&
      !editorEmails.includes(e) &&
      !viewerEmails.includes(e) &&
      (email.trim() === "" || e.includes(email.trim().toLowerCase())),
  );

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(null);
  };

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailError(null);
    setSending(true);
    try {
      await inviteCollaborator(ownerUid, ownerEmail, card.id, trimmed, role);
      setEmail("");
      showToast("Invitation sent!", "success");
      // Optimistic update
      if (role === "editor") setEditorEmails((prev) => [...prev, trimmed]);
      else setViewerEmails((prev) => [...prev, trimmed]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to invite.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (revokeEmail: string, revokeRole: CollaboratorRole) => {
    // Optimistic update
    if (revokeRole === "editor") setEditorEmails((prev) => prev.filter((e) => e !== revokeEmail));
    else setViewerEmails((prev) => prev.filter((e) => e !== revokeEmail));
    try {
      await revokeCollaborator(ownerUid, card.id, revokeEmail, revokeRole);
    } catch {
      // Revert on failure — real-time listener will also correct state
      if (revokeRole === "editor") setEditorEmails((prev) => [...prev, revokeEmail]);
      else setViewerEmails((prev) => [...prev, revokeEmail]);
      showToast("Failed to remove collaborator.", "error");
    }
  };

  const hasCollaborators = editorEmails.length > 0 || viewerEmails.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 700,
          pb: 1,
        }}
      >
        Share "{card.name}"
        <IconButton size="small" onClick={onClose} aria-label="Close dialog">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Invite form */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Invite by email
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInvite();
            }}
            error={!!emailError}
            helperText={emailError ?? "Enter a valid email address"}
            autoFocus
            sx={{ flex: 1, minWidth: 200 }}
          />
          <ToggleButtonGroup
            size="small"
            value={role}
            exclusive
            onChange={(_, v: CollaboratorRole | null) => {
              if (v) setRole(v);
            }}
          >
            <ToggleButton value="viewer" sx={{ textTransform: "none", px: 2 }}>
              Viewer
            </ToggleButton>
            <ToggleButton value="editor" sx={{ textTransform: "none", px: 2 }}>
              Editor
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            onClick={handleInvite}
            disabled={!email.trim() || !isValidEmail || sending}
          >
            Add
          </Button>
        </Box>
        {filteredSuggestions.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ width: "100%", mb: 0.25 }}>
              Suggested
            </Typography>
            {filteredSuggestions.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                onClick={() => setEmail(s)}
                sx={{ cursor: "pointer", fontSize: "0.72rem" }}
              />
            ))}
          </Box>
        )}

        {/* Current collaborators */}
        {hasCollaborators && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              People with access
            </Typography>
            <List dense disablePadding>
              {editorEmails.map((e) => (
                <CollaboratorRow
                  key={e}
                  email={e}
                  role="editor"
                  onRevoke={() => handleRevoke(e, "editor")}
                />
              ))}
              {viewerEmails.map((e) => (
                <CollaboratorRow
                  key={e}
                  email={e}
                  role="viewer"
                  onRevoke={() => handleRevoke(e, "viewer")}
                />
              ))}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

type CollaboratorRowProps = {
  email: string;
  role: CollaboratorRole;
  onRevoke: () => void;
};

const CollaboratorRow = ({ email, role, onRevoke }: CollaboratorRowProps) => (
  <ListItem
    disablePadding
    secondaryAction={
      <IconButton edge="end" size="small" onClick={onRevoke} aria-label={`Remove ${email}`}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    }
    sx={{ py: 0.5 }}
  >
    <ListItemText
      primary={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" noWrap>
            {email}
          </Typography>
          <Chip
            label={role}
            size="small"
            sx={{
              height: 18,
              fontSize: "0.65rem",
              bgcolor: role === "editor" ? "#E3F2FD" : "#F5F5F5",
              color: role === "editor" ? "#1565C0" : "#757575",
            }}
          />
        </Box>
      }
    />
  </ListItem>
);

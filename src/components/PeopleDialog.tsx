import { useState } from "react";
import {
  Alert,
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
import type { CardData, CollaboratorRole } from "../types";

type PeopleDialogProps = {
  open: boolean;
  onClose: () => void;
  ownerUid: string;
  ownerEmail: string;
  card: CardData;
};

export const PeopleDialog = ({
  open,
  onClose,
  ownerUid,
  ownerEmail,
  card,
}: PeopleDialogProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const editorEmails: string[] = card.editorEmails ?? [];
  const viewerEmails: string[] = card.viewerEmails ?? [];

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setError(null);
    setSending(true);
    try {
      await inviteCollaborator(ownerUid, ownerEmail, card.id, trimmed, role);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite.");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (revokeEmail: string, revokeRole: CollaboratorRole) => {
    try {
      await revokeCollaborator(ownerUid, card.id, revokeEmail, revokeRole);
    } catch {
      // Silent — real-time listener will reflect actual state
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
        <IconButton size="small" onClick={onClose}>
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
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInvite();
            }}
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
            disabled={!email.trim() || sending}
            sx={{ bgcolor: "#1565C0", "&:hover": { bgcolor: "#0D47A1" }, fontWeight: 700 }}
          >
            Add
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
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
      <IconButton edge="end" size="small" onClick={onRevoke} aria-label="remove">
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

import { Box, Button, Collapse, Paper, Typography } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import type { GoalNotification } from "../types";

type NotificationBannerProps = {
  notifications: GoalNotification[];
  onDismiss: () => void;
};

function formatCompletedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const NotificationBanner = ({
  notifications,
  onDismiss,
}: NotificationBannerProps) => {
  const total = notifications.reduce(
    (sum, n) => sum + n.newlyCompletedGoals.length,
    0,
  );

  return (
    <Collapse in={notifications.length > 0} unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "#EFF6FF",
          border: "1px solid #93C5FD",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <NotificationsActiveIcon sx={{ color: "#1565C0", fontSize: "1.1rem" }} />
            <Typography fontWeight={700} color="#1565C0" variant="body2">
              {total} goal{total !== 1 ? "s" : ""} completed since your last visit
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={onDismiss}
            sx={{ color: "text.secondary", fontWeight: 600, minWidth: 0 }}
          >
            Dismiss
          </Button>
        </Box>

        {notifications.map((n) => (
          <Box key={n.cardId} sx={{ mb: 1.25 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {n.ownerDisplayName ? `${n.ownerDisplayName}'s` : "Shared"} board
              &nbsp;—&nbsp;
              <span style={{ fontWeight: 400, fontStyle: "italic" }}>{n.cardName}</span>
            </Typography>
            {n.newlyCompletedGoals.map((g) => {
              const dateStr = formatCompletedAt(g.completedAt);
              return (
                <Box
                  key={g.index}
                  sx={{ display: "flex", alignItems: "baseline", gap: 1, pl: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    ✅ {g.title || "(untitled)"}
                  </Typography>
                  {dateStr && (
                    <Typography variant="caption" color="text.disabled">
                      {dateStr}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Paper>
    </Collapse>
  );
};

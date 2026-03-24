import { createContext, useCallback, useContext, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

type Severity = "success" | "error" | "info" | "warning";

type ToastContextValue = {
  showToast: (message: string, severity?: Severity) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

type ToastState = { message: string; severity: Severity; key: number };

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = useCallback((message: string, severity: Severity = "success") => {
    setToast({ message, severity, key: Date.now() });
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        key={toast?.key}
      >
        <Alert
          severity={toast?.severity ?? "success"}
          onClose={() => setOpen(false)}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

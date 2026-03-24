import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import "./App.css";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CardSetup } from "./pages/CardSetup";
import { CardDetail } from "./pages/CardDetail";
import { ShareView } from "./pages/ShareView";
import { ToastProvider } from "./contexts/ToastContext";

const theme = createTheme({
  palette: {
    primary: {
      main: "#FF6B6B",
      dark: "#E05555",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          fontWeight: 700,
          borderRadius: 8,
          "&:hover": {
            backgroundColor: "#E05555",
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/share/:shareId" element={<ShareView />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CardSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/card/:cardId"
              element={
                <ProtectedRoute>
                  <CardDetail />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

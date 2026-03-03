import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CardSetup } from "./pages/CardSetup";
import { CardDetail } from "./pages/CardDetail";
import { ShareView } from "./pages/ShareView";

function App() {
  return (
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
  );
}

export default App;

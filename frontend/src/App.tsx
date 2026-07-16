import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import Siem from "./pages/Siem";
import ThreatIntel from "./pages/ThreatIntel";
import Forensics from "./pages/Forensics";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/siem"
            element={
              <ProtectedRoute>
                <Siem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/threat-intel"
            element={
              <ProtectedRoute>
                <ThreatIntel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forensics"
            element={
              <ProtectedRoute>
                <Forensics />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

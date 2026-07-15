import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // While we're checking whether a stored refresh_token is still valid
    // (see AuthContext's useEffect), show nothing rather than flashing
    // the login page and then immediately redirecting away from it.
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

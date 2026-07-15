import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ROLE_COLORS: Record<string, string> = {
  admin: "text-critical border-critical/30 bg-critical/10",
  analyst: "text-accent border-accent/30 bg-accent/10",
  viewer: "text-text-secondary border-border bg-surface-elevated",
};

export default function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-6">
      <h1 className="text-text-primary font-medium text-sm">{title}</h1>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span
              className={`text-[10px] uppercase tracking-wide border rounded px-2 py-0.5 ${
                ROLE_COLORS[user.role]
              }`}
            >
              {user.role}
            </span>
            <span className="text-text-secondary text-sm">{user.full_name}</span>
          </>
        )}
        <button
          onClick={handleLogout}
          className="text-text-secondary hover:text-critical text-sm transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

import { useEffect, useState } from "react";
import { ClipboardList, ShieldAlert, Sliders, Users } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "analyst" | "viewer";
  is_active: boolean;
  created_at: string;
};

type Setting = { key: string; value: string; description: string; updated_at: string };

type AuditLogEntry = {
  id: string;
  actor_id: string;
  action: string;
  target_user_id: string | null;
  details: string;
  created_at: string;
};

type Tab = "users" | "settings" | "audit";

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const loadUsers = () => api.get<AdminUser[]>("/admin/users").then((res) => setUsers(res.data));
  const loadSettings = () => api.get<Setting[]>("/admin/settings").then((res) => setSettings(res.data));
  const loadAuditLogs = () => api.get<AuditLogEntry[]>("/admin/audit-logs").then((res) => setAuditLogs(res.data));

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    loadSettings();
    loadAuditLogs();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <AppLayout title="Admin Panel">
        <div className="card p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-text-primary font-medium mb-1">Restricted to Admin accounts</p>
          <p className="text-text-secondary text-sm">
            User management, settings, and audit logs are the most consequential capabilities
            on the platform, so this is limited to admin accounts only - not analyst.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleRoleChange = async (userId: string, role: string) => {
    setError(null);
    try {
      await api.patch(`/admin/users/${userId}`, { role });
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not update role.");
    }
  };

  const handleActiveToggle = async (userId: string, isActive: boolean) => {
    setError(null);
    try {
      await api.patch(`/admin/users/${userId}`, { is_active: !isActive });
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not update account status.");
    }
  };

  const handleSettingChange = async (key: string, value: string) => {
    await api.patch(`/admin/settings/${key}`, { value });
    loadSettings();
    loadAuditLogs();
  };

  return (
    <AppLayout title="Admin Panel">
      <div className="mb-6">
        <p className="text-text-primary text-lg">Manage users, settings, and audit history</p>
        <p className="text-text-secondary text-sm">Restricted to admin accounts.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: "users" as Tab, label: "Users", icon: Users },
          { id: "settings" as Tab, label: "Settings", icon: Sliders },
          { id: "audit" as Tab, label: "Audit Log", icon: ClipboardList },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.id
                ? "bg-surface-elevated border-accent text-accent"
                : "border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-critical text-sm bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-6">
          {error}
        </div>
      )}

      {tab === "users" && (
        <div className="card p-5">
          {users === null && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          )}
          {users && (
            <ul className="flex flex-col divide-y divide-border">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <li key={u.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-text-primary truncate">
                        {u.full_name} {isSelf && <span className="text-text-secondary text-xs">(you)</span>}
                      </p>
                      <p className="text-text-secondary text-xs font-mono">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-surface-elevated border border-border rounded-lg px-2 py-1 text-xs text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isSelf ? "You cannot change your own role" : undefined}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleActiveToggle(u.id, u.is_active)}
                        disabled={isSelf}
                        className={`text-xs border rounded-lg px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.is_active ? "text-safe border-safe/30" : "text-critical border-critical/30"
                        }`}
                        title={isSelf ? "You cannot deactivate your own account" : undefined}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="card p-5">
          {settings === null && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )}
          {settings && (
            <div className="flex flex-col gap-4">
              {settings.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-mono">{s.key}</p>
                    <p className="text-text-secondary text-xs">{s.description}</p>
                  </div>
                  <input
                    type="text"
                    defaultValue={s.value}
                    onBlur={(e) => e.target.value !== s.value && handleSettingChange(s.key, e.target.value)}
                    className="w-40 bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm font-mono focus:outline-none focus:border-accent shrink-0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="card p-5">
          {auditLogs === null && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          )}
          {auditLogs && auditLogs.length === 0 && (
            <EmptyState
              icon={ShieldAlert}
              title="No audit log entries yet"
              description="User and settings changes made by admins will be recorded here."
            />
          )}
          {auditLogs && auditLogs.length > 0 && (
            <ul className="flex flex-col divide-y divide-border">
              {auditLogs.map((log) => (
                <li key={log.id} className="py-2.5 text-sm">
                  <p className="text-text-primary">
                    <span className="font-mono text-accent">{log.action}</span> - {log.details}
                  </p>
                  <p className="text-text-secondary text-xs">{new Date(log.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AppLayout>
  );
}

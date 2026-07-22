import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, ShieldAlert, Sliders, UserCog, Users } from "lucide-react";
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

const ROLE_BADGE: Record<string, string> = {
  admin: "text-critical border-critical/30 bg-critical/10",
  analyst: "text-warning border-warning/30 bg-warning/10",
  viewer: "text-text-secondary border-border bg-surface-elevated",
};

const ROLE_AVATAR: Record<string, string> = {
  admin: "bg-critical/15 text-critical",
  analyst: "bg-warning/15 text-warning",
  viewer: "bg-accent/15 text-accent",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  const stats = useMemo(() => {
    const items = users || [];
    const active = items.filter((u) => u.is_active).length;
    const admins = items.filter((u) => u.role === "admin").length;
    return { total: items.length, active, admins };
  }, [users]);

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

  const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Sliders },
    { id: "audit", label: "Audit Log", icon: ClipboardList },
  ];

  return (
    <AppLayout title="Admin Panel">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-text-primary text-xl font-semibold tracking-tight">
          Manage users, settings, and audit history
        </p>
        <p className="text-text-secondary text-sm mt-1">Restricted to admin accounts.</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Total Users</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Active</p>
          <p className="font-mono text-2xl font-semibold text-safe mt-1">{stats.active}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Admins</p>
          <p className="font-mono text-2xl font-semibold text-critical mt-1">{stats.admins}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-critical text-sm bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-6"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {tab === "users" && (
          <motion.div key="users" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5">
            {users === null && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            )}
            {users && (
              <ul className="flex flex-col divide-y divide-border">
                {users.map((u, i) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <motion.li
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="py-3 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${ROLE_AVATAR[u.role]}`}
                        >
                          {initials(u.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-text-primary truncate">
                            {u.full_name} {isSelf && <span className="text-text-secondary text-xs">(you)</span>}
                          </p>
                          <p className="text-text-secondary text-xs font-mono">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`border rounded-lg px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed ${ROLE_BADGE[u.role]}`}
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
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}

        {tab === "settings" && (
          <motion.div key="settings" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5">
            {settings === null && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            )}
            {settings && (
              <div className="flex flex-col gap-4">
                {settings.map((s, i) => (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <Sliders size={13} className="text-text-secondary shrink-0" />
                      <div>
                        <p className="text-text-primary text-sm font-mono">{s.key}</p>
                        <p className="text-text-secondary text-xs">{s.description}</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      defaultValue={s.value}
                      onBlur={(e) => e.target.value !== s.value && handleSettingChange(s.key, e.target.value)}
                      className="w-40 bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm font-mono focus:outline-none focus:border-accent transition-colors shrink-0"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "audit" && (
          <motion.div key="audit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5">
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
              <ul className="flex flex-col gap-3">
                {auditLogs.map((log, i) => (
                  <motion.li
                    key={log.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <UserCog size={12} className="text-accent" />
                    </div>
                    <div className="text-sm">
                      <p className="text-text-primary">
                        <span className="font-mono text-accent">{log.action}</span> - {log.details}
                      </p>
                      <p className="text-text-secondary text-xs">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

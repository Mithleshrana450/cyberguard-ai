import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ListTree, ShieldAlert, XCircle, ActivitySquare } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import SeverityBadge from "../components/scanner/SeverityBadge";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import DonutChart from "../components/dashboard/DonutChart";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type Alert = {
  id: string;
  alert_type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  source_ip: string;
  is_resolved: boolean;
  created_at: string;
};

type LoginEvent = {
  id: string;
  email_attempted: string;
  ip_address: string;
  success: boolean;
  created_at: string;
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#F87171",
  high: "#F87171",
  medium: "#FBBF24",
  low: "#8892A6",
};

export default function Siem() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [events, setEvents] = useState<LoginEvent[] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const hasAccess = user?.role === "admin" || user?.role === "analyst";

  useEffect(() => {
    if (!hasAccess) return;
    Promise.all([api.get<Alert[]>("/siem/alerts"), api.get<LoginEvent[]>("/siem/events")])
      .then(([alertsRes, eventsRes]) => {
        setAlerts(alertsRes.data);
        setEvents(eventsRes.data);
      })
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true);
      });
  }, [hasAccess]);

  const stats = useMemo(() => {
    const failedEvents = (events || []).filter((e) => !e.success).length;
    const failRate = events && events.length ? Math.round((failedEvents / events.length) * 100) : null;
    return { failRate, totalEvents: events?.length ?? 0, totalAlerts: alerts?.length ?? 0 };
  }, [events, alerts]);

  const severityDistribution = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    (alerts || []).forEach((a) => counts[a.severity]++);
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value, color: SEVERITY_COLOR[label] }));
  }, [alerts]);

  if (!hasAccess) {
    return (
      <AppLayout title="Mini SIEM">
        <div className="card p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-text-primary font-medium mb-1">Restricted to Analyst / Admin roles</p>
          <p className="text-text-secondary text-sm">
            Login events and security alerts are platform-wide data, so this view is limited to
            analyst and admin accounts.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mini SIEM">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-text-primary text-xl font-semibold tracking-tight">Security Alerts &amp; Login Activity</p>
        <p className="text-text-secondary text-sm mt-1">
          Brute-force detection triggers automatically after repeated failed logins from the same
          IP within a short window (configurable in Admin Panel).
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Total Alerts</p>
          <p className="font-mono text-2xl font-semibold text-warning mt-1">{stats.totalAlerts}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Login Events</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.totalEvents}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Failed Login Rate</p>
          <p className="font-mono text-2xl font-semibold text-critical mt-1">
            {stats.failRate !== null ? `${stats.failRate}%` : "—"}
          </p>
        </div>
      </div>

      {forbidden && <p className="text-critical text-sm mb-4">Access denied by server.</p>}

      {alerts && alerts.length > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <ActivitySquare size={12} />
            Alert Severity Distribution
          </p>
          <DonutChart segments={severityDistribution} centerLabel="Alerts" centerValue={String(stats.totalAlerts)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
            Security Alerts {alerts && `(${alerts.length})`}
          </p>

          {alerts === null && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )}

          {alerts && alerts.length === 0 && (
            <EmptyState
              icon={ShieldCheck}
              title="No alerts"
              description="Nothing suspicious detected yet - brute-force attempts will show up here automatically."
            />
          )}

          <div className="flex flex-col gap-3">
            {alerts?.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface-elevated border border-border rounded-lg shadow-soft-sm p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="flex items-center gap-1.5 text-text-primary text-sm font-medium">
                    <ShieldAlert size={13} className="text-critical shrink-0" />
                    {alert.title}
                  </span>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="text-text-secondary text-xs">{alert.description}</p>
                <p className="text-text-secondary text-xs font-mono mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
            Recent Login Events {events && `(${events.length})`}
          </p>

          {events === null && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          )}

          {events && events.length === 0 && (
            <EmptyState
              icon={ListTree}
              title="No login events"
              description="Login attempts, successful or failed, will be recorded here."
            />
          )}

          <ul className="flex flex-col divide-y divide-border">
            {events?.map((event, i) => (
              <motion.li
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="py-2.5 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-text-primary font-mono truncate">{event.email_attempted}</p>
                  <p className="text-text-secondary text-xs font-mono">{event.ip_address}</p>
                </div>
                <span
                  className={`flex items-center gap-1 text-xs ${event.success ? "text-safe" : "text-critical"}`}
                >
                  {event.success ? <ShieldCheck size={12} /> : <XCircle size={12} />}
                  {event.success ? "success" : "failed"}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}

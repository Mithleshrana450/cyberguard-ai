import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import SeverityBadge from "../components/scanner/SeverityBadge";
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

export default function Siem() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [events, setEvents] = useState<LoginEvent[] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Client-side role check gives an immediate, friendly message instead of
  // firing a request we already know the server will reject with 403 -
  // but the SERVER-SIDE check (require_role in siem.py) is what actually
  // enforces this; this is UX polish, not the security boundary itself.
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

  if (!hasAccess) {
    return (
      <AppLayout title="Mini SIEM">
        <div className="bg-surface border border-border rounded-lg p-6 text-center max-w-md mx-auto mt-12">
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
      <div className="mb-6">
        <p className="text-text-primary text-lg">Security Alerts &amp; Login Activity</p>
        <p className="text-text-secondary text-sm">
          Brute-force detection triggers automatically after 5 failed logins from the same IP
          within 5 minutes.
        </p>
      </div>

      {forbidden && <p className="text-critical text-sm mb-4">Access denied by server.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-lg p-5">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
            Security Alerts {alerts && `(${alerts.length})`}
          </p>
          {alerts && alerts.length === 0 && (
            <p className="text-safe text-sm">No alerts - nothing suspicious detected yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {alerts?.map((alert) => (
              <div key={alert.id} className="bg-surface-elevated border border-border rounded p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-text-primary text-sm font-medium">{alert.title}</p>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="text-text-secondary text-xs">{alert.description}</p>
                <p className="text-text-secondary text-xs font-mono mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
            Recent Login Events {events && `(${events.length})`}
          </p>
          {events && events.length === 0 && (
            <p className="text-text-secondary text-sm">No login events recorded yet.</p>
          )}
          <ul className="flex flex-col divide-y divide-border">
            {events?.map((event) => (
              <li key={event.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-text-primary font-mono truncate">{event.email_attempted}</p>
                  <p className="text-text-secondary text-xs font-mono">{event.ip_address}</p>
                </div>
                <span className={event.success ? "text-safe text-xs" : "text-critical text-xs"}>
                  {event.success ? "success" : "failed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}

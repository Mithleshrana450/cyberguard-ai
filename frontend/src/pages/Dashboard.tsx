import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import SecurityScoreCard from "../components/dashboard/SecurityScoreCard";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type DashboardSummary = {
  security_score: number;
  active_alerts: number;
  critical_alerts: number;
  total_scans_run: number;
  recent_activity: Record<string, unknown>[];
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardSummary>("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div className="mb-6">
        <p className="text-text-primary text-lg">Welcome back, {user?.full_name.split(" ")[0]}</p>
        <p className="text-text-secondary text-sm">
          Here's the current state of your security posture.
        </p>
      </div>

      {error && <p className="text-critical text-sm mb-4">{error}</p>}

      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <SecurityScoreCard score={summary.security_score} />
          <div className="lg:col-span-2 grid grid-cols-3 gap-4">
            <StatCard label="Active Alerts" value={summary.active_alerts} tone="warning" />
            <StatCard label="Critical Alerts" value={summary.critical_alerts} tone="critical" />
            <StatCard label="Scans Run" value={summary.total_scans_run} tone="neutral" />
          </div>
        </div>
      )}

      {summary && <RecentActivity items={summary.recent_activity} />}
    </AppLayout>
  );
}

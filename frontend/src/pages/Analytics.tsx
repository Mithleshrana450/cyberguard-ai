import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import TrendBarChart from "../components/analytics/TrendBarChart";
import DistributionBar from "../components/analytics/DistributionBar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type Analytics = {
  alert_trend: { date: string; count: number }[];
  incident_trend: { date: string; count: number }[];
  scan_score_distribution: Record<string, number>;
  finding_severity_distribution: Record<string, number>;
  alert_severity_distribution: Record<string, number>;
  phishing_risk_distribution: Record<string, number>;
  executive_summary: {
    total_users: number;
    total_scans: number;
    average_security_score: number | null;
    total_alerts: number;
    total_incidents: number;
    incident_resolution_rate_percent: number | null;
  };
};

export default function Analytics() {
  const { user } = useAuth();
  const hasAccess = user?.role === "admin" || user?.role === "analyst";
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!hasAccess) return;
    api.get<Analytics>(`/analytics/summary?days=${days}`).then((res) => setData(res.data));
  }, [hasAccess, days]);

  if (!hasAccess) {
    return (
      <AppLayout title="Analytics">
        <div className="card p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-text-primary font-medium mb-1">Restricted to Analyst / Admin roles</p>
          <p className="text-text-secondary text-sm">
            Analytics aggregates platform-wide data across all users, so this view is limited to
            analyst and admin accounts.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analytics">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-text-primary text-lg">Platform-wide security analytics</p>
          <p className="text-text-secondary text-sm">Trends and distributions across all users.</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {data === null && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <p className="text-text-secondary text-xs uppercase tracking-wide">Total Users</p>
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {data.executive_summary.total_users}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-text-secondary text-xs uppercase tracking-wide">Avg Score</p>
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {data.executive_summary.average_security_score ?? "—"}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-text-secondary text-xs uppercase tracking-wide">Total Alerts</p>
              <p className="font-mono text-2xl font-semibold text-warning">
                {data.executive_summary.total_alerts}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-text-secondary text-xs uppercase tracking-wide">Resolution Rate</p>
              <p className="font-mono text-2xl font-semibold text-safe">
                {data.executive_summary.incident_resolution_rate_percent ?? "—"}
                {data.executive_summary.incident_resolution_rate_percent !== null && "%"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card p-5">
              <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Alert Trend</p>
              <TrendBarChart data={data.alert_trend} />
            </div>
            <div className="card p-5">
              <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Incident Trend</p>
              <TrendBarChart data={data.incident_trend} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
                Scan Score Distribution
              </p>
              <DistributionBar distribution={data.scan_score_distribution} />
            </div>
            <div className="card p-5">
              <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
                Alert Severity Distribution
              </p>
              <DistributionBar distribution={data.alert_severity_distribution} />
            </div>
            <div className="card p-5">
              <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
                Scan Finding Severity Distribution
              </p>
              <DistributionBar distribution={data.finding_severity_distribution} />
            </div>
            <div className="card p-5">
              <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">
                Phishing Risk Distribution
              </p>
              <DistributionBar distribution={data.phishing_risk_distribution} />
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

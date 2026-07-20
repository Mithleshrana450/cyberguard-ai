import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import CircularScore from "../components/dashboard/CircularScore";
import MetricCard from "../components/dashboard/MetricCard";
import QuickActions from "../components/dashboard/QuickActions";
import ScoreTrendChart from "../components/dashboard/ScoreTrendChart";
import DonutChart from "../components/dashboard/DonutChart";
import RecentAlertsCard from "../components/dashboard/RecentAlertsCard";
import SystemStatusCard from "../components/dashboard/SystemStatusCard";
import ActivityCard from "../components/dashboard/ActivityCard";
import EmptyState from "../components/ui/EmptyState";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type DashboardSummary = {
  security_score: number;
  active_alerts: number;
  critical_alerts: number;
  total_scans_run: number;
  recent_activity: Record<string, unknown>[];
};

type ScanListItem = {
  id: string;
  target_url: string;
  status: "pending" | "running" | "completed" | "failed";
  security_score: number | null;
  started_at: string;
  completed_at: string | null;
};

type Finding = { id: string; severity: "critical" | "high" | "medium" | "low" | "info"; title: string };

type ScanDetail = ScanListItem & { findings: Finding[] };

const SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanListItem[] | null>(null);
  const [latestScanDetail, setLatestScanDetail] = useState<ScanDetail | null>(null);
  const [hasFetchedDetail, setHasFetchedDetail] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // All three endpoints below already existed before this redesign -
    // the dashboard now just reads more of what's already there. No new
    // backend endpoints were added to build this page.
    api
      .get<DashboardSummary>("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load dashboard data."));

    api.get<ScanListItem[]>("/scanner/scans").then((res) => {
      setScanHistory(res.data);
      const latestCompleted = res.data.find((s) => s.status === "completed");
      if (latestCompleted) {
        api
          .get<ScanDetail>(`/scanner/scans/${latestCompleted.id}`)
          .then((detailRes) => setLatestScanDetail(detailRes.data))
          .finally(() => setHasFetchedDetail(true));
      } else {
        setHasFetchedDetail(true);
      }
    });

    api
      .get("/health")
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  // --- Derived, client-side-only analytics from data already fetched
  // above - real computation over existing endpoints, no new backend
  // work required. ---

  const completedScans = useMemo(
    () => (scanHistory || []).filter((s) => s.status === "completed" && s.security_score !== null),
    [scanHistory]
  );

  const scoreTrendPoints = useMemo(() => {
    return [...completedScans]
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      .slice(-10)
      .map((s) => ({
        label: new Date(s.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: s.security_score as number,
      }));
  }, [completedScans]);

  const weeklyTrend = useMemo(() => {
    if (completedScans.length === 0) return null;
    const sorted = [...completedScans].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const latest = sorted[0];
    const weekAgoCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const priorScan = sorted.find((s) => new Date(s.started_at).getTime() <= weekAgoCutoff);
    if (!priorScan || priorScan.id === latest.id) return null;
    return (latest.security_score as number) - (priorScan.security_score as number);
  }, [completedScans]);

  const successRateSegments = useMemo(() => {
    const history = scanHistory || [];
    const completed = history.filter((s) => s.status === "completed").length;
    const failed = history.filter((s) => s.status === "failed").length;
    const inProgress = history.filter((s) => s.status === "pending" || s.status === "running").length;
    return [
      { label: "Completed", value: completed, color: "#4ADE80" },
      { label: "Failed", value: failed, color: "#F87171" },
      { label: "In Progress", value: inProgress, color: "#FBBF24" },
    ];
  }, [scanHistory]);

  const successRatePercent = useMemo(() => {
    const history = scanHistory || [];
    if (history.length === 0) return null;
    const completed = history.filter((s) => s.status === "completed").length;
    return Math.round((completed / history.length) * 100);
  }, [scanHistory]);

  const alertDistributionSegments = useMemo(() => {
    if (!summary) return [];
    const other = Math.max(0, summary.active_alerts - summary.critical_alerts);
    return [
      { label: "Critical", value: summary.critical_alerts, color: "#F87171" },
      { label: "Other", value: other, color: "#FBBF24" },
    ];
  }, [summary]);

  // null = still loading, [] = confirmed there's nothing to show - these
  // are genuinely different states and the UI (loading text vs. an
  // honest empty state) should be able to tell them apart.
  const recentFindings = useMemo(() => {
    if (!hasFetchedDetail) return null;
    if (!latestScanDetail) return [];
    return [...latestScanDetail.findings]
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return order[a.severity] - order[b.severity];
      })
      .slice(0, 5);
  }, [hasFetchedDetail, latestScanDetail]);

  const isLoading = summary === null && !error;

  return (
    <AppLayout title="Dashboard">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-text-primary text-xl font-semibold tracking-tight">
          Welcome back, {user?.full_name.split(" ")[0]}
        </p>
        <p className="text-text-secondary text-sm mt-1">Here's the current state of your security posture.</p>
      </motion.div>

      {error && <p className="text-critical text-sm mb-4">{error}</p>}

      <motion.section
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-3">Quick Actions</p>
        <QuickActions />
      </motion.section>

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-64" />
          <div className="lg:col-span-2 grid grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      )}

      {summary && (
        <motion.section
          variants={SECTION_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <CircularScore
            score={summary.security_score}
            trend={weeklyTrend}
            hasData={summary.total_scans_run > 0}
          />
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard label="Active Alerts" value={summary.active_alerts} icon={AlertTriangle} tone="warning" />
            <MetricCard label="Critical Alerts" value={summary.critical_alerts} icon={ShieldAlert} tone="critical" />
            <MetricCard label="Total Scans" value={summary.total_scans_run} icon={TrendingUp} tone="accent" />
          </div>
        </motion.section>
      )}

      <motion.section
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        <div className="card p-5 lg:col-span-1">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Security Score Trend</p>
          {scanHistory === null ? <Skeleton className="h-28" /> : <ScoreTrendChart points={scoreTrendPoints} />}
        </div>
        <div className="card p-5 lg:col-span-1">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Alert Distribution</p>
          {summary === null ? (
            <Skeleton className="h-28" />
          ) : (
            <DonutChart
              segments={alertDistributionSegments}
              centerLabel="Total"
              centerValue={String(summary.active_alerts)}
            />
          )}
        </div>
        <div className="card p-5 lg:col-span-1">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Scan Success Rate</p>
          {scanHistory === null ? (
            <Skeleton className="h-28" />
          ) : (
            <DonutChart
              segments={successRateSegments}
              centerLabel="Success"
              centerValue={successRatePercent !== null ? `${successRatePercent}%` : "—"}
            />
          )}
        </div>
      </motion.section>

      <motion.section
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        <div className="lg:col-span-2">
          <RecentAlertsCard findings={recentFindings} sourceLabel={latestScanDetail?.target_url || null} />
        </div>
        <SystemStatusCard apiStatus={apiStatus} />
      </motion.section>

      <motion.section
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="card p-5">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Recent Activity</p>
          {summary === null ? (
            <div className="flex flex-col gap-2 mt-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : summary.recent_activity.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No activity yet"
              description="Scans and other actions will show up here as you use the platform."
            />
          ) : (
            <div className="divide-y divide-border">
              {summary.recent_activity.map((activity, i) => (
                <ActivityCard key={i} activity={activity} index={i} />
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </AppLayout>
  );
}

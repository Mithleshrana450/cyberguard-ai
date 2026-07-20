import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Globe, History, ScanLine, ShieldCheck, TrendingUp, XCircle } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import FindingCard from "../components/scanner/FindingCard";
import ScoreRing from "../components/scanner/ScoreRing";
import ScoreTrendChart from "../components/dashboard/ScoreTrendChart";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import api from "../services/api";

type Finding = {
  id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  recommendation: string;
};

type ScanResult = {
  id: string;
  target_url: string;
  status: "pending" | "running" | "completed" | "failed";
  security_score: number | null;
  error_message: string | null;
  started_at: string;
  findings: Finding[];
};

type ScanListItem = {
  id: string;
  target_url: string;
  status: string;
  security_score: number | null;
  started_at: string;
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  completed: { icon: CheckCircle2, className: "text-safe" },
  failed: { icon: XCircle, className: "text-critical" },
  running: { icon: Clock, className: "text-warning" },
  pending: { icon: Clock, className: "text-text-secondary" },
};

function scoreColor(score: number | null) {
  if (score === null) return "text-text-secondary";
  if (score >= 80) return "text-safe";
  if (score >= 50) return "text-warning";
  return "text-critical";
}

export default function Scanner() {
  const [targetUrl, setTargetUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanListItem[] | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const loadHistory = () => {
    api.get<ScanListItem[]>("/scanner/scans").then((res) => setHistory(res.data));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsScanning(true);
    setResult(null);
    setSelectedHistoryId(null);
    try {
      const response = await api.post<ScanResult>("/scanner/scans", { target_url: targetUrl });
      setResult(response.data);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Scan failed. Check the URL and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  // Clicking a past scan reuses the existing GET /scanner/scans/{id}
  // endpoint (it already returned full findings, it just wasn't wired
  // into the UI before) to show that scan's full report inline, without
  // needing to re-run it.
  const handleViewHistoryItem = async (id: string) => {
    setError(null);
    setSelectedHistoryId(id);
    setIsLoadingDetail(true);
    try {
      const response = await api.get<ScanResult>(`/scanner/scans/${id}`);
      setResult(response.data);
    } catch {
      setError("Could not load that scan's details.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const sortedFindings = result
    ? [...result.findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    : [];

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    sortedFindings.forEach((f) => counts[f.severity]++);
    return counts;
  }, [sortedFindings]);

  // --- Stats derived client-side from the history we already fetch -
  // same pattern as the Dashboard redesign, no new backend calls. ---

  const stats = useMemo(() => {
    const items = history || [];
    const completed = items.filter((s) => s.status === "completed" && s.security_score !== null);
    const avgScore = completed.length
      ? Math.round(completed.reduce((sum, s) => sum + (s.security_score as number), 0) / completed.length)
      : null;
    const lastScan = items[0] || null;
    return { total: items.length, avgScore, lastScan };
  }, [history]);

  const trendPoints = useMemo(() => {
    const items = (history || []).filter((s) => s.status === "completed" && s.security_score !== null);
    return [...items]
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      .slice(-10)
      .map((s) => ({
        label: new Date(s.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: s.security_score as number,
      }));
  }, [history]);

  return (
    <AppLayout title="Website Security Scanner">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-text-primary text-xl font-semibold tracking-tight">Scan a website</p>
        <p className="text-text-secondary text-sm mt-1">
          Checks security headers, TLS certificate health, and robots.txt exposure.{" "}
          <span className="text-warning">Only scan sites you own or are authorized to test.</span>
        </p>
      </motion.div>

      {/* Stats bar - real numbers computed from your own scan history */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Total Scans</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Average Score</p>
          <p className={`font-mono text-2xl font-semibold mt-1 ${scoreColor(stats.avgScore)}`}>
            {stats.avgScore ?? "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Last Scan</p>
          <p className="text-sm text-text-primary mt-1.5 truncate">
            {stats.lastScan ? stats.lastScan.status : "No scans yet"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="url"
            required
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isScanning}
          className="bg-accent text-background font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isScanning ? "Scanning..." : "Run Scan"}
        </motion.button>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-critical text-sm bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-8"
        >
          {error}
        </motion.div>
      )}

      {(isScanning || isLoadingDetail) && (
        <div className="mb-8 flex flex-col gap-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && !isScanning && !isLoadingDetail && (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-10"
          >
            <div className="card p-5 mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <ScoreRing score={result.security_score} size={112} />

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="font-mono text-text-primary text-sm break-all">{result.target_url}</p>
                <p className="text-text-secondary text-xs mt-1">
                  {result.findings.length} finding(s) &middot; scanned{" "}
                  {new Date(result.started_at).toLocaleString()}
                </p>

                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {(["critical", "high", "medium", "low", "info"] as const).map((sev) =>
                    severityCounts[sev] > 0 ? (
                      <span
                        key={sev}
                        className="text-[10px] uppercase tracking-wide border border-border rounded-lg px-2 py-1 text-text-secondary"
                      >
                        {sev}: <span className="text-text-primary font-mono">{severityCounts[sev]}</span>
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            </div>

            {result.status === "failed" && (
              <p className="text-critical text-sm mb-4">{result.error_message}</p>
            )}

            <div className="flex flex-col gap-3">
              {sortedFindings.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <FindingCard finding={f} />
                </motion.div>
              ))}
              {result.status === "completed" && sortedFindings.length === 0 && (
                <div className="card p-5">
                  <EmptyState
                    icon={ShieldCheck}
                    title="No issues found"
                    description="All checks passed for this scan."
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {trendPoints.length > 1 && (
        <div className="card p-5 mb-6">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <TrendingUp size={12} />
            Score Trend
          </p>
          <ScoreTrendChart points={trendPoints} />
        </div>
      )}

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <History size={12} />
          Scan History
        </p>
        {history === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        )}
        {history && history.length === 0 && (
          <EmptyState
            icon={ScanLine}
            title="No scans yet"
            description="Run your first scan above to start building a security history for your sites."
          />
        )}
        {history && history.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {history.map((scan, i) => {
              const StatusIcon = STATUS_CONFIG[scan.status]?.icon || Clock;
              const isSelected = scan.id === selectedHistoryId;
              return (
                <motion.li
                  key={scan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <button
                    onClick={() => handleViewHistoryItem(scan.id)}
                    className={`w-full py-3 px-2 -mx-2 rounded-lg flex items-center justify-between gap-3 text-sm text-left transition-colors ${
                      isSelected ? "bg-surface-elevated" : "hover:bg-surface-elevated"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StatusIcon size={13} className={STATUS_CONFIG[scan.status]?.className} />
                      <span className="font-mono text-text-primary truncate">{scan.target_url}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-text-secondary text-xs">
                        {new Date(scan.started_at).toLocaleDateString()}
                      </span>
                      <span className={`font-mono text-sm ${scoreColor(scan.security_score)}`}>
                        {scan.security_score ?? "—"}
                      </span>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

import { FormEvent, useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import FindingCard from "../components/scanner/FindingCard";
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

function scoreColor(score: number | null) {
  if (score === null) return "text-text-secondary";
  if (score >= 80) return "text-safe";
  if (score >= 50) return "text-warning";
  return "text-critical";
}

export default function Scanner() {
  const [targetUrl, setTargetUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanListItem[] | null>(null);

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

  const sortedFindings = result
    ? [...result.findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    : [];

  return (
    <AppLayout title="Website Security Scanner">
      <div className="mb-8">
        <p className="text-text-primary text-lg">Scan a website</p>
        <p className="text-text-secondary text-sm">
          Checks security headers, TLS certificate health, and robots.txt exposure.{" "}
          <span className="text-warning">Only scan sites you own or are authorized to test.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="url"
          required
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isScanning}
          className="bg-accent text-background font-medium rounded-lg px-5 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isScanning ? "Scanning..." : "Run Scan"}
        </button>
      </form>

      {error && (
        <div className="text-critical text-sm bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-8">
          {error}
        </div>
      )}

      {isScanning && (
        <div className="mb-8 flex flex-col gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {result && (
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4 card p-4">
            <div>
              <p className="text-text-secondary text-xs uppercase tracking-wide">Security Score</p>
              <p className={`font-mono text-3xl font-semibold ${scoreColor(result.security_score)}`}>
                {result.security_score ?? "—"}
                {result.security_score !== null && <span className="text-lg text-text-secondary">/100</span>}
              </p>
            </div>
            <div className="text-text-secondary text-sm">
              <p className="font-mono">{result.target_url}</p>
              <p>{result.findings.length} finding(s)</p>
            </div>
          </div>

          {result.status === "failed" && (
            <p className="text-critical text-sm mb-4">{result.error_message}</p>
          )}

          <div className="flex flex-col gap-3">
            {sortedFindings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
            {result.status === "completed" && sortedFindings.length === 0 && (
              <p className="text-safe text-sm">No issues found - all checks passed.</p>
            )}
          </div>
        </div>
      )}

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Scan History</p>
        {history === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
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
            {history.map((scan) => (
              <li key={scan.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-mono text-text-primary truncate">{scan.target_url}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-text-secondary">{scan.status}</span>
                  <span className={`font-mono ${scoreColor(scan.security_score)}`}>
                    {scan.security_score ?? "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

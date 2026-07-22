import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fish, Mail, Sparkles, ShieldCheck, Link2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import ScoreRing from "../components/scanner/ScoreRing";
import DonutChart from "../components/dashboard/DonutChart";
import api from "../services/api";

type Finding = { severity: "critical" | "high" | "medium" | "low"; title: string; description: string };

type PhishingAnalysis = {
  id: string;
  analysis_type: "url" | "email";
  input_preview: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  findings_json: string;
  ai_explanation: string | null;
  created_at: string;
};

const RISK_STYLES: Record<string, string> = {
  low: "text-safe border-safe/30 bg-safe/10",
  medium: "text-warning border-warning/30 bg-warning/10",
  high: "text-critical border-critical/30 bg-critical/10",
  critical: "text-critical border-critical/50 bg-critical/20",
};

const RISK_DOT: Record<string, string> = {
  low: "#4ADE80",
  medium: "#FBBF24",
  high: "#F87171",
  critical: "#F87171",
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function Phishing() {
  const [mode, setMode] = useState<"url" | "email">("url");
  const [urlValue, setUrlValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhishingAnalysis | null>(null);
  const [history, setHistory] = useState<PhishingAnalysis[] | null>(null);

  const loadHistory = () => {
    api.get<PhishingAnalysis[]>("/phishing/history").then((res) => setHistory(res.data));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      const response =
        mode === "url"
          ? await api.post<PhishingAnalysis>("/phishing/analyze-url", { url: urlValue })
          : await api.post<PhishingAnalysis>("/phishing/analyze-email", { raw_email: emailValue });
      setResult(response.data);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const findings: Finding[] = result
    ? JSON.parse(result.findings_json).sort(
        (a: Finding, b: Finding) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      )
    : [];

  // --- Stats derived client-side from history already fetched above ---
  const stats = useMemo(() => {
    const items = history || [];
    const total = items.length;
    const highRisk = items.filter((i) => i.risk_level === "high" || i.risk_level === "critical").length;
    const avgRisk = total ? Math.round(items.reduce((sum, i) => sum + i.risk_score, 0) / total) : null;
    return { total, highRisk, avgRisk };
  }, [history]);

  const distributionSegments = useMemo(() => {
    const items = history || [];
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    items.forEach((i) => counts[i.risk_level]++);
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value, color: RISK_DOT[label] }));
  }, [history]);

  return (
    <AppLayout title="Phishing Detection">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-text-primary text-xl font-semibold tracking-tight">Analyze a URL or email</p>
        <p className="text-text-secondary text-sm mt-1">
          Runs heuristic checks (typosquatting, link tricks, urgency language) plus an optional
          AI-generated plain-English explanation.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Total Checks</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">High Risk</p>
          <p className="font-mono text-2xl font-semibold text-critical mt-1">{stats.highRisk}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Avg Risk Score</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.avgRisk ?? "—"}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            mode === "url"
              ? "bg-surface-elevated border-accent text-accent"
              : "border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          <Link2 size={13} />
          URL
        </button>
        <button
          onClick={() => setMode("email")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            mode === "email"
              ? "bg-surface-elevated border-accent text-accent"
              : "border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          <Mail size={13} />
          Email
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        {mode === "url" ? (
          <div className="flex gap-3">
            <input
              type="text"
              required
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="http://paypa1-secure.com/login"
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:border-accent transition-colors"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isLoading}
              className="bg-accent text-background font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              required
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder={
                "From: Support <support@example.com>\nReply-To: attacker@other-domain.com\nSubject: Urgent\n\nYour account will be suspended. Verify immediately: http://192.168.1.1/confirm"
              }
              rows={8}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:border-accent transition-colors resize-y"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isLoading}
              className="self-start bg-accent text-background font-medium rounded-lg px-5 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Analyzing..." : "Analyze Email"}
            </motion.button>
          </div>
        )}
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

      {isLoading && <Skeleton className="h-32 mb-8" />}

      <AnimatePresence mode="wait">
        {result && !isLoading && (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-10"
          >
            <div className="card p-5 mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <ScoreRing score={result.risk_score} size={104} invert />
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Risk Assessment</p>
                <span
                  className={`inline-block text-xs uppercase tracking-wide border rounded-lg px-3 py-1.5 ${RISK_STYLES[result.risk_level]}`}
                >
                  {result.risk_level} risk
                </span>
                <p className="text-text-secondary text-xs mt-3">
                  {findings.length} indicator(s) detected
                </p>
              </div>
            </div>

            {result.ai_explanation && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-5 mb-4 flex gap-3"
              >
                <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-accent text-xs uppercase tracking-wide mb-1">AI Explanation</p>
                  <p className="text-text-primary text-sm">{result.ai_explanation}</p>
                </div>
              </motion.div>
            )}

            {findings.length === 0 ? (
              <div className="card p-5">
                <EmptyState
                  icon={ShieldCheck}
                  title="No suspicious indicators"
                  description="This URL or email didn't trigger any heuristic checks."
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {findings.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-surface-elevated border border-border rounded-lg shadow-soft-sm p-4"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-text-primary text-sm font-medium">{f.title}</p>
                      <span
                        className={`text-[10px] uppercase tracking-wide border rounded px-2 py-0.5 ${RISK_STYLES[f.severity]}`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm">{f.description}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {history && history.length > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Risk Distribution</p>
          <DonutChart segments={distributionSegments} centerLabel="Total" centerValue={String(stats.total)} />
        </div>
      )}

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Analysis History</p>
        {history === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}
        {history && history.length === 0 && (
          <EmptyState
            icon={Fish}
            title="No analyses yet"
            description="Check a suspicious URL or email above to see it here."
          />
        )}
        {history && history.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {history.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="text-text-secondary text-xs uppercase mr-2">{item.analysis_type}</span>
                  <span className="font-mono text-text-primary truncate">{item.input_preview}</span>
                </div>
                <span
                  className={`text-xs uppercase tracking-wide border rounded-lg px-2 py-0.5 shrink-0 ${RISK_STYLES[item.risk_level]}`}
                >
                  {item.risk_level}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

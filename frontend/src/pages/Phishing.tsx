import { FormEvent, useEffect, useState } from "react";
import { Fish, Sparkles } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
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

  return (
    <AppLayout title="Phishing Detection">
      <div className="mb-8">
        <p className="text-text-primary text-lg">Analyze a URL or email</p>
        <p className="text-text-secondary text-sm">
          Runs heuristic checks (typosquatting, link tricks, urgency language) plus an optional
          AI-generated plain-English explanation.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("url")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            mode === "url"
              ? "bg-surface-elevated border-accent text-accent"
              : "border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          URL
        </button>
        <button
          onClick={() => setMode("email")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            mode === "email"
              ? "bg-surface-elevated border-accent text-accent"
              : "border-border text-text-secondary hover:text-text-primary"
          }`}
        >
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
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-accent text-background font-medium rounded-lg px-5 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
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
              className="bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:border-accent resize-y"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="self-start bg-accent text-background font-medium rounded-lg px-5 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Analyzing..." : "Analyze Email"}
            </button>
          </div>
        )}
      </form>

      {error && (
        <div className="text-critical text-sm bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-8">
          {error}
        </div>
      )}

      {isLoading && <Skeleton className="h-32 mb-8" />}

      {result && (
        <div className="mb-10">
          <div className="card p-5 mb-4 flex items-center gap-6">
            <div>
              <p className="text-text-secondary text-xs uppercase tracking-wide">Risk Score</p>
              <p className="font-mono text-3xl font-semibold text-text-primary">{result.risk_score}/100</p>
            </div>
            <span
              className={`text-xs uppercase tracking-wide border rounded-lg px-3 py-1.5 ${RISK_STYLES[result.risk_level]}`}
            >
              {result.risk_level} risk
            </span>
          </div>

          {result.ai_explanation && (
            <div className="card p-5 mb-4 flex gap-3">
              <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-accent text-xs uppercase tracking-wide mb-1">AI Explanation</p>
                <p className="text-text-primary text-sm">{result.ai_explanation}</p>
              </div>
            </div>
          )}

          {findings.length === 0 ? (
            <p className="text-safe text-sm">No suspicious indicators detected.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {findings.map((f, i) => (
                <div key={i} className="bg-surface-elevated border border-border rounded-lg shadow-soft-sm p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-text-primary text-sm font-medium">{f.title}</p>
                    <span
                      className={`text-[10px] uppercase tracking-wide border rounded px-2 py-0.5 ${RISK_STYLES[f.severity]}`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm">{f.description}</p>
                </div>
              ))}
            </div>
          )}
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
            {history.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="text-text-secondary text-xs uppercase mr-2">{item.analysis_type}</span>
                  <span className="font-mono text-text-primary truncate">{item.input_preview}</span>
                </div>
                <span
                  className={`text-xs uppercase tracking-wide border rounded-lg px-2 py-0.5 shrink-0 ${RISK_STYLES[item.risk_level]}`}
                >
                  {item.risk_level}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

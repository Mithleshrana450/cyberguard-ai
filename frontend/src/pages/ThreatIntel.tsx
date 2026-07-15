import { FormEvent, useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";

type LookupType = "ip" | "domain" | "url" | "hash";

type LookupResult = {
  id: string;
  lookup_type: LookupType;
  query_value: string;
  verdict: "malicious" | "suspicious" | "clean" | "unknown";
  malicious_count: number;
  suspicious_count: number;
  total_engines: number;
  summary: string;
  created_at: string;
};

const TYPE_OPTIONS: { value: LookupType; label: string; placeholder: string }[] = [
  { value: "ip", label: "IP Address", placeholder: "8.8.8.8" },
  { value: "domain", label: "Domain", placeholder: "example.com" },
  { value: "url", label: "URL", placeholder: "https://example.com/page" },
  { value: "hash", label: "File Hash", placeholder: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
];

const VERDICT_STYLES: Record<string, string> = {
  malicious: "text-critical border-critical/40 bg-critical/10",
  suspicious: "text-warning border-warning/30 bg-warning/10",
  clean: "text-safe border-safe/30 bg-safe/10",
  unknown: "text-text-secondary border-border bg-surface-elevated",
};

export default function ThreatIntel() {
  const [lookupType, setLookupType] = useState<LookupType>("ip");
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [history, setHistory] = useState<LookupResult[]>([]);

  const loadHistory = () => {
    api.get<LookupResult[]>("/threat-intel/history").then((res) => setHistory(res.data));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setResult(null);
    try {
      const response = await api.post<LookupResult>("/threat-intel/lookup", {
        lookup_type: lookupType,
        value,
      });
      setResult(response.data);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Lookup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentOption = TYPE_OPTIONS.find((t) => t.value === lookupType)!;

  return (
    <AppLayout title="Threat Intelligence">
      <div className="mb-6">
        <p className="text-text-primary text-lg">Look up an indicator</p>
        <p className="text-text-secondary text-sm">
          Checks IPs, domains, URLs, and file hashes against VirusTotal's aggregated vendor data.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <select
          value={lookupType}
          onChange={(e) => setLookupType(e.target.value as LookupType)}
          className="bg-surface border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={currentOption.placeholder}
          className="flex-1 bg-surface border border-border rounded px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-accent text-background font-medium rounded px-5 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isLoading ? "Checking..." : "Look Up"}
        </button>
      </form>

      {error && (
        <div className="text-critical text-sm bg-critical/10 border border-critical/30 rounded px-3 py-2 mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-surface border border-border rounded-lg p-5 mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-mono text-text-primary text-sm">{result.query_value}</p>
            <span
              className={`text-xs uppercase tracking-wide border rounded px-2 py-1 ${VERDICT_STYLES[result.verdict]}`}
            >
              {result.verdict}
            </span>
          </div>
          <p className="text-text-secondary text-sm">{result.summary}</p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Lookup History</p>
        {history.length === 0 ? (
          <p className="text-text-secondary text-sm">No lookups yet - run your first check above.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {history.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="text-text-secondary text-xs uppercase mr-2">{item.lookup_type}</span>
                  <span className="font-mono text-text-primary truncate">{item.query_value}</span>
                </div>
                <span
                  className={`text-xs uppercase tracking-wide border rounded px-2 py-0.5 shrink-0 ${VERDICT_STYLES[item.verdict]}`}
                >
                  {item.verdict}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

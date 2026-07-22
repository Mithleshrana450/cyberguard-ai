import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Globe2, Hash, Radar, ShieldAlert } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import DonutChart from "../components/dashboard/DonutChart";
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

const TYPE_OPTIONS: { value: LookupType; label: string; placeholder: string; icon: typeof Globe2 }[] = [
  { value: "ip", label: "IP Address", placeholder: "8.8.8.8", icon: Radar },
  { value: "domain", label: "Domain", placeholder: "example.com", icon: Globe2 },
  { value: "url", label: "URL", placeholder: "https://example.com/page", icon: Globe2 },
  { value: "hash", label: "File Hash", placeholder: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", icon: Hash },
];

const VERDICT_STYLES: Record<string, string> = {
  malicious: "text-critical border-critical/40 bg-critical/10",
  suspicious: "text-warning border-warning/30 bg-warning/10",
  clean: "text-safe border-safe/30 bg-safe/10",
  unknown: "text-text-secondary border-border bg-surface-elevated",
};

const VERDICT_COLOR: Record<string, string> = {
  malicious: "#F87171",
  suspicious: "#FBBF24",
  clean: "#4ADE80",
  unknown: "#8892A6",
};

export default function ThreatIntel() {
  const [lookupType, setLookupType] = useState<LookupType>("ip");
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [history, setHistory] = useState<LookupResult[] | null>(null);

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

  const stats = useMemo(() => {
    const items = history || [];
    const malicious = items.filter((i) => i.verdict === "malicious").length;
    const clean = items.length ? Math.round((items.filter((i) => i.verdict === "clean").length / items.length) * 100) : null;
    return { total: items.length, malicious, cleanPercent: clean };
  }, [history]);

  const distributionSegments = useMemo(() => {
    const counts: Record<string, number> = { malicious: 0, suspicious: 0, clean: 0, unknown: 0 };
    (history || []).forEach((i) => counts[i.verdict]++);
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value, color: VERDICT_COLOR[label] }));
  }, [history]);

  return (
    <AppLayout title="Threat Intelligence">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-text-primary text-xl font-semibold tracking-tight">Look up an indicator</p>
        <p className="text-text-secondary text-sm mt-1">
          Checks IPs, domains, URLs, and file hashes against VirusTotal's aggregated vendor data.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Total Lookups</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Malicious Found</p>
          <p className="font-mono text-2xl font-semibold text-critical mt-1">{stats.malicious}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Clean Rate</p>
          <p className="font-mono text-2xl font-semibold text-safe mt-1">
            {stats.cleanPercent !== null ? `${stats.cleanPercent}%` : "—"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLookupType(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              lookupType === opt.value
                ? "bg-surface-elevated border-accent text-accent"
                : "border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            <opt.icon size={12} />
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={currentOption.placeholder}
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:border-accent transition-colors"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isLoading}
          className="bg-accent text-background font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isLoading ? "Checking..." : "Look Up"}
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

      {isLoading && <Skeleton className="h-24 mb-8" />}

      <AnimatePresence mode="wait">
        {result && !isLoading && (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="card p-5 mb-10"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="flex items-center gap-2 font-mono text-text-primary text-sm">
                {result.verdict === "malicious" && <ShieldAlert size={14} className="text-critical" />}
                {result.query_value}
              </span>
              <span
                className={`text-xs uppercase tracking-wide border rounded-lg px-2 py-1 ${VERDICT_STYLES[result.verdict]}`}
              >
                {result.verdict}
              </span>
            </div>
            <p className="text-text-secondary text-sm">{result.summary}</p>
            {result.total_engines > 0 && (
              <p className="text-text-secondary text-xs font-mono mt-2">
                {result.malicious_count}/{result.total_engines} vendors flagged malicious
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {history && history.length > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <Fingerprint size={12} />
            Verdict Distribution
          </p>
          <DonutChart segments={distributionSegments} centerLabel="Total" centerValue={String(stats.total)} />
        </div>
      )}

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Lookup History</p>

        {history === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}

        {history && history.length === 0 && (
          <EmptyState
            icon={Radar}
            title="No lookups yet"
            description="Run your first check above to start building a threat intelligence history."
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
                  <span className="text-text-secondary text-xs uppercase mr-2">{item.lookup_type}</span>
                  <span className="font-mono text-text-primary truncate">{item.query_value}</span>
                </div>
                <span
                  className={`text-xs uppercase tracking-wide border rounded-lg px-2 py-0.5 shrink-0 ${VERDICT_STYLES[item.verdict]}`}
                >
                  {item.verdict}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

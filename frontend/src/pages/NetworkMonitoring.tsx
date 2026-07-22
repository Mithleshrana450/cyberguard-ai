import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Network as NetworkIcon, Router, ShieldCheck } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type NetworkHost = {
  id: string;
  ip_address: string;
  is_up: boolean;
  hostname: string | null;
  open_ports_json: string;
};

type NetworkScan = {
  id: string;
  target_range: string;
  status: "completed" | "failed";
  hosts_scanned: number;
  hosts_up: number;
  error_message: string | null;
  created_at: string;
  hosts: NetworkHost[];
};

type NetworkScanListItem = {
  id: string;
  target_range: string;
  status: string;
  hosts_scanned: number;
  hosts_up: number;
  created_at: string;
};

export default function NetworkMonitoring() {
  const { user } = useAuth();
  const hasAccess = user?.role === "admin" || user?.role === "analyst";

  const [targetRange, setTargetRange] = useState("172.18.0.0/28");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NetworkScan | null>(null);
  const [history, setHistory] = useState<NetworkScanListItem[] | null>(null);

  const loadHistory = () => {
    api.get<NetworkScanListItem[]>("/network/scans").then((res) => setHistory(res.data));
  };

  useEffect(() => {
    if (hasAccess) loadHistory();
  }, [hasAccess]);

  const stats = useMemo(() => {
    const items = history || [];
    const totalHostsFound = items.reduce((sum, s) => sum + s.hosts_up, 0);
    const lastScan = items[0] || null;
    return { total: items.length, totalHostsFound, lastScan };
  }, [history]);

  if (!hasAccess) {
    return (
      <AppLayout title="Network Monitoring">
        <div className="card p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-text-primary font-medium mb-1">Restricted to Analyst / Admin roles</p>
          <p className="text-text-secondary text-sm">
            Network scanning is a more consequential capability than read-only views, so it's
            limited to analyst and admin accounts.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsScanning(true);
    try {
      const response = await api.post<NetworkScan>("/network/scan", { target_range: targetRange });
      setResult(response.data);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const upHosts = result ? result.hosts.filter((h) => h.is_up) : [];

  return (
    <AppLayout title="Network Monitoring">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-text-primary text-xl font-semibold tracking-tight">Discover devices &amp; open ports</p>
        <p className="text-text-secondary text-sm mt-1">
          TCP connect scan across a private IP range - never public internet targets.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Total Scans</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Hosts Found (all-time)</p>
          <p className="font-mono text-2xl font-semibold text-safe mt-1">{stats.totalHostsFound}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Last Range Scanned</p>
          <p className="text-sm text-text-primary mt-1.5 font-mono truncate">
            {stats.lastScan ? stats.lastScan.target_range : "—"}
          </p>
        </div>
      </div>

      {/* Authorization warning built directly into the UI, not just
          mentioned in passing - this is a real legal/ethical boundary. */}
      <div className="flex gap-3 bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-warning font-medium mb-1">Only scan networks you own or administer</p>
          <p className="text-text-secondary">
            This tool only accepts private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16,
            127.0.0.0/8) - the server rejects anything else, even for admin accounts. Because the
            backend runs inside Docker, "your local network" here means the Docker Compose
            network, not your real home Wi-Fi - try <code className="font-mono text-text-primary">172.18.0.0/28</code> as
            a safe starting point.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Router size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            required
            value={targetRange}
            onChange={(e) => setTargetRange(e.target.value)}
            placeholder="192.168.1.0/28"
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isScanning}
          className="bg-accent text-background font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isScanning ? "Scanning..." : "Scan Network"}
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

      {isScanning && <Skeleton className="h-40 mb-8" />}

      <AnimatePresence mode="wait">
        {result && !isScanning && (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-10"
          >
            <div className="card p-4 mb-4 flex items-center gap-6">
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wide">Hosts Scanned</p>
                <p className="font-mono text-2xl font-semibold text-text-primary">{result.hosts_scanned}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wide">Hosts Up</p>
                <p className="font-mono text-2xl font-semibold text-safe">{result.hosts_up}</p>
              </div>
              {result.status === "failed" && (
                <span className="text-critical text-sm">{result.error_message}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {upHosts.map((host, i) => {
                const ports: number[] = JSON.parse(host.open_ports_json);
                return (
                  <motion.div
                    key={host.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-surface-elevated border border-border rounded-lg shadow-soft-sm p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={14} className="text-safe" />
                      <span className="font-mono text-text-primary text-sm">{host.ip_address}</span>
                      {host.hostname && (
                        <span className="text-text-secondary text-xs">({host.hostname})</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ports.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-mono border border-border rounded px-1.5 py-0.5 text-text-secondary"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
              {upHosts.length === 0 && (
                <div className="card p-5">
                  <EmptyState
                    icon={ShieldCheck}
                    title="No hosts responded"
                    description="Nothing in this range answered on the checked ports."
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Scan History</p>
        {history === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}
        {history && history.length === 0 && (
          <EmptyState
            icon={NetworkIcon}
            title="No scans yet"
            description="Run a scan above against a private IP range to see results here."
          />
        )}
        {history && history.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {history.map((scan, i) => (
              <motion.li
                key={scan.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-mono text-text-primary">{scan.target_range}</span>
                <span className="text-text-secondary">
                  {scan.hosts_up}/{scan.hosts_scanned} up
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

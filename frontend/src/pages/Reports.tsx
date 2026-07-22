import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Download,
  FileBarChart2,
  FileText,
  Globe,
  Network,
  Radar,
  ShieldAlert,
  Siren,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import api from "../services/api";

type Summary = {
  average_security_score: number | null;
  total_scans: number;
  total_alerts: number;
  unresolved_alerts: number;
  total_incidents: number;
  open_incidents: number;
  recent_scans: { target_url: string; status: string; security_score: number | null; started_at: string }[];
  recent_alerts: { title: string; severity: string; source_ip: string; created_at: string }[];
  recent_incidents: { title: string; status: string; severity: string; created_at: string }[];
};

const CSV_EXPORTS: { type: string; label: string; icon: typeof Globe }[] = [
  { type: "scans", label: "Website Scans", icon: Globe },
  { type: "alerts", label: "SIEM Alerts", icon: ShieldAlert },
  { type: "threat-intel", label: "Threat Intelligence Lookups", icon: Radar },
  { type: "phishing", label: "Phishing Analyses", icon: FileBarChart2 },
  { type: "network", label: "Network Scans", icon: Network },
  { type: "incidents", label: "Incidents", icon: Siren },
];

async function downloadFile(url: string, filename: string) {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export default function Reports() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [completedType, setCompletedType] = useState<string | null>(null);

  useEffect(() => {
    api.get<Summary>("/reports/summary").then((res) => setSummary(res.data));
  }, []);

  const handlePdfDownload = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadFile("/reports/pdf", "cyberguard_security_report.pdf");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCsvDownload = async (type: string) => {
    setDownloadingType(type);
    try {
      await downloadFile(`/reports/csv/${type}`, `cyberguard_${type}.csv`);
      setCompletedType(type);
      setTimeout(() => setCompletedType(null), 1500);
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <AppLayout title="Reports">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-text-primary text-xl font-semibold tracking-tight">Export your security data</p>
        <p className="text-text-secondary text-sm mt-1">
          A consolidated PDF summary, or CSV exports of any module's history.
        </p>
      </motion.div>

      {summary === null ? (
        <Skeleton className="h-32 mb-8" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Avg Score</p>
            <AnimatedCounter
              value={summary.average_security_score ?? 0}
              className="font-mono text-2xl font-semibold text-text-primary block"
            />
          </div>
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Scans Run</p>
            <AnimatedCounter value={summary.total_scans} className="font-mono text-2xl font-semibold text-text-primary block" />
          </div>
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Unresolved Alerts</p>
            <AnimatedCounter value={summary.unresolved_alerts} className="font-mono text-2xl font-semibold text-warning block" />
          </div>
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Open Incidents</p>
            <AnimatedCounter value={summary.open_incidents} className="font-mono text-2xl font-semibold text-critical block" />
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-5 mb-6 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">Security Audit Summary (PDF)</p>
            <p className="text-text-secondary text-xs">
              Executive summary plus recent scans, alerts, and incidents.
            </p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePdfDownload}
          disabled={isDownloadingPdf}
          className="flex items-center gap-1.5 bg-accent text-background font-medium rounded-lg px-4 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Download size={14} />
          {isDownloadingPdf ? "Generating..." : "Download PDF"}
        </motion.button>
      </motion.div>

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">CSV Exports</p>
        <div className="flex flex-col divide-y divide-border">
          {CSV_EXPORTS.map((item, i) => (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <item.icon size={14} className="text-text-secondary" />
                <span className="text-text-primary text-sm">{item.label}</span>
              </div>
              <button
                onClick={() => handleCsvDownload(item.type)}
                disabled={downloadingType === item.type}
                className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 text-text-secondary hover:text-text-primary hover:border-accent disabled:opacity-50 transition-colors min-w-[110px] justify-center"
              >
                {completedType === item.type ? (
                  <>
                    <Check size={12} className="text-safe" />
                    Downloaded
                  </>
                ) : downloadingType === item.type ? (
                  "Downloading..."
                ) : (
                  "Download CSV"
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

import { useEffect, useState } from "react";
import { Download, FileBarChart2, FileText } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
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

const CSV_EXPORTS: { type: string; label: string }[] = [
  { type: "scans", label: "Website Scans" },
  { type: "alerts", label: "SIEM Alerts" },
  { type: "threat-intel", label: "Threat Intelligence Lookups" },
  { type: "phishing", label: "Phishing Analyses" },
  { type: "network", label: "Network Scans" },
  { type: "incidents", label: "Incidents" },
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

  return (
    <AppLayout title="Reports">
      <div className="mb-8">
        <p className="text-text-primary text-lg">Export your security data</p>
        <p className="text-text-secondary text-sm">
          A consolidated PDF summary, or CSV exports of any module's history.
        </p>
      </div>

      {summary === null ? (
        <Skeleton className="h-32 mb-8" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Avg Score</p>
            <p className="font-mono text-2xl font-semibold text-text-primary">
              {summary.average_security_score ?? "—"}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Scans Run</p>
            <p className="font-mono text-2xl font-semibold text-text-primary">{summary.total_scans}</p>
          </div>
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Unresolved Alerts</p>
            <p className="font-mono text-2xl font-semibold text-warning">{summary.unresolved_alerts}</p>
          </div>
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide">Open Incidents</p>
            <p className="font-mono text-2xl font-semibold text-critical">{summary.open_incidents}</p>
          </div>
        </div>
      )}

      <div className="card p-5 mb-6 flex items-center justify-between gap-4">
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
        <button
          onClick={handlePdfDownload}
          disabled={isDownloadingPdf}
          className="flex items-center gap-1.5 bg-accent text-background font-medium rounded-lg px-4 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Download size={14} />
          {isDownloadingPdf ? "Generating..." : "Download PDF"}
        </button>
      </div>

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">CSV Exports</p>
        <div className="flex flex-col divide-y divide-border">
          {CSV_EXPORTS.map((item) => (
            <div key={item.type} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileBarChart2 size={14} className="text-text-secondary" />
                <span className="text-text-primary text-sm">{item.label}</span>
              </div>
              <button
                onClick={() => downloadFile(`/reports/csv/${item.type}`, `cyberguard_${item.type}.csv`)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
              >
                Download CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

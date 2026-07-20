import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import EmptyState from "../ui/EmptyState";

type Finding = {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-critical border-critical/40 bg-critical/10",
  high: "text-critical border-critical/30 bg-critical/5",
  medium: "text-warning border-warning/30 bg-warning/10",
  low: "text-text-secondary border-border bg-surface-elevated",
  info: "text-accent border-accent/30 bg-accent/10",
};

export default function RecentAlertsCard({
  findings,
  sourceLabel,
}: {
  findings: Finding[] | null;
  sourceLabel: string | null;
}) {
  return (
    <div className="card p-5">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Recent Alerts</p>
      {sourceLabel && (
        <p className="text-text-secondary text-xs font-mono mb-4 truncate">from {sourceLabel}</p>
      )}
      {!sourceLabel && <div className="mb-4" />}

      {findings === null ? (
        <p className="text-text-secondary text-sm">Loading...</p>
      ) : findings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No active alerts"
          description="Nothing flagged in your most recent scan - nice work."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {findings.map((f, i) => (
            <motion.li
              key={f.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2.5 bg-surface-elevated border border-border rounded-lg px-3 py-2"
            >
              <ShieldAlert size={13} className="text-critical shrink-0" />
              <span className="text-text-primary text-xs truncate flex-1">{f.title}</span>
              <span
                className={`text-[9px] uppercase tracking-wide border rounded px-1.5 py-0.5 shrink-0 ${SEVERITY_STYLES[f.severity]}`}
              >
                {f.severity}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

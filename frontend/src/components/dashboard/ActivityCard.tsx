import { motion } from "framer-motion";
import { CheckCircle2, Clock, Globe, Loader2, XCircle } from "lucide-react";

type Activity = {
  type?: string;
  target_url?: string;
  status?: string;
  started_at?: string;
  [key: string]: unknown;
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  completed: { icon: CheckCircle2, className: "text-safe border-safe/30 bg-safe/10", label: "Completed" },
  failed: { icon: XCircle, className: "text-critical border-critical/30 bg-critical/10", label: "Failed" },
  running: { icon: Loader2, className: "text-warning border-warning/30 bg-warning/10", label: "Running" },
  pending: { icon: Clock, className: "text-text-secondary border-border bg-surface-elevated", label: "Pending" },
};

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const statusKey = (activity.status as string) || "pending";
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="flex items-center gap-3 py-2.5"
    >
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Globe size={14} className="text-accent" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-text-primary text-sm font-medium">Website Scan</p>
        <p className="text-text-secondary text-xs font-mono truncate">
          {(activity.target_url as string) || "—"}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-text-secondary text-xs whitespace-nowrap">
          {relativeTime(activity.started_at as string)}
        </span>
        <span
          className={`flex items-center gap-1 text-[10px] uppercase tracking-wide border rounded-lg px-2 py-1 ${config.className}`}
        >
          <StatusIcon size={10} className={statusKey === "running" ? "animate-spin" : ""} />
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}

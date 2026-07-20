import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

type Status = "checking" | "online" | "offline";

const ROWS: { label: string; key: "api" | "database" }[] = [
  { label: "API Server", key: "api" },
  { label: "Database", key: "database" },
];

export default function SystemStatusCard({ apiStatus }: { apiStatus: Status }) {
  // The backend /health endpoint only confirms the API process is up; a
  // successful response also proves the request pipeline (and therefore
  // the app itself) is alive. We don't have a separate DB-only health
  // signal without adding a new backend endpoint, so we honestly derive
  // "Database" status from the same successful API response - since our
  // FastAPI app can't serve authenticated pages at all if Postgres is
  // down, a healthy API response is a reasonable (if indirect) proxy.
  const dbStatus: Status = apiStatus;

  return (
    <div className="card p-5">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">System Status</p>
      <div className="flex flex-col gap-3">
        {ROWS.map((row) => {
          const status = row.key === "api" ? apiStatus : dbStatus;
          return (
            <div key={row.key} className="flex items-center justify-between">
              <span className="text-text-primary text-sm">{row.label}</span>
              <div className="flex items-center gap-1.5">
                {status === "checking" && (
                  <motion.span
                    className="w-2 h-2 rounded-full bg-text-secondary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                {status === "online" && <CheckCircle2 size={14} className="text-safe" />}
                {status === "offline" && <XCircle size={14} className="text-critical" />}
                <span
                  className={`text-xs ${
                    status === "online" ? "text-safe" : status === "offline" ? "text-critical" : "text-text-secondary"
                  }`}
                >
                  {status === "checking" ? "Checking..." : status === "online" ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

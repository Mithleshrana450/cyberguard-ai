import { Activity } from "lucide-react";
import EmptyState from "../ui/EmptyState";

export default function RecentActivity({ items }: { items: Record<string, unknown>[] }) {
  return (
    <div className="card p-5">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Recent Activity</p>

      {items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Scans, alerts, and login events will show up here as you use the platform."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item, i) => (
            <li key={i} className="py-2.5 text-sm text-text-primary font-mono">
              {JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

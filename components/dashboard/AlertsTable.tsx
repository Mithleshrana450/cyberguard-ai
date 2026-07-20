import { Panel, SeverityBadge } from "@/components/ui";
import { recentAlerts } from "@/lib/data";

export default function AlertsTable() {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-display text-sm font-semibold">Recent alerts</h3>
        <button className="font-mono text-[11px] text-accent hover:underline">
          view all
        </button>
      </div>
      <div className="divide-y divide-border">
        {recentAlerts.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-surface-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-text-dim">
                  {a.id}
                </span>
                <span className="truncate text-sm">{a.title}</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-text-dim">
                {a.host}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <SeverityBadge tone={a.severity} />
              <span className="font-mono text-[11px] text-text-dim">
                {a.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

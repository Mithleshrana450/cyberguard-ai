import { Panel } from "@/components/ui";
import { auditLog } from "@/lib/data";

export default function AuditLog() {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-display text-sm font-semibold">Audit trail</h3>
        <span className="font-mono text-[11px] text-text-dim">immutable</span>
      </div>
      <div className="divide-y divide-border font-mono text-[12px]">
        {auditLog.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[70px_90px_1fr] items-center gap-3 px-5 py-2.5 text-text-muted"
          >
            <span className="text-text-dim">{row.time}</span>
            <span className="truncate text-accent">{row.actor}</span>
            <span className="truncate">
              <span className="text-text">{row.action}</span>
              <span className="text-text-dim"> — {row.resource}</span>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

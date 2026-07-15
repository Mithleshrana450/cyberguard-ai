type Severity = "critical" | "high" | "medium" | "low" | "info";

const STYLES: Record<Severity, string> = {
  critical: "text-critical border-critical/40 bg-critical/10",
  high: "text-critical border-critical/30 bg-critical/5",
  medium: "text-warning border-warning/30 bg-warning/10",
  low: "text-text-secondary border-border bg-surface-elevated",
  info: "text-accent border-accent/30 bg-accent/10",
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`text-[10px] uppercase tracking-wide border rounded px-2 py-0.5 ${STYLES[severity]}`}>
      {severity}
    </span>
  );
}

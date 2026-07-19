const COLOR_MAP: Record<string, string> = {
  critical: "bg-critical",
  high: "bg-critical/70",
  medium: "bg-warning",
  low: "bg-text-secondary",
  info: "bg-accent/50",
  malicious: "bg-critical",
  suspicious: "bg-warning",
  clean: "bg-safe",
  unknown: "bg-text-secondary",
  critical_0_40: "bg-critical",
  needs_improvement_41_70: "bg-warning",
  good_71_100: "bg-safe",
};

const LABEL_MAP: Record<string, string> = {
  critical_0_40: "Critical (0-40)",
  needs_improvement_41_70: "Needs Improvement (41-70)",
  good_71_100: "Good (71-100)",
};

export default function DistributionBar({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return <p className="text-text-secondary text-sm">No data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 rounded-full overflow-hidden">
        {entries.map(([key, count]) => (
          <div
            key={key}
            className={COLOR_MAP[key] || "bg-text-secondary"}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${key}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(([key, count]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${COLOR_MAP[key] || "bg-text-secondary"}`} />
            <span className="text-text-secondary">{LABEL_MAP[key] || key}</span>
            <span className="text-text-primary font-mono">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

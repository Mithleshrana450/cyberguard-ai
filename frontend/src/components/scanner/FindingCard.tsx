import SeverityBadge from "./SeverityBadge";

type Finding = {
  id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  recommendation: string;
};

export default function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-lg shadow-soft-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-text-primary text-sm font-medium">{finding.title}</p>
        <SeverityBadge severity={finding.severity} />
      </div>
      <p className="text-text-secondary text-sm">{finding.description}</p>
      <div className="mt-1 pt-2 border-t border-border">
        <p className="text-xs text-accent uppercase tracking-wide mb-1">Recommendation</p>
        <p className="text-text-secondary text-sm">{finding.recommendation}</p>
      </div>
    </div>
  );
}

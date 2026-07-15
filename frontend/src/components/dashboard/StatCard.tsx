type Tone = "safe" | "warning" | "critical" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  safe: "text-safe",
  warning: "text-warning",
  critical: "text-critical",
  neutral: "text-text-primary",
};

export default function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className="card p-4 flex flex-col gap-1.5">
      <p className="text-text-secondary text-xs uppercase tracking-wide">{label}</p>
      <p className={`font-mono text-2xl font-semibold ${TONE_STYLES[tone]}`}>{value}</p>
    </div>
  );
}

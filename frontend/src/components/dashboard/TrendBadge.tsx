import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export default function TrendBadge({ delta, label = "since last week" }: { delta: number | null; label?: string }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
        <Minus size={11} />
        Not enough history yet
      </span>
    );
  }

  const isUp = delta > 0;
  const isFlat = delta === 0;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const colorClass = isFlat ? "text-text-secondary" : isUp ? "text-safe" : "text-critical";

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${colorClass}`}>
      <Icon size={12} />
      {isFlat ? "No change" : `${isUp ? "+" : ""}${delta} ${label}`}
    </span>
  );
}

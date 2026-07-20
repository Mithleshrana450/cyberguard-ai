import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "../ui/AnimatedCounter";
import TrendBadge from "./TrendBadge";

type Tone = "safe" | "warning" | "critical" | "neutral" | "accent";

const TONE_TEXT: Record<Tone, string> = {
  safe: "text-safe",
  warning: "text-warning",
  critical: "text-critical",
  neutral: "text-text-primary",
  accent: "text-accent",
};

const TONE_ICON_BG: Record<Tone, string> = {
  safe: "bg-safe/10 text-safe",
  warning: "bg-warning/10 text-warning",
  critical: "bg-critical/10 text-critical",
  neutral: "bg-surface-elevated text-text-secondary",
  accent: "bg-accent/10 text-accent",
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  trend,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
  trend?: number | null;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="card p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-xs uppercase tracking-wide">{label}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${TONE_ICON_BG[tone]}`}>
          <Icon size={14} />
        </div>
      </div>
      <AnimatedCounter value={value} className={`font-mono text-2xl font-semibold ${TONE_TEXT[tone]}`} />
      {trend !== undefined && <TrendBadge delta={trend} />}
    </motion.div>
  );
}

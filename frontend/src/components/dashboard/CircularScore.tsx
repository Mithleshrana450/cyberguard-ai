import { motion } from "framer-motion";
import AnimatedCounter from "../ui/AnimatedCounter";
import TrendBadge from "./TrendBadge";

const RADIUS = 64;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  if (score >= 80) return { stroke: "#4ADE80", text: "text-safe" };
  if (score >= 50) return { stroke: "#FBBF24", text: "text-warning" };
  return { stroke: "#F87171", text: "text-critical" };
}

export default function CircularScore({
  score,
  trend,
  hasData,
}: {
  score: number;
  trend: number | null;
  hasData: boolean;
}) {
  const { stroke, text } = scoreColor(score);
  const progress = hasData ? score / 100 : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="card relative overflow-hidden p-6 flex flex-col items-center justify-center gap-3">
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-scan-sweep motion-reduce:animate-none pointer-events-none"
        aria-hidden="true"
      />

      <p className="text-text-secondary text-xs uppercase tracking-wide">Security Score</p>

      <div className="relative w-[152px] h-[152px]">
        <svg width={152} height={152} viewBox="0 0 152 152" className="-rotate-90">
          <circle
            cx={76}
            cy={76}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={76}
            cy={76}
            r={RADIUS}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasData ? (
            <>
              <AnimatedCounter value={score} className={`font-mono text-4xl font-semibold ${text}`} />
              <span className="text-text-secondary text-xs">/100</span>
            </>
          ) : (
            <span className="text-text-secondary text-2xl font-mono">—</span>
          )}
        </div>
      </div>

      {hasData ? (
        <TrendBadge delta={trend} />
      ) : (
        <p className="text-text-secondary text-xs text-center max-w-[200px]">
          No scans run yet. Run a Website Scan to populate your score.
        </p>
      )}
    </div>
  );
}

import { motion } from "framer-motion";

const RADIUS = 50;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  if (score >= 80) return "#4ADE80";
  if (score >= 50) return "#FBBF24";
  return "#F87171";
}

export default function ScoreRing({ score, size = 120 }: { score: number | null; size?: number }) {
  const hasData = score !== null;
  const stroke = hasData ? scoreColor(score) : "rgba(255,255,255,0.15)";
  const progress = hasData ? score / 100 : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const viewBox = 120;
  const center = viewBox / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`} className="-rotate-90">
        <circle cx={center} cy={center} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        <motion.circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold text-text-primary">{hasData ? score : "—"}</span>
        {hasData && <span className="text-text-secondary text-[10px]">/100</span>}
      </div>
    </div>
  );
}

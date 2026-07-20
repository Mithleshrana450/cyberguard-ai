import { motion } from "framer-motion";

type ScorePoint = { label: string; score: number };

function bandColor(score: number) {
  if (score >= 80) return "bg-safe";
  if (score >= 50) return "bg-warning";
  return "bg-critical";
}

export default function ScoreTrendChart({ points }: { points: ScorePoint[] }) {
  if (points.length === 0) {
    return <p className="text-text-secondary text-sm">No completed scans yet.</p>;
  }

  return (
    <div className="flex items-end gap-1.5 h-28">
      {points.map((p, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div className="w-full h-24 flex items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${p.score}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
              className={`w-full rounded-t-sm min-h-[2px] ${bandColor(p.score)} opacity-70 group-hover:opacity-100 transition-opacity`}
              title={`${p.label}: ${p.score}/100`}
            />
          </div>
          <span className="text-[9px] text-text-secondary font-mono truncate w-full text-center">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}

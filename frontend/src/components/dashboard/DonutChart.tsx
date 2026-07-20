import { motion } from "framer-motion";

type Segment = { label: string; value: number; color: string };

const RADIUS = 42;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center gap-6">
        <div className="w-[104px] h-[104px] rounded-full border-4 border-border flex items-center justify-center shrink-0">
          <span className="text-text-secondary text-xs">No data</span>
        </div>
        <p className="text-text-secondary text-sm">Nothing to show yet.</p>
      </div>
    );
  }

  let cumulativeOffset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-[104px] h-[104px] shrink-0">
        <svg width={104} height={104} viewBox="0 0 104 104" className="-rotate-90">
          <circle cx={52} cy={52} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
          {segments.map((seg, i) => {
            const fraction = seg.value / total;
            const dash = fraction * CIRCUMFERENCE;
            const offset = cumulativeOffset;
            cumulativeOffset += dash;
            return (
              <motion.circle
                key={seg.label}
                cx={52}
                cy={52}
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                initial={{ strokeDashoffset: 0, opacity: 0 }}
                animate={{ strokeDashoffset: -offset, opacity: 1 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold text-text-primary">{centerValue}</span>
          <span className="text-text-secondary text-[9px] uppercase tracking-wide">{centerLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-text-secondary">{seg.label}</span>
            <span className="text-text-primary font-mono ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

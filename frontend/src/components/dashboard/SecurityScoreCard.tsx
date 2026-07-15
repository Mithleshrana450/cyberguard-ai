/**
 * SecurityScoreCard - the dashboard's signature visual element.
 *
 * The scan-sweep animation (a thin light band crossing the card once on
 * mount) is deliberately used in exactly ONE place, evoking a radar/network
 * scan pass - appropriate for a security tool, not decoration for its own
 * sake. `motion-reduce:animate-none` respects users with reduced-motion
 * preferences set at the OS level.
 */

export default function SecurityScoreCard({ score }: { score: number }) {
  const isEmpty = score === 0;

  return (
    <div className="relative overflow-hidden bg-surface border border-border rounded-lg p-6 flex flex-col items-center justify-center">
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-scan-sweep motion-reduce:animate-none pointer-events-none"
        aria-hidden="true"
      />

      <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Security Score</p>

      <div className="font-mono text-5xl font-semibold text-text-primary">
        {isEmpty ? "—" : score}
        {!isEmpty && <span className="text-xl text-text-secondary">/100</span>}
      </div>

      <p className="text-text-secondary text-xs mt-3 text-center max-w-[220px]">
        {isEmpty
          ? "No scans run yet. Your score will populate once the Website Scanner module is active."
          : "Based on your most recent security scans and open alerts."}
      </p>
    </div>
  );
}

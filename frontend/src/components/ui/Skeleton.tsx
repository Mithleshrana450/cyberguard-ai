export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-elevated animate-pulse rounded ${className}`} />;
}

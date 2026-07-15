export default function RecentActivity({ items }: { items: Record<string, unknown>[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Recent Activity</p>

      {items.length === 0 ? (
        <div className="py-10 flex flex-col items-center gap-1 text-center">
          <p className="text-text-primary text-sm">No activity yet</p>
          <p className="text-text-secondary text-xs max-w-[280px]">
            Scans, alerts, and login events will show up here as you use the platform.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item, i) => (
            <li key={i} className="py-2 text-sm text-text-primary font-mono">
              {JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

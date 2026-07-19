export default function TrendBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 bg-accent/60 hover:bg-accent rounded-t-sm transition-colors min-h-[2px]"
          style={{ height: `${(d.count / max) * 100}%` }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  );
}

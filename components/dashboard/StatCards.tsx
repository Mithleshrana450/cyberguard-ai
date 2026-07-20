import { Panel } from "@/components/ui";
import { ShieldAlert, ShieldCheck, Users, Activity } from "lucide-react";

const stats = [
  {
    label: "Active threats",
    value: "3",
    trend: "+1 vs yesterday",
    tone: "critical",
    icon: ShieldAlert,
  },
  {
    label: "Blocked today",
    value: "26",
    trend: "+8 vs yesterday",
    tone: "accent",
    icon: ShieldCheck,
  },
  {
    label: "Open sessions",
    value: "142",
    trend: "steady",
    tone: "muted",
    icon: Users,
  },
  {
    label: "System health",
    value: "99.2%",
    trend: "nominal",
    tone: "muted",
    icon: Activity,
  },
];

export default function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, trend, tone, icon: Icon }) => (
        <Panel key={label} className="p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-text-dim">
              {label}
            </span>
            <Icon
              className={`h-4 w-4 ${
                tone === "critical"
                  ? "text-critical"
                  : tone === "accent"
                  ? "text-accent"
                  : "text-text-dim"
              }`}
            />
          </div>
          <div className="mt-3 font-mono text-2xl font-semibold">{value}</div>
          <div className="mt-1 text-xs text-text-muted">{trend}</div>
        </Panel>
      ))}
    </div>
  );
}

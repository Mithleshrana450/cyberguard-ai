import { Search, Bell } from "lucide-react";
import { StatusDot } from "@/components/ui";

export default function Topbar() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold">Overview</h1>
        <p className="font-mono text-xs text-text-dim">
          org: parul-university-secops
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-dim sm:flex">
          <Search className="h-4 w-4" />
          <span className="font-mono text-xs">Search incidents…</span>
        </div>
        <StatusDot />
        <button className="relative rounded-md border border-border p-2 text-text-muted transition hover:text-text">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-critical" />
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  ShieldHalf,
  LayoutGrid,
  ShieldAlert,
  Users,
  Network,
  ScrollText,
  Settings,
} from "lucide-react";

const items = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Threats", icon: ShieldAlert },
  { label: "Users & RBAC", icon: Users },
  { label: "Network", icon: Network },
  { label: "Audit log", icon: ScrollText },
  { label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <Link
        href="/"
        className="flex items-center gap-2 border-b border-border px-5 py-5 font-display font-semibold"
      >
        <ShieldHalf className="h-5 w-5 text-accent" />
        CyberGuard <span className="text-accent">AI</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
              active
                ? "bg-accent-soft text-accent"
                : "text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 font-mono text-xs text-accent">
            MR
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">Mithlesh Rana</div>
            <div className="font-mono text-[11px] text-text-dim">ADMIN</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

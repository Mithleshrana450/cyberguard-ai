import { Severity } from "@/lib/data";
import clsx from "clsx";

const toneStyles: Record<Severity, string> = {
  critical: "text-critical bg-[var(--critical-soft)] border-critical/30",
  warn: "text-warn bg-[var(--warn-soft)] border-warn/30",
  info: "text-accent bg-[var(--accent-soft)] border-accent/30",
  ok: "text-text-muted bg-surface-2 border-border",
};

export function SeverityBadge({ tone, label }: { tone: Severity; label?: string }) {
  const text = label ?? tone;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wide",
        toneStyles[tone]
      )}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full", {
          "bg-critical": tone === "critical",
          "bg-warn": tone === "warn",
          "bg-accent": tone === "info",
          "bg-text-dim": tone === "ok",
        })}
      />
      {text}
    </span>
  );
}

export function StatusDot({ label = "systems nominal" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-mono text-text-muted">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      {label}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
      <span className="h-px w-6 bg-accent/60" />
      {children}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-surface",
        className
      )}
    >
      {children}
    </div>
  );
}

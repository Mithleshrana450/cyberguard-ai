"use client";

import { useEffect, useState } from "react";
import { terminalFeed } from "@/lib/data";

const toneColor: Record<string, string> = {
  critical: "text-critical",
  warn: "text-warn",
  info: "text-text-muted",
  ok: "text-accent",
};

export default function TerminalFeed() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    if (visible >= terminalFeed.length) {
      const reset = setTimeout(() => setVisible(1), 2400);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 650);
    return () => clearTimeout(t);
  }, [visible]);

  const lines = terminalFeed.slice(0, visible);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-[#0c1119] shadow-[0_0_60px_-15px_rgba(79,227,193,0.15)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-critical/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        <span className="ml-3 font-mono text-xs text-text-dim">
          soc-console — threat-feed.live
        </span>
      </div>
      <div className="h-[280px] space-y-2 overflow-hidden p-4 font-mono text-[12.5px] leading-relaxed sm:h-[300px]">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`${toneColor[line.tone]} animate-[fadeIn_0.3s_ease]`}
          >
            {line.text}
          </div>
        ))}
        <span className="text-accent">
          {"> "}
          <span className="cursor-blink">▌</span>
        </span>
      </div>
    </div>
  );
}

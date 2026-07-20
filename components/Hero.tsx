import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "./ui";
import TerminalFeed from "./TerminalFeed";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(79,227,193,0.08),transparent)]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28">
        <div>
          <Eyebrow>Security operations platform</Eyebrow>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Detect. Respond.
            <br />
            Contain — <span className="text-accent text-glow">before it spreads.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-text-muted sm:text-lg">
            CyberGuard AI watches every login, packet, and permission change
            across your network, and turns the ones that matter into an
            incident someone can act on in seconds.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-medium text-[#06110d] transition hover:bg-accent-dim"
            >
              Launch console
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-medium text-text transition hover:border-text-dim"
            >
              See modules
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-6 font-mono">
            <div>
              <div className="text-2xl font-semibold text-text">41ms</div>
              <div className="text-xs text-text-dim">median detection latency</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-text">6</div>
              <div className="text-xs text-text-dim">integrated modules</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-text">24/7</div>
              <div className="text-xs text-text-dim">autonomous monitoring</div>
            </div>
          </div>
        </div>

        <TerminalFeed />
      </div>
    </section>
  );
}

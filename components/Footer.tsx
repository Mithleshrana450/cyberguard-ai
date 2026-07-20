import Link from "next/link";
import { ShieldHalf, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <>
      <section className="border-b border-border bg-grid">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="font-display mx-auto max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
            Your network is talking.
            <span className="text-accent"> Start listening.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-text-muted">
            Spin up the console and see what CyberGuard AI catches in the
            first hour.
          </p>
          <Link
            href="/dashboard"
            className="group mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-[#06110d] transition hover:bg-accent-dim"
          >
            Launch console
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <footer className="px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-text-dim sm:flex-row">
          <div className="flex items-center gap-2 font-display font-semibold text-text-muted">
            <ShieldHalf className="h-4 w-4 text-accent" />
            CyberGuard AI
          </div>
          <p className="font-mono text-xs">
            built by Mithlesh Rana — final-year cybersecurity project
          </p>
        </div>
      </footer>
    </>
  );
}

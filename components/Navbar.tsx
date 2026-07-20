import Link from "next/link";
import { ShieldHalf } from "lucide-react";
import { StatusDot } from "./ui";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldHalf className="h-5 w-5 text-accent" strokeWidth={2.25} />
          CyberGuard <span className="text-accent">AI</span>
        </Link>

        <nav className="hidden items-center gap-8 font-mono text-sm text-text-muted md:flex">
          <a href="#modules" className="transition hover:text-text">
            Modules
          </a>
          <a href="#pipeline" className="transition hover:text-text">
            How it works
          </a>
          <a href="#" className="transition hover:text-text">
            Docs
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <StatusDot />
          </div>
          <Link
            href="/dashboard"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#06110d] transition hover:bg-accent-dim"
          >
            Launch console
          </Link>
        </div>
      </div>
    </header>
  );
}

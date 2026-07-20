import { pipeline } from "@/lib/data";
import { Eyebrow } from "./ui";
import { ArrowRight } from "lucide-react";

export default function Pipeline() {
  return (
    <section id="pipeline" className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="font-display max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          From raw signal to contained incident.
        </h2>

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {pipeline.map((p, i) => (
            <div key={p.step} className="relative">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-accent">
                  0{i + 1}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <h3 className="font-display mt-4 text-xl font-semibold">
                {p.step}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {p.detail}
              </p>
              {i < pipeline.length - 1 && (
                <ArrowRight className="absolute -right-3 top-[52px] hidden h-4 w-4 text-text-dim lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

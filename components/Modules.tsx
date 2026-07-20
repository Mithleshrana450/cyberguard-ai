import { modules } from "@/lib/data";
import { Eyebrow } from "./ui";

export default function Modules() {
  return (
    <section id="modules" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Eyebrow>System modules</Eyebrow>
        <h2 className="font-display max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Six modules. One console.
        </h2>
        <p className="mt-4 max-w-lg text-text-muted">
          Each module runs independently and reports into the same
          role-aware console, so nothing needs its own login.
        </p>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div
              key={m.id}
              className="group relative bg-surface p-6 transition hover:bg-surface-2"
            >
              <div className="font-mono text-xs text-accent">{m.id}</div>
              <h3 className="font-display mt-3 text-lg font-semibold">
                {m.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

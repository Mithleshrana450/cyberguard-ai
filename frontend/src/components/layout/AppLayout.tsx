import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PageTransition from "../ui/PageTransition";

export default function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        {/* Subtle radial gradient behind the content area - darker at the
            edges, giving the surface cards something to sit "on top of"
            rather than a flat single-tone background. */}
        <main
          className="flex-1 overflow-auto"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79, 209, 197, 0.05), transparent), " +
              "linear-gradient(180deg, #0A0E14 0%, #090C11 100%)",
          }}
        >
          <div className="p-8 max-w-[1400px] mx-auto">
            <PageTransition key={title}>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}

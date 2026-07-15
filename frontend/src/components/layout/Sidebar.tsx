import { NavLink } from "react-router-dom";

// Every future module gets an entry here. `enabled: false` items are
// visible (so the full scope of the platform is always evident to
// recruiters looking at the UI) but not yet clickable - they'll flip to
// true as each module is built.
const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", enabled: true },
  { label: "Website Scanner", path: "/scanner", enabled: false },
  { label: "Phishing Detection", path: "/phishing", enabled: false },
  { label: "Network Monitoring", path: "/network", enabled: false },
  { label: "Mini SIEM", path: "/siem", enabled: false },
  { label: "Threat Intelligence", path: "/threat-intel", enabled: false },
  { label: "Digital Forensics", path: "/forensics", enabled: false },
  { label: "AI Assistant", path: "/assistant", enabled: false },
  { label: "Incidents", path: "/incidents", enabled: false },
  { label: "Reports", path: "/reports", enabled: false },
  { label: "Admin Panel", path: "/admin", enabled: false },
  { label: "Analytics", path: "/analytics", enabled: false },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <span className="text-text-primary font-semibold text-sm tracking-wide">CyberGuard AI</span>
      </div>

      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) =>
          item.enabled ? (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-surface-elevated text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                }`
              }
            >
              {item.label}
            </NavLink>
          ) : (
            <span
              key={item.path}
              className="px-3 py-2 rounded text-sm text-text-secondary/40 cursor-not-allowed flex items-center justify-between"
              title="Coming in a future module"
            >
              {item.label}
              <span className="text-[10px] border border-border rounded px-1.5 py-0.5">soon</span>
            </span>
          )
        )}
      </nav>
    </aside>
  );
}

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  Fish,
  Network,
  ClipboardList,
  Radar,
  Fingerprint,
  Brain,
  Siren,
  FileBarChart2,
  Settings,
  BarChart3,
  LucideIcon,
} from "lucide-react";

type NavItem = { label: string; path: string; icon: LucideIcon; enabled: boolean };

// Every future module gets an entry here. `enabled: false` items are
// visible (so the full scope of the platform is always evident to
// recruiters looking at the UI) but not yet clickable - they'll flip to
// true as each module is built.
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Website Scanner", path: "/scanner", icon: Globe, enabled: true },
  { label: "Phishing Detection", path: "/phishing", icon: Fish, enabled: true },
  { label: "Network Monitoring", path: "/network", icon: Network, enabled: false },
  { label: "Mini SIEM", path: "/siem", icon: ClipboardList, enabled: true },
  { label: "Threat Intelligence", path: "/threat-intel", icon: Radar, enabled: true },
  { label: "Digital Forensics", path: "/forensics", icon: Fingerprint, enabled: true },
  { label: "AI Assistant", path: "/assistant", icon: Brain, enabled: false },
  { label: "Incidents", path: "/incidents", icon: Siren, enabled: false },
  { label: "Reports", path: "/reports", icon: FileBarChart2, enabled: false },
  { label: "Admin Panel", path: "/admin", icon: Settings, enabled: false },
  { label: "Analytics", path: "/analytics", icon: BarChart3, enabled: false },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <span className="text-text-primary font-semibold text-sm tracking-wide">CyberGuard AI</span>
      </div>

      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return item.enabled ? (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-surface-elevated text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated hover:translate-x-0.5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active-state accent bar - the "is this alive" signal
                      a flat list of text links was missing. */}
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full bg-accent transition-all duration-200 ${
                      isActive ? "h-4 opacity-100" : "h-0 opacity-0"
                    }`}
                  />
                  <Icon
                    size={16}
                    strokeWidth={1.75}
                    className={`shrink-0 transition-colors duration-150 ${
                      isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
                    }`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ) : (
            <span
              key={item.path}
              className="px-3 py-2 rounded-lg text-sm text-text-secondary/40 cursor-not-allowed flex items-center gap-2.5 justify-between"
              title="Coming in a future module"
            >
              <span className="flex items-center gap-2.5">
                <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                {item.label}
              </span>
              <span className="text-[10px] border border-border rounded px-1.5 py-0.5 shrink-0">soon</span>
            </span>
          );
        })}
      </nav>
    </aside>
  );
}

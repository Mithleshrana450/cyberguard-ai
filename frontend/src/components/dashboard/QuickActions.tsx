import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Fingerprint, Globe, LucideIcon, Radar } from "lucide-react";

const ACTIONS: { label: string; path: string; icon: LucideIcon }[] = [
  { label: "Website Scan", path: "/scanner", icon: Globe },
  { label: "Threat Lookup", path: "/threat-intel", icon: Radar },
  { label: "Analyze File", path: "/forensics", icon: Fingerprint },
  { label: "Generate Report", path: "/reports", icon: FileText },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACTIONS.map((action, i) => (
        <motion.button
          key={action.path}
          onClick={() => navigate(action.path)}
          whileHover={{ y: -2, borderColor: "rgba(79, 209, 197, 0.5)" }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          className="card flex flex-col items-center justify-center gap-2 py-5 px-3 text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <action.icon size={16} className="text-accent" />
          </div>
          <span className="text-text-primary text-xs font-medium">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

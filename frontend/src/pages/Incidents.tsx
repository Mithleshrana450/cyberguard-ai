import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Plus, Siren, X } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import DonutChart from "../components/dashboard/DonutChart";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type IncidentListItem = {
  id: string;
  title: string;
  status: "open" | "investigating" | "resolved" | "closed";
  severity: "critical" | "high" | "medium" | "low";
  assigned_to: string | null;
  created_at: string;
};

type Note = { id: string; author_id: string; content: string; created_at: string };

type IncidentDetail = IncidentListItem & {
  description: string;
  created_by: string;
  source_type: string | null;
  source_id: string | null;
  updated_at: string;
  closed_at: string | null;
  notes: Note[];
};

const STATUS_STYLES: Record<string, string> = {
  open: "text-critical border-critical/30 bg-critical/10",
  investigating: "text-warning border-warning/30 bg-warning/10",
  resolved: "text-accent border-accent/30 bg-accent/10",
  closed: "text-text-secondary border-border bg-surface-elevated",
};

const STATUS_DOT: Record<string, string> = {
  open: "#F87171",
  investigating: "#FBBF24",
  resolved: "#4FD1C5",
  closed: "#8892A6",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-critical",
  high: "text-critical",
  medium: "text-warning",
  low: "text-text-secondary",
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-critical",
  high: "border-l-critical",
  medium: "border-l-warning",
  low: "border-l-border",
};

const NEXT_STATUSES: Record<string, string[]> = {
  open: ["investigating", "resolved"],
  investigating: ["open", "resolved"],
  resolved: ["closed", "open", "investigating"],
  closed: ["open"],
};

export default function Incidents() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "analyst";

  const [incidents, setIncidents] = useState<IncidentListItem[] | null>(null);
  const [selected, setSelected] = useState<IncidentDetail | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSeverity, setNewSeverity] = useState("medium");

  const loadIncidents = () => {
    api.get<IncidentListItem[]>("/incidents").then((res) => setIncidents(res.data));
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const stats = useMemo(() => {
    const items = incidents || [];
    const counts = { open: 0, investigating: 0, resolved: 0, closed: 0 };
    items.forEach((i) => counts[i.status]++);
    return counts;
  }, [incidents]);

  const statusDistribution = useMemo(() => {
    return Object.entries(stats)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value, color: STATUS_DOT[label] }));
  }, [stats]);

  const openDetail = (id: string) => {
    api.get<IncidentDetail>(`/incidents/${id}`).then((res) => setSelected(res.data));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/incidents", { title: newTitle, description: newDescription, severity: newSeverity });
      setNewTitle("");
      setNewDescription("");
      setNewSeverity("medium");
      setShowCreateForm(false);
      loadIncidents();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not create incident.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setError(null);
    try {
      const response = await api.patch(`/incidents/${selected.id}`, { status: newStatus });
      setSelected((prev) => (prev ? { ...prev, ...response.data } : null));
      loadIncidents();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not update status.");
    }
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !noteText.trim()) return;
    const response = await api.post(`/incidents/${selected.id}/notes`, { content: noteText });
    setSelected((prev) => (prev ? { ...prev, notes: [...prev.notes, response.data] } : null));
    setNoteText("");
  };

  return (
    <AppLayout title="Incident Management">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <p className="text-text-primary text-xl font-semibold tracking-tight">
            Track and resolve security incidents
          </p>
          <p className="text-text-secondary text-sm mt-1">
            Anyone can report an incident; status changes require analyst or admin.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 bg-accent text-background font-medium rounded-lg px-4 py-2 text-sm hover:bg-accent/90 transition-colors whitespace-nowrap"
        >
          <Plus size={14} />
          Report Incident
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Open</p>
          <p className="font-mono text-2xl font-semibold text-critical mt-1">{stats.open}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Investigating</p>
          <p className="font-mono text-2xl font-semibold text-warning mt-1">{stats.investigating}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Resolved</p>
          <p className="font-mono text-2xl font-semibold text-accent mt-1">{stats.resolved}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Closed</p>
          <p className="font-mono text-2xl font-semibold text-text-secondary mt-1">{stats.closed}</p>
        </div>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="card p-5 mb-6 flex flex-col gap-3 overflow-hidden"
          >
            <input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Incident title"
              className="bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
            <textarea
              required
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What happened?"
              rows={3}
              className="bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition-colors resize-y"
            />
            <div className="flex gap-3">
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button
                type="submit"
                className="bg-accent text-background font-medium rounded-lg px-4 py-2 text-sm hover:bg-accent/90 transition-colors"
              >
                Create
              </button>
            </div>
            {error && <p className="text-critical text-sm">{error}</p>}
          </motion.form>
        )}
      </AnimatePresence>

      {incidents && incidents.length > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Status Distribution</p>
          <DonutChart segments={statusDistribution} centerLabel="Total" centerValue={String(incidents.length)} />
        </div>
      )}

      <div className="card p-5">
        {incidents === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        )}
        {incidents && incidents.length === 0 && (
          <EmptyState
            icon={Siren}
            title="No incidents"
            description="Report an incident above, or they'll appear here as alerts and findings are escalated."
          />
        )}
        {incidents && incidents.length > 0 && (
          <ul className="flex flex-col gap-2">
            {incidents.map((incident, i) => (
              <motion.li
                key={incident.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <button
                  onClick={() => openDetail(incident.id)}
                  className={`w-full py-2.5 px-3 flex items-center justify-between gap-3 text-sm text-left bg-surface-elevated hover:bg-surface-elevated/70 border-l-2 rounded-lg transition-colors ${SEVERITY_BORDER[incident.severity]}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle size={14} className={SEVERITY_STYLES[incident.severity]} />
                    <span className="text-text-primary truncate">{incident.title}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wide border rounded-lg px-2 py-0.5 shrink-0 ${STATUS_STYLES[incident.status]}`}
                  >
                    {incident.status}
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-text-primary font-medium">{selected.title}</p>
                  <span
                    className={`inline-block mt-1 text-[10px] uppercase tracking-wide border rounded-lg px-2 py-0.5 ${STATUS_STYLES[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-text-secondary hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>

              <p className="text-text-secondary text-sm mb-4">{selected.description}</p>

              {canManage && (
                <div className="mb-5">
                  <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUSES[selected.status]?.map((next) => (
                      <button
                        key={next}
                        onClick={() => handleStatusChange(next)}
                        className="text-xs border border-border rounded-lg px-3 py-1.5 text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
                      >
                        Move to {next}
                      </button>
                    ))}
                  </div>
                  {error && <p className="text-critical text-xs mt-2">{error}</p>}
                </div>
              )}

              <div className="mb-4">
                <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">
                  Notes ({selected.notes.length})
                </p>
                <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto">
                  {selected.notes.map((note) => (
                    <div key={note.id} className="bg-surface-elevated border border-border rounded-lg p-2.5 text-sm text-text-primary">
                      {note.content}
                    </div>
                  ))}
                  {selected.notes.length === 0 && (
                    <p className="text-text-secondary text-xs">No notes yet.</p>
                  )}
                </div>
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-surface-elevated border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm hover:border-accent transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

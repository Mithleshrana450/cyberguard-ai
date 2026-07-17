import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, Plus, Siren, X } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
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

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-critical",
  high: "text-critical",
  medium: "text-warning",
  low: "text-text-secondary",
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-text-primary text-lg">Track and resolve security incidents</p>
          <p className="text-text-secondary text-sm">
            Anyone can report an incident; status changes require analyst or admin.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 bg-accent text-background font-medium rounded-lg px-4 py-2 text-sm hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} />
          Report Incident
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-6 flex flex-col gap-3">
          <input
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Incident title"
            className="bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          <textarea
            required
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="What happened?"
            rows={3}
            className="bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent resize-y"
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
        </form>
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
          <ul className="flex flex-col divide-y divide-border">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <button
                  onClick={() => openDetail(incident.id)}
                  className="w-full py-3 flex items-center justify-between gap-3 text-sm text-left hover:bg-surface-elevated -mx-2 px-2 rounded-lg transition-colors"
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
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
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
                  className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="bg-surface-elevated border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm hover:border-accent transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

import { useEffect, useState } from "react";
import api from "../services/api";

type HealthResponse = {
  status: string;
  service: string;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HealthResponse>("/health")
      .then((res) => setHealth(res.data))
      .catch(() => setError("Could not reach backend. Is docker compose running?"));
  }, []);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold text-white">CyberGuard AI</h1>
      <p className="text-white/60">Module 0 - Foundation Scaffold</p>

      <div className="mt-6 rounded-lg border border-white/10 bg-surface px-6 py-4 text-sm">
        {error && <p className="text-red-400">{error}</p>}
        {health && (
          <p className="text-accent">
            Backend status: <span className="font-mono">{health.status}</span> (
            {health.service})
          </p>
        )}
        {!health && !error && <p className="text-white/40">Checking backend connection...</p>}
      </div>
    </main>
  );
}

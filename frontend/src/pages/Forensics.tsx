import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Fingerprint, MapPin, ShieldAlert, UploadCloud } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import api from "../services/api";

type Verdict = "malicious" | "suspicious" | "clean" | "unknown" | null;

type ForensicsRecord = {
  id: string;
  filename: string;
  file_size_bytes: number;
  mime_type: string;
  md5_hash: string;
  sha1_hash: string;
  sha256_hash: string;
  has_gps_data: boolean;
  metadata_json: string;
  threat_verdict: Verdict;
  created_at: string;
};

const VERDICT_STYLES: Record<string, string> = {
  malicious: "text-critical border-critical/40 bg-critical/10",
  suspicious: "text-warning border-warning/30 bg-warning/10",
  clean: "text-safe border-safe/30 bg-safe/10",
  unknown: "text-text-secondary border-border bg-surface-elevated",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Uploading a File/FormData requires the browser to set its own
// multipart Content-Type header (including a boundary string it
// generates). Our shared `api` client hardcodes 'application/json' as a
// default header, which would otherwise block that auto-detection -
// explicitly clearing it per-request lets the browser take over correctly.
const multipartConfig = { headers: { "Content-Type": undefined } };

function HashRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-text-secondary w-16 shrink-0">{label}</span>
      <span className="text-text-primary truncate flex-1">{value}</span>
      <button
        onClick={handleCopy}
        className="text-text-secondary hover:text-accent transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        title="Copy hash"
      >
        {copied ? <Check size={13} className="text-safe" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

export default function Forensics() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForensicsRecord | null>(null);
  const [history, setHistory] = useState<ForensicsRecord[] | null>(null);

  const [verifyRecordId, setVerifyRecordId] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ is_match: boolean; uploaded_sha256: string } | null>(
    null
  );
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = () => {
    api.get<ForensicsRecord[]>("/forensics/analyses").then((res) => setHistory(res.data));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const stats = useMemo(() => {
    const items = history || [];
    const malicious = items.filter((i) => i.threat_verdict === "malicious").length;
    const gpsWarnings = items.filter((i) => i.has_gps_data).length;
    return { total: items.length, malicious, gpsWarnings };
  }, [history]);

  const analyzeFile = async (file: File) => {
    setError(null);
    setResult(null);
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post<ForensicsRecord>("/forensics/analyze", formData, multipartConfig);
      setResult(response.data);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyzeFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) analyzeFile(file);
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifyResult(null);
    const file = verifyInputRef.current?.files?.[0];
    if (!file || !verifyRecordId) return;

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post(
        `/forensics/analyses/${verifyRecordId}/verify`,
        formData,
        multipartConfig
      );
      setVerifyResult(response.data);
    } catch (err: any) {
      setVerifyError(err.response?.data?.detail || "Verification failed.");
    }
  };

  return (
    <AppLayout title="Digital Forensics">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-text-primary text-xl font-semibold tracking-tight">Analyze a file</p>
        <p className="text-text-secondary text-sm mt-1">
          Computes MD5/SHA-1/SHA-256 hashes, extracts image metadata, and checks the hash against
          threat intelligence. Files are never stored - only the computed results.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Files Analyzed</p>
          <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Malicious Detected</p>
          <p className="font-mono text-2xl font-semibold text-critical mt-1">{stats.malicious}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide">GPS Warnings</p>
          <p className="font-mono text-2xl font-semibold text-warning mt-1">{stats.gpsWarnings}</p>
        </div>
      </div>

      <motion.div
        animate={{
          borderColor: isDragging ? "rgba(79, 209, 197, 0.6)" : "rgba(35, 43, 58, 1)",
          scale: isDragging ? 1.01 : 1,
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mb-8 border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-3 text-center transition-colors ${
          isDragging ? "bg-accent/5" : ""
        }`}
      >
        <UploadCloud size={28} strokeWidth={1.5} className="text-text-secondary" />
        <p className="text-text-primary text-sm">Drag a file here, or click to browse</p>
        <p className="text-text-secondary text-xs">Max 25MB - never stored, only analyzed</p>
        <label className="mt-1 bg-accent text-background font-medium rounded-lg px-4 py-2 text-sm hover:bg-accent/90 transition-colors cursor-pointer">
          {isAnalyzing ? "Analyzing..." : "Choose File"}
          <input type="file" className="hidden" onChange={handleFileInput} disabled={isAnalyzing} />
        </label>
      </motion.div>

      {isAnalyzing && <Skeleton className="h-40 mb-8" />}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-critical text-sm bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-8"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {result && !isAnalyzing && (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="card p-5 mb-10"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-text-primary text-sm font-medium truncate">{result.filename}</p>
              {result.threat_verdict && (
                <span
                  className={`flex items-center gap-1 text-xs uppercase tracking-wide border rounded-lg px-2 py-1 shrink-0 ${VERDICT_STYLES[result.threat_verdict]}`}
                >
                  {result.threat_verdict === "malicious" && <ShieldAlert size={11} />}
                  {result.threat_verdict}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              <p className="text-text-secondary">Size</p>
              <p className="text-text-primary font-mono">{formatBytes(result.file_size_bytes)}</p>
              <p className="text-text-secondary">MIME type</p>
              <p className="text-text-primary font-mono">{result.mime_type}</p>
            </div>

            {result.has_gps_data && (
              <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 mb-4 text-sm text-warning">
                <MapPin size={14} />
                This image contains embedded GPS location data.
              </div>
            )}

            <div className="flex flex-col gap-2 font-mono text-xs bg-surface-elevated rounded-lg p-3 border border-border">
              <HashRow label="MD5" value={result.md5_hash} />
              <HashRow label="SHA-1" value={result.sha1_hash} />
              <HashRow label="SHA-256" value={result.sha256_hash} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card p-5 mb-8">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Verify File Integrity</p>
        <p className="text-text-secondary text-sm mb-4">
          Re-upload a file to confirm it matches a previous analysis exactly - useful for proving
          evidence hasn't been altered since it was first collected.
        </p>
        <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-3">
          <select
            value={verifyRecordId}
            onChange={(e) => setVerifyRecordId(e.target.value)}
            required
            className="bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Select original analysis...</option>
            {history?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} ({new Date(r.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          <input
            ref={verifyInputRef}
            type="file"
            required
            className="flex-1 text-sm text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-border file:bg-surface-elevated file:text-text-primary file:text-sm"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="bg-surface-elevated border border-border text-text-primary font-medium rounded-lg px-4 py-2 text-sm hover:border-accent transition-colors whitespace-nowrap"
          >
            Verify Integrity
          </motion.button>
        </form>

        {verifyError && <p className="text-critical text-sm mt-3">{verifyError}</p>}
        <AnimatePresence>
          {verifyResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-lg px-3 py-2 text-sm border ${
                verifyResult.is_match
                  ? "text-safe border-safe/30 bg-safe/10"
                  : "text-critical border-critical/30 bg-critical/10"
              }`}
            >
              {verifyResult.is_match
                ? "Integrity confirmed - the file matches the original exactly."
                : "Mismatch - this file's contents differ from the original analysis."}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-4">Analysis History</p>
        {history === null && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}
        {history && history.length === 0 && (
          <EmptyState
            icon={Fingerprint}
            title="No files analyzed yet"
            description="Upload a file above to compute its hashes and check its reputation."
          />
        )}
        {history && history.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {history.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-text-primary truncate">{r.filename}</p>
                  <p className="text-text-secondary text-xs font-mono">{r.sha256_hash.slice(0, 16)}...</p>
                </div>
                {r.threat_verdict && (
                  <span
                    className={`text-xs uppercase tracking-wide border rounded-lg px-2 py-0.5 shrink-0 ${VERDICT_STYLES[r.threat_verdict]}`}
                  >
                    {r.threat_verdict}
                  </span>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

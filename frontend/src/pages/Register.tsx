/**
 * RegisterPage.tsx
 *
 * Drop-in replacement for your existing register page. Matches
 * LoginPage.tsx exactly (same design tokens, glass card, shield badge)
 * so both auth screens feel like one product.
 *
 * BEFORE USING:
 * 1. Replace `backgroundImageUrl` with your own photo if you're using
 *    one on LoginPage.tsx too — keep both pages consistent.
 * 2. Confirm the import path below for AuthContext matches your project
 *    structure (assumes RegisterPage.tsx lives in frontend/src/pages/
 *    and AuthContext.tsx lives in frontend/src/context/).
 * 3. Confirm the `navigate("/dashboard")` path matches your actual route.
 *    (register() internally calls login(), so a successful registration
 *    logs the user straight in — no separate "please log in" step.)
 */

import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

// TODO: replace with your own image (see note above)
const backgroundImageUrl = ""; // e.g. "/images/login-bg.jpg"

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate("/dashboard");
    } catch (err: any) {
      // FastAPI's standard error shape is { detail: "..." }.
      const message =
        err?.response?.data?.detail || "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background"
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `linear-gradient(rgba(10,14,20,0.75), rgba(10,14,20,0.85)), url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {!backgroundImageUrl && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-surface/60 backdrop-blur-md border border-border shadow-soft"
        >
          <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path
              d="M12 2 L20 6 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V6 Z"
              className="text-accent"
            />
            <path
              d="M9 12l2 2 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-safe"
            />
          </svg>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-soft p-6"
        >
          <h1 className="text-center text-lg font-semibold text-text-primary mb-1">
            Create your account
          </h1>
          <p className="text-center text-sm text-text-secondary mb-6">
            Join CyberGuard AI to get started
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-critical/40 bg-critical/10 text-critical text-sm px-3 py-2">
              {error}
            </div>
          )}

          {/* Full name */}
          <label className="block mb-4">
            <span className="sr-only">Full name</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/70 outline-none"
              />
            </div>
          </label>

          {/* Email */}
          <label className="block mb-4">
            <span className="sr-only">Email</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/70 outline-none"
              />
            </div>
          </label>

          {/* Password */}
          <label className="block mb-5">
            <span className="sr-only">Password</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/70 outline-none"
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5 pl-1">
              Use 8+ characters with a mix of letters and numbers.
            </p>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent text-background font-semibold text-sm py-3 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-text-secondary mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

/**
 * LoginPage.tsx
 *
 * Drop-in replacement for your existing login page.
 * Matches your existing design tokens (tailwind.config.js: background,
 * surface, accent #4FD1C5, text-primary/secondary) — no new colors added.
 *
 * BEFORE USING:
 * 1. Replace the `backgroundImageUrl` below with your own photo.
 *    Free sources: unsplash.com, pexels.com (search "cybersecurity laptop"
 *    or "person typing dark office"). Download it into
 *    frontend/public/images/login-bg.jpg and set the path accordingly.
 * 2. Confirm the import path below for AuthContext matches your project
 *    structure. This assumes LoginPage.tsx lives in frontend/src/pages/
 *    and AuthContext.tsx lives in frontend/src/context/ — adjust the
 *    relative import ("../context/AuthContext") if your file sits
 *    somewhere else.
 * 3. Confirm the `navigate("/dashboard")` path matches your actual route.
 */

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

// TODO: replace with your own image (see note above)
const backgroundImageUrl = ""; // e.g. "/images/login-bg.jpg"

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      // FastAPI's standard error shape is { detail: "..." }.
      // rememberMe isn't wired to backend behavior yet — your login flow
      // always persists the refresh_token, so this checkbox is currently
      // decorative. Wire it up in AuthContext if you want "don't persist
      // across sessions" behavior when unchecked.
      const message =
        err?.response?.data?.detail || "Invalid email or password.";
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
      {/* Fallback atmospheric background — used only if no photo is set */}
      {!backgroundImageUrl && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Shield + checkmark badge */}
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

        {/* Glass card */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-soft p-6"
        >
          <h1 className="text-center text-lg font-semibold text-text-primary mb-1">
            Welcome back
          </h1>
          <p className="text-center text-sm text-text-secondary mb-6">
            Sign in to your CyberGuard AI console
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-critical/40 bg-critical/10 text-critical text-sm px-3 py-2">
              {error}
            </div>
          )}

          {/* Username / Email field */}
          <label className="block mb-4">
            <span className="sr-only">Email</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username or email"
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/70 outline-none"
              />
            </div>
          </label>

          {/* Password field */}
          <label className="block mb-4">
            <span className="sr-only">Password</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/70 outline-none"
              />
            </div>
          </label>

          {/* Remember me / Forgot password */}
          <div className="flex items-center justify-between mb-6 text-sm">
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-accent w-3.5 h-3.5"
              />
              Remember me
            </label>
            <a href="#" className="text-accent hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent text-background font-semibold text-sm py-3 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-text-secondary mt-5">
            Don't have an account?{" "}
            <a href="/register" className="text-text-primary font-medium hover:underline">
              Register
            </a>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

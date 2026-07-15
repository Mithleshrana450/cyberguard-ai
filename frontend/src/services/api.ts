/**
 * Centralized API client.
 *
 * Why this exists:
 * Instead of calling `fetch` or `axios` directly inside components (which
 * scatters base URLs, headers, and error handling everywhere), every
 * component imports this single `api` instance. Later, when we add JWT
 * auth in Module 1, we add ONE interceptor here to attach the token to
 * every request - not thirty edits across thirty components.
 */

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Simple in-memory token store, set by AuthContext after login. Kept
// outside React state here so the axios interceptor (which runs OUTSIDE
// any component) can read the current token without prop-drilling it
// through every single API call site.
let currentAccessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  currentAccessToken = token;
}

api.interceptors.request.use((config) => {
  // Don't override an explicitly-passed Authorization header (used by
  // AuthContext during the login/refresh calls themselves, before a
  // token exists yet).
  if (currentAccessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

export default api;

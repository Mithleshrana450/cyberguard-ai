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

export default api;

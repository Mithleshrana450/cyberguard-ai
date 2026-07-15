/**
 * AuthContext - the single source of truth for "who is logged in" across
 * the whole app.
 *
 * Token storage strategy (see Module 2 explanation for the full tradeoff
 * discussion):
 *   - access_token lives in React state only (memory) - never touches
 *     localStorage, so it's not directly readable by an XSS payload that
 *     doesn't also compromise the running React app itself.
 *   - refresh_token lives in localStorage so the user doesn't get logged
 *     out on every page refresh. This is the deliberate weaker link in
 *     the chain - documented, not accidental. A production hardening
 *     pass would move this to an httpOnly cookie (backend change).
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api, { setApiAccessToken } from "../services/api";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "analyst" | "viewer";
  is_active: boolean;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_TOKEN_KEY = "cyberguard_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    setApiAccessToken(token);
  };

  const fetchCurrentUser = async (token: string) => {
    const response = await api.get<User>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(response.data);
  };

  // On first app load, try to turn a stored refresh_token back into a
  // live session - this is what keeps you logged in after a page reload,
  // even though the access_token itself was only ever in memory.
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      setIsLoading(false);
      return;
    }

    api
      .post("/auth/refresh", { refresh_token: storedRefreshToken })
      .then(async (res) => {
        setAccessToken(res.data.access_token);
        await fetchCurrentUser(res.data.access_token);
      })
      .catch(() => {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, refresh_token } = response.data;
    setAccessToken(access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    await fetchCurrentUser(access_token);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await api.post("/auth/register", { email, password, full_name: fullName });
    await login(email, password);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken && accessToken) {
      try {
        await api.post(
          "/auth/logout",
          { refresh_token: refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch {
        // Even if the server call fails (e.g. token already expired),
        // we still clear local state below - the user's intent to log
        // out should always succeed from their perspective.
      }
    }
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

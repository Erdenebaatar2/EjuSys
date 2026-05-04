import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080";

export type AppRole = "student" | "admin";

export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  user: AppUser | null;
  role: AppRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; role?: AppRole | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "jwt_token";

function deriveRole(roles: string[]): AppRole | null {
  if (roles.includes("ADMIN")) return "admin";
  if (roles.includes("STUDENT")) return "student";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json() as Promise<AppUser & { roles: string[] }>;
      })
      .then((data) => {
        setUser(data);
        setRole(deriveRole(data.roles));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<{ error?: string; role?: AppRole | null }> {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        return { error: body.message ?? "Нэвтрэх амжилтгүй" };
      }
      const data = (await res.json()) as { token: string } & AppUser & { roles: string[] };
      localStorage.setItem(TOKEN_KEY, data.token);
      const computedRole = deriveRole(data.roles);
      setUser({ id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName, roles: data.roles });
      setRole(computedRole);
      return { role: computedRole ?? undefined };
    } catch {
      return { error: "Сервертэй холбогдох боломжгүй байна" };
    }
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

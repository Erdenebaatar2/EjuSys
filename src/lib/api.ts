const API_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "jwt_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiGet = <T>(path: string) => request<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPut = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string) => request<T>(path, { method: "DELETE" });

export async function uploadFile(type: "passport" | "photo", file: File): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/student/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Upload failed: ${res.status}`);
  }
  const data = (await res.json()) as { path: string };
  return data.path;
}

// Backward-compat (used by old code)
export const api = {
  login: (email: string, password: string) =>
    apiPost<{ token: string; id: string; email: string; firstName: string; lastName: string; roles: string[] }>(
      "/api/auth/login",
      { email, password },
    ),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiPost("/api/auth/register", data),
  authFetch: (url: string, options: RequestInit = {}) =>
    request(url, options),
};

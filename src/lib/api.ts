const API_BASE = "/api";

export type UserDTO = {
  id: string;
  email: string;
};

export type MeResponse = {
  user: UserDTO | null;
  subscriptionActive: boolean;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data: unknown = isJson ? await res.json() : null;

  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error ?? `Request failed (${res.status})`)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export const api = {
  me: () => request<MeResponse>("/me"),

  signup: (email: string, password: string) =>
    request<{ user: UserDTO }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ ok: true }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
};

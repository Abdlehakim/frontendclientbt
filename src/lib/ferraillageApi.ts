const API_BASE = "/api";
const BASE = "/ferraillage";

export type FerEtatChantierDTO = {
  id: string;
  rapportId: string;
  etatDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FerRestantNonConfectionneDTO = {
  id: string;
  rapportId: string;
  rapportDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FerRapportDTO = {
  id: string;
  chantierName: string;
  sousTraitant: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { etats: number; restants: number };
};

export type FerRapportDetailDTO = FerRapportDTO & {
  etats: FerEtatChantierDTO[];
  restants: FerRestantNonConfectionneDTO[];
};

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null) {
    if ("error" in data) return String((data as { error?: unknown }).error ?? fallback);
    if ("message" in data) return String((data as { message?: unknown }).message ?? fallback);
  }
  return fallback;
}

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

  if (!res.ok) throw new ApiError(res.status, getErrorMessage(data, `Request failed (${res.status})`));
  return data as T;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export const ferraillageApi = {
  listRapports: (q?: string) =>
    request<{ items: FerRapportDTO[] }>(`${BASE}/rapports${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  createRapport: (payload: { chantierName: string; sousTraitant?: string | null }) =>
    request<{ item: FerRapportDTO }>(`${BASE}/rapports`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRapport: (rapportId: string) =>
    request<{ item: FerRapportDetailDTO }>(`${BASE}/rapports/${encodeURIComponent(rapportId)}`),

  deleteRapport: (rapportId: string) =>
    request<{ ok: true }>(`${BASE}/rapports/${encodeURIComponent(rapportId)}`, { method: "DELETE" }),
};

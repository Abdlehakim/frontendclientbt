const API_BASE = "/api";
const BASE = "/ferraillage";

export type FerMouvementType = "LIVRAISON" | "TRANSFERT" | "AJUSTEMENT";

export type FerDiametreDTO = {
  id: string;
  mm: number;
  label: string | null;
  isActive: boolean;
};

export type FerEtatChantierDTO = {
  id: string;
  rapportId: string;
  etatDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FerMouvementLigneDTO = {
  id: string;
  diametreId: string;
  qty: string;
  diametre: FerDiametreDTO;
};

export type FerMouvementDTO = {
  id: string;
  etatId: string;
  date: string;
  type: FerMouvementType;
  bonLivraison: string | null;
  note: string | null;
  lignes: FerMouvementLigneDTO[];
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

export type FerRestantLigneDTO = {
  id: string;
  diametreId: string;
  qty: string;
  diametre: FerDiametreDTO;
};

export type FerRestantSnapshotDTO = {
  id: string;
  rapportId: string;
  date: string;
  note: string | null;
  lignes: FerRestantLigneDTO[];
  createdAt: string;
  updatedAt: string;
};

export type FerEtatChantierFullDTO = FerEtatChantierDTO & {
  mouvements: FerMouvementDTO[];
};

export type FerRestantNonConfectionneFullDTO = FerRestantNonConfectionneDTO & {
  snapshots: FerRestantSnapshotDTO[];
};

export type FerLigneInput = { mm: number; qty: number | string };

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

export const attFerraillageApi = {
  listDiametres: () => request<{ items: FerDiametreDTO[] }>(`${BASE}/diametres`),

  upsertDiametre: (payload: { mm: number; label?: string | null; isActive?: boolean }) =>
    request<{ item: FerDiametreDTO }>(`${BASE}/diametres`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createEtat: (payload: { rapportId: string; etatDate?: Date | string | null }) =>
    request<{ item: FerEtatChantierDTO }>(`${BASE}/etat`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getEtat: (etatId: string) =>
    request<{ item: FerEtatChantierFullDTO }>(`${BASE}/etat/${encodeURIComponent(etatId)}`),

  getEtatByRapportId: (rapportId: string) =>
    request<{ item: FerEtatChantierFullDTO | null }>(`${BASE}/etat/by-rapport/${encodeURIComponent(rapportId)}`),

  createMouvement: (
    etatId: string,
    payload: {
      date: Date | string;
      type?: FerMouvementType;
      bonLivraison?: string | null;
      note?: string | null;
      lignes: FerLigneInput[];
    },
  ) =>
    request<{ item: FerMouvementDTO }>(`${BASE}/etat/${encodeURIComponent(etatId)}/mouvements`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateMouvement: (
    mouvementId: string,
    payload: {
      date?: Date | string;
      type?: FerMouvementType;
      bonLivraison?: string | null;
      note?: string | null;
      lignes?: FerLigneInput[];
    },
  ) =>
    request<{ item: FerMouvementDTO }>(`${BASE}/mouvements/${encodeURIComponent(mouvementId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteMouvement: (mouvementId: string) =>
    request<{ ok: true }>(`${BASE}/mouvements/${encodeURIComponent(mouvementId)}`, { method: "DELETE" }),

  createRestant: (payload: { rapportId: string; rapportDate?: Date | string | null }) =>
    request<{ item: FerRestantNonConfectionneDTO }>(`${BASE}/restant`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRestantByRapportId: (rapportId: string) =>
    request<{ item: FerRestantNonConfectionneFullDTO | null }>(
      `${BASE}/restant/by-rapport/${encodeURIComponent(rapportId)}`,
    ),

  getRestant: (restantId: string) =>
    request<{ item: FerRestantNonConfectionneFullDTO }>(`${BASE}/restant/${encodeURIComponent(restantId)}`),

  upsertSnapshot: (
    restantId: string,
    payload: { date: Date | string; note?: string | null; lignes: FerLigneInput[] },
  ) =>
    request<{ item: FerRestantSnapshotDTO | null }>(`${BASE}/restant/${encodeURIComponent(restantId)}/snapshot`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteRestant: (restantId: string) =>
    request<{ ok: true }>(`${BASE}/restant/${encodeURIComponent(restantId)}`, { method: "DELETE" }),
};

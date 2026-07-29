import { API_BASE } from "./apiBase";

const BASE = "/ferraillage";

export type FerAcierType = "F400" | "F500";

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
  responsable: string | null;
  acierType?: FerAcierType | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { etats: number; restants: number; niveaux?: number };
};

export type FerProjectLineDTO = {
  id: string;
  rapportId: string;
  niveauId: string | null;
  designation: string;
  nomenclature?: string | null;
  nb?: number | null;
  hauteur?: number | null;
  forme?: string | null;
  diametreMm?: number | null;
  payload: Record<string, unknown>;
  qtyByMm: Record<string, number>;
  poidsByMm: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

export type FerProjectNiveauDTO = {
  id: string;
  name: string;
  note?: string | null;
  sortOrder: number;
  sousTraitants: string[];
  selectedMms: number[];
  lignes: FerProjectLineDTO[];
};

export type FerRapportDetailDTO = FerRapportDTO & {
  etats: FerEtatChantierDTO[];
  restants: FerRestantNonConfectionneDTO[];
  lignes: FerProjectLineDTO[];
  niveaux: FerProjectNiveauDTO[];
};

export type FerProjectDetailDTO = FerRapportDetailDTO;

export type FerraillageReportDTO = {
  id: string;
  name: string;
  projectId: string;
  createdById: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  project: FerRapportDTO;
};

export type FerraillageReportDetailDTO =
  Omit<FerraillageReportDTO, "project"> & {
    project: FerProjectDetailDTO;
  };

export type FerraillageReportCreatePayload = {
  projectId: string;
  name: string;
};

export type FerProjectCreatePayload = {
  chantierName: string;
  responsable?: string | null;
  acierType: FerAcierType;
  note?: string | null;
  niveaux?: Array<{
    name: string;
    note?: string | null;
    selectedMms: number[];
    sousTraitants: string[];
  }>;
};

export type FerProjectUpdatePayload = {
  chantierName: string;
  chantier?: string;
  responsable?: string | null;
  acierType: FerAcierType;
  typeAcier?: FerAcierType;
  note?: string | null;
};

export type FerProjectNiveauCreatePayload = {
  nomNiveau: string;
  note?: string | null;
  entreprisesMainsOeuvres: string[];
  diametresActifs: number[];
};

export type FerProjectNiveauUpdatePayload = FerProjectNiveauCreatePayload;

export type FerProjectLineCreatePayload = {
  niveauId?: string;
  designation: string;
  nomenclature?: string | null;
  nb?: number | null;
  hauteur?: number | null;
  forme?: string | null;
  diametreMm?: number | null;
  payload: Record<string, unknown>;
  qtyByMm: Record<string, number>;
  poidsByMm: Record<string, number>;
};

export type FerProjectLineUpdatePayload = FerProjectLineCreatePayload & {
  projectId: string;
  niveauId: string;
};

export type FerProjectLineDeletePayload = {
  projectId: string;
  niveauId: string;
};

export type FerProjectLineDuplicatePayload = FerProjectLineDeletePayload;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isFerRapportDTO(value: unknown): value is FerRapportDTO {
  if (!isRecord(value)) return false;

  if (
    typeof value.id !== "string" ||
    typeof value.chantierName !== "string" ||
    !isNullableString(value.responsable) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return false;
  }

  if (
    "acierType" in value &&
    value.acierType !== "F400" &&
    value.acierType !== "F500" &&
    value.acierType !== null
  ) {
    return false;
  }

  if ("note" in value && !isNullableString(value.note)) {
    return false;
  }

  if ("_count" in value && !isRecord(value._count)) {
    return false;
  }

  return true;
}

function isFerraillageReportDTO(
  value: unknown,
): value is FerraillageReportDTO {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.projectId === "string" &&
    isNullableString(value.createdById) &&
    typeof value.createdByName === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isFerRapportDTO(value.project)
  );
}

function isFerProjectDetailDTO(
  value: unknown,
): value is FerProjectDetailDTO {
  if (!isRecord(value)) return false;

  const {
    etats,
    restants,
    lignes,
    niveaux,
  } = value;

  return (
    isFerRapportDTO(value) &&
    Array.isArray(etats) &&
    Array.isArray(restants) &&
    Array.isArray(lignes) &&
    Array.isArray(niveaux)
  );
}

function isFerraillageReportDetailDTO(
  value: unknown,
): value is FerraillageReportDetailDTO {
  if (!isRecord(value) || !isFerraillageReportDTO(value)) {
    return false;
  }

  return isFerProjectDetailDTO(value.project);
}

function parseFerraillageReportListResponse(
  value: unknown,
): { items: FerraillageReportDTO[] } {
  if (!isRecord(value)) {
    throw new ApiError(
      500,
      "Invalid Ferraillage reports response",
    );
  }

  const items = value.items;
  if (
    !Array.isArray(items) ||
    !items.every(isFerraillageReportDTO)
  ) {
    throw new ApiError(
      500,
      "Invalid Ferraillage reports response",
    );
  }

  return { items };
}

function parseFerraillageReportDetailResponse(
  value: unknown,
): { item: FerraillageReportDetailDTO } {
  if (
    !isRecord(value) ||
    !isFerraillageReportDetailDTO(value.item)
  ) {
    throw new ApiError(
      500,
      "Invalid Ferraillage report response",
    );
  }

  return { item: value.item };
}

export const ferraillageApi = {
  listProjects: (q?: string) =>
    request<{ items: FerRapportDTO[] }>(
      `${BASE}/projects${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),

  listRapports: async (q?: string) => {
    const response = await request<unknown>(
      `${BASE}/rapports${
        q ? `?q=${encodeURIComponent(q)}` : ""
      }`,
    );

    return parseFerraillageReportListResponse(response);
  },

  createProject: (payload: FerProjectCreatePayload) =>
    request<{ item: FerRapportDTO }>(`${BASE}/projects`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProject: (projectId: string, payload: FerProjectUpdatePayload) => {
    const normalizedProjectId = projectId.trim();
    if (!normalizedProjectId) {
      throw new ApiError(400, "Invalid projectId");
    }

    const normalizedPayload: FerProjectUpdatePayload = {
      chantierName: payload.chantierName,
      chantier: payload.chantierName,
      responsable: payload.responsable ?? null,
      acierType: payload.acierType,
      typeAcier: payload.acierType,
      note: payload.note ?? null,
    };
    const requestOptions: RequestInit = {
      method: "PUT",
      body: JSON.stringify(normalizedPayload),
    };
    const projectPath = `${BASE}/projects/${encodeURIComponent(normalizedProjectId)}`;

    return request<{ item: FerProjectDetailDTO }>(projectPath, requestOptions);
  },

  createRapport: (payload: FerraillageReportCreatePayload) =>
    request<{ item: FerraillageReportDTO }>(`${BASE}/rapports`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRapport: async (rapportId: string) => {
    const response = await request<unknown>(
      `${BASE}/rapports/${encodeURIComponent(rapportId)}`,
    );

    return parseFerraillageReportDetailResponse(response);
  },

  getProject: (projectId: string) =>
    request<{ item: FerProjectDetailDTO }>(`${BASE}/projects/${encodeURIComponent(projectId)}`),

  createProjectNiveau: (projectId: string, payload: FerProjectNiveauCreatePayload) =>
    request<{ item: FerProjectNiveauDTO }>(`${BASE}/projects/${encodeURIComponent(projectId)}/niveaux`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProjectNiveau: (projectId: string, niveauId: string, payload: FerProjectNiveauUpdatePayload) => {
    const normalizedProjectId = projectId.trim();
    const normalizedNiveauId = niveauId.trim();
    if (!normalizedProjectId) {
      throw new ApiError(400, "Invalid projectId");
    }
    if (!normalizedNiveauId) {
      throw new ApiError(400, "Invalid niveauId");
    }

    const requestOptions: RequestInit = {
      method: "PUT",
      body: JSON.stringify(payload),
    };
    const projectPath =
      `${BASE}/projects/${encodeURIComponent(normalizedProjectId)}/niveaux/${encodeURIComponent(normalizedNiveauId)}`;

    return request<{ item: FerProjectNiveauDTO }>(projectPath, requestOptions);
  },

  deleteProjectNiveau: (projectId: string, niveauId: string) => {
    const normalizedProjectId = projectId.trim();
    const normalizedNiveauId = niveauId.trim();
    if (!normalizedProjectId) {
      throw new ApiError(400, "Invalid projectId");
    }
    if (!normalizedNiveauId) {
      throw new ApiError(400, "Invalid niveauId");
    }

    return request<{ ok: true }>(
      `${BASE}/projects/${encodeURIComponent(normalizedProjectId)}/niveaux/${encodeURIComponent(normalizedNiveauId)}`,
      { method: "DELETE" },
    );
  },

  createProjectLine: (projectId: string, payload: FerProjectLineCreatePayload) =>
    request<{ item: FerProjectLineDTO }>(`${BASE}/projects/${encodeURIComponent(projectId)}/lignes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createProjectNiveauLine: (projectId: string, niveauId: string, payload: Omit<FerProjectLineCreatePayload, "niveauId">) =>
    request<{ item: FerProjectLineDTO }>(`${BASE}/projects/${encodeURIComponent(projectId)}/niveaux/${encodeURIComponent(niveauId)}/lignes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProjectLine: (ligneId: string, payload: FerProjectLineUpdatePayload) =>
    request<{ item: FerProjectLineDTO }>(`${BASE}/lignes/${encodeURIComponent(ligneId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  duplicateProjectLine: (ligneId: string, payload: FerProjectLineDuplicatePayload) =>
    request<{ item: FerProjectLineDTO }>(`${BASE}/lignes/${encodeURIComponent(ligneId)}/duplicate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteProjectLine: (ligneId: string, payload: FerProjectLineDeletePayload) =>
    request<{ ok: true }>(`${BASE}/lignes/${encodeURIComponent(ligneId)}`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),

  deleteProject: (projectId: string) =>
    request<{ ok: true }>(
      `${BASE}/projects/${encodeURIComponent(projectId)}`,
      { method: "DELETE" },
    ),

  deleteRapport: (rapportId: string) =>
    request<{ ok: true }>(`${BASE}/rapports/${encodeURIComponent(rapportId)}`, { method: "DELETE" }),
};

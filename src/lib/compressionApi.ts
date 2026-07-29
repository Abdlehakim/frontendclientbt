import { API_BASE } from "./apiBase";

const BASE = "/compression-reports";

export type CompressionResultStatus =
  | "VALID"
  | "INVALID"
  | "NOT_TESTED";

export type CompressionProjectDTO = {
  id: string;
  chantierName: string;
  responsable: string | null;
};

export type CompressionReportSummaryDTO = {
  id: string;
  projectId: string;
  reportDate: string;
  title: string | null;
  companyName: string | null;
  createdById: string | null;
  createdByName: string;
  sampleCount: number;
  createdAt: string;
  updatedAt: string;
  project: CompressionProjectDTO;
};

export type CompressionResultDTO = {
  id: string;
  specimenNumber: number;
  value: number | null;
  status: CompressionResultStatus;
  note: string | null;
};

export type CompressionSeriesDTO = {
  id: string;
  crushingDate: string;
  reference: string | null;
  maturityDays: number;
  average: number | null;
  sortOrder: number;
  showInPlanning: boolean;
  planningTime: string;
  results: CompressionResultDTO[];
};

export type CompressionSampleDTO = {
  id: string;
  sequenceNumber: number;
  dosage: string;
  cement: string;
  admixture: string | null;
  designation: string;
  pourDate: string;
  specimenSendDate: string | null;
  specimenCount: number;
  sortOrder: number;
  series: CompressionSeriesDTO[];
};

export type CompressionReportDetailDTO =
  CompressionReportSummaryDTO & {
    samples: CompressionSampleDTO[];
  };

export type CompressionPlanningEventDTO = {
  id: string;
  crushingDate: string;
  planningTime: string;
  maturityDays: number;
  reference: string | null;
  sampleId: string;
  sampleSequenceNumber: number;
  designation: string;
  reportId: string;
  reportTitle: string | null;
  projectId: string;
  projectName: string;
};

export type CompressionResultInput = {
  id?: string;
  specimenNumber: number;
  value?: number | null;
  status: CompressionResultStatus;
  note?: string | null;
};

export type CompressionSeriesInput = {
  id?: string;
  crushingDate: string;
  reference?: string | null;
  sortOrder: number;
  showInPlanning: boolean;
  planningTime: string;
  results: CompressionResultInput[];
};

export type CompressionSampleInput = {
  id?: string;
  sequenceNumber: number;
  dosage: string;
  cement: string;
  admixture?: string | null;
  designation: string;
  pourDate: string;
  specimenSendDate?: string | null;
  specimenCount: number;
  sortOrder: number;
  series: CompressionSeriesInput[];
};

export type CompressionReportInput = {
  projectId: string;
  reportDate: string;
  title?: string | null;
  companyName?: string | null;
  samples: CompressionSampleInput[];
};

export type CompressionReportCreateInput = CompressionReportInput;
export type CompressionReportUpdateInput = CompressionReportInput;

export type CompressionReportHeaderCreateInput = {
  projectId: string;
  name: string;
  reportDate: string;
};

export type CompressionSampleMutationInput = {
  sequenceNumber: number;
  dosage: string;
  cement: string;
  admixture?: string | null;
  designation: string;
  pourDate: string;
  specimenSendDate?: string | null;
  specimenCount: number;
  sortOrder: number;
};

export type CompressionSeriesMutationInput = {
  specimenCount: number;
  series: {
    crushingDate: string;
    reference?: string | null;
    sortOrder: number;
    showInPlanning: boolean;
    planningTime: string;
    results: Array<{
      specimenNumber: number;
      value?: number | null;
      status: CompressionResultStatus;
      note?: string | null;
    }>;
  };
};

export class CompressionApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CompressionApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNullableString(
  value: unknown,
): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableNumber(
  value: unknown,
): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isPlanningTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

function isResultStatus(
  value: unknown,
): value is CompressionResultStatus {
  return (
    value === "VALID" ||
    value === "INVALID" ||
    value === "NOT_TESTED"
  );
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback;
  if ("error" in data) return String(data.error ?? fallback);
  if ("message" in data) return String(data.message ?? fallback);
  return fallback;
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data: unknown = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new CompressionApiError(
      response.status,
      getErrorMessage(
        data,
        `Request failed (${response.status})`,
      ),
    );
  }

  return data;
}

function isCompressionProjectDTO(
  value: unknown,
): value is CompressionProjectDTO {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.chantierName === "string" &&
    isNullableString(value.responsable)
  );
}

function isCompressionReportSummaryDTO(
  value: unknown,
): value is CompressionReportSummaryDTO {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.reportDate === "string" &&
    isNullableString(value.title) &&
    isNullableString(value.companyName) &&
    isNullableString(value.createdById) &&
    typeof value.createdByName === "string" &&
    typeof value.sampleCount === "number" &&
    Number.isInteger(value.sampleCount) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isCompressionProjectDTO(value.project)
  );
}

function isCompressionResultDTO(
  value: unknown,
): value is CompressionResultDTO {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.specimenNumber === "number" &&
    Number.isInteger(value.specimenNumber) &&
    isNullableNumber(value.value) &&
    isResultStatus(value.status) &&
    isNullableString(value.note)
  );
}

function isCompressionSeriesDTO(
  value: unknown,
): value is CompressionSeriesDTO {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.crushingDate === "string" &&
    isNullableString(value.reference) &&
    typeof value.maturityDays === "number" &&
    Number.isInteger(value.maturityDays) &&
    isNullableNumber(value.average) &&
    typeof value.sortOrder === "number" &&
    Number.isInteger(value.sortOrder) &&
    typeof value.showInPlanning === "boolean" &&
    isPlanningTime(value.planningTime) &&
    Array.isArray(value.results) &&
    value.results.every(isCompressionResultDTO)
  );
}

function isCompressionPlanningEventDTO(
  value: unknown,
): value is CompressionPlanningEventDTO {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.crushingDate === "string" &&
    isPlanningTime(value.planningTime) &&
    typeof value.maturityDays === "number" &&
    Number.isInteger(value.maturityDays) &&
    isNullableString(value.reference) &&
    typeof value.sampleId === "string" &&
    typeof value.sampleSequenceNumber === "number" &&
    Number.isInteger(value.sampleSequenceNumber) &&
    typeof value.designation === "string" &&
    typeof value.reportId === "string" &&
    isNullableString(value.reportTitle) &&
    typeof value.projectId === "string" &&
    typeof value.projectName === "string"
  );
}

function isCompressionSampleDTO(
  value: unknown,
): value is CompressionSampleDTO {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.sequenceNumber === "number" &&
    Number.isInteger(value.sequenceNumber) &&
    typeof value.dosage === "string" &&
    typeof value.cement === "string" &&
    isNullableString(value.admixture) &&
    typeof value.designation === "string" &&
    typeof value.pourDate === "string" &&
    isNullableString(value.specimenSendDate) &&
    typeof value.specimenCount === "number" &&
    Number.isInteger(value.specimenCount) &&
    typeof value.sortOrder === "number" &&
    Number.isInteger(value.sortOrder) &&
    Array.isArray(value.series) &&
    value.series.every(isCompressionSeriesDTO)
  );
}

function isCompressionReportDetailDTO(
  value: unknown,
): value is CompressionReportDetailDTO {
  if (!isRecord(value)) return false;

  const samples = value.samples;

  return (
    isCompressionReportSummaryDTO(value) &&
    Array.isArray(samples) &&
    samples.every(isCompressionSampleDTO)
  );
}

function parseListResponse(
  value: unknown,
): { items: CompressionReportSummaryDTO[] } {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isCompressionReportSummaryDTO)
  ) {
    throw new CompressionApiError(
      500,
      "Invalid compression reports response",
    );
  }

  return { items: value.items };
}

function parseDetailResponse(
  value: unknown,
): { item: CompressionReportDetailDTO } {
  if (
    !isRecord(value) ||
    !isCompressionReportDetailDTO(value.item)
  ) {
    throw new CompressionApiError(
      500,
      "Invalid compression report response",
    );
  }

  return { item: value.item };
}

function parsePlanningEventsResponse(
  value: unknown,
): { items: CompressionPlanningEventDTO[] } {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isCompressionPlanningEventDTO)
  ) {
    throw new CompressionApiError(
      500,
      "Invalid compression planning response",
    );
  }

  return { items: value.items };
}

function normalizeReportId(reportId: string): string {
  const normalized = reportId.trim();
  if (!normalized) {
    throw new CompressionApiError(400, "Invalid reportId");
  }
  return normalized;
}

function normalizeEntityId(
  value: string,
  label: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new CompressionApiError(
      400,
      `Invalid ${label}`,
    );
  }

  return normalized;
}

export function isCompressionApiError(
  error: unknown,
): error is CompressionApiError {
  return error instanceof CompressionApiError;
}

export const compressionApi = {
  listReports: async (q?: string) => {
    const query = q?.trim();
    const response = await request(
      `${BASE}${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    );
    return parseListResponse(response);
  },

  listPlanningEvents: async (
    from: string,
    to: string,
  ) => {
    const response = await request(
      `${BASE}/planning?from=${encodeURIComponent(
        from,
      )}&to=${encodeURIComponent(to)}`,
    );
    return parsePlanningEventsResponse(response);
  },

  getReport: async (reportId: string) => {
    const id = normalizeReportId(reportId);
    const response = await request(
      `${BASE}/${encodeURIComponent(id)}`,
    );
    return parseDetailResponse(response);
  },

  createReport: async (payload: CompressionReportCreateInput) => {
    const response = await request(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return parseDetailResponse(response);
  },

  createHeader: async (
    payload: CompressionReportHeaderCreateInput,
  ) => {
    const response = await request(`${BASE}/headers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return parseDetailResponse(response);
  },

  createSample: async (
    reportId: string,
    payload: CompressionSampleMutationInput,
  ) => {
    const normalizedReportId =
      normalizeReportId(reportId);

    const response = await request(
      `${BASE}/${encodeURIComponent(
        normalizedReportId,
      )}/samples`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return parseDetailResponse(response);
  },

  updateSample: async (
    reportId: string,
    sampleId: string,
    payload: CompressionSampleMutationInput,
  ) => {
    const normalizedReportId =
      normalizeReportId(reportId);
    const normalizedSampleId =
      normalizeEntityId(sampleId, "sampleId");

    const response = await request(
      `${BASE}/${encodeURIComponent(
        normalizedReportId,
      )}/samples/${encodeURIComponent(
        normalizedSampleId,
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    return parseDetailResponse(response);
  },

  deleteSample: async (
    reportId: string,
    sampleId: string,
  ) => {
    const normalizedReportId =
      normalizeReportId(reportId);
    const normalizedSampleId =
      normalizeEntityId(sampleId, "sampleId");

    const response = await request(
      `${BASE}/${encodeURIComponent(
        normalizedReportId,
      )}/samples/${encodeURIComponent(
        normalizedSampleId,
      )}`,
      {
        method: "DELETE",
      },
    );

    return parseDetailResponse(response);
  },

  createSeries: async (
    reportId: string,
    sampleId: string,
    payload: CompressionSeriesMutationInput,
  ) => {
    const normalizedReportId =
      normalizeReportId(reportId);
    const normalizedSampleId =
      normalizeEntityId(sampleId, "sampleId");

    const response = await request(
      `${BASE}/${encodeURIComponent(
        normalizedReportId,
      )}/samples/${encodeURIComponent(
        normalizedSampleId,
      )}/series`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return parseDetailResponse(response);
  },

  updateSeries: async (
    reportId: string,
    sampleId: string,
    seriesId: string,
    payload: CompressionSeriesMutationInput,
  ) => {
    const normalizedReportId =
      normalizeReportId(reportId);
    const normalizedSampleId =
      normalizeEntityId(sampleId, "sampleId");
    const normalizedSeriesId =
      normalizeEntityId(seriesId, "seriesId");

    const response = await request(
      `${BASE}/${encodeURIComponent(
        normalizedReportId,
      )}/samples/${encodeURIComponent(
        normalizedSampleId,
      )}/series/${encodeURIComponent(
        normalizedSeriesId,
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    return parseDetailResponse(response);
  },

  deleteSeries: async (
    reportId: string,
    sampleId: string,
    seriesId: string,
  ) => {
    const normalizedReportId =
      normalizeReportId(reportId);
    const normalizedSampleId =
      normalizeEntityId(sampleId, "sampleId");
    const normalizedSeriesId =
      normalizeEntityId(seriesId, "seriesId");

    const response = await request(
      `${BASE}/${encodeURIComponent(
        normalizedReportId,
      )}/samples/${encodeURIComponent(
        normalizedSampleId,
      )}/series/${encodeURIComponent(
        normalizedSeriesId,
      )}`,
      {
        method: "DELETE",
      },
    );

    return parseDetailResponse(response);
  },

  updateReport: async (
    reportId: string,
    payload: CompressionReportUpdateInput,
  ) => {
    const id = normalizeReportId(reportId);
    const response = await request(
      `${BASE}/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    return parseDetailResponse(response);
  },

  deleteReport: async (reportId: string) => {
    const id = normalizeReportId(reportId);
    const response = await request(
      `${BASE}/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );

    if (
      !isRecord(response) ||
      response.ok !== true
    ) {
      throw new CompressionApiError(
        500,
        "Invalid compression delete response",
      );
    }

    return { ok: true } as const;
  },
};

import { API_BASE } from "./apiBase";

const BASE = "/planning/tasks";

export type PlanningTaskDTO = {
  id: string;
  title: string;
  taskDate: string | null;
  taskTime: string | null;
  projectId: string;
  projectName: string;
  createdById: string | null;
  createdByName: string;
  assignedToId: string | null;
  assignedToName: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanningTaskAssigneeDTO = {
  id: string;
  name: string | null;
  email: string;
};

export type PlanningTaskMutationPayload = {
  title: string;
  projectId: string;
  assignedToId: string;
  taskDate: string;
  taskTime: string;
};

class PlanningTasksApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PlanningTasksApiError";
    this.status = status;
  }
}

function getErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (typeof data === "object" && data !== null) {
    if ("message" in data) {
      return String(
        (data as { message?: unknown }).message ??
          fallback,
      );
    }

    if ("error" in data) {
      return String(
        (data as { error?: unknown }).error ??
          fallback,
      );
    }
  }

  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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
  const data: unknown = isJson
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new PlanningTasksApiError(
      response.status,
      getErrorMessage(
        data,
        `Request failed (${response.status})`,
      ),
    );
  }

  return data as T;
}

export function isPlanningTasksApiError(
  error: unknown,
): error is PlanningTasksApiError {
  return error instanceof PlanningTasksApiError;
}

export const planningTasksApi = {
  listTasks: (projectId?: string) => {
    const normalizedProjectId = projectId?.trim() ?? "";
    const query = normalizedProjectId
      ? `?projectId=${encodeURIComponent(
          normalizedProjectId,
        )}`
      : "";

    return request<{ items: PlanningTaskDTO[] }>(
      `${BASE}${query}`,
    );
  },

  listAssignees: () =>
    request<{ items: PlanningTaskAssigneeDTO[] }>(
      `${BASE}/assignees`,
    ),

  createTask: (
    payload: PlanningTaskMutationPayload,
  ) =>
    request<{ item: PlanningTaskDTO }>(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTask: (
    taskId: string,
    payload: PlanningTaskMutationPayload,
  ) => {
    const normalizedTaskId = taskId.trim();

    return request<{ item: PlanningTaskDTO }>(
      `${BASE}/${encodeURIComponent(
        normalizedTaskId,
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  },

  deleteTask: (taskId: string) => {
    const normalizedTaskId = taskId.trim();

    return request<{ ok: true }>(
      `${BASE}/${encodeURIComponent(
        normalizedTaskId,
      )}`,
      {
        method: "DELETE",
      },
    );
  },
};

const API_BASE = "/api";

export type Plan = "INDIVIDUAL" | "ENTERPRISE";
export type BillingCycle = "MONTHLY" | "YEARLY";
export type ModuleKey = "MODULE_1" | "MODULE_2";

export type UserDTO = {
  id: string;
  email: string;
};

export type SubscriptionDTO = {
  status: string | null;
  plan: Plan | null;
  billingCycle: BillingCycle | null;
  seats: number | null;
  currentPeriodEnd: string | null;
  expired: boolean;
  valid: boolean;
};

export type MeResponse = {
  user: UserDTO | null;
  subscriptionActive: boolean;
  subscription: SubscriptionDTO | null;
  plan: Plan | null;
  modules: ModuleKey[];
  onboarding: {
    planSelected: boolean;
    modulesSelected: boolean;
    complete: boolean;
  } | null;
  onboardingComplete: boolean;
};

export type ModuleDTO = { key: ModuleKey; name: string };

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null && "error" in data) {
    return String((data as { error?: unknown }).error ?? fallback);
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

  if (!res.ok) {
    throw new ApiError(res.status, getErrorMessage(data, `Request failed (${res.status})`));
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

  selectPlan: (plan: Plan, billingCycle: BillingCycle) =>
    request<{ ok: true }>("/onboarding/plan", {
      method: "POST",
      body: JSON.stringify({ plan, billingCycle }),
    }),

  listModules: () => request<{ modules: ModuleDTO[] }>("/modules"),

  selectModules: (modules: ModuleKey[]) =>
    request<{ ok: true }>("/onboarding/modules", {
      method: "POST",
      body: JSON.stringify({ modules }),
    }),
};

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

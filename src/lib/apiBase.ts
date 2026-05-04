const API_ORIGIN =
  import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "").replace(/\/api$/, "") || "";

export const API_BASE = `${API_ORIGIN}/api`;

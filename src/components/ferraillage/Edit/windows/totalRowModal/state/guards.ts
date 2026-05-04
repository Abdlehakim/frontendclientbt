import type { ExtraFormePayload, SlabRelation, TotalRowModalPayload } from "../types";

export function isTotalRowModalPayload(
  payload: TotalRowModalPayload | ExtraFormePayload | null | undefined,
): payload is TotalRowModalPayload {
  return !!payload && typeof payload === "object" && "designation" in payload && "typeName" in payload;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z_]/g, "");
}

export function normalizeSlabSurfacePerM2Relation(value: string | null | undefined): SlabRelation | null {
  const normalized = normalizeToken(String(value ?? ""));

  if (normalized === "ab_equal_diff_if" || normalized === "abequaldiffif") {
    return "ab_equal_diff_if";
  }

  if (normalized === "ab_diff_same_if" || normalized === "abdiffsameif") {
    return "ab_diff_same_if";
  }

  if (normalized === "ab_diff_diff_if" || normalized === "abdiffdiffif") {
    return "ab_diff_diff_if";
  }

  return null;
}

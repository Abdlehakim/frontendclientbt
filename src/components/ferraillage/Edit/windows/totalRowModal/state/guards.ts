import type {
  CadreCalcMode,
  ExtraCalcMode,
  FormeKind,
  SemelleRelation,
  SlabCalcMethod,
  SlabRelation,
  SlabSpacingMode,
  SlabSpacingRelation,
} from "../types";
import {
  BARRE_DESIGNATIONS,
  SEMELLE_DESIGNATION,
  SEMELLE_RELATIONS,
  SLAB_DESIGNATIONS,
  SLAB_RELATIONS,
  SLAB_SPACING_MODES,
  SLAB_SPACING_RELATIONS,
  SLAB_SURFACE_PER_M2_SPACING_DESIGNATIONS,
} from "../config/formeBarreOptions";

export function isFormeKind(value: unknown): value is FormeKind {
  return value === "BARRE" || value === "CARRE" || value === "CIRCULAIRE" || value === "RECTANGULAIRE";
}

export function isSemelleRelation(value: unknown): value is SemelleRelation {
  return typeof value === "string" && (SEMELLE_RELATIONS as readonly string[]).includes(value);
}

export function isSlabCalcMethod(value: unknown): value is SlabCalcMethod {
  return value === "SURFACE_TOTAL" || value === "SURFACE_TOTAL_PER_M2";
}

export function isSlabRelation(value: unknown): value is SlabRelation {
  return typeof value === "string" && (SLAB_RELATIONS as readonly string[]).includes(value);
}

export function isSlabSpacingMode(value: unknown): value is SlabSpacingMode {
  return typeof value === "string" && (SLAB_SPACING_MODES as readonly string[]).includes(value);
}

export function isSlabSpacingRelation(value: unknown): value is SlabSpacingRelation {
  return typeof value === "string" && (SLAB_SPACING_RELATIONS as readonly string[]).includes(value);
}

export function asString(value: unknown, fallback = "0") {
  return typeof value === "string" ? value : fallback;
}

export function asTrimmedString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function asFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asNullableFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asCadreCalcMode(value: unknown): CadreCalcMode {
  return value === "NB_CADRE" ? "NB_CADRE" : "ESPACEMENT";
}

export function asExtraCalcMode(value: unknown): ExtraCalcMode {
  return value === "NB" ? "NB" : "ESPACEMENT";
}

export function asSemelleRelation(value: unknown): SemelleRelation {
  return isSemelleRelation(value) ? value : "ab_equal_same_if";
}

export function asSlabCalcMethod(value: unknown): SlabCalcMethod {
  return isSlabCalcMethod(value) ? value : "SURFACE_TOTAL";
}

export function asSlabRelation(value: unknown): SlabRelation {
  return isSlabRelation(value) ? value : "ab_equal_same_if";
}

export function normalizeSlabSurfacePerM2Relation(
  value: unknown,
): Extract<SlabRelation, "ab_equal_same_if" | "ab_equal_diff_if"> {
  return value === "ab_equal_diff_if" ? "ab_equal_diff_if" : "ab_equal_same_if";
}

export const normalizeDallePleineSurfacePerM2Relation = normalizeSlabSurfacePerM2Relation;

export function asSlabSpacingMode(value: unknown): SlabSpacingMode {
  return isSlabSpacingMode(value) ? value : "ESPACEMENT";
}

export function asSlabSpacingRelation(value: unknown): SlabSpacingRelation {
  return isSlabSpacingRelation(value) ? value : "EA_EQ_EB";
}

export function normalizeSlabSpacingRelationValue(value: unknown): SlabSpacingRelation {
  const raw = typeof value === "string" ? value.trim() : "";

  if (raw === "EA_NE_EB" || raw === "E_A_NE_E_B" || raw === "EA_NEQ_EB" || raw === "EA_NOT_EQ_EB") {
    return "EA_NE_EB";
  }

  if (raw === "EA_EQ_EB" || raw === "E_A_EQ_E_B") {
    return "EA_EQ_EB";
  }

  return "EA_EQ_EB";
}

export function normalizeDesignation(value: unknown) {
  return asTrimmedString(value, "").toLowerCase();
}

export function isCountBasedBarreNTDesignationValue(value: unknown) {
  const normalized = normalizeDesignation(value);
  return (
    normalized === "poteaux" ||
    BARRE_DESIGNATIONS.includes(normalized as (typeof BARRE_DESIGNATIONS)[number])
  );
}

export function isSlabDesignationValue(value: unknown) {
  const normalized = normalizeDesignation(value);
  return (
    normalized === SEMELLE_DESIGNATION ||
    SLAB_DESIGNATIONS.includes(normalized as (typeof SLAB_DESIGNATIONS)[number])
  );
}

export function isSlabSurfacePerM2SpacingDesignationValue(value: unknown) {
  const normalized = normalizeDesignation(value);
  return SLAB_SURFACE_PER_M2_SPACING_DESIGNATIONS.includes(
    normalized as (typeof SLAB_SURFACE_PER_M2_SPACING_DESIGNATIONS)[number],
  );
}

export function asObjectRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function pickFirst(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
}

export function readStringish(source: Record<string, unknown>, keys: string[], fallback = "0") {
  const value = pickFirst(source, keys);
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export function readNullableFiniteNumber(source: Record<string, unknown>, keys: string[]) {
  return asNullableFiniteNumber(pickFirst(source, keys));
}

export function hasAnyValue(source: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => {
    const value = source[key];
    return value !== undefined && value !== null && value !== "";
  });
}

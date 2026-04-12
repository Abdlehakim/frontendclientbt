import type {
  SlabCalcMethod,
  SlabRelation,
  SlabSpacingMode,
  SlabSpacingRelation,
} from "../types";
import type { SemelleNappe, SlabNappe, SemelleRelation } from "./formeBarreOptions";

export function fmt(n: number) {
  const r = Math.round(n * 1000) / 1000;
  return String(r).replace(".", ",");
}

export function getNappeLabel(value: SemelleNappe | SlabNappe) {
  switch (value) {
    case "Nappe inférieur":
      return "Nappe inférieure";
    case "Nappe supérieur":
      return "Nappe supérieure";
    case "Chaise":
      return "Chaise";
    case "Acier de renfort":
      return "Acier de renfort";
    default:
      return value;
  }
}

export function getSemelleRelationLabel(v: SemelleRelation) {
  switch (v) {
    case "ab_equal_same_if":
      return "a = b et if/a = if/b";
    case "ab_equal_diff_if":
      return "a = b et if/a ≠ if/b";
    case "ab_diff_same_if":
      return "a ≠ b et if/a = if/b";
    case "ab_diff_diff_if":
      return "a ≠ b et if/a ≠ if/b";
    default:
      return v;
  }
}

export function getSlabRelationLabel(v: SlabRelation) {
  switch (v) {
    case "ab_equal_same_if":
      return "a = b et if/a = if/b";
    case "ab_equal_diff_if":
      return "a = b et if/a ≠ if/b";
    case "ab_diff_same_if":
      return "a ≠ b et if/a = if/b";
    case "ab_diff_diff_if":
      return "a ≠ b et if/a ≠ if/b";
    default:
      return v;
  }
}

export function getSlabCalcMethodLabel(v: SlabCalcMethod) {
  switch (v) {
    case "SURFACE_TOTAL":
      return "Surface totale";
    case "SURFACE_TOTAL_PER_M2":
      return "Surface totale / m²";
    default:
      return v;
  }
}

export function getSlabSpacingModeLabel(v: SlabSpacingMode) {
  switch (v) {
    case "ESPACEMENT":
      return "Espacement";
    case "NB_CADRE":
      return "Nb. Barres";
    default:
      return v;
  }
}

export function getSlabSpacingRelationLabel(v: SlabSpacingRelation) {
  switch (v) {
    case "EA_EQ_EB":
      return "E a = E b";
    case "EA_NE_EB":
      return "E a ≠ E b";
    default:
      return v;
  }
}

export function formatDiametreLabel(mm: number | null | undefined) {
  if (typeof mm !== "number" || !Number.isFinite(mm) || mm <= 0) return "";
  return String(mm).replace(".", ",");
}
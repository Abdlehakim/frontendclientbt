import type {
  SlabCalcMethod,
  SlabRelation,
  SlabSpacingMode,
  SlabSpacingRelation,
} from "./types";

export type BarreCategorie =
  | "Acier inférieur"
  | "Acier supérieur"
  | "Acier de peau"
  | "Acier de renfort"
  | "Chapeau"
  | "Barre en bateau";

export type SemelleNappe = "Nappe inférieur" | "Nappe supérieur" | "Chaise";
export type SlabNappe = "Nappe inférieur" | "Nappe supérieur" | "Chaise" | "Acier de renfort";

export type SemelleRelation =
  | "ab_equal_same_if"
  | "ab_equal_diff_if"
  | "ab_diff_same_if"
  | "ab_diff_diff_if";

export const BARRE_DESIGNATIONS = [
  "longrines",
  "raidisseurs",
  "linteaux",
  "chaînages",
  "poutres",
  "nervures",
] as const;

export const SEMELLE_DESIGNATION = "semelles";
export const SLAB_DESIGNATIONS = ["dalle pleine", "chape", "radier"] as const;

export const BARRE_CATEGORIES: readonly BarreCategorie[] = [
  "Acier inférieur",
  "Acier supérieur",
  "Acier de peau",
  "Acier de renfort",
  "Chapeau",
  "Barre en bateau",
];

export const SEMELLE_NAPPES: readonly SemelleNappe[] = [
  "Nappe inférieur",
  "Nappe supérieur",
  "Chaise",
];

export const SLAB_NAPPES: readonly SlabNappe[] = [
  "Nappe inférieur",
  "Nappe supérieur",
  "Chaise",
  "Acier de renfort",
];

export const LIT_CATEGORIES = new Set<BarreCategorie>([
  "Acier inférieur",
  "Acier supérieur",
  "Chapeau",
]);

export const SEMELLE_RELATIONS: readonly SemelleRelation[] = [
  "ab_equal_same_if",
  "ab_equal_diff_if",
  "ab_diff_same_if",
  "ab_diff_diff_if",
];

export const SLAB_RELATIONS: readonly SlabRelation[] = [
  "ab_equal_same_if",
  "ab_equal_diff_if",
  "ab_diff_same_if",
  "ab_diff_diff_if",
];

export const SLAB_CALC_METHODS: readonly SlabCalcMethod[] = [
  "SURFACE_TOTAL",
  "SURFACE_TOTAL_PER_M2",
];

export const SLAB_SPACING_MODES: readonly SlabSpacingMode[] = [
  "ESPACEMENT",
  "NB_CADRE",
];

export const SLAB_SPACING_RELATIONS: readonly SlabSpacingRelation[] = [
  "EA_EQ_EB",
  "EA_NE_EB",
];

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

export function isValidSlabSpacingRelation(value: string): value is SlabSpacingRelation {
  return (SLAB_SPACING_RELATIONS as readonly string[]).includes(value);
}

export function isSemelleEqualSharedRelation(v: SemelleRelation) {
  return v === "ab_equal_same_if";
}
export function isSemelleEqualDualRelation(v: SemelleRelation) {
  return v === "ab_equal_diff_if";
}
export function isSemelleDiffSharedRelation(v: SemelleRelation) {
  return v === "ab_diff_same_if";
}
export function isSemelleDiffDualRelation(v: SemelleRelation) {
  return v === "ab_diff_diff_if";
}
export function isSlabEqualSharedRelation(v: SlabRelation) {
  return v === "ab_equal_same_if";
}
export function isSlabEqualDualRelation(v: SlabRelation) {
  return v === "ab_equal_diff_if";
}
export function isSlabDiffSharedRelation(v: SlabRelation) {
  return v === "ab_diff_same_if";
}
export function isSlabDiffDualRelation(v: SlabRelation) {
  return v === "ab_diff_diff_if";
}

export function formatDiametreLabel(mm: number | null | undefined) {
  if (typeof mm !== "number" || !Number.isFinite(mm) || mm <= 0) return "";
  return String(mm).replace(".", ",");
}
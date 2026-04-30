import type {
  SlabCalcMethod,
  SlabRelation,
  SlabSpacingMode,
  SlabSpacingRelation,
} from "../types";

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
export const SLAB_DESIGNATIONS = ["dalle pleine", "chape", "radier", "voile"] as const;
export const SLAB_SURFACE_PER_M2_SPACING_DESIGNATIONS = SLAB_DESIGNATIONS;

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

export function isBarreCategorie(value: string): value is BarreCategorie {
  return (BARRE_CATEGORIES as readonly string[]).includes(value);
}

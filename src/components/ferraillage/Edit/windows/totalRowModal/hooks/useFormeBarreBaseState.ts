import type { FormeState } from "../types";
import {
  BARRE_DESIGNATIONS,
  LIT_CATEGORIES,
  SEMELLE_DESIGNATION,
  SLAB_SURFACE_PER_M2_SPACING_DESIGNATIONS,
  type BarreCategorie,
  isBarreCategorie,
  shouldShowStandardBarreAncrageField,
} from "../config/formeBarreOptions";
import { isSlabDesignationValue } from "../state/guards";

export function useFormeBarreBaseState({
  designation,
  safeMms,
  x,
  barreLitIndex,
}: {
  designation: string;
  safeMms: number[];
  x: FormeState;
  barreLitIndex: number | null;
}) {
  const normalizedDesignation = (designation ?? "").trim().toLowerCase();

  const showBarreOptions = BARRE_DESIGNATIONS.includes(
    normalizedDesignation as (typeof BARRE_DESIGNATIONS)[number],
  );

  const isSemelleDesignation = normalizedDesignation === SEMELLE_DESIGNATION;
  const isSlab = isSlabDesignationValue(normalizedDesignation);
  const isSemelle = isSemelleDesignation && !isSlab;
  const isDallePleine = normalizedDesignation === "dalle pleine";
  const isSlabSurfacePerM2SpacingDesignation = SLAB_SURFACE_PER_M2_SPACING_DESIGNATIONS.includes(
    normalizedDesignation as (typeof SLAB_SURFACE_PER_M2_SPACING_DESIGNATIONS)[number],
  );

  const fallbackDiametreValue = safeMms[0] ?? 6;

  const rawBarreCategorie = (x.barreCategorie ?? "").trim();

  const barreCategorieValue: BarreCategorie | "" =
    isSemelle || isSlab || !showBarreOptions
      ? ""
      : isBarreCategorie(rawBarreCategorie)
        ? rawBarreCategorie
        : "";

  const showLitField =
    showBarreOptions &&
    !isSemelle &&
    !isSlab &&
    barreCategorieValue !== "" &&
    LIT_CATEGORIES.has(barreCategorieValue);

  const litValue = showLitField && barreLitIndex != null ? `Lit ${barreLitIndex}` : "";

  const showAncrageField = shouldShowStandardBarreAncrageField({
    isSemelle,
    isSlab,
    showBarreOptions,
    barreCategorie: barreCategorieValue,
  });

  const diametreValue = (x.diametreMm ?? fallbackDiametreValue) as number;

  return {
    normalizedDesignation,
    showBarreOptions,
    isSemelle,
    isSlab,
    isDallePleine,
    isSlabSurfacePerM2SpacingDesignation,
    fallbackDiametreValue,
    barreCategorieValue,
    showLitField,
    litValue,
    showAncrageField,
    diametreValue,
  };
}

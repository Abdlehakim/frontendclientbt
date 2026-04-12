import type { FormeState } from "../types";
import { SLAB_NAPPES, type SlabNappe } from "../config/formeBarreOptions";

function isSlabNappe(value: string): value is SlabNappe {
  return (SLAB_NAPPES as readonly string[]).includes(value);
}

export function useSlabState({
  isSlab,
  isDallePleine,
  x,
  fallbackDiametreValue,
}: {
  isSlab: boolean;
  isDallePleine: boolean;
  x: FormeState;
  fallbackDiametreValue: number;
}) {
  const rawBarreCategorie = (x.barreCategorie ?? "").trim();

  const slabNappeShown: SlabNappe =
    isSlab && isSlabNappe(rawBarreCategorie)
      ? rawBarreCategorie
      : "Nappe inférieur";

  const slabCalcMethodValue = (x.slabCalcMethod ?? "SURFACE_TOTAL") as
    | "SURFACE_TOTAL"
    | "SURFACE_TOTAL_PER_M2";

  const slabRelationValue = (x.slabRelation ?? "ab_equal_same_if") as
    | "ab_equal_same_if"
    | "ab_equal_diff_if"
    | "ab_diff_same_if"
    | "ab_diff_diff_if";

  const slabSpacingModeValue = (x.slabSpacingMode ?? "ESPACEMENT") as
    | "ESPACEMENT"
    | "NB_CADRE";

  const slabSpacingRelationValue = (x.slabSpacingRelation ?? "EA_EQ_EB") as
    | "EA_EQ_EB"
    | "EA_NE_EB";

  const slabEqualSharedActive = isSlab && slabRelationValue === "ab_equal_same_if";
  const slabEqualDualActive = isSlab && slabRelationValue === "ab_equal_diff_if";
  const slabDiffSharedActive = isSlab && slabRelationValue === "ab_diff_same_if";
  const slabDiffDualActive = isSlab && slabRelationValue === "ab_diff_diff_if";

  const slabDualActive = slabEqualDualActive || slabDiffDualActive;
  const slabSharedActive = slabEqualSharedActive || slabDiffSharedActive;

  const slabSurfaceTotalMode =
    isSlab &&
    (slabCalcMethodValue === "SURFACE_TOTAL" || slabCalcMethodValue === "SURFACE_TOTAL_PER_M2");

  const slabSurfacePerM2Mode = isSlab && slabCalcMethodValue === "SURFACE_TOTAL_PER_M2";
  const slabEffectiveSpacingModeValue = slabSurfacePerM2Mode ? "NB_CADRE" : slabSpacingModeValue;

  const showSlabCombinedLengthRow =
    slabSurfaceTotalMode && (slabEqualSharedActive || slabEqualDualActive);
  const showSlabSeparateLengthRow =
    slabSurfaceTotalMode && (slabDiffSharedActive || slabDiffDualActive);

  const showSlabSharedDiaAndCount = isSlab && (slabEqualSharedActive || slabDiffSharedActive);
  const showSlabDualDiaAndCount = isSlab && (slabEqualDualActive || slabDiffDualActive);

  const showSlabSpacingMode = slabSurfaceTotalMode && !slabSurfacePerM2Mode;

  const showSlabSpacingRelationToggle =
    showSlabSpacingMode &&
    slabEffectiveSpacingModeValue === "ESPACEMENT" &&
    (slabSharedActive || slabDualActive);

  const showSlabSharedSpacingInput =
    slabSurfaceTotalMode &&
    slabEffectiveSpacingModeValue === "ESPACEMENT" &&
    (slabSharedActive || slabDualActive) &&
    slabSpacingRelationValue === "EA_EQ_EB";

  const showSlabDualSpacingInputs =
    slabSurfaceTotalMode &&
    slabEffectiveSpacingModeValue === "ESPACEMENT" &&
    (slabSharedActive || slabDualActive) &&
    slabSpacingRelationValue === "EA_NE_EB";

  const showSlabSharedNbCadreInput =
    slabSurfaceTotalMode &&
    slabEffectiveSpacingModeValue === "NB_CADRE" &&
    slabSharedActive;

  const showSlabDualNbCadreInputs =
    slabSurfaceTotalMode &&
    slabEffectiveSpacingModeValue === "NB_CADRE" &&
    slabDualActive;

  const showSlabModeAndSharedNbBarRow =
    showSlabSpacingMode &&
    slabEffectiveSpacingModeValue === "NB_CADRE" &&
    slabSharedActive;

  const showSlabModeAndDualNbBarRow =
    showSlabSpacingMode &&
    slabEffectiveSpacingModeValue === "NB_CADRE" &&
    slabDualActive;

  const showSlabModeRelationAndSharedSpacingRow =
    showSlabSpacingMode &&
    showSlabSpacingRelationToggle &&
    showSlabSharedSpacingInput;

  const showSlabModeRelationAndDualSpacingRow =
    showSlabSpacingMode &&
    showSlabSpacingRelationToggle &&
    showSlabDualSpacingInputs;

  const hideEarlySlabDualCountFieldsForDallePleine =
    isDallePleine && slabDualActive;

  const showSlabCombinedLengthAnchorDiaRow =
    showSlabCombinedLengthRow && showSlabSharedDiaAndCount;

  const showSlabCombinedLengthAnchorDualDiaRow =
    showSlabCombinedLengthRow && showSlabDualDiaAndCount;

  const showSlabSeparateLengthAnchorSharedDiaRow =
    showSlabSeparateLengthRow && showSlabSharedDiaAndCount;

  const showSlabSeparateLengthAnchorDualDiaRow =
    showSlabSeparateLengthRow && showSlabDualDiaAndCount;

  const slabDiametreAValue =
    (x.slabDiametreAMm ?? x.diametreMm ?? fallbackDiametreValue) as number;

  const slabDiametreBValue =
    (x.slabDiametreBMm ?? x.diametreMm ?? fallbackDiametreValue) as number;

  return {
    slabNappeShown,
    slabCalcMethodValue,
    slabRelationValue,
    slabSpacingModeValue,
    slabSpacingRelationValue,
    slabEqualSharedActive,
    slabEqualDualActive,
    slabDiffSharedActive,
    slabDiffDualActive,
    slabDualActive,
    slabSharedActive,
    slabSurfaceTotalMode,
    slabSurfacePerM2Mode,
    slabEffectiveSpacingModeValue,
    showSlabCombinedLengthRow,
    showSlabSeparateLengthRow,
    showSlabSharedDiaAndCount,
    showSlabDualDiaAndCount,
    showSlabSpacingMode,
    showSlabSpacingRelationToggle,
    showSlabSharedSpacingInput,
    showSlabDualSpacingInputs,
    showSlabSharedNbCadreInput,
    showSlabDualNbCadreInputs,
    showSlabModeAndSharedNbBarRow,
    showSlabModeAndDualNbBarRow,
    showSlabModeRelationAndSharedSpacingRow,
    showSlabModeRelationAndDualSpacingRow,
    hideEarlySlabDualCountFieldsForDallePleine,
    showSlabCombinedLengthAnchorDiaRow,
    showSlabCombinedLengthAnchorDualDiaRow,
    showSlabSeparateLengthAnchorSharedDiaRow,
    showSlabSeparateLengthAnchorDualDiaRow,
    slabDiametreAValue,
    slabDiametreBValue,
  };
}
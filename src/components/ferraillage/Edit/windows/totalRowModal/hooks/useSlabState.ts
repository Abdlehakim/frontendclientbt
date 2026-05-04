import type { FormeState } from "../types";
import { SLAB_NAPPES, type SlabNappe } from "../config/formeBarreOptions";
import { normalizeSlabSurfacePerM2Relation } from "../state/guards";

function isSlabNappe(value: string): value is SlabNappe {
  return (SLAB_NAPPES as readonly string[]).includes(value);
}

export function useSlabState({
  isSlab,
  isSlabSurfacePerM2SpacingDesignation,
  x,
  fallbackDiametreValue,
}: {
  isSlab: boolean;
  isSlabSurfacePerM2SpacingDesignation: boolean;
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

  const isSlabSurfacePerM2SpacingMode =
    isSlabSurfacePerM2SpacingDesignation && slabCalcMethodValue === "SURFACE_TOTAL_PER_M2";

  const slabRelationValue = (
    isSlabSurfacePerM2SpacingMode
      ? normalizeSlabSurfacePerM2Relation(x.slabRelation)
      : (x.slabRelation ?? "ab_equal_same_if")
  ) as
    | "ab_equal_same_if"
    | "ab_equal_diff_if"
    | "ab_diff_same_if"
    | "ab_diff_diff_if";

  const slabSpacingModeValue = (
    isSlabSurfacePerM2SpacingMode ? "ESPACEMENT" : x.slabSpacingMode ?? "ESPACEMENT"
  ) as
    | "ESPACEMENT"
    | "NB_CADRE";

  const slabSpacingRelationValue = (x.slabSpacingRelation ?? "EA_EQ_EB") as
    | "EA_EQ_EB"
    | "EA_NE_EB";

  const slabEqualSharedActive = isSlab && slabRelationValue === "ab_equal_same_if";
  const slabEqualDualActive = isSlab && slabRelationValue === "ab_equal_diff_if";
  const slabDiffSharedActive =
    isSlab && !isSlabSurfacePerM2SpacingMode && slabRelationValue === "ab_diff_same_if";
  const slabDiffDualActive =
    isSlab && !isSlabSurfacePerM2SpacingMode && slabRelationValue === "ab_diff_diff_if";

  const slabDualActive = slabEqualDualActive || slabDiffDualActive;
  const slabSharedActive = slabEqualSharedActive || slabDiffSharedActive;

  const slabSurfaceTotalMode =
    isSlab &&
    (slabCalcMethodValue === "SURFACE_TOTAL" || slabCalcMethodValue === "SURFACE_TOTAL_PER_M2");

  const slabSurfacePerM2Mode = isSlab && slabCalcMethodValue === "SURFACE_TOTAL_PER_M2";
  const slabEffectiveSpacingModeValue = isSlabSurfacePerM2SpacingMode
    ? "ESPACEMENT"
    : slabSurfacePerM2Mode
      ? "NB_CADRE"
      : slabSpacingModeValue;

  const showSlabCombinedLengthRow =
    !isSlabSurfacePerM2SpacingMode &&
    slabSurfaceTotalMode &&
    (slabEqualSharedActive || slabEqualDualActive);
  const showSlabSeparateLengthRow =
    !isSlabSurfacePerM2SpacingMode &&
    slabSurfaceTotalMode &&
    (slabDiffSharedActive || slabDiffDualActive);

  const showSlabSharedDiaAndCount = isSlab && (slabEqualSharedActive || slabDiffSharedActive);
  const showSlabDualDiaAndCount = isSlab && (slabEqualDualActive || slabDiffDualActive);

  const showSlabSpacingMode =
    slabSurfaceTotalMode && (!slabSurfacePerM2Mode || isSlabSurfacePerM2SpacingMode);
  const showSlabRelationField =
    slabSurfaceTotalMode && (!slabSurfacePerM2Mode || isSlabSurfacePerM2SpacingMode);

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
    !isSlabSurfacePerM2SpacingMode &&
    slabSurfaceTotalMode &&
    slabEffectiveSpacingModeValue === "NB_CADRE" &&
    slabSharedActive;

  const showSlabDualNbCadreInputs =
    !isSlabSurfacePerM2SpacingMode &&
    slabSurfaceTotalMode &&
    slabEffectiveSpacingModeValue === "NB_CADRE" &&
    slabDualActive;

  const showSlabModeAndSharedNbBarRow =
    !isSlabSurfacePerM2SpacingMode &&
    showSlabSpacingMode &&
    slabEffectiveSpacingModeValue === "NB_CADRE" &&
    slabSharedActive;

  const showSlabModeAndDualNbBarRow =
    !isSlabSurfacePerM2SpacingMode &&
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

  const hideEarlySlabCountFieldsForSurfacePerM2 = isSlabSurfacePerM2SpacingMode;

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
    isSlabSurfacePerM2SpacingMode,
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
    showSlabRelationField,
    showSlabSpacingRelationToggle,
    showSlabSharedSpacingInput,
    showSlabDualSpacingInputs,
    showSlabSharedNbCadreInput,
    showSlabDualNbCadreInputs,
    showSlabModeAndSharedNbBarRow,
    showSlabModeAndDualNbBarRow,
    showSlabModeRelationAndSharedSpacingRow,
    showSlabModeRelationAndDualSpacingRow,
    hideEarlySlabCountFieldsForSurfacePerM2,
    showSlabCombinedLengthAnchorDiaRow,
    showSlabCombinedLengthAnchorDualDiaRow,
    showSlabSeparateLengthAnchorSharedDiaRow,
    showSlabSeparateLengthAnchorDualDiaRow,
    slabDiametreAValue,
    slabDiametreBValue,
  };
}

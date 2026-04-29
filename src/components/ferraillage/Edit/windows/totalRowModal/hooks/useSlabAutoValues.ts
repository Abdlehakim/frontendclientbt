import { useSlabAuto } from "./useSlabAuto";
import { computeCombinedLinearMetricStr } from "../calculations/slabCalculations";
import type { FormeState } from "../types";

type FormeStateWithSlabExtras = FormeState & {
  slabPerimetreStr?: string;
  slabAncrageLineaireStr?: string;
};

export function useSlabAutoValues({
  x,
  nbStr,
  isSlab,
  slabDiffSharedActive,
  slabDiffDualActive,
  showSlabSharedSpacingInput,
  showSlabDualSpacingInputs,
  showSlabModeAndSharedNbBarRow,
  showSlabSharedNbCadreInput,
  showSlabModeAndDualNbBarRow,
  showSlabDualNbCadreInputs,
  slabSurfacePerM2Mode,
  slabEffectiveSpacingModeValue,
}: {
  x: FormeState;
  nbStr: string;
  isSlab: boolean;
  slabDiffSharedActive: boolean;
  slabDiffDualActive: boolean;
  showSlabSharedSpacingInput: boolean;
  showSlabDualSpacingInputs: boolean;
  showSlabModeAndSharedNbBarRow: boolean;
  showSlabSharedNbCadreInput: boolean;
  showSlabModeAndDualNbBarRow: boolean;
  showSlabDualNbCadreInputs: boolean;
  slabSurfacePerM2Mode: boolean;
  slabEffectiveSpacingModeValue: "ESPACEMENT" | "NB_CADRE";
}) {
  const slabPerimetreStr = (x as FormeStateWithSlabExtras).slabPerimetreStr ?? "0";
  const slabAncrageLineaireStr =
    (x as FormeStateWithSlabExtras).slabAncrageLineaireStr ?? "0";

  const slabEffectiveLinearMetricStr = slabSurfacePerM2Mode
    ? computeCombinedLinearMetricStr(slabPerimetreStr, slabAncrageLineaireStr)
    : (x.ancrageStr ?? "0");

  const auto = useSlabAuto({
    isSlab,
    nbStr,
    x,
    showSlabSharedSpacingInput,
    showSlabDualSpacingInputs,
    showSlabSharedNbCadreInput,
    showSlabDualNbCadreInputs,
    showSlabModeAndSharedNbBarRow,
    showSlabModeAndDualNbBarRow,
    slabDiffSharedActive,
    slabDiffDualActive,
    slabEffectiveSpacingModeValue,
    slabEffectiveLinearMetricStr,
  });

  return {
    slabPerimetreStr,
    slabAncrageLineaireStr,
    slabEffectiveLinearMetricStr,
    auto,
  };
}

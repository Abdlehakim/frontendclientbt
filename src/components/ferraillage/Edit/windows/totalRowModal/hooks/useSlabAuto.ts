import { useMemo } from "react";
import {
  SLAB_COMMERCIAL_BAR_LENGTH_M,
  computeCommercialBarCount,
  computeSlabSurfacePerM2SpacingMetrics,
  computeSlabDiffSharedDualSpacingNT,
  computeSlabDiffSharedDualSpacingQte,
  computeSlabDiffSharedSpacingNT,
  computeSlabDiffSharedSpacingQte,
  computeSlabCrossSpacingParts,
  computeSlabSharedSpacingNT,
  computeSlabSharedSpacingQte,
  computeSlabDualSpacingNT,
  computeSlabDualSpacingQte,
  computeSlabQuantityFromSharedCount,
  computeSlabQuantityFromSharedCountWithAverageLength,
  computeSlabQuantityFromSplitCounts,
} from "../calculations/slabCalculations";

import type { FormeState } from "../types";

export function useSlabAuto({
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
  isSlabSurfacePerM2SpacingMode,
  slabEffectiveSpacingModeValue,
  slabEffectiveLinearMetricStr,
}: {
  isSlab: boolean;
  nbStr: string;
  x: FormeState;

  showSlabSharedSpacingInput: boolean;
  showSlabDualSpacingInputs: boolean;

  showSlabSharedNbCadreInput: boolean;
  showSlabDualNbCadreInputs: boolean;

  showSlabModeAndSharedNbBarRow: boolean;
  showSlabModeAndDualNbBarRow: boolean;

  slabDiffSharedActive: boolean;
  slabDiffDualActive: boolean;
  isSlabSurfacePerM2SpacingMode: boolean;

  slabEffectiveSpacingModeValue: "ESPACEMENT" | "NB_CADRE";
  slabEffectiveLinearMetricStr: string;
}) {
  const dallePleinePerM2SpacingMetrics = useMemo(() => {
    if (!isSlab || !isSlabSurfacePerM2SpacingMode) return null;

    return computeSlabSurfacePerM2SpacingMetrics({
      surfaceStr: x.slabSurfaceStr ?? "0",
      perimetreStr: x.slabPerimetreStr ?? "0",
      ancrageLineaireStr: x.slabAncrageLineaireStr ?? "0",
      spacingRelation: x.slabSpacingRelation,
      spacingAStr: x.slabEspacementAStr ?? "0",
      spacingBStr: x.slabEspacementBStr ?? "0",
    });
  }, [
    isSlab,
    isSlabSurfacePerM2SpacingMode,
    x.slabSurfaceStr,
    x.slabPerimetreStr,
    x.slabAncrageLineaireStr,
    x.slabSpacingRelation,
    x.slabEspacementAStr,
    x.slabEspacementBStr,
  ]);

  // =========================
  // NT (number of bars)
  // =========================
  const nt = useMemo(() => {
    if (!isSlab) return 0;
    if (isSlabSurfacePerM2SpacingMode) {
      const totalQtyM = (dallePleinePerM2SpacingMetrics?.qtyM ?? 0) * (Number(nbStr) || 0);
      return computeCommercialBarCount(totalQtyM, SLAB_COMMERCIAL_BAR_LENGTH_M);
    }

    // ===== ESPACEMENT =====
    if (slabEffectiveSpacingModeValue === "ESPACEMENT") {
      if (showSlabSharedSpacingInput) {
        if (slabDiffDualActive) {
          return computeSlabCrossSpacingParts(
            nbStr,
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
            x.slabEspacementAStr ?? "0",
            "0",
          ).ntTotal;
        }

        if (slabDiffSharedActive) {
          return computeSlabDiffSharedSpacingNT(
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
          ) * (Number(nbStr) || 0);
        }

        return computeSlabSharedSpacingNT(
          nbStr,
          x.slabLongueurAStr ?? "0",
          x.slabEspacementAStr ?? "0",
        );
      }

      if (showSlabDualSpacingInputs) {
        if (slabDiffDualActive) {
          return computeSlabCrossSpacingParts(
            nbStr,
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
            x.slabEspacementBStr ?? "0",
            "0",
          ).ntTotal;
        }

        if (slabDiffSharedActive) {
          return computeSlabDiffSharedDualSpacingNT(
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
            x.slabEspacementBStr ?? "0",
          ) * (Number(nbStr) || 0);
        }

        return computeSlabDualSpacingNT(
          nbStr,
          x.slabLongueurAStr ?? "0",
          x.slabLongueurBStr ?? "0",
          x.slabEspacementAStr ?? "0",
          x.slabEspacementBStr ?? "0",
        );
      }
    }

    // ===== NB BARRES =====
    if (slabEffectiveSpacingModeValue === "NB_CADRE") {
      if (showSlabSharedNbCadreInput || showSlabModeAndSharedNbBarRow) {
        const count = Number(x.slabNbCadreAStr ?? "0") || 0;
        return count * (Number(nbStr) || 0);
      }

      if (showSlabDualNbCadreInputs || showSlabModeAndDualNbBarRow) {
        const countA = Number(x.slabNbCadreAStr ?? "0") || 0;
        const countB = Number(x.slabNbCadreBStr ?? "0") || 0;
        return (countA + countB) * (Number(nbStr) || 0);
      }
    }

    return 0;
  }, [
    isSlab,
    isSlabSurfacePerM2SpacingMode,
    dallePleinePerM2SpacingMetrics,
    nbStr,
    slabEffectiveSpacingModeValue,
    showSlabSharedSpacingInput,
    showSlabDualSpacingInputs,
    showSlabSharedNbCadreInput,
    showSlabDualNbCadreInputs,
    showSlabModeAndSharedNbBarRow,
    showSlabModeAndDualNbBarRow,
    slabDiffSharedActive,
    slabDiffDualActive,
    x,
  ]);

  // =========================
  // QTE (quantity)
  // =========================
  const qte = useMemo(() => {
    if (!isSlab) return 0;
    if (isSlabSurfacePerM2SpacingMode) {
      return (dallePleinePerM2SpacingMetrics?.qtyM ?? 0) * (Number(nbStr) || 0);
    }

    // ===== ESPACEMENT =====
    if (slabEffectiveSpacingModeValue === "ESPACEMENT") {
      if (showSlabSharedSpacingInput) {
        if (slabDiffDualActive) {
          return computeSlabCrossSpacingParts(
            nbStr,
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
            x.slabEspacementAStr ?? "0",
            slabEffectiveLinearMetricStr,
          ).qteTotal;
        }

        if (slabDiffSharedActive) {
          return computeSlabDiffSharedSpacingQte(
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
            slabEffectiveLinearMetricStr,
          ) * (Number(nbStr) || 0);
        }

        return computeSlabSharedSpacingQte(
          nbStr,
          x.slabLongueurAStr ?? "0",
          x.slabEspacementAStr ?? "0",
          slabEffectiveLinearMetricStr,
        );
      }

      if (showSlabDualSpacingInputs) {
        if (slabDiffDualActive) {
          return computeSlabCrossSpacingParts(
            nbStr,
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
            x.slabEspacementBStr ?? "0",
            slabEffectiveLinearMetricStr,
          ).qteTotal;
        }

        if (slabDiffSharedActive) {
          return computeSlabDiffSharedDualSpacingQte(
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.slabEspacementAStr ?? "0",
            x.slabEspacementBStr ?? "0",
            slabEffectiveLinearMetricStr,
          ) * (Number(nbStr) || 0);
        }

        return computeSlabDualSpacingQte(
          nbStr,
          x.slabLongueurAStr ?? "0",
          x.slabLongueurBStr ?? "0",
          x.slabEspacementAStr ?? "0",
          x.slabEspacementBStr ?? "0",
          slabEffectiveLinearMetricStr,
        );
      }
    }

    // ===== NB BARRES =====
    if (slabEffectiveSpacingModeValue === "NB_CADRE") {
      if (showSlabSharedNbCadreInput || showSlabModeAndSharedNbBarRow) {
        const count = Number(x.slabNbCadreAStr ?? "0") || 0;

        if (slabDiffSharedActive) {
          return computeSlabQuantityFromSharedCountWithAverageLength(
            nbStr,
            count,
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            slabEffectiveLinearMetricStr,
          );
        }

        return computeSlabQuantityFromSharedCount(
          nbStr,
          count,
          x.slabLongueurAStr ?? "0",
          slabEffectiveLinearMetricStr,
        );
      }

      if (showSlabDualNbCadreInputs || showSlabModeAndDualNbBarRow) {
        const countA = Number(x.slabNbCadreAStr ?? "0") || 0;
        const countB = Number(x.slabNbCadreBStr ?? "0") || 0;

        return computeSlabQuantityFromSplitCounts(
          nbStr,
          countA,
          countB,
          x.slabLongueurAStr ?? "0",
          x.slabLongueurBStr ?? "0",
          slabEffectiveLinearMetricStr,
        );
      }
    }

    return 0;
  }, [
    isSlab,
    isSlabSurfacePerM2SpacingMode,
    dallePleinePerM2SpacingMetrics,
    nbStr,
    slabEffectiveSpacingModeValue,
    showSlabSharedSpacingInput,
    showSlabDualSpacingInputs,
    showSlabSharedNbCadreInput,
    showSlabDualNbCadreInputs,
    showSlabModeAndSharedNbBarRow,
    showSlabModeAndDualNbBarRow,
    slabDiffSharedActive,
    slabDiffDualActive,
    slabEffectiveLinearMetricStr,
    x,
  ]);

  return { qte, nt };
}

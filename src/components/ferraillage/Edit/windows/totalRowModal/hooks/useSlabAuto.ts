import { useMemo } from "react";
import {
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

  slabEffectiveSpacingModeValue: "ESPACEMENT" | "NB_CADRE";
  slabEffectiveLinearMetricStr: string;
}) {
  // =========================
  // NT (number of bars)
  // =========================
  const nt = useMemo(() => {
    if (!isSlab) return 0;

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

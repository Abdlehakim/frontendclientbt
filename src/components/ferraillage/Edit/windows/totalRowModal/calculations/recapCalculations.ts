import type { SlabCalcMethod, SlabRelation, SlabSpacingMode, SlabSpacingRelation } from "../types";
import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";
import { normalizeSlabSpacingRelationValue } from "../state/guards";
import {
  computeSlabCrossSpacingParts,
  computeSlabDiffSharedSpacingNTA,
  computeSlabDiffSharedSpacingNTB,
  computeSlabDualSpacingNT,
  computeSlabDualSpacingQte,
  computeSlabQuantityFromSharedCount,
  computeSlabSharedSpacingNT,
  computeSlabSharedSpacingQte,
} from "./slabCalculations";

export function computeSlabQte(calcMethod: SlabCalcMethod, surfaceStr: string, qtePerM2Str: string) {
  const surface = parseNonNegativeNumber(surfaceStr);
  const qtePerM2 = parseNonNegativeNumber(qtePerM2Str);

  const hasAny = surface != null || qtePerM2 != null;
  if (!hasAny) return 0;

  if (calcMethod === "SURFACE_TOTAL_PER_M2") {
    return (surface ?? 0) * (qtePerM2 ?? 0);
  }

  return surface ?? 0;
}

export function computeSpecialSlabSpacingRecapMetrics(params: {
  nbStr: string;
  longueurBarreStr: string;
  ancrageStr: string;
  spacingMode: SlabSpacingMode;
  spacingRelation: SlabSpacingRelation;
  calcMethod: SlabCalcMethod;
  relation: SlabRelation;
  spacingAStr: string;
  spacingBStr: string;
  countStr?: string;
}) {
  const {
    nbStr,
    longueurBarreStr,
    ancrageStr,
    spacingMode,
    spacingRelation,
    calcMethod,
    relation,
    spacingAStr,
    spacingBStr,
    countStr = "0",
  } = params;

  const isSurfaceTotal = calcMethod === "SURFACE_TOTAL";
  const isEqualShared = relation === "ab_equal_same_if";
  const normalizedSpacingRelation = normalizeSlabSpacingRelationValue(spacingRelation);

  if (!isSurfaceTotal || !isEqualShared) {
    return null;
  }

  if (spacingMode === "NB_CADRE") {
    const count = parseNonNegativeInt(countStr) ?? 0;
    const nt = count * (parseNonNegativeInt(nbStr) ?? 0);
    const qtyM = computeSlabQuantityFromSharedCount(
      nbStr,
      count,
      longueurBarreStr,
      ancrageStr,
    );

    return { nt, qtyM };
  }

  if (spacingMode !== "ESPACEMENT") {
    return null;
  }

  if (normalizedSpacingRelation === "EA_EQ_EB") {
    const nt = computeSlabSharedSpacingNT(nbStr, longueurBarreStr, spacingAStr);
    const qtyM = computeSlabSharedSpacingQte(nbStr, longueurBarreStr, spacingAStr, ancrageStr);
    return { nt, qtyM };
  }

  if (normalizedSpacingRelation === "EA_NE_EB") {
    const nt = computeSlabDualSpacingNT(
      nbStr,
      longueurBarreStr,
      longueurBarreStr,
      spacingAStr,
      spacingBStr,
    );
    const qtyM = computeSlabDualSpacingQte(
      nbStr,
      longueurBarreStr,
      longueurBarreStr,
      spacingAStr,
      spacingBStr,
      ancrageStr,
    );
    return { nt, qtyM };
  }

  return null;
}

export function computeDiffSharedSlabSpacingRecapMetrics(params: {
  nbStr: string;
  longueurAStr: string;
  longueurBStr: string;
  ancrageStr: string;
  spacingMode: SlabSpacingMode;
  spacingRelation: SlabSpacingRelation;
  calcMethod: SlabCalcMethod;
  relation: SlabRelation;
  spacingAStr: string;
  spacingBStr: string;
}) {
  const {
    nbStr,
    longueurAStr,
    longueurBStr,
    ancrageStr,
    spacingMode,
    spacingRelation,
    calcMethod,
    relation,
    spacingAStr,
    spacingBStr,
  } = params;

  const isSurfaceTotal = calcMethod === "SURFACE_TOTAL";
  const isDiffShared = relation === "ab_diff_same_if";
  const normalizedSpacingRelation = normalizeSlabSpacingRelationValue(spacingRelation);

  if (
    !isSurfaceTotal ||
    !isDiffShared ||
    spacingMode !== "ESPACEMENT"
  ) {
    return null;
  }

  const ntBSpacingStr = normalizedSpacingRelation === "EA_NE_EB" ? spacingBStr : spacingAStr;
  const nb = parseNonNegativeInt(nbStr) ?? 0;
  const rawNtA = computeSlabDiffSharedSpacingNTA(longueurAStr, spacingAStr) * nb;
  const rawNtB = computeSlabDiffSharedSpacingNTB(longueurBStr, ntBSpacingStr) * nb;
  const longueurA = parseNonNegativeNumber(longueurAStr) ?? 0;
  const longueurB = parseNonNegativeNumber(longueurBStr) ?? 0;
  const ancrage = parseNonNegativeNumber(ancrageStr) ?? 0;
  const rawCutLenA = longueurB + ancrage;
  const rawCutLenB = longueurA + ancrage;
  const rawQtyA = rawNtA * rawCutLenA;
  const rawQtyB = rawNtB * rawCutLenB;
  const ntA = rawNtB;
  const ntB = rawNtA;
  const cutLenA = rawCutLenB;
  const cutLenB = rawCutLenA;
  const qtyA = rawQtyB;
  const qtyB = rawQtyA;

  return {
    ntA,
    ntB,
    qtyA,
    qtyB,
    qtyM: qtyA + qtyB,
    cutLenA,
    cutLenB,
  };
}

export function computeDiffDualSlabSpacingRecapMetrics(params: {
  nbStr: string;
  longueurAStr: string;
  longueurBStr: string;
  ancrageStr: string;
  spacingMode: SlabSpacingMode;
  spacingRelation: SlabSpacingRelation;
  calcMethod: SlabCalcMethod;
  relation: SlabRelation;
  spacingAStr: string;
  spacingBStr: string;
}) {
  const {
    nbStr,
    longueurAStr,
    longueurBStr,
    ancrageStr,
    spacingMode,
    spacingRelation,
    calcMethod,
    relation,
    spacingAStr,
    spacingBStr,
  } = params;

  const isSurfaceTotal = calcMethod === "SURFACE_TOTAL";
  const isDiffDual = relation === "ab_diff_diff_if";
  const normalizedSpacingRelation = normalizeSlabSpacingRelationValue(spacingRelation);

  if (!isSurfaceTotal || !isDiffDual || spacingMode !== "ESPACEMENT") {
    return null;
  }

  const effectiveSpacingBStr = normalizedSpacingRelation === "EA_NE_EB" ? spacingBStr : spacingAStr;

  return computeSlabCrossSpacingParts(
    nbStr,
    longueurAStr,
    longueurBStr,
    spacingAStr,
    effectiveSpacingBStr,
    ancrageStr,
  );
}

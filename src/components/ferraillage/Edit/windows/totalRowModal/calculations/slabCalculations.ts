import type { SlabSpacingRelation } from "../types";
import { safeDivide, safeNumber } from "../utils";

type SlabSurfacePerM2SpacingInput = {
  surfaceStr: string;
  perimetreStr: string;
  ancrageLineaireStr: string;
  spacingRelation: SlabSpacingRelation;
  spacingAStr: string;
  spacingBStr: string;
};

type SlabSurfacePerM2SplitInput = {
  qA: number;
  qB: number;
  ancrageM: number;
  multiplier: number;
  commercialBarLengthM: number;
};

export function computeSlabSurfacePerM2SpacingMetrics({
  surfaceStr,
  perimetreStr,
  ancrageLineaireStr,
  spacingRelation,
  spacingAStr,
  spacingBStr,
}: SlabSurfacePerM2SpacingInput) {
  const surface = Math.max(0, safeNumber(surfaceStr));
  const perimetre = Math.max(0, safeNumber(perimetreStr));
  const ancrageM = Math.max(0, safeNumber(ancrageLineaireStr));
  const spacingA = Math.max(0, safeNumber(spacingAStr));
  const spacingB = spacingRelation === "EA_NE_EB" ? Math.max(0, safeNumber(spacingBStr)) : spacingA;

  const qA = spacingA > 0 ? safeNumber(safeDivide(surface, spacingA)) : 0;
  const qB = spacingB > 0 ? safeNumber(safeDivide(surface, spacingB)) : 0;
  const baseQtyM = safeNumber(qA + qB);

  // Spread the linear anchorage allowance across the calculated runs so split and aggregate totals stay aligned.
  const anchorageQtyM = safeNumber(perimetre * ancrageM);
  const extraCutLenM = baseQtyM > 0 ? safeDivide(anchorageQtyM, baseQtyM) : 0;
  const cutLenM = baseQtyM > 0 ? safeNumber(1 + extraCutLenM) : 0;
  const qtyM = baseQtyM > 0 ? safeNumber(baseQtyM * cutLenM) : 0;

  return {
    qA,
    qB,
    ancrageM,
    cutLenM,
    qtyM,
  };
}

export function computeSlabSurfacePerM2SplitMetrics({
  qA,
  qB,
  ancrageM,
  multiplier,
  commercialBarLengthM,
}: SlabSurfacePerM2SplitInput) {
  const effectiveMultiplier = Math.max(0, safeNumber(multiplier));
  const effectiveCutLenM =
    safeNumber(commercialBarLengthM) > 0
      ? safeNumber(commercialBarLengthM)
      : safeNumber(1 + Math.max(0, safeNumber(ancrageM)));

  const qtyA = safeNumber(effectiveMultiplier * Math.max(0, safeNumber(qA)) * effectiveCutLenM);
  const qtyB = safeNumber(effectiveMultiplier * Math.max(0, safeNumber(qB)) * effectiveCutLenM);

  return {
    qtyA,
    qtyB,
    qtyTotal: safeNumber(qtyA + qtyB),
  };
}

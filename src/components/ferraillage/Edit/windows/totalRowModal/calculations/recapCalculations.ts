import type { SlabCalcMethod, SlabRelation, SlabSpacingMode, SlabSpacingRelation } from "../types";
import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";
import { normalizeSlabSpacingRelationValue } from "../state/guards";

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

function computeSlabSharedSpacingNT(
  nbStr: string,
  longueurBarreStr: string,
  spacingStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const L = parseNonNegativeNumber(longueurBarreStr);
  const ES = parseNonNegativeNumber(spacingStr);

  const hasAny = NB != null || L != null || ES != null;
  if (!hasAny) return 0;

  const nb = NB ?? 0;
  const longueur = L ?? 0;
  const espacement = ES ?? 0;

  if (longueur <= 0 || espacement <= 0) return 0;
  return nb * ((longueur / espacement) * 2);
}

function computeSlabSharedSpacingQte(
  nbStr: string,
  longueurBarreStr: string,
  spacingStr: string,
  ancrageStr: string,
) {
  const nt = computeSlabSharedSpacingNT(nbStr, longueurBarreStr, spacingStr);
  const longueur = parseNonNegativeNumber(longueurBarreStr) ?? 0;
  const ancrage = parseNonNegativeNumber(ancrageStr) ?? 0;

  if (nt <= 0 && longueur <= 0 && ancrage <= 0) return 0;
  return nt * (longueur + ancrage);
}

function computeSlabDualSpacingNT(
  nbStr: string,
  longueurBarreStr: string,
  spacingAStr: string,
  spacingBStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const L = parseNonNegativeNumber(longueurBarreStr);
  const ESA = parseNonNegativeNumber(spacingAStr);
  const ESB = parseNonNegativeNumber(spacingBStr);

  const hasAny = NB != null || L != null || ESA != null || ESB != null;
  if (!hasAny) return 0;

  const nb = NB ?? 0;
  const longueur = L ?? 0;
  const espacementA = ESA ?? 0;
  const espacementB = ESB ?? 0;

  if (longueur <= 0) return 0;

  const partA = espacementA > 0 ? longueur / espacementA : 0;
  const partB = espacementB > 0 ? longueur / espacementB : 0;

  return nb * (partA + partB);
}

function computeSlabDualSpacingQte(
  nbStr: string,
  longueurBarreStr: string,
  spacingAStr: string,
  spacingBStr: string,
  ancrageStr: string,
) {
  const nt = computeSlabDualSpacingNT(nbStr, longueurBarreStr, spacingAStr, spacingBStr);
  const longueur = parseNonNegativeNumber(longueurBarreStr) ?? 0;
  const ancrage = parseNonNegativeNumber(ancrageStr) ?? 0;

  if (nt <= 0 && longueur <= 0 && ancrage <= 0) return 0;
  return nt * (longueur + ancrage);
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
  } = params;

  const isSurfaceTotal = calcMethod === "SURFACE_TOTAL";
  const isEqualShared = relation === "ab_equal_same_if";
  const normalizedSpacingRelation = normalizeSlabSpacingRelationValue(spacingRelation);

  if (!isSurfaceTotal || !isEqualShared || spacingMode !== "ESPACEMENT") {
    return null;
  }

  if (normalizedSpacingRelation === "EA_EQ_EB") {
    const nt = computeSlabSharedSpacingNT(nbStr, longueurBarreStr, spacingAStr);
    const qtyM = computeSlabSharedSpacingQte(nbStr, longueurBarreStr, spacingAStr, ancrageStr);
    return { nt, qtyM };
  }

  if (normalizedSpacingRelation === "EA_NE_EB") {
    const nt = computeSlabDualSpacingNT(nbStr, longueurBarreStr, spacingAStr, spacingBStr);
    const qtyM = computeSlabDualSpacingQte(nbStr, longueurBarreStr, spacingAStr, spacingBStr, ancrageStr);
    return { nt, qtyM };
  }

  return null;
}


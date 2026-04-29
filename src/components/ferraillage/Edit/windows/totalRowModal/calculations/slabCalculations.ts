import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";

export function computeSlabQteSurfaceTotal(surfaceStr: string) {
  return parseNonNegativeNumber(surfaceStr) ?? 0;
}

export function computeSlabCountFromSpacing(referenceLengthStr: string, spacingStr: string) {
  const referenceLength = parseNonNegativeNumber(referenceLengthStr);
  const spacing = parseNonNegativeNumber(spacingStr);

  if (referenceLength == null && spacing == null) return 0;

  const length = referenceLength ?? 0;
  const step = spacing ?? 0;
  if (length <= 0 || step <= 0) return 0;

  return Math.round(length / step);
}

export function computeSlabSharedSpacingNT(
  nbStr: string,
  longueurBarreStr: string,
  spacingStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const L = parseNonNegativeNumber(longueurBarreStr);
  const ES = parseNonNegativeNumber(spacingStr);

  if (NB == null && L == null && ES == null) return 0;

  const nb = NB ?? 0;
  const longueur = L ?? 0;
  const espacement = ES ?? 0;

  if (longueur <= 0 || espacement <= 0) return 0;
  return nb * Math.round((longueur / espacement) * 2);
}

export function computeSlabSharedSpacingQte(
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

function computeSlabDiffSharedSpacingNTPart(lengthStr: string, spacingStr: string) {
  const L = parseNonNegativeNumber(lengthStr);
  const ES = parseNonNegativeNumber(spacingStr);

  if (L == null && ES == null) return 0;

  const longueur = L ?? 0;
  const espacement = ES ?? 0;

  if (longueur <= 0 || espacement <= 0) return 0;
  return longueur / espacement;
}

export function computeSlabDiffSharedSpacingNTA(longueurAStr: string, spacingStr: string) {
  return computeSlabDiffSharedSpacingNTPart(longueurAStr, spacingStr);
}

export function computeSlabDiffSharedSpacingNTB(longueurBStr: string, spacingStr: string) {
  return computeSlabDiffSharedSpacingNTPart(longueurBStr, spacingStr);
}

export function computeSlabDiffSharedSpacingNT(
  longueurAStr: string,
  longueurBStr: string,
  spacingStr: string,
) {
  return (
    computeSlabDiffSharedSpacingNTA(longueurAStr, spacingStr) +
    computeSlabDiffSharedSpacingNTB(longueurBStr, spacingStr)
  );
}

export function computeSlabDiffSharedSpacingQte(
  longueurAStr: string,
  longueurBStr: string,
  spacingStr: string,
  ancrageStr: string,
) {
  const ntA = computeSlabDiffSharedSpacingNTA(longueurAStr, spacingStr);
  const ntB = computeSlabDiffSharedSpacingNTB(longueurBStr, spacingStr);
  const longueurA = parseNonNegativeNumber(longueurAStr) ?? 0;
  const longueurB = parseNonNegativeNumber(longueurBStr) ?? 0;
  const ancrage = parseNonNegativeNumber(ancrageStr) ?? 0;

  if (ntA <= 0 && ntB <= 0 && longueurA <= 0 && longueurB <= 0 && ancrage <= 0) return 0;
  return ntA * (longueurB + ancrage) + ntB * (longueurA + ancrage);
}

export function computeSlabDiffSharedDualSpacingNT(
  longueurAStr: string,
  longueurBStr: string,
  spacingAStr: string,
  spacingBStr: string,
) {
  return (
    computeSlabDiffSharedSpacingNTA(longueurAStr, spacingAStr) +
    computeSlabDiffSharedSpacingNTB(longueurBStr, spacingBStr)
  );
}

export function computeSlabDiffSharedDualSpacingQte(
  longueurAStr: string,
  longueurBStr: string,
  spacingAStr: string,
  spacingBStr: string,
  ancrageStr: string,
) {
  const ntA = computeSlabDiffSharedSpacingNTA(longueurAStr, spacingAStr);
  const ntB = computeSlabDiffSharedSpacingNTB(longueurBStr, spacingBStr);
  const longueurA = parseNonNegativeNumber(longueurAStr) ?? 0;
  const longueurB = parseNonNegativeNumber(longueurBStr) ?? 0;
  const ancrage = parseNonNegativeNumber(ancrageStr) ?? 0;

  if (ntA <= 0 && ntB <= 0 && longueurA <= 0 && longueurB <= 0 && ancrage <= 0) return 0;
  return ntA * (longueurB + ancrage) + ntB * (longueurA + ancrage);
}

export function computeSlabCrossSpacingParts(
  nbStr: string,
  longueurAStr: string,
  longueurBStr: string,
  spacingAStr: string,
  spacingBStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const nb = NB ?? 0;
  const ntA = computeSlabDiffSharedSpacingNTA(longueurAStr, spacingAStr) * nb;
  const ntB = computeSlabDiffSharedSpacingNTB(longueurBStr, spacingBStr) * nb;
  const longueurA = parseNonNegativeNumber(longueurAStr) ?? 0;
  const longueurB = parseNonNegativeNumber(longueurBStr) ?? 0;
  const ancrage = parseNonNegativeNumber(ancrageStr) ?? 0;
  const cutLenA = longueurB + ancrage;
  const cutLenB = longueurA + ancrage;
  const qteA = ntA * cutLenA;
  const qteB = ntB * cutLenB;

  return {
    ntA,
    ntB,
    qteA,
    qteB,
    qteTotal: qteA + qteB,
    ntTotal: ntA + ntB,
    cutLenA,
    cutLenB,
  };
}

export function computeSlabDualSpacingNT(
  nbStr: string,
  longueurAStr: string,
  longueurBStr: string,
  spacingAStr: string,
  spacingBStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const LA = parseNonNegativeNumber(longueurAStr);
  const LB = parseNonNegativeNumber(longueurBStr);
  const ESA = parseNonNegativeNumber(spacingAStr);
  const ESB = parseNonNegativeNumber(spacingBStr);

  if (NB == null && LA == null && LB == null && ESA == null && ESB == null) return 0;

  const countA = (LA ?? 0) > 0 && (ESA ?? 0) > 0 ? Math.round((LA ?? 0) / (ESA ?? 0)) : 0;
  const countB = (LB ?? 0) > 0 && (ESB ?? 0) > 0 ? Math.round((LB ?? 0) / (ESB ?? 0)) : 0;

  return (NB ?? 0) * (countA + countB);
}

export function computeSlabDualSpacingQte(
  nbStr: string,
  longueurAStr: string,
  longueurBStr: string,
  spacingAStr: string,
  spacingBStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const LA = parseNonNegativeNumber(longueurAStr);
  const LB = parseNonNegativeNumber(longueurBStr);
  const ESA = parseNonNegativeNumber(spacingAStr);
  const ESB = parseNonNegativeNumber(spacingBStr);
  const AN = parseNonNegativeNumber(ancrageStr);

  if (NB == null && LA == null && LB == null && ESA == null && ESB == null && AN == null) return 0;

  const longueurA = LA ?? 0;
  const longueurB = LB ?? 0;
  const countA = longueurA > 0 && (ESA ?? 0) > 0 ? Math.round(longueurA / (ESA ?? 0)) : 0;
  const countB = longueurB > 0 && (ESB ?? 0) > 0 ? Math.round(longueurB / (ESB ?? 0)) : 0;

  return (NB ?? 0) * ((countA * (longueurA + (AN ?? 0))) + (countB * (longueurB + (AN ?? 0))));
}

export function computeSlabLengthWithAnchor(lengthStr: string, ancrageStr: string) {
  const length = parseNonNegativeNumber(lengthStr);
  const ancrage = parseNonNegativeNumber(ancrageStr);

  if (length == null && ancrage == null) return 0;
  return (length ?? 0) + (ancrage ?? 0);
}

export function computeCombinedLinearMetricStr(perimetreStr: string, ancrageLineaireStr: string) {
  const perimetre = parseNonNegativeNumber(perimetreStr);
  const ancrageLineaire = parseNonNegativeNumber(ancrageLineaireStr);

  if (perimetre == null && ancrageLineaire == null) return "0";
  return String((perimetre ?? 0) + (ancrageLineaire ?? 0)).replace(".", ",");
}

export function computeSlabQuantityFromSharedCount(
  nbStr: string,
  sharedCount: number,
  barLengthStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const lengthWithAnchor = computeSlabLengthWithAnchor(barLengthStr, ancrageStr);

  if (NB == null && sharedCount <= 0 && lengthWithAnchor <= 0) return 0;
  return (NB ?? 0) * sharedCount * lengthWithAnchor;
}

export function computeSlabQuantityFromSharedCountWithAverageLength(
  nbStr: string,
  sharedCount: number,
  longueurAStr: string,
  longueurBStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const lengthAWithAnchor = computeSlabLengthWithAnchor(longueurAStr, ancrageStr);
  const lengthBWithAnchor = computeSlabLengthWithAnchor(longueurBStr, ancrageStr);

  if (NB == null && sharedCount <= 0 && lengthAWithAnchor <= 0 && lengthBWithAnchor <= 0) return 0;

  const averageLength = (lengthAWithAnchor + lengthBWithAnchor) / 2;
  return (NB ?? 0) * sharedCount * averageLength;
}

export function computeSlabQuantityFromSplitCounts(
  nbStr: string,
  countA: number,
  countB: number,
  longueurAStr: string,
  longueurBStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const lengthAWithAnchor = computeSlabLengthWithAnchor(longueurAStr, ancrageStr);
  const lengthBWithAnchor = computeSlabLengthWithAnchor(longueurBStr, ancrageStr);

  if (NB == null && countA <= 0 && countB <= 0 && lengthAWithAnchor <= 0 && lengthBWithAnchor <= 0) return 0;

  return (NB ?? 0) * ((countA * lengthAWithAnchor) + (countB * lengthBWithAnchor));
}

export function computeSlabNTFromSharedCount(nbStr: string, sharedCount: number) {
  const NB = parseNonNegativeInt(nbStr);
  if (NB == null && sharedCount <= 0) return 0;
  return (NB ?? 0) * sharedCount;
}

export function computeSlabNTFromSplitCounts(nbStr: string, countA: number, countB: number) {
  const NB = parseNonNegativeInt(nbStr);
  if (NB == null && countA <= 0 && countB <= 0) return 0;
  return (NB ?? 0) * (countA + countB);
}

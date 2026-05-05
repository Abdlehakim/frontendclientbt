import { parseNonNegativeInt, parseNonNegativeNumber, safeDivide, safeNumber } from "../utils";
import { computeBarreNT, computeBarreQteLongueur } from "./barreCalculations";

export function computeSemelleQteEqualShared(
  nbStr: string,
  nBarreStr: string,
  longueurABStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);
  const L = parseNonNegativeNumber(longueurABStr);
  const AN = parseNonNegativeNumber(ancrageStr);

  if (NB == null && N == null && L == null && AN == null) return 0;
  return (NB ?? 0) * ((N ?? 0) * ((L ?? 0) + (AN ?? 0)));
}

export function computeSemelleQteEqualDual(
  nbStr: string,
  nBarreAStr: string,
  nBarreBStr: string,
  longueurABStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const NA = parseNonNegativeInt(nBarreAStr);
  const NBb = parseNonNegativeInt(nBarreBStr);
  const L = parseNonNegativeNumber(longueurABStr);
  const AN = parseNonNegativeNumber(ancrageStr);

  if (NB == null && NA == null && NBb == null && L == null && AN == null) return 0;
  return (NB ?? 0) * (((NA ?? 0) * ((L ?? 0) + (AN ?? 0))) + ((NBb ?? 0) * ((L ?? 0) + (AN ?? 0))));
}

export function computeSemelleQteDiffShared(
  nbStr: string,
  nBarreStr: string,
  longueurAStr: string,
  longueurBStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);
  const LA = parseNonNegativeNumber(longueurAStr);
  const LB = parseNonNegativeNumber(longueurBStr);
  const AN = parseNonNegativeNumber(ancrageStr);

  if (NB == null && N == null && LA == null && LB == null && AN == null) return 0;
  const longueurMoyenne = ((LA ?? 0) + (LB ?? 0)) / 2;
  return (NB ?? 0) * ((N ?? 0) * (longueurMoyenne + (AN ?? 0)));
}

export function computeSemelleQteDiffDual(
  nbStr: string,
  nBarreAStr: string,
  nBarreBStr: string,
  longueurAStr: string,
  longueurBStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const NA = parseNonNegativeInt(nBarreAStr);
  const NBb = parseNonNegativeInt(nBarreBStr);
  const LA = parseNonNegativeNumber(longueurAStr);
  const LB = parseNonNegativeNumber(longueurBStr);
  const AN = parseNonNegativeNumber(ancrageStr);

  if (NB == null && NA == null && NBb == null && LA == null && LB == null && AN == null) return 0;
  return (NB ?? 0) * (((NA ?? 0) * ((LA ?? 0) + (AN ?? 0))) + ((NBb ?? 0) * ((LB ?? 0) + (AN ?? 0))));
}

export function computeSemelleNTEqualShared(nbStr: string, nBarreStr: string) {
  return computeBarreNT(nbStr, nBarreStr);
}

export function computeSemelleNTSharedCount(nbStr: string, nBarreStr: string) {
  return computeBarreNT(nbStr, nBarreStr);
}

export function computeSemelleNTSharedSpacing(
  nbStr: string,
  longueurBarreStr: string,
  spacingAStr: string,
  _ancrageStr: string,
  spacingBStr?: string,
) {
  const nb = parseNonNegativeInt(nbStr);
  const longueur = parseNonNegativeNumber(longueurBarreStr);
  const spacingA = parseNonNegativeNumber(spacingAStr);
  const spacingB = spacingBStr == null ? null : parseNonNegativeNumber(spacingBStr);
  if (spacingBStr == null) {
    if (nb == null && longueur == null && spacingA == null) return 0;

    const safeNb = nb ?? 0;
    const safeLongueur = longueur ?? 0;
    const sharedSpacingCount = safeDivide(safeLongueur, spacingA ?? 0) * 2;

    return safeNumber(sharedSpacingCount * safeNb);
  }

  if (nb == null && longueur == null && spacingA == null && spacingB == null) return 0;

  const safeNb = nb ?? 0;
  const safeLongueur = longueur ?? 0;
  const totalSpacingValue =
    safeDivide(safeLongueur, spacingA ?? 0) +
    safeDivide(safeLongueur, spacingB ?? 0);

  return safeNumber(totalSpacingValue * safeNb);
}

export function computeSemelleNTDiffShared(nbStr: string, nBarreStr: string) {
  return computeBarreNT(nbStr, nBarreStr);
}

export function computeSemelleNTDual(nbStr: string, nBarreAStr: string, nBarreBStr: string) {
  const NB = parseNonNegativeInt(nbStr);
  const NA = parseNonNegativeInt(nBarreAStr);
  const NBb = parseNonNegativeInt(nBarreBStr);

  if (NB == null && NA == null && NBb == null) return 0;
  return (NB ?? 0) * ((NA ?? 0) + (NBb ?? 0));
}

export function computeSemelleDualA(
  nbStr: string,
  nBarreAStr: string,
  longueurAStr: string,
  ancrageStr: string,
  equalDual: boolean,
) {
  if (equalDual) {
    return computeSemelleQteEqualShared(nbStr, nBarreAStr, longueurAStr, ancrageStr);
  }
  return computeBarreQteLongueur(nbStr, nBarreAStr, longueurAStr, ancrageStr);
}

export function computeSemelleDualB(
  nbStr: string,
  nBarreBStr: string,
  longueurAStr: string,
  longueurBStr: string,
  ancrageStr: string,
  equalDual: boolean,
) {
  if (equalDual) {
    return computeSemelleQteEqualShared(nbStr, nBarreBStr, longueurAStr, ancrageStr);
  }
  return computeBarreQteLongueur(nbStr, nBarreBStr, longueurBStr, ancrageStr);
}

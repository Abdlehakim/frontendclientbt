import type { ExtraBoxKind, FormeKind } from "../types";
import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";

export function computeExtraPerimetre(kind: ExtraBoxKind, longueurStr: string, ancrageStr: string) {
  const L = parseNonNegativeNumber(longueurStr);
  const A = parseNonNegativeNumber(ancrageStr);
  if (L == null && A == null) return null;
  const l = L ?? 0;
  const a = A ?? 0;
  if (kind === "EPINGLE") return l + 2 * a;
  return 2 * l + 2 * a;
}

export function computeExtraSpacingNt(
  nbStr: string,
  hauteurStr: string,
  nbExtraParCadreStr: string,
  espacementStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const H = parseNonNegativeNumber(hauteurStr);
  const N = parseNonNegativeInt(nbExtraParCadreStr);
  const E = parseNonNegativeNumber(espacementStr);

  if (NB == null && H == null && N == null && E == null) return 0;

  const nb = NB ?? 0;
  const h = H ?? 0;
  const n = N ?? 0;
  const e = E ?? 0;

  if (e <= 0) return 0;
  return (h / e) * nb * n;
}

export function computeCadrePerimetre(
  forme: FormeKind,
  longueurStr: string,
  largeurStr: string,
  diamCercleStr: string,
  ancrageStr: string,
) {
  const L = parseNonNegativeNumber(longueurStr);
  const W = parseNonNegativeNumber(largeurStr);
  const D = parseNonNegativeNumber(diamCercleStr);
  const A = parseNonNegativeNumber(ancrageStr);

  const hasAny = L != null || W != null || D != null || A != null;
  if (!hasAny) return null;

  const l = L ?? 0;
  const w = W ?? 0;
  const d = D ?? 0;
  const a = A ?? 0;

  if (forme === "CARRE") return 4 * l + 2 * a;
  if (forme === "CIRCULAIRE") return d * Math.PI + 2 * a;
  if (forme === "RECTANGULAIRE") return 2 * (l + w) + 2 * a;

  return null;
}


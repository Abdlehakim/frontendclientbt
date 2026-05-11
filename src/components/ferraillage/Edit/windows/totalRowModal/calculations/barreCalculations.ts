import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";

const COMMERCIAL_BAR_LENGTH_M = 12;

export function computeBarreNT(nbStr: string, nBarreStr: string) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);
  if (NB == null && N == null) return 0;
  return (NB ?? 0) * (N ?? 0);
}

export function computeBarreNTStandard(
  nbStr: string,
  nBarreStr: string,
  hauteurStr: string,
  attenteStr: string,
  ancrageStr: string,
) {
  return computeBarreQteStandard(nbStr, nBarreStr, hauteurStr, attenteStr, ancrageStr) / 12;
}

export function computeBarreNTLongueurDesignation(
  nbStr: string,
  longueurBarreStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const L = parseNonNegativeNumber(longueurBarreStr);
  const A = parseNonNegativeNumber(ancrageStr);

  if (NB == null && L == null && A == null) return 0;
  return ((((L ?? 0) + (A ?? 0)) * 2) * (NB ?? 0)) / COMMERCIAL_BAR_LENGTH_M;
}

export function computeBarreQteStandard(
  nbStr: string,
  nBarreStr: string,
  hauteurStr: string,
  attenteStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);
  const H = parseNonNegativeNumber(hauteurStr);
  const AT = parseNonNegativeNumber(attenteStr);
  const A = parseNonNegativeNumber(ancrageStr);

  if (NB == null && N == null && H == null && AT == null && A == null) return 0;
  return (NB ?? 0) * ((N ?? 0) * ((H ?? 0) + (AT ?? 0) + (A ?? 0)));
}

export function computeBarreQteLongueur(
  nbStr: string,
  nBarreStr: string,
  longueurBarreStr: string,
  ancrageStr: string,
) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);
  const L = parseNonNegativeNumber(longueurBarreStr);
  const A = parseNonNegativeNumber(ancrageStr);

  if (NB == null && N == null && L == null && A == null) return 0;
  return (NB ?? 0) * ((N ?? 0) * ((L ?? 0) + (A ?? 0)));
}

export function getBarreEffectiveAncrageStr({
  showBarreOptions,
  showAncrageField,
  ancrageStr,
}: {
  showBarreOptions: boolean;
  showAncrageField: boolean;
  ancrageStr: string;
}) {
  return showBarreOptions && !showAncrageField ? "0" : ancrageStr;
}

export function computeFinalBarreQte({
  nbStr,
  nBarreStr,
  hauteurStr,
  longueurStr,
  attenteStr,
  ancrageStr,
  showBarreOptions,
  showAncrageField,
}: {
  nbStr: string;
  nBarreStr: string;
  hauteurStr: string;
  longueurStr: string;
  attenteStr: string;
  ancrageStr: string;
  showBarreOptions: boolean;
  showAncrageField: boolean;
}) {
  const effectiveAncrageStr = getBarreEffectiveAncrageStr({
    showBarreOptions,
    showAncrageField,
    ancrageStr,
  });

  if (showBarreOptions) {
    return computeBarreQteLongueur(
      nbStr,
      nBarreStr,
      longueurStr,
      effectiveAncrageStr,
    );
  }

  return computeBarreQteStandard(
    nbStr,
    nBarreStr,
    hauteurStr,
    attenteStr,
    ancrageStr,
  );
}

export function computeFinalBarreCutLength({
  hauteurStr,
  longueurStr,
  attenteStr,
  ancrageStr,
  showBarreOptions,
  showAncrageField,
}: {
  hauteurStr: string;
  longueurStr: string;
  attenteStr: string;
  ancrageStr: string;
  showBarreOptions: boolean;
  showAncrageField: boolean;
}) {
  const effectiveAncrageStr = getBarreEffectiveAncrageStr({
    showBarreOptions,
    showAncrageField,
    ancrageStr,
  });

  const longueur = parseNonNegativeNumber(longueurStr) ?? 0;
  const hauteur = parseNonNegativeNumber(hauteurStr) ?? 0;
  const attente = parseNonNegativeNumber(attenteStr) ?? 0;
  const ancrage = parseNonNegativeNumber(effectiveAncrageStr) ?? 0;

  if (showBarreOptions) return longueur + ancrage;
  return hauteur + attente + ancrage;
}

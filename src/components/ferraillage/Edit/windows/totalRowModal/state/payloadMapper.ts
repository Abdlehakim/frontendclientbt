import type {
  ExtraBoxPayload,
  ExtraBoxState,
  ExtraFormePayload,
  FormeKind,
  FormeState,
  TotalRowModalPayload,
} from "../types";
import { computeCadrePerimetre, computeExtraPerimetre } from "../calculations/shapeCalculations";
import {
  formeNeedsParams,
  parseNonNegativeInt,
  parseNonNegativeNumber,
  parsePositiveInt,
  parsePositiveNumber,
} from "../utils";
import {
  asSlabCalcMethod,
  asString,
  asTrimmedString,
  isFormeKind,
  isSlabDesignationValue,
} from "./guards";

export function buildTotalRowModalPayload({
  designation,
  nomenclature,
  nbStr,
  hauteurStr,
  showHauteurField,
  formes,
  extraBoxes,
  initDia,
}: {
  designation: string;
  nomenclature: string;
  nbStr: string;
  hauteurStr: string;
  showHauteurField: boolean;
  formes: FormeState[];
  extraBoxes: ExtraBoxState[];
  initDia: number;
}): TotalRowModalPayload | null {
  const nb = parsePositiveInt(nbStr) ?? null;
  const hauteur = showHauteurField ? parsePositiveNumber(hauteurStr) ?? null : null;
  const isSlabMode = isSlabDesignationValue(designation);

  const extraBoxesPayload: ExtraBoxPayload[] = extraBoxes.map((b) => ({
    kind: b.kind,
    diametreMm: b.diametreMm,
    n: parseNonNegativeInt(asString(b.valueStr)) ?? null,
    longueur: parseNonNegativeNumber(asString(b.longueurStr)) ?? null,
    ancrage: parseNonNegativeNumber(asString(b.ancrageStr)) ?? null,
    perimetre: computeExtraPerimetre(b.kind, asString(b.longueurStr), asString(b.ancrageStr)),
    espacement: parseNonNegativeNumber(asString(b.espacementStr)) ?? null,
  }));

  const epingleVals = extraBoxesPayload
    .filter((b) => b.kind === "EPINGLE")
    .map((b) => b.n)
    .filter((v): v is number => v != null);

  const etriersVals = extraBoxesPayload
    .filter((b) => b.kind === "ETRIERS")
    .map((b) => b.n)
    .filter((v): v is number => v != null);

  const epingle = epingleVals.length ? epingleVals.reduce((a, b) => a + b, 0) : null;
  const etriers = etriersVals.length ? etriersVals.reduce((a, b) => a + b, 0) : null;

  const main = formes[0];
  if (!main) return null;

  const mainForme: FormeKind = isFormeKind(main.forme) ? main.forme : "BARRE";
  const mainDia =
    typeof main.diametreMm === "number" && Number.isFinite(main.diametreMm) ? main.diametreMm : initDia;
  const mainShow = formeNeedsParams(mainForme);

  const mainNBarre =
    mainForme === "BARRE" && !isSlabMode ? parsePositiveInt(asString(main.nBarreStr)) : null;

  const mainLongueur =
    mainForme === "BARRE" && isSlabMode
      ? null
      : mainForme === "BARRE" || mainForme === "CARRE" || mainForme === "RECTANGULAIRE"
        ? parsePositiveNumber(asString(main.longueurStr))
        : null;

  const mainLargeur = mainForme === "RECTANGULAIRE" ? parsePositiveNumber(asString(main.largeurStr)) : null;
  const mainRayon = mainForme === "CIRCULAIRE" ? parsePositiveNumber(asString(main.rayonStr)) : null;

  const mainAncrage = isSlabMode ? null : parseNonNegativeNumber(asString(main.ancrageStr)) ?? null;
  const mainAttenteBarre =
    mainForme === "BARRE" && !isSlabMode ? (parseNonNegativeNumber(asString(main.attenteStr)) ?? null) : null;

  const mainPerCalc = computeCadrePerimetre(
    mainForme,
    asString(main.longueurStr),
    asString(main.largeurStr),
    asString(main.rayonStr),
    asString(main.ancrageStr),
  );

  const mainPerimetre = mainShow ? (mainPerCalc != null && mainPerCalc > 0 ? mainPerCalc : null) : null;
  const mainEspacement = mainShow ? (parsePositiveNumber(asString(main.espacementStr)) ?? null) : null;

  const extras: ExtraFormePayload[] = formes.slice(1).map((x) => {
    const forme: FormeKind = isFormeKind(x.forme) ? x.forme : "CARRE";
    const per = computeCadrePerimetre(
      forme,
      asString(x.longueurStr),
      asString(x.largeurStr),
      asString(x.rayonStr),
      asString(x.ancrageStr),
    );
    const xShow = formeNeedsParams(forme);

    return {
      forme,
      diametreMm:
        typeof x.diametreMm === "number" && Number.isFinite(x.diametreMm) ? x.diametreMm : initDia,
      barreCategorie: asTrimmedString(x.barreCategorie, "") || undefined,
      nBarre: forme === "BARRE" && !isSlabMode ? parsePositiveInt(asString(x.nBarreStr)) : null,
      longueur:
        forme === "BARRE" && isSlabMode
          ? null
          : forme === "BARRE" || forme === "CARRE" || forme === "RECTANGULAIRE"
            ? parsePositiveNumber(asString(x.longueurStr))
            : null,
      largeur: forme === "RECTANGULAIRE" ? parsePositiveNumber(asString(x.largeurStr)) : null,
      rayon: forme === "CIRCULAIRE" ? parsePositiveNumber(asString(x.rayonStr)) : null,
      ancrage: isSlabMode ? null : parseNonNegativeNumber(asString(x.ancrageStr)) ?? null,
      attenteBarre: forme === "BARRE" && !isSlabMode ? (parseNonNegativeNumber(asString(x.attenteStr)) ?? null) : null,
      perimetre: xShow ? (per != null && per > 0 ? per : null) : null,
      espacement: xShow ? (parsePositiveNumber(asString(x.espacementStr)) ?? null) : null,
      slabCalcMethod: forme === "BARRE" && isSlabMode ? asSlabCalcMethod(x.slabCalcMethod) : undefined,
      slabSurface: forme === "BARRE" && isSlabMode ? parseNonNegativeNumber(asString(x.slabSurfaceStr)) ?? null : null,
      slabQtePerM2:
        forme === "BARRE" && isSlabMode ? parseNonNegativeNumber(asString(x.slabQtePerM2Str)) ?? null : null,
    };
  });

  return {
    designation: (designation ?? "").trim(),
    typeName: (nomenclature ?? "").trim(),
    nb,
    hauteur,
    enrobage: null,
    forme: mainForme,
    diametreMm: mainDia,
    barreCategorie: asTrimmedString(main.barreCategorie, "") || undefined,
    nBarre: mainNBarre,
    longueur: mainLongueur,
    largeur: mainLargeur,
    rayon: mainRayon,
    ancrage: mainAncrage,
    attenteBarre: mainAttenteBarre,
    perimetre: mainPerimetre,
    espacement: mainEspacement,
    epingle,
    etriers,
    extraFormes: extras.length ? extras : undefined,
    extraBoxes: extraBoxesPayload.length ? extraBoxesPayload : undefined,
    slabCalcMethod: mainForme === "BARRE" && isSlabMode ? asSlabCalcMethod(main.slabCalcMethod) : undefined,
    slabSurface:
      mainForme === "BARRE" && isSlabMode ? parseNonNegativeNumber(asString(main.slabSurfaceStr)) ?? null : null,
    slabQtePerM2:
      mainForme === "BARRE" && isSlabMode ? parseNonNegativeNumber(asString(main.slabQtePerM2Str)) ?? null : null,
  };
}


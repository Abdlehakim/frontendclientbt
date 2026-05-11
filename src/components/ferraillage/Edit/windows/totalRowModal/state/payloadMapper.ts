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
  asSlabRelation,
  asSlabSpacingMode,
  asSlabSpacingRelation,
  isSlabSurfacePerM2SpacingDesignationValue,
  normalizeSlabSurfacePerM2Relation,
  asString,
  asTrimmedString,
  isFormeKind,
  isSlabDesignationValue,
} from "./guards";
import { shouldUseSimpleBarreLayout } from "./barreModes";
import { normalizeTypeDeNappe } from "../config/formeBarreOptions";

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
  const isSlabSurfacePerM2SpacingDesignation =
    isSlabSurfacePerM2SpacingDesignationValue(designation);

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
  const mainBarreCategorie =
    mainForme === "BARRE" && isSlabMode
      ? normalizeTypeDeNappe(main.barreCategorie, designation)
      : asTrimmedString(main.barreCategorie, "");
  const isMainSimpleBarreLayout = shouldUseSimpleBarreLayout({
    designation,
    forme: mainForme,
    typeDeNappe: mainBarreCategorie,
  });
  const isMainStandardBarre = mainForme === "BARRE" && (!isSlabMode || isMainSimpleBarreLayout);
  const mainDia =
    typeof main.diametreMm === "number" && Number.isFinite(main.diametreMm) ? main.diametreMm : initDia;
  const mainShow = formeNeedsParams(mainForme);

  const mainNBarre = isMainStandardBarre ? parsePositiveInt(asString(main.nBarreStr)) : null;

  const mainLongueur =
    mainForme === "BARRE" && isSlabMode && !isMainSimpleBarreLayout
      ? null
      : mainForme === "BARRE" || mainForme === "CARRE" || mainForme === "RECTANGULAIRE"
        ? parsePositiveNumber(asString(main.longueurStr))
        : null;

  const mainLargeur = mainForme === "RECTANGULAIRE" ? parsePositiveNumber(asString(main.largeurStr)) : null;
  const mainRayon = mainForme === "CIRCULAIRE" ? parsePositiveNumber(asString(main.rayonStr)) : null;

  const mainAncrage =
    isMainSimpleBarreLayout
      ? null
      : mainForme === "BARRE" || !isSlabMode
        ? parseNonNegativeNumber(asString(main.ancrageStr)) ?? null
        : null;
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
    const barreCategorie =
      forme === "BARRE" && isSlabMode
        ? normalizeTypeDeNappe(x.barreCategorie, designation)
        : asTrimmedString(x.barreCategorie, "");
    const isSimpleBarreLayout = shouldUseSimpleBarreLayout({
      designation,
      forme,
      typeDeNappe: barreCategorie,
    });
    const isSlabBarre = forme === "BARRE" && isSlabMode && !isSimpleBarreLayout;
    const isStandardBarre = forme === "BARRE" && (!isSlabMode || isSimpleBarreLayout);
    const calcMethod = isSlabBarre ? asSlabCalcMethod(x.slabCalcMethod) : undefined;
    const isSlabSurfacePerM2SpacingMode =
      isSlabSurfacePerM2SpacingDesignation && calcMethod === "SURFACE_TOTAL_PER_M2";
    const slabRelation =
      isSlabBarre
        ? (isSlabSurfacePerM2SpacingMode
            ? normalizeSlabSurfacePerM2Relation(x.slabRelation)
            : asSlabRelation(x.slabRelation))
        : undefined;
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
      barreCategorie: barreCategorie || undefined,
      nBarre: isStandardBarre ? parsePositiveInt(asString(x.nBarreStr)) : null,
      longueur:
        forme === "BARRE" && isSlabMode && !isSimpleBarreLayout
          ? null
          : forme === "BARRE" || forme === "CARRE" || forme === "RECTANGULAIRE"
            ? parsePositiveNumber(asString(x.longueurStr))
            : null,
      largeur: forme === "RECTANGULAIRE" ? parsePositiveNumber(asString(x.largeurStr)) : null,
      rayon: forme === "CIRCULAIRE" ? parsePositiveNumber(asString(x.rayonStr)) : null,
      ancrage:
        isSimpleBarreLayout
          ? null
          : forme === "BARRE" || !isSlabMode
            ? parseNonNegativeNumber(asString(x.ancrageStr)) ?? null
            : null,
      attenteBarre: forme === "BARRE" && !isSlabMode ? (parseNonNegativeNumber(asString(x.attenteStr)) ?? null) : null,
      perimetre: xShow ? (per != null && per > 0 ? per : null) : null,
      espacement: xShow ? (parsePositiveNumber(asString(x.espacementStr)) ?? null) : null,
      slabCalcMethod: calcMethod,
      slabSurface: isSlabBarre ? parseNonNegativeNumber(asString(x.slabSurfaceStr)) ?? null : null,
      slabQtePerM2:
        isSlabBarre ? parseNonNegativeNumber(asString(x.slabQtePerM2Str)) ?? null : null,
      slabPerimetre:
        isSlabBarre ? parseNonNegativeNumber(asString(x.slabPerimetreStr)) ?? null : null,
      slabAncrageLineaire:
        isSlabBarre ? parseNonNegativeNumber(asString(x.slabAncrageLineaireStr)) ?? null : null,
      slabRelation,
      slabSpacingMode:
        isSlabBarre
          ? (isSlabSurfacePerM2SpacingMode ? "ESPACEMENT" : asSlabSpacingMode(x.slabSpacingMode))
          : undefined,
      slabSpacingRelation: isSlabBarre ? asSlabSpacingRelation(x.slabSpacingRelation) : undefined,
      slabLongueurA: isSlabBarre ? parseNonNegativeNumber(asString(x.slabLongueurAStr)) ?? null : null,
      slabLongueurB: isSlabBarre ? parseNonNegativeNumber(asString(x.slabLongueurBStr)) ?? null : null,
      slabDiametreAMm:
        isSlabBarre && typeof x.slabDiametreAMm === "number" && Number.isFinite(x.slabDiametreAMm)
          ? x.slabDiametreAMm
          : null,
      slabDiametreBMm:
        isSlabBarre && typeof x.slabDiametreBMm === "number" && Number.isFinite(x.slabDiametreBMm)
          ? x.slabDiametreBMm
          : null,
      slabNBarreA: isSlabBarre ? parseNonNegativeInt(asString(x.slabNBarreAStr)) ?? null : null,
      slabNBarreB: isSlabBarre ? parseNonNegativeInt(asString(x.slabNBarreBStr)) ?? null : null,
      slabEspacementA: isSlabBarre ? parseNonNegativeNumber(asString(x.slabEspacementAStr)) ?? null : null,
      slabEspacementB: isSlabBarre ? parseNonNegativeNumber(asString(x.slabEspacementBStr)) ?? null : null,
      slabNbCadreA: isSlabBarre ? parseNonNegativeInt(asString(x.slabNbCadreAStr)) ?? null : null,
      slabNbCadreB: isSlabBarre ? parseNonNegativeInt(asString(x.slabNbCadreBStr)) ?? null : null,
    };
  });

  const isMainSlabBarre = mainForme === "BARRE" && isSlabMode && !isMainSimpleBarreLayout;
  const mainSlabCalcMethod = isMainSlabBarre ? asSlabCalcMethod(main.slabCalcMethod) : undefined;
  const isMainSlabSurfacePerM2SpacingMode =
    isMainSlabBarre &&
    isSlabSurfacePerM2SpacingDesignation &&
    mainSlabCalcMethod === "SURFACE_TOTAL_PER_M2";
  const mainSlabRelation =
    isMainSlabBarre
      ? (isMainSlabSurfacePerM2SpacingMode
          ? normalizeSlabSurfacePerM2Relation(main.slabRelation)
          : asSlabRelation(main.slabRelation))
      : undefined;

  return {
    designation: (designation ?? "").trim(),
    typeName: (nomenclature ?? "").trim(),
    nb,
    hauteur,
    enrobage: null,
    forme: mainForme,
    diametreMm: mainDia,
    barreCategorie: mainBarreCategorie || undefined,
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
    slabCalcMethod: mainSlabCalcMethod,
    slabSurface:
      isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabSurfaceStr)) ?? null : null,
    slabQtePerM2:
      isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabQtePerM2Str)) ?? null : null,
    slabPerimetre:
      isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabPerimetreStr)) ?? null : null,
    slabAncrageLineaire:
      isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabAncrageLineaireStr)) ?? null : null,
    slabRelation: mainSlabRelation,
    slabSpacingMode:
      isMainSlabBarre
        ? (isMainSlabSurfacePerM2SpacingMode ? "ESPACEMENT" : asSlabSpacingMode(main.slabSpacingMode))
        : undefined,
    slabSpacingRelation: isMainSlabBarre ? asSlabSpacingRelation(main.slabSpacingRelation) : undefined,
    slabLongueurA: isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabLongueurAStr)) ?? null : null,
    slabLongueurB: isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabLongueurBStr)) ?? null : null,
    slabDiametreAMm:
      isMainSlabBarre && typeof main.slabDiametreAMm === "number" && Number.isFinite(main.slabDiametreAMm)
        ? main.slabDiametreAMm
        : null,
    slabDiametreBMm:
      isMainSlabBarre && typeof main.slabDiametreBMm === "number" && Number.isFinite(main.slabDiametreBMm)
        ? main.slabDiametreBMm
        : null,
    slabNBarreA: isMainSlabBarre ? parseNonNegativeInt(asString(main.slabNBarreAStr)) ?? null : null,
    slabNBarreB: isMainSlabBarre ? parseNonNegativeInt(asString(main.slabNBarreBStr)) ?? null : null,
    slabEspacementA: isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabEspacementAStr)) ?? null : null,
    slabEspacementB: isMainSlabBarre ? parseNonNegativeNumber(asString(main.slabEspacementBStr)) ?? null : null,
    slabNbCadreA: isMainSlabBarre ? parseNonNegativeInt(asString(main.slabNbCadreAStr)) ?? null : null,
    slabNbCadreB: isMainSlabBarre ? parseNonNegativeInt(asString(main.slabNbCadreBStr)) ?? null : null,
  };
}

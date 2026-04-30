import type { FormeKind, FormeState, TotalRowModalPayload } from "../types";
import { makeId, resetFieldsForForme } from "../utils";
import {
  asCadreCalcMode,
  asFiniteNumber,
  asNullableFiniteNumber,
  asObjectRecord,
  asSemelleRelation,
  asSlabCalcMethod,
  asSlabRelation,
  asSlabSpacingMode,
  asSlabSpacingRelation,
  asString,
  asTrimmedString,
  isFormeKind,
  pickFirst,
  readNullableFiniteNumber,
  readStringish,
} from "./guards";

function getResettableFormeFields(source: Partial<FormeState>) {
  return {
    nBarreStr: asString(source.nBarreStr),
    longueurStr: asString(source.longueurStr),
    attenteStr: asString(source.attenteStr),
    largeurStr: asString(source.largeurStr),
    rayonStr: asString(source.rayonStr),
    espacementStr: asString(source.espacementStr),
    perimetreStr: asString(source.perimetreStr),
    slabSurfaceStr: asString(source.slabSurfaceStr),
    slabQtePerM2Str: asString(source.slabQtePerM2Str),
    slabPerimetreStr: asString(source.slabPerimetreStr),
    slabAncrageLineaireStr: asString(source.slabAncrageLineaireStr),
  };
}

function getSafeResetPatch(forme: FormeKind, source: Partial<FormeState>): Partial<FormeState> {
  const base = getResettableFormeFields(source);
  const raw = resetFieldsForForme(forme, base) as Record<string, unknown> | undefined;

  return {
    nBarreStr: asString(raw?.nBarreStr, base.nBarreStr),
    longueurStr: asString(raw?.longueurStr, base.longueurStr),
    attenteStr: asString(raw?.attenteStr, base.attenteStr),
    largeurStr: asString(raw?.largeurStr, base.largeurStr),
    rayonStr: asString(raw?.rayonStr, base.rayonStr),
    espacementStr: asString(raw?.espacementStr, base.espacementStr),
    perimetreStr: asString(raw?.perimetreStr, base.perimetreStr),
    slabSurfaceStr: asString(raw?.slabSurfaceStr, base.slabSurfaceStr),
    slabQtePerM2Str: asString(raw?.slabQtePerM2Str, base.slabQtePerM2Str),
    slabPerimetreStr: asString(raw?.slabPerimetreStr, base.slabPerimetreStr),
    slabAncrageLineaireStr: asString(raw?.slabAncrageLineaireStr, base.slabAncrageLineaireStr),
  };
}

export function createFormeState(
  forme: FormeKind,
  fallbackDia: number,
  source?: Partial<FormeState> & { id?: string },
): FormeState {
  const base: FormeState = {
    id: typeof source?.id === "string" ? source.id : makeId(),
    forme,
    diametreMm: asFiniteNumber(source?.diametreMm, fallbackDia),
    barreCategorie: asTrimmedString(source?.barreCategorie, ""),
    nBarreStr: asString(source?.nBarreStr),
    longueurStr: asString(source?.longueurStr),
    largeurStr: asString(source?.largeurStr),
    rayonStr: asString(source?.rayonStr),
    ancrageStr: asString(source?.ancrageStr),
    attenteStr: asString(source?.attenteStr),
    perimetreStr: asString(source?.perimetreStr),
    espacementStr: asString(source?.espacementStr),
    cadreCalcMode: asCadreCalcMode(source?.cadreCalcMode),
    nbCadreStr: asString(source?.nbCadreStr),

    semelleRelation: asSemelleRelation(source?.semelleRelation),
    semelleLongueurAStr: asString(source?.semelleLongueurAStr),
    semelleLongueurBStr: asString(source?.semelleLongueurBStr),
    semelleNBarreAStr: asString(source?.semelleNBarreAStr),
    semelleNBarreBStr: asString(source?.semelleNBarreBStr),
    semelleDiametreAMm: asNullableFiniteNumber(source?.semelleDiametreAMm),
    semelleDiametreBMm: asNullableFiniteNumber(source?.semelleDiametreBMm),

    slabCalcMethod: asSlabCalcMethod(source?.slabCalcMethod),
    slabSurfaceStr: asString(source?.slabSurfaceStr),
    slabQtePerM2Str: asString(source?.slabQtePerM2Str),
    slabPerimetreStr: asString(source?.slabPerimetreStr),
    slabAncrageLineaireStr: asString(source?.slabAncrageLineaireStr),
    slabRelation: asSlabRelation(source?.slabRelation),
    slabSpacingMode: asSlabSpacingMode(source?.slabSpacingMode),
    slabSpacingRelation: asSlabSpacingRelation(source?.slabSpacingRelation),
    slabLongueurAStr: asString(source?.slabLongueurAStr),
    slabLongueurBStr: asString(source?.slabLongueurBStr),
    slabDiametreAMm: asNullableFiniteNumber(source?.slabDiametreAMm),
    slabDiametreBMm: asNullableFiniteNumber(source?.slabDiametreBMm),
    slabNBarreAStr: asString(source?.slabNBarreAStr),
    slabNBarreBStr: asString(source?.slabNBarreBStr),
    slabEspacementAStr: asString(source?.slabEspacementAStr),
    slabEspacementBStr: asString(source?.slabEspacementBStr),
    slabNbCadreAStr: asString(source?.slabNbCadreAStr),
    slabNbCadreBStr: asString(source?.slabNbCadreBStr),
  };

  return {
    ...base,
    ...getSafeResetPatch(forme, base),
  };
}

export function mergeFormeState(current: FormeState, patch: Partial<FormeState>, fallbackDia: number): FormeState {
  const nextForme = isFormeKind(patch.forme) ? patch.forme : isFormeKind(current.forme) ? current.forme : "BARRE";

  const nextDia =
    typeof patch.diametreMm === "number" && Number.isFinite(patch.diametreMm)
      ? patch.diametreMm
      : typeof current.diametreMm === "number" && Number.isFinite(current.diametreMm)
        ? current.diametreMm
        : fallbackDia;

  return createFormeState(nextForme, nextDia, {
    ...current,
    ...patch,
    id: current.id,
  });
}

export function buildInitialFormes(
  shouldHydrate: boolean,
  initial: Partial<TotalRowModalPayload> | undefined,
  initDia: number,
): FormeState[] {
  if (!shouldHydrate) return [];

  const initialForme = isFormeKind(initial?.forme) ? initial.forme : null;
  if (!initialForme) return [];

  const initialRaw = asObjectRecord(initial);

  const main = createFormeState(initialForme, initDia, {
    diametreMm: typeof initial?.diametreMm === "number" ? initial.diametreMm : initDia,
    barreCategorie: initial?.barreCategorie ?? "",
    nBarreStr: initial?.nBarre == null ? "0" : String(initial.nBarre),
    longueurStr: initial?.longueur == null ? "0" : String(initial.longueur),
    largeurStr: initial?.largeur == null ? "0" : String(initial.largeur),
    rayonStr: initial?.rayon == null ? "0" : String(initial.rayon),
    ancrageStr: initial?.ancrage == null ? "0" : String(initial.ancrage),
    attenteStr: initial?.attenteBarre == null ? "0" : String(initial.attenteBarre),
    perimetreStr: initial?.perimetre == null ? "0" : String(initial.perimetre),
    espacementStr: initial?.espacement == null ? "0" : String(initial.espacement),
    cadreCalcMode: "ESPACEMENT",
    nbCadreStr: "0",

    semelleRelation: pickFirst(initialRaw, ["semelleRelation"]) as FormeState["semelleRelation"],
    semelleLongueurAStr: readStringish(initialRaw, ["semelleLongueurAStr", "semelleLongueurA"]),
    semelleLongueurBStr: readStringish(initialRaw, ["semelleLongueurBStr", "semelleLongueurB"]),
    semelleNBarreAStr: readStringish(initialRaw, ["semelleNBarreAStr", "semelleNBarreA"]),
    semelleNBarreBStr: readStringish(initialRaw, ["semelleNBarreBStr", "semelleNBarreB"]),
    semelleDiametreAMm: readNullableFiniteNumber(initialRaw, ["semelleDiametreAMm", "semelleDiametreA"]),
    semelleDiametreBMm: readNullableFiniteNumber(initialRaw, ["semelleDiametreBMm", "semelleDiametreB"]),

    slabCalcMethod: initial?.slabCalcMethod,
    slabSurfaceStr: initial?.slabSurface == null ? "0" : String(initial.slabSurface),
    slabQtePerM2Str: initial?.slabQtePerM2 == null ? "0" : String(initial.slabQtePerM2),
    slabPerimetreStr: initial?.slabPerimetre == null ? "0" : String(initial.slabPerimetre),
    slabAncrageLineaireStr:
      initial?.slabAncrageLineaire == null ? "0" : String(initial.slabAncrageLineaire),
    slabRelation: pickFirst(initialRaw, ["slabRelation"]) as FormeState["slabRelation"],
    slabSpacingMode: pickFirst(initialRaw, ["slabSpacingMode"]) as FormeState["slabSpacingMode"],
    slabSpacingRelation: pickFirst(initialRaw, ["slabSpacingRelation"]) as FormeState["slabSpacingRelation"],
    slabLongueurAStr: readStringish(initialRaw, ["slabLongueurAStr", "slabLongueurA"]),
    slabLongueurBStr: readStringish(initialRaw, ["slabLongueurBStr", "slabLongueurB"]),
    slabDiametreAMm: readNullableFiniteNumber(initialRaw, ["slabDiametreAMm", "slabDiametreA"]),
    slabDiametreBMm: readNullableFiniteNumber(initialRaw, ["slabDiametreBMm", "slabDiametreB"]),
    slabNBarreAStr: readStringish(initialRaw, ["slabNBarreAStr", "slabNBarreA"]),
    slabNBarreBStr: readStringish(initialRaw, ["slabNBarreBStr", "slabNBarreB"]),
    slabEspacementAStr: readStringish(initialRaw, ["slabEspacementAStr", "slabEspacementA"]),
    slabEspacementBStr: readStringish(initialRaw, ["slabEspacementBStr", "slabEspacementB"]),
    slabNbCadreAStr: readStringish(initialRaw, ["slabNbCadreAStr", "slabNbCadreA"]),
    slabNbCadreBStr: readStringish(initialRaw, ["slabNbCadreBStr", "slabNbCadreB"]),
  });

  const extras = (initial?.extraFormes ?? []).map((x) => {
    const forme = isFormeKind(x.forme) ? x.forme : "CARRE";
    const raw = asObjectRecord(x);

    return createFormeState(forme, initDia, {
      diametreMm: typeof x.diametreMm === "number" ? x.diametreMm : initDia,
      barreCategorie: x.barreCategorie ?? "",
      nBarreStr: x.nBarre == null ? "0" : String(x.nBarre),
      longueurStr: x.longueur == null ? "0" : String(x.longueur),
      largeurStr: x.largeur == null ? "0" : String(x.largeur),
      rayonStr: x.rayon == null ? "0" : String(x.rayon),
      ancrageStr: x.ancrage == null ? "0" : String(x.ancrage),
      attenteStr: x.attenteBarre == null ? "0" : String(x.attenteBarre),
      perimetreStr: x.perimetre == null ? "0" : String(x.perimetre),
      espacementStr: x.espacement == null ? "0" : String(x.espacement),
      cadreCalcMode: "ESPACEMENT",
      nbCadreStr: "0",

      semelleRelation: pickFirst(raw, ["semelleRelation"]) as FormeState["semelleRelation"],
      semelleLongueurAStr: readStringish(raw, ["semelleLongueurAStr", "semelleLongueurA"]),
      semelleLongueurBStr: readStringish(raw, ["semelleLongueurBStr", "semelleLongueurB"]),
      semelleNBarreAStr: readStringish(raw, ["semelleNBarreAStr", "semelleNBarreA"]),
      semelleNBarreBStr: readStringish(raw, ["semelleNBarreBStr", "semelleNBarreB"]),
      semelleDiametreAMm: readNullableFiniteNumber(raw, ["semelleDiametreAMm", "semelleDiametreA"]),
      semelleDiametreBMm: readNullableFiniteNumber(raw, ["semelleDiametreBMm", "semelleDiametreB"]),

      slabCalcMethod: x.slabCalcMethod,
      slabSurfaceStr: x.slabSurface == null ? "0" : String(x.slabSurface),
      slabQtePerM2Str: x.slabQtePerM2 == null ? "0" : String(x.slabQtePerM2),
      slabPerimetreStr: x.slabPerimetre == null ? "0" : String(x.slabPerimetre),
      slabAncrageLineaireStr:
        x.slabAncrageLineaire == null ? "0" : String(x.slabAncrageLineaire),
      slabRelation: pickFirst(raw, ["slabRelation"]) as FormeState["slabRelation"],
      slabSpacingMode: pickFirst(raw, ["slabSpacingMode"]) as FormeState["slabSpacingMode"],
      slabSpacingRelation: pickFirst(raw, ["slabSpacingRelation"]) as FormeState["slabSpacingRelation"],
      slabLongueurAStr: readStringish(raw, ["slabLongueurAStr", "slabLongueurA"]),
      slabLongueurBStr: readStringish(raw, ["slabLongueurBStr", "slabLongueurB"]),
      slabDiametreAMm: readNullableFiniteNumber(raw, ["slabDiametreAMm", "slabDiametreA"]),
      slabDiametreBMm: readNullableFiniteNumber(raw, ["slabDiametreBMm", "slabDiametreB"]),
      slabNBarreAStr: readStringish(raw, ["slabNBarreAStr", "slabNBarreA"]),
      slabNBarreBStr: readStringish(raw, ["slabNBarreBStr", "slabNBarreB"]),
      slabEspacementAStr: readStringish(raw, ["slabEspacementAStr", "slabEspacementA"]),
      slabEspacementBStr: readStringish(raw, ["slabEspacementBStr", "slabEspacementB"]),
      slabNbCadreAStr: readStringish(raw, ["slabNbCadreAStr", "slabNbCadreA"]),
      slabNbCadreBStr: readStringish(raw, ["slabNbCadreBStr", "slabNbCadreB"]),
    });
  });

  return [main, ...extras];
}

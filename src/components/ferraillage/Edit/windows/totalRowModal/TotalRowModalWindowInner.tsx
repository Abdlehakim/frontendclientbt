import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { IoInformationCircleOutline } from "react-icons/io5";
import DotsPagination from "@/components/DotsPagination";

import type {
  Card,
  ExtraBoxKind,
  ExtraBoxPayload,
  ExtraBoxState,
  ExtraFormePayload,
  FormeState,
  TotalRowModalPayload,
} from "./types";
import {
  clamp,
  formeNeedsParams,
  formeValid,
  makeId,
  parseNonNegativeInt,
  parseNonNegativeNumber,
  parsePositiveInt,
  parsePositiveNumber,
  resetFieldsForForme,
} from "./utils";
import {
  AddPlusDropdown,
  DesignationDropdown,
  ExtraBoxCard,
  FormeBarre,
  FormeCard,
} from "./components";
import RecapPanel, { type RecapData } from "./components/RecapPanel";
import FormeBarreAbbreviationsModal from "./components/FormeBarreAbbreviationsModal";

type FormeKind = NonNullable<TotalRowModalPayload["forme"]>;
type SemelleRelation = NonNullable<FormeState["semelleRelation"]>;
type SlabCalcMethod = NonNullable<FormeState["slabCalcMethod"]>;
type SlabRelation = NonNullable<FormeState["slabRelation"]>;
type SlabSpacingMode = NonNullable<FormeState["slabSpacingMode"]>;
type SlabSpacingRelation = NonNullable<FormeState["slabSpacingRelation"]>;

type ModalState = {
  extraBoxes: ExtraBoxState[];
  formes: FormeState[];
  cardOrder: Card[];
  page: number;
};

const SEMELLE_RELATIONS: readonly SemelleRelation[] = [
  "ab_equal_same_if",
  "ab_equal_diff_if",
  "ab_diff_same_if",
  "ab_diff_diff_if",
];

const SLAB_RELATIONS: readonly SlabRelation[] = [
  "ab_equal_same_if",
  "ab_equal_diff_if",
  "ab_diff_same_if",
  "ab_diff_diff_if",
];

const SLAB_SPACING_MODES: readonly SlabSpacingMode[] = [
  "ESPACEMENT",
  "NB_CADRE",
];

const SLAB_SPACING_RELATIONS: readonly SlabSpacingRelation[] = [
  "EA_EQ_EB",
  "EA_NE_EB",
];

const SLAB_DESIGNATIONS = ["dalle pleine", "chape", "radier"] as const;

function isFormeKind(value: unknown): value is FormeKind {
  return value === "BARRE" || value === "CARRE" || value === "CIRCULAIRE" || value === "RECTANGULAIRE";
}

function isSemelleRelation(value: unknown): value is SemelleRelation {
  return typeof value === "string" && (SEMELLE_RELATIONS as readonly string[]).includes(value);
}

function isSlabCalcMethod(value: unknown): value is SlabCalcMethod {
  return value === "SURFACE_TOTAL" || value === "SURFACE_TOTAL_PER_M2";
}

function isSlabRelation(value: unknown): value is SlabRelation {
  return typeof value === "string" && (SLAB_RELATIONS as readonly string[]).includes(value);
}

function isSlabSpacingMode(value: unknown): value is SlabSpacingMode {
  return typeof value === "string" && (SLAB_SPACING_MODES as readonly string[]).includes(value);
}

function isSlabSpacingRelation(value: unknown): value is SlabSpacingRelation {
  return typeof value === "string" && (SLAB_SPACING_RELATIONS as readonly string[]).includes(value);
}

function asString(value: unknown, fallback = "0") {
  return typeof value === "string" ? value : fallback;
}

function asTrimmedString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asCadreCalcMode(value: unknown): "ESPACEMENT" | "NB_CADRE" {
  return value === "NB_CADRE" ? "NB_CADRE" : "ESPACEMENT";
}

function asExtraCalcMode(value: unknown): "ESPACEMENT" | "NB" {
  return value === "NB" ? "NB" : "ESPACEMENT";
}

function asSemelleRelation(value: unknown): SemelleRelation {
  return isSemelleRelation(value) ? value : "ab_equal_same_if";
}

function asSlabCalcMethod(value: unknown): SlabCalcMethod {
  return isSlabCalcMethod(value) ? value : "SURFACE_TOTAL";
}

function asSlabRelation(value: unknown): SlabRelation {
  return isSlabRelation(value) ? value : "ab_equal_same_if";
}

function asSlabSpacingMode(value: unknown): SlabSpacingMode {
  return isSlabSpacingMode(value) ? value : "ESPACEMENT";
}

function asSlabSpacingRelation(value: unknown): SlabSpacingRelation {
  return isSlabSpacingRelation(value) ? value : "EA_EQ_EB";
}

function normalizeSlabSpacingRelationValue(value: unknown): SlabSpacingRelation {
  const raw = typeof value === "string" ? value.trim() : "";

  if (raw === "EA_NE_EB" || raw === "E_A_NE_E_B" || raw === "EA_NEQ_EB" || raw === "EA_NOT_EQ_EB") {
    return "EA_NE_EB";
  }

  if (raw === "EA_EQ_EB" || raw === "E_A_EQ_E_B") {
    return "EA_EQ_EB";
  }

  return "EA_EQ_EB";
}

function normalizeDesignation(value: unknown) {
  return asTrimmedString(value, "").toLowerCase();
}

function isSlabDesignationValue(value: unknown) {
  const normalized = normalizeDesignation(value);
  return SLAB_DESIGNATIONS.includes(normalized as (typeof SLAB_DESIGNATIONS)[number]);
}

function asObjectRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickFirst(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
}

function readStringish(source: Record<string, unknown>, keys: string[], fallback = "0") {
  const value = pickFirst(source, keys);
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function readNullableFiniteNumber(source: Record<string, unknown>, keys: string[]) {
  return asNullableFiniteNumber(pickFirst(source, keys));
}

function hasAnyValue(source: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => {
    const value = source[key];
    return value !== undefined && value !== null && value !== "";
  });
}

function computeSlabQte(calcMethod: SlabCalcMethod, surfaceStr: string, qtePerM2Str: string) {
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

  // User rule:
  // N.T.Barre = (L. Barre a ou b / Es. a et b) x 2
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

  // User rule:
  // N.T.Barre = L. Barre a ou b / Es. a + L. Barre a ou b / Es. b when E a ≠ E b
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

function computeSpecialSlabSpacingRecapMetrics(params: {
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

function isSemelleBarreValid(source: Partial<FormeState>) {
  const nappe = asTrimmedString(source.barreCategorie, "") || "Nappe inférieur";

  if (nappe === "Chaise") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.longueurStr)) != null
    );
  }

  const relation = asSemelleRelation(source.semelleRelation);

  if (relation === "ab_equal_same_if") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null
    );
  }

  if (relation === "ab_equal_diff_if") {
    return (
      parsePositiveInt(asString(source.semelleNBarreAStr)) != null &&
      parsePositiveInt(asString(source.semelleNBarreBStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null
    );
  }

  if (relation === "ab_diff_same_if") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurBStr)) != null
    );
  }

  return (
    parsePositiveInt(asString(source.semelleNBarreAStr)) != null &&
    parsePositiveInt(asString(source.semelleNBarreBStr)) != null &&
    parsePositiveNumber(asString(source.semelleLongueurAStr)) != null &&
    parsePositiveNumber(asString(source.semelleLongueurBStr)) != null
  );
}

function isSlabBarreValid(source: Partial<FormeState>) {
  const surface = parsePositiveNumber(asString(source.slabSurfaceStr));
  if (surface == null) return false;

  const calcMethod = asSlabCalcMethod(source.slabCalcMethod);
  if (calcMethod === "SURFACE_TOTAL_PER_M2") {
    return parsePositiveNumber(asString(source.slabQtePerM2Str)) != null;
  }

  return true;
}

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
  };
}

function createFormeState(
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

function mergeFormeState(current: FormeState, patch: Partial<FormeState>, fallbackDia: number): FormeState {
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

function createExtraBoxState(
  kind: ExtraBoxKind,
  fallbackDia: number,
  source?: Partial<ExtraBoxState> & { id?: string },
): ExtraBoxState {
  return {
    id: typeof source?.id === "string" ? source.id : makeId(),
    kind,
    diametreMm: asFiniteNumber(source?.diametreMm, fallbackDia),
    valueStr: asString(source?.valueStr),
    longueurStr: asString(source?.longueurStr),
    ancrageStr: asString(source?.ancrageStr),
    perimetreStr: asString(source?.perimetreStr),
    espacementStr: asString(source?.espacementStr),
    extraCalcMode: asExtraCalcMode(source?.extraCalcMode),
    nbExtraStr: asString(source?.nbExtraStr),
  };
}

function mergeExtraBoxState(current: ExtraBoxState, patch: Partial<ExtraBoxState>, fallbackDia: number): ExtraBoxState {
  return createExtraBoxState(current.kind, fallbackDia, {
    ...current,
    ...patch,
    id: current.id,
  });
}

function computeExtraPerimetre(kind: ExtraBoxKind, longueurStr: string, ancrageStr: string) {
  const L = parseNonNegativeNumber(longueurStr);
  const A = parseNonNegativeNumber(ancrageStr);
  if (L == null && A == null) return null;
  const l = L ?? 0;
  const a = A ?? 0;
  if (kind === "EPINGLE") return l + 2 * a;
  return 2 * l + 2 * a;
}

function computeCadrePerimetre(
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

function buildInitialExtraBoxes(
  shouldHydrate: boolean,
  initial: Partial<TotalRowModalPayload> | undefined,
  initDia: number,
): ExtraBoxState[] {
  if (!shouldHydrate) return [];

  if (Array.isArray(initial?.extraBoxes) && initial.extraBoxes.length) {
    return initial.extraBoxes.map((b) =>
      createExtraBoxState(b.kind, initDia, {
        diametreMm: typeof b.diametreMm === "number" ? b.diametreMm : initDia,
        valueStr: b.n == null ? "0" : String(b.n),
        longueurStr: b.longueur == null ? "0" : String(b.longueur),
        ancrageStr: b.ancrage == null ? "0" : String(b.ancrage),
        perimetreStr: b.perimetre == null ? "0" : String(b.perimetre),
        espacementStr: b.espacement == null ? "0" : String(b.espacement),
        extraCalcMode: "ESPACEMENT",
        nbExtraStr: "0",
      }),
    );
  }

  const out: ExtraBoxState[] = [];

  if (initial?.epingle != null) {
    out.push(
      createExtraBoxState("EPINGLE", initDia, {
        valueStr: String(initial.epingle ?? 0),
      }),
    );
  }

  if (initial?.etriers != null) {
    out.push(
      createExtraBoxState("ETRIERS", initDia, {
        valueStr: String(initial.etriers ?? 0),
      }),
    );
  }

  return out;
}

function buildInitialFormes(
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

function buildInitialOrder(extraBoxesInit: ExtraBoxState[], formesInit: FormeState[]): Card[] {
  const out: Card[] = [];
  for (const b of extraBoxesInit) out.push({ kind: "EXTRA", id: b.id });
  for (const f of formesInit) out.push({ kind: "FORME", id: f.id });
  return out;
}

function insertCardAtEndOfCurrentPage(order: Card[], page: number, perPage: number, card: Card) {
  const prevTotalPages = Math.max(1, Math.ceil(order.length / perPage));
  const currentPage = clamp(page, 1, prevTotalPages);

  const currentStart = (currentPage - 1) * perPage;
  const currentCount = order.slice(currentStart, currentStart + perPage).length;

  const insertIndex = currentStart + currentCount;
  const nextOrder = [...order.slice(0, insertIndex), card, ...order.slice(insertIndex)];

  const nextTotalPages = Math.max(1, Math.ceil(nextOrder.length / perPage));
  const nextPage = clamp(Math.floor(insertIndex / perPage) + 1, 1, nextTotalPages);

  return { nextOrder, nextPage };
}

export default function TotalRowModalWindowInner({
  open,
  title,
  submitLabel,
  inputClass,
  mms,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  inputClass: string;
  mms: number[];
  initial?: Partial<TotalRowModalPayload>;
  onClose: () => void;
  onSubmit: (payload: TotalRowModalPayload) => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const FORMS_PER_PAGE = 3;
  const twoColGrid = "grid grid-cols-1 sm:grid-cols-2 gap-4";

  const safeMms = useMemo(() => {
    const arr = Array.isArray(mms) ? [...mms] : [];
    const uniq = Array.from(new Set(arr.filter((x) => Number.isFinite(x))));
    uniq.sort((a, b) => a - b);
    return uniq.length ? uniq : [6, 8, 10, 12, 14, 16, 20];
  }, [mms]);

  const initDia = useMemo(() => {
    const d = initial?.diametreMm;
    if (typeof d === "number" && safeMms.includes(d)) return d;
    return safeMms[0] ?? 6;
  }, [initial?.diametreMm, safeMms]);

  const shouldHydrate = useMemo(() => {
    const d = (initial?.designation ?? "").trim();
    const t = (initial?.typeName ?? "").trim();
    const initialRaw = asObjectRecord(initial);

    const anyNumbers =
      initial?.nb != null ||
      initial?.hauteur != null ||
      initial?.epingle != null ||
      initial?.etriers != null ||
      initial?.ancrage != null ||
      initial?.attenteBarre != null ||
      initial?.nBarre != null ||
      initial?.longueur != null ||
      initial?.largeur != null ||
      initial?.rayon != null ||
      initial?.perimetre != null ||
      initial?.espacement != null ||
      initial?.slabSurface != null ||
      initial?.slabQtePerM2 != null;

    const anyAdvancedFormState = hasAnyValue(initialRaw, [
      "semelleRelation",
      "semelleLongueurAStr",
      "semelleLongueurBStr",
      "semelleNBarreAStr",
      "semelleNBarreBStr",
      "semelleDiametreAMm",
      "semelleDiametreBMm",
      "slabRelation",
      "slabSpacingMode",
      "slabSpacingRelation",
      "slabLongueurAStr",
      "slabLongueurBStr",
      "slabDiametreAMm",
      "slabDiametreBMm",
      "slabNBarreAStr",
      "slabNBarreBStr",
      "slabEspacementAStr",
      "slabEspacementBStr",
      "slabNbCadreAStr",
      "slabNbCadreBStr",
    ]);

    const anyExtra = (initial?.extraFormes?.length ?? 0) > 0;
    const anyExtraBoxes = (initial?.extraBoxes?.length ?? 0) > 0;

    return !!(d || t || anyNumbers || anyAdvancedFormState || anyExtra || anyExtraBoxes);
  }, [initial]);

  const [designation, setDesignation] = useState(() => initial?.designation ?? "");
  const [nomenclature, setNomenclature] = useState(() => initial?.typeName ?? "");
  const [nbStr, setNbStr] = useState(() => (initial?.nb == null ? "0" : String(initial.nb)));
  const [hauteurStr, setHauteurStr] = useState(() => (initial?.hauteur == null ? "0" : String(initial.hauteur)));
  const [showAbbreviationHelp, setShowAbbreviationHelp] = useState(false);

  const isAbbreviationHelpOpen = open && showAbbreviationHelp;

  const [st, setSt] = useState<ModalState>(() => {
    const extraBoxesInit = buildInitialExtraBoxes(shouldHydrate, initial, initDia);
    const formesInit = buildInitialFormes(shouldHydrate, initial, initDia);
    const orderInit = buildInitialOrder(extraBoxesInit, formesInit);
    return { extraBoxes: extraBoxesInit, formes: formesInit, cardOrder: orderInit, page: 1 };
  });

  const extraBoxes = st.extraBoxes;
  const formes = st.formes;
  const cards = st.cardOrder;

  const normalizedDesignation = normalizeDesignation(designation);
  const isSemellesDesignation = normalizedDesignation === "semelles";
  const isSlabDesignation = isSlabDesignationValue(designation);
  const showHauteurField = !isSlabDesignation;

  const extraMap = useMemo(() => new Map(extraBoxes.map((b) => [b.id, b] as const)), [extraBoxes]);
  const formesMap = useMemo(() => new Map(formes.map((f) => [f.id, f] as const)), [formes]);

  const extraMeta = useMemo(() => {
    const countByKind: Record<ExtraBoxKind, number> = { EPINGLE: 0, ETRIERS: 0 };
    const indexById = new Map<string, number>();

    for (const b of extraBoxes) {
      countByKind[b.kind] += 1;
      indexById.set(b.id, countByKind[b.kind]);
    }

    return { countByKind, indexById };
  }, [extraBoxes]);

  const formeMeta = useMemo(() => {
    const barreIndexById = new Map<string, number>();
    const cadreIndexById = new Map<string, number>();

    let b = 0;
    let c = 0;

    for (const f of formes) {
      if (f.forme === "BARRE") {
        b += 1;
        barreIndexById.set(f.id, b);
      } else {
        c += 1;
        cadreIndexById.set(f.id, c);
      }
    }

    return {
      totalBarres: b,
      totalCadres: c,
      barreIndexById,
      cadreIndexById,
    };
  }, [formes]);

  const barreLitIndexById = useMemo(() => {
    const tracked = new Set(["Acier inférieur", "Acier supérieur", "Chapeau"]);
    const counts = new Map<string, number>();
    const indexById = new Map<string, number>();

    for (const f of formes) {
      if (f.forme !== "BARRE") continue;

      const cat = asTrimmedString(f.barreCategorie, "");
      if (!tracked.has(cat)) continue;

      const next = (counts.get(cat) ?? 0) + 1;
      counts.set(cat, next);
      indexById.set(f.id, next);
    }

    return indexById;
  }, [formes]);

  const usesLongueurLabel = useMemo(() => {
    const v = (designation ?? "").trim().toLowerCase();
    return ["longrines", "raidisseurs", "linteaux", "chaînages", "poutres", "nervures"].includes(v);
  }, [designation]);

  const usesTopLongueurLabel = useMemo(() => {
    const v = (designation ?? "").trim().toLowerCase();
    return ["longrines", "raidisseurs", "linteaux", "chaînages", "poutres", "nervures", "semelles"].includes(v);
  }, [designation]);

  const hauteurLabel = usesTopLongueurLabel ? "Longueur (m)" : "Hauteur";
  const hauteurPlaceholder = usesTopLongueurLabel ? "Ex: 6,5" : "Ex: 2.8";

  const totalCount = cards.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / FORMS_PER_PAGE)), [totalCount]);

  const safePage = useMemo(() => clamp(st.page, 1, totalPages), [st.page, totalPages]);

  const handlePageChange = (p: number) => {
    setSt((prev) => {
      const tp = Math.max(1, Math.ceil(prev.cardOrder.length / FORMS_PER_PAGE));
      return { ...prev, page: clamp(p, 1, tp) };
    });
  };

  const pageStart = (safePage - 1) * FORMS_PER_PAGE;
  const visibleCards = cards.slice(pageStart, pageStart + FORMS_PER_PAGE);

  const addExtraBox = (kind: ExtraBoxKind) => {
    const nextBox = createExtraBoxState(kind, initDia);

    setSt((prev) => {
      const nextBoxes = [...prev.extraBoxes, nextBox];
      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, {
        kind: "EXTRA",
        id: nextBox.id,
      });

      return {
        ...prev,
        extraBoxes: nextBoxes,
        cardOrder: nextOrder,
        page: nextPage,
      };
    });
  };

  const updateExtraBox = (id: string, patch: Partial<ExtraBoxState>) => {
    setSt((prev) => ({
      ...prev,
      extraBoxes: prev.extraBoxes.map((b) => (b.id === id ? mergeExtraBoxState(b, patch, initDia) : b)),
    }));
  };

  const removeExtraBox = (id: string) => {
    setSt((prev) => {
      const nextBoxes = prev.extraBoxes.filter((b) => b.id !== id);
      const nextOrder = prev.cardOrder.filter((c) => !(c.kind === "EXTRA" && c.id === id));
      const tp = Math.max(1, Math.ceil(nextOrder.length / FORMS_PER_PAGE));

      return {
        ...prev,
        extraBoxes: nextBoxes,
        cardOrder: nextOrder,
        page: clamp(prev.page, 1, tp),
      };
    });
  };

  const updateForme = (id: string, patch: Partial<FormeState>) => {
    setSt((prev) => ({
      ...prev,
      formes: prev.formes.map((x) => (x.id === id ? mergeFormeState(x, patch, initDia) : x)),
    }));
  };

  const setFormeSafe = (id: string, next: FormeKind) => {
    setSt((prev) => ({
      ...prev,
      formes: prev.formes.map((x) => (x.id === id ? mergeFormeState(x, { forme: next }, initDia) : x)),
    }));
  };

  const removeForme = (id: string) => {
    setSt((prev) => {
      const nextFormes = prev.formes.filter((x) => x.id !== id);
      const nextOrder = prev.cardOrder.filter((c) => !(c.kind === "FORME" && c.id === id));
      const tp = Math.max(1, Math.ceil(nextOrder.length / FORMS_PER_PAGE));

      return {
        ...prev,
        formes: nextFormes,
        cardOrder: nextOrder,
        page: clamp(prev.page, 1, tp),
      };
    });
  };

  const addCadre = () => {
    setSt((prev) => {
      const last = prev.formes[prev.formes.length - 1];
      const nextForme: FormeKind = last && last.forme !== "BARRE" && isFormeKind(last.forme) ? last.forme : "CARRE";
      const nextItem = createFormeState(nextForme, initDia, {
        diametreMm:
          typeof last?.diametreMm === "number" && Number.isFinite(last.diametreMm) ? last.diametreMm : initDia,
      });

      const nextFormes = [...prev.formes, nextItem];
      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, {
        kind: "FORME",
        id: nextItem.id,
      });

      return {
        ...prev,
        formes: nextFormes,
        cardOrder: nextOrder,
        page: nextPage,
      };
    });
  };

  const addBarre = () => {
    setSt((prev) => {
      const nextItem = createFormeState("BARRE", initDia);
      const nextFormes = [...prev.formes, nextItem];

      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, {
        kind: "FORME",
        id: nextItem.id,
      });

      return {
        ...prev,
        formes: nextFormes,
        cardOrder: nextOrder,
        page: nextPage,
      };
    });
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const closeOnBackdrop = (ev: ReactMouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  const designationOk = (designation ?? "").trim().length > 0;
  const formesOk =
    formes.length > 0 &&
    formes.every((x) => {
      const forme = isFormeKind(x.forme) ? x.forme : "BARRE";

      if (forme === "BARRE" && isSemellesDesignation) {
        return isSemelleBarreValid(x);
      }

      if (forme === "BARRE" && isSlabDesignation) {
        return isSlabBarreValid(x);
      }

      return formeValid(
        forme,
        asString(x.nBarreStr),
        asString(x.longueurStr),
        asString(x.largeurStr),
        asString(x.rayonStr),
      );
    });

  const canSubmit = designationOk && formesOk;

  const recap: RecapData = useMemo(() => {
    const nb = parsePositiveInt(nbStr) ?? 0;
    const h = showHauteurField ? parsePositiveNumber(hauteurStr) ?? 0 : 0;
    const isSemellesDesignationInner = normalizeDesignation(designation) === "semelles";
    const isSlabDesignationInner = isSlabDesignationValue(designation);

    const linesCadres: RecapData["linesCadres"] = [];
    const linesBarres: RecapData["linesBarres"] = [];
    const linesExtras: RecapData["linesExtras"] = [];

    const qtyByDia = new Map<number, number>();

    const addQty = (dia: number | null, qtyM: number) => {
      if (dia == null) return;
      if (!Number.isFinite(qtyM)) return;
      qtyByDia.set(dia, (qtyByDia.get(dia) ?? 0) + qtyM);
    };

    for (const f of formes) {
      const forme = isFormeKind(f.forme) ? f.forme : "BARRE";
      const dia = typeof f.diametreMm === "number" && Number.isFinite(f.diametreMm) ? f.diametreMm : initDia;

      if (forme === "BARRE") {
        if (isSlabDesignationInner) {
          const calcMethod = asSlabCalcMethod(f.slabCalcMethod);
          const relation = asSlabRelation(f.slabRelation);
          const spacingMode = asSlabSpacingMode(f.slabSpacingMode);
          const spacingRelation = asSlabSpacingRelation(f.slabSpacingRelation);
          const steelType = asTrimmedString(f.barreCategorie, "") || undefined;

          const specialSpacingMetrics = computeSpecialSlabSpacingRecapMetrics({
            nbStr,
            longueurBarreStr: asString(f.slabLongueurAStr),
            ancrageStr: asString(f.ancrageStr),
            spacingMode,
            spacingRelation: normalizeSlabSpacingRelationValue(spacingRelation),
            calcMethod,
            relation,
            spacingAStr: asString(f.slabEspacementAStr),
            spacingBStr: asString(f.slabEspacementBStr),
          });

          if (specialSpacingMetrics) {
            const nt = specialSpacingMetrics.nt;
            const qtyM = specialSpacingMetrics.qtyM;
            const cutLenM = nt > 0 ? qtyM / nt : 0;

            linesBarres.push({
              key: f.id,
              label: "N.T.Barre",
              dia,
              qtyM: qtyM > 0 ? qtyM : 0,
              nt: nt > 0 ? nt : 0,
              cutLenM: cutLenM > 0 ? cutLenM : 0,
              steelType,
              litLabel: "Surface totale",
            });

            addQty(dia, qtyM > 0 ? qtyM : 0);
            continue;
          }

          const qtyM = computeSlabQte(
            calcMethod,
            asString(f.slabSurfaceStr),
            asString(f.slabQtePerM2Str),
          );
          const methodLabel =
            calcMethod === "SURFACE_TOTAL_PER_M2" ? "Surface totale / m²" : "Surface totale";

          linesBarres.push({
            key: f.id,
            label: "Q. Fer",
            dia,
            qtyM: qtyM > 0 ? qtyM : 0,
            nt: 0,
            cutLenM: 0,
            steelType,
            litLabel: methodLabel,
          });

          addQty(dia, qtyM > 0 ? qtyM : 0);
          continue;
        }

        if (isSemellesDesignationInner) {
          const semelleNappe = asTrimmedString(f.barreCategorie, "");
          const isChaise = semelleNappe === "Chaise";
          const relation = asSemelleRelation(f.semelleRelation);
          const semelleAncrage = isChaise ? 0 : parseNonNegativeNumber(asString(f.ancrageStr)) ?? 0;

          const pushSemelleLine = (
            suffix: "a" | "b",
            lineDia: number | null,
            nt: number,
            qtyM: number,
            cutLenM: number,
          ) => {
            const safeNt = nt > 0 ? nt : 0;
            const safeQty = qtyM > 0 ? qtyM : 0;

            linesBarres.push({
              key: `${f.id}:${suffix}`,
              label: suffix === "a" ? "N.T.Barre (a)" : "N.T.Barre (b)",
              dia: lineDia,
              qtyM: safeQty,
              nt: safeNt,
              cutLenM: cutLenM > 0 ? cutLenM : 0,
            });

            addQty(lineDia, safeQty);
          };

          if (isChaise) {
            const n = parseNonNegativeInt(asString(f.nBarreStr)) ?? 0;
            const longueur = parseNonNegativeNumber(asString(f.longueurStr)) ?? 0;
            const nt = nb * n;
            const qtyM = nb * (n * longueur);

            linesBarres.push({
              key: `${f.id}:a`,
              label: "N.T.Barre (a)",
              dia,
              qtyM: qtyM > 0 ? qtyM : 0,
              nt: nt > 0 ? nt : 0,
              cutLenM: longueur > 0 ? longueur : 0,
            });

            addQty(dia, qtyM > 0 ? qtyM : 0);
            continue;
          }

          const isEqualDual = relation === "ab_equal_diff_if";
          const isDiffDual = relation === "ab_diff_diff_if";
          const isDiffShared = relation === "ab_diff_same_if";

          if (isEqualDual || isDiffDual) {
            const diaA =
              typeof f.semelleDiametreAMm === "number" && Number.isFinite(f.semelleDiametreAMm)
                ? f.semelleDiametreAMm
                : dia;

            const diaB =
              typeof f.semelleDiametreBMm === "number" && Number.isFinite(f.semelleDiametreBMm)
                ? f.semelleDiametreBMm
                : dia;

            const nA = parseNonNegativeInt(asString(f.semelleNBarreAStr)) ?? 0;
            const nB = parseNonNegativeInt(asString(f.semelleNBarreBStr)) ?? 0;

            const longueurA = parseNonNegativeNumber(asString(f.semelleLongueurAStr)) ?? 0;
            const longueurB =
              isEqualDual
                ? longueurA
                : parseNonNegativeNumber(asString(f.semelleLongueurBStr)) ?? 0;

            const ntA = nb * nA;
            const ntB = nb * nB;

            const cutLenA = longueurA + semelleAncrage;
            const cutLenB = longueurB + semelleAncrage;

            const qtyA = ntA * cutLenA;
            const qtyB = ntB * cutLenB;

            pushSemelleLine("a", diaA, ntA, qtyA, cutLenA);
            pushSemelleLine("b", diaB, ntB, qtyB, cutLenB);
            continue;
          }

          const totalN = parseNonNegativeInt(asString(f.nBarreStr)) ?? 0;
          const longueurA = parseNonNegativeNumber(asString(f.semelleLongueurAStr)) ?? 0;
          const longueurB = parseNonNegativeNumber(asString(f.semelleLongueurBStr)) ?? 0;

          const effectiveLength = isDiffShared ? (longueurA + longueurB) / 2 : longueurA;
          const nt = nb * totalN;
          const cutLen = effectiveLength + semelleAncrage;
          const qtyM = nt * cutLen;

          linesBarres.push({
            key: `${f.id}:ab`,
            label: "N.T.Barre (a et b)",
            dia,
            qtyM: qtyM > 0 ? qtyM : 0,
            nt: nt > 0 ? nt : 0,
            cutLenM: cutLen > 0 ? cutLen : 0,
          });

          addQty(dia, qtyM > 0 ? qtyM : 0);
          continue;
        }

        const n = parseNonNegativeInt(asString(f.nBarreStr)) ?? 0;
        const anc = parseNonNegativeNumber(asString(f.ancrageStr)) ?? 0;
        const att = parseNonNegativeNumber(asString(f.attenteStr)) ?? 0;
        const barLen = parseNonNegativeNumber(asString(f.longueurStr)) ?? 0;

        const nt = nb * n;
        const qtyM = usesLongueurLabel ? nb * (n * (barLen + anc)) : nb * (n * (h + att + anc));
        const safeNt = nt > 0 ? nt : 0;
        const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

        const steelTypeRaw = asTrimmedString(f.barreCategorie, "");
        const steelType = usesLongueurLabel && steelTypeRaw ? steelTypeRaw : undefined;

        const litIndex = usesLongueurLabel ? barreLitIndexById.get(f.id) : undefined;
        const litLabel = litIndex != null ? `Lit ${litIndex}` : undefined;

        linesBarres.push({
          key: f.id,
          label: "N.T.Barre",
          dia,
          qtyM: qtyM > 0 ? qtyM : 0,
          nt: nt > 0 ? nt : 0,
          cutLenM: cutLenM > 0 ? cutLenM : 0,
          steelType,
          litLabel,
        });

        addQty(dia, qtyM > 0 ? qtyM : 0);
        continue;
      }

      const per =
        computeCadrePerimetre(
          forme,
          asString(f.longueurStr),
          asString(f.largeurStr),
          asString(f.rayonStr),
          asString(f.ancrageStr),
        ) ?? 0;

      const calcMode = f.cadreCalcMode === "NB_CADRE" ? "NB_CADRE" : "ESPACEMENT";
      const nbCadre = parseNonNegativeInt(asString(f.nbCadreStr)) ?? 0;
      const esp = parsePositiveNumber(asString(f.espacementStr)) ?? 0;

      const ratio = calcMode === "NB_CADRE" ? nbCadre : esp > 0 ? h / esp : 0;
      const nt = nb * ratio;
      const qtyM = nb * per * ratio;
      const safeNt = nt > 0 ? nt : 0;
      const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

      const ntLabel =
        forme === "CARRE"
          ? "N.T.C. Carré"
          : forme === "CIRCULAIRE"
            ? "N.T.C. Circulaire"
            : forme === "RECTANGULAIRE"
              ? "N.T.C. Rectangulaire"
              : "N.T.C.";

      linesCadres.push({
        key: f.id,
        label: ntLabel,
        dia,
        qtyM: qtyM > 0 ? qtyM : 0,
        nt: nt > 0 ? nt : 0,
        cutLenM: cutLenM > 0 ? cutLenM : 0,
      });

      addQty(dia, qtyM > 0 ? qtyM : 0);
    }

    for (const b of extraBoxes) {
      const n = parseNonNegativeInt(asString(b.valueStr)) ?? 0;
      const per = computeExtraPerimetre(b.kind, asString(b.longueurStr), asString(b.ancrageStr)) ?? 0;
      const calcMode = b.extraCalcMode === "NB" ? "NB" : "ESPACEMENT";
      const nbExtra = parseNonNegativeInt(asString(b.nbExtraStr)) ?? 0;
      const esp = parsePositiveNumber(asString(b.espacementStr)) ?? 0;

      const ratio = calcMode === "NB" ? nbExtra : esp > 0 ? h / esp : 0;
      const nt = nb * ratio;
      const qtyM = n * per * nt;
      const safeNt = nt > 0 ? nt : 0;
      const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

      const ntLabel = b.kind === "EPINGLE" ? "N.T.Épingle" : "N.T.Étriers";

      linesExtras.push({
        key: b.id,
        label: ntLabel,
        dia: b.diametreMm,
        qtyM: qtyM > 0 ? qtyM : 0,
        nt: nt > 0 ? nt : 0,
        cutLenM: cutLenM > 0 ? cutLenM : 0,
      });

      addQty(b.diametreMm, qtyM > 0 ? qtyM : 0);
    }

    const totals = Array.from(qtyByDia.entries())
      .filter(([, v]) => Number.isFinite(v) && v > 0)
      .sort((a, b) => a[0] - b[0])
      .map(([diaKey, v]) => ({ dia: diaKey, qtyM: v }));

    return { totals, linesCadres, linesBarres, linesExtras };
  }, [extraBoxes, formes, nbStr, hauteurStr, designation, usesLongueurLabel, barreLitIndexById, initDia, showHauteurField]);

  const submit = () => {
    if (!canSubmit) return;

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
    if (!main) return;

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

    onSubmit({
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
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-[95%] h-[90vh] max-h-[90vh] min-h-0 flex gap-4 items-stretch overflow-hidden"
        >
          <RecapPanel
            designation={designation}
            typeName={nomenclature}
            nbStr={nbStr}
            hauteurStr={showHauteurField ? hauteurStr : "0"}
            enrobageStr="0"
            recap={recap}
          />

          <div className="flex-1 min-h-0 max-h-full rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="text-sm font-semibold text-gray-900">{title}</div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  title="Fermer"
                  className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform"
                >
                  <CiCircleRemove size={26} />
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-1 min-h-0 flex-col overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
                <div className="flex flex-col md:col-span-4">
                  <DesignationDropdown label="Designations" value={designation} onChange={setDesignation} />
                </div>

                <div className="flex flex-col md:col-span-3">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Nomenclature</label>
                  <input
                    className={inputClass}
                    value={nomenclature}
                    onChange={(e) => setNomenclature(e.target.value)}
                    placeholder="Ex: Code nomenclature"
                  />
                </div>

                <div className={`flex flex-col ${showHauteurField ? "md:col-span-2" : "md:col-span-5"}`}>
                  <label className="text-sm font-semibold text-gray-700 mb-1">NB</label>
                  <input
                    className={inputClass}
                    value={nbStr}
                    onChange={(e) => setNbStr(e.target.value)}
                    placeholder="Ex: 1"
                    inputMode="numeric"
                  />
                </div>

                {showHauteurField ? (
                  <div className="flex flex-col md:col-span-3">
                    <label className="text-sm font-semibold text-gray-700 mb-1">{hauteurLabel}</label>
                    <input
                      className={inputClass}
                      value={hauteurStr}
                      onChange={(e) => setHauteurStr(e.target.value)}
                      placeholder={hauteurPlaceholder}
                      inputMode="decimal"
                    />
                  </div>
                ) : null}

                <div className="md:col-span-12 flex justify-between border-t border-gray-200 pt-3">
                  <DotsPagination currentPage={safePage} totalPages={totalPages} onPageChange={handlePageChange} />
                  <AddPlusDropdown
                    onAddCadre={addCadre}
                    onAddBarre={addBarre}
                    onAddEpingle={() => addExtraBox("EPINGLE")}
                    onAddEtriers={() => addExtraBox("ETRIERS")}
                  />
                </div>
              </div>

              <div className="mt-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 content-start">
                  {visibleCards.map((c) => {
                    if (c.kind === "EXTRA") {
                      const b = extraMap.get(c.id);
                      if (!b) return null;

                      const idx = extraMeta.indexById.get(b.id) ?? 1;
                      const totalForKind = extraMeta.countByKind[b.kind];
                      const titleLabel =
                        totalForKind > 1
                          ? `${b.kind === "EPINGLE" ? "Épingle" : "Étriers"} ${idx}`
                          : b.kind === "EPINGLE"
                            ? "Épingle"
                            : "Étriers";

                      return (
                        <ExtraBoxCard
                          key={b.id}
                          b={b}
                          titleLabel={titleLabel}
                          designation={designation}
                          safeMms={safeMms}
                          inputClass={inputClass}
                          twoColGrid={twoColGrid}
                          nbStr={nbStr}
                          hauteurStr={showHauteurField ? hauteurStr : "0"}
                          onUpdate={(patch) => updateExtraBox(b.id, patch)}
                          onRemove={() => removeExtraBox(b.id)}
                        />
                      );
                    }

                    const x = formesMap.get(c.id);
                    if (!x) return null;

                    const isBarre = x.forme === "BARRE";
                    const idx = isBarre ? formeMeta.barreIndexById.get(x.id) ?? 1 : formeMeta.cadreIndexById.get(x.id) ?? 1;

                    const label = isBarre
                      ? formeMeta.totalBarres > 1
                        ? `Barre ${idx}`
                        : "Barre"
                      : formeMeta.totalCadres > 1
                        ? `Cadre ${idx}`
                        : "Cadre";

                    if (isBarre) {
                      return (
                        <div
                          key={x.id}
                          className={["h-140 md:col-span-4 rounded-lg min-h-12.5 border p-4", "border-slate-200 bg-slate-50/60"].join(" ")}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold text-slate-900">{label}</div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:cursor-pointer transition-colors"
                                onClick={() => setShowAbbreviationHelp(true)}
                                title="Afficher les abréviations"
                                aria-label="Afficher les abréviations"
                              >
                                <IoInformationCircleOutline size={28} />
                              </button>

                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 hover:cursor-pointer"
                                onClick={() => removeForme(x.id)}
                                title="Supprimer"
                                aria-label="Supprimer"
                              >
                                <CiCircleRemove size={28} />
                              </button>
                            </div>
                          </div>

                          <FormeBarre
                            x={x}
                            designation={designation}
                            safeMms={safeMms}
                            inputClass={inputClass}
                            twoColGrid={twoColGrid}
                            nbStr={nbStr}
                            hauteurStr={showHauteurField ? hauteurStr : "0"}
                            barreLitIndex={barreLitIndexById.get(x.id) ?? null}
                            onPatch={(patch) => updateForme(x.id, patch)}
                          />
                        </div>
                      );
                    }

                    const currentCadreForme: FormeKind = isFormeKind(x.forme) ? x.forme : "CARRE";

                    return (
                      <FormeCard
                        key={x.id}
                        x={x}
                        cadreLabel={label}
                        safeMms={safeMms}
                        inputClass={inputClass}
                        twoColGrid={twoColGrid}
                        nbStr={nbStr}
                        hauteurStr={showHauteurField ? hauteurStr : "0"}
                        onRemove={() => removeForme(x.id)}
                        onSetForme={(v) => setFormeSafe(x.id, isFormeKind(v) ? v : currentCadreForme)}
                        onPatch={(patch) => updateForme(x.id, patch)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              className="
                rounded-b-xl bg-gray-50
                border-t border-slate-900/10
                px-3.5 pt-2.5 pb-3.5
                flex items-center justify-between gap-3 shrink-0
              "
              aria-label="Actions du formulaire"
            >
              <div className="flex items-center justify-start gap-2 flex-1">
                <button type="button" className="stepper__nav" onClick={onClose}>
                  Annuler
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
                <button type="button" className="stepper__nav" onClick={submit} disabled={!canSubmit} aria-disabled={!canSubmit}>
                  {submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FormeBarreAbbreviationsModal
        open={isAbbreviationHelpOpen}
        onClose={() => setShowAbbreviationHelp(false)}
      />
    </div>,
    document.body,
  );
}
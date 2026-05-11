import type {
  ExtraFormePayload,
  FormeKind,
  PersistedRecapData,
  PersistedRecapLine,
  TotalRowModalPayload,
} from "../types";
import { computeFinalBarreQte } from "../calculations/barreCalculations";
import {
  BARRE_DESIGNATIONS,
  shouldShowStandardBarreAncrageField,
} from "../config/formeBarreOptions";
import { shouldUseSimpleBarreLayout } from "./barreModes";
import {
  asTrimmedString,
  isFormeKind,
  isSlabDesignationValue,
  normalizeDesignation,
} from "./guards";

type BarrePayloadSource = Partial<ExtraFormePayload> & {
  forme?: FormeKind | null;
};

const FINAL_Q_FER_KEYS = [
  "qFer",
  "q_fer",
  "quantiteFer",
  "quantitesFer",
  "quantite",
] as const;

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveNumber(value: unknown) {
  const n = finiteNumber(value);
  return n != null && n > 0 ? n : 0;
}

function numberString(value: unknown) {
  const n = finiteNumber(value);
  return n == null ? "0" : String(n);
}

function readStoredFinalQFer(source: Record<string, unknown>) {
  for (const key of FINAL_Q_FER_KEYS) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const parsed = Number(value.trim().replace(",", "."));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function hasAnyQuantityInput(payload: Partial<TotalRowModalPayload>, source: BarrePayloadSource) {
  return [
    payload.nb,
    payload.hauteur,
    source.nBarre,
    source.longueur,
    source.attenteBarre,
    source.ancrage,
  ].some((value) => finiteNumber(value) != null);
}

function isBarreOptionsDesignation(designation: unknown) {
  const normalizedDesignation = normalizeDesignation(designation);
  return BARRE_DESIGNATIONS.includes(
    normalizedDesignation as (typeof BARRE_DESIGNATIONS)[number],
  );
}

function isPairStart(lines: PersistedRecapLine[], index: number) {
  const current = lines[index];
  const next = lines[index + 1];
  if (!current || !next) return false;

  const currentBase = getLineBaseKey(current.key);
  const nextBase = getLineBaseKey(next.key);

  return current.key !== next.key && currentBase === nextBase;
}

function getLineBaseKey(key: string) {
  const idx = key.lastIndexOf(":");
  return idx >= 0 ? key.slice(0, idx) : key;
}

function advanceBarreLineGroup(lines: PersistedRecapLine[], index: number) {
  if (index >= lines.length) return index;
  return isPairStart(lines, index) ? index + 2 : index + 1;
}

function cloneLine(line: PersistedRecapLine): PersistedRecapLine {
  return {
    ...line,
    dia: finiteNumber(line.dia),
    qtyM: positiveNumber(line.qtyM),
    nt: positiveNumber(line.nt),
    cutLenM: positiveNumber(line.cutLenM),
  };
}

function clonePersistedRecap(recap: PersistedRecapData): PersistedRecapData {
  return {
    totals: (recap.totals ?? [])
      .filter((entry) => finiteNumber(entry.dia) != null)
      .map((entry) => ({
        dia: finiteNumber(entry.dia) ?? 0,
        qtyM: positiveNumber(entry.qtyM),
      })),
    linesCadres: (recap.linesCadres ?? []).map(cloneLine),
    linesBarres: (recap.linesBarres ?? []).map(cloneLine),
    linesExtras: (recap.linesExtras ?? []).map(cloneLine),
  };
}

function getBarreSources(payload: Partial<TotalRowModalPayload>): BarrePayloadSource[] {
  const sources: BarrePayloadSource[] = [];
  const mainForme = isFormeKind(payload.forme) ? payload.forme : "BARRE";

  sources.push({
    ...payload,
    forme: mainForme,
  });

  for (const extra of payload.extraFormes ?? []) {
    if (!isFormeKind(extra.forme)) continue;
    sources.push(extra);
  }

  return sources.filter((source) => source.forme === "BARRE");
}

function getFinalQFerFromBarrePayload(
  payload: Partial<TotalRowModalPayload>,
  source: BarrePayloadSource,
) {
  if (source.forme !== "BARRE") return null;

  const designation = payload.designation;
  const isSimpleBarreLayout = shouldUseSimpleBarreLayout({
    designation,
    forme: "BARRE",
    typeDeNappe: source.barreCategorie,
  });

  if (isSlabDesignationValue(designation) && !isSimpleBarreLayout) return null;

  const direct = readStoredFinalQFer(source as Record<string, unknown>);
  if (direct != null) return direct;
  if (!hasAnyQuantityInput(payload, source)) return null;

  const showBarreOptions = isSimpleBarreLayout || isBarreOptionsDesignation(designation);
  const barreCategorie = asTrimmedString(source.barreCategorie, "");
  const showAncrageField = isSimpleBarreLayout
    ? false
    : shouldShowStandardBarreAncrageField({
        isSemelle: false,
        isSlab: false,
        showBarreOptions,
        barreCategorie,
      });

  return computeFinalBarreQte({
    nbStr: numberString(payload.nb),
    nBarreStr: numberString(source.nBarre),
    hauteurStr: numberString(payload.hauteur),
    longueurStr: numberString(source.longueur),
    attenteStr: numberString(source.attenteBarre),
    ancrageStr: numberString(source.ancrage),
    showBarreOptions,
    showAncrageField,
  });
}

function rebuildTotalsFromLines(recap: PersistedRecapData) {
  const qtyByDia = new Map<number, number>();

  for (const line of [
    ...recap.linesCadres,
    ...recap.linesBarres,
    ...recap.linesExtras,
  ]) {
    if (line.dia == null || !Number.isFinite(line.qtyM) || line.qtyM <= 0) continue;
    qtyByDia.set(line.dia, (qtyByDia.get(line.dia) ?? 0) + line.qtyM);
  }

  return Array.from(qtyByDia.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dia, qtyM]) => ({ dia, qtyM }));
}

export function repairPersistedRecapQuantities(
  payload: Partial<TotalRowModalPayload> | null | undefined,
): PersistedRecapData | null {
  return repairPersistedRecapQuantitiesWithStatus(payload)?.recap ?? null;
}

export function repairPersistedRecapQuantitiesWithStatus(
  payload: Partial<TotalRowModalPayload> | null | undefined,
): { recap: PersistedRecapData; repaired: boolean } | null {
  const persistedRecap = payload?.persistedRecap;
  if (!persistedRecap) return null;

  const recap = clonePersistedRecap(persistedRecap);
  let lineIndex = 0;
  let repaired = false;

  for (const source of getBarreSources(payload)) {
    const finalQFer = getFinalQFerFromBarrePayload(payload, source);

    if (finalQFer == null) {
      lineIndex = advanceBarreLineGroup(recap.linesBarres, lineIndex);
      continue;
    }

    if (lineIndex >= recap.linesBarres.length) break;

    if (isPairStart(recap.linesBarres, lineIndex)) {
      lineIndex = advanceBarreLineGroup(recap.linesBarres, lineIndex);
      continue;
    }

    const line = recap.linesBarres[lineIndex];
    const nextQtyM = positiveNumber(finalQFer);

    if (line && line.qtyM !== nextQtyM) {
      recap.linesBarres[lineIndex] = {
        ...line,
        qtyM: nextQtyM,
      };
      repaired = true;
    }

    lineIndex = advanceBarreLineGroup(recap.linesBarres, lineIndex);
  }

  if (repaired) {
    recap.totals = rebuildTotalsFromLines(recap);
  }

  return { recap, repaired };
}

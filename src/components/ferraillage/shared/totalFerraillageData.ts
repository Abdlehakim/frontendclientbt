import type { FerProjectDetailDTO } from "@/lib/ferraillageApi";
import type { RowForme, TotalRowModalPayload } from "@/components/ferraillage/Edit/windows/TotalRowModalWindow";
import { repairPersistedRecapQuantitiesWithStatus } from "@/components/ferraillage/Edit/windows/totalRowModal/state/recapQuantityRepair";

export type TotalRow = {
  id: string;
  designation: string;
  typeName: string;
  forme: RowForme;
  nb: number | null;
  diametre: number;
  qtyByMm: Record<number, number>;
  poidsByMm: Record<number, number>;
  payload?: TotalRowModalPayload;
};

export type NiveauTotal = {
  id: string;
  niveauName: string;
  note: string;
  diametres: number[];
  sousTraitants: string[];
  rows: TotalRow[];
};

export type TotalFerraillageData = {
  rapportId: string;
  chantierName: string;
  responsable: string;
  acierType: string;
  note: string;
  niveaux: NiveauTotal[];
};

function normalizeByMmMap(values: Record<string, number> | null | undefined) {
  return Object.fromEntries(Object.entries(values ?? {}).map(([key, value]) => [Number(key), value]));
}

function kgPerMeter(mm: number) {
  return (mm * mm) / 162;
}

function applyRecapTotalsToQtyByMm(
  original: Record<number, number>,
  totals: Array<{ dia: number; qtyM: number }>,
) {
  const out: Record<number, number> = {};

  for (const key of Object.keys(original)) {
    const mm = Number(key);
    if (Number.isFinite(mm)) out[mm] = 0;
  }

  for (const entry of totals) {
    if (!Number.isFinite(entry.dia) || !Number.isFinite(entry.qtyM) || entry.qtyM <= 0) continue;
    out[entry.dia] = (out[entry.dia] ?? 0) + entry.qtyM;
  }

  return out;
}

function computePoidsByMmFromQty(qtyByMm: Record<number, number>, original: Record<number, number>) {
  const out: Record<number, number> = { ...original };

  for (const key of Object.keys(qtyByMm)) {
    const mm = Number(key);
    const qtyM = qtyByMm[mm] ?? 0;
    if (!Number.isFinite(mm) || !Number.isFinite(qtyM) || qtyM <= 0) {
      out[mm] = 0;
      continue;
    }

    out[mm] = (qtyM * kgPerMeter(mm)) / 1000;
  }

  return out;
}

export function buildTotalFerraillageData(project: FerProjectDetailDTO | null): TotalFerraillageData | null {
  if (!project) return null;

  return {
    rapportId: project.id,
    chantierName: project.chantierName ?? "",
    responsable: project.responsable ?? "",
    acierType: project.acierType ?? "",
    note: project.note ?? "",
    niveaux: (project.niveaux ?? []).map((niveau) => ({
      id: niveau.id,
      niveauName: niveau.name,
      note: niveau.note ?? "",
      diametres: [...(niveau.selectedMms ?? [])].sort((a, b) => a - b),
      sousTraitants: [...(niveau.sousTraitants ?? [])],
      rows: (niveau.lignes ?? []).map((ligne) => {
        const payload = ligne.payload as TotalRowModalPayload;
        const repairedRecapResult = repairPersistedRecapQuantitiesWithStatus(payload);
        const repairedRecap = repairedRecapResult?.recap ?? null;
        const originalQtyByMm = normalizeByMmMap(ligne.qtyByMm);
        const originalPoidsByMm = normalizeByMmMap(ligne.poidsByMm);
        const qtyByMm = repairedRecapResult?.repaired && repairedRecap
          ? applyRecapTotalsToQtyByMm(originalQtyByMm, repairedRecap.totals)
          : originalQtyByMm;
        const poidsByMm = repairedRecapResult?.repaired && repairedRecap
          ? computePoidsByMmFromQty(qtyByMm, originalPoidsByMm)
          : originalPoidsByMm;

        return {
          id: ligne.id,
          designation: ligne.designation,
          typeName: ligne.nomenclature ?? "",
          forme: (typeof ligne.forme === "string" && ligne.forme ? ligne.forme : "BARRE") as RowForme,
          nb: ligne.nb ?? null,
          diametre: ligne.diametreMm ?? 0,
          qtyByMm,
          poidsByMm,
          payload: repairedRecap ? { ...payload, persistedRecap: repairedRecap } : payload,
        };
      }),
    })),
  };
}

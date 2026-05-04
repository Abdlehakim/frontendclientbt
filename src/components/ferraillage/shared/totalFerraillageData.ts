import type { FerProjectDetailDTO } from "@/lib/ferraillageApi";
import type { RowForme, TotalRowModalPayload } from "@/components/ferraillage/Edit/windows/TotalRowModalWindow";

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
      rows: (niveau.lignes ?? []).map((ligne) => ({
        id: ligne.id,
        designation: ligne.designation,
        typeName: ligne.nomenclature ?? "",
        forme: (typeof ligne.forme === "string" && ligne.forme ? ligne.forme : "BARRE") as RowForme,
        nb: ligne.nb ?? null,
        diametre: ligne.diametreMm ?? 0,
        qtyByMm: normalizeByMmMap(ligne.qtyByMm),
        poidsByMm: normalizeByMmMap(ligne.poidsByMm),
        payload: ligne.payload as TotalRowModalPayload,
      })),
    })),
  };
}

// src/pages/tabs/CalculeTotalFerraillage.tsx
import { useMemo } from "react";

type TotalRow = {
  id: string;
  designation: string;
  nb: number | null;
  qtyByMm: Record<number, number>;
  poidsByMm: Record<number, number>;
};

type NiveauTotal = {
  id: string;
  niveauName: string;
  note: string;
  diametres: number[];
  sousTraitants: string[];
  rows: TotalRow[];
};

type TotalFerraillageData = {
  rapportId: string;
  chantierName: string;
  niveaux: NiveauTotal[];
};

type Totals = {
  qty: Record<number, number>;
  poids: Record<number, number>;
};

const EXAMPLE_TOTAL_FERRAILLAGE: TotalFerraillageData = {
  rapportId: "RAPPORT-001",
  chantierName: "Chantier A",
  niveaux: [
    {
      id: "niv-0",
      niveauName: "RDC",
      sousTraitants: ["SOTUMAG", "SOBAT", "SOTRAP"],
      note:
        "Villa R+1 (RDC). Superficie approximative : 190 m². Hauteur d’étage : 3,10 m. Structure : poteaux + poutres + dalle. Les “Quantités” représentent les longueurs totales en mètres (m) par diamètre, et la partie “Poids” représente les tonnages en tonnes (T) pour faciliter le suivi et l’estimation des besoins.",
      diametres: [6, 8, 10, 12, 14, 16, 20],
      rows: [
        {
          id: "rdc-r1",
          designation: "Semelles, Type A",
          nb: 12,
          qtyByMm: { 6: 44, 8: 62, 10: 18, 12: 0, 14: 0, 16: 0, 20: 0 },
          poidsByMm: { 6: 2657.6, 8: 3976, 10: 1413, 12: 0, 14: 0, 16: 0, 20: 0 },
        },
        {
          id: "rdc-r2",
          designation: "Longrines, Type 2",
          nb: 18,
          qtyByMm: { 6: 0, 8: 22, 10: 34, 12: 26, 14: 0, 16: 0, 20: 0 },
          poidsByMm: { 6: 0, 8: 1408, 10: 2669, 12: 1927.2, 14: 0, 16: 0, 20: 0 },
        },
        {
          id: "rdc-r3",
          designation: "Poteaux, Type 3",
          nb: 10,
          qtyByMm: { 6: 14, 8: 0, 10: 0, 12: 9.6, 14: 7.2, 16: 0, 20: 0 },
          poidsByMm: { 6: 845.6, 8: 0, 10: 0, 12: 579.8, 14: 435.4, 16: 0, 20: 0 },
        },
        {
          id: "rdc-r4",
          designation: "Dalle, Renforts locaux",
          nb: 1,
          qtyByMm: { 6: 0, 8: 0, 10: 0, 12: 6.2, 14: 5.5, 16: 6.8, 20: 2.2 },
          poidsByMm: { 6: 0, 8: 0, 10: 0, 12: 1128.4, 14: 1001, 16: 1237.6, 20: 220 },
        },
      ],
    },
    {
      id: "niv-1",
      niveauName: "Etage 1",
      sousTraitants: ["SOBAT", "SOTRAP"],
      note:
        "Villa R+1 (Etage 1). Superficie approximative : 180 m². Hauteur d’étage : 3,00 m. Structure : poteaux + poutres + dalle pleine, avec joints et renforts locaux. Zone étudiée : Etage 1 (hors fondations). Les “Quantités” représentent les longueurs totales en mètres (m) par diamètre (armatures principales + cadres/étriers), et la partie “Poids” représente les tonnages en tonnes (T) pour faciliter le suivi, le contrôle, l’estimation des besoins et la préparation des commandes.",
      diametres: [6, 8, 10, 12, 14, 16, 20],
      rows: [
        {
          id: "r1",
          designation: "Poteaux, Type 1",
          nb: 8,
          qtyByMm: { 6: 10, 8: 0, 10: 0, 12: 8, 14: 6, 16: 0, 20: 0 },
          poidsByMm: { 6: 604, 8: 0, 10: 0, 12: 483.2, 14: 362.4, 16: 0, 20: 0 },
        },
        {
          id: "r2",
          designation: "Poteaux, Type 10",
          nb: 8,
          qtyByMm: { 6: 20, 8: 0, 10: 0, 12: 0, 14: 12, 16: 0, 20: 0 },
          poidsByMm: { 6: 1208, 8: 0, 10: 0, 12: 0, 14: 724.8, 16: 0, 20: 0 },
        },
        {
          id: "r3",
          designation: "Poteaux, Type 22",
          nb: 10,
          qtyByMm: { 6: 32, 8: 0, 10: 0, 12: 16, 14: 0, 16: 0, 20: 0 },
          poidsByMm: { 6: 2416, 8: 0, 10: 0, 12: 1208, 14: 0, 16: 0, 20: 0 },
        },
        {
          id: "r4",
          designation: "Poteaux, Type 7",
          nb: 8,
          qtyByMm: { 6: 18, 8: 0, 10: 0, 12: 12, 14: 0, 16: 0, 20: 0 },
          poidsByMm: { 6: 1087.2, 8: 0, 10: 0, 12: 724.8, 14: 0, 16: 0, 20: 0 },
        },
        {
          id: "r5",
          designation: "Poteaux, Cadres Type 6",
          nb: 13,
          qtyByMm: { 6: 16, 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 20: 0 },
          poidsByMm: { 6: 1570.4, 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 20: 0 },
        },
        {
          id: "r6",
          designation: "Dalle, Joint 4",
          nb: 1,
          qtyByMm: { 6: 0, 8: 0, 10: 0, 12: 7.7, 14: 7.15, 16: 9.15, 20: 0 },
          poidsByMm: { 6: 0, 8: 0, 10: 0, 12: 1401.4, 14: 1301.3, 16: 1665.3, 20: 0 },
        },
        {
          id: "r7",
          designation: "Dalle, Joint 7",
          nb: 1,
          qtyByMm: { 6: 0, 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 20: 3.8 },
          poidsByMm: { 6: 0, 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 20: 380 },
        },
        {
          id: "r8",
          designation: "Dalle, Joint 8",
          nb: 1,
          qtyByMm: { 6: 0, 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 20: 4.3 },
          poidsByMm: { 6: 0, 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 20: 215 },
        },
      ],
    },
    {
      id: "niv-2",
      niveauName: "Etage 2",
      sousTraitants: ["SOTUMAG"],
      note:
        "Etage 2. Superficie approximative : 175 m². Hauteur d’étage : 2,95 m. Structure : poteaux + poutres + dalle. Les quantités sont des longueurs totales (m) par diamètre, et les poids sont fournis pour le suivi des tonnages (T).",
      diametres: [6, 8, 10, 12, 14, 16, 18, 20],
      rows: [
        {
          id: "e2-r1",
          designation: "Poutres, Type 1",
          nb: 22,
          qtyByMm: { 6: 0, 8: 16, 10: 24, 12: 19.5, 14: 0, 16: 0, 18: 0, 20: 0 },
          poidsByMm: { 6: 0, 8: 1024, 10: 1884, 12: 1444, 14: 0, 16: 0, 18: 0, 20: 0 },
        },
        {
          id: "e2-r2",
          designation: "Poteaux, Type 5",
          nb: 9,
          qtyByMm: { 6: 12, 8: 0, 10: 0, 12: 8.8, 14: 6.4, 16: 0, 18: 0, 20: 0 },
          poidsByMm: { 6: 724.8, 8: 0, 10: 0, 12: 531, 14: 387.2, 16: 0, 18: 0, 20: 0 },
        },
        {
          id: "e2-r3",
          designation: "Dalle, Renforts (zone escalier)",
          nb: 1,
          qtyByMm: { 6: 0, 8: 0, 10: 10.5, 12: 0, 14: 0, 16: 5.2, 18: 3.6, 20: 0 },
          poidsByMm: { 6: 0, 8: 0, 10: 824, 12: 0, 14: 0, 16: 946.4, 18: 648, 20: 0 },
        },
        {
          id: "e2-r4",
          designation: "Dalle, Joint 2",
          nb: 1,
          qtyByMm: { 6: 0, 8: 0, 10: 0, 12: 0, 14: 4.1, 16: 0, 18: 0, 20: 2.9 },
          poidsByMm: { 6: 0, 8: 0, 10: 0, 12: 0, 14: 747, 16: 0, 18: 0, 20: 290 },
        },
      ],
    },
  ],
};

function fmtNumTrim3(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  const fixed = v.toFixed(3).replace(".", ",");
  const [rawInt, rawDec = ""] = fixed.split(",");
  const intPart = rawInt === "-0" ? "0" : rawInt;
  const decPart = rawDec.replace(/0+$/g, "");
  if (!decPart) return intPart;
  return `${intPart},${decPart}`;
}

function cellVal(map: Record<number, number>, mm: number) {
  return fmtNumTrim3(map[mm] ?? 0);
}

function computeTotals(rows: TotalRow[], mms: number[]): Totals {
  const qty: Record<number, number> = {};
  const poids: Record<number, number> = {};
  for (const mm of mms) {
    qty[mm] = 0;
    poids[mm] = 0;
  }
  for (const r of rows) {
    for (const mm of mms) {
      qty[mm] += r.qtyByMm[mm] ?? 0;
      poids[mm] += r.poidsByMm[mm] ?? 0;
    }
  }
  return { qty, poids };
}

export default function CalculeTotalFerraillage() {
  const data = EXAMPLE_TOTAL_FERRAILLAGE;

  const allMms = useMemo(() => {
    const set = new Set<number>();
    for (const n of data.niveaux) for (const mm of n.diametres) set.add(mm);
    return Array.from(set).sort((a, b) => a - b);
  }, [data.niveaux]);

  return (
    <div className="flex flex-col gap-4">
      {data.niveaux.map((niv) => (
        <NiveauBlock key={niv.id} niveau={niv} />
      ))}
      <RecapByNiveau niveaux={data.niveaux} allMms={allMms} />
    </div>
  );
}

function RecapByNiveau({ niveaux, allMms }: { niveaux: NiveauTotal[]; allMms: number[] }) {
  const rows = useMemo(() => {
    return niveaux.map((n) => ({
      id: n.id,
      name: n.niveauName || "—",
      totals: computeTotals(n.rows, allMms),
    }));
  }, [niveaux, allMms]);

  const grandTotals = useMemo(() => {
    const allRows = niveaux.flatMap((n) => n.rows);
    return computeTotals(allRows, allMms);
  }, [niveaux, allMms]);

  const sumPoidsAll = useMemo(() => allMms.reduce((s, mm) => s + (grandTotals.poids[mm] ?? 0), 0), [allMms, grandTotals]);

  return (
    <div className="bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="w-full text-xl font-bold text-gray-900 text-center align-middle items-center uppercase">Récapitulatif par niveau</div>
      </div>

      <div className="p-4">
        <div className="relative overflow-auto">
          <table className="border-collapse table-fixed w-full min-w-350">
            <thead>
              <tr className="bg-emerald-700 text-white">
                <th className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-70" rowSpan={2}>
                  Niveau
                </th>
                <th className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={allMms.length}>
                  Quantités <span className="text-[10px] font-semibold normal-case">(en mètre)</span>
                </th>
                <th className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={allMms.length}>
                  Poids <span className="text-[10px] font-semibold normal-case">(en tonnes)</span>
                </th>
              </tr>

              <tr className="bg-emerald-700 text-white">
                {allMms.map((mm) => (
                  <th key={`rq-h-${mm}`} className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25">
                    Fer {mm} (m)
                  </th>
                ))}

                {allMms.map((mm, idx) => (
                  <th
                    key={`rp-h-${mm}`}
                    className={[
                      "py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25",
                      idx < allMms.length - 1 ? "border-r-2 border-emerald-600" : "",
                    ].join(" ")}
                  >
                    Fer {mm} (T)
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-emerald-50"}>
                  <td className="py-2 px-2 text-xs border-r-2 border-emerald-100">
                    <div className="whitespace-pre-wrap wrap-break-word font-semibold text-gray-900">{r.name}</div>
                  </td>

                  {allMms.map((mm) => (
                    <td key={`rq-${r.id}-${mm}`} className="py-2 text-center text-xs border-r-2 border-emerald-100">
                      {fmtNumTrim3(r.totals.qty[mm] ?? 0)}
                    </td>
                  ))}

                  {allMms.map((mm, i2) => (
                    <td
                      key={`rp-${r.id}-${mm}`}
                      className={["py-2 text-center text-xs", i2 < allMms.length - 1 ? "border-r-2 border-emerald-100" : ""].join(" ")}
                    >
                      {fmtNumTrim3(r.totals.poids[mm] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="bg-emerald-700 text-white">
                <td className="sticky bottom-0 z-30 bg-emerald-700 text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2 border-emerald-600">
                  Total global
                </td>

                {allMms.map((mm) => (
                  <td key={`gtq-${mm}`} className="sticky bottom-0 z-30 bg-emerald-700 text-white border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide">
                    {fmtNumTrim3(grandTotals.qty[mm] ?? 0)}
                  </td>
                ))}

                {allMms.map((mm, idx2) => (
                  <td
                    key={`gtp-${mm}`}
                    className={[
                      "sticky bottom-0 z-30 bg-emerald-700 text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide",
                      idx2 < allMms.length - 1 ? "border-r-2 border-emerald-600" : "",
                    ].join(" ")}
                  >
                    {fmtNumTrim3(grandTotals.poids[mm] ?? 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 border border-emerald-100">
            <span className="font-semibold">Total Poids (tous Ø)</span>
            <span>{fmtNumTrim3(sumPoidsAll)} T</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NiveauBlock({ niveau }: { niveau: NiveauTotal }) {
  const mms = useMemo(() => [...niveau.diametres].sort((a, b) => a - b), [niveau.diametres]);
  const totals = useMemo(() => computeTotals(niveau.rows, mms), [niveau.rows, mms]);

  return (
    <div className=" bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">Niveau :</span>
              <span className="text-xl font-semibold text-gray-900">{niveau.niveauName || "—"}</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="w-1/2 flex items-start gap-2 px-3 py-2">
              <span className="mt-0.5 inline-flex items-center rounded-md bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                Note
              </span>
              <div className="text-xs text-gray-700 leading-relaxed">{niveau.note || "—"}</div>
            </div>

            <div className="w-1/2 flex flex-col items-end gap-1 px-3 py-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-gray-900">Sous-traitants</span>

              {niveau.sousTraitants?.length ? (
                <ul className="list-disc list-inside text-xs text-gray-700 leading-relaxed space-y-0.5">
                  {niveau.sousTraitants.map((st) => (
                    <li key={st} className="wrap-break-word">
                      {st}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-700">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="relative overflow-auto">
          <table className="border-collapse table-fixed w-full min-w-350">
            <thead>
              <tr className="bg-(--primary) text-white">
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-70" rowSpan={2}>
                  Designations
                </th>

                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75" rowSpan={2}>
                  NB
                </th>

                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={mms.length}>
                  Quantités <span className="text-[10px] font-semibold normal-case">(en mètre)</span>
                </th>

                <th className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={mms.length}>
                  Poids <span className="text-[10px] font-semibold normal-case">(en tonnes)</span>
                </th>
              </tr>

              <tr className="bg-(--primary) text-white">
                {mms.map((mm) => (
                  <th key={`q-${mm}`} className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25">
                    Fer {mm} (m)
                  </th>
                ))}

                {mms.map((mm, idx) => (
                  <th
                    key={`p-${mm}`}
                    className={[
                      "py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25",
                      idx < mms.length - 1 ? "border-r-2" : "",
                    ].join(" ")}
                  >
                    Fer {mm} (T)
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {niveau.rows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="py-2 px-2 text-xs border-r-2">
                    <div className="whitespace-pre-wrap wrap-break-word">{row.designation || "—"}</div>
                  </td>

                  <td className="py-2 text-center text-xs border-r-2">{row.nb == null ? "" : fmtNumTrim3(row.nb)}</td>

                  {mms.map((mm) => (
                    <td key={`rq-${row.id}-${mm}`} className="py-2 text-center text-xs border-r-2">
                      {cellVal(row.qtyByMm, mm)}
                    </td>
                  ))}

                  {mms.map((mm, i2) => (
                    <td key={`rp-${row.id}-${mm}`} className={["py-2 text-center text-xs", i2 < mms.length - 1 ? "border-r-2" : ""].join(" ")}>
                      {cellVal(row.poidsByMm, mm)}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="bg-(--primary) text-white">
                <td colSpan={2} className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2">
                  Total
                </td>

                {mms.map((mm) => (
                  <td
                    key={`tq-${mm}`}
                    className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide"
                  >
                    {fmtNumTrim3(totals.qty[mm] ?? 0)}
                  </td>
                ))}

                {mms.map((mm, idx2) => (
                  <td
                    key={`tp-${mm}`}
                    className={[
                      "sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide",
                      idx2 < mms.length - 1 ? "border-r-2" : "",
                    ].join(" ")}
                  >
                    {fmtNumTrim3(totals.poids[mm] ?? 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { FaRegEye } from "react-icons/fa";
import { MdOutlineLocalPrintshop } from "react-icons/md";
import type { NiveauTotal, TotalFerraillageData, TotalRow } from "@/components/ferraillage/shared/totalFerraillageData";
import RecapPanel, { type RecapData } from "@/components/ferraillage/Edit/windows/totalRowModal/components/recap/RecapPanel";
import { repairPersistedRecapQuantities } from "@/components/ferraillage/Edit/windows/totalRowModal/state/recapQuantityRepair";

type CalculeTotalFerraillageProps = {
  data?: TotalFerraillageData | null;
  onPrint?: () => void;
};

type Totals = {
  qty: Record<number, number>;
  poids: Record<number, number>;
};

type RecapPreviewTarget = {
  id: string;
  designation: string;
  typeName: string;
  nbStr: string;
  hauteurStr: string;
  recap: RecapData;
};

type PrintRecapGroup = {
  id: string;
  name: string;
  items: RecapPreviewTarget[];
};

const EMPTY_TOTAL_FERRAILLAGE: TotalFerraillageData = {
  rapportId: "",
  chantierName: "",
  responsable: "",
  acierType: "",
  note: "",
  niveaux: [],
};

function fmtNumTrim3(n: number) {
  const value = Number.isFinite(n) ? n : 0;
  const fixed = value.toFixed(3).replace(".", ",");
  const [rawInt, rawDec = ""] = fixed.split(",");
  const intPart = rawInt === "-0" ? "0" : rawInt;
  const decPart = rawDec.replace(/0+$/g, "");
  return decPart ? `${intPart},${decPart}` : intPart;
}

function cellVal(map: Record<number, number>, mm: number) {
  return fmtNumTrim3(map[mm] ?? 0);
}

function toFormFieldValue(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "" : String(value);
}

function getPersistedRecap(row: TotalRow): RecapData | null {
  const persistedRecap = repairPersistedRecapQuantities(row.payload);
  if (!persistedRecap) return null;

  return {
    totals: (persistedRecap.totals ?? []).map((entry) => ({ ...entry })),
    linesCadres: (persistedRecap.linesCadres ?? []).map((line) => ({ ...line })),
    linesBarres: (persistedRecap.linesBarres ?? []).map((line) => ({ ...line })),
    linesExtras: (persistedRecap.linesExtras ?? []).map((line) => ({ ...line })),
  };
}

function getRecapPreviewTarget(row: TotalRow): RecapPreviewTarget | null {
  const recap = getPersistedRecap(row);
  const payload = row.payload;
  if (!recap || !payload) return null;

  return {
    id: row.id,
    designation: (typeof payload.designation === "string" ? payload.designation : "").trim(),
    typeName: (typeof payload.typeName === "string" ? payload.typeName : "").trim(),
    nbStr: toFormFieldValue(payload.nb),
    hauteurStr: toFormFieldValue(payload.hauteur),
    recap,
  };
}

function DesignationCell({ row }: { row: TotalRow }) {
  return (
    <div className="designation-cell whitespace-pre-wrap wrap-break-word">
      <div className="designation-cell__primary font-semibold">{row.designation || "-"}</div>
      <div className="designation-cell__secondary text-[11px] text-gray-600">{row.typeName || "-"}</div>
    </div>
  );
}

function buildFerPrintTableStyle(mms: number[]): CSSProperties {
  const remainingCols = mms.length * 2;
  const otherWidth = remainingCols > 0 ? `${85 / remainingCols}%` : "0%";

  return {
    ["--print-first-col-width" as string]: "12%",
    ["--print-nb-col-width" as string]: "3%",
    ["--print-recap-col-width" as string]: "0%",
    ["--print-other-col-width" as string]: otherWidth,
  };
}

function buildRecapPrintTableStyle(allMms: number[]): CSSProperties {
  const remainingCols = allMms.length * 2;
  const otherWidth = remainingCols > 0 ? `${85 / remainingCols}%` : "0%";

  return {
    ["--print-first-col-width" as string]: "15%",
    ["--print-other-col-width" as string]: otherWidth,
  };
}

function getRowDiametres(rows: TotalRow[]) {
  const set = new Set<number>();

  for (const row of rows) {
    for (const key of Object.keys(row.qtyByMm ?? {})) set.add(Number(key));
    for (const key of Object.keys(row.poidsByMm ?? {})) set.add(Number(key));
  }

  return Array.from(set).filter(Number.isFinite);
}

function getNiveauDiametres(niveau: NiveauTotal) {
  const set = new Set<number>(niveau.diametres ?? []);
  for (const mm of getRowDiametres(niveau.rows ?? [])) set.add(mm);
  return Array.from(set).sort((a, b) => a - b);
}

function computeTotals(rows: TotalRow[], mms: number[]): Totals {
  const qty: Record<number, number> = {};
  const poids: Record<number, number> = {};

  for (const mm of mms) {
    qty[mm] = 0;
    poids[mm] = 0;
  }

  for (const row of rows) {
    for (const mm of mms) {
      qty[mm] += row.qtyByMm[mm] ?? 0;
      poids[mm] += row.poidsByMm[mm] ?? 0;
    }
  }

  return { qty, poids };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="project-print-card print-card bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-8 text-center text-sm text-gray-600">{message}</div>
    </div>
  );
}

export default function CalculeTotalFerraillage({ data: rawData, onPrint }: CalculeTotalFerraillageProps) {
  const data = rawData ?? EMPTY_TOTAL_FERRAILLAGE;
  const niveaux = data.niveaux ?? [];
  const [selectedRecap, setSelectedRecap] = useState<RecapPreviewTarget | null>(null);

  const allMms = useMemo(() => {
    const set = new Set<number>();
    for (const niveau of niveaux) {
      for (const mm of getNiveauDiametres(niveau)) set.add(mm);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [niveaux]);

  const printButton = onPrint ? (
    <div className="no-print flex justify-end">
      <button
        type="button"
        onClick={onPrint}
        aria-label="Imprimer"
        title="Imprimer"
        className="print-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-(--primary) hoverButtons"
      >
        <MdOutlineLocalPrintshop size={20} />
      </button>
    </div>
  ) : null;

  if (!niveaux.length) {
    return <EmptyState message="Aucun niveau trouvé" />;
  }

  return (
    <div className="project-print-flow flex flex-col gap-4">
      {printButton}

      {niveaux.map((niveau) => (
        <NiveauBlock key={niveau.id} niveau={niveau} onOpenRecap={setSelectedRecap} />
      ))}
      {allMms.length ? <RecapByNiveau niveaux={niveaux} allMms={allMms} /> : null}
      <PrintRecapDetailsSection niveaux={niveaux} />

      {selectedRecap ? (
        <RecapPreviewDrawer
          target={selectedRecap}
          onClose={() => setSelectedRecap(null)}
        />
      ) : null}
    </div>
  );
}

function PrintRecapDetailsSection({ niveaux }: { niveaux: NiveauTotal[] }) {
  const groups = useMemo<PrintRecapGroup[]>(() => {
    return niveaux
      .map((niveau) => ({
        id: niveau.id,
        name: niveau.niveauName || "-",
        items: (niveau.rows ?? [])
          .map((row) => getRecapPreviewTarget(row))
          .filter((target): target is RecapPreviewTarget => target !== null),
      }))
      .filter((group) => group.items.length > 0);
  }, [niveaux]);

  if (!groups.length) return null;

  return (
    <div className="print-only print-recap-details-section project-print-card print-card project-print-recap-details bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="w-full text-xs font-bold text-gray-900 text-center align-middle items-center uppercase">
          {"D\u00C9TAILS R\u00C9CAPITULATIFS"}
        </div>
      </div>

      <div className="project-print-recap-details-body flex flex-col gap-4 p-4">
        {groups.map((group) => (
          <div key={group.id} className="project-print-recap-group flex flex-col gap-2">
            <div className="project-print-recap-group-title text-xs font-semibold uppercase tracking-wide text-gray-900">
              Niveau : {group.name}
            </div>

            <div className="project-print-recap-group-list flex flex-col gap-3">
              {group.items.map((item) => (
                <RecapPanel
                  key={item.id}
                  designation={item.designation}
                  typeName={item.typeName}
                  nbStr={item.nbStr}
                  hauteurStr={item.hauteurStr}
                  recap={item.recap}
                  className="project-print-recap-panel h-auto w-full"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecapPreviewDrawer({
  target,
  onClose,
}: {
  target: RecapPreviewTarget;
  onClose: () => void;
}) {
  const closeOnBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-140 flex justify-end bg-slate-900/10 p-3 sm:p-4" onMouseDown={closeOnBackdrop}>
      <RecapPanel
        designation={target.designation}
        typeName={target.typeName}
        nbStr={target.nbStr}
        hauteurStr={target.hauteurStr}
        recap={target.recap}
        className="h-full w-full max-w-[24rem]"
        onClose={onClose}
      />
    </div>
  );
}

function RecapByNiveau({ niveaux, allMms }: { niveaux: NiveauTotal[]; allMms: number[] }) {
  const tablePrintStyle = useMemo(() => buildRecapPrintTableStyle(allMms), [allMms]);
  const rows = useMemo(() => {
    return niveaux.map((niveau) => ({
      id: niveau.id,
      name: niveau.niveauName || "-",
      totals: computeTotals(niveau.rows ?? [], allMms),
    }));
  }, [niveaux, allMms]);

  const grandTotals = useMemo(() => {
    const allRows = niveaux.flatMap((niveau) => niveau.rows ?? []);
    return computeTotals(allRows, allMms);
  }, [niveaux, allMms]);

  const sumPoidsAll = useMemo(() => allMms.reduce((sum, mm) => sum + (grandTotals.poids[mm] ?? 0), 0), [allMms, grandTotals]);

  return (
    <div className="project-print-card print-card recap-section bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="w-full text-xs font-bold text-gray-900 text-center align-middle items-center uppercase">Recapitulatif par niveau</div>
      </div>

      <div className="py-4">
        <div className="project-print-table-wrap relative overflow-auto">
          <table className="project-print-table recap-table border-collapse table-fixed w-full min-w-350" style={tablePrintStyle}>
            <colgroup>
              <col className="recap-col-label" />
              {allMms.map((mm) => (
                <col key={`recap-q-col-${mm}`} className="recap-col-other" />
              ))}
              {allMms.map((mm) => (
                <col key={`recap-p-col-${mm}`} className="recap-col-other" />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-emerald-700 text-white">
                <th className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-70" rowSpan={2}>
                  Niveau
                </th>
                <th className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={allMms.length}>
                  Quantites <span className="text-[10px] font-semibold normal-case">(en metre)</span>
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

                {allMms.map((mm, index) => (
                  <th
                    key={`rp-h-${mm}`}
                    className={["py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25", index < allMms.length - 1 ? "border-r-2 border-emerald-600" : ""].join(" ")}
                  >
                    Fer {mm} (T)
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-emerald-50"}>
                  <td className="py-2 px-2 text-xs border-r-2 border-emerald-100">
                    <div className="whitespace-pre-wrap wrap-break-word font-semibold text-gray-900">{row.name}</div>
                  </td>

                  {allMms.map((mm) => (
                    <td key={`rq-${row.id}-${mm}`} className="py-2 text-center text-xs border-r-2 border-emerald-100">
                      {fmtNumTrim3(row.totals.qty[mm] ?? 0)}
                    </td>
                  ))}

                  {allMms.map((mm, index2) => (
                    <td
                      key={`rp-${row.id}-${mm}`}
                      className={["py-2 text-center text-xs", index2 < allMms.length - 1 ? "border-r-2 border-emerald-100" : ""].join(" ")}
                    >
                      {fmtNumTrim3(row.totals.poids[mm] ?? 0)}
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

                {allMms.map((mm, index) => (
                  <td
                    key={`gtp-${mm}`}
                    className={["sticky bottom-0 z-30 bg-emerald-700 text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide", index < allMms.length - 1 ? "border-r-2 border-emerald-600" : ""].join(" ")}
                  >
                    {fmtNumTrim3(grandTotals.poids[mm] ?? 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="total-poids-block mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 border border-emerald-100">
            <span className="font-semibold">Total Poids (tous Ø)</span>
            <span>{fmtNumTrim3(sumPoidsAll)} T</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NiveauBlock({
  niveau,
  onOpenRecap,
}: {
  niveau: NiveauTotal;
  onOpenRecap: (target: RecapPreviewTarget) => void;
}) {
  const mms = useMemo(() => getNiveauDiametres(niveau), [niveau]);
  const totals = useMemo(() => computeTotals(niveau.rows ?? [], mms), [niveau.rows, mms]);
  const tablePrintStyle = useMemo(() => buildFerPrintTableStyle(mms), [mms]);
  const colSpan = 3 + 2 * mms.length;

  return (
    <div className="project-print-card print-card niveau-card bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-gray-900">Niveau :</span>
              <span className="text-sm font-semibold text-gray-900">{niveau.niveauName || "-"}</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="w-1/2 flex items-start gap-2 px-3 py-2">
              <span className="mt-0.5 inline-flex items-center rounded-md bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                Note
              </span>
              <div className="text-xs text-gray-700 leading-relaxed">{niveau.note || "-"}</div>
            </div>

            <div className="w-1/2 flex flex-col items-end gap-1 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">Entreprise - Mains d'oeuvres</span>

              {niveau.sousTraitants?.length ? (
                <ul className="list-disc list-inside text-xs text-gray-700 leading-relaxed space-y-0.5">
                  {niveau.sousTraitants.map((sousTraitant, index) => (
                    <li key={`${index}-${sousTraitant}`} className="wrap-break-word">
                      {sousTraitant}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-700">-</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-4">
        {mms.length ? (
          <div className="project-print-table-wrap relative overflow-auto">
            <table className="project-print-table fer-table border-collapse table-fixed w-full min-w-350" style={tablePrintStyle}>
              <colgroup>
                <col className="fer-col-designation" />
                <col className="fer-col-nb" />
                {mms.map((mm) => (
                  <col key={`fer-q-col-${niveau.id}-${mm}`} className="fer-col-other" />
                ))}
                {mms.map((mm) => (
                  <col key={`fer-p-col-${niveau.id}-${mm}`} className="fer-col-other" />
                ))}
                <col className="fer-col-recap fer-print-recap" />
              </colgroup>
              <thead>
                <tr className="bg-(--primary) text-white">
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-52" rowSpan={2}>
                    Designations
                  </th>

                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-12" rowSpan={2}>
                    NB
                  </th>

                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={mms.length}>
                    Quantites <span className="text-[10px] font-semibold normal-case">(en metre)</span>
                  </th>

                  <th className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={mms.length}>
                    Poids <span className="text-[10px] font-semibold normal-case">(en tonnes)</span>
                  </th>

                  <th className="fer-print-recap sticky right-0 z-30 border-l-2 bg-(--primary) py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-14" rowSpan={2}>
                    RÉCAP
                  </th>
                </tr>

                <tr className="bg-(--primary) text-white">
                  {mms.map((mm) => (
                    <th key={`q-${niveau.id}-${mm}`} className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25">
                      Fer {mm} (m)
                    </th>
                  ))}

                  {mms.map((mm, index) => (
                    <th
                      key={`p-${niveau.id}-${mm}`}
                      className={["py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25", index < mms.length - 1 ? "border-r-2" : ""].join(" ")}
                    >
                      Fer {mm} (T)
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {(niveau.rows ?? []).length === 0 ? (
                  <tr className="bg-white">
                    <td colSpan={colSpan} className="py-8 text-center text-gray-600">
                      Aucune ligne trouvée
                    </td>
                  </tr>
                ) : (
                  (niveau.rows ?? []).map((row, index) => {
                    const recapTarget = getRecapPreviewTarget(row);
                    const rowBgClass = index % 2 === 0 ? "bg-white" : "bg-gray-100";

                    return (
                      <tr key={row.id} className={rowBgClass}>
                        <td className="w-52 py-2 px-2 text-xs border-r-2">
                          <DesignationCell row={row} />
                        </td>

                        <td className="w-12 py-2 text-center text-xs border-r-2">{row.nb == null ? "" : fmtNumTrim3(row.nb)}</td>

                        {mms.map((mm) => (
                          <td key={`rq-${row.id}-${mm}`} className="py-2 text-center text-xs border-r-2">
                            {cellVal(row.qtyByMm, mm)}
                          </td>
                        ))}

                        {mms.map((mm, index2) => (
                          <td key={`rp-${row.id}-${mm}`} className={["py-2 text-center text-xs", index2 < mms.length - 1 ? "border-r-2" : ""].join(" ")}>
                            {cellVal(row.poidsByMm, mm)}
                          </td>
                        ))}

                        <td className={["fer-print-recap sticky right-0 z-20 w-14 py-2 text-center text-xs border-l-2", rowBgClass].join(" ")}>
                          <button
                            type="button"
                            className="ButtonSquare disabled:cursor-not-allowed disabled:opacity-50"
                            title={recapTarget ? "Voir le récapitulatif" : "Aucun récapitulatif enregistré"}
                            aria-label={recapTarget ? "Voir le récapitulatif" : "Aucun récapitulatif enregistré"}
                            disabled={!recapTarget}
                            onClick={() => {
                              if (!recapTarget) return;
                              onOpenRecap(recapTarget);
                            }}
                          >
                            <FaRegEye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}

                <tr className="bg-(--primary) text-white">
                  <td colSpan={2} className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2">
                    Total
                  </td>

                  {mms.map((mm) => (
                    <td key={`tq-${niveau.id}-${mm}`} className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide">
                      {fmtNumTrim3(totals.qty[mm] ?? 0)}
                    </td>
                  ))}

                  {mms.map((mm, index) => (
                    <td
                      key={`tp-${niveau.id}-${mm}`}
                      className={["sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide", index < mms.length - 1 ? "border-r-2" : ""].join(" ")}
                    >
                      {fmtNumTrim3(totals.poids[mm] ?? 0)}
                    </td>
                  ))}

                  <td className="fer-print-recap sticky right-0 bottom-0 z-40 bg-(--primary) text-white border-l-2" />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-600">Aucune ligne trouvée</div>
        )}
      </div>
    </div>
  );
}

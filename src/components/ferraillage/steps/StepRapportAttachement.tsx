import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendar, LuPlus } from "react-icons/lu";
import { CiCircleRemove } from "react-icons/ci";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import "@/lib/swbDatePicker";

type Props = {
  selectedMms: number[];
};

type MouvementType = "LIVRAISON" | "TRANSFERT" | "AJUSTEMENT";

type MouvementRow = {
  id: string;
  dateISO: string;
  date: string;
  type: MouvementType;
  bon: string;
  note: string;
  valuesByMm: Record<number, string>;
};

type RestantRow = {
  id: string;
  dateISO: string;
  date: string;
  note: string;
  valuesByMm: Record<number, string>;
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isoToday() {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseTnNumber(s: string) {
  const t = (s ?? "").trim();
  if (!t) return 0;
  const normalized = t.replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function fmtTnNumber(n: number) {
  return n.toFixed(3).replace(".", ",");
}

function fmtDMYFromISO(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

type AppDatePickerAPI = NonNullable<typeof window.AppDatePicker>;
type DatePickerController = ReturnType<AppDatePickerAPI["create"]>;

function AddRowInsideTable({
  colSpan,
  bottomOffsetPx,
  onClick,
}: {
  colSpan: number;
  bottomOffsetPx: number;
  onClick: () => void;
}) {
  return (
    <tr className="bg-white">
      <td colSpan={colSpan} className="sticky h-22 z-20" style={{ bottom: `${bottomOffsetPx}px` }}>
        <div className="w-full flex justify-center">
          <button type="button" className="ButtonSquare" title="Ajouter une ligne" aria-label="Ajouter une ligne" onClick={onClick}>
            <LuPlus size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function buildZeroValues(mms: number[]) {
  const init: Record<number, string> = {};
  for (const mm of mms) init[mm] = "0";
  return init;
}

function RowModal({
  title,
  mms,
  showBon,
  showType,
  showNote,
  defaultType,
  initial,
  submitLabel,
  onClose,
  onSubmit,
}: {
  title: string;
  mms: number[];
  showBon: boolean;
  showType: boolean;
  showNote: boolean;
  defaultType?: MouvementType;
  initial?: {
    dateISO: string;
    type?: MouvementType;
    bon?: string;
    note?: string;
    valuesByMm?: Record<number, string>;
  };
  submitLabel: string;
  onClose: () => void;
  onSubmit: (payload: {
    dateISO: string;
    type?: MouvementType;
    bon?: string;
    note?: string;
    valuesByMm: Record<number, string>;
  }) => void;
}) {
  const [type, setType] = useState<MouvementType>(initial?.type ?? defaultType ?? "LIVRAISON");
  const [bon, setBon] = useState(initial?.bon ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [valuesByMm, setValuesByMm] = useState<Record<number, string>>(() => {
    const base = buildZeroValues(mms);
    const given = initial?.valuesByMm ?? {};
    for (const mm of mms) base[mm] = typeof given[mm] === "string" ? given[mm] : base[mm];
    return base;
  });
  const [err, setErr] = useState("");

  const [initialISO] = useState(() => initial?.dateISO ?? isoToday());

  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const dpRef = useRef<DatePickerController>(null);

  const safeClose = useCallback(() => {
    const ctrl = dpRef.current;
    if (ctrl) ctrl.close();
    dpRef.current = null;
    onClose();
  }, [onClose]);

  useEffect(() => {
    const input = dateInputRef.current;
    const api = window.AppDatePicker;
    if (!input || !api?.create) return;

    const ctrl = api.create(input, {
      allowManualInput: false,
      onChange: () => {},
    });

    dpRef.current = ctrl;

    if (ctrl) ctrl.setValue(initialISO, { silent: true });

    return () => {
      const c = dpRef.current;
      if (c) c.close();
      dpRef.current = null;
    };
  }, [initialISO]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") safeClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [safeClose]);

  const submit = () => {
    const dateISO = (dateInputRef.current?.value ?? "").trim();
    if (!dateISO) {
      setErr("Date obligatoire");
      return;
    }

    onSubmit({
      dateISO,
      type: showType ? type : undefined,
      bon: showBon ? bon : undefined,
      note: showNote ? note : undefined,
      valuesByMm,
    });

    safeClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-120">
      <div className="absolute inset-0 bg-black/40" onMouseDown={safeClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col">
          <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">{title}</div>

            <button
              type="button"
              onClick={safeClose}
              aria-label="Fermer"
              title="Fermer"
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-auto">
            {err ? <div className="mb-3 text-sm text-red-600">{err}</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Date</label>

                <div data-date-picker className="relative">
                  <div className="flex items-center gap-2">
                    <input
                      ref={dateInputRef}
                      className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      placeholder="YYYY-MM-DD"
                      defaultValue={initialISO}
                    />
                    <button
                      type="button"
                      data-date-picker-toggle
                      className="ButtonSquare"
                      aria-label="Choisir une date"
                      title="Choisir une date"
                    >
                      <LuCalendar size={16} />
                    </button>
                  </div>

                  <div data-date-picker-panel className="swb-date-picker" />
                </div>
              </div>

              {showType ? (
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    value={type}
                    onChange={(e) => setType(e.target.value as MouvementType)}
                  >
                    <option value="LIVRAISON">LIVRAISON</option>
                    <option value="TRANSFERT">TRANSFERT</option>
                    <option value="AJUSTEMENT">AJUSTEMENT</option>
                  </select>
                </div>
              ) : (
                <div className="hidden md:block" />
              )}

              {showBon ? (
                <div className={`flex flex-col ${showType ? "" : "md:col-span-2"}`}>
                  <label className="text-sm font-semibold text-gray-700 mb-1">N° Bon de livraison</label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                    value={bon}
                    onChange={(e) => setBon(e.target.value)}
                    placeholder="Ex: 2416285"
                  />
                </div>
              ) : (
                <div className="hidden md:block" />
              )}

              {showNote ? (
                <div className="flex flex-col md:col-span-3">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
                  <textarea
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm min-h-24 resize-y focus:outline-none focus:ring-2 focus:ring-black/10"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder='Ex: "Qté. Fer Transférée à ... (chantier ...)"'
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">Quantités par diamètre</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mms.map((mm) => (
                  <div key={mm} className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-700 mb-1">Fer de {mm}</label>
                    <input
                      className="w-full rounded border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black/10"
                      value={valuesByMm[mm] ?? "0"}
                      onChange={(e) => setValuesByMm((p) => ({ ...p, [mm]: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="
              rounded-b-xl bg-gray-50
              border-t border-slate-900/10
              px-3.5 pt-2.5 pb-3.5
              flex items-center justify-between gap-3
            "
            aria-label="Actions du formulaire"
          >
            <div className="flex items-center justify-start gap-2 flex-1">
              <button type="button" onClick={safeClose} className="stepper__nav">
                Annuler
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
              <button type="button" onClick={submit} className="stepper__nav">
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function StepRapportAttachement({ selectedMms }: Props) {
  const mms = useMemo(() => [...selectedMms].sort((a, b) => a - b), [selectedMms]);

  const [mouvements, setMouvements] = useState<MouvementRow[]>([]);
  const [restants, setRestants] = useState<RestantRow[]>([]);

  const [mouvModal, setMouvModal] = useState<{ mode: "add" | "edit"; id?: string } | null>(null);
  const [resModal, setResModal] = useState<{ mode: "add" | "edit"; id?: string } | null>(null);

  const totalMouvementByMm = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const mm of mms) totals[mm] = 0;
    for (const row of mouvements) {
      for (const mm of mms) totals[mm] += parseTnNumber(row.valuesByMm[mm] ?? "0");
    }
    return totals;
  }, [mouvements, mms]);

  const totalRestantByMm = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const mm of mms) totals[mm] = 0;
    for (const row of restants) {
      for (const mm of mms) totals[mm] += parseTnNumber(row.valuesByMm[mm] ?? "0");
    }
    return totals;
  }, [restants, mms]);

  if (mms.length === 0) {
    return (
      <div className="rounded border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-800 mb-2">Rapport d'attachement</div>
        <div className="text-sm text-gray-600">Aucun diamètre sélectionné. Retourne à l’étape “Projet & Diamètres”.</div>
      </div>
    );
  }

  const stickyTotalH = 40;

  const editingMouv = mouvModal?.mode === "edit" ? mouvements.find((x) => x.id === mouvModal.id) ?? null : null;
  const editingRes = resModal?.mode === "edit" ? restants.find((x) => x.id === resModal.id) ?? null : null;

  return (
    <div className="p-6 min-h-65">
      {mouvModal ? (
        <RowModal
          title={mouvModal.mode === "edit" ? "Modifier - Mouvement" : "Ajouter une ligne - Mouvement"}
          mms={mms}
          showBon
          showType
          showNote
          defaultType="LIVRAISON"
          initial={
            mouvModal.mode === "edit" && editingMouv
              ? {
                  dateISO: editingMouv.dateISO,
                  type: editingMouv.type,
                  bon: editingMouv.bon,
                  note: editingMouv.note,
                  valuesByMm: editingMouv.valuesByMm,
                }
              : undefined
          }
          submitLabel={mouvModal.mode === "edit" ? "Enregistrer" : "Ajouter"}
          onClose={() => setMouvModal(null)}
          onSubmit={({ dateISO, type, bon, note, valuesByMm }) => {
            if (mouvModal.mode === "edit" && mouvModal.id) {
              setMouvements((prev) =>
                prev.map((r) =>
                  r.id === mouvModal.id
                    ? {
                        ...r,
                        dateISO,
                        date: fmtDMYFromISO(dateISO),
                        type: type ?? r.type,
                        bon: bon ?? r.bon,
                        note: note ?? r.note,
                        valuesByMm,
                      }
                    : r,
                ),
              );
              return;
            }

            setMouvements((prev) => [
              {
                id: makeId(),
                dateISO,
                date: fmtDMYFromISO(dateISO),
                type: type ?? "LIVRAISON",
                bon: bon ?? "",
                note: note ?? "",
                valuesByMm,
              },
              ...prev,
            ]);
          }}
        />
      ) : null}

      {resModal ? (
        <RowModal
          title={resModal.mode === "edit" ? "Modifier - Quantité restante" : "Ajouter une ligne - Quantité restante"}
          mms={mms}
          showBon={false}
          showType={false}
          showNote
          initial={
            resModal.mode === "edit" && editingRes
              ? { dateISO: editingRes.dateISO, note: editingRes.note, valuesByMm: editingRes.valuesByMm }
              : undefined
          }
          submitLabel={resModal.mode === "edit" ? "Enregistrer" : "Ajouter"}
          onClose={() => setResModal(null)}
          onSubmit={({ dateISO, note, valuesByMm }) => {
            if (resModal.mode === "edit" && resModal.id) {
              setRestants((prev) =>
                prev.map((r) =>
                  r.id === resModal.id
                    ? { ...r, dateISO, date: fmtDMYFromISO(dateISO), note: note ?? r.note, valuesByMm }
                    : r,
                ),
              );
              return;
            }

            setRestants((prev) => [
              { id: makeId(), dateISO, date: fmtDMYFromISO(dateISO), note: note ?? "", valuesByMm },
              ...prev,
            ]);
          }}
        />
      ) : null}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-gray-200 h-8 px-3">
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">ETAT DE FER LIVRE AU CHANTIER</div>
          </div>

          <div className="relative overflow-auto pb-10">
            <table className="border-collapse table-fixed w-full min-w-262.5">
              <thead>
                <tr className="bg-(--primary) text-white">
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-26">Date</th>
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-22">Type</th>
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-35">
                    N° Bon de livraison
                  </th>
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">Note</th>
                  {mms.map((mm) => (
                    <th key={mm} className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-18">
                      Fer de {mm}
                    </th>
                  ))}
                  <th className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-22">Actions</th>
                </tr>
              </thead>

              <tbody>
                {mouvements.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-200"}>
                    <td className="py-1 text-center text-sm border-r-2">{row.date}</td>
                    <td className="py-1 text-center text-xs border-r-2 font-semibold">{row.type}</td>
                    <td className="py-1 px-2 text-center text-xs border-r-2">
                      <div className="font-semibold">{row.bon}</div>
                    </td>
                    <td className="py-1 px-2 text-left text-xs border-r-2">
                      <div className="whitespace-pre-wrap wrap-break-word">{row.note}</div>
                    </td>
                    {mms.map((mm) => (
                      <td key={mm} className="py-1 text-center text-xs border-r-2">
                        {row.valuesByMm[mm] ?? "0"}
                      </td>
                    ))}
                    <td className="py-1 px-2 text-center text-xs">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          type="button"
                          className="ButtonSquare"
                          title="Modifier"
                          onClick={() => setMouvModal({ mode: "edit", id: row.id })}
                        >
                          <FaRegEdit size={14} />
                        </button>
                        <button
                          type="button"
                          className="ButtonSquareDelete"
                          title="Supprimer"
                          onClick={() => setMouvements((prev) => prev.filter((x) => x.id !== row.id))}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <AddRowInsideTable colSpan={5 + mms.length} bottomOffsetPx={stickyTotalH} onClick={() => setMouvModal({ mode: "add" })} />

                <tr className="bg-(--primary) text-white">
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40 border-r-2">
                    TOTAL
                  </td>
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2" />
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2" />
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2" />
                  {mms.map((mm) => (
                    <td
                      key={mm}
                      className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-20"
                    >
                      {totalMouvementByMm[mm] ? fmtTnNumber(totalMouvementByMm[mm]) : "0,000"}
                    </td>
                  ))}
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white py-2" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-gray-200 h-8 px-3">
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">Quantité restante non confectionné</div>
          </div>

          <div className="relative overflow-auto">
            <table className="border-collapse table-fixed w-full min-w-262.5">
              <thead>
                <tr className="bg-(--primary) text-white">
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-26">Date</th>
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-60">Note</th>
                  {mms.map((mm) => (
                    <th key={mm} className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-18">
                      Fer de {mm}
                    </th>
                  ))}
                  <th className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-22">Actions</th>
                </tr>
              </thead>

              <tbody>
                {restants.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-200"}>
                    <td className="py-1 text-center text-sm border-r-2">{row.date}</td>
                    <td className="py-1 px-2 text-left text-xs border-r-2">
                      <div className="whitespace-pre-wrap wrap-break-word">{row.note}</div>
                    </td>
                    {mms.map((mm) => (
                      <td key={mm} className="py-1 text-center text-xs border-r-2">
                        {row.valuesByMm[mm] ?? "0"}
                      </td>
                    ))}
                    <td className="py-1 px-2 text-center text-xs">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          type="button"
                          className="ButtonSquare"
                          title="Modifier"
                          onClick={() => setResModal({ mode: "edit", id: row.id })}
                        >
                          <FaRegEdit size={14} />
                        </button>
                        <button
                          type="button"
                          className="ButtonSquareDelete"
                          title="Supprimer"
                          onClick={() => setRestants((prev) => prev.filter((x) => x.id !== row.id))}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <AddRowInsideTable colSpan={3 + mms.length} bottomOffsetPx={stickyTotalH} onClick={() => setResModal({ mode: "add" })} />

                <tr className="bg-(--primary) text-white">
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40 border-r-2">
                    TOTAL
                  </td>
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2" />
                  {mms.map((mm) => (
                    <td
                      key={mm}
                      className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40"
                    >
                      {totalRestantByMm[mm] ? fmtTnNumber(totalRestantByMm[mm]) : "0,000"}
                    </td>
                  ))}
                  <td className="sticky bottom-0 z-30 bg-(--primary) text-white py-2" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

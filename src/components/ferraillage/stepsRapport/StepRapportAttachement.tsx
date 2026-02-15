import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendar, LuPlus } from "react-icons/lu";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
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

function kgPerMeter(mm: number) {
  return (mm * mm) / 162;
}

type AppDatePickerAPI = NonNullable<typeof window.AppDatePicker>;
type DatePickerController = ReturnType<AppDatePickerAPI["create"]>;

function AddRowInsideTable({
  colSpan,
  bottomOffsetPx,
  onClick,
  expandLabel,
}: {
  colSpan: number;
  bottomOffsetPx: number;
  onClick: () => void;
  expandLabel?: string;
}) {
  const label = expandLabel ?? "Ajouter une ligne";

  return (
    <tr className="bg-white">
      <td colSpan={colSpan} className="sticky h-22 z-20" style={{ bottom: `${bottomOffsetPx}px` }}>
        <div className="w-full flex justify-center">
          <button
            type="button"
            className="ButtonSquare ButtonSquare--expandText"
            title={label}
            aria-label={label}
            onClick={onClick}
          >
            <LuPlus size={16} />
            <span className="ButtonSquare__text">{label}</span>
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

function CheckIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function TypeDropdown({ value, onChange }: { value: MouvementType; onChange: (v: MouvementType) => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const OPTIONS: MouvementType[] = ["LIVRAISON", "TRANSFERT", "AJUSTEMENT"];

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="flex flex-col" ref={wrapRef}>
      <button
        type="button"
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled="false"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{value}</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open ? (
        <div className="relative">
          <div
            className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
            role="listbox"
          >
            {OPTIONS.map((opt) => {
              const selected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={[
                    "w-full px-3 py-2 text-sm text-left flex items-center gap-2",
                    selected ? "bg-emerald-50 text-emerald-700" : "text-slate-700",
                    "hover:bg-emerald-100 hover:text-emerald-800",
                  ].join(" ")}
                  role="option"
                  aria-selected={selected}
                >
                  <span
                    className={[
                      "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                      selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent",
                    ].join(" ")}
                  >
                    <CheckIcon />
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DiametreDropdown({
  mms,
  value,
  onChange,
}: {
  mms: number[];
  value: number;
  onChange: (mm: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="flex flex-col" ref={wrapRef}>
      <button
        type="button"
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled="false"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{`Fer de ${value}`}</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open ? (
        <div className="relative">
          <div
            className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
            role="listbox"
          >
            {mms.map((mm) => {
              const selected = mm === value;
              return (
                <button
                  key={mm}
                  type="button"
                  onClick={() => {
                    onChange(mm);
                    setOpen(false);
                  }}
                  className={[
                    "w-full px-3 py-2 text-sm text-left flex items-center gap-2",
                    selected ? "bg-emerald-50 text-emerald-700" : "text-slate-700",
                    "hover:bg-emerald-100 hover:text-emerald-800",
                  ].join(" ")}
                  role="option"
                  aria-selected={selected}
                >
                  <span
                    className={[
                      "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                      selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent",
                    ].join(" ")}
                  >
                    <CheckIcon />
                  </span>
                  <span className="truncate">{`Fer de ${mm}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FerraillageCalcPanel({
  mms,
  valuesByMm,
  setValuesByMm,
}: {
  mms: number[];
  valuesByMm: Record<number, string>;
  setValuesByMm: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const [calcMm, setCalcMm] = useState<number>(() => mms[0] ?? 0);
  const [lenM, setLenM] = useState<string>("0");
  const [nbBarres, setNbBarres] = useState<string>("1");

  useEffect(() => {
    if (!mms.length) return;
    if (!mms.includes(calcMm)) setCalcMm(mms[0]);
  }, [mms, calcMm]);

  const len = useMemo(() => Math.max(0, parseTnNumber(lenM)), [lenM]);
  const nb = useMemo(() => {
    const raw = Math.floor(parseTnNumber(nbBarres));
    return raw > 0 ? raw : 1;
  }, [nbBarres]);

  const kg = useMemo(() => {
    if (!calcMm) return 0;
    return kgPerMeter(calcMm) * len * nb;
  }, [calcMm, len, nb]);

  const tn = useMemo(() => kg / 1000, [kg]);

  const resultTnStr = useMemo(() => fmtTnNumber(tn), [tn]);
  const resultKgStr = useMemo(() => (Number.isFinite(kg) ? kg.toFixed(1) : "0.0"), [kg]);

  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const emeraldBtn =
    "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 " +
    "focus:outline-none focus:ring-2 focus:ring-emerald-400";

  const applyReplace = () => {
    if (!calcMm) return;
    setValuesByMm((p) => ({ ...p, [calcMm]: resultTnStr }));
  };

  const applyAdd = () => {
    if (!calcMm) return;
    setValuesByMm((p) => {
      const cur = parseTnNumber(p[calcMm] ?? "0");
      const next = cur + tn;
      return { ...p, [calcMm]: fmtTnNumber(next) };
    });
  };

  return (
    <div className="w-full lg:w-160 rounded-xl bg-white shadow-xl border border-emerald-200 flex flex-col">
      <div className="px-5 py-3 bg-emerald-50 rounded-t-xl border-b border-emerald-200 flex items-center justify-between">
        <div className="text-sm font-semibold text-emerald-900">Calculateur ferraillage</div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Diamètre</label>
            <DiametreDropdown mms={mms} value={calcMm} onChange={setCalcMm} />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Longueur (m)</label>
            <input className={inputClass} value={lenM} onChange={(e) => setLenM(e.target.value)} placeholder="Ex: 12,5" />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Nombre de barres</label>
            <input className={inputClass} value={nbBarres} onChange={(e) => setNbBarres(e.target.value)} placeholder="Ex: 10" />
          </div>
        </div>

        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">RÉSULTAT</div>
          <div className="mt-1 text-sm font-semibold text-emerald-900">
            {resultTnStr} Tn <span className="font-medium text-emerald-900/70">({resultKgStr} kg)</span>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <button type="button" className={emeraldBtn} onClick={applyReplace}>
              Remplacer la valeur de “Fer {calcMm}”
            </button>
            <button type="button" className={emeraldBtn} onClick={applyAdd}>
              Ajouter à la valeur de “Fer {calcMm}”
            </button>
          </div>

          <div className="mt-3 text-[11px] text-emerald-900/70">
            Formule: <span className="font-semibold">kg/m = d² / 162</span> (d en mm) • Conversion: 1 Tn = 1000 kg
          </div>

          <div className="mt-2 text-[11px] text-emerald-900/70">
            Valeur actuelle “Fer {calcMm}” : <span className="font-semibold">{valuesByMm[calcMm] ?? "0"}</span>
          </div>
        </div>
      </div>
    </div>
  );
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

    const ctrl = api.create(input, { allowManualInput: false, onChange: () => {} });
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

  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const qtyInputClass =
    "w-full rounded-md border px-2 py-2 text-sm font-medium text-center " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400";

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
        <div className="w-full lg:w-auto max-w-[96vw] flex flex-col lg:flex-row items-center justify-center gap-4">
          <div className="w-full lg:max-w-5xl rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col">
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
                      <input ref={dateInputRef} className={inputClass} placeholder="YYYY-MM-DD" defaultValue={initialISO} />
                      <button type="button" data-date-picker-toggle className="ButtonSquare" aria-label="Choisir une date" title="Choisir une date">
                        <LuCalendar size={16} />
                      </button>
                    </div>

                    <div data-date-picker-panel className="swb-date-picker" />
                  </div>
                </div>

                {showType ? (
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <TypeDropdown value={type} onChange={setType} />
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}

                {showBon ? (
                  <div className={`flex flex-col ${showType ? "" : "md:col-span-2"}`}>
                    <label className="text-sm font-semibold text-gray-700 mb-1">N° Bon de livraison</label>
                    <input className={inputClass} value={bon} onChange={(e) => setBon(e.target.value)} placeholder="Ex: 2416285" />
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}

                {showNote ? (
                  <div className="flex flex-col md:col-span-3">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
                    <textarea
                      className={inputClass + " min-h-24 resize-y"}
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
                        className={qtyInputClass}
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

          <FerraillageCalcPanel mms={mms} valuesByMm={valuesByMm} setValuesByMm={setValuesByMm} />
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
    <div className="p-4 min-h-65">
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
                  r.id === resModal.id ? { ...r, dateISO, date: fmtDMYFromISO(dateISO), note: note ?? r.note, valuesByMm } : r,
                ),
              );
              return;
            }

            setRestants((prev) => [{ id: makeId(), dateISO, date: fmtDMYFromISO(dateISO), note: note ?? "", valuesByMm }, ...prev]);
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
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-35">N° Bon de livraison</th>
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
                        <button type="button" className="ButtonSquare" title="Modifier" onClick={() => setMouvModal({ mode: "edit", id: row.id })}>
                          <FaRegEdit size={14} />
                        </button>
                        <button type="button" className="ButtonSquareDelete" title="Supprimer" onClick={() => setMouvements((prev) => prev.filter((x) => x.id !== row.id))}>
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <AddRowInsideTable colSpan={5 + mms.length} bottomOffsetPx={stickyTotalH} onClick={() => setMouvModal({ mode: "add" })} expandLabel="Ajouter un mouvement" />

                <tr className="bg-(--primary) text-white">
                  <td colSpan={4} className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2">
                    TOTAL
                  </td>
                  {mms.map((mm) => (
                    <td key={mm} className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-20">
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
                        <button type="button" className="ButtonSquare" title="Modifier" onClick={() => setResModal({ mode: "edit", id: row.id })}>
                          <FaRegEdit size={14} />
                        </button>
                        <button type="button" className="ButtonSquareDelete" title="Supprimer" onClick={() => setRestants((prev) => prev.filter((x) => x.id !== row.id))}>
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <AddRowInsideTable colSpan={3 + mms.length} bottomOffsetPx={stickyTotalH} onClick={() => setResModal({ mode: "add" })} />

                <tr className="bg-(--primary) text-white">
                  <td colSpan={2} className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2">
                    TOTAL
                  </td>
                  {mms.map((mm) => (
                    <td key={mm} className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">
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

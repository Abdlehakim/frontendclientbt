// src/components/ferraillage/Edit/EditCalculeTotalFerraillage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { LuPlus } from "react-icons/lu";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { CiCircleRemove } from "react-icons/ci";

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

const STANDARD_MMS = [6, 8, 10, 12, 14, 16, 20, 25, 32, 40, 50] as const;
const DEFAULT_MMS = [6, 8, 10, 12, 14, 16, 20];

const EMPTY_TOTAL_FERRAILLAGE: TotalFerraillageData = {
  rapportId: "",
  chantierName: "",
  niveaux: [
    {
      id: "niv-0",
      niveauName: "",
      note: "",
      diametres: DEFAULT_MMS,
      sousTraitants: [],
      rows: [],
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

type MouvModalState = { mode: "edit"; id: string } | null;

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SousTraitantsField({
  niveauId,
  inputClass,
  draftValue,
  setDraftValue,
  items,
  onAdd,
  onRemove,
}: {
  niveauId: string;
  inputClass: string;
  draftValue: string;
  setDraftValue: (v: string) => void;
  items: string[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
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
    <div ref={wrapRef} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          className={inputClass}
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          placeholder="Ex: Ste. AM SIOUD CONSTRUCTION"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />

        {open ? (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 w-full rounded-md border border-emerald-200 bg-white shadow-lg" role="listbox">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-700 border-b border-gray-100">
              Entreprise - Mains d'oeuvres ({items.length})
            </div>

            <div className="max-h-60 overflow-auto py-1">
              {items.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">—</div>
              ) : (
                items.map((st, idx) => (
                  <div key={`${niveauId}-st-${idx}`} className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-emerald-50">
                    <div className="text-sm text-gray-800 truncate">{st || "—"}</div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      title="Supprimer"
                      aria-label="Supprimer"
                      onClick={() => onRemove(idx)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <button type="button" className="ButtonSquare" title="Ajouter entreprise" aria-label="Ajouter entreprise" onClick={onAdd}>
        <LuPlus size={16} />
      </button>

      <button
        type="button"
        className="ButtonSquare"
        title="Liste des entreprises"
        aria-label="Liste des entreprises"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <IoIosArrowDropup size={18} /> : <IoIosArrowDropdown size={18} />}
      </button>
    </div>
  );
}

function NiveauModal({
  open,
  onClose,
  onSubmit,
  inputClass,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { niveauName: string; note: string; sousTraitants: string[]; diametres: number[] }) => void;
  inputClass: string;
  initial: { id: string; niveauName: string; note: string; sousTraitants: string[]; diametres: number[] };
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [draftSous, setDraftSous] = useState("");
  const [local, setLocal] = useState<{
    id: string;
    name: string;
    note: string;
    selectedMms: number[];
    sousTraitants: string[];
  }>(() => ({
    id: initial.id,
    name: initial.niveauName ?? "",
    note: initial.note ?? "",
    selectedMms: initial.diametres ?? [],
    sousTraitants: initial.sousTraitants ?? [],
  }));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const closeOnBackdrop = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  const toggleMm = (mm: number) => {
    setLocal((p) => {
      const set = new Set<number>(p.selectedMms ?? []);
      if (set.has(mm)) set.delete(mm);
      else set.add(mm);
      return { ...p, selectedMms: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const addEntreprise = () => {
    const raw = draftSous.trim();
    if (!raw) return;

    setLocal((p) => {
      const current = p.sousTraitants ?? [];
      if (current.includes(raw)) return p;
      return { ...p, sousTraitants: [...current, raw] };
    });

    setDraftSous("");
  };

  const removeEntreprise = (idx: number) => {
    setLocal((p) => ({ ...p, sousTraitants: (p.sousTraitants ?? []).filter((_, i) => i !== idx) }));
  };

  const submit = () => {
    onSubmit({
      niveauName: (local.name ?? "").trim(),
      note: (local.note ?? "").trim(),
      sousTraitants: local.sousTraitants ?? [],
      diametres: (local.selectedMms ?? []).sort((a, b) => a - b),
    });
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className="w-full max-w-5xl rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Ajouter Niveau</div>
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

          <div className="p-5">
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Nom du niveau</label>
                <input
                  className={inputClass}
                  value={local.name}
                  onChange={(e) => setLocal((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Etage 1"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
                <input
                  className={inputClass}
                  value={local.note}
                  onChange={(e) => setLocal((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Optionnel"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Entreprise - Mains d'oeuvres</label>

                <SousTraitantsField
                  niveauId={local.id}
                  inputClass={inputClass}
                  draftValue={draftSous}
                  setDraftValue={setDraftSous}
                  items={local.sousTraitants ?? []}
                  onAdd={addEntreprise}
                  onRemove={(idx) => removeEntreprise(idx)}
                />
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-3">
              <div className="text-sm font-semibold text-gray-700 mb-4">Diamètres actifs</div>

              <div className="max-h-72 overflow-auto pr-1">
                <div className="grid grid-cols-5 gap-2 items-start">
                  {STANDARD_MMS.map((mm) => {
                    const checked = (local.selectedMms ?? []).includes(mm);
                    return (
                      <label
                        key={mm}
                        className={[
                          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer select-none truncate",
                          checked
                            ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                            : "bg-white text-slate-700 hover:bg-emerald-50 border-gray-200",
                        ].join(" ")}
                      >
                        <input className="h-4 w-4 accent-emerald-600" type="checkbox" checked={checked} onChange={() => toggleMm(mm)} />
                        <span className="truncate">Fer {mm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-end gap-2">
            <button type="button" className="btn-fit-white-outline" onClick={onClose}>
              Annuler
            </button>
            <button type="button" className="btn-fit-white-outline" onClick={submit}>
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EditCalculeTotalFerraillage() {
  const [data, setData] = useState<TotalFerraillageData>(() => EMPTY_TOTAL_FERRAILLAGE);
  const [, setMouvModal] = useState<MouvModalState>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const editingNiveau = useMemo(() => {
    if (!editId) return null;
    return (data.niveaux ?? []).find((n) => n.id === editId) ?? null;
  }, [editId, data.niveaux]);

  const openEdit = Boolean(editId && editingNiveau);

  const removeNiveau = (id: string) => {
    setEditId((curr) => (curr === id ? null : curr));
    setData((p) => ({ ...p, niveaux: (p.niveaux ?? []).filter((x) => x.id !== id) }));
  };

  const addFromModal = (payload: { niveauName: string; note: string; sousTraitants: string[]; diametres: number[] }) => {
    const diametres = (payload.diametres?.length ? payload.diametres : [...DEFAULT_MMS]).sort((a, b) => a - b);
    setData((p) => ({
      ...p,
      niveaux: [
        ...(p.niveaux ?? []),
        { id: makeId(), niveauName: payload.niveauName, note: payload.note, diametres, sousTraitants: payload.sousTraitants ?? [], rows: [] },
      ],
    }));
  };

  const updateFromModal = (id: string, payload: { niveauName: string; note: string; sousTraitants: string[]; diametres: number[] }) => {
    setData((p) => ({
      ...p,
      niveaux: (p.niveaux ?? []).map((n) => {
        if (n.id !== id) return n;
        const diametres = (payload.diametres?.length ? payload.diametres : n.diametres?.length ? n.diametres : [...DEFAULT_MMS]).sort((a, b) => a - b);
        return { ...n, niveauName: payload.niveauName, note: payload.note, sousTraitants: payload.sousTraitants ?? [], diametres };
      }),
    }));
  };

  const allMms = useMemo(() => {
    const set = new Set<number>();
    for (const n of data.niveaux) for (const mm of n.diametres) set.add(mm);
    const out = Array.from(set).sort((a, b) => a - b);
    return out.length ? out : [...DEFAULT_MMS];
  }, [data.niveaux]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <button type="button" className="btn-fit-white-outline" onClick={() => setOpenAdd(true)}>
          Ajouter Niveau
        </button>
      </div>

      {openAdd ? (
        <NiveauModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onSubmit={addFromModal}
          inputClass={inputClass}
          initial={{ id: "add", niveauName: "", note: "", sousTraitants: [], diametres: [] }}
        />
      ) : null}

      {openEdit && editingNiveau ? (
        <NiveauModal
          key={editingNiveau.id}
          open={openEdit}
          onClose={() => setEditId(null)}
          onSubmit={(payload) => updateFromModal(editingNiveau.id, payload)}
          inputClass={inputClass}
          initial={{
            id: editingNiveau.id,
            niveauName: editingNiveau.niveauName ?? "",
            note: editingNiveau.note ?? "",
            sousTraitants: editingNiveau.sousTraitants ?? [],
            diametres: editingNiveau.diametres ?? [],
          }}
        />
      ) : null}

      {data.niveaux.map((niv) => (
        <NiveauBlock
          key={niv.id}
          niveau={niv}
          onEdit={() => {
            setMouvModal({ mode: "edit", id: niv.id });
            setEditId(niv.id);
          }}
          onDelete={() => removeNiveau(niv.id)}
        />
      ))}

      <RecapByNiveau niveaux={data.niveaux} allMms={allMms} />
    </div>
  );
}

function RecapByNiveau({ niveaux, allMms }: { niveaux: NiveauTotal[]; allMms: number[] }) {
  const rows = useMemo(() => {
    return (niveaux.length ? niveaux : [{ id: "empty", niveauName: "", note: "", diametres: allMms, sousTraitants: [], rows: [] }]).map((n) => ({
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
                  <td
                    key={`gtq-${mm}`}
                    className="sticky bottom-0 z-30 bg-emerald-700 text-white border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide"
                  >
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

function NiveauBlock({ niveau, onEdit, onDelete }: { niveau: NiveauTotal; onEdit: () => void; onDelete: () => void }) {
  const mms = useMemo(() => [...(niveau.diametres?.length ? niveau.diametres : DEFAULT_MMS)].sort((a, b) => a - b), [niveau.diametres]);
  const totals = useMemo(() => computeTotals(niveau.rows ?? [], mms), [niveau.rows, mms]);

  return (
    <div className="bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">Niveau :</span>
              <span className="text-xl font-semibold text-gray-900">{niveau.niveauName || "—"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="ButtonSquare" title="Modifier" onClick={onEdit}>
                <FaRegEdit size={14} />
              </button>

              <button type="button" onClick={onDelete} className="ButtonSquareDelete" title="Supprimer">
                <FaTrashAlt size={14} />
              </button>
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
              <span className="text-sm font-semibold uppercase tracking-wide text-gray-900">Entreprise - Mains d'oeuvres</span>

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
                  <th key={`q-${niveau.id}-${mm}`} className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25">
                    Fer {mm} (m)
                  </th>
                ))}

                {mms.map((mm, idx) => (
                  <th
                    key={`p-${niveau.id}-${mm}`}
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
              {(niveau.rows ?? []).length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={2 + 2 * mms.length} className="py-6 text-center text-gray-600">
                    Aucune ligne.
                  </td>
                </tr>
              ) : (
                (niveau.rows ?? []).map((row, idx) => (
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
                ))
              )}

              <tr className="bg-(--primary) text-white">
                <td colSpan={2} className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2">
                  Total
                </td>

                {mms.map((mm) => (
                  <td
                    key={`tq-${niveau.id}-${mm}`}
                    className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide"
                  >
                    {fmtNumTrim3(totals.qty[mm] ?? 0)}
                  </td>
                ))}

                {mms.map((mm, idx2) => (
                  <td
                    key={`tp-${niveau.id}-${mm}`}
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

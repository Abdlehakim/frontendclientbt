// src/components/ferraillage/StepsPF/NiveauxPF.tsx
import React, { useEffect, useRef, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { LuPlus } from "react-icons/lu";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import type { NiveauRow, ProjectWizardData } from "../CreateProjetWizard";

type Props = {
  data: ProjectWizardData;
  setData: React.Dispatch<React.SetStateAction<ProjectWizardData>>;
};

const STANDARD_MMS = [6, 8, 10, 12, 14, 16, 20, 25, 32, 40, 50] as const;

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
              Sous-traitants ({items.length})
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

      <button type="button" className="ButtonSquare" title="Ajouter sous-traitant" aria-label="Ajouter sous-traitant" onClick={onAdd}>
        <LuPlus size={16} />
      </button>

      <button
        type="button"
        className="ButtonSquare"
        title="Liste des sous-traitants"
        aria-label="Liste des sous-traitants"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <IoIosArrowDropup size={18} /> : <IoIosArrowDropdown size={18} />}
      </button>
    </div>
  );
}

export default function NiveauxPF({ data, setData }: Props) {
  const [draftSous, setDraftSous] = useState<Record<string, string>>({});

  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const addNiveau = () => {
    const newNiveau: NiveauRow = { id: makeId(), name: "", note: "", selectedMms: [], sousTraitants: [] };
    setData((p) => ({ ...p, niveaux: [newNiveau, ...p.niveaux] }));
  };

  const removeNiveau = (id: string) => {
    setDraftSous((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    setData((p) => ({ ...p, niveaux: p.niveaux.filter((x) => x.id !== id) }));
  };

  const updateNiveau = (id: string, patch: Partial<NiveauRow>) => {
    setData((p) => ({ ...p, niveaux: p.niveaux.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  };

  const toggleMm = (niveauId: string, mm: number) => {
    setData((p) => ({
      ...p,
      niveaux: p.niveaux.map((n) => {
        if (n.id !== niveauId) return n;
        const set = new Set<number>(n.selectedMms ?? []);
        if (set.has(mm)) set.delete(mm);
        else set.add(mm);
        return { ...n, selectedMms: Array.from(set).sort((a, b) => a - b) };
      }),
    }));
  };

  const addSousTraitantValue = (niveauId: string) => {
    const raw = (draftSous[niveauId] ?? "").trim();
    if (!raw) return;

    setData((p) => ({
      ...p,
      niveaux: p.niveaux.map((n) => {
        if (n.id !== niveauId) return n;
        const current = n.sousTraitants ?? [];
        if (current.includes(raw)) return n;
        return { ...n, sousTraitants: [...current, raw] };
      }),
    }));

    setDraftSous((p) => ({ ...p, [niveauId]: "" }));
  };

  const removeSousTraitant = (niveauId: string, idx: number) => {
    setData((p) => ({
      ...p,
      niveaux: p.niveaux.map((n) => {
        if (n.id !== niveauId) return n;
        const next = (n.sousTraitants ?? []).filter((_, i) => i !== idx);
        return { ...n, sousTraitants: next };
      }),
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xl uppercase font-bold text-gray-800">Niveaux</div>

        <button type="button" onClick={addNiveau} className="btn-fit-white-outline">
          Ajouter niveau
        </button>
      </div>

      {data.niveaux.length === 0 ? (
        <div className="text-sm text-gray-600 rounded-md border border-gray-200 bg-white p-4">
          Aucun niveau. Cliquez sur “Ajouter niveau”.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.niveaux.map((n) => (
            <div key={n.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-end">
                <button onClick={() => removeNiveau(n.id)} className="ButtonSquareDelete" title="Supprimer" type="button">
                  <FaTrashAlt size={14} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Nom du niveau</label>
                  <input className={inputClass} value={n.name} onChange={(e) => updateNiveau(n.id, { name: e.target.value })} placeholder="Ex: Etage 1" />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
                  <input className={inputClass} value={n.note} onChange={(e) => updateNiveau(n.id, { note: e.target.value })} placeholder="Optionnel" />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Sous-traitants</label>

                  <SousTraitantsField
                    niveauId={n.id}
                    inputClass={inputClass}
                    draftValue={draftSous[n.id] ?? ""}
                    setDraftValue={(v) => setDraftSous((p) => ({ ...p, [n.id]: v }))}
                    items={n.sousTraitants ?? []}
                    onAdd={() => addSousTraitantValue(n.id)}
                    onRemove={(idx) => removeSousTraitant(n.id, idx)}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-3">
                <div className="text-sm font-semibold text-gray-700 mb-4">Diamètres actifs</div>

                <div className="max-h-72 overflow-auto pr-1">
                  <div className="grid grid-cols-5 gap-2 items-start">
                    {STANDARD_MMS.map((mm) => {
                      const checked = (n.selectedMms ?? []).includes(mm);
                      return (
                        <label
                          key={mm}
                          className={[
                            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer select-none truncate",
                            checked ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200" : "bg-white text-slate-700 hover:bg-emerald-50 border-gray-200",
                          ].join(" ")}
                        >
                          <input className="h-4 w-4 accent-emerald-600" type="checkbox" checked={checked} onChange={() => toggleMm(n.id, mm)} />
                          <span className="truncate">Fer {mm}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

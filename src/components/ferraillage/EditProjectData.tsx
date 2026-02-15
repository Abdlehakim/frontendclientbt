// src/components/ferraillage/EditProjectData.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import CalculeTotalFerraillage from "@/components/ferraillage/Edit/EditCalculeTotalFerraillage";

type TabKey = "TOTAL_FERRAILLAGE" | "ATTACHEMENT" | "QUANTITE" | "AVANCES" | "FINALE";

const TABS: { key: TabKey; label: string }[] = [
  { key: "TOTAL_FERRAILLAGE", label: "Calcule Totale De Ferraillage" },
  { key: "ATTACHEMENT", label: "Rapport d'attachement" },
  { key: "QUANTITE", label: "Calcule de Quantité" },
  { key: "AVANCES", label: "Avances de paiment" },
  { key: "FINALE", label: "Verification et calcule Finale" },
];

type RapportLite = {
  id: string;
  chantierName: string;
  sousTraitant?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  typeAcier?: string | null;
  note?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  rapport: RapportLite | null;
};

type DiametreRow = {
  mm: number;
  isActive: boolean;
};

const LOCAL_DIAMETRES: DiametreRow[] = [
  { mm: 6, isActive: true },
  { mm: 8, isActive: true },
  { mm: 10, isActive: true },
  { mm: 12, isActive: true },
  { mm: 14, isActive: true },
  { mm: 16, isActive: true },
  { mm: 20, isActive: true },
];

const ACIER_OPTIONS = ["F400", "F500"] as const;

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

function TypeAcierDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const shownValue = value?.trim() ? value : "Choisir...";

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
      <label className="text-sm font-semibold text-gray-700 mb-1">Type d'acier</label>

      <button
        type="button"
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value?.trim() ? "truncate" : "truncate text-emerald-800/60"}>{shownValue}</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open ? (
        <div className="relative">
          <div
            className="absolute left-0 right-0 z-50 mt-2 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
            role="listbox"
          >
            {ACIER_OPTIONS.map((opt) => {
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

            <div className="border-t border-slate-100" />

          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyAttachementTab({ mmCols }: { mmCols: number[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">ETAT DE FER LIVRE AU CHANTIER</div>
          <div className="text-sm text-gray-700">
            <strong>Etat Date:</strong> —
          </div>
        </div>

        <div className="overflow-auto">
          <table className="border-collapse table-fixed w-full min-w-262.5">
            <thead>
              <tr className="bg-(--primary) text-white">
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">Date</th>
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-80">
                  N° Bon de livraison
                </th>
                {mmCols.map((mm) => (
                  <th
                    key={`etat-h-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75"
                  >
                    Fer de {mm}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={2 + mmCols.length} className="py-6 text-center text-gray-600">
                  Aucun mouvement.
                </td>
              </tr>

              <tr className="bg-(--primary) text-white">
                <td className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">TOTAL</td>
                <td className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40" />
                {mmCols.map((mm) => (
                  <td
                    key={`etat-t-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40"
                  />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">Quantité restante non confectionné</div>
          <div className="text-sm text-gray-700">
            <strong>Rapport Date:</strong> —
          </div>
        </div>

        <div className="overflow-auto">
          <table className="border-collapse table-fixed w-full min-w-262.5">
            <thead>
              <tr className="bg-(--primary) text-white">
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">Date</th>
                {mmCols.map((mm) => (
                  <th
                    key={`rest-h-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75"
                  >
                    Fer de {mm}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={1 + mmCols.length} className="py-6 text-center text-gray-600">
                  Aucun snapshot.
                </td>
              </tr>

              <tr className="bg-(--primary) text-white">
                <td className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">TOTAL</td>
                {mmCols.map((mm) => (
                  <td
                    key={`rest-t-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40"
                  />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditProjectDataPanel({ onClose, rapport }: { onClose: () => void; rapport: RapportLite | null }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<TabKey>("TOTAL_FERRAILLAGE");

  const [chantierName, setChantierName] = useState(() => rapport?.chantierName ?? "");
  const [typeAcier, setTypeAcier] = useState(() => rapport?.typeAcier ?? "");
  const [note, setNote] = useState(() => rapport?.note ?? "");

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const mmCols = useMemo(() => {
    const active = LOCAL_DIAMETRES.filter((d) => d.isActive).sort((a, b) => a.mm - b.mm);
    return active.map((d) => d.mm);
  }, []);

  const tabLabel = useMemo(() => TABS.find((t) => t.key === tab)?.label ?? "", [tab]);

  const closeOnBackdrop = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const textareaClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60 min-h-24 resize-y";

  return (
    <div className="fixed inset-0 z-99">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className="w-full max-w-[98%] h-[98%] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col">
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-900">Modifier — Données du projet</div>
              <div className="text-xs text-gray-600">{chantierName ? <span className="font-semibold">{chantierName}</span> : "—"}</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-auto bg-green-50">
            <div className="bg-white shadow rounded p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Chantier</label>
                <input
                  value={chantierName}
                  onChange={(e) => setChantierName(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Pharmaghreb - El Agba"
                />
              </div>

              <TypeAcierDropdown value={typeAcier} onChange={setTypeAcier} />

              <div className="flex flex-col md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className={textareaClass} placeholder="Optionnel" />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap justify-center gap-2 border-b-transparent p-3">
                {TABS.map((t) => {
                  const active = t.key === tab;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={
                        active
                          ? "px-4 py-2 rounded bg-(--primary) text-white font-semibold"
                          : "px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }
                      type="button"
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 min-h-65">
                {tab === "TOTAL_FERRAILLAGE" ? (
                  <CalculeTotalFerraillage />
                ) : tab === "ATTACHEMENT" ? (
                  <EmptyAttachementTab mmCols={mmCols} />
                ) : (
                  <div className="text-gray-500">
                    <strong>{tabLabel}</strong>
                    <div className="mt-2 italic">Contenu à définir…</div>
                  </div>
                )}
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
            aria-label="Actions"
          >
            <div className="flex items-center justify-start gap-2 flex-1">
              <button type="button" onClick={onClose} className="stepper__nav" id="modelCancelFlowBtn">
                Fermer
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditProjectData({ open, onClose, rapport }: Props) {
  if (!open) return null;
  return createPortal(<EditProjectDataPanel key={rapport?.id ?? "none"} onClose={onClose} rapport={rapport} />, document.body);
}

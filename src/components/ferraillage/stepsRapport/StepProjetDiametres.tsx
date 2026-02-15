import React, { useEffect, useRef, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import type { WizardData } from "@/types/wizard";

type Props = {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
  knownMms: number[];
  firstMm: number;
  lastMm: number;
  selectedSet: Set<number>;
  toggleMm: (mm: number) => void;
  addPrevLabelOnly: () => void;
  removeFirstLabelOnly: () => void;
  addNextLabelOnly: () => void;
  removeLastLabelOnly: () => void;
  canRemoveFirst: boolean;
  canRemoveLast: boolean;
};

const STANDARD_MMS = [6, 8, 10, 12, 14, 16, 20, 25, 32, 40, 50] as const;
const ACIER_OPTIONS: WizardData["acierType"][] = ["F400", "F500"];

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

export default function StepProjetDiametres({ data, setData, selectedSet, toggleMm }: Props) {
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

  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  return (
    <div className="flex flex-col gap-4">
      <div className="px-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Informations projet</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Chantier</label>
            <input
              className={inputClass}
              value={data.chantierName}
              onChange={(e) => setData((p) => ({ ...p, chantierName: e.target.value }))}
              placeholder="Ex: Pharmaghreb - El Agba"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Sous-traitant</label>
            <input
              className={inputClass}
              value={data.sousTraitant}
              onChange={(e) => setData((p) => ({ ...p, sousTraitant: e.target.value }))}
              placeholder="Ex: Ste. AM SIOUD CONSTRUCTION"
            />
          </div>

          <div className="flex flex-col" ref={wrapRef}>
            <label className="text-sm font-semibold text-gray-700 mb-1">Type d'acier</label>

            <button
              type="button"
              className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-disabled="false"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="truncate">{data.acierType}</span>
              {open ? (
                <IoIosArrowDropup className="shrink-0" size={18} />
              ) : (
                <IoIosArrowDropdown className="shrink-0" size={18} />
              )}
            </button>

            {open ? (
              <div className="relative">
                <div
                  className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
                  role="listbox"
                >
                  {ACIER_OPTIONS.map((opt) => {
                    const selected = opt === data.acierType;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setData((p) => ({ ...p, acierType: opt }));
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
                            selected
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 text-transparent",
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
        </div>
      </div>

      <div className="px-4">
        <div className="mt-2 border-t border-gray-200 pt-3">
          <div className="text-sm font-semibold text-gray-700 mb-4">Diamètres actifs</div>

          <div className="max-h-72 overflow-auto pr-1">
            <div className="grid grid-cols-5 gap-2 items-start">
              {STANDARD_MMS.map((mm) => {
                const checked = selectedSet.has(mm);
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
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMm(mm)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="truncate">Fer {mm}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

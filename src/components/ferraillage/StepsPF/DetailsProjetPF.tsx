// src/components/ferraillage/StepsPF/DetailsProjetPF.tsx
import React, { useEffect, useRef, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import type { AcierType, ProjectWizardData } from "../CreateProjetWizard";

type Props = {
  data: ProjectWizardData;
  setData: React.Dispatch<React.SetStateAction<ProjectWizardData>>;
};

const ACIER_OPTIONS: AcierType[] = ["F400", "F500"];

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

function AcierDropdown({ value, onChange }: { value: AcierType; onChange: (v: AcierType) => void }) {
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
      <label className="text-sm font-semibold text-gray-700 mb-1">Type d'acier</label>

      <button
        type="button"
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{value}</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open ? (
        <div className="relative">
          <div className="absolute left-0 right-0 z-50 mt-2 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200" role="listbox">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DetailsProjetPF({ data, setData }: Props) {
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
    <div className="flex flex-col gap-4">
      <div className="text-sm font-semibold text-gray-800">Informations projet</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Chantier</label>
          <input
            className={inputClass}
            value={data.chantierName}
            onChange={(e) => setData((p) => ({ ...p, chantierName: e.target.value }))}
            placeholder="Ex: Pharmaghreb - El Agba"
          />
        </div>

        <AcierDropdown value={data.acierType} onChange={(v) => setData((p) => ({ ...p, acierType: v }))} />

        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
          <textarea
            className={textareaClass}
            value={data.note ?? ""}
            onChange={(e) => setData((p) => ({ ...p, note: e.target.value }))}
            placeholder="Optionnel"
          />
        </div>
      </div>
    </div>
  );
}

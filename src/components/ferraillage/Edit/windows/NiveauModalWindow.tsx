// src/components/ferraillage/Edit/windows/NiveauModalWindow.tsx
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import type { MouseEvent as ReactMouseEvent } from "react";

export default function NiveauModalWindow({
  open,
  title,
  panelRef,
  onClose,
  closeOnBackdrop,
  inputClass,
  nameValue,
  onNameChange,
  noteValue,
  onNoteChange,
  sousTraitantsField,
  standardMms,
  selectedMms,
  onToggleMm,
  onSubmit,
  submitLabel,
  canSubmit,
  nameInvalid,
  mmsInvalid,
}: {
  open: boolean;
  title: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  closeOnBackdrop: (ev: ReactMouseEvent<HTMLDivElement>) => void;
  inputClass: string;
  nameValue: string;
  onNameChange: (v: string) => void;
  noteValue: string;
  onNoteChange: (v: string) => void;
  sousTraitantsField: React.ReactNode;
  standardMms: readonly number[];
  selectedMms: number[];
  onToggleMm: (mm: number) => void;
  onSubmit: () => void;
  submitLabel: string;
  canSubmit: boolean;
  nameInvalid: boolean;
  mmsInvalid: boolean;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className="w-full max-w-5xl rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Nom du niveau</label>
                <input
                  className={inputClass}
                  value={nameValue}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Ex: Etage 1"
                  aria-invalid={nameInvalid}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
                <input className={inputClass} value={noteValue} onChange={(e) => onNoteChange(e.target.value)} placeholder="Optionnel" />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Entreprise - Mains d'oeuvres</label>
                {sousTraitantsField}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-3">
              <div className="text-sm font-semibold text-gray-700 mb-4">Diamètres actifs</div>

              <div className="max-h-72 overflow-auto pr-1" aria-invalid={mmsInvalid}>
                <div className="grid grid-cols-5 gap-2 items-start">
                  {standardMms.map((mm) => {
                    const checked = (selectedMms ?? []).includes(mm);
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
                        <input className="h-4 w-4 accent-emerald-600" type="checkbox" checked={checked} onChange={() => onToggleMm(mm)} />
                        <span className="truncate">Fer {mm}</span>
                      </label>
                    );
                  })}
                </div>
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
              <button type="button" className="stepper__nav" onClick={onClose}>
                Annuler
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
              <button type="button" className="stepper__nav" onClick={onSubmit} disabled={!canSubmit} aria-disabled={!canSubmit}>
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

import type { Dispatch, SetStateAction } from "react";
import DotsPagination from "@/components/DotsPagination";
import AddPlusDropdown from "./AddPlusDropdown";
import DesignationDropdown from "./DesignationDropdown";

const actionButtonClass = "stepper__nav inline-flex items-center justify-center gap-2";

export default function ModalTopFields({
  designation,
  onDesignationChange,
  submitLabel,
  nomenclature,
  setNomenclature,
  nbStr,
  setNbStr,
  hauteurStr,
  setHauteurStr,
  showHauteurField,
  hauteurLabel,
  hauteurPlaceholder,
  inputClass,
  safePage,
  totalPages,
  onPageChange,
  onAddCadre,
  onAddBarre,
  onAddEpingle,
  onAddEtriers,
  showCadreAddOption,
  showEpingleAddOption,
  showEtriersAddOption,
  addDropdownCloseKey,
  isRecapOpen,
  onToggleRecap,
  canSubmit,
  onSubmit,
  submitting = false,
}: {
  designation: string;
  onDesignationChange: (value: string) => void;
  submitLabel: string;
  nomenclature: string;
  setNomenclature: Dispatch<SetStateAction<string>>;
  nbStr: string;
  setNbStr: Dispatch<SetStateAction<string>>;
  hauteurStr: string;
  setHauteurStr: Dispatch<SetStateAction<string>>;
  showHauteurField: boolean;
  hauteurLabel: string;
  hauteurPlaceholder: string;
  inputClass: string;
  safePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddCadre: () => void;
  onAddBarre: () => void;
  onAddEpingle: () => void;
  onAddEtriers: () => void;
  showCadreAddOption: boolean;
  showEpingleAddOption: boolean;
  showEtriersAddOption: boolean;
  addDropdownCloseKey: string;
  isRecapOpen: boolean;
  onToggleRecap: () => void;
  canSubmit: boolean;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  const topFieldsClass = showHauteurField
    ? "grid grid-cols-1 gap-4 md:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)_120px_minmax(9rem,12rem)] md:items-end"
    : "grid grid-cols-1 gap-4 md:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)_120px] md:items-end";
  const designationValue = (designation ?? "").trim();
  const hasValidDesignation = designationValue !== "" && designationValue !== "Choisir...";

  return (
    <div className="grid grid-cols-1 gap-2 shrink-0">
      <div className={topFieldsClass}>
        <div className="flex flex-col">
          <DesignationDropdown label="Designations" value={designation} onChange={onDesignationChange} />
        </div>

        <div className="flex min-w-0 flex-col md:flex-1">
          <label className="text-xs font-semibold text-gray-700 mb-1">Nomenclature</label>
          <input
            className={inputClass}
            value={nomenclature}
            onChange={(e) => setNomenclature(e.target.value)}
            placeholder="Ex: Code nomenclature"
          />
        </div>

        <div className="flex w-full flex-col md:w-120px">
          <label className="text-xs font-semibold text-gray-700 mb-1">NB</label>
          <input
            className={inputClass}
            value={nbStr}
            onChange={(e) => setNbStr(e.target.value)}
            placeholder="Ex: 1"
            inputMode="numeric"
          />
        </div>

        {showHauteurField ? (
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-1">{hauteurLabel}</label>
            <input
              className={inputClass}
              value={hauteurStr}
              onChange={(e) => setHauteurStr(e.target.value)}
              placeholder={hauteurPlaceholder}
              inputMode="decimal"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <DotsPagination currentPage={safePage} totalPages={totalPages} onPageChange={onPageChange} />

        <div className="flex items-center justify-end gap-2">
          <AddPlusDropdown
            onAddCadre={onAddCadre}
            onAddBarre={onAddBarre}
            onAddEpingle={onAddEpingle}
            onAddEtriers={onAddEtriers}
            showCadreOption={showCadreAddOption}
            showBarreOption
            showEpingleOption={showEpingleAddOption}
            showEtriersOption={showEtriersAddOption}
            closeOnChangeKey={addDropdownCloseKey}
            disabled={!hasValidDesignation}
          />

          <button
            type="button"
            className={actionButtonClass}
            onClick={onToggleRecap}
            aria-pressed={isRecapOpen}
            title="Récapitulatif"
          >
            <span>Récapitulatif</span>
          </button>

          <button
            type="button"
            className={actionButtonClass}
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            aria-disabled={!canSubmit || submitting}
          >
            {submitting ? "Enregistrement..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

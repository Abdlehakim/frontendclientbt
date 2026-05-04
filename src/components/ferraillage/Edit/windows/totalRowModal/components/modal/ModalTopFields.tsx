import type { Dispatch, SetStateAction } from "react";
import DotsPagination from "@/components/DotsPagination";
import AddPlusDropdown from "./AddPlusDropdown";
import DesignationDropdown from "./DesignationDropdown";

export default function ModalTopFields({
  designation,
  setDesignation,
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
}: {
  designation: string;
  setDesignation: Dispatch<SetStateAction<string>>;
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
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
      <div className="flex flex-col md:col-span-4">
        <DesignationDropdown label="Designations" value={designation} onChange={setDesignation} />
      </div>

      <div className="flex flex-col md:col-span-3">
        <label className="text-xs font-semibold text-gray-700 mb-1">Nomenclature</label>
        <input
          className={inputClass}
          value={nomenclature}
          onChange={(e) => setNomenclature(e.target.value)}
          placeholder="Ex: Code nomenclature"
        />
      </div>

      <div className={`flex flex-col ${showHauteurField ? "md:col-span-2" : "md:col-span-5"}`}>
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
        <div className="flex flex-col md:col-span-3">
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

      <div className="md:col-span-12 flex justify-between border-t border-gray-200 pt-3">
        <DotsPagination currentPage={safePage} totalPages={totalPages} onPageChange={onPageChange} />
        <AddPlusDropdown
          onAddCadre={onAddCadre}
          onAddBarre={onAddBarre}
          onAddEpingle={onAddEpingle}
          onAddEtriers={onAddEtriers}
        />
      </div>
    </div>
  );
}


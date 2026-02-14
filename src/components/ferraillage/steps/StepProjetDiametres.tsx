import React from "react";
import { LuMinus, LuPlus } from "react-icons/lu";
import type { WizardData } from "../CreateRapportWizard";

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

export default function StepProjetDiametres({
  data,
  setData,
  knownMms,
  firstMm,
  lastMm,
  selectedSet,
  toggleMm,
  addPrevLabelOnly,
  removeFirstLabelOnly,
  addNextLabelOnly,
  removeLastLabelOnly,
  canRemoveFirst,
  canRemoveLast,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="px-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">Informations projet</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Chantier</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              value={data.chantierName}
              onChange={(e) => setData((p) => ({ ...p, chantierName: e.target.value }))}
              placeholder="Ex: Pharmaghreb - El Agba"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Sous-traitant</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              value={data.sousTraitant}
              onChange={(e) => setData((p) => ({ ...p, sousTraitant: e.target.value }))}
              placeholder="Ex: Ste. AM SIOUD CONSTRUCTION"
            />
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="mt-2 border-t border-gray-200 pt-3">
          <div className="text-sm font-semibold text-gray-700 mb-4">Diamètres actifs</div>

          <div className="max-h-72 overflow-auto pr-1">
            <div className="grid grid-cols-5 gap-2 items-start">
              {knownMms.map((mm) => {
                const isFirst = mm === firstMm;
                const isLast = mm === lastMm;

                return (
                  <div key={mm} className="flex items-center gap-2">
                    {isFirst ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={addPrevLabelOnly}
                          className="ButtonSquare"
                          title="Ajouter le diamètre précédent (4,3,2,1...)"
                        >
                          <LuPlus size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={removeFirstLabelOnly}
                          className="ButtonSquare disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer le premier diamètre ajouté"
                          disabled={!canRemoveFirst}
                        >
                          <LuMinus size={18} />
                        </button>
                      </div>
                    ) : null}

                    <label className="flex-1 flex items-center gap-2 rounded border border-gray-200 px-2 py-2 text-sm hover:bg-gray-50 cursor-pointer select-none">
                      <input type="checkbox" checked={selectedSet.has(mm)} onChange={() => toggleMm(mm)} />
                      <span>Fer {mm}</span>
                    </label>

                    {isLast ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={addNextLabelOnly}
                          className="ButtonSquare"
                          title="Ajouter le diamètre suivant (22,23,24...)"
                        >
                          <LuPlus size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={removeLastLabelOnly}
                          className="ButtonSquare disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer le dernier diamètre ajouté"
                          disabled={!canRemoveLast}
                        >
                          <LuMinus size={18} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

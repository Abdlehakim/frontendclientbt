import { CiCircleRemove } from "react-icons/ci";
import { IoInformationCircleOutline } from "react-icons/io5";
import type { FormeState } from "../../types";
import FormeBarre from "../formeBarre/FormeBarre";

export default function BarreCard({
  x,
  label,
  designation,
  safeMms,
  inputClass,
  twoColGrid,
  nbStr,
  hauteurStr,
  barreLitIndex,
  onPatch,
  onRemove,
  onShowAbbreviations,
}: {
  x: FormeState;
  label: string;
  designation: string;
  safeMms: number[];
  inputClass: string;
  twoColGrid: string;
  nbStr: string;
  hauteurStr: string;
  barreLitIndex: number | null;
  onPatch: (patch: Partial<FormeState>) => void;
  onRemove: () => void;
  onShowAbbreviations: () => void;
}) {
  return (
    <div
      className={["h-140 md:col-span-4 rounded-lg min-h-12.5 border p-4", "border-slate-200 bg-slate-50/60"].join(" ")}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-900">{label}</div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:cursor-pointer transition-colors"
            onClick={onShowAbbreviations}
            title="Afficher les abrÃ©viations"
            aria-label="Afficher les abrÃ©viations"
          >
            <IoInformationCircleOutline size={28} />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 hover:cursor-pointer"
            onClick={onRemove}
            title="Supprimer"
            aria-label="Supprimer"
          >
            <CiCircleRemove size={28} />
          </button>
        </div>
      </div>

      <FormeBarre
        x={x}
        designation={designation}
        safeMms={safeMms}
        inputClass={inputClass}
        twoColGrid={twoColGrid}
        nbStr={nbStr}
        hauteurStr={hauteurStr}
        barreLitIndex={barreLitIndex}
        onPatch={onPatch}
      />
    </div>
  );
}


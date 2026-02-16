import { useMemo } from "react";
import { CiCircleRemove } from "react-icons/ci";
import type { FormeState } from "../types";
import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";
import DiametreDropdown from "./DiametreDropdown";
import FormeDropdown from "./FormeDropdown";

type CadreForme = Exclude<FormeState["forme"], "BARRE">;

function fmt(n: number) {
  const r = Math.round(n * 1000) / 1000;
  return String(r).replace(".", ",");
}

function computeCadrePerimetre(forme: CadreForme, longueurStr: string, largeurStr: string, diamCercleStr: string, ancrageStr: string) {
  const L = parseNonNegativeNumber(longueurStr);
  const W = parseNonNegativeNumber(largeurStr);
  const D = parseNonNegativeNumber(diamCercleStr);
  const A = parseNonNegativeNumber(ancrageStr);

  const hasAny = L != null || W != null || D != null || A != null;
  if (!hasAny) return 0;

  const l = L ?? 0;
  const w = W ?? 0;
  const d = D ?? 0;
  const a = A ?? 0;

  if (forme === "CARRE") return 4 * l + 2 * a;
  if (forme === "CIRCULAIRE") return d * Math.PI + 2 * a;
  return 2 * (l + w) + 2 * a;
}

function computeCadreNT(nbStr: string, hauteurStr: string, espacementStr: string) {
  const NB = parseNonNegativeInt(nbStr);
  const H = parseNonNegativeNumber(hauteurStr);
  const E = parseNonNegativeNumber(espacementStr);

  const hasAny = NB != null || H != null || E != null;
  if (!hasAny) return 0;

  const nb = NB ?? 0;
  const h = H ?? 0;
  const e = E ?? 0;

  if (e <= 0) return 0;
  return nb * (h / e);
}

function computeCadreQte(nbStr: string, hauteurStr: string, espacementStr: string, perimetre: number) {
  const nt = computeCadreNT(nbStr, hauteurStr, espacementStr);
  if (nt <= 0) return 0;
  return perimetre * nt;
}

function computeBarreNT(nbStr: string, nBarreStr: string) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);

  const hasAny = NB != null || N != null;
  if (!hasAny) return 0;

  const nb = NB ?? 0;
  const n = N ?? 0;

  return nb * n;
}

function computeBarreQte(nbStr: string, nBarreStr: string, hauteurStr: string, attenteStr: string, ancrageStr: string) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);
  const H = parseNonNegativeNumber(hauteurStr);
  const AT = parseNonNegativeNumber(attenteStr);
  const A = parseNonNegativeNumber(ancrageStr);

  const hasAny = NB != null || N != null || H != null || AT != null || A != null;
  if (!hasAny) return 0;

  const nb = NB ?? 0;
  const n = N ?? 0;
  const h = H ?? 0;
  const at = AT ?? 0;
  const a = A ?? 0;

  return nb * (n * (h + at + a));
}

export default function FormeCard({
  x,
  cadreLabel,
  safeMms,
  inputClass,
  twoColGrid,
  nbStr,
  hauteurStr,
  onRemove,
  onSetForme,
  onPatch,
}: {
  x: FormeState;
  cadreLabel: string;
  safeMms: number[];
  inputClass: string;
  twoColGrid: string;
  nbStr: string;
  hauteurStr: string;
  onRemove: () => void;
  onSetForme: (v: FormeState["forme"]) => void;
  onPatch: (patch: Partial<FormeState>) => void;
}) {
  const isBarre = x.forme === "BARRE";
  const cadreForme = (x.forme === "BARRE" ? "CARRE" : x.forme) as CadreForme;

  const perimetreAuto = useMemo(() => {
    if (isBarre) return 0;
    return computeCadrePerimetre(cadreForme, x.longueurStr, x.largeurStr, x.rayonStr, x.ancrageStr);
  }, [isBarre, cadreForme, x.longueurStr, x.largeurStr, x.rayonStr, x.ancrageStr]);

  const cadreNTAuto = useMemo(() => {
    if (isBarre) return 0;
    return computeCadreNT(nbStr, hauteurStr, x.espacementStr);
  }, [isBarre, nbStr, hauteurStr, x.espacementStr]);

  const cadreQteAuto = useMemo(() => {
    if (isBarre) return 0;
    return computeCadreQte(nbStr, hauteurStr, x.espacementStr, perimetreAuto);
  }, [isBarre, nbStr, hauteurStr, x.espacementStr, perimetreAuto]);

  const barreQteAuto = useMemo(() => {
    if (!isBarre) return 0;
    return computeBarreQte(nbStr, x.nBarreStr, hauteurStr, x.attenteStr, x.ancrageStr);
  }, [isBarre, nbStr, x.nBarreStr, hauteurStr, x.attenteStr, x.ancrageStr]);

  const barreNTAuto = useMemo(() => {
    if (!isBarre) return 0;
    return computeBarreNT(nbStr, x.nBarreStr);
  }, [isBarre, nbStr, x.nBarreStr]);

  const blueAutoStyle = { backgroundColor: "#EFF6FF", borderColor: "#3B82F6", color: "#1E40AF" } as const;

  const ntCadreLabel =
    cadreForme === "CARRE" ? "N.T.C. Carré" : cadreForme === "CIRCULAIRE" ? "N.T.C. Circulaire" : "N.T.C. Rectangulaire";

  return (
    <div className={["h-100 md:col-span-4 rounded-lg min-h-12.5 border p-4", "border-slate-200 bg-slate-50/60"].join(" ")}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-900">{cadreLabel}</div>
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

      {isBarre ? (
        <div className={twoColGrid}>
          <div className="flex flex-col">
            <DiametreDropdown label="Diamètre" mms={safeMms} value={x.diametreMm} onChange={(v) => onPatch({ diametreMm: v })} />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">N.barre</label>
            <input className={inputClass} value={x.nBarreStr} onChange={(e) => onPatch({ nBarreStr: e.target.value })} placeholder="Ex: 4" inputMode="numeric" />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Attente barre (m)</label>
            <input className={inputClass} value={x.attenteStr} onChange={(e) => onPatch({ attenteStr: e.target.value })} placeholder="Ex: 0,6" inputMode="decimal" />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage (m)</label>
            <input className={inputClass} value={x.ancrageStr} onChange={(e) => onPatch({ ancrageStr: e.target.value })} placeholder="Ex: 0,4" inputMode="decimal" />
          </div>

          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Quantités de Fer (m)</label>
              <input className={[inputClass, "font-semibold"].join(" ")} value={fmt(barreQteAuto)} readOnly aria-readonly="true" style={blueAutoStyle} />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">N.T.Barre</label>
              <input className={[inputClass, "font-semibold"].join(" ")} value={fmt(barreNTAuto)} readOnly aria-readonly="true" style={blueAutoStyle} />
            </div>
          </div>
        </div>
      ) : (
        <div className={twoColGrid}>
          <div className="flex flex-col">
            <FormeDropdown label="Forme" value={cadreForme} onChange={(v) => onSetForme(v)} />
          </div>

          <div className="flex flex-col">
            <DiametreDropdown label="Diamètre" mms={safeMms} value={x.diametreMm} onChange={(v) => onPatch({ diametreMm: v })} />
          </div>

          {cadreForme === "CARRE" ? (
            <>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Longueur (m)</label>
                <input className={inputClass} value={x.longueurStr} onChange={(e) => onPatch({ longueurStr: e.target.value })} placeholder="Ex: 3,5" inputMode="decimal" />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage (m)</label>
                <input className={inputClass} value={x.ancrageStr} onChange={(e) => onPatch({ ancrageStr: e.target.value })} placeholder="Ex: 0,4" inputMode="decimal" />
              </div>
            </>
          ) : null}

          {cadreForme === "CIRCULAIRE" ? (
            <>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Diamètre du cercle (m)</label>
                <input className={inputClass} value={x.rayonStr} onChange={(e) => onPatch({ rayonStr: e.target.value })} placeholder="Ex: 0,25" inputMode="decimal" />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage (m)</label>
                <input className={inputClass} value={x.ancrageStr} onChange={(e) => onPatch({ ancrageStr: e.target.value })} placeholder="Ex: 0,4" inputMode="decimal" />
              </div>
            </>
          ) : null}

          {cadreForme === "RECTANGULAIRE" ? (
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Longueur (m)</label>
                <input className={inputClass} value={x.longueurStr} onChange={(e) => onPatch({ longueurStr: e.target.value })} placeholder="Ex: 3,5" inputMode="decimal" />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Largeur (m)</label>
                <input className={inputClass} value={x.largeurStr} onChange={(e) => onPatch({ largeurStr: e.target.value })} placeholder="Ex: 2,2" inputMode="decimal" />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage</label>
                <input className={inputClass} value={x.ancrageStr} onChange={(e) => onPatch({ ancrageStr: e.target.value })} placeholder="Ex: 0,4" inputMode="decimal" />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Périmètre (auto)</label>
            <input className={[inputClass, "font-semibold"].join(" ")} value={fmt(perimetreAuto)} readOnly aria-readonly="true" style={blueAutoStyle} />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Espacement (m)</label>
            <input className={inputClass} value={x.espacementStr} onChange={(e) => onPatch({ espacementStr: e.target.value })} placeholder="Ex: 15" inputMode="decimal" />
          </div>

          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Quantités de Fer (m)</label>
              <input className={[inputClass, "font-semibold"].join(" ")} value={fmt(cadreQteAuto)} readOnly aria-readonly="true" style={blueAutoStyle} />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">{ntCadreLabel}</label>
              <input className={[inputClass, "font-semibold"].join(" ")} value={fmt(cadreNTAuto)} readOnly aria-readonly="true" style={blueAutoStyle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

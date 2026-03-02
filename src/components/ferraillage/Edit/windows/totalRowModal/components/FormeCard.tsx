import { useMemo } from "react";
import { CiCircleRemove } from "react-icons/ci";
import type { FormeState } from "../types";
import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";
import DiametreDropdown from "./DiametreDropdown";
import FormeDropdown from "./FormeDropdown";

type CadreForme = Exclude<FormeState["forme"], "BARRE">;
type CadreCalcMode = "ESPACEMENT" | "NB_CADRE";

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

function computeCadreNTFromEspacement(nbStr: string, hauteurStr: string, espacementStr: string) {
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

function computeCadreNTFromNbCadre(nbStr: string, nbCadreStr: string) {
  const NB = parseNonNegativeInt(nbStr);
  const NC = parseNonNegativeInt(nbCadreStr);

  const hasAny = NB != null || NC != null;
  if (!hasAny) return 0;

  const nb = NB ?? 0;
  const nbCadre = NC ?? 0;

  return nb * nbCadre;
}

function computeCadreNT(mode: CadreCalcMode, nbStr: string, hauteurStr: string, espacementStr: string, nbCadreStr: string) {
  if (mode === "NB_CADRE") return computeCadreNTFromNbCadre(nbStr, nbCadreStr);
  return computeCadreNTFromEspacement(nbStr, hauteurStr, espacementStr);
}

function computeCadreQte(nt: number, perimetre: number) {
  if (nt <= 0) return 0;
  return perimetre * nt;
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
  const cadreForme = x.forme as CadreForme;
  const cadreCalcMode: CadreCalcMode = x.cadreCalcMode === "NB_CADRE" ? "NB_CADRE" : "ESPACEMENT";
  const nbCadreStr = x.nbCadreStr ?? "0";

  const perimetreAuto = useMemo(() => {
    return computeCadrePerimetre(cadreForme, x.longueurStr, x.largeurStr, x.rayonStr, x.ancrageStr);
  }, [cadreForme, x.longueurStr, x.largeurStr, x.rayonStr, x.ancrageStr]);

  const cadreNTAuto = useMemo(() => {
    return computeCadreNT(cadreCalcMode, nbStr, hauteurStr, x.espacementStr, nbCadreStr);
  }, [cadreCalcMode, nbStr, hauteurStr, x.espacementStr, nbCadreStr]);

  const cadreQteAuto = useMemo(() => {
    return computeCadreQte(cadreNTAuto, perimetreAuto);
  }, [cadreNTAuto, perimetreAuto]);

  const blueAutoStyle = { backgroundColor: "#EFF6FF", borderColor: "#3B82F6", color: "#1E40AF" } as const;

  const ntCadreLabel =
    cadreForme === "CARRE" ? "N.T.C. Carré" : cadreForme === "CIRCULAIRE" ? "N.T.C. Circulaire" : "N.T.C. Rectangulaire";

  const modeBtnBase =
    "inline-flex items-center px-3 py-2 text-sm font-medium transition-colors";
  const modeBtnActive = "text-emerald-800";
  const modeBtnInactive = "text-slate-600";

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
              <input
                className={inputClass}
                value={x.longueurStr}
                onChange={(e) => onPatch({ longueurStr: e.target.value })}
                placeholder="Ex: 3,5"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage (m)</label>
              <input
                className={inputClass}
                value={x.ancrageStr}
                onChange={(e) => onPatch({ ancrageStr: e.target.value })}
                placeholder="Ex: 0,4"
                inputMode="decimal"
              />
            </div>
          </>
        ) : null}

        {cadreForme === "CIRCULAIRE" ? (
          <>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Diamètre du cercle (m)</label>
              <input
                className={inputClass}
                value={x.rayonStr}
                onChange={(e) => onPatch({ rayonStr: e.target.value })}
                placeholder="Ex: 0,25"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage (m)</label>
              <input
                className={inputClass}
                value={x.ancrageStr}
                onChange={(e) => onPatch({ ancrageStr: e.target.value })}
                placeholder="Ex: 0,4"
                inputMode="decimal"
              />
            </div>
          </>
        ) : null}

        {cadreForme === "RECTANGULAIRE" ? (
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Longueur (m)</label>
              <input
                className={inputClass}
                value={x.longueurStr}
                onChange={(e) => onPatch({ longueurStr: e.target.value })}
                placeholder="Ex: 3,5"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Largeur (m)</label>
              <input
                className={inputClass}
                value={x.largeurStr}
                onChange={(e) => onPatch({ largeurStr: e.target.value })}
                placeholder="Ex: 2,2"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage</label>
              <input
                className={inputClass}
                value={x.ancrageStr}
                onChange={(e) => onPatch({ ancrageStr: e.target.value })}
                placeholder="Ex: 0,4"
                inputMode="decimal"
              />
            </div>
          </div>
        ) : null}

        <div className="sm:col-span-2 flex flex-col">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={[
                modeBtnBase,
                "gap-2 justify-start",
                cadreCalcMode === "ESPACEMENT" ? modeBtnActive : modeBtnInactive,
              ].join(" ")}
              onClick={() => onPatch({ cadreCalcMode: "ESPACEMENT" })}
              aria-pressed={cadreCalcMode === "ESPACEMENT"}
            >
              <span
                className={[
                  "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                  cadreCalcMode === "ESPACEMENT" ? "border-emerald-500" : "border-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    cadreCalcMode === "ESPACEMENT" ? "bg-emerald-500" : "bg-transparent",
                  ].join(" ")}
                />
              </span>
              <span>Espacement</span>
            </button>

            <button
              type="button"
              className={[
                modeBtnBase,
                "gap-2 justify-start",
                cadreCalcMode === "NB_CADRE" ? modeBtnActive : modeBtnInactive,
              ].join(" ")}
              onClick={() => onPatch({ cadreCalcMode: "NB_CADRE" })}
              aria-pressed={cadreCalcMode === "NB_CADRE"}
            >
              <span
                className={[
                  "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                  cadreCalcMode === "NB_CADRE" ? "border-emerald-500" : "border-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    cadreCalcMode === "NB_CADRE" ? "bg-emerald-500" : "bg-transparent",
                  ].join(" ")}
                />
              </span>
              <span>Nb. Cadres</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Périmètre (auto)</label>
          <input className={[inputClass, "font-semibold"].join(" ")} value={fmt(perimetreAuto)} readOnly aria-readonly="true" style={blueAutoStyle} />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            {cadreCalcMode === "NB_CADRE" ? "Nb. Cadres" : "Espacement (m)"}
          </label>
          <input
            className={inputClass}
            value={cadreCalcMode === "NB_CADRE" ? nbCadreStr : x.espacementStr}
            onChange={(e) =>
              cadreCalcMode === "NB_CADRE"
                ? onPatch({ nbCadreStr: e.target.value })
                : onPatch({ espacementStr: e.target.value })
            }
            placeholder={cadreCalcMode === "NB_CADRE" ? "Ex: 12" : "Ex: 15"}
            inputMode={cadreCalcMode === "NB_CADRE" ? "numeric" : "decimal"}
          />
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
    </div>
  );
}
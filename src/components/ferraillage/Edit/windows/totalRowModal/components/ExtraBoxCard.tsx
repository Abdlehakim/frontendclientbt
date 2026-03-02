import { useMemo } from "react";
import { CiCircleRemove } from "react-icons/ci";
import type { ExtraBoxState } from "../types";
import DiametreDropdown from "./DiametreDropdown";

type ExtraCalcMode = "ESPACEMENT" | "NB";

function parseNum(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return 0;
  const v = Number(s.replace(",", "."));
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  return v;
}

function parseIntNum(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return 0;
  const v = Math.floor(Number(s));
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  return v;
}

function fmt(n: number) {
  const r = Math.round(n * 1000) / 1000;
  const s = String(r);
  return s.replace(".", ",");
}

function computeNTFromEspacement(nbStr: string, hauteurStr: string, espacementStr: string) {
  const nb = parseIntNum(nbStr);
  const h = parseNum(hauteurStr);
  const e = parseNum(espacementStr);
  if (e <= 0) return 0;
  return nb * (h / e);
}

function computeNTFromNb(nbStr: string, nbExtraStr: string) {
  const nb = parseIntNum(nbStr);
  const count = parseIntNum(nbExtraStr);
  return nb * count;
}

export default function ExtraBoxCard({
  b,
  titleLabel,
  designation,
  safeMms,
  inputClass,
  twoColGrid,
  nbStr,
  hauteurStr,
  onUpdate,
  onRemove,
}: {
  b: ExtraBoxState;
  titleLabel: string;
  designation: string;
  safeMms: number[];
  inputClass: string;
  twoColGrid: string;
  nbStr: string;
  hauteurStr: string;
  onUpdate: (patch: Partial<ExtraBoxState>) => void;
  onRemove: () => void;
}) {
  const isEpingle = b.kind === "EPINGLE";
  const calcMode: ExtraCalcMode = b.extraCalcMode === "NB" ? "NB" : "ESPACEMENT";
  const nbExtraStr = b.nbExtraStr ?? "0";

  const designationLabel = (designation ?? "").trim() || "élément";

  const computedPerimetre = useMemo(() => {
    const L = parseNum(b.longueurStr);
    const A = parseNum(b.ancrageStr);
    return isEpingle ? L + 2 * A : 2 * L + 2 * A;
  }, [b.longueurStr, b.ancrageStr, isEpingle]);

  const computedPerimetreStr = useMemo(() => fmt(computedPerimetre), [computedPerimetre]);

  const computedNT = useMemo(() => {
    if (calcMode === "NB") return computeNTFromNb(nbStr, nbExtraStr);
    return computeNTFromEspacement(nbStr, hauteurStr, b.espacementStr);
  }, [calcMode, nbStr, nbExtraStr, hauteurStr, b.espacementStr]);

  const computedNTStr = useMemo(() => fmt(computedNT), [computedNT]);

  const computedQtyFerStr = useMemo(() => {
    const n = parseIntNum(b.valueStr);
    const q = n * computedPerimetre * computedNT;
    return fmt(q);
  }, [b.valueStr, computedPerimetre, computedNT]);

  const ntLabel = isEpingle ? "N.T.Épingle" : "N.T.Étriers";
  const countLabel = isEpingle ? "Nb. Épingles" : "Nb. Étriers";

  const valuePerCadreLabel = isEpingle
    ? "Nb. Épingles par cadre"
    : "Nb. Étriers par cadre";

  const valuePerDesignationLabel = isEpingle
    ? `Nb. Épingles par ${designationLabel}`
    : `Nb. Étriers par ${designationLabel}`;

  const modeBtnBase = "inline-flex items-center px-3 py-2 text-sm font-medium transition-colors";
  const modeBtnActive = "text-emerald-800";
  const modeBtnInactive = "bg-white text-slate-600";

  return (
    <div className={["h-100 md:col-span-4 rounded-lg border p-4", "border-slate-200 bg-slate-50/60"].join(" ")}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-900">{titleLabel}</div>
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
          <DiametreDropdown label="Diamètre" mms={safeMms} value={b.diametreMm} onChange={(v) => onUpdate({ diametreMm: v })} />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Longueur (m)</label>
          <input
            className={inputClass}
            value={b.longueurStr}
            onChange={(e) => onUpdate({ longueurStr: e.target.value })}
            placeholder="Ex: 1,2"
            inputMode="decimal"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Crochet (m)</label>
          <input
            className={inputClass}
            value={b.ancrageStr}
            onChange={(e) => onUpdate({ ancrageStr: e.target.value })}
            placeholder="Ex: 0,4"
            inputMode="decimal"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Périmètre (auto)</label>
          <input
            className={[inputClass, "font-semibold"].join(" ")}
            value={computedPerimetreStr}
            readOnly
            aria-readonly="true"
            style={{
              backgroundColor: "#EFF6FF",
              borderColor: "#3B82F6",
              color: "#1E40AF",
            }}
          />
        </div>

        <div className="sm:col-span-2 flex flex-col">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={[
                modeBtnBase,
                "gap-2 justify-start",
                calcMode === "ESPACEMENT" ? modeBtnActive : modeBtnInactive,
              ].join(" ")}
              onClick={() => onUpdate({ extraCalcMode: "ESPACEMENT" })}
              aria-pressed={calcMode === "ESPACEMENT"}
            >
              <span
                className={[
                  "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                  calcMode === "ESPACEMENT" ? "border-emerald-500" : "border-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    calcMode === "ESPACEMENT" ? "bg-emerald-500" : "bg-transparent",
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
                calcMode === "NB" ? modeBtnActive : modeBtnInactive,
              ].join(" ")}
              onClick={() => onUpdate({ extraCalcMode: "NB" })}
              aria-pressed={calcMode === "NB"}
            >
              <span
                className={[
                  "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                  calcMode === "NB" ? "border-emerald-500" : "border-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    calcMode === "NB" ? "bg-emerald-500" : "bg-transparent",
                  ].join(" ")}
                />
              </span>
              <span>{countLabel}</span>
            </button>
          </div>
        </div>

        {calcMode === "ESPACEMENT" ? (
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">{valuePerCadreLabel}</label>
              <input
                className={inputClass}
                value={b.valueStr}
                onChange={(e) => onUpdate({ valueStr: e.target.value })}
                placeholder={isEpingle ? "Ex: 2" : "Ex: 10"}
                inputMode="numeric"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Espacement (m)</label>
              <input
                className={inputClass}
                value={b.espacementStr}
                onChange={(e) => onUpdate({ espacementStr: e.target.value })}
                placeholder="Ex: 15"
                inputMode="decimal"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">{valuePerDesignationLabel}</label>
            <input
              className={inputClass}
              value={nbExtraStr}
              onChange={(e) => onUpdate({ nbExtraStr: e.target.value })}
              placeholder="Ex: 12"
              inputMode="numeric"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Quantités de Fer (m)</label>
            <input
              className={[inputClass, "font-semibold"].join(" ")}
              value={computedQtyFerStr}
              readOnly
              aria-readonly="true"
              style={{
                backgroundColor: "#DBEAFE",
                borderColor: "#2563EB",
                color: "#1E3A8A",
              }}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">{ntLabel}</label>
            <input
              className={[inputClass, "font-semibold"].join(" ")}
              value={computedNTStr}
              readOnly
              aria-readonly="true"
              style={{
                backgroundColor: "#E0E7FF",
                borderColor: "#6366F1",
                color: "#312E81",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
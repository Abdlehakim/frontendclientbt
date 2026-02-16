import { useMemo } from "react";
import { CiCircleRemove } from "react-icons/ci";
import type { ExtraBoxState } from "../types";
import DiametreDropdown from "./DiametreDropdown";

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

export default function ExtraBoxCard({
  b,
  titleLabel,
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
  safeMms: number[];
  inputClass: string;
  twoColGrid: string;
  nbStr: string;
  hauteurStr: string;
  onUpdate: (patch: Partial<ExtraBoxState>) => void;
  onRemove: () => void;
}) {
  const isEpingle = b.kind === "EPINGLE";

  const computedPerimetre = useMemo(() => {
    const L = parseNum(b.longueurStr);
    const A = parseNum(b.ancrageStr);
    return isEpingle ? L + 2 * A : 2 * L + 2 * A;
  }, [b.longueurStr, b.ancrageStr, isEpingle]);

  const computedPerimetreStr = useMemo(() => fmt(computedPerimetre), [computedPerimetre]);

  const computedNTStr = useMemo(() => {
    const nb = parseIntNum(nbStr);
    const h = parseNum(hauteurStr);
    const e = parseNum(b.espacementStr);
    if (e <= 0) return "0";
    const nt = nb * (h / e);
    return fmt(nt);
  }, [nbStr, hauteurStr, b.espacementStr]);

  const computedQtyFerStr = useMemo(() => {
    const n = parseIntNum(b.valueStr);
    const nb = parseIntNum(nbStr);
    const h = parseNum(hauteurStr);
    const e = parseNum(b.espacementStr);
    if (e <= 0) return "0";
    const nt = nb * (h / e);
    const q = n * computedPerimetre * nt;
    return fmt(q);
  }, [b.valueStr, nbStr, hauteurStr, b.espacementStr, computedPerimetre]);

  const ntLabel = isEpingle ? "N.T.Épingle" : "N.T.Étriers";

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
          <label className="text-sm font-semibold text-gray-700 mb-1">{isEpingle ? "N.Épingles" : "N.Étriers"}</label>
          <input
            className={inputClass}
            value={b.valueStr}
            onChange={(e) => onUpdate({ valueStr: e.target.value })}
            placeholder={isEpingle ? "Ex: 2" : "Ex: 10"}
            inputMode="numeric"
          />
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
          <label className="text-sm font-semibold text-gray-700 mb-1">Ancrage (m)</label>
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

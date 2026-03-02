import { useEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import type { FormeState } from "../types";
import { parseNonNegativeInt, parseNonNegativeNumber } from "../utils";
import DiametreDropdown from "./DiametreDropdown";
import { CheckIcon } from "../icons";

type BarreCategorie =
  | "Acier inférieur"
  | "Acier supérieur"
  | "Acier de peau"
  | "Acier de renfort"
  | "Chapeau"
  | "Barre en bateau";

const BARRE_DESIGNATIONS = ["longrines", "raidisseurs", "linteaux", "chaînages", "poutres", "nervures"];
const LIT_CATEGORIES = new Set<BarreCategorie>(["Acier inférieur", "Acier supérieur", "Chapeau"]);

function fmt(n: number) {
  const r = Math.round(n * 1000) / 1000;
  return String(r).replace(".", ",");
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

function computeBarreQteStandard(nbStr: string, nBarreStr: string, hauteurStr: string, attenteStr: string, ancrageStr: string) {
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

function computeBarreQteLongueur(nbStr: string, nBarreStr: string, longueurBarreStr: string, ancrageStr: string) {
  const NB = parseNonNegativeInt(nbStr);
  const N = parseNonNegativeInt(nBarreStr);
  const L = parseNonNegativeNumber(longueurBarreStr);
  const A = parseNonNegativeNumber(ancrageStr);

  const hasAny = NB != null || N != null || L != null || A != null;
  if (!hasAny) return 0;

  const nb = NB ?? 0;
  const n = N ?? 0;
  const l = L ?? 0;
  const a = A ?? 0;

  return nb * (n * (l + a));
}

function BarreCategorieDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: BarreCategorie) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const OPTIONS: BarreCategorie[] = [
    "Acier inférieur",
    "Acier supérieur",
    "Acier de peau",
    "Acier de renfort",
    "Chapeau",
    "Barre en bateau",
  ];

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

  const shown = (value ?? "").trim() || "Choisir...";

  return (
    <div className="flex flex-col" ref={wrapRef}>
      <label className="text-sm font-semibold text-gray-700 mb-1">Type d’acier</label>

      <button
        type="button"
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{shown}</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open ? (
        <div className="relative">
          <div
            className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
            role="listbox"
          >
            {OPTIONS.map((opt) => {
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

export default function FormeBarre({
  x,
  designation,
  safeMms,
  inputClass,
  twoColGrid,
  nbStr,
  hauteurStr,
  barreLitIndex,
  onPatch,
}: {
  x: FormeState;
  designation: string;
  safeMms: number[];
  inputClass: string;
  twoColGrid: string;
  nbStr: string;
  hauteurStr: string;
  barreLitIndex: number | null;
  onPatch: (patch: Partial<FormeState>) => void;
}) {
  const showBarreOptions = useMemo(() => {
    const v = (designation ?? "").trim().toLowerCase();
    return BARRE_DESIGNATIONS.includes(v);
  }, [designation]);

  const selectedCategorie = (x.barreCategorie ?? "").trim() as BarreCategorie;
  const showLitField = showBarreOptions && LIT_CATEGORIES.has(selectedCategorie);
  const litValue = showLitField && barreLitIndex != null ? `Lit ${barreLitIndex}` : "";

  const showAncrageField =
    showBarreOptions &&
    (selectedCategorie === "Acier inférieur" || selectedCategorie === "Acier supérieur");

  const effectiveAncrageStr = showBarreOptions ? (showAncrageField ? x.ancrageStr : "0") : x.ancrageStr;

  const barreQteAuto = useMemo(() => {
    if (showBarreOptions) {
      return computeBarreQteLongueur(nbStr, x.nBarreStr, x.longueurStr, effectiveAncrageStr);
    }
    return computeBarreQteStandard(nbStr, x.nBarreStr, hauteurStr, x.attenteStr, x.ancrageStr);
  }, [showBarreOptions, nbStr, x.nBarreStr, x.longueurStr, hauteurStr, x.attenteStr, x.ancrageStr, effectiveAncrageStr]);

  const barreNTAuto = useMemo(() => {
    return computeBarreNT(nbStr, x.nBarreStr);
  }, [nbStr, x.nBarreStr]);

  const blueAutoStyle = { backgroundColor: "#EFF6FF", borderColor: "#3B82F6", color: "#1E40AF" } as const;

  return (
    <div className={twoColGrid}>
      {showBarreOptions ? (
        showLitField ? (
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BarreCategorieDropdown value={selectedCategorie} onChange={(v) => onPatch({ barreCategorie: v })} />

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Lit</label>
              <input
                className={[inputClass, "font-semibold"].join(" ")}
                value={litValue}
                readOnly
                aria-readonly="true"
                style={blueAutoStyle}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:col-span-2">
            <BarreCategorieDropdown value={selectedCategorie} onChange={(v) => onPatch({ barreCategorie: v })} />
          </div>
        )
      ) : null}

      <div className="flex flex-col">
        <DiametreDropdown label="Diamètre" mms={safeMms} value={x.diametreMm} onChange={(v) => onPatch({ diametreMm: v })} />
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-700 mb-1">N.barre</label>
        <input
          className={inputClass}
          value={x.nBarreStr}
          onChange={(e) => onPatch({ nBarreStr: e.target.value })}
          placeholder="Ex: 4"
          inputMode="numeric"
        />
      </div>

      {showBarreOptions ? (
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Longueur de barre (m)</label>
          <input
            className={inputClass}
            value={x.longueurStr}
            onChange={(e) => onPatch({ longueurStr: e.target.value })}
            placeholder="Ex: 6,5"
            inputMode="decimal"
          />
        </div>
      ) : (
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Attente barre (m)</label>
          <input
            className={inputClass}
            value={x.attenteStr}
            onChange={(e) => onPatch({ attenteStr: e.target.value })}
            placeholder="Ex: 0,6"
            inputMode="decimal"
          />
        </div>
      )}

      {(!showBarreOptions || showAncrageField) ? (
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
      ) : null}

      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Quantités de Fer (m)</label>
          <input
            className={[inputClass, "font-semibold"].join(" ")}
            value={fmt(barreQteAuto)}
            readOnly
            aria-readonly="true"
            style={blueAutoStyle}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">N.T.Barre</label>
          <input
            className={[inputClass, "font-semibold"].join(" ")}
            value={fmt(barreNTAuto)}
            readOnly
            aria-readonly="true"
            style={blueAutoStyle}
          />
        </div>
      </div>
    </div>
  );
}
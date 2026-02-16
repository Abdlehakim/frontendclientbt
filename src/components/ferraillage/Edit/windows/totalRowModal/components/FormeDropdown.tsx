import { createPortal } from "react-dom";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { useEffect, useRef, useState } from "react";
import type { FormeState } from "../types";
import { usePortalPos } from "../utils";

type CadreForme = Exclude<FormeState["forme"], "BARRE">;

function labelCadreForme(v: CadreForme) {
  if (v === "CARRE") return "Carré";
  if (v === "CIRCULAIRE") return "Circulaire";
  return "Rectangulaire";
}

function CheckIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

export default function FormeDropdown({
  value,
  onChange,
  label,
}: {
  value: CadreForme;
  onChange: (v: CadreForme) => void;
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const pos = usePortalPos(open, btnRef);

  const OPTIONS: CadreForme[] = ["CARRE", "CIRCULAIRE", "RECTANGULAIRE"];

  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;

      const inWrap = wrapRef.current?.contains(t);
      const inList = listRef.current?.contains(t);

      if (!inWrap && !inList) setOpen(false);
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
  }, [open]);

  return (
    <div className="flex flex-col" ref={wrapRef}>
      <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>

      <button
        ref={btnRef}
        type="button"
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{labelCadreForme(value)}</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={listRef}
              className="rounded-md border bg-white shadow-lg border-emerald-200"
              role="listbox"
              style={{
                position: "fixed",
                left: pos.left,
                width: pos.width,
                top: pos.top,
                bottom: pos.bottom,
                maxHeight: pos.maxHeight,
                overflow: "auto",
                zIndex: 9999,
              }}
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
                    <span className="truncate">{labelCadreForme(opt)}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

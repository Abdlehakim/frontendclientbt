import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { usePortalPos } from "../../hooks/usePortalPos";

export default function AddPlusDropdown({
  onAddCadre,
  onAddBarre,
  onAddEpingle,
  onAddEtriers,
  showCadreOption = true,
  showBarreOption = true,
  showEpingleOption = true,
  showEtriersOption = true,
}: {
  onAddCadre: () => void;
  onAddBarre: () => void;
  onAddEpingle: () => void;
  onAddEtriers: () => void;
  showCadreOption?: boolean;
  showBarreOption?: boolean;
  showEpingleOption?: boolean;
  showEtriersOption?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const pos = usePortalPos(open, btnRef);

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

  const items: { key: "CADRE" | "BARRE" | "EPINGLE" | "ETRIERS"; label: string }[] = [];
  if (showBarreOption) items.push({ key: "BARRE", label: "Ajouter Barre" });
  if (showCadreOption) items.push({ key: "CADRE", label: "Ajouter Cadre" });
  if (showEpingleOption) items.push({ key: "EPINGLE", label: "Ajouter Épingle" });
  if (showEtriersOption) items.push({ key: "ETRIERS", label: "Ajouter Étriers" });

  return (
    <div className="relative flex items-center justify-end" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold cursor-pointer bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Ajouter"
      >
        <span>Ajouter Elements</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={listRef}
              className="rounded-md border bg-white shadow-lg border-emerald-200"
              role="menu"
              style={{
                position: "fixed",
                left: pos.left,
                width: Math.min(260, pos.width),
                top: pos.top,
                bottom: pos.bottom,
                maxHeight: pos.maxHeight,
                overflow: "auto",
                zIndex: 9999,
              }}
            >
              {items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    if (it.key === "CADRE") onAddCadre();
                    if (it.key === "BARRE") onAddBarre();
                    if (it.key === "EPINGLE") onAddEpingle();
                    if (it.key === "ETRIERS") onAddEtriers();
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer"
                >
                  <span className="truncate">{it.label}</span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

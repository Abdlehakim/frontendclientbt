import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { usePortalPos } from "../../hooks/usePortalPos";
import { ELEMENT_ORDER, type ElementOrderType } from "../../state/cardOrder";

export default function AddPlusDropdown({
  onAddCadre,
  onAddBarre,
  onAddEpingle,
  onAddEtriers,
  showCadreOption = true,
  showBarreOption = true,
  showEpingleOption = true,
  showEtriersOption = true,
  closeOnChangeKey,
  disabled = false,
}: {
  onAddCadre: () => void;
  onAddBarre: () => void;
  onAddEpingle: () => void;
  onAddEtriers: () => void;
  showCadreOption?: boolean;
  showBarreOption?: boolean;
  showEpingleOption?: boolean;
  showEtriersOption?: boolean;
  closeOnChangeKey?: string;
  disabled?: boolean;
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

  useEffect(() => {
    setOpen(false);
  }, [closeOnChangeKey]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const itemByType: Record<ElementOrderType, { label: string; show: boolean; onAdd: () => void }> = {
    barre: { label: "Ajouter Barre", show: showBarreOption, onAdd: onAddBarre },
    cadre: { label: "Ajouter Cadre", show: showCadreOption, onAdd: onAddCadre },
    epingle: { label: "Ajouter Épingle", show: showEpingleOption, onAdd: onAddEpingle },
    etriers: { label: "Ajouter Étriers", show: showEtriersOption, onAdd: onAddEtriers },
  };
  const items = ELEMENT_ORDER.map((type) => ({ type, ...itemByType[type] })).filter((it) => it.show);

  return (
    <div className="relative flex items-center justify-end" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={[
          "stepper__nav inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-50"
            : "",
        ].join(" ")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
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
                  key={it.type}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    it.onAdd();
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer "
                >
                  <span className="truncate text-xs">{it.label}</span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

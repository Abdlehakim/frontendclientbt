import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type RefObject } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";

type PortalPos =
  | null
  | {
      left: number;
      width: number;
      top?: number;
      bottom?: number;
      maxHeight: number;
    };

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function usePortalPos(open: boolean, btnRef: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState<PortalPos>(null);

  useEffect(() => {
    if (!open) return;

    let raf = 0;

    const calc = () => {
      const btn = btnRef.current;
      if (!btn) {
        setPos(null);
        return;
      }

      const r = btn.getBoundingClientRect();
      const margin = 8;

      const below = window.innerHeight - r.bottom - margin;
      const above = r.top - margin;

      const wantUp = below < 220 && above > below;
      const maxHeight = Math.max(120, Math.min(320, wantUp ? above : below));

      const rawLeft = r.left;
      const maxLeft = Math.max(margin, window.innerWidth - r.width - margin);
      const left = clamp(rawLeft, margin, maxLeft);
      const width = Math.min(r.width, window.innerWidth - margin * 2);

      if (wantUp) {
        setPos({
          left,
          width,
          bottom: window.innerHeight - r.top + margin,
          maxHeight,
        });
      } else {
        setPos({
          left,
          width,
          top: r.bottom + margin,
          maxHeight,
        });
      }
    };

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };

    schedule();

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, btnRef]);

  return pos;
}

function PlusIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default function AddPlusDropdown({
  onAddCadre,
  onAddBarre,
  onAddEpingle,
  onAddEtriers,
}: {
  onAddCadre: () => void;
  onAddBarre: () => void;
  onAddEpingle: () => void;
  onAddEtriers: () => void;
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

  const items: { key: "CADRE" | "BARRE" | "EPINGLE" | "ETRIERS"; label: string }[] = [
    { key: "CADRE", label: "Ajouter Cadre" },
    { key: "BARRE", label: "Ajouter Barre" },
    { key: "EPINGLE", label: "Ajouter Épingle" },
    { key: "ETRIERS", label: "Ajouter Étriers" },
  ];

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
                  className="w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800"
                >
                  <span className="truncate">{it.label}</span>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-emerald-300 text-emerald-600">
                    <PlusIcon />
                  </span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

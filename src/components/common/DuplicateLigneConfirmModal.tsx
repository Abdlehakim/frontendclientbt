import { useEffect, useRef, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";

type Props = {
  open: boolean;
  designation: string;
  nomenclature?: string | null;
  errorMessage?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DuplicateLigneConfirmModal({
  open,
  designation,
  nomenclature,
  errorMessage = "",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemName = [designation, nomenclature ?? ""].map((value) => value.trim()).filter(Boolean).join(" ");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel, open]);

  const closeOnBackdrop = (ev: MouseEvent<HTMLDivElement>) => {
    if (loading) return;
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onCancel();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-120" aria-modal="true" role="dialog" aria-labelledby="duplicate-ligne-confirm-title">
      <div className="absolute inset-0 bg-black/45" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-[950px] rounded-3xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] border border-gray-200 overflow-hidden"
        >
          <div className="px-5 sm:px-8 py-5 border-b border-gray-200 flex items-center justify-between gap-4">
            <div id="duplicate-ligne-confirm-title" className="text-[1.6rem] font-bold leading-none text-slate-900">
              Dupliquer la ligne
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label="Fermer"
              title="Fermer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IoClose size={22} />
            </button>
          </div>

          <div className="px-5 sm:px-8 py-10 sm:py-12 text-[1.15rem] sm:text-[1.25rem] leading-relaxed text-slate-600">
            <strong className="font-bold text-slate-900">{itemName || "Cette ligne"}</strong> sera dupliquée.
            {errorMessage ? <div className="mt-4 text-sm font-medium text-red-600">{errorMessage}</div> : null}
          </div>

          <div className="px-5 sm:px-8 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="min-w-28 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="min-w-28 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Duplication..." : "Dupliquer"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

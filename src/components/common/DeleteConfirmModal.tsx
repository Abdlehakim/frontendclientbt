import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";

type DeleteConfirmModalProps = {
  open: boolean;
  title?: string;
  itemName: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function DeleteConfirmModal({
  open,
  title = "Supprimer",
  itemName,
  message = "sera definitivement supprime.",
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  const closeOnBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (loading) return;
    if (panelRef.current && !panelRef.current.contains(event.target as Node)) onCancel();
  };

  const subject = itemName.trim() || "cet element";

  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{subject}</span> {message}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 rounded-b-xl border-t border-slate-900/10 bg-gray-50 px-3.5 py-3">
            <button type="button" className="stepper__nav" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>

            <button
              type="button"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void onConfirm()}
              disabled={loading}
            >
              {loading ? "Suppression..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

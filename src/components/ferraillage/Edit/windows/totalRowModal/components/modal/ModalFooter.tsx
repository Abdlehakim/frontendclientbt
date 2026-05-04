export default function ModalFooter({
  submitLabel,
  canSubmit,
  onClose,
  onSubmit,
  submitting = false,
}: {
  submitLabel: string;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  return (
    <div
      className="
        rounded-b-xl bg-gray-50
        border-t border-slate-900/10
        px-3.5 pt-2.5 pb-3.5
        flex items-center justify-between gap-3 shrink-0
      "
      aria-label="Actions du formulaire"
    >
      <div className="flex items-center justify-start gap-2 flex-1">
        <button type="button" className="stepper__nav" onClick={onClose} disabled={submitting}>
          Annuler
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
        <button
          type="button"
          className="stepper__nav"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          aria-disabled={!canSubmit || submitting}
        >
          {submitting ? "Enregistrement..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

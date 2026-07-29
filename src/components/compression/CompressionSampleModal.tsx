import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";

export type CompressionSampleModalPayload = {
  dosage: string;
  cement: string;
  admixture: string;
  designation: string;
  pourDate: string;
  specimenSendDate: string;
};

export type CompressionSampleModalMode =
  | "create"
  | "edit";

type CompressionSampleModalProps = {
  open: boolean;
  mode: CompressionSampleModalMode;
  initialValue?:
    | CompressionSampleModalPayload
    | null;
  onClose: () => void;
  onSubmit: (
    payload: CompressionSampleModalPayload,
  ) => void;
};

type CompressionSampleModalForm = {
  dosage: string;
  cement: string;
  admixture: string;
  designation: string;
  pourDate: string;
  specimenSendDate: string;
};

const EMPTY_FORM: CompressionSampleModalForm = {
  dosage: "",
  cement: "",
  admixture: "",
  designation: "",
  pourDate: "",
  specimenSendDate: "",
};

function payloadToForm(
  payload: CompressionSampleModalPayload,
): CompressionSampleModalForm {
  return {
    dosage: payload.dosage,
    cement: payload.cement,
    admixture: payload.admixture,
    designation: payload.designation,
    pourDate: payload.pourDate,
    specimenSendDate:
      payload.specimenSendDate,
  };
}

const fieldClass =
  "form-control w-full rounded-md border text-sm font-medium " +
  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
  "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
  "placeholder:text-emerald-800/60";

function validateForm(
  form: CompressionSampleModalForm,
): string {
  if (!form.dosage.trim()) {
    return "Le dosage est obligatoire.";
  }
  if (!form.cement.trim()) {
    return "Le ciment est obligatoire.";
  }
  if (!form.designation.trim()) {
    return "La désignation est obligatoire.";
  }
  if (!form.pourDate) {
    return "La date de coulage est obligatoire.";
  }

  return "";
}

export default function CompressionSampleModal({
  open,
  mode,
  initialValue,
  onClose,
  onSubmit,
}: CompressionSampleModalProps) {
  const [form, setForm] =
    useState<CompressionSampleModalForm>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialValue) {
      setForm(payloadToForm(initialValue));
    } else {
      setForm({ ...EMPTY_FORM });
    }

    setError("");
  }, [initialValue, mode, open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  const submit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit({
      dosage: form.dosage.trim(),
      cement: form.cement.trim(),
      admixture: form.admixture.trim(),
      designation: form.designation.trim(),
      pourDate: form.pourDate,
      specimenSendDate: form.specimenSendDate,
    });
  };

  const closeOnBackdrop = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onMouseDown={closeOnBackdrop}
      >
        <form
          onSubmit={submit}
          onMouseDown={(event) => event.stopPropagation()}
          className="w-full max-w-5xl rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col overflow-hidden"
        >
          <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              {mode === "edit"
                ? "Modifier le prélèvement"
                : "Ajouter un prélèvement"}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform"
            >
              <CiCircleRemove size={26} />
            </button>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Dosage
                </label>
                <input
                  type="text"
                  value={form.dosage}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      dosage: event.target.value,
                    }));
                    setError("");
                  }}
                  placeholder="Ex: 400 KG/M³"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Ciment
                </label>
                <input
                  type="text"
                  value={form.cement}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      cement: event.target.value,
                    }));
                    setError("");
                  }}
                  placeholder="Ex: I42.5 HRS"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Adjuvant
                </label>
                <input
                  type="text"
                  value={form.admixture}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      admixture: event.target.value,
                    }));
                    setError("");
                  }}
                  placeholder="Optionnel"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col md:col-span-3">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Désignation
                </label>
                <textarea
                  value={form.designation}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      designation: event.target.value,
                    }));
                    setError("");
                  }}
                  placeholder="Ex: Semelles axe C et axe D"
                  className={`${fieldClass} min-h-24 resize-y`}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Date coulage / prélèvement
                </label>
                <input
                  type="date"
                  value={form.pourDate}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      pourDate: event.target.value,
                    }));
                    setError("");
                  }}
                  className={fieldClass}
                />
              </div>

                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Date d’envoi éprouvette
                </label>
                <input
                  type="date"
                  value={form.specimenSendDate}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      specimenSendDate: event.target.value,
                    }));
                    setError("");
                  }}
                  className={fieldClass}
                />

            </div>

            {error ? (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            ) : null}
          </div>

          <div
            className="rounded-b-xl px-3.5 pt-2.5 pb-3.5 flex items-center justify-between gap-3
            "
            aria-label="Actions du formulaire"
          >
              <button
                type="button"
                className="stepper__nav"
                onClick={onClose}
              >
                Annuler
              </button>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 whitespace-nowrap">
              <button
                type="submit"
                className="stepper__nav"
              >
                {mode === "edit"
                  ? "Enregistrer"
                  : "Ajouter"}
              </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import type {
  CompressionResultInput,
  CompressionResultStatus,
  CompressionSeriesInput,
} from "@/lib/compressionApi";

const RESULT_STATUS_LABELS: Record<
  CompressionResultStatus,
  string
> = {
  VALID: "Valide",
  INVALID: "Invalide",
  NOT_TESTED: "Non testé",
};

const fieldClass =
  "form-control w-full rounded-md border text-sm font-medium " +
  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
  "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
  "placeholder:text-emerald-800/60";

type CompressionSeriesModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValue:
    | CompressionSeriesInput
    | null;
  resultColumnCount: number;
  onClose: () => void;
  onSubmit: (
    series: CompressionSeriesInput,
  ) => void;
};

function isResultStatus(
  value: string,
): value is CompressionResultStatus {
  return (
    value === "VALID" ||
    value === "INVALID" ||
    value === "NOT_TESTED"
  );
}

function createResult(
  specimenNumber: number,
): CompressionResultInput {
  return {
    specimenNumber,
    value: null,
    status: "VALID",
    note: null,
  };
}

function normalizeSeries(
  initialValue: CompressionSeriesInput | null,
  resultColumnCount: number,
): CompressionSeriesInput {
  const sourceResults =
    initialValue?.results ?? [];

  const resultsByNumber = new Map(
    sourceResults.map((result) => [
      result.specimenNumber,
      result,
    ]),
  );

  return {
    crushingDate:
      initialValue?.crushingDate ?? "",
    reference:
      initialValue?.reference ?? "",
    sortOrder:
      initialValue?.sortOrder ?? 0,
    results: Array.from(
      { length: resultColumnCount },
      (_, index) => {
        const specimenNumber = index + 1;
        const existing =
          resultsByNumber.get(specimenNumber);

        return existing
          ? {
              ...existing,
              specimenNumber,
            }
          : createResult(specimenNumber);
      },
    ),
  };
}

function validateSeries(
  series: CompressionSeriesInput,
): string {
  if (!series.crushingDate) {
    return "La date d’écrasement est obligatoire.";
  }

  for (const result of series.results) {
    if (result.status === "VALID") {
      if (
        typeof result.value !== "number" ||
        !Number.isFinite(result.value) ||
        result.value < 0
      ) {
        return `EP${result.specimenNumber} doit contenir une valeur valide.`;
      }
    }

    if (
      result.status === "INVALID" &&
      !result.note?.trim()
    ) {
      return `EP${result.specimenNumber} invalide doit contenir une note.`;
    }
  }

  return "";
}

export default function CompressionSeriesModal({
  open,
  mode,
  initialValue,
  resultColumnCount,
  onClose,
  onSubmit,
}: CompressionSeriesModalProps) {
  const [series, setSeries] =
    useState<CompressionSeriesInput>(
      () =>
        normalizeSeries(
          initialValue,
          resultColumnCount,
        ),
    );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setSeries(
      normalizeSeries(
        initialValue,
        resultColumnCount,
      ),
    );
    setError("");
  }, [
    initialValue,
    open,
    resultColumnCount,
  ]);

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

  const updateResult = (
    resultIndex: number,
    result: CompressionResultInput,
  ) => {
    setSeries((current) => ({
      ...current,
      results: current.results.map(
        (existing, index) =>
          index === resultIndex
            ? result
            : existing,
      ),
    }));
  };

  const submit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationError =
      validateSeries(series);

    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit({
      crushingDate: series.crushingDate,
      reference:
        series.reference?.trim() || null,
      sortOrder: series.sortOrder,
      results: series.results.map(
        (result) => ({
          ...result,
          value:
            result.status === "VALID"
              ? result.value
              : null,
          note:
            result.note?.trim() || null,
        }),
      ),
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
                ? "Modifier la série"
                : "Ajouter une série"}
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

          <div className="max-h-[75vh] overflow-y-auto p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Date d’écrasement
                </label>
                <input
                  type="date"
                  value={series.crushingDate}
                  onChange={(event) => {
                    setSeries((current) => ({
                      ...current,
                      crushingDate:
                        event.target.value,
                    }));
                    setError("");
                  }}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Référence
                </label>
                <input
                  type="text"
                  value={series.reference ?? ""}
                  placeholder="Optionnel"
                  onChange={(event) => {
                    setSeries((current) => ({
                      ...current,
                      reference:
                        event.target.value,
                    }));
                    setError("");
                  }}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {series.results.map(
                (result, resultIndex) => (
                  <div
                    key={result.specimenNumber}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-2 font-semibold text-slate-800">
                      EP{result.specimenNumber}
                    </div>

                    <div className="space-y-2">
                      <select
                        value={result.status}
                        onChange={(event) => {
                          const status =
                            event.target.value;
                          if (!isResultStatus(status)) {
                            return;
                          }

                          updateResult(
                            resultIndex,
                            {
                              ...result,
                              status,
                              value:
                                status === "VALID"
                                  ? result.value
                                  : null,
                            },
                          );
                          setError("");
                        }}
                        className={fieldClass}
                      >
                        {Object.entries(
                          RESULT_STATUS_LABELS,
                        ).map(([status, label]) => (
                          <option key={status} value={status}>
                            {label}
                          </option>
                        ))}
                      </select>

                      {result.status === "VALID" ? (
                        <input
                          type="number"
                          min={0}
                          step="0.001"
                          value={result.value ?? ""}
                          onChange={(event) => {
                            updateResult(
                              resultIndex,
                              {
                                ...result,
                                value:
                                  event.target.value === ""
                                    ? null
                                    : Number(
                                        event.target.value,
                                      ),
                              },
                            );
                            setError("");
                          }}
                          className={fieldClass}
                        />
                      ) : (
                        <input
                          type="text"
                          value={result.note ?? ""}
                          placeholder={
                            result.status === "INVALID"
                              ? "Ex. Mal faite"
                              : "Note optionnelle"
                          }
                          onChange={(event) => {
                            updateResult(
                              resultIndex,
                              {
                                ...result,
                                note: event.target.value,
                              },
                            );
                            setError("");
                          }}
                          className={fieldClass}
                        />
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            {error ? (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            ) : null}
          </div>

          <div
            className="
              rounded-b-xl bg-gray-50
              border-t border-slate-900/10
              px-3.5 pt-2.5 pb-3.5
              flex items-center justify-between gap-3
            "
            aria-label="Actions du formulaire"
          >
            <div className="flex flex-1 items-center justify-start gap-2">
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
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

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
  CompressionSeriesInput,
} from "@/lib/compressionApi";

export type CompressionSeriesModalPayload = {
  series: CompressionSeriesInput;
  specimenCount: number;
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
  initialSpecimenCount: number;
  onClose: () => void;
  onSubmit: (
    payload: CompressionSeriesModalPayload,
  ) => void;
};

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
): CompressionSeriesInput {
  const sourceResults =
    initialValue?.results ?? [];

  const normalizedResults =
    sourceResults.length > 0
      ? sourceResults.map(
          (result, index) => ({
            specimenNumber: index + 1,
            value:
              typeof result.value === "number" &&
              Number.isFinite(result.value)
                ? result.value
                : null,
            status: "VALID" as const,
            note: null,
          }),
        )
      : Array.from(
          { length: 4 },
          (_, index) =>
            createResult(index + 1),
        );

  return {
    crushingDate:
      initialValue?.crushingDate ?? "",
    reference:
      initialValue?.reference ?? "",
    sortOrder:
      initialValue?.sortOrder ?? 0,
    results: normalizedResults,
  };
}

function validateSeries(
  series: CompressionSeriesInput,
): string {
  if (!series.crushingDate) {
    return "La date d’écrasement est obligatoire.";
  }

  if (series.results.length === 0) {
    return "Ajoutez au moins un résultat.";
  }

  for (const result of series.results) {
    if (
      typeof result.value !== "number" ||
      !Number.isFinite(result.value) ||
      result.value < 0
    ) {
      return `EP${result.specimenNumber} doit contenir une valeur valide.`;
    }
  }

  return "";
}

export default function CompressionSeriesModal({
  open,
  mode,
  initialValue,
  initialSpecimenCount,
  onClose,
  onSubmit,
}: CompressionSeriesModalProps) {
  const [series, setSeries] =
    useState<CompressionSeriesInput>(
      () =>
        normalizeSeries(
          initialValue,
        ),
    );
  const [specimenCount, setSpecimenCount] =
    useState(
      initialSpecimenCount > 0
        ? String(initialSpecimenCount)
        : "6",
    );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setSeries(
      normalizeSeries(
        initialValue,
      ),
    );
    setSpecimenCount(
      initialSpecimenCount > 0
        ? String(initialSpecimenCount)
        : "6",
    );
    setError("");
  }, [
    initialSpecimenCount,
    initialValue,
    open,
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

  const addResult = () => {
    setSeries((current) => {
      if (current.results.length >= 12) {
        return current;
      }

      return {
        ...current,
        results: [
          ...current.results,
          createResult(
            current.results.length + 1,
          ),
        ],
      };
    });

    setError("");
  };

  const removeResult = () => {
    setSeries((current) => {
      if (current.results.length <= 1) {
        return current;
      }

      return {
        ...current,
        results: current.results
          .slice(0, -1)
          .map((result, index) => ({
            ...result,
            specimenNumber: index + 1,
          })),
      };
    });

    setError("");
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

    const normalizedSpecimenCount =
      Number(specimenCount);

    if (
      !Number.isInteger(
        normalizedSpecimenCount,
      ) ||
      normalizedSpecimenCount < 1 ||
      normalizedSpecimenCount > 100
    ) {
      setError(
        "Le nombre d’éprouvettes doit être compris entre 1 et 100.",
      );
      return;
    }

    onSubmit({
      specimenCount:
        normalizedSpecimenCount,
      series: {
        crushingDate:
          series.crushingDate,
        reference:
          series.reference?.trim() || null,
        sortOrder:
          series.sortOrder,
        results: series.results.map(
          (result, index) => ({
            specimenNumber: index + 1,
            value: result.value,
            status: "VALID",
            note: null,
          }),
        ),
      },
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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

              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Nombre d’éprouvettes
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={specimenCount}
                  onChange={(event) => {
                    setSpecimenCount(
                      event.target.value,
                    );
                    setError("");
                  }}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-700">
                Résultats des éprouvettes
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-fit-white-outline"
                  onClick={removeResult}
                  disabled={series.results.length <= 1}
                >
                  Retirer EP
                </button>

                <button
                  type="button"
                  className="btn-fit-white-outline"
                  onClick={addResult}
                  disabled={series.results.length >= 12}
                >
                  Ajouter EP
                </button>
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

                    <input
                      type="number"
                      min={0}
                      step="0.001"
                      value={result.value ?? ""}
                      onChange={(event) => {
                        updateResult(
                          resultIndex,
                          {
                            specimenNumber:
                              result.specimenNumber,
                            value:
                              event.target.value === ""
                                ? null
                                : Number(
                                    event.target.value,
                                  ),
                            status: "VALID",
                            note: null,
                          },
                        );
                        setError("");
                      }}
                      className={fieldClass}
                    />
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

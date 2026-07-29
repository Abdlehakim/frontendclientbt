import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import {
  DatePickerInput,
} from "@/components/DatePickerInput";
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

const DAY_IN_MILLISECONDS = 86_400_000;

function dateOnlyMilliseconds(
  value: string,
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const milliseconds = Date.UTC(
    year,
    month - 1,
    day,
  );

  const date = new Date(milliseconds);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return milliseconds;
}

function millisecondsToDateOnly(
  milliseconds: number,
): string {
  return new Date(milliseconds)
    .toISOString()
    .slice(0, 10);
}

function addDaysToDateOnly(
  value: string,
  days: number,
): string | null {
  const start =
    dateOnlyMilliseconds(value);

  if (
    start === null ||
    !Number.isInteger(days) ||
    days < 0
  ) {
    return null;
  }

  return millisecondsToDateOnly(
    start +
      days * DAY_IN_MILLISECONDS,
  );
}

function calculateMaturityDays(
  startDate: string,
  endDate: string,
): number | null {
  const start =
    dateOnlyMilliseconds(startDate);
  const end =
    dateOnlyMilliseconds(endDate);

  if (
    start === null ||
    end === null ||
    end < start
  ) {
    return null;
  }

  const difference =
    (end - start) /
    DAY_IN_MILLISECONDS;

  return Number.isInteger(difference)
    ? difference
    : null;
}

type CompressionSeriesModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValue:
    | CompressionSeriesInput
    | null;
  initialSpecimenCount: number;
  pourDate: string;
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
    status: "NOT_TESTED",
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
      ? sourceResults.map((result, index) => {
          const hasNumericValue =
            typeof result.value === "number" &&
            Number.isFinite(result.value);

          return {
            specimenNumber: index + 1,
            value: hasNumericValue
              ? result.value
              : null,
            status: hasNumericValue
              ? result.status === "VALID" ||
                result.status === "INVALID"
                ? result.status
                : "VALID"
              : result.status === "INVALID"
                ? "INVALID"
                : "NOT_TESTED",
            note: result.note ?? null,
          };
        })
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
    showInPlanning:
      initialValue?.showInPlanning ?? true,
    planningTime:
      initialValue?.planningTime ?? "10:00",
    results: normalizedResults,
  };
}

function isValidPlanningTime(value: string): boolean {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value
    .split(":")
    .map(Number);
  const totalMinutes = hours * 60 + minutes;

  return (
    totalMinutes >= 8 * 60 &&
    totalMinutes < 18 * 60
  );
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

  if (
    series.showInPlanning &&
    !isValidPlanningTime(series.planningTime)
  ) {
    return "L’heure d’écrasement doit être comprise entre 08:00 et 17:59.";
  }

  for (const result of series.results) {
    if (
      result.value !== null &&
      result.value !== undefined &&
      (
        typeof result.value !== "number" ||
        !Number.isFinite(result.value) ||
        result.value < 0
      )
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
  pourDate,
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
  const [maturityDays, setMaturityDays] =
    useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const normalizedSeries =
      normalizeSeries(initialValue);

    setSeries(normalizedSeries);
    setSpecimenCount(
      initialSpecimenCount > 0
        ? String(initialSpecimenCount)
        : "6",
    );

    const existingMaturity =
      calculateMaturityDays(
        pourDate,
        normalizedSeries.crushingDate,
      );

    setMaturityDays(
      existingMaturity === null
        ? ""
        : String(existingMaturity),
    );

    setError("");
  }, [
    initialSpecimenCount,
    initialValue,
    open,
    pourDate,
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

  const updateMaturityDays = (
    value: string,
  ) => {
    setMaturityDays(value);
    setError("");

    if (value === "") {
      setSeries((current) => ({
        ...current,
        crushingDate: "",
      }));
      return;
    }

    const parsedValue = Number(value);

    if (
      !Number.isInteger(parsedValue) ||
      parsedValue < 0
    ) {
      return;
    }

    const calculatedDate =
      addDaysToDateOnly(
        pourDate,
        parsedValue,
      );

    if (!calculatedDate) {
      return;
    }

    setSeries((current) => ({
      ...current,
      crushingDate:
        calculatedDate,
    }));
  };

  const updateCrushingDate = (
    value: string,
  ) => {
    setSeries((current) => ({
      ...current,
      crushingDate: value,
    }));

    if (value === "") {
      setMaturityDays("");
      setError("");
      return;
    }

    const calculatedMaturity =
      calculateMaturityDays(
        pourDate,
        value,
      );

    setMaturityDays(
      calculatedMaturity === null
        ? ""
        : String(calculatedMaturity),
    );

    setError("");
  };

  const submit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const parsedMaturity =
      Number(maturityDays);

    if (
      dateOnlyMilliseconds(pourDate) === null
    ) {
      setError(
        "La date de coulage / prélèvement est invalide.",
      );
      return;
    }

    if (
      maturityDays === "" ||
      !Number.isInteger(parsedMaturity) ||
      parsedMaturity < 0
    ) {
      setError(
        "La maturité doit être un nombre entier supérieur ou égal à zéro.",
      );
      return;
    }

    const calculatedCrushingDate =
      addDaysToDateOnly(
        pourDate,
        parsedMaturity,
      );

    if (!calculatedCrushingDate) {
      setError(
        "Impossible de calculer la date d’écrasement.",
      );
      return;
    }

    const normalizedSeries: CompressionSeriesInput = {
      ...series,
      crushingDate:
        calculatedCrushingDate,
      planningTime:
        series.planningTime.trim(),
    };

    const validationError =
      validateSeries(normalizedSeries);

    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedPlanningTime =
      normalizedSeries.planningTime ||
      "10:00";

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
          calculatedCrushingDate,
        reference:
          normalizedSeries.reference
            ?.trim() || null,
        sortOrder:
          normalizedSeries.sortOrder,
        showInPlanning:
          normalizedSeries.showInPlanning,
        planningTime:
          normalizedPlanningTime,
        results: normalizedSeries.results.map(
          (result, index) => {
            const hasNumericValue =
              typeof result.value === "number" &&
              Number.isFinite(result.value);

            return {
              specimenNumber: index + 1,
              value: hasNumericValue
                ? result.value
                : null,
              status:
                result.status === "INVALID"
                  ? "INVALID"
                  : hasNumericValue
                    ? "VALID"
                    : "NOT_TESTED",
              note: result.note ?? null,
            };
          },
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
          className="w-full max-w-4xl max-h-[95vh] rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col"
        >
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
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
              <CiCircleRemove size={28} />
            </button>
          </div>

          {error ? (
            <div className="px-5 -mt-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-4">
              <div className="text-sm font-semibold text-gray-800">
                Informations série
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-gray-700">
                  Maturité JRS
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={maturityDays}
                  onChange={(event) => {
                    updateMaturityDays(
                      event.target.value,
                    );
                  }}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="compression-series-crushing-date"
                  className="mb-1 text-xs font-semibold text-gray-700"
                >
                  Date d’écrasement
                </label>

                <DatePickerInput
                  id="compression-series-crushing-date"
                  value={series.crushingDate}
                  onChange={updateCrushingDate}
                  className="w-full"
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

              <div className="flex flex-col justify-end">
                <label
                  htmlFor="compression-series-show-in-planning"
                  className={`${fieldClass} inline-flex cursor-pointer items-center gap-3`}
                >
                  <input
                    id="compression-series-show-in-planning"
                    type="checkbox"
                    checked={series.showInPlanning}
                    onChange={(event) => {
                      setSeries((current) => ({
                        ...current,
                        showInPlanning:
                          event.target.checked,
                      }));
                      setError("");
                    }}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span>
                    Afficher dans la planification
                  </span>
                </label>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="compression-series-planning-time"
                  className="mb-1 text-xs font-semibold text-gray-700"
                >
                  Heure d’écrasement
                </label>
                <input
                  id="compression-series-planning-time"
                  type="time"
                  step={60}
                  value={series.planningTime}
                  onChange={(event) => {
                    setSeries((current) => ({
                      ...current,
                      planningTime:
                        event.target.value,
                    }));
                    setError("");
                  }}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {series.results.map((result, resultIndex) => {
                const inputId =
                  `compression-series-result-${result.specimenNumber}`;

                return (
                  <div
                    key={result.specimenNumber}
                    className="flex flex-col"
                  >
                    <label
                      htmlFor={inputId}
                      className="mb-1 text-xs font-semibold text-gray-700"
                    >
                      EP{result.specimenNumber}
                    </label>

                    <input
                      id={inputId}
                      type="number"
                      min={0}
                      step="0.001"
                      value={result.value ?? ""}
                      onChange={(event) => {
                        const inputValue =
                          event.target.value;

                        updateResult(resultIndex, {
                          specimenNumber:
                            result.specimenNumber,
                          value:
                            inputValue === ""
                              ? null
                              : Number(inputValue),
                          status:
                            inputValue === ""
                              ? "NOT_TESTED"
                              : "VALID",
                          note: null,
                        });

                        setError("");
                      }}
                      className={fieldClass}
                    />
                  </div>
                );
              })}
            </div>
            </div>
          </div>

          <div
            className="rounded-b-xl px-3.5 pt-2.5 pb-3.5 flex items-center justify-between gap-3"
            aria-label="Actions du formulaire"
          >
            <div className="flex flex-1 items-center justify-end gap-2 whitespace-nowrap">
              <button
                type="submit"
                className="btn-fit-white-outline"
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

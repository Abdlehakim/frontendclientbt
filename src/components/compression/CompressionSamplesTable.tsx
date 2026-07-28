import { useState } from "react";
import CompressionSampleModal, {
  type CompressionSampleModalPayload,
} from "@/components/compression/CompressionSampleModal";
import type {
  CompressionResultInput,
  CompressionResultStatus,
  CompressionSampleInput,
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

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const inputClassName =
  "h-7 w-full min-w-0 rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] leading-tight text-slate-900";

export type CompressionSamplesTableProps = {
  readOnly: boolean;
  samples: CompressionSampleInput[];
  resultColumnCount: number;
  onSamplesChange: (samples: CompressionSampleInput[]) => void;
  onResultColumnCountChange: (count: number) => void;
};

export function createEmptyCompressionResults(
  count: number,
): CompressionResultInput[] {
  return Array.from({ length: count }, (_, index) => ({
    specimenNumber: index + 1,
    value: null,
    status: "VALID",
    note: null,
  }));
}

export function createEmptyCompressionSeries(
  resultColumnCount: number,
  sortOrder = 0,
): CompressionSeriesInput {
  return {
    crushingDate: "",
    reference: "",
    sortOrder,
    results: createEmptyCompressionResults(resultColumnCount),
  };
}

export function createEmptyCompressionSample(
  sequenceNumber: number,
  sortOrder: number,
  resultColumnCount: number,
): CompressionSampleInput {
  return {
    sequenceNumber,
    dosage: "",
    cement: "",
    admixture: "",
    designation: "",
    pourDate: "",
    specimenSendDate: "",
    specimenCount: 6,
    sortOrder,
    series: [
      createEmptyCompressionSeries(resultColumnCount),
    ],
  };
}

export function normalizeCompressionSamples(
  samples: CompressionSampleInput[],
  resultColumnCount: number,
): CompressionSampleInput[] {
  return samples.map((sample) => ({
    ...sample,
    series: sample.series.map((series) => {
      const resultsByNumber = new Map(
        series.results.map((result) => [
          result.specimenNumber,
          result,
        ]),
      );

      return {
        ...series,
        results: Array.from(
          { length: resultColumnCount },
          (_, index) => {
            const specimenNumber = index + 1;
            const existing = resultsByNumber.get(specimenNumber);
            return existing
              ? {
                  ...existing,
                  specimenNumber,
                }
              : {
                  specimenNumber,
                  value: null,
                  status: "VALID" as const,
                  note: null,
                };
          },
        ),
      };
    }),
  }));
}

function dateOnlyMilliseconds(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const milliseconds = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(milliseconds)) return null;
  const normalized = new Date(milliseconds).toISOString().slice(0, 10);
  return normalized === value ? milliseconds : null;
}

export function calculatePreviewMaturity(
  pourDate: string,
  crushingDate: string,
): number | null {
  const pour = dateOnlyMilliseconds(pourDate);
  const crushing = dateOnlyMilliseconds(crushingDate);
  if (pour === null || crushing === null || crushing < pour) {
    return null;
  }
  return (crushing - pour) / 86_400_000;
}

export function calculatePreviewAverage(
  results: CompressionResultInput[],
): number | null {
  const values: number[] = [];

  for (const result of results) {
    if (
      result.status === "VALID" &&
      typeof result.value === "number" &&
      Number.isFinite(result.value)
    ) {
      values.push(result.value);
    }
  }

  if (values.length === 0) return null;
  const average =
    values.reduce((sum, value) => sum + value, 0) /
    values.length;
  return Math.round(average * 1000) / 1000;
}

export function formatCompressionNumber(
  value: number | null | undefined,
): string {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormatter.format(value)
    : "—";
}

function isResultStatus(
  value: string,
): value is CompressionResultStatus {
  return (
    value === "VALID" ||
    value === "INVALID" ||
    value === "NOT_TESTED"
  );
}

function displayResult(result: CompressionResultInput): string {
  if (result.status === "VALID") {
    return formatCompressionNumber(result.value);
  }
  return result.note?.trim() || "—";
}

export default function CompressionSamplesTable({
  readOnly,
  samples,
  resultColumnCount,
  onSamplesChange,
  onResultColumnCountChange,
}: CompressionSamplesTableProps) {
  const [actionError, setActionError] = useState("");
  const [sampleModalOpen, setSampleModalOpen] =
    useState(false);
  const useCompactLayout = resultColumnCount <= 4;
  const resultColumnWidth =
    20 / Math.max(resultColumnCount, 1);

  const replaceSample = (
    sampleIndex: number,
    sample: CompressionSampleInput,
  ) => {
    onSamplesChange(
      samples.map((current, index) =>
        index === sampleIndex ? sample : current,
      ),
    );
  };

  const replaceSeries = (
    sampleIndex: number,
    seriesIndex: number,
    series: CompressionSeriesInput,
  ) => {
    const sample = samples[sampleIndex];
    if (!sample) return;

    replaceSample(sampleIndex, {
      ...sample,
      series: sample.series.map((current, index) =>
        index === seriesIndex ? series : current,
      ),
    });
  };

  const replaceResult = (
    sampleIndex: number,
    seriesIndex: number,
    resultIndex: number,
    result: CompressionResultInput,
  ) => {
    const series = samples[sampleIndex]?.series[seriesIndex];
    if (!series) return;

    replaceSeries(sampleIndex, seriesIndex, {
      ...series,
      results: series.results.map((current, index) =>
        index === resultIndex ? result : current,
      ),
    });
  };

  const openSampleModal = () => {
    setActionError("");
    setSampleModalOpen(true);
  };

  const addSampleFromModal = (
    payload: CompressionSampleModalPayload,
  ) => {
    const nextSequenceNumber =
      Math.max(
        0,
        ...samples.map((sample) => sample.sequenceNumber),
      ) + 1;

    const initialSeries =
      createEmptyCompressionSeries(
        resultColumnCount,
        0,
      );

    const newSample: CompressionSampleInput = {
      sequenceNumber: nextSequenceNumber,
      dosage: payload.dosage,
      cement: payload.cement,
      admixture:
        payload.admixture.trim() || null,
      designation: payload.designation,
      pourDate: payload.pourDate,
      specimenSendDate:
        payload.specimenSendDate || null,
      specimenCount: payload.specimenCount,
      sortOrder: samples.length,
      series: [
        {
          ...initialSeries,
          crushingDate: payload.crushingDate,
          reference:
            payload.reference.trim() || null,
        },
      ],
    };

    setActionError("");

    onSamplesChange([
      ...samples,
      newSample,
    ]);

    setSampleModalOpen(false);
  };

  const removeSample = (sampleIndex: number) => {
    if (samples.length <= 1) {
      setActionError(
        "Le rapport doit contenir au moins un prélèvement.",
      );
      return;
    }

    setActionError("");
    onSamplesChange(
      samples
        .filter((_, index) => index !== sampleIndex)
        .map((sample, sortOrder) => ({
          ...sample,
          sortOrder,
        })),
    );
  };

  const addSeries = (sampleIndex: number) => {
    const sample = samples[sampleIndex];
    if (!sample) return;

    setActionError("");
    replaceSample(sampleIndex, {
      ...sample,
      series: [
        ...sample.series,
        createEmptyCompressionSeries(
          resultColumnCount,
          sample.series.length,
        ),
      ],
    });
  };

  const removeSeries = (
    sampleIndex: number,
    seriesIndex: number,
  ) => {
    const sample = samples[sampleIndex];
    if (!sample) return;
    if (sample.series.length <= 1) {
      setActionError(
        "Un prélèvement doit contenir au moins une série.",
      );
      return;
    }

    setActionError("");
    replaceSample(sampleIndex, {
      ...sample,
      series: sample.series
        .filter((_, index) => index !== seriesIndex)
        .map((series, sortOrder) => ({
          ...series,
          sortOrder,
        })),
    });
  };

  const addResultColumn = () => {
    if (resultColumnCount >= 12) {
      setActionError(
        "Le nombre maximal de colonnes EP est 12.",
      );
      return;
    }

    const nextCount = resultColumnCount + 1;
    setActionError("");
    onSamplesChange(
      normalizeCompressionSamples(samples, nextCount),
    );
    onResultColumnCountChange(nextCount);
  };

  const removeResultColumn = () => {
    if (resultColumnCount <= 1) {
      setActionError(
        "Le rapport doit contenir au moins une colonne EP.",
      );
      return;
    }

    const nextCount = resultColumnCount - 1;
    setActionError("");
    onSamplesChange(
      normalizeCompressionSamples(samples, nextCount),
    );
    onResultColumnCountChange(nextCount);
  };

  return (
    <div className="space-y-3">
      <CompressionSampleModal
        open={sampleModalOpen}
        onClose={() => {
          setSampleModalOpen(false);
        }}
        onSubmit={addSampleFromModal}
      />

      {!readOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="btn-fit-white-outline"
            onClick={openSampleModal}
          >
            Ajouter un prélèvement
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-fit-white-outline"
              onClick={removeResultColumn}
              disabled={resultColumnCount <= 1}
            >
              Retirer EP
            </button>
            <button
              type="button"
              className="btn-fit-white-outline"
              onClick={addResultColumn}
              disabled={resultColumnCount >= 12}
            >
              Ajouter EP
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div
        className={[
          useCompactLayout
            ? "overflow-x-hidden"
            : "overflow-x-auto",
          "rounded-lg border border-slate-300 bg-white",
        ].join(" ")}
      >
        <table
          className="w-full table-fixed border-collapse text-[10px] leading-tight"
          style={
            useCompactLayout
              ? undefined
              : {
                  minWidth: Math.max(
                    1650,
                    1290 + resultColumnCount * 145,
                  ),
                }
          }
        >
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "10%" }} />

            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />

            <col style={{ width: "5%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "5%" }} />

            {Array.from(
              { length: resultColumnCount },
              (_, index) => (
                <col
                  key={`ep-column-${index + 1}`}
                  style={{
                    width: `${resultColumnWidth}%`,
                  }}
                />
              ),
            )}

            <col style={{ width: "5%" }} />
            <col style={{ width: "9%" }} />
          </colgroup>

          <thead className="bg-(--primary) text-white">
            <tr>
              <th rowSpan={2} className="border border-white/30 px-1 py-1">N°</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1">Dosage</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1">Ciment</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1">Adjuvant</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1">Désignation</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1 whitespace-normal break-words leading-tight">Date coulage / prélèvement</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1 whitespace-normal break-words leading-tight">Date d’envoi éprouvette</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1 whitespace-normal break-words leading-tight">Date d’écrasement</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1 whitespace-normal break-words leading-tight">Nbr éprouvettes</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1">Réf</th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1 whitespace-normal break-words leading-tight">Maturité jours</th>
              <th colSpan={resultColumnCount} className="border border-white/30 px-1 py-1">
                Résultat
              </th>
              <th rowSpan={2} className="border border-white/30 px-1 py-1">Moyenne</th>
              <th rowSpan={2} className="no-print border border-white/30 px-1 py-1">Actions</th>
            </tr>
            <tr>
              {Array.from(
                { length: resultColumnCount },
                (_, index) => (
                  <th
                    key={`ep-header-${index + 1}`}
                    className="border border-white/30 px-1 py-1"
                  >
                    EP{index + 1}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {samples.map((sample, sampleIndex) =>
              sample.series.map((series, seriesIndex) => {
                const maturity = calculatePreviewMaturity(
                  sample.pourDate,
                  series.crushingDate,
                );
                const average = calculatePreviewAverage(
                  series.results,
                );

                return (
                  <tr
                    key={`${sampleIndex}-${seriesIndex}`}
                    className="align-middle odd:bg-white even:bg-slate-50"
                  >
                    {seriesIndex === 0 ? (
                      <>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5 text-center">
                          {readOnly ? (
                            sample.sequenceNumber
                          ) : (
                            <input
                              type="number"
                              min={1}
                              value={sample.sequenceNumber}
                              onChange={(event) =>
                                replaceSample(sampleIndex, {
                                  ...sample,
                                  sequenceNumber: Number(
                                    event.target.value,
                                  ),
                                })
                              }
                              className={inputClassName}
                            />
                          )}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          {readOnly ? (
                            sample.dosage || "—"
                          ) : (
                            <input
                              type="text"
                              value={sample.dosage}
                              onChange={(event) =>
                                replaceSample(sampleIndex, {
                                  ...sample,
                                  dosage: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          )}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          {readOnly ? (
                            sample.cement || "—"
                          ) : (
                            <input
                              type="text"
                              value={sample.cement}
                              onChange={(event) =>
                                replaceSample(sampleIndex, {
                                  ...sample,
                                  cement: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          )}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          {readOnly ? (
                            sample.admixture?.trim() || "—"
                          ) : (
                            <input
                              type="text"
                              value={sample.admixture ?? ""}
                              onChange={(event) =>
                                replaceSample(sampleIndex, {
                                  ...sample,
                                  admixture: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          )}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          {readOnly ? (
                            sample.designation || "—"
                          ) : (
                            <textarea
                              value={sample.designation}
                              onChange={(event) =>
                                replaceSample(sampleIndex, {
                                  ...sample,
                                  designation: event.target.value,
                                })
                              }
                              className={`${inputClassName} h-8 min-h-8 resize-y`}
                            />
                          )}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5 text-center">
                          {readOnly ? (
                            sample.pourDate || "—"
                          ) : (
                            <input
                              type="date"
                              value={sample.pourDate}
                              onChange={(event) =>
                                replaceSample(sampleIndex, {
                                  ...sample,
                                  pourDate: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          )}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5 text-center">
                          {readOnly ? (
                            sample.specimenSendDate || "—"
                          ) : (
                            <input
                              type="date"
                              value={sample.specimenSendDate ?? ""}
                              onChange={(event) =>
                                replaceSample(sampleIndex, {
                                  ...sample,
                                  specimenSendDate:
                                    event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          )}
                        </td>
                      </>
                    ) : null}

                    <td className="border border-slate-300 p-0.5 text-center">
                      {readOnly ? (
                        series.crushingDate || "—"
                      ) : (
                        <input
                          type="date"
                          value={series.crushingDate}
                          onChange={(event) =>
                            replaceSeries(
                              sampleIndex,
                              seriesIndex,
                              {
                                ...series,
                                crushingDate: event.target.value,
                              },
                            )
                          }
                          className={inputClassName}
                        />
                      )}
                    </td>

                    {seriesIndex === 0 ? (
                      <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5 text-center">
                        {readOnly ? (
                          sample.specimenCount
                        ) : (
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={sample.specimenCount}
                            onChange={(event) =>
                              replaceSample(sampleIndex, {
                                ...sample,
                                specimenCount: Number(
                                  event.target.value,
                                ),
                              })
                            }
                            className={inputClassName}
                          />
                        )}
                      </td>
                    ) : null}

                    <td className="border border-slate-300 p-0.5">
                      {readOnly ? (
                        series.reference?.trim() || "—"
                      ) : (
                        <input
                          type="text"
                          value={series.reference ?? ""}
                          onChange={(event) =>
                            replaceSeries(
                              sampleIndex,
                              seriesIndex,
                              {
                                ...series,
                                reference: event.target.value,
                              },
                            )
                          }
                          className={inputClassName}
                        />
                      )}
                    </td>
                    <td className="border border-slate-300 p-0.5 text-center font-semibold">
                      {maturity === null ? "—" : maturity}
                    </td>

                    {series.results.map((result, resultIndex) => (
                      <td
                        key={`${sampleIndex}-${seriesIndex}-${result.specimenNumber}`}
                        className="border border-slate-300 p-0.5 text-center"
                      >
                        {readOnly ? (
                          displayResult(result)
                        ) : (
                          <div className="space-y-0.5">
                            <select
                              value={result.status}
                              onChange={(event) => {
                                const status = event.target.value;
                                if (!isResultStatus(status)) return;
                                replaceResult(
                                  sampleIndex,
                                  seriesIndex,
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
                              }}
                              className={inputClassName}
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
                                onChange={(event) =>
                                  replaceResult(
                                    sampleIndex,
                                    seriesIndex,
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
                                  )
                                }
                                className={inputClassName}
                              />
                            ) : (
                              <input
                                type="text"
                                value={result.note ?? ""}
                                placeholder={
                                  result.status === "INVALID"
                                    ? "Ex. Mal faite"
                                    : "Note (optionnelle)"
                                }
                                onChange={(event) =>
                                  replaceResult(
                                    sampleIndex,
                                    seriesIndex,
                                    resultIndex,
                                    {
                                      ...result,
                                      note: event.target.value,
                                    },
                                  )
                                }
                                className={inputClassName}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    ))}

                    <td className="border border-slate-300 p-0.5 text-center font-semibold">
                      {formatCompressionNumber(average)}
                    </td>
                    <td className="no-print border border-slate-300 p-0.5">
                      {!readOnly ? (
                        <div className="flex flex-col gap-1">
                          {seriesIndex === 0 ? (
                            <>
                              <button
                                type="button"
                                className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[9px] leading-tight hover:bg-slate-50"
                                onClick={() =>
                                  addSeries(sampleIndex)
                                }
                              >
                                Ajouter une série
                              </button>
                              <button
                                type="button"
                                className="rounded border border-red-200 bg-white px-1 py-0.5 text-[9px] leading-tight text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  removeSample(sampleIndex)
                                }
                              >
                                Supprimer le prélèvement
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[9px] leading-tight hover:bg-slate-50"
                            onClick={() =>
                              removeSeries(
                                sampleIndex,
                                seriesIndex,
                              )
                            }
                          >
                            Supprimer la série
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from "react";
import CompressionSampleModal, {
  type CompressionSampleModalPayload,
} from "@/components/compression/CompressionSampleModal";
import CompressionSeriesModal from "@/components/compression/CompressionSeriesModal";
import {
  FaPlus,
  FaRegEdit,
  FaTrashAlt,
} from "react-icons/fa";
import type {
  CompressionResultInput,
  CompressionSampleInput,
  CompressionSeriesInput,
} from "@/lib/compressionApi";

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export type CompressionSamplesTableProps = {
  readOnly: boolean;
  samples: CompressionSampleInput[];
  resultColumnCount: number;
  onSamplesChange: (samples: CompressionSampleInput[]) => void;
  onResultColumnCountChange: (count: number) => void;
};

type SampleModalState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      sampleIndex: number;
    }
  | null;

type SeriesModalState = {
  mode: "create" | "edit";
  sampleIndex: number;
  seriesIndex: number;
  initialValue: CompressionSeriesInput;
} | null;

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

function formatDateOnly(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function displayResult(result: CompressionResultInput): string {
  if (result.status === "VALID") {
    return formatCompressionNumber(result.value);
  }
  return result.note?.trim() || "—";
}

const sampleToModalPayload = (
  sample: CompressionSampleInput,
): CompressionSampleModalPayload => {
  const firstSeries = sample.series[0];

  return {
    dosage: sample.dosage,
    cement: sample.cement,
    admixture: sample.admixture ?? "",
    designation: sample.designation,
    pourDate: sample.pourDate,
    specimenSendDate:
      sample.specimenSendDate ?? "",
    specimenCount: sample.specimenCount,
    crushingDate:
      firstSeries?.crushingDate ?? "",
    reference:
      firstSeries?.reference ?? "",
  };
};

export default function CompressionSamplesTable({
  readOnly,
  samples,
  resultColumnCount,
  onSamplesChange,
  onResultColumnCountChange,
}: CompressionSamplesTableProps) {
  const [actionError, setActionError] = useState("");
  const [sampleModalState, setSampleModalState] =
    useState<SampleModalState>(null);
  const [seriesModalState, setSeriesModalState] =
    useState<SeriesModalState>(null);
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

  const openCreateSampleModal = () => {
    setActionError("");
    setSampleModalState({
      mode: "create",
    });
  };

  const openEditSampleModal = (
    sampleIndex: number,
  ) => {
    const sample = samples[sampleIndex];
    if (!sample) return;

    setActionError("");
    setSampleModalState({
      mode: "edit",
      sampleIndex,
    });
  };

  const submitSampleModal = (
    payload: CompressionSampleModalPayload,
  ) => {
    if (!sampleModalState) return;

    if (sampleModalState.mode === "create") {
      const nextSequenceNumber =
        Math.max(
          0,
          ...samples.map(
            (sample) => sample.sequenceNumber,
          ),
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

      onSamplesChange([
        ...samples,
        newSample,
      ]);
    } else {
      const sample =
        samples[sampleModalState.sampleIndex];

      if (!sample) return;

      const firstSeries =
        sample.series[0] ??
        createEmptyCompressionSeries(
          resultColumnCount,
          0,
        );

      const updatedFirstSeries: CompressionSeriesInput = {
        ...firstSeries,
        crushingDate: payload.crushingDate,
        reference:
          payload.reference.trim() || null,
        sortOrder: 0,
      };

      replaceSample(
        sampleModalState.sampleIndex,
        {
          ...sample,
          dosage: payload.dosage,
          cement: payload.cement,
          admixture:
            payload.admixture.trim() || null,
          designation: payload.designation,
          pourDate: payload.pourDate,
          specimenSendDate:
            payload.specimenSendDate || null,
          specimenCount: payload.specimenCount,
          series:
            sample.series.length > 0
              ? [
                  updatedFirstSeries,
                  ...sample.series.slice(1),
                ]
              : [updatedFirstSeries],
        },
      );
    }

    setActionError("");
    setSampleModalState(null);
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

  const openCreateSeriesModal = (
    sampleIndex: number,
  ) => {
    const sample = samples[sampleIndex];
    if (!sample) return;

    setActionError("");
    setSeriesModalState({
      mode: "create",
      sampleIndex,
      seriesIndex: sample.series.length,
      initialValue:
        createEmptyCompressionSeries(
          resultColumnCount,
          sample.series.length,
        ),
    });
  };

  const openEditSeriesModal = (
    sampleIndex: number,
    seriesIndex: number,
  ) => {
    const series =
      samples[sampleIndex]?.series[seriesIndex];

    if (!series) return;

    setActionError("");
    setSeriesModalState({
      mode: "edit",
      sampleIndex,
      seriesIndex,
      initialValue: {
        ...series,
        results: series.results.map(
          (result) => ({
            ...result,
          }),
        ),
      },
    });
  };

  const submitSeriesModal = (
    submittedSeries: CompressionSeriesInput,
  ) => {
    if (!seriesModalState) return;

    const sample =
      samples[seriesModalState.sampleIndex];

    if (!sample) return;

    if (seriesModalState.mode === "create") {
      replaceSample(
        seriesModalState.sampleIndex,
        {
          ...sample,
          series: [
            ...sample.series,
            {
              ...submittedSeries,
              sortOrder: sample.series.length,
            },
          ],
        },
      );
    } else {
      const existingSeries =
        sample.series[
          seriesModalState.seriesIndex
        ];

      if (!existingSeries) return;

      replaceSeries(
        seriesModalState.sampleIndex,
        seriesModalState.seriesIndex,
        {
          ...submittedSeries,
          sortOrder: existingSeries.sortOrder,
        },
      );
    }

    setActionError("");
    setSeriesModalState(null);
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

  const editingSample =
    sampleModalState?.mode === "edit"
      ? samples[sampleModalState.sampleIndex] ??
        null
      : null;

  return (
    <div className="space-y-3">
      <CompressionSampleModal
        open={sampleModalState !== null}
        mode={
          sampleModalState?.mode ?? "create"
        }
        initialValue={
          editingSample
            ? sampleToModalPayload(editingSample)
            : null
        }
        onClose={() => {
          setSampleModalState(null);
        }}
        onSubmit={submitSampleModal}
      />

      <CompressionSeriesModal
        open={seriesModalState !== null}
        mode={
          seriesModalState?.mode ?? "create"
        }
        initialValue={
          seriesModalState?.initialValue ?? null
        }
        resultColumnCount={resultColumnCount}
        onClose={() => {
          setSeriesModalState(null);
        }}
        onSubmit={submitSeriesModal}
      />

      {!readOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="btn-fit-white-outline"
            onClick={openCreateSampleModal}
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
                          {sample.sequenceNumber}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          {sample.dosage.trim() || "—"}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          {sample.cement.trim() || "—"}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          {sample.admixture?.trim() || "—"}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5">
                          <div className="whitespace-pre-wrap break-words">
                            {sample.designation.trim() || "—"}
                          </div>
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5 text-center">
                          {formatDateOnly(sample.pourDate)}
                        </td>
                        <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5 text-center">
                          {formatDateOnly(
                            sample.specimenSendDate,
                          )}
                        </td>
                      </>
                    ) : null}

                    <td className="border border-slate-300 p-0.5 text-center">
                      {formatDateOnly(
                        series.crushingDate,
                      )}
                    </td>

                    {seriesIndex === 0 ? (
                      <td rowSpan={sample.series.length} className="border border-slate-300 p-0.5 text-center">
                        {sample.specimenCount}
                      </td>
                    ) : null}

                    <td className="border border-slate-300 p-0.5">
                      {series.reference?.trim() || "—"}
                    </td>
                    <td className="border border-slate-300 p-0.5 text-center font-semibold">
                      {maturity === null ? "—" : maturity}
                    </td>

                    {series.results.map((result) => (
                      <td
                        key={`${sampleIndex}-${seriesIndex}-${result.specimenNumber}`}
                        className="border border-slate-300 p-0.5 text-center"
                      >
                        {displayResult(result)}
                      </td>
                    ))}

                    <td className="border border-slate-300 p-0.5 text-center font-semibold">
                      {formatCompressionNumber(average)}
                    </td>
                    <td className="no-print border border-slate-300 p-0.5">
                      {!readOnly ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {seriesIndex === 0 ? (
                            <>
                              <button
                                type="button"
                                className="ButtonSquare"
                                title="Modifier le prélèvement"
                                aria-label="Modifier le prélèvement"
                                onClick={() =>
                                  openEditSampleModal(sampleIndex)
                                }
                              >
                                <FaRegEdit size={13} />
                              </button>
                              <button
                                type="button"
                                className="ButtonSquare"
                                title="Ajouter une série"
                                aria-label="Ajouter une série"
                                onClick={() =>
                                  openCreateSeriesModal(sampleIndex)
                                }
                              >
                                <FaPlus size={12} />
                              </button>
                              <button
                                type="button"
                                className="ButtonSquareDelete"
                                title="Supprimer le prélèvement"
                                aria-label="Supprimer le prélèvement"
                                onClick={() =>
                                  removeSample(sampleIndex)
                                }
                              >
                                <FaTrashAlt size={13} />
                              </button>
                            </>
                          ) : null}

                          <button
                            type="button"
                            className="ButtonSquare"
                            title="Modifier la série"
                            aria-label="Modifier la série"
                            onClick={() =>
                              openEditSeriesModal(
                                sampleIndex,
                                seriesIndex,
                              )
                            }
                          >
                            <FaRegEdit size={13} />
                          </button>

                          {sample.series.length > 1 ? (
                            <button
                              type="button"
                              className="ButtonSquareDelete"
                              title="Supprimer la série"
                              aria-label="Supprimer la série"
                              onClick={() =>
                                removeSeries(
                                  sampleIndex,
                                  seriesIndex,
                                )
                              }
                            >
                              <FaTrashAlt size={13} />
                            </button>
                          ) : null}
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

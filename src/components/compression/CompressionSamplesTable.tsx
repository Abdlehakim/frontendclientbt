import { useState } from "react";
import CompressionSampleModal, {
  type CompressionSampleModalPayload,
} from "@/components/compression/CompressionSampleModal";
import CompressionSeriesModal, {
  type CompressionSeriesModalPayload,
} from "@/components/compression/CompressionSeriesModal";
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
  onSamplesChange: (samples: CompressionSampleInput[]) => void;
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
  initialSpecimenCount: number;
  pourDate: string;
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
  const values = results
    .map((result) => result.value)
    .filter(
      (value): value is number =>
        typeof value === "number" &&
        Number.isFinite(value),
    );

  if (values.length === 0) {
    return null;
  }

  return (
    Math.round(
      (values.reduce(
        (sum, value) => sum + value,
        0,
      ) /
        values.length) *
        1000,
    ) / 1000
  );
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

function displayResult(
  result: CompressionResultInput | undefined,
): string {
  return formatCompressionNumber(
    result?.value,
  );
}

const sampleToModalPayload = (
  sample: CompressionSampleInput,
): CompressionSampleModalPayload => ({
  dosage: sample.dosage,
  cement: sample.cement,
  admixture: sample.admixture ?? "",
  designation: sample.designation,
  pourDate: sample.pourDate,
  specimenSendDate:
    sample.specimenSendDate ?? "",
});

export default function CompressionSamplesTable({
  readOnly,
  samples,
  onSamplesChange,
}: CompressionSamplesTableProps) {
  const [actionError, setActionError] = useState("");
  const [sampleModalState, setSampleModalState] =
    useState<SampleModalState>(null);
  const [seriesModalState, setSeriesModalState] =
    useState<SeriesModalState>(null);

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
        specimenCount: 6,
        sortOrder: samples.length,
        series: [],
      };

      onSamplesChange([
        ...samples,
        newSample,
      ]);
    } else {
      const sample =
        samples[sampleModalState.sampleIndex];

      if (!sample) return;

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
          4,
          sample.series.length,
        ),
      initialSpecimenCount:
        sample.specimenCount > 0
          ? sample.specimenCount
          : 6,
      pourDate: sample.pourDate,
    });
  };

  const openEditSeriesModal = (
    sampleIndex: number,
    seriesIndex: number,
  ) => {
    const sample = samples[sampleIndex];
    if (!sample) return;

    const series =
      sample.series[seriesIndex];
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
      initialSpecimenCount:
        sample.specimenCount > 0
          ? sample.specimenCount
          : 6,
      pourDate: sample.pourDate,
    });
  };

  const submitSeriesModal = (
    payload: CompressionSeriesModalPayload,
  ) => {
    if (!seriesModalState) return;

    const submittedSeries =
      payload.series;

    const sample =
      samples[seriesModalState.sampleIndex];

    if (!sample) return;

    if (seriesModalState.mode === "create") {
      replaceSample(
        seriesModalState.sampleIndex,
        {
          ...sample,
          specimenCount:
            payload.specimenCount,
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

      replaceSample(
        seriesModalState.sampleIndex,
        {
          ...sample,
          specimenCount:
            payload.specimenCount,
          series: sample.series.map(
            (currentSeries, index) =>
              index ===
              seriesModalState.seriesIndex
                ? {
                    ...submittedSeries,
                    sortOrder:
                      existingSeries.sortOrder,
                  }
                : currentSeries,
          ),
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
        initialSpecimenCount={
          seriesModalState
            ?.initialSpecimenCount ?? 6
        }
        pourDate={
          seriesModalState?.pourDate ?? ""
        }
        onClose={() => {
          setSeriesModalState(null);
        }}
        onSubmit={submitSeriesModal}
      />

      {!readOnly ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="btn-fit-white-outline"
            onClick={openCreateSampleModal}
          >
            Ajouter un prélèvement
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {samples.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
          <table className="w-full table-fixed border-collapse text-xs">
            <thead className="bg-(--primary) text-white">
              <tr>
                <th className="border border-white/30 px-2 py-2">
                  N°
                </th>
                <th className="border border-white/30 px-2 py-2">
                  Dosage
                </th>
                <th className="border border-white/30 px-2 py-2">
                  Ciment
                </th>
                <th className="border border-white/30 px-2 py-2">
                  Adjuvant
                </th>
                <th className="border border-white/30 px-2 py-2">
                  Désignation
                </th>
                <th className="border border-white/30 px-2 py-2">
                  Date coulage / prélèvement
                </th>
                <th className="border border-white/30 px-2 py-2">
                  Date d’envoi éprouvette
                </th>
                <th className="no-print border border-white/30 px-2 py-2">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={8}
                  className="border border-slate-300 px-4 py-6 text-center text-sm text-slate-500"
                >
                  Aucun prélèvement ajouté.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {samples.map((sample, sampleIndex) => (
            <section
              key={`sample-block-${sample.sequenceNumber}-${sampleIndex}`}
              className="space-y-3"
            >
              <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
                <table className="w-full table-fixed border-collapse text-xs">
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "18%" }} />
                  </colgroup>

                  <thead className="bg-(--primary) text-white">
                    <tr>
                      <th className="border border-white/30 px-2 py-2">
                        N°
                      </th>
                      <th className="border border-white/30 px-2 py-2">
                        Dosage
                      </th>
                      <th className="border border-white/30 px-2 py-2">
                        Ciment
                      </th>
                      <th className="border border-white/30 px-2 py-2">
                        Adjuvant
                      </th>
                      <th className="border border-white/30 px-2 py-2">
                        Désignation
                      </th>
                      <th className="border border-white/30 px-2 py-2">
                        Date coulage / prélèvement
                      </th>
                      <th className="border border-white/30 px-2 py-2">
                        Date d’envoi éprouvette
                      </th>
                      <th className="no-print border border-white/30 px-2 py-2">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-slate-300 px-2 py-2 text-center">
                        {sample.sequenceNumber}
                      </td>
                      <td className="border border-slate-300 px-2 py-2">
                        {sample.dosage.trim() || "—"}
                      </td>
                      <td className="border border-slate-300 px-2 py-2">
                        {sample.cement.trim() || "—"}
                      </td>
                      <td className="border border-slate-300 px-2 py-2">
                        {sample.admixture?.trim() || "—"}
                      </td>
                      <td className="border border-slate-300 px-2 py-2">
                        <div className="whitespace-pre-wrap break-words">
                          {sample.designation.trim() || "—"}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center">
                        {formatDateOnly(sample.pourDate)}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center">
                        {formatDateOnly(
                          sample.specimenSendDate,
                        )}
                      </td>
                      <td className="no-print border border-slate-300 px-2 py-2">
                        {!readOnly ? (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <button
                              type="button"
                              className="ButtonSquare ButtonSquare--compact"
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
                              className="ButtonSquare ButtonSquare--compact"
                              title="Ajouter un écrasement"
                              aria-label="Ajouter un écrasement"
                              onClick={() =>
                                openCreateSeriesModal(sampleIndex)
                              }
                            >
                              <FaPlus size={12} />
                            </button>

                            <button
                              type="button"
                              className="ButtonSquareDelete ButtonSquareDelete--compact"
                              title="Supprimer le prélèvement"
                              aria-label="Supprimer le prélèvement"
                              onClick={() =>
                                removeSample(sampleIndex)
                              }
                            >
                              <FaTrashAlt size={13} />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {sample.series.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                  <div className="text-sm text-slate-500">
                    Aucun écrasement ajouté.
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {sample.series.map((series, seriesIndex) => {
                  const maturity = calculatePreviewMaturity(
                    sample.pourDate,
                    series.crushingDate,
                  );
                  const average = calculatePreviewAverage(
                    series.results,
                  );
                  const orderedResults = [
                    ...series.results,
                  ].sort(
                    (first, second) =>
                      first.specimenNumber -
                      second.specimenNumber,
                  );

                  void maturity;

                  return (
                    <div
                      key={`${sampleIndex}-${seriesIndex}`}
                      className="overflow-hidden rounded-lg border border-slate-300 bg-white"
                    >
                      <table className="w-full table-fixed border-collapse text-xs">
                        <thead className="bg-(--primary) text-white">
                          <tr>
                            <th className="border border-white/30 px-2 py-2">
                              Date d’écrasement
                            </th>
                            <th className="border border-white/30 px-2 py-2">
                              Nbr éprouvettes
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 px-2 py-2 text-center">
                              {formatDateOnly(
                                series.crushingDate,
                              )}
                            </td>
                            <td className="border border-slate-300 px-2 py-2 text-center">
                              {sample.specimenCount}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="overflow-x-auto">
                        <table
                          className="w-full table-fixed border-collapse text-xs"
                          style={{
                            minWidth:
                              orderedResults.length > 4
                                ? orderedResults.length * 80
                                : undefined,
                          }}
                        >
                          <thead className="bg-(--primary) text-white">
                            <tr>
                              {orderedResults.map(
                                (result) => (
                                  <th
                                    key={`ep-header-${sampleIndex}-${seriesIndex}-${result.specimenNumber}`}
                                    className="border border-white/30 px-2 py-2"
                                  >
                                    EP{result.specimenNumber}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {orderedResults.map(
                                (result) => (
                                  <td
                                    key={`ep-value-${sampleIndex}-${seriesIndex}-${result.specimenNumber}`}
                                    className="border border-slate-300 px-2 py-2 text-center"
                                  >
                                    {displayResult(result)}
                                  </td>
                                ),
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <table className="w-full table-fixed border-collapse text-xs">
                        <thead className="bg-(--primary) text-white">
                          <tr>
                            <th className="border border-white/30 px-2 py-2">
                              Moyenne
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 px-2 py-2 text-center font-semibold">
                              {formatCompressionNumber(average)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {!readOnly ? (
                        <table className="no-print w-full table-fixed border-collapse text-xs">
                          <thead className="bg-(--primary) text-white">
                            <tr>
                              <th className="border border-white/30 px-2 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 px-2 py-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    className="ButtonSquare ButtonSquare--compact"
                                    title="Modifier l’écrasement"
                                    aria-label="Modifier l’écrasement"
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
                                      className="ButtonSquareDelete ButtonSquareDelete--compact"
                                      title="Supprimer l’écrasement"
                                      aria-label="Supprimer l’écrasement"
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
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
      )}
    </div>
  );
}

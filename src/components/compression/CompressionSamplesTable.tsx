import { useState } from "react";
import CompressionSampleModal, {
  type CompressionSampleModalPayload,
} from "@/components/compression/CompressionSampleModal";
import CompressionSeriesModal, {
  type CompressionSeriesModalPayload,
} from "@/components/compression/CompressionSeriesModal";
import {
  FaChartBar,
  FaPlusCircle,
  FaTrashAlt,
} from "react-icons/fa";
import { BiPlus } from "react-icons/bi";
import { FiEdit3 } from "react-icons/fi";
import type {
  CompressionResultInput,
  CompressionSampleInput,
  CompressionSampleMutationInput,
  CompressionSeriesInput,
  CompressionSeriesMutationInput,
} from "@/lib/compressionApi";

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export type CompressionSamplesTableProps = {
  readOnly: boolean;
  busy: boolean;
  samples: CompressionSampleInput[];
  onCreateSample: (
    payload: CompressionSampleMutationInput,
  ) => Promise<void>;
  onUpdateSample: (
    sampleId: string,
    payload: CompressionSampleMutationInput,
  ) => Promise<void>;
  onDeleteSample: (
    sampleId: string,
  ) => Promise<void>;
  onCreateSeries: (
    sampleId: string,
    payload: CompressionSeriesMutationInput,
  ) => Promise<void>;
  onUpdateSeries: (
    sampleId: string,
    seriesId: string,
    payload: CompressionSeriesMutationInput,
  ) => Promise<void>;
  onDeleteSeries: (
    sampleId: string,
    seriesId: string,
  ) => Promise<void>;
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
    status: "NOT_TESTED",
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
    showInPlanning: true,
    planningTime: "10:00",
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
  busy,
  samples,
  onCreateSample,
  onUpdateSample,
  onDeleteSample,
  onCreateSeries,
  onUpdateSeries,
  onDeleteSeries,
}: CompressionSamplesTableProps) {
  const [actionError, setActionError] = useState("");
  const [actionPending, setActionPending] =
    useState(false);
  const [sampleModalState, setSampleModalState] =
    useState<SampleModalState>(null);
  const [seriesModalState, setSeriesModalState] =
    useState<SeriesModalState>(null);

  const interactionDisabled =
    readOnly || busy || actionPending;

  const openCreateSampleModal = () => {
    if (interactionDisabled) return;
    setActionError("");
    setSampleModalState({
      mode: "create",
    });
  };

  const openEditSampleModal = (
    sampleIndex: number,
  ) => {
    if (interactionDisabled) return;
    const sample = samples[sampleIndex];
    if (!sample) return;

    setActionError("");
    setSampleModalState({
      mode: "edit",
      sampleIndex,
    });
  };

  const submitSampleModal = async (
    payload: CompressionSampleModalPayload,
  ) => {
    if (!sampleModalState || interactionDisabled) return;

    if (sampleModalState.mode === "create") {
      const nextSequenceNumber =
        Math.max(
          0,
          ...samples.map(
            (sample) => sample.sequenceNumber,
          ),
        ) + 1;

      const input: CompressionSampleMutationInput = {
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
      };

      setActionPending(true);
      setActionError("");

      try {
        await onCreateSample(input);
        setSampleModalState(null);
      } catch {
        setActionError(
          "Impossible d’enregistrer le prélèvement.",
        );
      } finally {
        setActionPending(false);
      }
    } else {
      const sample =
        samples[sampleModalState.sampleIndex];

      if (!sample?.id) {
        setActionError(
          "Le prélèvement enregistré est introuvable.",
        );
        return;
      }

      const input: CompressionSampleMutationInput = {
        sequenceNumber: sample.sequenceNumber,
        dosage: payload.dosage,
        cement: payload.cement,
        admixture:
          payload.admixture.trim() || null,
        designation: payload.designation,
        pourDate: payload.pourDate,
        specimenSendDate:
          payload.specimenSendDate || null,
        specimenCount: sample.specimenCount,
        sortOrder: sample.sortOrder,
      };

      setActionPending(true);
      setActionError("");

      try {
        await onUpdateSample(sample.id, input);
        setSampleModalState(null);
      } catch {
        setActionError(
          "Impossible d’enregistrer le prélèvement.",
        );
      } finally {
        setActionPending(false);
      }
    }
  };

  const removeSample = async (sampleIndex: number) => {
    if (interactionDisabled) return;

    if (samples.length <= 1) {
      setActionError(
        "Le rapport doit contenir au moins un prélèvement.",
      );
      return;
    }

    const sample = samples[sampleIndex];
    if (!sample?.id) {
      setActionError(
        "Le prélèvement enregistré est introuvable.",
      );
      return;
    }

    setActionPending(true);
    setActionError("");

    try {
      await onDeleteSample(sample.id);
    } catch {
      setActionError(
        "Impossible de supprimer le prélèvement.",
      );
    } finally {
      setActionPending(false);
    }
  };

  const openCreateSeriesModal = (
    sampleIndex: number,
  ) => {
    if (interactionDisabled) return;
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
    if (interactionDisabled) return;
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

  const submitSeriesModal = async (
    payload: CompressionSeriesModalPayload,
  ) => {
    if (!seriesModalState || interactionDisabled) return;

    const sample =
      samples[seriesModalState.sampleIndex];

    if (!sample?.id) {
      setActionError(
        "Le prélèvement enregistré est introuvable.",
      );
      return;
    }

    const buildInput = (
      sortOrder: number,
    ): CompressionSeriesMutationInput => ({
      specimenCount: payload.specimenCount,
      series: {
        crushingDate:
          payload.series.crushingDate,
        reference:
          payload.series.reference?.trim() || null,
        sortOrder,
        showInPlanning:
          payload.series.showInPlanning,
        planningTime:
          payload.series.planningTime,
        results: payload.series.results.map(
          (result, index) => ({
            specimenNumber: index + 1,
            value: result.value ?? null,
            status: result.status,
            note: result.note ?? null,
          }),
        ),
      },
    });

    setActionPending(true);
    setActionError("");

    try {
      if (seriesModalState.mode === "create") {
        await onCreateSeries(
          sample.id,
          buildInput(sample.series.length),
        );
      } else {
        const existingSeries =
          sample.series[
            seriesModalState.seriesIndex
          ];

        if (!existingSeries?.id) {
          setActionError(
            "La série enregistrée est introuvable.",
          );
          return;
        }

        await onUpdateSeries(
          sample.id,
          existingSeries.id,
          buildInput(existingSeries.sortOrder),
        );
      }

      setSeriesModalState(null);
    } catch {
      setActionError(
        "Impossible d’enregistrer la série.",
      );
    } finally {
      setActionPending(false);
    }
  };

  const removeSeries = async (
    sampleIndex: number,
    seriesIndex: number,
  ) => {
    if (interactionDisabled) return;

    const sample = samples[sampleIndex];
    if (!sample) return;
    if (sample.series.length <= 1) {
      setActionError(
        "Un prélèvement doit contenir au moins une série.",
      );
      return;
    }

    const series = sample.series[seriesIndex];
    if (!sample.id || !series?.id) {
      setActionError(
        "La série enregistrée est introuvable.",
      );
      return;
    }

    setActionPending(true);
    setActionError("");

    try {
      await onDeleteSeries(
        sample.id,
        series.id,
      );
    } catch {
      setActionError(
        "Impossible de supprimer la série.",
      );
    } finally {
      setActionPending(false);
    }
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
        submitting={actionPending || busy}
        onClose={() => {
          if (!interactionDisabled) {
            setSampleModalState(null);
          }
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
        submitting={actionPending || busy}
        onClose={() => {
          if (!interactionDisabled) {
            setSeriesModalState(null);
          }
        }}
        onSubmit={submitSeriesModal}
      />

      <div className="flex w-full flex-wrap items-center justify-end gap-4">

        {!readOnly ? (
          <button
            type="button"
            className="btn-fit-white-outline"
            onClick={openCreateSampleModal}
            disabled={interactionDisabled}
          >
            <FaPlusCircle size={18} />

            <span>Ajouter un prélèvement</span>
          </button>
        ) : null}
      </div>

      {actionError ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {samples.length === 0 ? (
        <div className="overflow-hidden rounded-lg bg-white ">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="bg-[#0d2d5f] text-white">
              <tr>
                <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                  N°
                </th>
                <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                  Dosage
                </th>
                <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                  Ciment
                </th>
                <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                  Adjuvant
                </th>
                <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                  Désignation
                </th>
                <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold leading-tight">
                  Date coulage / prélèvement
                </th>
                <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold leading-tight">
                  Date d’envoi éprouvette
                </th>
                <th className="no-print border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={8}
                  className="px-2 py-2 text-center text-sm text-slate-500"
                >
                  Aucun prélèvement ajouté.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-8">
          {samples.map((sample, sampleIndex) => (
            <section
              key={`sample-block-${sample.sequenceNumber}-${sampleIndex}`}
              className="space-y-6"
            >
              <div className="overflow-hidden rounded-lg bg-white">
                <table className="w-full table-fixed border-collapse text-sm">
                  <colgroup>
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>

                  <thead className="bg-[#0d2d5f] text-white">
                    <tr>
                      <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                        N°
                      </th>
                      <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                        Dosage
                      </th>
                      <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                        Ciment
                      </th>
                      <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                        Adjuvant
                      </th>
                      <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                        Désignation
                      </th>
                      <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold leading-tight">
                        Date coulage / prélèvement
                      </th>
                      <th className="border border-white/20 px-2 py-2 text-center text-sm font-semibold leading-tight">
                        Date d’envoi éprouvette
                      </th>
                      <th className="no-print border border-white/20 px-2 py-2 text-center text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        {sample.sequenceNumber}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        {sample.dosage.trim() || "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        {sample.cement.trim() || "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        {sample.admixture?.trim() || "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        <div className="whitespace-pre-wrap break-words">
                          {sample.designation.trim() || "—"}
                        </div>
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        {formatDateOnly(sample.pourDate)}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        {formatDateOnly(
                          sample.specimenSendDate,
                        )}
                      </td>
                      <td className="no-print border border-slate-200 px-2 py-2 text-center text-sm font-medium text-slate-900">
                        {!readOnly ? (
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              className="ButtonSquare"
                              title="Modifier le prélèvement"
                              aria-label="Modifier le prélèvement"
                              disabled={interactionDisabled}
                              onClick={() =>
                                openEditSampleModal(sampleIndex)
                              }
                            >
                              <FiEdit3 size={18} />
                            </button>

                            <button
                              type="button"
                              className="ButtonSquare"
                              title="Ajouter un écrasement"
                              aria-label="Ajouter un écrasement"
                              disabled={interactionDisabled}
                              onClick={() =>
                                openCreateSeriesModal(sampleIndex)
                              }
                            >
                              <BiPlus size={18} />
                            </button>

                            <button
                              type="button"
                              className="ButtonSquareDelete"
                              title="Supprimer le prélèvement"
                              aria-label="Supprimer le prélèvement"
                              disabled={interactionDisabled}
                              onClick={() => {
                                void removeSample(sampleIndex);
                              }}
                            >
                              <FaTrashAlt size={18} />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {sample.series.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="text-sm text-slate-500">
                    Aucun écrasement ajouté.
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-">
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

                  return (
                    <div
                      key={`${sampleIndex}-${seriesIndex}`}
                      className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0d2d5f] text-white shadow-sm">
                            <FaChartBar size={19} />
                          </div>

                          <h3 className="truncate text-base font-bold text-[#0d2d5f]">
                            Résultats des éprouvettes
                          </h3>
                        </div>

                        {!readOnly ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              className="ButtonSquare"
                              title="Modifier l’écrasement"
                              aria-label="Modifier l’écrasement"
                              disabled={interactionDisabled}
                              onClick={() =>
                                openEditSeriesModal(
                                  sampleIndex,
                                  seriesIndex,
                                )
                              }
                            >
                              <FiEdit3 size={17} />
                            </button>

                            {sample.series.length > 1 ? (
                              <button
                                type="button"
                                className="ButtonSquareDelete"
                                title="Supprimer l’écrasement"
                                aria-label="Supprimer l’écrasement"
                                disabled={interactionDisabled}
                                onClick={() => {
                                  void removeSeries(
                                    sampleIndex,
                                    seriesIndex,
                                  );
                                }}
                              >
                                <FaTrashAlt size={17} />
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="px-5 py-4">
                        <div className="grid grid-cols-2 border-b border-slate-200">
                          <div className="border-r border-slate-200 px-2 py-2">
                            <div className="text-xs font-semibold text-slate-500">
                              Maturité (JRS)
                            </div>

                            <div className="mt-1.5 text-base font-bold text-[#0d2d5f]">
                              {maturity === null
                                ? "—"
                                : `${maturity} jour${maturity > 1 ? "s" : ""}`}
                            </div>
                          </div>

                          <div className="px-2 py-2">
                            <div className="text-xs font-semibold text-slate-500">
                              Date d’écrasement
                            </div>

                            <div className="mt-1.5 text-base font-bold text-[#0d2d5f]">
                              {formatDateOnly(
                                series.crushingDate,
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2">
                          <div className="border-r border-slate-200 px-2 py-2">
                            <div className="text-xs font-semibold text-slate-500">
                              Référence
                            </div>

                            <div className="mt-1.5 break-words text-base font-bold text-[#0d2d5f]">
                              {series.reference?.trim() || "—"}
                            </div>
                          </div>

                          <div className="px-2 py-2">
                            <div className="text-xs font-semibold text-slate-500">
                              Nombre d’éprouvettes
                            </div>

                            <div className="mt-1.5 text-base font-bold text-[#0d2d5f] tabular-nums">
                              {sample.specimenCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mx-4 mb-4 overflow-hidden rounded-lg bg-white">
                        <div className="overflow-x-auto">
                          <table
                            className="w-full table-fixed border-collapse text-sm"
                            style={{
                              minWidth:
                                orderedResults.length > 4
                                  ? orderedResults.length * 80
                                  : undefined,
                            }}
                          >
                            <thead className="bg-[#0d2d5f] text-white">
                              <tr>
                                {orderedResults.map(
                                  (result) => (
                                    <th
                                      key={`ep-header-${sampleIndex}-${seriesIndex}-${result.specimenNumber}`}
                                      className="border border-white/20 px-2 py-2 text-center text-sm font-bold"
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
                                      className="border border-slate-200 bg-white px-2 py-2 text-center text-base font-semibold text-blue-800 tabular-nums"
                                    >
                                      {displayResult(result)}
                                    </td>
                                  ),
                                )}
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-blue-50 px-2 py-2 text-[#0d2d5f]">
                          <span className="text-base font-bold">
                            Moyenne
                          </span>

                          <span className="text-xl font-bold tabular-nums">
                            {formatCompressionNumber(average)}
                          </span>
                        </div>
                      </div>
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

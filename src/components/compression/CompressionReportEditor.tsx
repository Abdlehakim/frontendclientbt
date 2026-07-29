import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa6";
import {
  FiCalendar,
  FiFileText,
  FiLayers,
  FiMapPin,
  FiType,
  FiUser,
} from "react-icons/fi";
import CompressionSamplesTable from "@/components/compression/CompressionSamplesTable";
import ProjectModalShell from "@/components/ferraillage/ProjectModalShell";
import {
  compressionApi,
  isCompressionApiError,
  type CompressionProjectDTO,
  type CompressionReportDetailDTO,
  type CompressionReportInput,
  type CompressionSampleMutationInput,
  type CompressionSampleInput,
  type CompressionSeriesMutationInput,
} from "@/lib/compressionApi";
import {
  ferraillageApi,
  isApiError as isFerraillageApiError,
  type FerRapportDTO,
} from "@/lib/ferraillageApi";

export type CompressionReportEditorProps = {
  open: boolean;
  mode: "create" | "edit" | "view";
  reportId?: string | null;
  onClose: () => void;
  onSaved?: (
    item: CompressionReportDetailDTO,
  ) => void | Promise<void>;
};

type CompressionEditorForm = CompressionReportInput;

type TabKey =
  | "DETAILS_CHANTIER"
  | "ESSAI_COMPRESSION";

type CompressionEditorProject =
  CompressionProjectDTO & {
    acierType?: FerRapportDTO["acierType"];
    note?: FerRapportDTO["note"];
  };

const TABS: { key: TabKey; label: string }[] = [
  {
    key: "DETAILS_CHANTIER",
    label: "Détails de l’essai",
  },
  {
    key: "ESSAI_COMPRESSION",
    label: "Essai à la compression",
  },
];

const MODE_TITLES = {
  create: "Nouvel essai à la compression",
  edit: "Modifier l’essai à la compression",
  view: "Consulter l’essai à la compression",
} as const;

function todayDateInput(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateInput(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? "";
}

function formatDateOnly(
  value: string | null | undefined,
): string {
  const normalized = value?.slice(0, 10) ?? "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    return "—";
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function createInitialForm(): CompressionEditorForm {
  return {
    projectId: "",
    reportDate: todayDateInput(),
    title: "",
    companyName: "",
    samples: [],
  };
}

function mapReportToForm(
  report: CompressionReportDetailDTO,
): CompressionEditorForm {
  const samples: CompressionSampleInput[] = report.samples.map(
    (sample) => ({
      id: sample.id,
      sequenceNumber: sample.sequenceNumber,
      dosage: sample.dosage,
      cement: sample.cement,
      admixture: sample.admixture ?? "",
      designation: sample.designation,
      pourDate: toDateInput(sample.pourDate),
      specimenSendDate: toDateInput(sample.specimenSendDate),
      specimenCount: sample.specimenCount,
      sortOrder: sample.sortOrder,
      series: sample.series.map((series) => ({
        id: series.id,
        crushingDate: toDateInput(series.crushingDate),
        reference: series.reference ?? "",
        sortOrder: series.sortOrder,
        showInPlanning: series.showInPlanning,
        planningTime: series.planningTime,
        results: series.results.map((result) => ({
          id: result.id,
          specimenNumber: result.specimenNumber,
          value:
            typeof result.value === "number" &&
            Number.isFinite(result.value)
              ? result.value
              : null,
          status: result.status,
          note: result.note,
        })),
      })),
    }),
  );

  return {
    projectId: report.projectId,
    reportDate: toDateInput(report.reportDate),
    title: report.title ?? "",
    companyName: report.companyName ?? "",
    samples,
  };
}

function readableError(error: unknown): string {
  if (
    isCompressionApiError(error) ||
    isFerraillageApiError(error)
  ) {
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
}

type DetailItemProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
};

function DetailItem({
  icon,
  label,
  value,
  className = "",
  valueClassName = "",
}: DetailItemProps) {
  return (
    <div
      className={[
        "flex min-w-0 items-center gap-4",
        className,
      ].join(" ")}
    >
      <div
        className="
          flex h-14 w-14 shrink-0
          items-center justify-center
          rounded-full bg-emerald-100/70
          text-emerald-950
        "
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm text-slate-600">
          {label}
        </div>

        <div
          className={[
            "mt-1 break-words text-lg font-semibold text-slate-950",
            valueClassName,
          ].join(" ")}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function CompressionReportEditorPanel({
  mode,
  reportId,
  onClose,
  onSaved,
}: Omit<CompressionReportEditorProps, "open">) {
  const [projects, setProjects] = useState<FerRapportDTO[]>([]);
  const [loadedProject, setLoadedProject] =
    useState<CompressionProjectDTO | null>(null);
  const [form, setForm] = useState<CompressionEditorForm>(
    createInitialForm,
  );
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] =
    useState<TabKey>("DETAILS_CHANTIER");

  const readOnly = mode === "view";

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setProjects([]);
    setLoadedProject(null);
    setForm(createInitialForm());

    void (async () => {
      try {
        const projectsPromise = ferraillageApi.listProjects();
        const reportPromise =
          mode === "create"
            ? Promise.resolve(null)
            : compressionApi.getReport(reportId ?? "");
        const [projectsResponse, reportResponse] =
          await Promise.all([projectsPromise, reportPromise]);

        if (cancelled) return;
        setProjects(projectsResponse.items ?? []);

        if (reportResponse) {
          setForm(
            mapReportToForm(
              reportResponse.item,
            ),
          );
          setLoadedProject(reportResponse.item.project);
        }
      } catch (loadError: unknown) {
        if (cancelled) return;
        setError(readableError(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, reportId]);

  const selectedProject = useMemo<CompressionEditorProject | null>(
    () => {
      const project = projects.find(
        (item) => item.id === form.projectId,
      );
      if (project) {
        return {
          id: project.id,
          chantierName: project.chantierName,
          responsable: project.responsable,
          acierType: project.acierType,
          note: project.note,
        };
      }
      return loadedProject?.id === form.projectId
        ? loadedProject
        : null;
    },
    [form.projectId, loadedProject, projects],
  );

  const applySavedReport = async (
    item: CompressionReportDetailDTO,
  ) => {
    setForm(mapReportToForm(item));
    setLoadedProject(item.project);
    await onSaved?.(item);
  };

  const runMutation = async (
    operation: () => Promise<{
      item: CompressionReportDetailDTO;
    }>,
  ) => {
    if (readOnly || mutating) {
      return;
    }

    setMutating(true);
    setError("");

    try {
      const response = await operation();
      await applySavedReport(response.item);
    } catch (mutationError: unknown) {
      setError(readableError(mutationError));
      throw mutationError;
    } finally {
      setMutating(false);
    }
  };

  const createSample = async (
    payload: CompressionSampleMutationInput,
  ) => {
    await runMutation(() =>
      compressionApi.createSample(
        reportId ?? "",
        payload,
      ),
    );
  };

  const updateSample = async (
    sampleId: string,
    payload: CompressionSampleMutationInput,
  ) => {
    await runMutation(() =>
      compressionApi.updateSample(
        reportId ?? "",
        sampleId,
        payload,
      ),
    );
  };

  const deleteSample = async (
    sampleId: string,
  ) => {
    await runMutation(() =>
      compressionApi.deleteSample(
        reportId ?? "",
        sampleId,
      ),
    );
  };

  const createSeries = async (
    sampleId: string,
    payload: CompressionSeriesMutationInput,
  ) => {
    await runMutation(() =>
      compressionApi.createSeries(
        reportId ?? "",
        sampleId,
        payload,
      ),
    );
  };

  const updateSeries = async (
    sampleId: string,
    seriesId: string,
    payload: CompressionSeriesMutationInput,
  ) => {
    await runMutation(() =>
      compressionApi.updateSeries(
        reportId ?? "",
        sampleId,
        seriesId,
        payload,
      ),
    );
  };

  const deleteSeries = async (
    sampleId: string,
    seriesId: string,
  ) => {
    await runMutation(() =>
      compressionApi.deleteSeries(
        reportId ?? "",
        sampleId,
        seriesId,
      ),
    );
  };

  const safeClose = () => {
    if (!mutating) {
      onClose();
    }
  };

  const footer = readOnly ? (
    <div className="flex w-full justify-start">
      <button
        type="button"
        className="stepper__nav"
        onClick={safeClose}
      >
        Fermer
      </button>
    </div>
  ) : (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        type="button"
        className="stepper__nav"
        onClick={safeClose}
        disabled={mutating}
      >
        Fermer
      </button>

      {mutating ? (
        <span className="inline-flex items-center gap-2 text-sm text-slate-600">
          <FaSpinner className="animate-spin" />
          Enregistrement...
        </span>
      ) : null}
    </div>
  );

  return (
    <ProjectModalShell
      title={MODE_TITLES[mode]}
      subtitle={
        selectedProject?.chantierName ||
        form.title?.trim() ||
        "—"
      }
      onClose={safeClose}
      panelClassName="w-full max-w-[99%] h-[98%] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
      bodyClassName="p-4 flex-1 overflow-auto bg-green-50"
      footer={footer}
    >
      {loading ? (
        <div className="no-print flex min-h-80 items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-(--primary)" />
        </div>
      ) : (
        <>
          <div className="no-print space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-center gap-2 border-b-transparent">
              {TABS.map((item) => {
                const active = item.key === tab;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={
                      active
                        ? "px-4 py-2 rounded bg-(--primary) text-white font-semibold"
                        : "px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {tab === "DETAILS_CHANTIER" ? (
              <div className="px-4 py-6 sm:px-8 lg:px-12">
                <div
                  className="
                    grid grid-cols-1
                    gap-x-12 gap-y-8
                    md:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  <DetailItem
                    icon={
                      <FiMapPin
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Chantier"
                    value={
                      selectedProject?.chantierName?.trim() ||
                      "—"
                    }
                  />

                  <DetailItem
                    icon={
                      <FiUser
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Responsable"
                    value={
                      selectedProject?.responsable?.trim() ||
                      "—"
                    }
                  />

                  <DetailItem
                    icon={
                      <FiLayers
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Type d’acier"
                    value={
                      selectedProject?.acierType ??
                      "—"
                    }
                  />

                  <DetailItem
                    icon={
                      <FiFileText
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Note"
                    value={
                      selectedProject?.note?.trim() ||
                      "—"
                    }
                    className="md:col-span-2 xl:col-span-3"
                    valueClassName="whitespace-pre-wrap"
                  />
                </div>

                <div className="my-8 border-t border-slate-200" />

                <div
                  className="
                    grid grid-cols-1
                    gap-x-12 gap-y-8
                    md:grid-cols-2
                  "
                >
                  <DetailItem
                    icon={
                      <FiCalendar
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Date du rapport"
                    value={formatDateOnly(form.reportDate)}
                  />

                  <DetailItem
                    icon={
                      <FiType
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Titre"
                    value={
                      form.title?.trim() ||
                      "—"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">

                <CompressionSamplesTable
                  readOnly={readOnly}
                  busy={mutating}
                  samples={form.samples}
                  onCreateSample={createSample}
                  onUpdateSample={updateSample}
                  onDeleteSample={deleteSample}
                  onCreateSeries={createSeries}
                  onUpdateSeries={updateSeries}
                  onDeleteSeries={deleteSeries}
                />
              </div>
            )}
          </div>

        </>
      )}
    </ProjectModalShell>
  );
}

export default function CompressionReportEditor({
  open,
  mode,
  reportId,
  onClose,
  onSaved,
}: CompressionReportEditorProps) {
  if (!open) return null;

  return createPortal(
    <CompressionReportEditorPanel
      key={`${mode}-${reportId ?? "new"}`}
      mode={mode}
      reportId={reportId}
      onClose={onClose}
      onSaved={onSaved}
    />,
    document.body,
  );
}

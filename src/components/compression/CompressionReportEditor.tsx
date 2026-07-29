import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa6";
import CompressionSamplesTable from "@/components/compression/CompressionSamplesTable";
import ProjectModalShell from "@/components/ferraillage/ProjectModalShell";
import {
  compressionApi,
  isCompressionApiError,
  type CompressionProjectDTO,
  type CompressionReportDetailDTO,
  type CompressionReportInput,
  type CompressionSampleInput,
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
        crushingDate: toDateInput(series.crushingDate),
        reference: series.reference ?? "",
        sortOrder: series.sortOrder,
        results: series.results.map((result) => ({
          specimenNumber: result.specimenNumber,
          value:
            typeof result.value === "number" &&
            Number.isFinite(result.value)
              ? result.value
              : null,
          status: "VALID",
          note: null,
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

function validateForm(form: CompressionEditorForm): string {
  if (!form.projectId.trim()) {
    return "Sélectionnez un projet.";
  }
  if (!form.reportDate) {
    return "La date du rapport est obligatoire.";
  }
  if (form.samples.length === 0) {
    return "Ajoutez au moins un prélèvement.";
  }

  for (const sample of form.samples) {
    const prefix = `Prélèvement ${sample.sequenceNumber}`;
    if (!sample.dosage.trim()) {
      return `${prefix} : le dosage est obligatoire.`;
    }
    if (!sample.cement.trim()) {
      return `${prefix} : le ciment est obligatoire.`;
    }
    if (!sample.designation.trim()) {
      return `${prefix} : la désignation est obligatoire.`;
    }
    if (!sample.pourDate) {
      return `${prefix} : la date de coulage est obligatoire.`;
    }
    if (
      !Number.isInteger(sample.specimenCount) ||
      sample.specimenCount <= 0
    ) {
      return `${prefix} : le nombre d’éprouvettes doit être supérieur à zéro.`;
    }
    if (sample.series.length === 0) {
      return `${prefix} : ajoutez au moins une série.`;
    }

    for (const series of sample.series) {
      if (!series.crushingDate) {
        return `${prefix} : la date d’écrasement est obligatoire.`;
      }
      if (series.results.length === 0) {
        return `${prefix} : ajoutez au moins un résultat.`;
      }

      for (const result of series.results) {
        if (
          (typeof result.value !== "number" ||
            !Number.isFinite(result.value) ||
            result.value < 0)
        ) {
          return `${prefix}, EP${result.specimenNumber} : saisissez une valeur numérique valide.`;
        }
      }
    }
  }

  return "";
}

function buildPayload(
  form: CompressionEditorForm,
): CompressionReportInput {
  return {
    projectId: form.projectId.trim(),
    reportDate: form.reportDate,
    title: form.title?.trim() || null,
    companyName: form.companyName?.trim() || null,
    samples: form.samples.map((sample) => ({
      sequenceNumber: sample.sequenceNumber,
      dosage: sample.dosage.trim(),
      cement: sample.cement.trim(),
      admixture: sample.admixture?.trim() || null,
      designation: sample.designation.trim(),
      pourDate: sample.pourDate,
      specimenSendDate: sample.specimenSendDate || null,
      specimenCount: sample.specimenCount,
      sortOrder: sample.sortOrder,
      series: sample.series.map((series) => ({
        crushingDate: series.crushingDate,
        reference: series.reference?.trim() || null,
        sortOrder: series.sortOrder,
        results: series.results.map((result, index) => ({
          specimenNumber: index + 1,
          value: result.value ?? null,
          status: "VALID",
          note: null,
        })),
      })),
    })),
  };
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
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (readOnly || saving) return;
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = buildPayload(form);
      const response =
        mode === "create"
          ? await compressionApi.createReport(payload)
          : await compressionApi.updateReport(
              reportId ?? "",
              payload,
            );
      await onSaved?.(response.item);
      onClose();
    } catch (saveError: unknown) {
      setError(readableError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const safeClose = () => {
    if (!saving) onClose();
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
        disabled={saving}
      >
        Annuler
      </button>
      <button
        type="button"
        className="btn-fit-white-outline inline-flex items-center gap-2"
        onClick={() => void handleSave()}
        disabled={saving || loading}
      >
        {saving ? (
          <FaSpinner className="animate-spin" />
        ) : null}
        Enregistrer
      </button>
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

            <div className="flex flex-wrap justify-center gap-2 border-b-transparent p-3">
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
              <div className="space-y-4">
                <div className="rounded bg-white p-4 shadow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-gray-500">
                        Chantier
                      </div>
                      <div className="font-semibold text-gray-900">
                        {selectedProject?.chantierName?.trim() || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Responsable
                      </div>
                      <div className="font-semibold text-gray-900">
                        {selectedProject?.responsable?.trim() || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Type d&apos;acier
                      </div>
                      <div className="font-semibold text-gray-900">
                        {selectedProject?.acierType ?? "—"}
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="text-xs text-gray-500">
                        Note
                      </div>
                      <div className="whitespace-pre-wrap text-gray-900">
                        {selectedProject?.note?.trim() || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Date du rapport
                    <input
                      type="date"
                      value={form.reportDate}
                      disabled={readOnly || saving}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          reportDate: event.target.value,
                        }))
                      }
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Titre
                    <input
                      type="text"
                      value={form.title ?? ""}
                      disabled={readOnly || saving}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:bg-slate-100"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">

                <CompressionSamplesTable
                  readOnly={readOnly || saving}
                  samples={form.samples}
                  onSamplesChange={(samples) =>
                    setForm((current) => ({
                      ...current,
                      samples,
                    }))
                  }
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

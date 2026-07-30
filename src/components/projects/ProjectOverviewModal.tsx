import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FaRegEye } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import {
  FiCalendar,
  FiEdit3,
  FiFileText,
  FiLayers,
  FiMapPin,
  FiUser,
} from "react-icons/fi";
import CompressionSamplesTable from "@/components/compression/CompressionSamplesTable";
import ProjectModalShell from "@/components/ferraillage/ProjectModalShell";
import {
  buildTotalFerraillageData,
} from "@/components/ferraillage/shared/totalFerraillageData";
import {
  compressionApi,
  isCompressionApiError,
  type CompressionReportDetailDTO,
  type CompressionReportSummaryDTO,
  type CompressionSampleInput,
} from "@/lib/compressionApi";
import {
  ferraillageApi,
  isApiError as isFerApiError,
  type FerProjectDetailDTO,
  type FerraillageReportDTO,
} from "@/lib/ferraillageApi";
import CalculeTotalFerraillage from "@/pages/tabs/CalculeTotalFerraillage";
import RapportAttachementTab from "@/pages/tabs/RapportAttachementTab";

type ProjectOverviewTabKey =
  | "PROJECT_INFO"
  | "TOTAL_FERRAILLAGE"
  | "ATTACHMENT"
  | "QUANTITY"
  | "ADVANCES"
  | "FINAL"
  | "COMPRESSION";

type ProjectOverviewTab = {
  key: ProjectOverviewTabKey;
  label: string;
};

const PROJECT_OVERVIEW_TABS: ProjectOverviewTab[] = [
  {
    key: "PROJECT_INFO",
    label: "Informations du projet",
  },
  {
    key: "TOTAL_FERRAILLAGE",
    label: "Calcule Totale De Ferraillage",
  },
  {
    key: "ATTACHMENT",
    label: "Rapport d'attachement",
  },
  {
    key: "QUANTITY",
    label: "Calcule de Quantite",
  },
  {
    key: "ADVANCES",
    label: "Avances de paiment",
  },
  {
    key: "FINAL",
    label: "Verification et calcule Finale",
  },
  {
    key: "COMPRESSION",
    label: "Essai à la compression",
  },
];

type ProjectOverviewModalProps = {
  open: boolean;
  projectId: string | null;
  projectName: string;
  onClose: () => void;
  onViewCompressionReport: (
    reportId: string,
  ) => void;
};

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

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR");
}

function toCompressionDateInput(
  value: string | null | undefined,
): string {
  return value?.slice(0, 10) ?? "";
}

function mapCompressionReportSamples(
  report: CompressionReportDetailDTO,
): CompressionSampleInput[] {
  return report.samples.map((sample) => ({
    id: sample.id,
    sequenceNumber: sample.sequenceNumber,
    dosage: sample.dosage,
    cement: sample.cement,
    admixture: sample.admixture ?? "",
    designation: sample.designation,
    pourDate: toCompressionDateInput(
      sample.pourDate,
    ),
    specimenSendDate: toCompressionDateInput(
      sample.specimenSendDate,
    ),
    specimenCount: sample.specimenCount,
    sortOrder: sample.sortOrder,
    series: sample.series.map((series) => ({
      id: series.id,
      crushingDate: toCompressionDateInput(
        series.crushingDate,
      ),
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
  }));
}

async function ignoreReadOnlyCompressionMutation(): Promise<void> {
  return;
}

function readableError(error: unknown): string {
  if (
    isFerApiError(error) ||
    isCompressionApiError(error)
  ) {
    return error.message;
  }

  return "Impossible de charger les détails du projet.";
}

export default function ProjectOverviewModal({
  open,
  projectId,
  projectName,
  onClose,
  onViewCompressionReport,
}: ProjectOverviewModalProps) {
  const [project, setProject] =
    useState<FerProjectDetailDTO | null>(null);
  const [ferraillageReports, setFerraillageReports] =
    useState<FerraillageReportDTO[]>([]);
  const [compressionReports, setCompressionReports] =
    useState<CompressionReportSummaryDTO[]>([]);
  const [
    compressionReportDetails,
    setCompressionReportDetails,
  ] = useState<CompressionReportDetailDTO[]>([]);
  const [
    compressionDetailsLoading,
    setCompressionDetailsLoading,
  ] = useState(false);
  const [
    compressionDetailsError,
    setCompressionDetailsError,
  ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] =
    useState<ProjectOverviewTabKey>(
      "PROJECT_INFO",
    );

  const totalFerraillageData = useMemo(
    () =>
      project
        ? buildTotalFerraillageData(project)
        : null,
    [project],
  );

  const hasTotalFerraillage =
    totalFerraillageData?.niveaux.some(
      (niveau) => niveau.rows.length > 0,
    ) ?? false;

  const hasAttachment =
    (project?.etats.length ?? 0) > 0 ||
    (project?.restants.length ?? 0) > 0;

  const visibleTabs = useMemo<
    ProjectOverviewTab[]
  >(
    () =>
      PROJECT_OVERVIEW_TABS.filter(
        (tab) => {
          switch (tab.key) {
            case "PROJECT_INFO":
              return Boolean(project);
            case "TOTAL_FERRAILLAGE":
              return hasTotalFerraillage;
            case "ATTACHMENT":
              return hasAttachment;
            case "COMPRESSION":
              return compressionReports.length > 0;
            case "QUANTITY":
            case "ADVANCES":
            case "FINAL":
              return false;
          }
        },
      ),
    [
      compressionReports.length,
      hasAttachment,
      hasTotalFerraillage,
      project,
    ],
  );

  useEffect(() => {
    if (
      !visibleTabs.some(
        (tab) => tab.key === activeTab,
      )
    ) {
      setActiveTab("PROJECT_INFO");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (!open || !projectId) {
      setProject(null);
      setFerraillageReports([]);
      setCompressionReports([]);
      setCompressionReportDetails([]);
      setCompressionDetailsLoading(false);
      setCompressionDetailsError("");
      setLoading(false);
      setError("");
      setActiveTab("PROJECT_INFO");
      return;
    }

    let active = true;

    setProject(null);
    setFerraillageReports([]);
    setCompressionReports([]);
    setCompressionReportDetails([]);
    setCompressionDetailsLoading(false);
    setCompressionDetailsError("");
    setLoading(true);
    setError("");
    setActiveTab("PROJECT_INFO");

    void (async () => {
      try {
        const [
          projectResponse,
          ferraillageResponse,
          compressionResponse,
        ] = await Promise.all([
          ferraillageApi.getProject(projectId),
          ferraillageApi.listRapports(),
          compressionApi.listReports(),
        ]);

        if (!active) return;

        setProject(projectResponse.item);
        setFerraillageReports(
          ferraillageResponse.items.filter(
            (report) =>
              report.projectId === projectId,
          ),
        );
        setCompressionReports(
          compressionResponse.items.filter(
            (report) =>
              report.projectId === projectId,
          ),
        );
      } catch (loadError: unknown) {
        if (!active) return;

        setProject(null);
        setFerraillageReports([]);
        setCompressionReports([]);
        setError(readableError(loadError));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [open, projectId]);

  useEffect(() => {
    if (
      !open ||
      !projectId ||
      activeTab !== "COMPRESSION"
    ) {
      return;
    }

    if (compressionReports.length === 0) {
      setCompressionReportDetails([]);
      setCompressionDetailsLoading(false);
      setCompressionDetailsError("");
      return;
    }

    let active = true;

    setCompressionDetailsLoading(true);
    setCompressionDetailsError("");

    void Promise.all(
      compressionReports.map((report) =>
        compressionApi.getReport(report.id),
      ),
    )
      .then((responses) => {
        if (!active) return;

        setCompressionReportDetails(
          responses.map((response) => response.item),
        );
        setCompressionDetailsError("");
      })
      .catch((loadError: unknown) => {
        if (!active) return;

        setCompressionReportDetails([]);
        setCompressionDetailsError(
          isCompressionApiError(loadError)
            ? loadError.message
            : "Impossible de charger les essais à la compression.",
        );
      })
      .finally(() => {
        if (active) {
          setCompressionDetailsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    activeTab,
    compressionReports,
    open,
    projectId,
  ]);

  if (!open) return null;

  return createPortal(
    <ProjectModalShell
      title="Détails du projet"
      subtitle={
        project?.chantierName ||
        projectName ||
        "—"
      }
      onClose={onClose}
    >
      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-(--primary)" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-white p-6 text-red-600 shadow-sm">
          {error}
        </div>
      ) : project ? (
        <div className="space-y-4">
          <div
            role="tablist"
            aria-label="Sections du projet"
            className="flex flex-wrap justify-center gap-2 border-b-transparent"
          >
            {visibleTabs.map((tab) => {
              const selected =
                activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`project-overview-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`project-overview-panel-${tab.key}`}
                  onClick={() =>
                    setActiveTab(tab.key)
                  }
                  className={[
                    "rounded border px-4 py-2",
                    "font-medium transition-colors",
                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-emerald-400",
                    "focus-visible:ring-offset-2",
                    selected
                      ? [
                          "border-[#0d2d5f]",
                          "bg-(--primary)",
                          "font-semibold text-white",
                        ].join(" ")
                      : [
                          "border-gray-200",
                          "bg-white text-slate-700",
                          "hover:bg-gray-50",
                        ].join(" "),
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`project-overview-panel-${activeTab}`}
            aria-labelledby={`project-overview-tab-${activeTab}`}
            className="min-h-65"
          >
            {activeTab === "PROJECT_INFO" ? (
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
                      project.chantierName ||
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
                      project.responsable ||
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
                      project.acierType || "—"
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
                    value={project.note || "—"}
                    className="md:col-span-2 xl:col-span-3"
                    valueClassName="whitespace-pre-wrap"
                  />

                  <DetailItem
                    icon={
                      <FiCalendar
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Date de création"
                    value={formatDate(
                      project.createdAt,
                    )}
                  />

                  <DetailItem
                    icon={
                      <FiEdit3
                        size={26}
                        strokeWidth={1.8}
                      />
                    }
                    label="Date de mise à jour"
                    value={formatDate(
                      project.updatedAt,
                    )}
                  />
                </div>

                {ferraillageReports.length > 0 ? (
                  <>
                    <div className="my-8 border-t border-slate-200" />

                    <h2 className="mb-4 text-lg font-bold text-[#0d2d5f]">
                      Rapports de ferraillage
                    </h2>

                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                      <table className="w-full table-fixed">
                        <thead className="bg-(--primary) text-white">
                          <tr>
                            <th className="py-2 text-center text-sm font-medium">
                              Titre
                            </th>
                            <th className="py-2 text-center text-sm font-medium">
                              Créé par
                            </th>
                            <th className="w-32 py-2 text-center text-sm font-medium">
                              Créé le
                            </th>
                            <th className="w-32 py-2 text-center text-sm font-medium">
                              MàJ le
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ferraillageReports.map(
                            (report) => (
                              <tr key={report.id}>
                                <td className="truncate px-2 py-2 text-center">
                                  {report.name ||
                                    "—"}
                                </td>
                                <td className="truncate px-2 py-2 text-center">
                                  {report.createdByName ||
                                    "—"}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {formatDate(
                                    report.createdAt,
                                  )}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {formatDate(
                                    report.updatedAt,
                                  )}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {activeTab ===
              "TOTAL_FERRAILLAGE" &&
            totalFerraillageData ? (
              <CalculeTotalFerraillage
                data={totalFerraillageData}
              />
            ) : null}

            {activeTab === "ATTACHMENT" ? (
              <RapportAttachementTab
                rapportId={project.id}
              />
            ) : null}

            {activeTab === "COMPRESSION" ? (
              compressionDetailsLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <FaSpinner className="animate-spin text-4xl text-(--primary)" />
                </div>
              ) : compressionDetailsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {compressionDetailsError}
                </div>
              ) : compressionReportDetails.length ===
                0 ? (
                <div className="rounded-lg bg-white px-4 py-8 text-center text-sm text-slate-500">
                  Aucun essai à la compression trouvé.
                </div>
              ) : (
                <div className="space-y-8">
                  {compressionReportDetails.map(
                    (report) => (
                      <section
                        key={report.id}
                        className="space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-[#0d2d5f]">
                              {report.title?.trim() ||
                                "Essai à la compression"}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                              <span>
                                {report.createdByName ||
                                  "—"}
                              </span>
                              <span aria-hidden="true">
                                •
                              </span>
                              <span>
                                {formatDate(
                                  report.reportDate,
                                )}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="ButtonSquare"
                            title="Voir"
                            aria-label={`Voir ${
                              report.title ??
                              "l’essai à la compression"
                            }`}
                            onClick={() =>
                              onViewCompressionReport(
                                report.id,
                              )
                            }
                          >
                            <FaRegEye
                              aria-hidden="true"
                              size={14}
                            />
                          </button>
                        </div>

                        <CompressionSamplesTable
                          readOnly
                          busy={false}
                          samples={mapCompressionReportSamples(
                            report,
                          )}
                          onCreateSample={
                            ignoreReadOnlyCompressionMutation
                          }
                          onUpdateSample={
                            ignoreReadOnlyCompressionMutation
                          }
                          onDeleteSample={
                            ignoreReadOnlyCompressionMutation
                          }
                          onCreateSeries={
                            ignoreReadOnlyCompressionMutation
                          }
                          onUpdateSeries={
                            ignoreReadOnlyCompressionMutation
                          }
                          onDeleteSeries={
                            ignoreReadOnlyCompressionMutation
                          }
                        />
                      </section>
                    ),
                  )}
                </div>
              )
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 text-gray-700 shadow-sm">
          Projet introuvable.
        </div>
      )}
    </ProjectModalShell>,
    document.body,
  );
}

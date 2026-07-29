import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaRegEye } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import ProjectDetailViewContent from "@/components/ferraillage/ProjectDetailViewContent";
import ProjectModalShell from "@/components/ferraillage/ProjectModalShell";
import {
  compressionApi,
  isCompressionApiError,
  type CompressionReportSummaryDTO,
} from "@/lib/compressionApi";
import {
  ferraillageApi,
  isApiError as isFerApiError,
  type FerProjectDetailDTO,
  type FerraillageReportDTO,
} from "@/lib/ferraillageApi";

type ProjectOverviewModalProps = {
  open: boolean;
  projectId: string | null;
  projectName: string;
  onClose: () => void;
  onViewCompressionReport: (
    reportId: string,
  ) => void;
};

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR");
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !projectId) {
      setProject(null);
      setFerraillageReports([]);
      setCompressionReports([]);
      setLoading(false);
      setError("");
      return;
    }

    let active = true;

    setProject(null);
    setFerraillageReports([]);
    setCompressionReports([]);
    setLoading(true);
    setError("");

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
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#0d2d5f]">
              Informations du projet
            </h2>

            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-600">
                  Chantier
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {project.chantierName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">
                  Responsable
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {project.responsable || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">
                  Type d’acier
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {project.acierType || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">
                  Note
                </dt>
                <dd className="mt-1 whitespace-pre-wrap font-semibold text-slate-950">
                  {project.note || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">
                  Date de création
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {formatDate(project.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">
                  Date de mise à jour
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {formatDate(project.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0d2d5f]">
              Ferraillage
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
                  {ferraillageReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-gray-600"
                      >
                        Aucun rapport de ferraillage pour ce projet.
                      </td>
                    </tr>
                  ) : (
                    ferraillageReports.map((report) => (
                      <tr key={report.id}>
                        <td className="truncate px-2 py-2 text-center">
                          {report.name || "—"}
                        </td>
                        <td className="truncate px-2 py-2 text-center">
                          {report.createdByName || "—"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {formatDate(report.updatedAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <ProjectDetailViewContent
                project={project}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0d2d5f]">
              Essais à la compression
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
                      Prélèvements
                    </th>
                    <th className="w-32 py-2 text-center text-sm font-medium">
                      Créé le
                    </th>
                    <th className="w-32 py-2 text-center text-sm font-medium">
                      MàJ le
                    </th>
                    <th className="w-24 py-2 text-center text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {compressionReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-gray-600"
                      >
                        Aucun essai à la compression pour ce projet.
                      </td>
                    </tr>
                  ) : (
                    compressionReports.map((report) => (
                      <tr key={report.id}>
                        <td className="truncate px-2 py-2 text-center">
                          {report.title ?? "—"}
                        </td>
                        <td className="truncate px-2 py-2 text-center">
                          {report.createdByName || "—"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {report.sampleCount}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {formatDate(report.updatedAt)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              className="ButtonSquare"
                              title="Voir"
                              onClick={() =>
                                onViewCompressionReport(
                                  report.id,
                                )
                              }
                            >
                              <FaRegEye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
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

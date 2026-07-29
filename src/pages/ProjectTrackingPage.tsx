import { useEffect, useMemo, useState } from "react";
import { FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FiEdit3 } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa6";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import CompressionReportEditor from "@/components/compression/CompressionReportEditor";
import CreateCompressionReportModal from "@/components/compression/CreateCompressionReportModal";
import TablePagination from "@/components/tablePagination";
import { useProjectSelection } from "@/contexts/ProjectSelectionContext";
import {
  compressionApi,
  isCompressionApiError,
  type CompressionReportDetailDTO,
  type CompressionReportSummaryDTO,
} from "@/lib/compressionApi";

const PAGE_SIZE = 12;

type EditorMode = "create" | "edit" | "view";

type DeleteTarget = {
  id: string;
  name: string;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

export default function ProjectTrackingPage() {
  const { selectedProjectId } = useProjectSelection();
  const [reports, setReports] =
    useState<CompressionReportSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] =
    useState<EditorMode>("create");
  const [selectedReportId, setSelectedReportId] =
    useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await compressionApi.listReports();
      setReports(response.items);
    } catch (loadError: unknown) {
      setError(
        isCompressionApiError(loadError)
          ? loadError.message
          : "Impossible de charger les essais à la compression.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      if (
        selectedProjectId &&
        report.projectId !== selectedProjectId
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        report.project.chantierName,
        report.project.responsable,
        report.title,
        report.companyName,
        report.createdByName,
      ].some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [reports, searchTerm, selectedProjectId]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / PAGE_SIZE),
  );

  const displayedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredReports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openEditor = (
    mode: EditorMode,
    reportId: string | null,
  ) => {
    setEditorMode(mode);
    setSelectedReportId(reportId);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setSelectedReportId(null);
  };

  const handleReportCreated = async (
    item: CompressionReportDetailDTO,
  ) => {
    setCreateOpen(false);
    setCurrentPage(1);

    await loadReports();

    setSelectedReportId(item.id);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handleSaved = async (
    _item: CompressionReportDetailDTO,
  ) => {
    if (editorMode === "create") {
      setCurrentPage(1);
    }
    await loadReports();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setError("");
    try {
      await compressionApi.deleteReport(deleteTarget.id);
      setReports((current) =>
        current.filter((report) => report.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (deleteError: unknown) {
      setError(
        isCompressionApiError(deleteError)
          ? deleteError.message
          : "Impossible de supprimer le rapport.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex h-12 items-start justify-between gap-4">
        <h1 className="text-3xl font-bold uppercase">
          Essai à la compression
        </h1>

        <button
          type="button"
          className="btn-fit-white-outline"
          onClick={() => setCreateOpen(true)}
        >
          Nouvel essai
        </button>
      </div>

      <div className="flex min-h-12 items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="compression-report-search" className="font-medium">
            Recherche:
          </label>
          <input
            id="compression-report-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Projet / chantier / titre / entreprise"
            className="min-w-72 rounded border border-gray-300 bg-white px-2 py-1"
          />
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : null}

      <div className="relative flex-1 overflow-auto">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-5 bg-(--primary) text-white">
            <tr>
              <th className="py-2 text-center text-sm font-medium">
                Titre
              </th>
              <th className="py-2 text-center text-sm font-medium">
                Chantier
              </th>
              <th className="py-2 text-center text-sm font-medium">
                Créé par
              </th>
              <th className="w-28 py-2 text-center text-sm font-medium">
                Créé le
              </th>
              <th className="w-28 py-2 text-center text-sm font-medium">
                MàJ le
              </th>
              <th className="w-36 py-2 text-center text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>

          {displayedReports.length === 0 && !loading ? (
            <tbody>
              <tr>
                <td
                  colSpan={6}
                  className="bg-white py-8 text-center text-gray-600"
                >
                  Aucun essai à la compression trouvé.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-gray-200 [&>tr]:h-14">
              {displayedReports.map((report, index) => (
                <tr
                  key={report.id}
                  className={index % 2 ? "bg-gray-100" : "bg-white"}
                >
                  <td className="truncate px-2 py-2 text-center">
                    {report.title ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="truncate font-semibold">
                      {report.project.chantierName}
                    </div>
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
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="ButtonSquare"
                        title="Modifier"
                        onClick={() =>
                          openEditor("edit", report.id)
                        }
                      >
                        <FiEdit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="ButtonSquare"
                        title="Voir"
                        onClick={() =>
                          openEditor("view", report.id)
                        }
                      >
                        <FaRegEye size={14} />
                      </button>
                      <button
                        type="button"
                        className="ButtonSquareDelete"
                        title="Supprimer"
                        onClick={() =>
                          setDeleteTarget({
                            id: report.id,
                            name:
                              report.title ||
                              report.project.chantierName,
                          })
                        }
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75">
            <FaSpinner className="animate-spin text-3xl" />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex justify-center">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <CompressionReportEditor
        open={editorOpen}
        mode={editorMode}
        reportId={selectedReportId}
        onClose={closeEditor}
        onSaved={handleSaved}
      />

      <CreateCompressionReportModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleReportCreated}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.name ?? ""}
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

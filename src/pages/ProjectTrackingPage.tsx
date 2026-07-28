import { useEffect, useMemo, useState } from "react";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import CompressionReportEditor from "@/components/compression/CompressionReportEditor";
import CreateCompressionReportModal from "@/components/compression/CreateCompressionReportModal";
import TablePagination from "@/components/tablePagination";
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
    if (!query) return reports;

    return reports.filter((report) =>
      [
        report.project.chantierName,
        report.project.responsable,
        report.title,
        report.companyName,
        report.createdByName,
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [reports, searchTerm]);

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

  const handleDraftCreated = async (
    _item: CompressionReportDetailDTO,
  ) => {
    setCurrentPage(1);
    setCreateOpen(false);
    await loadReports();
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
      <div className="flex h-16 items-start justify-between gap-4">
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

      <div className="flex min-h-17.5 items-end justify-between gap-6">
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
              <th className="w-28 py-2 text-center text-sm font-medium">
                Date
              </th>
              <th className="py-2 text-center text-sm font-medium">
                Projet / Chantier
              </th>
              <th className="py-2 text-center text-sm font-medium">
                Titre
              </th>
              <th className="w-28 py-2 text-center text-sm font-medium">
                Prélèvements
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
                  <td className="px-2 py-2 text-center">
                    {formatDate(report.reportDate)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="truncate font-semibold">
                      {report.project.chantierName}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {report.project.responsable ?? "—"}
                    </div>
                  </td>
                  <td className="truncate px-2 py-2 text-center">
                    {report.title ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {report.sampleCount}
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
                        <FaRegEdit size={14} />
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
        onCreated={handleDraftCreated}
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

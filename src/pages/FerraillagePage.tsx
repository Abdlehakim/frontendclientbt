import { useEffect, useMemo, useRef, useState } from "react";
import { FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FiEdit3 } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa6";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import CreateRapportModal from "@/components/ferraillage/CreateRapportModal";
import EditRapportWizard from "@/components/ferraillage/EditProjectData";
import ViewProjectData from "@/components/ferraillage/ViewProjectData";
import TablePagination from "@/components/tablePagination";
import { useProjectSelection } from "@/contexts/ProjectSelectionContext";
import {
  ferraillageApi,
  type FerRapportDTO,
  type FerraillageReportDTO,
  isApiError as isFerApiError,
} from "@/lib/ferraillageApi";

const PAGE_SIZE = 12;

type DeleteTarget = {
  id: string;
  name: string;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default function FerraillagePage() {
  const { selectedProjectId } = useProjectSelection();
  const [items, setItems] = useState<FerraillageReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [err, setErr] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<FerRapportDTO | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewProjectId, setViewProjectId] = useState<string | null>(
    null,
  );
  const [viewName, setViewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadRapports() {
    setLoading(true);
    setErr("");

    try {
      const response = await ferraillageApi.listRapports();
      setItems(response.items ?? []);
    } catch (error: unknown) {
      setErr(
        isFerApiError(error)
          ? error.message
          : "Impossible de charger les rapports de ferraillage.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (cancelled) return;
      await loadRapports();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return items.filter((report) => {
      if (
        selectedProjectId &&
        report.projectId !== selectedProjectId
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      const project =
        report &&
        typeof report === "object" &&
        report.project &&
        typeof report.project === "object"
          ? report.project
          : null;

      const name =
        typeof report?.name === "string"
          ? report.name.toLowerCase()
          : "";
      const chantierName =
        typeof project?.chantierName === "string"
          ? project.chantierName.toLowerCase()
          : "";
      const responsable =
        typeof project?.responsable === "string"
          ? project.responsable.toLowerCase()
          : "";
      const createdByName =
        typeof report?.createdByName === "string"
          ? report.createdByName.toLowerCase()
          : "";

      return (
        name.includes(q) ||
        chantierName.includes(q) ||
        responsable.includes(q) ||
        createdByName.includes(q)
      );
    });
  }, [items, searchTerm, selectedProjectId]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );

  const displayed = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(
      () => setCurrentPage(1),
      150,
    );
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId]);

  function onEdit(report: FerraillageReportDTO) {
    if (!report.project?.id) {
      setErr(
        "Les données du projet lié sont indisponibles.",
      );
      return;
    }

    setEditItem(report.project);
    setEditOpen(true);
  }

  function onView(report: FerraillageReportDTO) {
    const projectId = report.projectId?.trim();

    if (!projectId) {
      setErr(
        "Le projet lié à ce rapport de ferraillage est introuvable.",
      );
      return;
    }

    setViewProjectId(projectId);
    setViewName(
      report.name?.trim() || "Rapport de ferraillage",
    );
    setViewOpen(true);
  }

  async function handleReportCreated(
    item: FerraillageReportDTO,
  ) {
    setCurrentPage(1);
    setCreateOpen(false);

    try {
      await loadRapports();
    } catch {
      setItems((current) => [
        item,
        ...current.filter((entry) => entry.id !== item.id),
      ]);
    }
  }

  function handleProjectUpdated(updatedProject: {
    id: string;
    chantierName: string;
    responsable: string | null;
    acierType?: "F400" | "F500" | null;
    note?: string | null;
    updatedAt: string;
  }) {
    setItems((current) =>
      current.map((report) =>
        report.projectId !== updatedProject.id
          ? report
          : {
              ...report,
              project: {
                ...report.project,
                chantierName: updatedProject.chantierName,
                responsable: updatedProject.responsable,
                acierType: updatedProject.acierType ?? null,
                note: updatedProject.note ?? null,
                updatedAt: updatedProject.updatedAt,
              },
            },
      ),
    );

    setEditItem((current) =>
      current && current.id === updatedProject.id
        ? {
            ...current,
            chantierName: updatedProject.chantierName,
            responsable: updatedProject.responsable,
            acierType: updatedProject.acierType ?? null,
            note: updatedProject.note ?? null,
            updatedAt: updatedProject.updatedAt,
          }
        : current,
    );
  }

  function onDeleteClick(report: FerraillageReportDTO) {
    setDeleteTarget({
      id: report.id,
      name: report.name,
    });
  }

  function closeDeleteModal() {
    if (deleteLoading) return;
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setErr("");
    setDeleteLoading(true);
    try {
      await ferraillageApi.deleteRapport(deleteTarget.id);
      setItems((current) =>
        current.filter((report) => report.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error: unknown) {
      setErr(
        isFerApiError(error)
          ? error.message
          : "Delete failed",
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex h-12  justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Ferraillage</h1>

        <div className="flex items-center gap-2">
          <button
            className="btn-fit-white-outline"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            Créer un rapport
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-6 h-12">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche :</label>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Titre du rapport / chantier / créateur"
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          />
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-(--primary) text-white">
            <tr>
              <th className="py-2 text-sm font-medium text-center">
                Titre du rapport
              </th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">
                Chantier
              </th>
              <th className="py-2 text-sm font-medium text-center">
                Créé par
              </th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">
                Créé le / MàJ le
              </th>
              <th className="w-2/9 py-2 text-sm font-medium text-center">
                Actions
              </th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-gray-600"
                  >
                    Aucun rapport de ferraillage trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((report, index) => (
                  <tr
                    key={report.id}
                    className={index % 2 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className="py-2 text-center font-semibold truncate">
                      {report.name?.trim() || "—"}
                    </td>
                    <td className="py-2 text-center truncate">
                      {report.project?.chantierName?.trim() || "—"}
                    </td>
                    <td className="py-2 text-center truncate">
                      {report.createdByName?.trim() || "—"}
                    </td>
                    <td className="py-2 text-center text-xs">
                      <div>
                        Créé :{" "}
                        {fmtDate(report.createdAt)}
                      </div>
                      <div>
                        MàJ :{" "}
                        {fmtDate(report.updatedAt)}
                      </div>
                    </td>
                    <td className="py-2 w-2/9">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => onEdit(report)}
                          className="ButtonSquare"
                          title="Modifier"
                          type="button"
                        >
                          <FiEdit3 size={14} />
                        </button>
                        <button
                          onClick={() => onView(report)}
                          className="ButtonSquare"
                          title="Voir"
                          type="button"
                        >
                          <FaRegEye size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteClick(report)}
                          className="ButtonSquareDelete"
                          title="Supprimer"
                          type="button"
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

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <CreateRapportModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleReportCreated}
      />
      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.name ?? ""}
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={closeDeleteModal}
      />
      <EditRapportWizard
        open={editOpen}
        rapport={editItem}
        onProjectUpdated={handleProjectUpdated}
        onClose={() => {
          setEditOpen(false);
          setEditItem(null);
        }}
      />
      <ViewProjectData
        open={viewOpen}
        projectId={viewProjectId}
        projectName={viewName}
        onClose={() => {
          setViewOpen(false);
          setViewProjectId(null);
          setViewName("");
        }}
      />
    </div>
  );
}

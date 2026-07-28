import { useEffect, useMemo, useRef, useState } from "react";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import CreateProjetWizard from "@/components/ferraillage/CreateProjetWizard";
import ViewProjectData from "@/components/ferraillage/ViewProjectData";
import TablePagination from "@/components/tablePagination";
import {
  ferraillageApi,
  type FerRapportDTO,
  isApiError as isFerApiError,
} from "@/lib/ferraillageApi";

const PAGE_SIZE = 12;

type DeleteTarget = {
  id: string;
  chantierName: string;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function ProjectsPage() {
  const [items, setItems] = useState<FerRapportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [err, setErr] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<number | null>(null);

  const [projectWizardOpen, setProjectWizardOpen] = useState(false);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [projectEditItem, setProjectEditItem] =
    useState<FerRapportDTO | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<FerRapportDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadProjects() {
    setLoading(true);
    setErr("");

    try {
      const response = await ferraillageApi.listProjects();
      setItems(response.items || []);
    } catch (error: unknown) {
      setErr(isFerApiError(error) ? error.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (cancelled) return;
      await loadProjects();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((project) => {
      const chantierName = (project.chantierName || "").toLowerCase();
      const responsable = (project.responsable || "").toLowerCase();
      return chantierName.includes(q) || responsable.includes(q);
    });
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const displayed = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setCurrentPage(1), 150);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  function onView(id: string) {
    const target = items.find((item) => item.id === id) ?? null;
    setViewItem(target);
    setViewOpen(true);
  }

  function onEdit(item: FerRapportDTO) {
    setProjectEditItem(item);
    setProjectEditOpen(true);
  }

  async function onProjectCreated(item: FerRapportDTO) {
    setCurrentPage(1);
    setProjectWizardOpen(false);

    try {
      await loadProjects();
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
      current.map((item) =>
        item.id !== updatedProject.id
          ? item
          : {
              ...item,
              chantierName: updatedProject.chantierName,
              responsable: updatedProject.responsable,
              acierType: updatedProject.acierType ?? null,
              note: updatedProject.note ?? null,
              updatedAt: updatedProject.updatedAt,
            },
      ),
    );

    setProjectEditItem((current) =>
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

    setViewItem((current) =>
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

  function onDeleteClick(item: FerRapportDTO) {
    setDeleteTarget({
      id: item.id,
      chantierName: item.chantierName,
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
      await ferraillageApi.deleteProject(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error: unknown) {
      setErr(isFerApiError(error) ? error.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Projets</h1>

        <div className="flex items-center gap-2">
          <button
            className="btn-fit-white-outline"
            type="button"
            onClick={() => setProjectWizardOpen(true)}
          >
            Créer Projet
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end gap-6 h-17.5">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche:</label>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Chantier / responsable"
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
                Chantier
              </th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">
                Responsable
              </th>
              <th className="py-2 text-sm font-medium text-center">
                Créé le
              </th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">
                MàJ le
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
                    Aucun projet trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((project, index) => (
                  <tr
                    key={project.id}
                    className={index % 2 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className="py-2 text-center font-semibold truncate">
                      {project.chantierName}
                    </td>
                    <td className="py-2 text-center truncate">
                      {project.responsable ?? "—"}
                    </td>
                    <td className="py-2 text-center">
                      {fmtDate(project.createdAt)}
                    </td>
                    <td className="py-2 text-center">
                      {fmtDate(project.updatedAt)}
                    </td>
                    <td className="py-2 w-2/9">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => onEdit(project)}
                          className="ButtonSquare"
                          title="Modifier"
                          type="button"
                        >
                          <FaRegEdit size={14} />
                        </button>
                        <button
                          onClick={() => onView(project.id)}
                          className="ButtonSquare"
                          title="Voir"
                          type="button"
                        >
                          <FaRegEye size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteClick(project)}
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

      <CreateProjetWizard
        open={projectWizardOpen}
        onClose={() => setProjectWizardOpen(false)}
        onCreated={onProjectCreated}
      />
      <CreateProjetWizard
        open={projectEditOpen}
        project={projectEditItem}
        onUpdated={handleProjectUpdated}
        onClose={() => {
          setProjectEditOpen(false);
          setProjectEditItem(null);
        }}
      />
      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.chantierName ?? ""}
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={closeDeleteModal}
      />
      <ViewProjectData
        open={viewOpen}
        projectId={viewItem?.id ?? null}
        projectName={viewItem?.chantierName ?? ""}
        onClose={() => {
          setViewOpen(false);
          setViewItem(null);
        }}
      />
    </div>
  );
}

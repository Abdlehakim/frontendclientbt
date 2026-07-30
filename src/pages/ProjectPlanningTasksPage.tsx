import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FaRegEye,
  FaTrashAlt,
} from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiEdit3 } from "react-icons/fi";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import PlanningTaskDetailsModal from "@/components/planning/PlanningTaskDetailsModal";
import PlanningTaskModal from "@/components/planning/PlanningTaskModal";
import TablePagination from "@/components/tablePagination";
import { useProjectSelection } from "@/contexts/ProjectSelectionContext";
import {
  isPlanningTasksApiError,
  planningTasksApi,
  type PlanningTaskDTO,
} from "@/lib/planningTasksApi";

const PAGE_SIZE = 12;

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR");
}

function formatTaskDate(
  value: string | null | undefined,
): string {
  if (!value) return "";

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export default function ProjectPlanningTasksPage() {
  const {
    projects,
    selectedProjectId,
  } = useProjectSelection();
  const [tasks, setTasks] = useState<
    PlanningTaskDTO[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<
    "create" | "edit"
  >("create");
  const [editingTask, setEditingTask] =
    useState<PlanningTaskDTO | null>(null);
  const [viewTarget, setViewTarget] =
    useState<PlanningTaskDTO | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<PlanningTaskDTO | null>(null);
  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const loadTasks = useCallback(
    async (
      isActive: () => boolean = () => true,
    ): Promise<void> => {
      if (isActive()) {
        setTasks([]);
        setLoading(true);
        setError("");
      }

      try {
        const response =
          await planningTasksApi.listTasks(
            selectedProjectId || undefined,
          );

        if (!isActive()) return;

        setTasks(response.items ?? []);
      } catch (loadError: unknown) {
        if (!isActive()) return;

        setTasks([]);
        setError(
          isPlanningTasksApiError(loadError)
            ? loadError.message
            : "Impossible de charger les tâches.",
        );
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [selectedProjectId],
  );

  useEffect(() => {
    let active = true;

    setCurrentPage(1);
    void loadTasks(() => active);

    return () => {
      active = false;
    };
  }, [loadTasks]);

  const totalPages = Math.max(
    1,
    Math.ceil(tasks.length / PAGE_SIZE),
  );

  const displayedTasks = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return tasks.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [currentPage, tasks]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function openCreateModal() {
    setModalMode("create");
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEditModal(task: PlanningTaskDTO) {
    setModalMode("edit");
    setEditingTask(task);
    setModalOpen(true);
  }

  function openTaskDetails(task: PlanningTaskDTO) {
    setViewTarget(task);
  }

  function closeTaskDetails() {
    setViewTarget(null);
  }

  function closeTaskModal() {
    setModalOpen(false);
    setEditingTask(null);
  }

  function handleTaskSaved(
    savedTask: PlanningTaskDTO,
  ) {
    setTasks((current) => {
      const taskMatchesFilter =
        !selectedProjectId ||
        savedTask.projectId === selectedProjectId;

      if (modalMode === "edit") {
        if (!taskMatchesFilter) {
          return current.filter(
            (task) => task.id !== savedTask.id,
          );
        }

        return current.map((task) =>
          task.id === savedTask.id
            ? savedTask
            : task,
        );
      }

      if (!taskMatchesFilter) {
        return current;
      }

      return [
        savedTask,
        ...current.filter(
          (task) => task.id !== savedTask.id,
        ),
      ];
    });

    if (modalMode === "create") {
      setCurrentPage(1);
    }

    closeTaskModal();
  }

  function closeDeleteModal() {
    if (deleteLoading) return;
    setDeleteTarget(null);
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget || deleteLoading) return;

    setDeleteLoading(true);
    setError("");

    try {
      await planningTasksApi.deleteTask(
        deleteTarget.id,
      );
      setTasks((current) =>
        current.filter(
          (task) => task.id !== deleteTarget.id,
        ),
      );
      setDeleteTarget(null);
    } catch (deleteError: unknown) {
      setError(
        isPlanningTasksApiError(deleteError)
          ? deleteError.message
          : "Impossible de supprimer la tâche.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-full flex-col gap-4 rounded-xl bg-green-50 px-4 py-4">
      <div className="flex h-12 items-start justify-between">
        <h1 className="text-3xl font-bold uppercase">
          TÂCHES
        </h1>

        <button
          type="button"
          className="btn-fit-white-outline"
          onClick={openCreateModal}
        >
          Ajouter une nouvelle tâche
        </button>
      </div>

      {error ? (
        <div className="text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-(--primary) text-white">
            <tr>
              <th className="py-2 text-center text-sm font-medium">
                Tâche
              </th>
              <th className="border-x-4 border-white py-2 text-center text-sm font-medium">
                Créée par
              </th>
              <th className="py-2 text-center text-sm font-medium">
                Chantier
              </th>
              <th className="border-x-4 border-white py-2 text-center text-sm font-medium">
                Assignée à
              </th>
              <th className="py-2 text-center text-sm font-medium">
                Créée le / MàJ le
              </th>
              <th className="w-40 border-l-4 border-white py-2 text-center text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="w-full table-fixed">
            {displayedTasks.length === 0 &&
            !loading ? (
              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-gray-600"
                  >
                    Aucune tâche trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-14">
                {displayedTasks.map(
                  (task, index) => {
                    const formattedTaskDate =
                      formatTaskDate(task.taskDate);

                    return (
                      <tr
                        key={task.id}
                        className={
                          index % 2
                            ? "bg-gray-100"
                            : "bg-white"
                        }
                      >
                        <td className="px-2 py-2 text-center">
                          <div className="truncate font-semibold">
                            {task.title}
                          </div>
                          {formattedTaskDate ||
                          task.taskTime ? (
                            <div className="mt-1 truncate text-xs font-normal text-slate-500">
                              {formattedTaskDate}
                              {formattedTaskDate &&
                              task.taskTime
                                ? " • "
                                : ""}
                              {task.taskTime || ""}
                            </div>
                          ) : null}
                        </td>
                        <td className="truncate px-2 py-2 text-center">
                          {task.createdByName || "—"}
                        </td>
                        <td className="truncate px-2 py-2 text-center">
                          {task.projectName || "—"}
                        </td>
                        <td className="truncate px-2 py-2 text-center">
                          {task.assignedToName || "—"}
                        </td>
                        <td className="px-2 py-2 text-center text-xs">
                          <div>
                            Créée :{" "}
                            {formatDate(task.createdAt)}
                          </div>
                          <div>
                            MàJ :{" "}
                            {formatDate(task.updatedAt)}
                          </div>
                        </td>
                        <td className="w-40 px-2 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="ButtonSquare"
                              title="Voir les détails"
                              aria-label={`Voir les détails de la tâche ${task.title}`}
                              onClick={() =>
                                openTaskDetails(task)
                              }
                            >
                              <FaRegEye
                                aria-hidden="true"
                                size={14}
                              />
                            </button>
                            <button
                              type="button"
                              className="ButtonSquare"
                              title="Modifier"
                              aria-label="Modifier"
                              onClick={() =>
                                openEditModal(task)
                              }
                            >
                              <FiEdit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="ButtonSquareDelete"
                              title="Supprimer"
                              aria-label="Supprimer"
                              onClick={() =>
                                setDeleteTarget(task)
                              }
                            >
                              <FaTrashAlt size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            )}
          </table>

          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <PlanningTaskDetailsModal
        open={Boolean(viewTarget)}
        task={viewTarget}
        onClose={closeTaskDetails}
      />

      <PlanningTaskModal
        open={modalOpen}
        mode={modalMode}
        task={editingTask}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onClose={closeTaskModal}
        onSaved={handleTaskSaved}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer la tâche"
        itemName={deleteTarget?.title ?? ""}
        message="sera définitivement supprimée."
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { FaSpinner } from "react-icons/fa6";
import type { FerRapportDTO } from "@/lib/ferraillageApi";
import {
  isPlanningTasksApiError,
  planningTasksApi,
  type PlanningTaskAssigneeDTO,
  type PlanningTaskDTO,
  type PlanningTaskMutationPayload,
} from "@/lib/planningTasksApi";

type PlanningTaskModalProps = {
  open: boolean;
  mode: "create" | "edit";
  task: PlanningTaskDTO | null;
  projects: FerRapportDTO[];
  selectedProjectId: string;
  onClose: () => void;
  onSaved: (task: PlanningTaskDTO) => void;
};

const fieldClass =
  "form-control w-full rounded-md border text-sm font-medium " +
  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
  "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
  "placeholder:text-emerald-800/60";

export default function PlanningTaskModal({
  open,
  mode,
  task,
  projects,
  selectedProjectId,
  onClose,
  onSaved,
}: PlanningTaskModalProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedToId, setAssignedToId] =
    useState("");
  const [assignees, setAssignees] = useState<
    PlanningTaskAssigneeDTO[]
  >([]);
  const [assigneesLoading, setAssigneesLoading] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let active = true;

    setTitle(
      mode === "edit" ? task?.title ?? "" : "",
    );
    setProjectId(
      mode === "edit"
        ? task?.projectId ?? ""
        : selectedProjectId || "",
    );
    setAssignedToId(
      mode === "edit"
        ? task?.assignedToId ?? ""
        : "",
    );
    setAssignees([]);
    setAssigneesLoading(true);
    setSubmitting(false);
    setError("");

    void planningTasksApi
      .listAssignees()
      .then((response) => {
        if (!active) return;

        setAssignees(response.items ?? []);
      })
      .catch((loadError: unknown) => {
        if (!active) return;

        setAssignees([]);
        setError(
          isPlanningTasksApiError(loadError)
            ? loadError.message
            : "Impossible de charger les personnes assignables.",
        );
      })
      .finally(() => {
        if (active) {
          setAssigneesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    mode,
    open,
    selectedProjectId,
    task,
  ]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !submitting
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () =>
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
  }, [onClose, open, submitting]);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submitting || assigneesLoading) {
      return;
    }

    const normalizedTitle = title.trim();
    const normalizedProjectId = projectId.trim();
    const normalizedAssignedToId =
      assignedToId.trim();

    if (!normalizedTitle) {
      setError(
        "Le titre de la tâche est obligatoire.",
      );
      return;
    }

    if (!normalizedProjectId) {
      setError("Le chantier est obligatoire.");
      return;
    }

    if (!normalizedAssignedToId) {
      setError(
        "La personne assignée est obligatoire.",
      );
      return;
    }

    const payload: PlanningTaskMutationPayload = {
      title: normalizedTitle,
      projectId: normalizedProjectId,
      assignedToId: normalizedAssignedToId,
    };

    if (mode === "edit" && !task) {
      setError(
        "Impossible d’enregistrer la tâche.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response =
        mode === "create"
          ? await planningTasksApi.createTask(
              payload,
            )
          : await planningTasksApi.updateTask(
              task!.id,
              payload,
            );

      setError("");
      onSaved(response.item);
    } catch (saveError: unknown) {
      setError(
        isPlanningTasksApiError(saveError)
          ? saveError.message
          : "Impossible d’enregistrer la tâche.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-99">
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !submitting
          ) {
            onClose();
          }
        }}
      >
        <form
          onSubmit={(event) => void submit(event)}
          className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-visible rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50 px-5 py-2">
            <div className="text-sm font-semibold text-gray-900">
              {mode === "create"
                ? "Ajouter une nouvelle tâche"
                : "Modifier la tâche"}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              disabled={submitting}
              className="p-1 text-gray-700 transition-transform hover:scale-120 hover:cursor-pointer hover:text-red-600 disabled:opacity-50 disabled:hover:scale-100"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          {error ? (
            <div className="-mt-2 px-5 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="overflow-visible px-5 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col">
                <label
                  htmlFor="planning-task-title"
                  className="mb-1 text-xs font-semibold text-gray-700"
                >
                  Tâche
                </label>
                <input
                  id="planning-task-title"
                  className={fieldClass}
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Ex. : Préparer le rapport de contrôle"
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="planning-task-project"
                  className="mb-1 text-xs font-semibold text-gray-700"
                >
                  Chantier
                </label>
                <select
                  id="planning-task-project"
                  className={`${fieldClass} form-control--select`}
                  value={projectId}
                  onChange={(event) => {
                    setProjectId(event.target.value);
                    if (error) setError("");
                  }}
                  disabled={submitting}
                >
                  <option value="">
                    Sélectionner un chantier
                  </option>
                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.chantierName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="planning-task-assignee"
                  className="mb-1 text-xs font-semibold text-gray-700"
                >
                  Assignée à
                </label>
                <select
                  id="planning-task-assignee"
                  className={`${fieldClass} form-control--select`}
                  value={assignedToId}
                  onChange={(event) => {
                    setAssignedToId(
                      event.target.value,
                    );
                    if (error) setError("");
                  }}
                  disabled={
                    submitting || assigneesLoading
                  }
                >
                  <option value="">
                    Sélectionner une personne
                  </option>
                  {assignees.map((assignee) => (
                    <option
                      key={assignee.id}
                      value={assignee.id}
                    >
                      {assignee.name?.trim() ||
                        assignee.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-between gap-3 rounded-b-xl px-3.5 pt-2.5 pb-3.5"
            aria-label="Actions du formulaire"
          >
            <div className="flex flex-1 items-center justify-end gap-2 whitespace-nowrap">
              <button
                type="submit"
                className="btn-fit-white-outline"
                disabled={
                  submitting || assigneesLoading
                }
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

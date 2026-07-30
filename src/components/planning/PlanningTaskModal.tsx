import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { FaSpinner } from "react-icons/fa6";
import {
  IoIosArrowDropdown,
  IoIosArrowDropup,
} from "react-icons/io";
import { DatePickerInput } from "@/components/DatePickerInput";
import type { FerRapportDTO } from "@/lib/ferraillageApi";
import {
  PLANNING_TASK_TYPE_OPTIONS,
  isPlanningTasksApiError,
  isPlanningTaskType,
  planningTasksApi,
  type PlanningTaskAssigneeDTO,
  type PlanningTaskDTO,
  type PlanningTaskMutationPayload,
  type PlanningTaskType,
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

type TaskDropdownOption = {
  id: string;
  primaryLabel: string;
  secondaryLabel?: string;
};

type TaskDropdownProps = {
  value: string;
  options: TaskDropdownOption[];
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

const fieldClass =
  "form-control w-full rounded-md border text-sm font-medium " +
  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
  "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
  "placeholder:text-emerald-800/60";

function todayLocalDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
    >
      <path
        d="M4 10.5 8 14l8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TaskDropdown({
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: TaskDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((option) => option.id === value) ??
    null;

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener(
        "mousedown",
        onMouseDown,
      );
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const selectedLabel = selectedOption
    ? `${selectedOption.primaryLabel}${
        selectedOption.secondaryLabel
          ? ` — ${selectedOption.secondaryLabel}`
          : ""
      }`
    : placeholder;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col"
    >
      <button
        type="button"
        className={[
          "form-control form-control--select w-full",
          "inline-flex items-center justify-between gap-2",
          "rounded-md border text-left text-sm font-medium",
          "bg-emerald-50 text-emerald-800",
          "border-emerald-200",
          "focus:outline-none focus:ring-2 focus:ring-emerald-400",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-emerald-100",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className="truncate">
          {selectedLabel}
        </span>

        {open ? (
          <IoIosArrowDropup
            className="shrink-0"
            size={18}
            aria-hidden="true"
          />
        ) : (
          <IoIosArrowDropdown
            className="shrink-0"
            size={18}
            aria-hidden="true"
          />
        )}
      </button>

      {open && !disabled ? (
        <div
          className="
            absolute left-0 right-0 top-full z-50 mt-2
            max-h-60 w-full overflow-auto
            rounded-md border border-emerald-200
            bg-white shadow-lg
          "
          role="listbox"
        >
          {options.map((option) => {
            const selected = option.id === value;

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={[
                  "flex w-full items-center gap-2 px-3 py-2",
                  "text-left text-sm",
                  selected
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-700",
                  "hover:bg-emerald-100 hover:text-emerald-800",
                ].join(" ")}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                <span
                  className={[
                    "inline-flex h-4 w-4 shrink-0",
                    "items-center justify-center",
                    "rounded-sm border",
                    selected
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 text-transparent",
                  ].join(" ")}
                >
                  <CheckIcon />
                </span>

                <span className="min-w-0">
                  <span className="block truncate">
                    {option.primaryLabel}
                  </span>
                  {option.secondaryLabel ? (
                    <span className="block truncate text-xs text-slate-500">
                      {option.secondaryLabel}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

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
  const [taskType, setTaskType] =
    useState<PlanningTaskType>("TASK");
  const [projectId, setProjectId] = useState("");
  const [assignedToId, setAssignedToId] =
    useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
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
    setTaskType(
      mode === "edit" &&
        isPlanningTaskType(task?.taskType)
        ? task.taskType
        : "TASK",
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
    setTaskDate(
      mode === "edit"
        ? task?.taskDate ?? ""
        : todayLocalDateInput(),
    );
    setTaskTime(
      mode === "edit"
        ? task?.taskTime ?? ""
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
    const normalizedTaskDate = taskDate.trim();
    const normalizedTaskTime = taskTime.trim();

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

    if (!normalizedTaskDate) {
      setError(
        "La date de la tâche est obligatoire.",
      );
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        normalizedTaskDate,
      )
    ) {
      setError("La date de la tâche est invalide.");
      return;
    }

    if (!normalizedTaskTime) {
      setError(
        "L’heure de la tâche est obligatoire.",
      );
      return;
    }

    if (
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
        normalizedTaskTime,
      )
    ) {
      setError("L’heure de la tâche est invalide.");
      return;
    }

    const payload: PlanningTaskMutationPayload = {
      title: normalizedTitle,
      taskType,
      projectId: normalizedProjectId,
      assignedToId: normalizedAssignedToId,
      taskDate: normalizedTaskDate,
      taskTime: normalizedTaskTime,
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

  const taskTypeOptions: TaskDropdownOption[] =
    PLANNING_TASK_TYPE_OPTIONS.map((option) => ({
      id: option.id,
      primaryLabel: option.label,
    }));

  const projectOptions: TaskDropdownOption[] =
    projects.map((project) => ({
      id: project.id,
      primaryLabel: project.chantierName,
      secondaryLabel:
        project.responsable?.trim() || undefined,
    }));

  const assigneeOptions: TaskDropdownOption[] =
    assignees.map((assignee) => {
      const assigneeName = assignee.name?.trim();

      return {
        id: assignee.id,
        primaryLabel:
          assigneeName || assignee.email,
        secondaryLabel: assigneeName
          ? assignee.email
          : undefined,
      };
    });

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
            <div className="flex flex-col gap-4">
              <div className="text-sm font-semibold text-gray-800">
                Informations de la tâche
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-8">
                <div className="flex flex-col md:col-span-2">
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

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-xs font-semibold text-gray-700">
                    Type d’activité
                  </label>
                  <TaskDropdown
                    value={taskType}
                    options={taskTypeOptions}
                    placeholder="Sélectionner un type"
                    disabled={submitting}
                    onChange={(nextTaskType) => {
                      if (
                        isPlanningTaskType(nextTaskType)
                      ) {
                        setTaskType(nextTaskType);
                      }

                      if (error) setError("");
                    }}
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-xs font-semibold text-gray-700">
                    Chantier
                  </label>
                  <TaskDropdown
                    value={projectId}
                    options={projectOptions}
                    placeholder="Sélectionner un chantier"
                    disabled={submitting}
                    onChange={(nextProjectId) => {
                      setProjectId(nextProjectId);
                      if (error) setError("");
                    }}
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-xs font-semibold text-gray-700">
                    Assignée à
                  </label>
                  <TaskDropdown
                    value={assignedToId}
                    options={assigneeOptions}
                    placeholder={
                      assigneesLoading
                        ? "Chargement..."
                        : "Sélectionner une personne"
                    }
                    disabled={
                      submitting || assigneesLoading
                    }
                    onChange={(nextAssigneeId) => {
                      setAssignedToId(nextAssigneeId);
                      if (error) setError("");
                    }}
                  />
                </div>

                <div className="flex flex-col md:col-span-4">
                  <label
                    htmlFor="planning-task-date"
                    className="mb-1 text-xs font-semibold text-gray-700"
                  >
                    Date de la tâche
                  </label>
                  <DatePickerInput
                    id="planning-task-date"
                    value={taskDate}
                    onChange={(value) => {
                      setTaskDate(value);
                      if (error) setError("");
                    }}
                    disabled={submitting}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col md:col-span-4">
                  <label
                    htmlFor="planning-task-time"
                    className="mb-1 text-xs font-semibold text-gray-700"
                  >
                    Heure de la tâche
                  </label>
                  <input
                    id="planning-task-time"
                    type="time"
                    step={60}
                    value={taskTime}
                    onChange={(event) => {
                      setTaskTime(event.target.value);
                      if (error) setError("");
                    }}
                    disabled={submitting}
                    className={fieldClass}
                  />
                </div>
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

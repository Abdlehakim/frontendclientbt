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
import {
  ferraillageApi,
  isApiError as isFerApiError,
  type FerRapportDTO,
  type FerraillageReportDTO,
} from "@/lib/ferraillageApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (
    item: FerraillageReportDTO,
  ) => void | Promise<void>;
};

const fieldClass =
  "form-control w-full rounded-md border text-sm font-medium " +
  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
  "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
  "placeholder:text-emerald-800/60";

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

type ProjectDropdownProps = {
  projects: FerRapportDTO[];
  value: string;
  disabled: boolean;
  onChange: (projectId: string) => void;
};

function ProjectDropdown({
  projects,
  value,
  disabled,
  onChange,
}: ProjectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProject =
    projects.find((project) => project.id === value) ??
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

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col"
    >
      <label
        id="ferraillage-report-project-label"
        className="mb-1 text-xs font-semibold text-gray-700"
      >
        Projet
      </label>

      <button
        id="ferraillage-report-project"
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
        aria-labelledby="ferraillage-report-project-label"
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
          {selectedProject?.chantierName ||
            "Sélectionner un projet"}
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
          aria-labelledby="ferraillage-report-project-label"
        >
          {projects.map((project) => {
            const selected = project.id === value;

            return (
              <button
                key={project.id}
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
                  onChange(project.id);
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
                    {project.chantierName}
                  </span>
                  {project.responsable?.trim() ? (
                    <span className="block truncate text-xs text-slate-500">
                      {project.responsable}
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

export default function CreateRapportModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [projects, setProjects] = useState<FerRapportDTO[]>([]);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setProjects([]);
    setProjectId("");
    setName("");
    setErr("");
    setSubmitting(false);
    setLoadingProjects(true);

    void ferraillageApi
      .listProjects()
      .then((response) => {
        if (cancelled) return;
        setProjects(response.items ?? []);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErr(
          isFerApiError(error)
            ? error.message
            : "Impossible de charger les projets.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingProjects(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loadingProjects || submitting) return;
    if (!projectId) {
      setErr("Veuillez sélectionner un projet.");
      return;
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      setErr("Le titre du rapport est obligatoire.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      const response = await ferraillageApi.createRapport({
        projectId,
        name: normalizedName,
      });
      await onCreated?.(response.item);
      setProjectId("");
      setName("");
      setErr("");
      onClose();
    } catch (error: unknown) {
      setErr(
        isFerApiError(error)
          ? error.message
          : "Impossible de créer le rapport.",
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
          className="w-full max-w-4xl max-h-[95vh] overflow-visible rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
        >
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              Créer un rapport
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              disabled={submitting}
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          {err ? (
            <div className="px-5 -mt-2 text-sm text-red-600">
              {err}
            </div>
          ) : null}

          <div className="px-5 py-4 overflow-visible">
            <div className="flex flex-col gap-4">
              <div className="text-sm font-semibold text-gray-800">
                Informations du rapport de ferraillage
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProjectDropdown
                  projects={projects}
                  value={projectId}
                  disabled={
                    loadingProjects || submitting
                  }
                  onChange={(nextProjectId) => {
                    setProjectId(nextProjectId);

                    if (err) {
                      setErr("");
                    }
                  }}
                />

                {!loadingProjects &&
                projects.length === 0 ? (
                  <div className="text-sm text-gray-600 md:col-span-2">
                    Aucun projet disponible. Créez d’abord un projet.
                  </div>
                ) : null}

                <div className="flex flex-col">
                  <label
                    htmlFor="ferraillage-report-name"
                    className="text-xs font-semibold text-gray-700 mb-1"
                  >
                    Titre du rapport
                  </label>
                  <input
                    id="ferraillage-report-name"
                    className={fieldClass}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (err) setErr("");
                    }}
                    placeholder="Ex. : Ferraillage – Bloc A"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-b-xl px-3.5 pt-2.5 pb-3.5 flex items-center justify-between gap-3"
            aria-label="Actions du formulaire"
          >
            <div className="flex flex-1 items-center justify-end gap-2 whitespace-nowrap">
              <button
                type="submit"
                className="btn-fit-white-outline"
                disabled={
                  loadingProjects ||
                  submitting ||
                  projects.length === 0
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

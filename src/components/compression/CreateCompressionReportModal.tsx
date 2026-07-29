import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import {
  IoIosArrowDropdown,
  IoIosArrowDropup,
} from "react-icons/io";
import {
  DatePickerInput,
} from "@/components/DatePickerInput";
import type {
  CompressionReportCreateInitialValues,
} from "@/components/compression/CompressionReportEditor";
import {
  ferraillageApi,
  isApiError as isFerraillageApiError,
  type FerRapportDTO,
} from "@/lib/ferraillageApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onContinue: (
    values: CompressionReportCreateInitialValues,
  ) => void;
};

const fieldClass =
  "form-control w-full rounded-md border text-sm font-medium " +
  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
  "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
  "placeholder:text-emerald-800/60";

function todayDateInput(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CheckIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type ProjectDropdownProps = {
  projects: FerRapportDTO[];
  value: string;
  loading: boolean;
  disabled: boolean;
  onChange: (projectId: string) => void;
};

function ProjectDropdown({
  projects,
  value,
  loading,
  disabled,
  onChange,
}: ProjectDropdownProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (!wrapRef.current) return;

      if (!wrapRef.current.contains(event.target as Node)) {
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
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const selectedProject =
    projects.find((project) => project.id === value) ?? null;

  const selectedLabel = selectedProject
    ? `${selectedProject.chantierName}${
        selectedProject.responsable?.trim()
          ? ` — ${selectedProject.responsable}`
          : ""
      }`
    : loading
      ? "Chargement des projets..."
      : "Sélectionner un projet";

  return (
    <div ref={wrapRef} className="relative flex flex-col">
      <label
        id="compression-report-project-label"
        className="mb-1 text-xs font-semibold text-gray-700"
      >
        Projet
      </label>

      <button
        id="compression-report-project"
        type="button"
        className={[
          "form-control form-control--select w-full",
          "inline-flex items-center justify-between gap-2",
          "rounded-md border text-sm font-medium",
          "truncate bg-emerald-50 text-emerald-800",
          "border-emerald-200",
          "focus:outline-none focus:ring-2 focus:ring-emerald-400",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-emerald-100",
        ].join(" ")}
        aria-labelledby="compression-report-project-label"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className="truncate">{selectedLabel}</span>

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
          aria-labelledby="compression-report-project-label"
        >
          {projects.map((project) => {
            const selected = project.id === value;
            const optionLabel = `${project.chantierName}${
              project.responsable?.trim()
                ? ` — ${project.responsable}`
                : ""
            }`;

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

                <span className="truncate">
                  {optionLabel}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function CreateCompressionReportModal({
  open,
  onClose,
  onContinue,
}: Props) {
  const [projects, setProjects] = useState<FerRapportDTO[]>([]);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [reportDate, setReportDate] = useState(todayDateInput);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setProjects([]);
    setProjectId("");
    setName("");
    setReportDate(todayDateInput());
    setError("");
    setLoadingProjects(true);

    void ferraillageApi
      .listProjects()
      .then((response) => {
        if (cancelled) return;
        setProjects(response.items ?? []);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          isFerraillageApiError(loadError)
            ? loadError.message
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
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const submit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (loadingProjects) return;
    if (!projectId) {
      setError("Veuillez sélectionner un projet.");
      return;
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      setError(
        "Le nom de l’essai à la compression est obligatoire.",
      );
      return;
    }

    if (!reportDate) {
      setError("La date du rapport est obligatoire.");
      return;
    }

    setError("");
    onContinue({
      projectId,
      title: normalizedName,
      reportDate,
    });
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-99">
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <form
          onSubmit={submit}
          className="w-full max-w-4xl max-h-[95vh] overflow-visible rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
        >
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              Créer Essai à la compression
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          {error ? (
            <div className="px-5 -mt-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="px-5 py-4 overflow-visible">
            <div className="flex flex-col gap-4">
              <div className="text-sm font-semibold text-gray-800">
                Informations essai à la compression
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProjectDropdown
                  projects={projects}
                  value={projectId}
                  loading={loadingProjects}
                  disabled={
                    loadingProjects ||
                    projects.length === 0
                  }
                  onChange={(nextProjectId) => {
                    setProjectId(nextProjectId);

                    if (error) {
                      setError("");
                    }
                  }}
                />

                {!loadingProjects && projects.length === 0 ? (
                  <div className="text-sm text-gray-600 md:col-span-3">
                    Aucun projet disponible. Créez d’abord un projet.
                  </div>
                ) : null}

                <div className="flex flex-col">
                  <label
                    htmlFor="compression-report-name"
                    className="text-xs font-semibold text-gray-700 mb-1"
                  >
                    Nom de l’essai à la compression
                  </label>
                  <input
                    id="compression-report-name"
                    type="text"
                    className={fieldClass}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Ex: Essai fondations Bloc A"
                  />
                </div>

                <div className="flex flex-col">
                  <label
                    htmlFor="compression-report-date"
                    className="mb-1 text-xs font-semibold text-gray-700"
                  >
                    Date du rapport
                  </label>

                  <DatePickerInput
                    id="compression-report-date"
                    value={reportDate}
                    onChange={(value) => {
                      setReportDate(value);

                      if (error) {
                        setError("");
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-b-xl px-3.5 pt-2.5 pb-3.5 flex items-center justify-between gap-3"
            aria-label="Actions du formulaire"
          >
            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
              <button
                type="submit"
                className="btn-fit-white-outline"
                disabled={
                  loadingProjects ||
                  projects.length === 0
                }
              >
                Continuer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { FaSpinner } from "react-icons/fa6";
import {
  DatePickerInput,
} from "@/components/DatePickerInput";
import {
  compressionApi,
  isCompressionApiError,
  type CompressionReportDetailDTO,
} from "@/lib/compressionApi";
import {
  ferraillageApi,
  isApiError as isFerraillageApiError,
  type FerRapportDTO,
} from "@/lib/ferraillageApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (
    item: CompressionReportDetailDTO,
  ) => void | Promise<void>;
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

function readableError(error: unknown): string {
  if (
    isCompressionApiError(error) ||
    isFerraillageApiError(error)
  ) {
    return error.message;
  }
  return "Impossible de créer l’essai à la compression.";
}

export default function CreateCompressionReportModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [projects, setProjects] = useState<FerRapportDTO[]>([]);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [reportDate, setReportDate] = useState(todayDateInput);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setProjects([]);
    setProjectId("");
    setName("");
    setReportDate(todayDateInput());
    setError("");
    setSubmitting(false);
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
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, submitting]);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (loadingProjects || submitting) return;
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

    setSubmitting(true);
    setError("");

    try {
      const response = await compressionApi.createDraft({
        projectId,
        name: normalizedName,
        reportDate,
      });
      await onCreated?.(response.item);
      setProjectId("");
      setName("");
      setReportDate(todayDateInput());
      setError("");
      onClose();
    } catch (requestError: unknown) {
      setError(readableError(requestError));
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
          className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
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
              disabled={submitting}
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">
            {error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : null}

            <div className="flex flex-col">
              <label
                htmlFor="compression-report-project"
                className="text-xs font-semibold text-gray-700 mb-1"
              >
                Projet
              </label>
              <select
                id="compression-report-project"
                className={`${fieldClass} form-control--select`}
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  if (error) setError("");
                }}
                disabled={
                  loadingProjects ||
                  submitting ||
                  projects.length === 0
                }
              >
                <option value="">
                  {loadingProjects
                    ? "Chargement des projets..."
                    : "Sélectionner un projet"}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.chantierName}
                    {project.responsable?.trim()
                      ? ` — ${project.responsable}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {!loadingProjects && projects.length === 0 ? (
              <div className="text-sm text-gray-600">
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
                disabled={submitting}
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
                disabled={submitting}
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-b-xl px-3.5 pt-2.5 pb-3.5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-fit-white-outline"
                disabled={submitting}
              >
                Annuler
              </button>

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
        </form>
      </div>
    </div>,
    document.body,
  );
}

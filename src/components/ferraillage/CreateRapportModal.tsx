import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { FaSpinner } from "react-icons/fa6";
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
            : "Failed to load projects",
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
      setErr("Le nom du Ferraillage est obligatoire.");
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
          : "Report creation failed",
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
          className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
        >
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              Créer Rapport
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
            {err ? (
              <div className="text-sm text-red-600">{err}</div>
            ) : null}

            <div className="flex flex-col">
              <label
                htmlFor="ferraillage-report-project"
                className="text-xs font-semibold text-gray-700 mb-1"
              >
                Projet
              </label>
              <select
                id="ferraillage-report-project"
                className={`${fieldClass} form-control--select`}
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  if (err) setErr("");
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
                htmlFor="ferraillage-report-name"
                className="text-xs font-semibold text-gray-700 mb-1"
              >
                Nom du Ferraillage
              </label>
              <input
                id="ferraillage-report-name"
                className={fieldClass}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (err) setErr("");
                }}
                placeholder="Ex: Ferraillage Bloc A"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="rounded-b-xl bg-gray-50 border-t border-slate-900/10 px-3.5 pt-2.5 pb-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center justify-start gap-2 flex-1">
              <button
                type="button"
                onClick={onClose}
                className="stepper__nav"
                disabled={submitting}
              >
                Annuler
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
              <button
                type="submit"
                className="stepper__nav"
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

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaRegEdit } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { CiCircleRemove } from "react-icons/ci";
import CalculeTotalFerraillage from "@/components/ferraillage/Edit/EditCalculeTotalFerraillage";
import ProjectModalShell from "@/components/ferraillage/ProjectModalShell";
import { buildTotalFerraillageData } from "@/components/ferraillage/shared/totalFerraillageData";
import {
  ferraillageApi,
  isApiError as isFerApiError,
  type FerProjectDetailDTO,
  type FerProjectLineDTO,
  type FerRapportDTO,
} from "@/lib/ferraillageApi";

type TabKey = "TOTAL_FERRAILLAGE" | "ATTACHEMENT" | "QUANTITE" | "AVANCES" | "FINALE";

const TABS: { key: TabKey; label: string }[] = [
  { key: "TOTAL_FERRAILLAGE", label: "Calcule Totale De Ferraillage" },
  { key: "ATTACHEMENT", label: "Rapport d'attachement" },
  { key: "QUANTITE", label: "Calcule de Quantite" },
  { key: "AVANCES", label: "Avances de paiment" },
  { key: "FINALE", label: "Verification et calcule Finale" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  rapport: FerRapportDTO | null;
};

const ACIER_OPTIONS = ["F400", "F500"] as const;
const DEFAULT_MM_COLS = [6, 8, 10, 12, 14, 16, 20];

function isAcierType(value: string): value is (typeof ACIER_OPTIONS)[number] {
  return value === "F400" || value === "F500";
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
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function TypeAcierDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const shownValue = value.trim() ? value : "Choisir...";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="flex flex-col" ref={wrapRef}>
      <label className="text-sm font-semibold text-gray-700 mb-1">Type d&apos;acier</label>

      <button
        type="button"
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value.trim() ? "truncate" : "truncate text-emerald-800/60"}>{shownValue}</span>
        {open ? (
          <IoIosArrowDropup className="shrink-0" size={18} />
        ) : (
          <IoIosArrowDropdown className="shrink-0" size={18} />
        )}
      </button>

      {open ? (
        <div className="relative">
          <div
            className="absolute left-0 right-0 z-50 mt-2 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
            role="listbox"
          >
            {ACIER_OPTIONS.map((opt) => {
              const selected = opt === value;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={[
                    "w-full px-3 py-2 text-sm text-left flex items-center gap-2",
                    selected ? "bg-emerald-50 text-emerald-700" : "text-slate-700",
                    "hover:bg-emerald-100 hover:text-emerald-800",
                  ].join(" ")}
                  role="option"
                  aria-selected={selected}
                >
                  <span
                    className={[
                      "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                      selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent",
                    ].join(" ")}
                  >
                    <CheckIcon />
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}

            <div className="border-t border-slate-100" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyAttachementTab({ mmCols }: { mmCols: number[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">
            ETAT DE FER LIVRE AU CHANTIER
          </div>
          <div className="text-sm text-gray-700">
            <strong>Etat Date:</strong> -
          </div>
        </div>

        <div className="overflow-auto">
          <table className="border-collapse table-fixed w-full min-w-262.5">
            <thead>
              <tr className="bg-(--primary) text-white">
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">
                  Date
                </th>
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-80">
                  Ndeg Bon de livraison
                </th>
                {mmCols.map((mm) => (
                  <th
                    key={`etat-h-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75"
                  >
                    Fer de {mm}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={2 + mmCols.length} className="py-6 text-center text-gray-600">
                  Aucun mouvement.
                </td>
              </tr>

              <tr className="bg-(--primary) text-white">
                <td className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">
                  TOTAL
                </td>
                <td className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40" />
                {mmCols.map((mm) => (
                  <td
                    key={`etat-t-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40"
                  />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">
            Quantite restante non confectionne
          </div>
          <div className="text-sm text-gray-700">
            <strong>Rapport Date:</strong> -
          </div>
        </div>

        <div className="overflow-auto">
          <table className="border-collapse table-fixed w-full min-w-262.5">
            <thead>
              <tr className="bg-(--primary) text-white">
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">
                  Date
                </th>
                {mmCols.map((mm) => (
                  <th
                    key={`rest-h-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75"
                  >
                    Fer de {mm}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={1 + mmCols.length} className="py-6 text-center text-gray-600">
                  Aucun snapshot.
                </td>
              </tr>

              <tr className="bg-(--primary) text-white">
                <td className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">
                  TOTAL
                </td>
                {mmCols.map((mm) => (
                  <td
                    key={`rest-t-${mm}`}
                    className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40"
                  />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditProjectInfoModal({
  open,
  project,
  onClose,
  onUpdated,
}: {
  open: boolean;
  project: FerProjectDetailDTO | null;
  onClose: () => void;
  onUpdated: (project: FerProjectDetailDTO) => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [chantierName, setChantierName] = useState("");
  const [responsable, setResponsable] = useState("");
  const [acierType, setAcierType] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !project) return;

    setChantierName(project.chantierName ?? "");
    setResponsable(project.responsable ?? "");
    setAcierType(project.acierType ?? "");
    setNote(project.note ?? "");
    setErr("");
    setSubmitting(false);
  }, [open, project]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, submitting, onClose]);

  if (!open || !project) return null;

  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const textareaClass =
    "w-full rounded-md border px-3 py-2 text-sm font-medium " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60 min-h-24 resize-y";

  function closeOnBackdrop(event: React.MouseEvent<HTMLDivElement>) {
    if (submitting) return;
    if (event.target === event.currentTarget) onClose();
  }

  async function handleSubmit() {
    if (!project) return;

    const currentProject = project;
    const nextChantierName = chantierName.trim();
    const nextResponsable = responsable.trim();
    const nextAcierType = acierType.trim();
    const nextNote = note.trim();

    if (!nextChantierName) {
      setErr("Le chantier est obligatoire.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      const response = await ferraillageApi.updateProject(currentProject.id, {
        chantierName: nextChantierName,
        responsable: nextResponsable,
        acierType: isAcierType(nextAcierType) ? nextAcierType : null,
        note: nextNote,
      });

      onUpdated(response.item);
      onClose();
    } catch (error: unknown) {
      setErr(isFerApiError(error) ? error.message : "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-6xl rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden"
        >
          <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Modifier les données du projet</div>
            </div>

            <button
                          type="button"
                          onClick={onClose}
                          aria-label="Fermer"
                          title="Fermer"
                          disabled={submitting}
                          className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                        >
                          <CiCircleRemove size={26} />
                        </button>
          </div>

          <div className="p-5">
            {err ? <div className="mb-4 text-sm text-red-600">{err}</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Chantier</label>
                <input
                  value={chantierName}
                  onChange={(e) => setChantierName(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Pharmaghreb - El Agba"
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Responsable</label>
                <input
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: SIOUD"
                  disabled={submitting}
                />
              </div>

              <TypeAcierDropdown value={acierType} onChange={setAcierType} />

              <div className="flex flex-col md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 mb-1">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={textareaClass}
                  placeholder="Optionnel"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div
            className="
              rounded-b-xl bg-gray-50
              border-t border-slate-900/10
              px-3.5 pt-2.5 pb-3.5
              flex items-center justify-between gap-3
            "
            aria-label="Actions du formulaire"
          >
            <div className="flex items-center justify-start gap-2 flex-1">
              <button type="button" className="stepper__nav" onClick={onClose} disabled={submitting}>
                Annuler
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
              <button
                type="button"
                className="stepper__nav"
                onClick={handleSubmit}
                disabled={submitting}
                aria-disabled={submitting}
              >
                {submitting ? "Modification..." : "Modifier"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EditProjectDataPanel({ onClose, rapport }: { onClose: () => void; rapport: FerRapportDTO | null }) {
  const [tab, setTab] = useState<TabKey>("TOTAL_FERRAILLAGE");

  const [project, setProject] = useState<FerProjectDetailDTO | null>(null);
  const [loading, setLoading] = useState(Boolean(rapport?.id));
  const [err, setErr] = useState("");
  const [projectEditOpen, setProjectEditOpen] = useState(false);

  useEffect(() => {
    if (!rapport?.id) {
      setProject(null);
      setLoading(false);
      setErr("");
      return;
    }

    let cancelled = false;

    setLoading(true);
    setErr("");
    setProject(null);

    ferraillageApi
      .getProject(rapport.id)
      .then((response) => {
        if (cancelled) return;
        setProject(response.item);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErr(isFerApiError(error) ? error.message : "Failed to load project");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rapport?.id]);

  const mmCols = useMemo(() => {
    const values = Array.from(new Set((project?.niveaux ?? []).flatMap((niveau) => niveau.selectedMms ?? []))).sort(
      (a, b) => a - b,
    );
    return values.length ? values : DEFAULT_MM_COLS;
  }, [project]);

  const tabLabel = useMemo(() => TABS.find((t) => t.key === tab)?.label ?? "", [tab]);
  const totalFerraillageData = useMemo(() => buildTotalFerraillageData(project), [project]);

  const handleNiveauCreated = (niveau: FerProjectDetailDTO["niveaux"][number]) => {
    setProject((current) => {
      if (!current) return current;

      return {
        ...current,
        niveaux: [...current.niveaux.filter((item) => item.id !== niveau.id), niveau].sort((a, b) => a.sortOrder - b.sortOrder),
      };
    });
  };

  const handleLineCreated = (niveauId: string, ligne: FerProjectLineDTO) => {
    setProject((current) => {
      if (!current) return current;

      return {
        ...current,
        niveaux: current.niveaux.map((niveau) =>
          niveau.id !== niveauId
            ? niveau
            : {
                ...niveau,
                lignes: [...niveau.lignes.filter((item) => item.id !== ligne.id), ligne],
              },
        ),
      };
    });
  };

  const handleLineUpdated = (niveauId: string, ligne: FerProjectLineDTO) => {
    setProject((current) => {
      if (!current) return current;

      return {
        ...current,
        niveaux: current.niveaux.map((niveau) =>
          niveau.id !== niveauId
            ? niveau
            : {
                ...niveau,
                lignes: niveau.lignes.map((item) => (item.id === ligne.id ? ligne : item)),
              },
        ),
      };
    });
  };

  const handleLineDeleted = (niveauId: string, ligneId: string) => {
    setProject((current) => {
      if (!current) return current;

      return {
        ...current,
        niveaux: current.niveaux.map((niveau) =>
          niveau.id !== niveauId
            ? niveau
            : {
                ...niveau,
                lignes: niveau.lignes.filter((item) => item.id !== ligneId),
              },
        ),
      };
    });
  };

  const handleProjectUpdated = (updatedProject: FerProjectDetailDTO) => {
    setProject(updatedProject);
  };

  return (
    <ProjectModalShell
      title="Modifier - Donnees du projet"
      subtitle={
        project?.chantierName || rapport?.chantierName ? (
          <span className="font-semibold">{project?.chantierName ?? rapport?.chantierName}</span>
        ) : (
          "-"
        )
      }
      onClose={onClose}
    >
      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-(--primary)" />
        </div>
      ) : err ? (
        <div className="rounded-lg bg-white p-6 text-red-600 shadow-sm">{err}</div>
      ) : (
        <>
          <div className="bg-white shadow rounded p-2">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="grid flex-1 grid-cols-1 md:grid-cols-3 gap-2">
                <div className="text-xs">
                  <strong>Chantier:</strong> {project?.chantierName ?? "-"}
                </div>
                <div className="text-xs">
                  <strong>Responsable:</strong> {project?.responsable ?? "-"}
                </div>
                <div className="text-xs">
                  <strong>Type d&apos;acier:</strong> {project?.acierType ?? "-"}
                </div>
                <div className="text-xs md:col-span-3">
                  <strong>Note:</strong> {project?.note ?? "-"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProjectEditOpen(true)}
                disabled={!project}
                className="ButtonSquare"
                title="Modifier les données du projet"
                aria-label="Modifier les données du projet"
              >
                <FaRegEdit size={14} />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap justify-center gap-2 border-b-transparent p-3">
              {TABS.map((t) => {
                const active = t.key === tab;

                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={
                      active
                        ? "px-4 py-2 rounded bg-(--primary) text-white font-semibold"
                        : "px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }
                    type="button"
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="min-h-65">
              {tab === "TOTAL_FERRAILLAGE" ? (
                <CalculeTotalFerraillage
                  initialData={totalFerraillageData}
                  onNiveauCreated={handleNiveauCreated}
                  onLineCreated={handleLineCreated}
                  onLineUpdated={handleLineUpdated}
                  onLineDeleted={handleLineDeleted}
                />
              ) : tab === "ATTACHEMENT" ? (
                <EmptyAttachementTab mmCols={mmCols} />
              ) : (
                <div className="text-gray-500">
                  <strong>{tabLabel}</strong>
                  <div className="mt-2 italic">Contenu a definir...</div>
                </div>
              )}
            </div>
          </div>

          <EditProjectInfoModal
            open={projectEditOpen}
            project={project}
            onClose={() => setProjectEditOpen(false)}
            onUpdated={handleProjectUpdated}
          />
        </>
      )}
    </ProjectModalShell>
  );
}

export default function EditProjectData({ open, onClose, rapport }: Props) {
  if (!open) return null;

  return createPortal(
    <EditProjectDataPanel key={rapport?.id ?? "none"} onClose={onClose} rapport={rapport} />,
    document.body,
  );
}

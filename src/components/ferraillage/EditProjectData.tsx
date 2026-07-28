import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa6";
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

type TabKey =
  | "DETAILS_CHANTIER"
  | "TOTAL_FERRAILLAGE"
  | "ATTACHEMENT"
  | "QUANTITE"
  | "AVANCES"
  | "FINALE";

const TABS: { key: TabKey; label: string }[] = [
  { key: "DETAILS_CHANTIER", label: "Détails de Chantier" },
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
  onProjectUpdated?: (project: FerProjectDetailDTO) => void;
};

const DEFAULT_MM_COLS = [6, 8, 10, 12, 14, 16, 20];

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

function EditProjectDataPanel({
  onClose,
  rapport,
  onProjectUpdated,
}: {
  onClose: () => void;
  rapport: FerRapportDTO | null;
  onProjectUpdated?: (project: FerProjectDetailDTO) => void;
}) {
  const [tab, setTab] = useState<TabKey>("DETAILS_CHANTIER");

  const [project, setProject] = useState<FerProjectDetailDTO | null>(null);
  const [loading, setLoading] = useState(Boolean(rapport?.id));
  const [err, setErr] = useState("");

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
    onProjectUpdated?.(updatedProject);
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
          <div>
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
              {tab === "DETAILS_CHANTIER" ? (
                <div className="rounded bg-white p-4 shadow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-gray-500">
                        Chantier
                      </div>
                      <div className="font-semibold text-gray-900">
                        {project?.chantierName?.trim() || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Responsable
                      </div>
                      <div className="font-semibold text-gray-900">
                        {project?.responsable?.trim() || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Type d&apos;acier
                      </div>
                      <div className="font-semibold text-gray-900">
                        {project?.acierType ?? "—"}
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="text-xs text-gray-500">
                        Note
                      </div>
                      <div className="whitespace-pre-wrap text-gray-900">
                        {project?.note?.trim() || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : tab === "TOTAL_FERRAILLAGE" ? (
                <CalculeTotalFerraillage
                  initialData={totalFerraillageData}
                  onNiveauCreated={handleNiveauCreated}
                  onProjectReloaded={handleProjectUpdated}
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
        </>
      )}
    </ProjectModalShell>
  );
}

export default function EditProjectData({ open, onClose, rapport, onProjectUpdated }: Props) {
  if (!open) return null;

  return createPortal(
    <EditProjectDataPanel
      key={rapport?.id ?? "none"}
      onClose={onClose}
      rapport={rapport}
      onProjectUpdated={onProjectUpdated}
    />,
    document.body,
  );
}

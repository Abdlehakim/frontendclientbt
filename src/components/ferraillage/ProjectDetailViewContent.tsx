import { useMemo, useState } from "react";
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { buildTotalFerraillageData } from "@/components/ferraillage/shared/totalFerraillageData";
import { type FerProjectDetailDTO } from "@/lib/ferraillageApi";
import RapportAttachementTab from "@/pages/tabs/RapportAttachementTab";
import CalculeTotalFerraillage from "@/pages/tabs/CalculeTotalFerraillage";

function fmtDateTime(iso?: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function maxIso(values: Array<string | null | undefined>) {
  let best: string | null = null;

  for (const value of values) {
    if (!value) continue;
    if (!best) best = value;
    else if (new Date(value).getTime() > new Date(best).getTime()) best = value;
  }

  return best;
}

type TabKey = "TOTAL_FERRAILLAGE" | "ATTACHEMENT" | "QUANTITE" | "AVANCES" | "FINALE";

const TABS: { key: TabKey; label: string }[] = [
  { key: "TOTAL_FERRAILLAGE", label: "Calcule Totale De Ferraillage" },
  { key: "ATTACHEMENT", label: "Rapport d'attachement" },
  { key: "QUANTITE", label: "Calcule de Quantite" },
  { key: "AVANCES", label: "Avances de paiment" },
  { key: "FINALE", label: "Verification et calcule Finale" },
];

export default function ProjectDetailViewContent({
  project,
  onPrint,
}: {
  project: FerProjectDetailDTO;
  onPrint?: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("TOTAL_FERRAILLAGE");

  const tabLabel = useMemo(() => TABS.find((item) => item.key === tab)?.label ?? "", [tab]);
  const totalFerraillageData = useMemo(() => buildTotalFerraillageData(project), [project]);
  const lastEtatDate = useMemo(() => maxIso((project?.etats ?? []).map((item) => item.etatDate)), [project]);
  const lastRestantDate = useMemo(() => maxIso((project?.restants ?? []).map((item) => item.rapportDate)), [project]);

  return (
    <>
      <div className="grid grid-cols-1 gap-2">
        <div className="project-print-card print-card project-print-project-header no-print bg-white shadow rounded p-2 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="text-xs">
            <strong>Etats chantier:</strong> {project.etats.length} (Dernier: {fmtDateTime(lastEtatDate)})
          </div>
          <div className="text-xs">
            <strong>Restants:</strong> {project.restants.length} (Dernier: {fmtDateTime(lastRestantDate)})
          </div>
          <div className="text-xs">
            <strong>Created At:</strong> {fmtDateTime(project.createdAt)}
          </div>
          <div className="text-xs">
            <strong>Updated At:</strong> {fmtDateTime(project.updatedAt)}
          </div>
        </div>

        <div className="project-print-card print-card project-print-project-header bg-white shadow rounded p-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="text-xs">
            <strong>Chantier:</strong> {project.chantierName ?? "-"}
          </div>
          <div className="text-xs">
            <strong>Responsable:</strong> {project.responsable ?? "-"}
          </div>
          <div className="text-xs">
            <strong>Type d'acier:</strong> {project.acierType ?? "-"}
          </div>
          <div className="text-xs md:col-span-3">
            <strong>Note:</strong> {project.note ?? "-"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="no-print flex items-center justify-between gap-3 p-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {TABS.map((item) => {
              const active = item.key === tab;

              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={
                    active
                      ? "px-4 py-2 rounded bg-(--primary) text-white font-semibold cursor-pointer"
                      : "px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 hoverButtons"
                  }
                  type="button"
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex max-w-26 items-start gap-3">
            <button
              type="button"
              onClick={onPrint}
              aria-label="Imprimer"
              title="Imprimer"
              className="print-button no-print inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-(--primary)  hoverButtons"
            >
              <MdOutlineLocalPrintshop size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-65 project-print-section">
          {tab === "TOTAL_FERRAILLAGE" ? (
            <CalculeTotalFerraillage data={totalFerraillageData} />
          ) : tab === "ATTACHEMENT" ? (
            <RapportAttachementTab rapportId={project.id} onPrint={onPrint} />
          ) : (
            <div className="text-gray-500">
              <strong>{tabLabel}</strong>
              <div className="mt-2 italic">Contenu a definir...</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

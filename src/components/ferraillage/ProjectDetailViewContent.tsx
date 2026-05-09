import { useMemo, useState } from "react";
import { buildTotalFerraillageData } from "@/components/ferraillage/shared/totalFerraillageData";
import { type FerProjectDetailDTO } from "@/lib/ferraillageApi";
import RapportAttachementTab from "@/pages/tabs/RapportAttachementTab";
import CalculeTotalFerraillage from "@/pages/tabs/CalculeTotalFerraillage";

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

  return (
    <>
      <div className="grid grid-cols-1 gap-2">
        <div className="project-print-card print-card project-print-project-header bg-white shadow rounded p-2">
          <div className="project-print-project-grid grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="project-print-project-item text-xs">
              <strong>Chantier:</strong> {project.chantierName ?? "-"}
            </div>
            <div className="project-print-project-item text-xs">
              <strong>Responsable:</strong> {project.responsable ?? "-"}
            </div>
            <div className="project-print-project-item text-xs">
              <strong>Type d'acier:</strong> {project.acierType ?? "-"}
            </div>
            <div className="project-print-project-note text-xs md:col-span-3">
              <strong>Note:</strong> {project.note ?? "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="no-print flex items-center gap-3 p-3">
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
        </div>

        <div className="min-h-65 project-print-section">
          {tab === "TOTAL_FERRAILLAGE" ? (
            <CalculeTotalFerraillage data={totalFerraillageData} onPrint={onPrint} />
          ) : tab === "ATTACHEMENT" ? (
            <RapportAttachementTab rapportId={project.id} />
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

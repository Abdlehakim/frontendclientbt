import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FiFileText,
  FiLayers,
  FiMapPin,
  FiUser,
} from "react-icons/fi";
import { buildTotalFerraillageData } from "@/components/ferraillage/shared/totalFerraillageData";
import { type FerProjectDetailDTO } from "@/lib/ferraillageApi";
import RapportAttachementTab from "@/pages/tabs/RapportAttachementTab";
import CalculeTotalFerraillage from "@/pages/tabs/CalculeTotalFerraillage";

type TabKey =
  | "DETAILS_CHANTIER"
  | "TOTAL_FERRAILLAGE"
  | "ATTACHEMENT"
  | "QUANTITE"
  | "AVANCES"
  | "FINALE";

const TABS: {
  key: TabKey;
  label: string;
}[] = [
  {
    key: "DETAILS_CHANTIER",
    label: "Détails de Chantier",
  },
  {
    key: "TOTAL_FERRAILLAGE",
    label: "Calcule Totale De Ferraillage",
  },
  {
    key: "ATTACHEMENT",
    label: "Rapport d'attachement",
  },
  {
    key: "QUANTITE",
    label: "Calcule de Quantite",
  },
  {
    key: "AVANCES",
    label: "Avances de paiment",
  },
  {
    key: "FINALE",
    label: "Verification et calcule Finale",
  },
];

type DetailItemProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
};

function DetailItem({
  icon,
  label,
  value,
  className = "",
  valueClassName = "",
}: DetailItemProps) {
  return (
    <div
      className={[
        "flex min-w-0 items-center gap-4",
        className,
      ].join(" ")}
    >
      <div
        className="
          flex h-14 w-14 shrink-0
          items-center justify-center
          rounded-full bg-emerald-100/70
          text-emerald-950
        "
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm text-slate-600">
          {label}
        </div>

        <div
          className={[
            "mt-1 break-words text-lg font-semibold text-slate-950",
            valueClassName,
          ].join(" ")}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailViewContent({
  project,
  onPrint,
}: {
  project: FerProjectDetailDTO;
  onPrint?: () => void;
}) {
  const [tab, setTab] =
    useState<TabKey>("DETAILS_CHANTIER");

  const tabLabel = useMemo(() => TABS.find((item) => item.key === tab)?.label ?? "", [tab]);
  const totalFerraillageData = useMemo(() => buildTotalFerraillageData(project), [project]);

  return (
    <>
      <div className="print-only grid grid-cols-1 gap-2">
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

      <div>
        <div className="no-print flex flex-wrap justify-center gap-2 border-b-transparent p-3">
          {TABS.map((item) => {
            const active = item.key === tab;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={
                  active
                    ? "px-4 py-2 rounded bg-(--primary) text-white font-semibold"
                    : "px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-65 project-print-section">
          {tab === "DETAILS_CHANTIER" ? (
            <div className="px-4 py-6 sm:px-8 lg:px-12">
              <div
                className="
                  grid grid-cols-1
                  gap-x-12 gap-y-8
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >
                <DetailItem
                  icon={
                    <FiMapPin
                      size={26}
                      strokeWidth={1.8}
                    />
                  }
                  label="Chantier"
                  value={
                    project.chantierName?.trim() ||
                    "—"
                  }
                />

                <DetailItem
                  icon={
                    <FiUser
                      size={26}
                      strokeWidth={1.8}
                    />
                  }
                  label="Responsable"
                  value={
                    project.responsable?.trim() ||
                    "—"
                  }
                />

                <DetailItem
                  icon={
                    <FiLayers
                      size={26}
                      strokeWidth={1.8}
                    />
                  }
                  label="Type d’acier"
                  value={
                    project.acierType ??
                    "—"
                  }
                />

                <DetailItem
                  icon={
                    <FiFileText
                      size={26}
                      strokeWidth={1.8}
                    />
                  }
                  label="Note"
                  value={
                    project.note?.trim() ||
                    "—"
                  }
                  className="md:col-span-2 xl:col-span-3"
                  valueClassName="whitespace-pre-wrap"
                />
              </div>
            </div>
          ) : tab === "TOTAL_FERRAILLAGE" ? (
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

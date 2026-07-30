import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  FiCalendar,
  FiClock,
  FiEdit3,
  FiFileText,
  FiMapPin,
  FiUser,
  FiUserCheck,
} from "react-icons/fi";
import ProjectModalShell from "@/components/ferraillage/ProjectModalShell";
import type { PlanningTaskDTO } from "@/lib/planningTasksApi";

type PlanningTaskDetailsModalProps = {
  open: boolean;
  task: PlanningTaskDTO | null;
  onClose: () => void;
};

type DetailItemProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
};

function formatTaskDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return "—";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatTimestamp(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatTaskTime(
  value: string | null | undefined,
): string {
  const normalized = value?.trim() ?? "";

  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
    normalized,
  )
    ? normalized
    : "—";
}

function displayText(
  value: string | null | undefined,
): string {
  return value?.trim() || "—";
}

function DetailItem({
  icon,
  label,
  value,
  className,
}: DetailItemProps) {
  return (
    <div
      className={[
        "flex min-w-0 items-start gap-3",
        "rounded-lg border border-slate-200",
        "bg-white p-4 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <div className="min-w-0">
        <dt className="text-xs font-medium text-slate-500">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value}
        </dd>
      </div>
    </div>
  );
}

export default function PlanningTaskDetailsModal({
  open,
  task,
  onClose,
}: PlanningTaskDetailsModalProps) {
  if (!open || !task) return null;

  return createPortal(
    <ProjectModalShell
      title="Détails de la tâche"
      subtitle={task.title || "—"}
      onClose={onClose}
      panelClassName="w-full max-w-3xl max-h-[90vh] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
      bodyClassName="flex-1 overflow-auto bg-green-50 p-5"
    >
      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DetailItem
          icon={
            <FiFileText
              aria-hidden="true"
              size={18}
            />
          }
          label="Tâche"
          value={displayText(task.title)}
          className="md:col-span-2"
        />

        <DetailItem
          icon={
            <FiMapPin
              aria-hidden="true"
              size={18}
            />
          }
          label="Chantier"
          value={displayText(task.projectName)}
        />

        <DetailItem
          icon={
            <FiUserCheck
              aria-hidden="true"
              size={18}
            />
          }
          label="Assignée à"
          value={displayText(task.assignedToName)}
        />

        <DetailItem
          icon={
            <FiUser
              aria-hidden="true"
              size={18}
            />
          }
          label="Créée par"
          value={displayText(task.createdByName)}
        />

        <DetailItem
          icon={
            <FiCalendar
              aria-hidden="true"
              size={18}
            />
          }
          label="Date de la tâche"
          value={formatTaskDate(task.taskDate)}
        />

        <DetailItem
          icon={
            <FiClock
              aria-hidden="true"
              size={18}
            />
          }
          label="Heure de la tâche"
          value={formatTaskTime(task.taskTime)}
        />

        <DetailItem
          icon={
            <FiCalendar
              aria-hidden="true"
              size={18}
            />
          }
          label="Créée le"
          value={formatTimestamp(task.createdAt)}
        />

        <DetailItem
          icon={
            <FiEdit3
              aria-hidden="true"
              size={18}
            />
          }
          label="Mise à jour le"
          value={formatTimestamp(task.updatedAt)}
        />
      </dl>
    </ProjectModalShell>,
    document.body,
  );
}

import { useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
  FiPlus,
  FiSettings,
} from "react-icons/fi";

type PlanningCategory =
  | "CALL"
  | "CHANTIER"
  | "DEVIS"
  | "SUIVI"
  | "ACHAT";

type PlanningEvent = {
  id: string;
  dayIndex: number;
  start: string;
  end: string;
  title: string;
  category: PlanningCategory;
};

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 62;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

const PLANNING_EVENTS: PlanningEvent[] = [
  {
    id: "monday-site-meeting",
    dayIndex: 0,
    start: "09:00",
    end: "10:30",
    title: "Réunion de chantier",
    category: "CALL",
  },
  {
    id: "monday-concrete-study",
    dayIndex: 0,
    start: "11:00",
    end: "12:30",
    title: "Étude béton",
    category: "CHANTIER",
  },
  {
    id: "monday-plan-check",
    dayIndex: 0,
    start: "14:00",
    end: "15:30",
    title: "Vérification plans",
    category: "DEVIS",
  },
  {
    id: "monday-supplier-call",
    dayIndex: 0,
    start: "16:00",
    end: "17:00",
    title: "Appel fournisseur",
    category: "ACHAT",
  },
  {
    id: "tuesday-supply-follow-up",
    dayIndex: 1,
    start: "10:00",
    end: "11:30",
    title: "Suivi approvisionnement",
    category: "ACHAT",
  },
  {
    id: "tuesday-formwork-preparation",
    dayIndex: 1,
    start: "13:30",
    end: "15:30",
    title: "Préparation coffrage",
    category: "SUIVI",
  },
  {
    id: "tuesday-progress-point",
    dayIndex: 1,
    start: "16:00",
    end: "17:00",
    title: "Point d’avancement",
    category: "CALL",
  },
  {
    id: "wednesday-quality-control",
    dayIndex: 2,
    start: "09:00",
    end: "10:30",
    title: "Contrôle qualité",
    category: "DEVIS",
  },
  {
    id: "wednesday-team-meeting",
    dayIndex: 2,
    start: "11:00",
    end: "12:00",
    title: "Réunion équipe",
    category: "CALL",
  },
  {
    id: "wednesday-rebar-study",
    dayIndex: 2,
    start: "14:00",
    end: "16:00",
    title: "Étude ferraillage",
    category: "CHANTIER",
  },
  {
    id: "thursday-material-delivery",
    dayIndex: 3,
    start: "08:30",
    end: "10:00",
    title: "Livraison matériel",
    category: "ACHAT",
  },
  {
    id: "thursday-site-follow-up",
    dayIndex: 3,
    start: "11:00",
    end: "12:30",
    title: "Suivi chantier",
    category: "SUIVI",
  },
  {
    id: "thursday-client-meeting",
    dayIndex: 3,
    start: "15:00",
    end: "16:30",
    title: "Réunion client",
    category: "CALL",
  },
  {
    id: "friday-concrete-quantity",
    dayIndex: 4,
    start: "09:00",
    end: "10:30",
    title: "Métré béton",
    category: "CHANTIER",
  },
  {
    id: "friday-technical-analysis",
    dayIndex: 4,
    start: "13:30",
    end: "15:00",
    title: "Analyse technique",
    category: "DEVIS",
  },
  {
    id: "friday-weekly-report",
    dayIndex: 4,
    start: "16:00",
    end: "17:00",
    title: "Rapport hebdo",
    category: "ACHAT",
  },
];

const CATEGORY_CONFIG: Record<
  PlanningCategory,
  {
    label: string;
    cardClass: string;
    accentClass: string;
    dotClass: string;
  }
> = {
  CALL: {
    label: "Réunion / Appel",
    cardClass: "border-sky-200 bg-sky-50 text-slate-900",
    accentClass: "border-l-sky-500",
    dotClass: "bg-sky-500",
  },
  CHANTIER: {
    label: "Chantier",
    cardClass: "border-emerald-200 bg-emerald-50 text-slate-900",
    accentClass: "border-l-emerald-500",
    dotClass: "bg-emerald-500",
  },
  DEVIS: {
    label: "Devis",
    cardClass: "border-violet-200 bg-violet-50 text-slate-900",
    accentClass: "border-l-violet-500",
    dotClass: "bg-violet-500",
  },
  SUIVI: {
    label: "Suivi projet",
    cardClass: "border-pink-200 bg-pink-50 text-slate-900",
    accentClass: "border-l-pink-400",
    dotClass: "bg-pink-400",
  },
  ACHAT: {
    label: "Achat / Fournisseur",
    cardClass: "border-amber-200 bg-amber-50 text-slate-900",
    accentClass: "border-l-amber-400",
    dotClass: "bg-amber-400",
  },
};

const LEGEND_CATEGORIES: PlanningCategory[] = [
  "CALL",
  "CHANTIER",
  "SUIVI",
  "DEVIS",
  "ACHAT",
];

function startOfWeek(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  const currentDay = date.getDay();
  const offset = currentDay === 0 ? -6 : 1 - currentDay;

  date.setDate(date.getDate() + offset);
  return date;
}

function addDays(value: Date, amount: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDayName(value: Date): string {
  const shortDay = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
  })
    .format(value)
    .replace(/\.$/, "");

  return capitalize(shortDay);
}

function formatDayDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");

  return `${day}/${month}`;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  const sameMonth =
    sameYear && weekStart.getMonth() === weekEnd.getMonth();

  const day = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
  });
  const dayAndMonth = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  });
  const fullDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (sameMonth) {
    return `${day.format(weekStart)} – ${fullDate.format(weekEnd)}`;
  }

  if (sameYear) {
    return `${dayAndMonth.format(weekStart)} – ${fullDate.format(
      weekEnd,
    )}`;
  }

  return `${fullDate.format(weekStart)} – ${fullDate.format(
    weekEnd,
  )}`;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isWeekend(value: Date): boolean {
  return value.getDay() === 0 || value.getDay() === 6;
}

function timeToMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function getEventPosition(event: PlanningEvent): {
  top: number;
  height: number;
} {
  const startMinutes = timeToMinutes(event.start);
  const endMinutes = timeToMinutes(event.end);

  const top =
    ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const rawHeight =
    ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

  return {
    top,
    height: Math.max(rawHeight, 34),
  };
}

export default function ProjectPlanningPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date()),
  );
  const today = new Date();

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addDays(weekStart, index),
      ),
    [weekStart],
  );

  const hourLabels = useMemo(
    () =>
      Array.from(
        { length: END_HOUR - START_HOUR + 1 },
        (_, index) => START_HOUR + index,
      ),
    [],
  );

  function goToPreviousWeek() {
    setWeekStart((current) => addDays(current, -7));
  }

  function goToNextWeek() {
    setWeekStart((current) => addDays(current, 7));
  }

  function goToToday() {
    setWeekStart(startOfWeek(new Date()));
  }

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 min-h-full rounded-xl bg-[#f5fbf7]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold uppercase leading-none">
          Planification
        </h1>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Ajout de tâche bientôt disponible"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-(--primary) px-5 font-medium text-white opacity-100 shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-100"
        >
          <FiPlus aria-hidden="true" size={18} />
          Ajouter une tâche
        </button>
      </div>

      <div className="grid grid-cols-1 items-center gap-3 px-0 py-1 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Afficher la semaine précédente"
            title="Semaine précédente"
            onClick={goToPreviousWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
          >
            <FiChevronLeft aria-hidden="true" size={20} />
          </button>

          <button
            type="button"
            aria-label="Afficher la semaine suivante"
            title="Semaine suivante"
            onClick={goToNextWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
          >
            <FiChevronRight aria-hidden="true" size={20} />
          </button>

          <button
            type="button"
            aria-label="Revenir à la semaine actuelle"
            title="Aujourd'hui"
            onClick={goToToday}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
          >
            Aujourd&apos;hui
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 whitespace-nowrap text-lg font-bold text-slate-900">
          <span>{formatWeekRange(weekStart)}</span>
          <FiChevronDown
            aria-hidden="true"
            className="shrink-0 text-slate-500"
            size={18}
          />
        </div>

        <div className="flex justify-start lg:justify-end">
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Sélection de vue bientôt disponible"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 font-medium text-slate-700 opacity-100 shadow-sm disabled:cursor-not-allowed disabled:opacity-100"
          >
            <FiCalendar
              aria-hidden="true"
              className="text-slate-500"
              size={17}
            />
            Semaine
            <FiChevronDown
              aria-hidden="true"
              className="text-slate-500"
              size={16}
            />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <div
          role="region"
          aria-label="Calendrier hebdomadaire de planification"
          className="min-w-[1100px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            className="grid border-b border-slate-200"
            style={{
              gridTemplateColumns:
                "72px repeat(7, minmax(145px, 1fr))",
            }}
          >
            <div className="h-16 border-r border-slate-200 bg-white" />
            {weekDays.map((day, index) => {
              const isCurrentDay = isSameLocalDay(day, today);
              const weekend = isWeekend(day);

              return (
                <div
                  key={day.toISOString()}
                  className={[
                    "flex h-16 flex-col items-center justify-center px-2 text-center",
                    isCurrentDay
                      ? "bg-emerald-50"
                      : "bg-white",
                    index < weekDays.length - 1
                      ? "border-r border-slate-200"
                      : "",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "whitespace-nowrap text-sm font-semibold",
                      weekend
                        ? "text-red-500"
                        : "text-slate-900",
                    ].join(" ")}
                  >
                    {formatDayName(day)} {formatDayDate(day)}
                  </div>
                  {isCurrentDay ? (
                    <span className="mt-1 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">
                      Aujourd&apos;hui
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns:
                "72px repeat(7, minmax(145px, 1fr))",
            }}
          >
            <div
              className="relative border-r border-slate-200 bg-white"
              style={{ height: CALENDAR_HEIGHT }}
            >
              {hourLabels.map((hour) => {
                const top = Math.min(
                  Math.max(
                    (hour - START_HOUR) * HOUR_HEIGHT,
                    0,
                  ),
                  CALENDAR_HEIGHT,
                );
                const alignmentClass =
                  hour === START_HOUR
                    ? "translate-y-1"
                    : hour === END_HOUR
                      ? "-translate-y-full -mt-1"
                      : "-translate-y-1/2";

                return (
                  <div
                    key={hour}
                    className={`absolute right-3 text-xs font-medium text-slate-600 ${alignmentClass}`}
                    style={{ top }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                );
              })}
            </div>

            {weekDays.map((day, dayIndex) => {
              const isCurrentDay = isSameLocalDay(day, today);

              return (
                <div
                  key={day.toISOString()}
                  className={[
                    "relative overflow-hidden",
                    isCurrentDay
                      ? "bg-emerald-50/50"
                      : "bg-white",
                    dayIndex < weekDays.length - 1
                      ? "border-r border-slate-200"
                      : "",
                  ].join(" ")}
                  style={{ height: CALENDAR_HEIGHT }}
                >
                  {Array.from(
                    { length: TOTAL_HOURS + 1 },
                    (_, hourIndex) => (
                      <div
                        key={`hour-${hourIndex}`}
                        aria-hidden="true"
                        className="absolute left-0 right-0 z-0 border-t border-slate-200"
                        style={{
                          top: hourIndex * HOUR_HEIGHT,
                        }}
                      />
                    ),
                  )}

                  {Array.from(
                    { length: TOTAL_HOURS },
                    (_, hourIndex) => (
                      <div
                        key={`half-hour-${hourIndex}`}
                        aria-hidden="true"
                        className="absolute left-0 right-0 z-0 border-t border-dashed border-slate-100"
                        style={{
                          top:
                            hourIndex * HOUR_HEIGHT +
                            HOUR_HEIGHT / 2,
                        }}
                      />
                    ),
                  )}

                  {PLANNING_EVENTS.filter(
                    (event) => event.dayIndex === dayIndex,
                  ).map((event) => {
                    const position = getEventPosition(event);
                    const config = CATEGORY_CONFIG[event.category];

                    return (
                      <div
                        key={event.id}
                        aria-label={`${event.title}, ${event.start} à ${event.end}`}
                        className={[
                          "absolute z-10 overflow-hidden rounded-md border border-l-4 px-2.5 py-2 pr-7 text-xs shadow-sm",
                          config.cardClass,
                          config.accentClass,
                        ].join(" ")}
                        style={{
                          top: position.top + 4,
                          height: Math.max(
                            position.height - 8,
                            34,
                          ),
                          left: 10,
                          right: 10,
                        }}
                      >
                        <div className="flex min-w-0 items-start gap-1.5">
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${config.dotClass}`}
                          />
                          <div className="min-w-0 text-xs font-semibold leading-tight text-slate-900">
                            {event.title}
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] font-medium leading-tight text-slate-600">
                          {event.start} – {event.end}
                        </div>
                        <FiMoreHorizontal
                          aria-hidden="true"
                          className="pointer-events-none absolute bottom-1 right-1.5 text-slate-500"
                          size={14}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 flex-wrap items-center justify-around gap-x-6 gap-y-3 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700">
          {LEGEND_CATEGORIES.map((category) => {
            const config = CATEGORY_CONFIG[category];

            return (
              <div
                key={category}
                className="flex items-center gap-2"
              >
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 rounded-sm ${config.dotClass}`}
                />
                <span>{config.label}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Gestion des catégories bientôt disponible"
          className="inline-flex h-12 items-center justify-center gap-2 self-stretch rounded-md border border-slate-200 bg-white px-5 font-medium text-slate-700 opacity-100 disabled:cursor-not-allowed disabled:opacity-100 sm:self-auto"
        >
          <FiSettings
            aria-hidden="true"
            className="text-slate-500"
            size={17}
          />
          Gérer les catégories
        </button>
      </div>
    </div>
  );
}

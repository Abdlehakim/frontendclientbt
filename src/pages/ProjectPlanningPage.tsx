import { useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
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
const HOUR_HEIGHT = 56;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

const PLANNING_EVENTS: PlanningEvent[] = [
  {
    id: "monday-client-meeting",
    dayIndex: 0,
    start: "09:00",
    end: "10:00",
    title: "Réunion client",
    category: "CALL",
  },
  {
    id: "monday-quote-preparation",
    dayIndex: 0,
    start: "11:00",
    end: "12:00",
    title: "Préparation devis",
    category: "DEVIS",
  },
  {
    id: "monday-project-follow-up",
    dayIndex: 0,
    start: "14:00",
    end: "15:30",
    title: "Suivi projet",
    category: "SUIVI",
  },
  {
    id: "monday-supplier-call",
    dayIndex: 0,
    start: "16:30",
    end: "17:30",
    title: "Appel fournisseur",
    category: "ACHAT",
  },
  {
    id: "tuesday-site-visit",
    dayIndex: 1,
    start: "10:00",
    end: "11:30",
    title: "Visite chantier",
    category: "CHANTIER",
  },
  {
    id: "tuesday-material-purchase",
    dayIndex: 1,
    start: "15:00",
    end: "16:00",
    title: "Achat matériaux",
    category: "CALL",
  },
  {
    id: "wednesday-quote-preparation",
    dayIndex: 2,
    start: "09:00",
    end: "10:30",
    title: "Préparation devis",
    category: "DEVIS",
  },
  {
    id: "wednesday-project-follow-up",
    dayIndex: 2,
    start: "14:00",
    end: "15:00",
    title: "Suivi projet",
    category: "SUIVI",
  },
  {
    id: "thursday-client-meeting",
    dayIndex: 3,
    start: "11:00",
    end: "12:00",
    title: "Réunion client",
    category: "CALL",
  },
  {
    id: "thursday-plan-approval",
    dayIndex: 3,
    start: "15:00",
    end: "16:30",
    title: "Validation plan",
    category: "CHANTIER",
  },
  {
    id: "friday-project-follow-up",
    dayIndex: 4,
    start: "09:30",
    end: "10:30",
    title: "Suivi projet",
    category: "SUIVI",
  },
  {
    id: "friday-site-visit",
    dayIndex: 4,
    start: "13:30",
    end: "14:30",
    title: "Visite chantier",
    category: "CHANTIER",
  },
  {
    id: "friday-supplier-call",
    dayIndex: 4,
    start: "16:00",
    end: "17:00",
    title: "Appel fournisseur",
    category: "ACHAT",
  },
  {
    id: "saturday-quote-preparation",
    dayIndex: 5,
    start: "10:00",
    end: "11:30",
    title: "Préparation devis",
    category: "DEVIS",
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
    cardClass: "border-sky-200 bg-sky-50 text-sky-950",
    accentClass: "border-l-sky-500",
    dotClass: "bg-sky-500",
  },
  CHANTIER: {
    label: "Chantier",
    cardClass: "border-amber-200 bg-amber-50 text-amber-950",
    accentClass: "border-l-amber-400",
    dotClass: "bg-amber-400",
  },
  DEVIS: {
    label: "Devis",
    cardClass: "border-emerald-200 bg-emerald-50 text-emerald-950",
    accentClass: "border-l-emerald-500",
    dotClass: "bg-emerald-500",
  },
  SUIVI: {
    label: "Suivi projet",
    cardClass: "border-violet-200 bg-violet-50 text-violet-950",
    accentClass: "border-l-violet-500",
    dotClass: "bg-violet-500",
  },
  ACHAT: {
    label: "Achat / Fournisseur",
    cardClass: "border-slate-300 bg-slate-100 text-slate-900",
    accentClass: "border-l-slate-500",
    dotClass: "bg-slate-500",
  },
};

const LEGEND_CATEGORIES: PlanningCategory[] = [
  "CALL",
  "CHANTIER",
  "DEVIS",
  "SUIVI",
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
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
    }).format(value),
  );
}

function formatDayDate(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  const sameMonth =
    sameYear && weekStart.getMonth() === weekEnd.getMonth();

  const day = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
  });
  const month = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
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
    return `Semaine du ${day.format(weekStart)} au ${day.format(
      weekEnd,
    )} ${month.format(weekEnd)}`;
  }

  if (sameYear) {
    return `Semaine du ${dayAndMonth.format(
      weekStart,
    )} au ${dayAndMonth.format(weekEnd)}`;
  }

  return `Semaine du ${fullDate.format(
    weekStart,
  )} au ${fullDate.format(weekEnd)}`;
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
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 min-h-full bg-green-50 rounded-xl">
      <h1 className="text-3xl font-bold uppercase">
        Planification
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="Afficher la semaine précédente"
            title="Semaine précédente"
            onClick={goToPreviousWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
          >
            <FiChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2 text-slate-800">
            <FiCalendar className="shrink-0 text-slate-500" size={19} />
            <span className="font-semibold">
              {formatWeekRange(weekStart)}
            </span>
          </div>

          <button
            type="button"
            aria-label="Afficher la semaine suivante"
            title="Semaine suivante"
            onClick={goToNextWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
          >
            <FiChevronRight size={20} />
          </button>
        </div>

        <button
          type="button"
          aria-label="Revenir à la semaine actuelle"
          title="Aujourd'hui"
          onClick={goToToday}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
        >
          <FiCalendar size={17} />
          Aujourd&apos;hui
        </button>
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
            <div className="h-18 border-r border-slate-200" />
            {weekDays.map((day, index) => (
              <div
                key={day.toISOString()}
                className={[
                  "flex h-18 flex-col items-center justify-center bg-white px-2 text-center",
                  index < weekDays.length - 1
                    ? "border-r border-slate-200"
                    : "",
                ].join(" ")}
              >
                <div className="font-semibold text-slate-900">
                  {formatDayName(day)}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {formatDayDate(day)}
                </div>
              </div>
            ))}
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

            {weekDays.map((day, dayIndex) => (
              <div
                key={day.toISOString()}
                className={[
                  "relative overflow-hidden bg-white",
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
                        "absolute z-10 overflow-hidden rounded-md border border-l-4 px-2.5 py-2 text-xs leading-tight shadow-sm",
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
                      <div className="font-semibold">
                        {event.start} – {event.end}
                      </div>
                      <div className="mt-1 font-medium">
                        {event.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 px-4 py-1 text-sm text-slate-700">
        {LEGEND_CATEGORIES.map((category) => {
          const config = CATEGORY_CONFIG[category];

          return (
            <div
              key={category}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className={`h-3.5 w-3.5 shrink-0 rounded-full ${config.dotClass}`}
              />
              <span>{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

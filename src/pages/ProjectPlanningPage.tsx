import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
  FiPlus,
  FiSettings,
} from "react-icons/fi";
import {
  compressionApi,
  type CompressionPlanningEventDTO,
} from "@/lib/compressionApi";
import { useProjectSelection } from "@/contexts/ProjectSelectionContext";

type PlanningCategory =
  | "CALL"
  | "CHANTIER"
  | "DEVIS"
  | "SUIVI"
  | "ACHAT";

type PlanningEvent = {
  id: string;
  projectId?: string;
  date?: string;
  start: string;
  end?: string;
  title: string;
  category: PlanningCategory;
};

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 58;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

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

function startOfLocalDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
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

function formatLocalDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateRange(
  rangeStart: Date,
  rangeEnd: Date,
): string {
  const sameYear =
    rangeStart.getFullYear() ===
    rangeEnd.getFullYear();

  const sameMonth =
    sameYear &&
    rangeStart.getMonth() ===
      rangeEnd.getMonth();

  const day = new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
    },
  );

  const dayAndMonth =
    new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
    });

  const fullDate =
    new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (sameMonth) {
    return `${day.format(
      rangeStart,
    )} – ${fullDate.format(rangeEnd)}`;
  }

  if (sameYear) {
    return `${dayAndMonth.format(
      rangeStart,
    )} – ${fullDate.format(rangeEnd)}`;
  }

  return `${fullDate.format(
    rangeStart,
  )} – ${fullDate.format(rangeEnd)}`;
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
  const top =
    ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  if (!event.end) {
    return {
      top,
      height: 46,
    };
  }

  const endMinutes = timeToMinutes(event.end);
  const rawHeight =
    ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

  return {
    top,
    height: Math.max(rawHeight, 34),
  };
}

function mapCompressionPlanningEvent(
  item: CompressionPlanningEventDTO,
): PlanningEvent {
  return {
    id: `compression-${item.id}`,
    projectId: item.projectId,
    date: item.crushingDate.slice(0, 10),
    start: item.planningTime,
    title: `Écrasement – ${item.designation}`,
    category: "CHANTIER",
  };
}

export default function ProjectPlanningPage() {
  const { selectedProjectId } = useProjectSelection();
  const [centerDate, setCenterDate] =
    useState(() =>
      startOfLocalDay(new Date()),
    );
  const [compressionEvents, setCompressionEvents] =
    useState<PlanningEvent[]>([]);
  const [planningError, setPlanningError] =
    useState("");
  const today = new Date();

  const visibleDays = useMemo(
    () =>
      [
        addDays(centerDate, -1),
        centerDate,
        addDays(centerDate, 1),
      ] as const,
    [centerDate],
  );

  useEffect(() => {
    let cancelled = false;

    const from =
      formatLocalDateOnly(visibleDays[0]);
    const to =
      formatLocalDateOnly(visibleDays[2]);

    setPlanningError("");

    void compressionApi
      .listPlanningEvents(from, to)
      .then((response) => {
        if (cancelled) return;

        setCompressionEvents(
          response.items.map(
            mapCompressionPlanningEvent,
          ),
        );
        setPlanningError("");
      })
      .catch(() => {
        if (cancelled) return;

        setCompressionEvents([]);
        setPlanningError(
          "Impossible de charger les écrasements planifiés.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [visibleDays]);

  const hourLabels = useMemo(
    () =>
      Array.from(
        { length: END_HOUR - START_HOUR + 1 },
        (_, index) => START_HOUR + index,
      ),
    [],
  );

  function goToPreviousPeriod() {
    setCenterDate((current) =>
      addDays(current, -3),
    );
  }

  function goToNextPeriod() {
    setCenterDate((current) =>
      addDays(current, 3),
    );
  }

  function goToToday() {
    setCenterDate(
      startOfLocalDay(new Date()),
    );
  }

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 min-h-full rounded-xl bg-green-50">

      <div className="flex flex-wrap items-center gap-2 px-0 py-1">
        <button
          type="button"
          aria-label="Afficher les trois jours précédents"
          title="Trois jours précédents"
          onClick={goToPreviousPeriod}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
        >
          <FiChevronLeft aria-hidden="true" size={20} />
        </button>

        <div className="flex items-center justify-center gap-2 whitespace-nowrap text-lg font-bold text-slate-900">
          <span>
            {formatDateRange(
              visibleDays[0],
              visibleDays[2],
            )}
          </span>
          <FiChevronDown
            aria-hidden="true"
            className="shrink-0 text-slate-500"
            size={18}
          />
        </div>

        <button
          type="button"
          aria-label="Afficher les trois jours suivants"
          title="Trois jours suivants"
          onClick={goToNextPeriod}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
        >
          <FiChevronRight aria-hidden="true" size={20} />
        </button>

        <button
          type="button"
          aria-label="Revenir à aujourd’hui"
          title="Aujourd'hui"
          onClick={goToToday}
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
        >
          Aujourd&apos;hui
        </button>
      </div>

      {planningError ? (
        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          {planningError}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl">
        <div
          role="region"
          aria-label="Calendrier de planification sur trois jours"
          className="min-w-[760px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            className="grid border-b border-slate-200"
            style={{
              gridTemplateColumns:
                "72px repeat(3, minmax(220px, 1fr))",
            }}
          >
            <div className="h-12 border-r border-slate-200 bg-white" />
            {visibleDays.map((day, index) => {
              const isCurrentDay = isSameLocalDay(day, today);
              const weekend = isWeekend(day);

              return (
                <div
                  key={day.toISOString()}
                  className={[
                    "flex h-12 flex-col items-center justify-center px-2 text-center",
                    isCurrentDay
                      ? "bg-emerald-50"
                      : "bg-white",
                    index < visibleDays.length - 1
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
                "72px repeat(3, minmax(220px, 1fr))",
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

            {visibleDays.map((day, visibleDayIndex) => {
              const isCurrentDay =
                isSameLocalDay(day, today);
              const localDateKey =
                formatLocalDateOnly(day);
              const dayEvents =
                compressionEvents.filter(
                  (event) =>
                    event.date === localDateKey &&
                    (
                      !selectedProjectId ||
                      event.projectId ===
                        selectedProjectId
                    ),
                );

              return (
                <div
                  key={day.toISOString()}
                  className={[
                    "relative overflow-hidden",
                    isCurrentDay
                      ? "bg-emerald-50/50"
                      : "bg-white",
                    visibleDayIndex <
                      visibleDays.length - 1
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

                  {dayEvents.map((event) => {
                    const position = getEventPosition(event);
                    const config = CATEGORY_CONFIG[event.category];

                    return (
                      <div
                        key={event.id}
                        aria-label={
                          event.end
                            ? `${event.title}, ${event.start} à ${event.end}`
                            : `${event.title}, ${event.start}`
                        }
                        className={[
                          "absolute z-10 overflow-hidden rounded-md border border-l-4 px-2.5 py-2 pr-7 text-xs shadow-sm",
                          config.cardClass,
                          config.accentClass,
                        ].join(" ")}
                        style={{
                          top: position.top,
                          height: event.end
                            ? Math.max(
                                position.height - 8,
                                34,
                              )
                            : position.height,
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
                          {event.end
                            ? `${event.start} – ${event.end}`
                            : event.start}
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
    </div>
  );
}

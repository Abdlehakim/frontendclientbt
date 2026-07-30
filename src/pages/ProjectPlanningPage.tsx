import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
} from "react-icons/fi";
import {
  compressionApi,
  type CompressionPlanningEventDTO,
} from "@/lib/compressionApi";
import {
  isPlanningTaskType,
  planningTasksApi,
  type PlanningTaskDTO,
  type PlanningTaskType,
} from "@/lib/planningTasksApi";
import { useProjectSelection } from "@/contexts/ProjectSelectionContext";

type PlanningCategory =
  | "CALL"
  | "CHANTIER"
  | "DEVIS"
  | "SUIVI"
  | "ACHAT"
  | "TASK";

type PlanningEvent = {
  id: string;
  projectId?: string;
  date?: string;
  start: string;
  end?: string;
  title: string;
  category: PlanningCategory;
};

type PositionedPlanningEvent = {
  event: PlanningEvent;
  columnIndex: number;
  columnCount: number;
};

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;
const HOUR_HEIGHT = 58;
const EVENT_HORIZONTAL_INSET = 10;
const EVENT_COLUMN_GAP = 6;

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
  TASK: {
    label: "Tâche",
    cardClass: "border-indigo-200 bg-indigo-50 text-slate-900",
    accentClass: "border-l-indigo-500",
    dotClass: "bg-indigo-500",
  },
};

const TASK_TYPE_TO_PLANNING_CATEGORY: Record<
  PlanningTaskType,
  PlanningCategory
> = {
  TASK: "TASK",
  MEETING: "CALL",
  FOLLOW_UP: "SUIVI",
  PURCHASE: "ACHAT",
};

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

function timeToMinutes(value: string): number | null {
  const match =
    /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function layoutSameTimeEvents(
  events: PlanningEvent[],
): PositionedPlanningEvent[] {
  const groupKeys = events.map((event, index) => {
    const startMinutes = timeToMinutes(event.start);

    return startMinutes === null
      ? `invalid:${event.id}:${index}`
      : `time:${startMinutes}`;
  });
  const groups = new Map<string, PlanningEvent[]>();

  events.forEach((event, index) => {
    const groupKey = groupKeys[index];
    const group = groups.get(groupKey);

    if (group) {
      group.push(event);
    } else {
      groups.set(groupKey, [event]);
    }
  });

  const nextColumnIndex = new Map<string, number>();

  return events.map((event, index) => {
    const groupKey = groupKeys[index];
    const group = groups.get(groupKey);
    const columnIndex =
      nextColumnIndex.get(groupKey) ?? 0;

    nextColumnIndex.set(groupKey, columnIndex + 1);

    return {
      event,
      columnIndex,
      columnCount: group?.length ?? 1,
    };
  });
}

function getEventHorizontalStyle(
  columnIndex: number,
  columnCount: number,
): {
  left: number | string;
  right?: number;
  width?: string;
} {
  if (columnCount <= 1) {
    return {
      left: EVENT_HORIZONTAL_INSET,
      right: EVENT_HORIZONTAL_INSET,
    };
  }

  const totalGap =
    (columnCount - 1) * EVENT_COLUMN_GAP;
  const totalFixedWidth =
    EVENT_HORIZONTAL_INSET * 2 + totalGap;
  const columnWidthPercent = 100 / columnCount;
  const columnWidthOffset =
    totalFixedWidth / columnCount;
  const leftPercent =
    columnIndex * columnWidthPercent;
  const leftOffset =
    EVENT_HORIZONTAL_INSET +
    columnIndex *
      (EVENT_COLUMN_GAP - columnWidthOffset);
  const normalizedLeftPercent = Number(
    leftPercent.toFixed(6),
  );
  const normalizedLeftOffset = Number(
    Math.abs(leftOffset).toFixed(6),
  );
  const normalizedWidthPercent = Number(
    columnWidthPercent.toFixed(6),
  );
  const normalizedWidthOffset = Number(
    columnWidthOffset.toFixed(6),
  );
  const leftOperator =
    leftOffset < 0 ? "-" : "+";

  return {
    left:
      `calc(${normalizedLeftPercent}% ${leftOperator} ${normalizedLeftOffset}px)`,
    width:
      `calc(${normalizedWidthPercent}% - ${normalizedWidthOffset}px)`,
  };
}

function getEventPosition(
  event: PlanningEvent,
  startHour: number,
): {
  top: number;
  height: number;
} {
  const startMinutes = timeToMinutes(event.start);

  if (startMinutes === null) {
    return {
      top: 0,
      height: 46,
    };
  }

  const top =
    ((startMinutes - startHour * 60) / 60) *
    HOUR_HEIGHT;

  if (!event.end) {
    return {
      top,
      height: 46,
    };
  }

  const endMinutes = timeToMinutes(event.end);

  if (endMinutes === null) {
    return {
      top,
      height: 46,
    };
  }

  const rawHeight =
    ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

  return {
    top,
    height: Math.max(rawHeight, 34),
  };
}

function isValidDateOnly(value: string): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  const leapYear =
    year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
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

function mapTaskPlanningEvent(
  task: PlanningTaskDTO,
): PlanningEvent | null {
  const date = task.taskDate?.trim() ?? "";
  const start = task.taskTime?.trim() ?? "";

  if (
    !date ||
    !start ||
    !isValidDateOnly(date) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start)
  ) {
    return null;
  }

  const category =
    isPlanningTaskType(task.taskType)
      ? TASK_TYPE_TO_PLANNING_CATEGORY[
          task.taskType
        ]
      : "TASK";

  return {
    id: `task-${task.id}`,
    projectId: task.projectId,
    date,
    start,
    title: task.title,
    category,
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
  const [taskEvents, setTaskEvents] =
    useState<PlanningEvent[]>([]);
  const [planningError, setPlanningError] =
    useState("");
  const [taskPlanningError, setTaskPlanningError] =
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

  useEffect(() => {
    let active = true;

    setTaskPlanningError("");

    void planningTasksApi
      .listTasks(selectedProjectId || undefined)
      .then((response) => {
        if (!active) return;

        const mappedEvents = response.items
          .map(mapTaskPlanningEvent)
          .filter(
            (
              event,
            ): event is PlanningEvent =>
              event !== null,
          );

        setTaskEvents(mappedEvents);
        setTaskPlanningError("");
      })
      .catch(() => {
        if (!active) return;

        setTaskEvents([]);
        setTaskPlanningError(
          "Impossible de charger les tâches planifiées.",
        );
      });

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  const planningEvents = useMemo(
    () => [
      ...compressionEvents,
      ...taskEvents,
    ],
    [compressionEvents, taskEvents],
  );

  const visiblePlanningEvents = useMemo(() => {
    const visibleDateKeys = new Set(
      visibleDays.map((day) =>
        formatLocalDateOnly(day),
      ),
    );

    return planningEvents.filter(
      (event) =>
        Boolean(
          event.date &&
            visibleDateKeys.has(event.date),
        ) &&
        (
          !selectedProjectId ||
          event.projectId === selectedProjectId
        ),
    );
  }, [
    planningEvents,
    selectedProjectId,
    visibleDays,
  ]);

  const calendarStartHour = useMemo(() => {
    let startHour = DEFAULT_START_HOUR;

    for (const event of visiblePlanningEvents) {
      const match =
        /^(\d{2}):(\d{2})$/.exec(event.start);

      if (!match) continue;

      const hour = Number(match[1]);

      if (
        Number.isInteger(hour) &&
        hour >= 0 &&
        hour <= 23
      ) {
        startHour = Math.min(startHour, hour);
      }
    }

    return Math.max(0, startHour);
  }, [visiblePlanningEvents]);

  const calendarEndHour = useMemo(() => {
    let endHour = DEFAULT_END_HOUR;

    for (const event of visiblePlanningEvents) {
      const match =
        /^(\d{2}):(\d{2})$/.exec(event.start);

      if (!match) continue;

      const hour = Number(match[1]);
      const minute = Number(match[2]);

      if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
      ) {
        continue;
      }

      const requiredEnd =
        hour + (minute > 0 ? 2 : 1);

      endHour = Math.max(endHour, requiredEnd);
    }

    const boundedEnd = Math.min(24, endHour);

    return boundedEnd > calendarStartHour
      ? boundedEnd
      : Math.min(24, calendarStartHour + 1);
  }, [
    calendarStartHour,
    visiblePlanningEvents,
  ]);

  const calendarHours = useMemo(
    () =>
      Array.from(
        {
          length:
            calendarEndHour -
            calendarStartHour +
            1,
        },
        (_, index) => calendarStartHour + index,
      ),
    [
      calendarEndHour,
      calendarStartHour,
    ],
  );

  const totalCalendarHours =
    calendarEndHour - calendarStartHour;
  const totalCalendarHeight =
    totalCalendarHours * HOUR_HEIGHT;

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Afficher les trois jours précédents"
            title="Trois jours précédents"
            onClick={goToPreviousPeriod}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
          >
            <FiChevronLeft aria-hidden="true" size={20} />
          </button>

          <div className="flex h-10 w-full items-center justify-center whitespace-nowrap px-3 text-lg font-bold text-slate-900 sm:w-72">
            <span>
              {formatDateRange(
                visibleDays[0],
                visibleDays[2],
              )}
            </span>
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
        </div>

        <button
          type="button"
          aria-label="Revenir à aujourd’hui"
          title="Aujourd'hui"
          onClick={goToToday}
          className="ml-auto inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2"
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

      {taskPlanningError ? (
        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          {taskPlanningError}
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
              style={{ height: totalCalendarHeight }}
            >
              {calendarHours.map((hour) => {
                const top = Math.min(
                  Math.max(
                    (hour - calendarStartHour) *
                      HOUR_HEIGHT,
                    0,
                  ),
                  totalCalendarHeight,
                );
                const alignmentClass =
                  hour === calendarStartHour
                    ? "translate-y-1"
                    : hour === calendarEndHour
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
                planningEvents.filter(
                  (event) =>
                    event.date === localDateKey &&
                    (
                      !selectedProjectId ||
                      event.projectId ===
                        selectedProjectId
                    ),
                );
              const positionedDayEvents =
                layoutSameTimeEvents(dayEvents);

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
                  style={{ height: totalCalendarHeight }}
                >
                  {Array.from(
                    {
                      length: totalCalendarHours + 1,
                    },
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
                    { length: totalCalendarHours },
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

                  {positionedDayEvents.map(({
                    event,
                    columnIndex,
                    columnCount,
                  }) => {
                    const position = getEventPosition(
                      event,
                      calendarStartHour,
                    );
                    const config = CATEGORY_CONFIG[event.category];
                    const eventTime = event.end
                      ? `${event.start} – ${event.end}`
                      : event.start;
                    const horizontalStyle =
                      getEventHorizontalStyle(
                        columnIndex,
                        columnCount,
                      );

                    return (
                      <div
                        key={event.id}
                        aria-label={
                          event.category === "TASK"
                            ? `${config.label}, ${event.title}, ${eventTime}`
                            : event.end
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
                          ...horizontalStyle,
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
                          {eventTime}
                          {event.category === "TASK"
                            ? ` • ${config.label}`
                            : ""}
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

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type DatePickerInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

const ISO_DATE_VALUE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})$/;

const LONG_DATE_INPUT_PATTERN =
  /^(\d{2})[./-](\d{2})[./-](\d{4})$/;

const SHORT_DATE_INPUT_PATTERN =
  /^(\d{2})-(\d{2})-(\d{2})$/;

const SHORT_YEAR_PIVOT = 70;

const DEFAULT_WEEKDAYS = [
  "Lu",
  "Ma",
  "Me",
  "Je",
  "Ve",
  "Sa",
  "Di",
];

function isoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayDateString(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
}

function createValidDate(
  year: number,
  month: number,
  day: number,
): Date | null {
  const candidate = new Date(year, month - 1, day);

  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
}

function parseDateString(value: string): Date | null {
  const match = ISO_DATE_VALUE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return createValidDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
}

function shortYearToFullYear(year: number): number {
  return year >= SHORT_YEAR_PIVOT
    ? 1900 + year
    : 2000 + year;
}

function parseTypedDateString(value: string): Date | null {
  const match = SHORT_DATE_INPUT_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return createValidDate(
    shortYearToFullYear(Number(match[3])),
    Number(match[2]),
    Number(match[1]),
  );
}

function normalizeTypedDateValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const isoDate = parseDateString(trimmed);

  if (isoDate) {
    return displayDateString(isoDate);
  }

  const longDateMatch = LONG_DATE_INPUT_PATTERN.exec(trimmed);

  if (longDateMatch) {
    return `${longDateMatch[1]}-${longDateMatch[2]}-${longDateMatch[3].slice(-2)}`;
  }

  const digits = trimmed.replace(/\D/g, "").slice(0, 6);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function formatInputValue(value: string): string {
  const date = parseDateString(value);

  return date ? displayDateString(date) : "";
}

function alignViewDate(date: Date | null): Date {
  const nextDate = date ?? new Date();

  return new Date(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    1,
  );
}

function getLocale(): string {
  if (
    typeof navigator !== "undefined" &&
    navigator.language
  ) {
    return navigator.language;
  }

  return "fr-FR";
}

function formatMonth(date: Date, locale: string): string {
  try {
    const text = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(date);

    return text
      ? text.charAt(0).toUpperCase() + text.slice(1)
      : "";
  } catch {
    return `${date.toLocaleString("fr-FR", {
      month: "long",
    })} ${date.getFullYear()}`;
  }
}

function getDayLabel(date: Date, locale: string): string {
  try {
    return date.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDateString(date);
  }
}

function CalendarIcon() {
  return (
    <svg
      className="swb-date-picker__toggle-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-11 8h14M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
      />
    </svg>
  );
}

export function DatePickerInput({
  value,
  onChange,
  id,
  placeholder = "JJ-MM-YY",
  disabled = false,
  className,
  inputClassName,
}: DatePickerInputProps) {
  const generatedId = React.useId().replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  );
  const panelId = `${id || generatedId || "swbDatePicker"}Panel`;
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const isInputFocusedRef = React.useRef(false);
  const locale = React.useMemo(() => getLocale(), []);
  const selectedDate = React.useMemo(
    () => parseDateString(value),
    [value],
  );
  const [inputValue, setInputValue] = React.useState(() =>
    formatInputValue(value),
  );
  const [viewDate, setViewDate] = React.useState(() =>
    alignViewDate(selectedDate),
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [panelStyle, setPanelStyle] =
    React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    const nextDate = parseDateString(value);

    if (!isInputFocusedRef.current) {
      setInputValue(formatInputValue(value));
    }

    if (nextDate) {
      setViewDate(alignViewDate(nextDate));
    }
  }, [value]);

  const closePanel = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const openPanel = React.useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const togglePanel = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setIsOpen((open) => !open);
  }, [disabled]);

  const updatePanelPosition = React.useCallback(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;

    if (!wrapper || !panel) {
      return;
    }

    const gap = 6;
    const gutter = 12;
    const wrapperRect = wrapper.getBoundingClientRect();
    const panelMinWidth = 220;
    const panelMaxWidth = 280;

    const width = Math.min(
      panelMaxWidth,
      Math.max(wrapperRect.width, panelMinWidth),
    );
    const left = Math.min(
      Math.max(wrapperRect.left, gutter),
      Math.max(
        gutter,
        window.innerWidth - width - gutter,
      ),
    );
    const panelHeight = panel.offsetHeight || 0;
    let top = wrapperRect.bottom + gap;
    let maxHeight: string | undefined;
    let overflowY: React.CSSProperties["overflowY"];

    if (panelHeight) {
      const aboveTop =
        wrapperRect.top - panelHeight - gap;
      const availableAbove = Math.max(
        0,
        wrapperRect.top - gap - gutter,
      );
      const availableBelow = Math.max(
        0,
        window.innerHeight -
          wrapperRect.bottom -
          gap -
          gutter,
      );
      const fitsAbove = panelHeight <= availableAbove;
      const fitsBelow = panelHeight <= availableBelow;

      if (!fitsBelow && fitsAbove) {
        top = aboveTop;
        maxHeight = availableAbove
          ? `${Math.round(availableAbove)}px`
          : undefined;
        overflowY =
          panelHeight > availableAbove
            ? "auto"
            : undefined;
      } else {
        top = Math.max(
          gutter,
          Math.min(
            top,
            window.innerHeight -
              Math.min(panelHeight, availableBelow) -
              gutter,
          ),
        );
        maxHeight = availableBelow
          ? `${Math.round(availableBelow)}px`
          : undefined;
        overflowY =
          panelHeight > availableBelow
            ? "auto"
            : undefined;
      }
    }

    setPanelStyle({
      position: "fixed",
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: `${Math.round(width)}px`,
      minWidth: `${Math.round(width)}px`,
      maxWidth: `${panelMaxWidth}px`,
      maxHeight,
      overflowY,
      zIndex: 100020,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePanelPosition();
    const animationFrame =
      window.requestAnimationFrame(updatePanelPosition);
    const handleRelayout = () => {
      updatePanelPosition();
    };

    window.addEventListener("resize", handleRelayout);
    window.addEventListener("scroll", handleRelayout, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleRelayout);
      window.removeEventListener(
        "scroll",
        handleRelayout,
        true,
      );
    };
  }, [isOpen, updatePanelPosition, viewDate]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        wrapperRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      closePanel();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    };

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener(
      "keydown",
      handleKeyDown,
      true,
    );

    return () => {
      document.removeEventListener(
        "click",
        handleOutsideClick,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true,
      );
    };
  }, [closePanel, isOpen]);

  const monthLabel = formatMonth(viewDate, locale);
  const startOffset = (viewDate.getDay() + 6) % 7;
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const totalCells =
    Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayIso = isoDateString(new Date());
  const selectedIso = selectedDate
    ? isoDateString(selectedDate)
    : "";
  const days = Array.from(
    { length: totalCells },
    (_, index) => {
      const dayNumber = index - startOffset + 1;
      const date = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        dayNumber,
      );

      return {
        date,
        isoValue: isoDateString(date),
      };
    },
  );

  const selectDate = (date: Date, isoValue: string) => {
    setInputValue(displayDateString(date));
    setViewDate(alignViewDate(date));
    onChange(isoValue);
    closePanel();
  };

  const selectToday = () => {
    const today = new Date();

    setInputValue(displayDateString(today));
    setViewDate(alignViewDate(today));
    onChange(isoDateString(today));
    closePanel();
  };

  const clearDate = () => {
    setInputValue("");
    setViewDate(alignViewDate(null));
    onChange("");
    closePanel();
  };

  const changeViewMonth = React.useCallback(
    (monthDelta: number) => {
      setViewDate(
        (date) =>
          new Date(
            date.getFullYear(),
            date.getMonth() + monthDelta,
            1,
          ),
      );
    },
    [],
  );

  const applyTypedValue = React.useCallback(
    (nextInputValue: string) => {
      const nextDate =
        parseTypedDateString(nextInputValue);

      if (!nextInputValue || !nextDate) {
        onChange("");
        return;
      }

      setViewDate(alignViewDate(nextDate));
      onChange(isoDateString(nextDate));
    },
    [onChange],
  );

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextInputValue = normalizeTypedDateValue(
      event.target.value,
    );

    setInputValue(nextInputValue);
    applyTypedValue(nextInputValue);
  };

  const handleInputBlur = () => {
    isInputFocusedRef.current = false;
    const nextInputValue =
      normalizeTypedDateValue(inputValue);
    const nextDate =
      parseTypedDateString(nextInputValue);

    if (!nextInputValue || !nextDate) {
      setInputValue(nextInputValue);
      onChange("");
      return;
    }

    const normalizedInputValue =
      displayDateString(nextDate);

    setInputValue(normalizedInputValue);
    setViewDate(alignViewDate(nextDate));
    onChange(isoDateString(nextDate));
  };

  const panel = (
    <div
      ref={panelRef}
      id={panelId}
      className="swb-date-picker__panel is-floating"
      data-date-picker-panel
      role="dialog"
      aria-modal="false"
      aria-label="Choisir une date"
      tabIndex={-1}
      style={panelStyle}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="swb-date-picker__header">
        <div className="swb-date-picker__nav-group">
          <button
            type="button"
            className="swb-date-picker__nav"
            aria-label="Année précédente"
            onClick={() => changeViewMonth(-12)}
          >
            <ChevronsLeft
              className="swb-date-picker__nav-icon"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="swb-date-picker__nav"
            aria-label="Mois précédent"
            onClick={() => changeViewMonth(-1)}
          >
            <ChevronLeft
              className="swb-date-picker__nav-icon"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          className="swb-date-picker__month"
          aria-live="polite"
        >
          {monthLabel}
        </div>

        <div className="swb-date-picker__nav-group">
          <button
            type="button"
            className="swb-date-picker__nav"
            aria-label="Mois suivant"
            onClick={() => changeViewMonth(1)}
          >
            <ChevronRight
              className="swb-date-picker__nav-icon"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="swb-date-picker__nav"
            aria-label="Année suivante"
            onClick={() => changeViewMonth(12)}
          >
            <ChevronsRight
              className="swb-date-picker__nav-icon"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div className="swb-date-picker__weekdays">
        {DEFAULT_WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="swb-date-picker__grid">
        {days.map(({ date, isoValue }) => {
          const classNames = [
            "swb-date-picker__day",
            date.getMonth() !== viewDate.getMonth()
              ? "is-outside"
              : "",
            isoValue === todayIso ? "is-today" : "",
            selectedIso && isoValue === selectedIso
              ? "is-selected"
              : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={isoValue}
              type="button"
              className={classNames}
              data-value={isoValue}
              aria-label={getDayLabel(date, locale)}
              onClick={() => selectDate(date, isoValue)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="swb-date-picker__footer">
        <button
          type="button"
          className="swb-date-picker__footer-btn"
          onClick={selectToday}
        >
          Aujourd&apos;hui
        </button>
        <button
          type="button"
          className="swb-date-picker__footer-btn swb-date-picker__footer-btn--muted"
          onClick={clearDate}
        >
          Effacer
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className={[
        "swb-date-picker",
        isOpen ? "is-open" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-date-picker
    >
      <input
        id={id}
        className={[
          "swb-date-picker__input",
          inputClassName ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        value={inputValue}
        disabled={disabled}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={openPanel}
        onFocus={() => {
          isInputFocusedRef.current = true;
        }}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            openPanel();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            closePanel();
          }
        }}
      />

      <button
        type="button"
        className="swb-date-picker__toggle"
        data-date-picker-toggle
        aria-label="Choisir une date"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          togglePanel();
        }}
      >
        <CalendarIcon />
      </button>

      {!isOpen ? (
        <div
          id={panelId}
          className="swb-date-picker__panel"
          data-date-picker-panel
          hidden
        />
      ) : null}

      {isOpen && isMounted
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}

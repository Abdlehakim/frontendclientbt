export {};

declare global {
  interface Window {
    AppDatePicker?: SWBDatePickerAPI;
  }
}

type SWBDatePickerLabels = {
  today: string;
  clear: string;
  prevMonth: string;
  nextMonth: string;
  dialog: string;
};

type SWBDatePickerOptions = {
  weekdays?: string[];
  labels?: Partial<SWBDatePickerLabels>;
  locale?: string;
  allowManualInput?: boolean;
  monthFormatter?: { format: (date: Date) => string };
  onChange?: (value: string) => void;
};

type SWBDatePickerController = {
  setValue: (value: string | Date, opts?: { silent?: boolean }) => void;
  close: () => void;
  open: () => void;
};

type SWBDatePickerAPI = {
  create: (input: HTMLElement, options?: SWBDatePickerOptions) => SWBDatePickerController | null;
};

type SWBDatePickerInput = HTMLInputElement & {
  __swbDatePickerController?: SWBDatePickerController;
};

(function initSWBDatePicker(w: Window) {
  const noop = () => undefined;

  const DEFAULT_WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
  const DEFAULT_LABELS: SWBDatePickerLabels = {
    today: "Aujourd'hui",
    clear: "Effacer",
    prevMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    dialog: "Choisir une date",
  };

  const isoDateString = (date: unknown) => {
    if (!(date instanceof Date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateString = (value: unknown): Date | null => {
    if (!value || typeof value !== "string") return null;
    const parts = value.split("-");
    if (parts.length !== 3) return null;

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!year || !month || !day) return null;

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
  };

  const alignViewDate = (date: unknown) => {
    if (!(date instanceof Date)) return new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const emitInputAndChange = (input: HTMLInputElement) => {
    try {
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } catch {
      noop();
    }
    try {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      noop();
    }
  };

  if (!w.AppDatePicker) {
    w.AppDatePicker = {
      create: () => null,
    };
  }

  w.AppDatePicker.create = function createDatePicker(
    inputEl: HTMLElement,
    options: SWBDatePickerOptions = {},
  ): SWBDatePickerController | null {
    if (!(inputEl instanceof HTMLInputElement)) return null;

    const input = inputEl as SWBDatePickerInput;
    if (input.__swbDatePickerController) return input.__swbDatePickerController;

    const wrapper =
      (input.closest("[data-date-picker]") as HTMLElement | null) ||
      (input.parentElement?.closest("[data-date-picker]") as HTMLElement | null);

    if (!wrapper) return null;

    const toggle = wrapper.querySelector("[data-date-picker-toggle]") as HTMLElement | null;
    const panel = wrapper.querySelector("[data-date-picker-panel]") as HTMLElement | null;
    if (!toggle || !panel) return null;

    const locale =
      options.locale ||
      (typeof navigator !== "undefined" && navigator.language ? navigator.language : "fr-FR");

    const weekdays =
      Array.isArray(options.weekdays) && options.weekdays.length === 7 ? options.weekdays : DEFAULT_WEEKDAYS;

    const labels: SWBDatePickerLabels = { ...DEFAULT_LABELS, ...(options.labels || {}) };

    const allowManualInput = Boolean(options.allowManualInput);

    const monthFormatter: { format: (date: Date) => string } =
      options.monthFormatter ??
      (() => {
        try {
          const fmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
          return { format: (d: Date) => fmt.format(d) };
        } catch {
          noop();
        }
        try {
          const fmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
          return { format: (d: Date) => fmt.format(d) };
        } catch {
          noop();
        }
        return {
          format: (d: Date) => {
            try {
              const m = d.toLocaleString(undefined, { month: "long" });
              return `${m} ${d.getFullYear()}`;
            } catch {
              noop();
              return `${d.getFullYear()}`;
            }
          },
        };
      })();

    input.type = "text";
    input.readOnly = !allowManualInput;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.inputMode = "numeric";
    input.setAttribute("aria-haspopup", "dialog");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("role", "combobox");

    toggle.setAttribute("aria-haspopup", "dialog");
    toggle.setAttribute("aria-expanded", "false");

    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-label", labels.dialog);
    panel.tabIndex = -1;

    if (!panel.id) {
      const safeId = input.id || `swbDatePicker${Date.now()}`;
      panel.id = `${safeId}Panel`;
    }

    input.setAttribute("aria-controls", panel.id);
    toggle.setAttribute("aria-controls", panel.id);

    const header = document.createElement("div");
    header.className = "swb-date-picker__header";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "swb-date-picker__nav";
    prevBtn.setAttribute("aria-label", labels.prevMonth);
    prevBtn.innerHTML = '<span aria-hidden="true">&lt;</span>';

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "swb-date-picker__nav";
    nextBtn.setAttribute("aria-label", labels.nextMonth);
    nextBtn.innerHTML = '<span aria-hidden="true">&gt;</span>';

    const monthLabel = document.createElement("div");
    monthLabel.className = "swb-date-picker__month";
    monthLabel.setAttribute("aria-live", "polite");

    header.append(prevBtn, monthLabel, nextBtn);

    const weekdaysRow = document.createElement("div");
    weekdaysRow.className = "swb-date-picker__weekdays";
    weekdays.forEach((txt) => {
      const span = document.createElement("span");
      span.textContent = txt;
      weekdaysRow.appendChild(span);
    });

    const daysGrid = document.createElement("div");
    daysGrid.className = "swb-date-picker__grid";

    const footer = document.createElement("div");
    footer.className = "swb-date-picker__footer";

    const todayBtn = document.createElement("button");
    todayBtn.type = "button";
    todayBtn.className = "swb-date-picker__footer-btn";
    todayBtn.textContent = labels.today;

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "swb-date-picker__footer-btn swb-date-picker__footer-btn--muted";
    clearBtn.textContent = labels.clear;

    footer.append(todayBtn, clearBtn);

    panel.innerHTML = "";
    panel.append(header, weekdaysRow, daysGrid, footer);

    const panelPlaceholder = document.createComment("swb-date-picker__panel-placeholder");
    if (panel.parentNode) {
      try {
        panel.parentNode.insertBefore(panelPlaceholder, panel);
      } catch {
        noop();
      }
    }

    let detachRelayout: null | (() => void) = null;
    let panelPortaled = false;

    const relayoutFloatingPanel = () => {
      const gap = 6;
      const gutter = 12;

      const wrapperRect = wrapper.getBoundingClientRect();
      const width = Math.min(320, Math.max(wrapperRect.width, 220));

      const left = Math.min(
        Math.max(wrapperRect.left, gutter),
        Math.max(gutter, window.innerWidth - width - gutter),
      );

      let top = wrapperRect.bottom + gap;

      const panelHeight = panel.offsetHeight || 0;
      if (panelHeight) {
        const overflowBottom = top + panelHeight + gutter - window.innerHeight;
        if (overflowBottom > 0) {
          const flippedTop = wrapperRect.top - panelHeight - gap;
          top =
            flippedTop >= gutter
              ? flippedTop
              : Math.max(gutter, window.innerHeight - panelHeight - gutter);
        }
      }

      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.width = `${Math.round(width)}px`;
      panel.style.minWidth = `${Math.round(width)}px`;
      panel.style.maxWidth = "320px";
      panel.style.zIndex = "100010";
    };

    const detachPanelListeners = () => {
      if (detachRelayout) {
        detachRelayout();
        detachRelayout = null;
      }
    };

    const restorePanel = () => {
      detachPanelListeners();
      panel.classList.remove("is-floating");
      panel.style.position = "";
      panel.style.left = "";
      panel.style.top = "";
      panel.style.width = "";
      panel.style.minWidth = "";
      panel.style.maxWidth = "";
      panel.style.zIndex = "";

      if (panelPlaceholder.parentNode && panel.parentNode !== panelPlaceholder.parentNode) {
        try {
          panelPlaceholder.parentNode.insertBefore(panel, panelPlaceholder);
        } catch {
          noop();
        }
      }

      panelPortaled = false;
    };

    const portalPanelToBody = () => {
      if (panelPortaled) {
        relayoutFloatingPanel();
        return;
      }

      if (panel.parentNode !== document.body) {
        try {
          document.body.appendChild(panel);
        } catch {
          noop();
        }
      }

      panel.classList.add("is-floating");
      panel.style.position = "fixed";

      const handleRelayout = () => relayoutFloatingPanel();
      relayoutFloatingPanel();

      window.addEventListener("resize", handleRelayout);
      window.addEventListener("scroll", handleRelayout, true);

      detachRelayout = () => {
        window.removeEventListener("resize", handleRelayout);
        window.removeEventListener("scroll", handleRelayout, true);
      };

      panelPortaled = true;
    };

    let selectedDate: Date | null = parseDateString(input.value);
    let viewDate = alignViewDate(selectedDate || new Date());
    let isOpen = false;

    const closePanel = () => {
      if (!isOpen) return;
      isOpen = false;

      wrapper.classList.remove("is-open");
      restorePanel();
      panel.hidden = true;

      input.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-expanded", "false");

      document.removeEventListener("click", outsideClick);
      document.removeEventListener("keydown", handleKeydown, true);
    };

    const outsideClick = (evt: MouseEvent) => {
      if (!isOpen) return;
      const target = evt.target as Node | null;
      if (!target) return;
      if (wrapper.contains(target) || panel.contains(target)) return;
      closePanel();
    };

    const handleKeydown = (evt: KeyboardEvent) => {
      if (!isOpen) return;
      if (evt.key === "Escape") {
        evt.preventDefault();
        closePanel();
        try {
          toggle.focus();
        } catch {
          noop();
        }
      }
    };

    const formatMonth = (d: Date) => {
      try {
        const txt = monthFormatter.format(d);
        return txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : "";
      } catch {
        noop();
        return "";
      }
    };

    const emitValueChange = () => {
      emitInputAndChange(input);
      if (typeof options.onChange === "function") {
        try {
          options.onChange(input.value);
        } catch {
          noop();
        }
      }
    };

    const renderCalendar = () => {
      monthLabel.textContent = formatMonth(viewDate);

      const startOffset = ((viewDate.getDay() + 6) % 7) || 0;
      const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
      const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

      const todayIso = isoDateString(new Date());
      const selectedIso = selectedDate ? isoDateString(selectedDate) : "";

      daysGrid.innerHTML = "";

      for (let idx = 0; idx < totalCells; idx += 1) {
        const dayNumber = idx - startOffset + 1;
        const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNumber);
        const isoValue = isoDateString(cellDate);

        const dayBtn = document.createElement("button");
        dayBtn.type = "button";
        dayBtn.className = "swb-date-picker__day";
        dayBtn.textContent = String(cellDate.getDate());
        dayBtn.dataset.value = isoValue;

        if (cellDate.getMonth() !== viewDate.getMonth()) dayBtn.classList.add("is-outside");
        if (isoValue === todayIso) dayBtn.classList.add("is-today");
        if (selectedIso && isoValue === selectedIso) dayBtn.classList.add("is-selected");

        try {
          const dayLabel = cellDate.toLocaleDateString(locale, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          dayBtn.setAttribute("aria-label", dayLabel);
        } catch {
          noop();
        }

        dayBtn.addEventListener("click", () => {
          selectedDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
          viewDate = alignViewDate(selectedDate);
          input.value = isoValue;
          renderCalendar();
          emitValueChange();
          closePanel();
        });

        daysGrid.appendChild(dayBtn);
      }
    };

    const openPanel = () => {
      if (isOpen) return;
      isOpen = true;

      wrapper.classList.add("is-open");
      panel.hidden = false;

      input.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-expanded", "true");

      renderCalendar();
      portalPanelToBody();

      document.addEventListener("click", outsideClick);
      document.addEventListener("keydown", handleKeydown, true);

      requestAnimationFrame(() => {
        try {
          panel.focus();
        } catch {
          noop();
        }
      });
    };

    prevBtn.addEventListener("click", () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      renderCalendar();
    });

    nextBtn.addEventListener("click", () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      renderCalendar();
    });

    todayBtn.addEventListener("click", () => {
      selectedDate = new Date();
      viewDate = alignViewDate(selectedDate);
      input.value = isoDateString(selectedDate);
      renderCalendar();
      emitValueChange();
      closePanel();
    });

    clearBtn.addEventListener("click", () => {
      selectedDate = null;
      input.value = "";
      viewDate = alignViewDate(new Date());
      renderCalendar();
      emitValueChange();
      closePanel();
    });

    toggle.addEventListener("click", (evt) => {
      evt.preventDefault();
      if (isOpen) closePanel();
      else openPanel();
    });

    input.addEventListener("click", () => openPanel());

    input.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        openPanel();
      }
      if (evt.key === "Escape") {
        evt.preventDefault();
        closePanel();
      }
    });

    const controller: SWBDatePickerController = {
      setValue(value: string | Date, { silent = true }: { silent?: boolean } = {}) {
        let nextDate: Date | null = null;

        if (value instanceof Date) {
          if (!Number.isNaN(value.getTime())) {
            nextDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
          }
        } else if (typeof value === "string" && value) {
          nextDate = parseDateString(value);
        }

        selectedDate = nextDate;

        if (selectedDate) {
          viewDate = alignViewDate(selectedDate);
          input.value = isoDateString(selectedDate);
        } else {
          input.value = "";
        }

        renderCalendar();
        if (!silent) emitValueChange();
      },
      close: () => closePanel(),
      open: () => openPanel(),
    };

    input.__swbDatePickerController = controller;
    renderCalendar();
    return controller;
  };
})(window);

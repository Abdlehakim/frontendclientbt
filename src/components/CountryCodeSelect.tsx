import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { MdOutlineArrowDropDownCircle } from "react-icons/md";

type CountryCodeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  variant?: "auth" | "emerald";
};

const countryCodes = [
  { label: "USA (+1)", value: "+1" },
  { label: "Tunisia (+216)", value: "+216" },
  { label: "France (+33)", value: "+33" },
  { label: "Canada (+1)", value: "+1" },
  { label: "Germany (+49)", value: "+49" },
  { label: "Italy (+39)", value: "+39" },
  { label: "Spain (+34)", value: "+34" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "UAE (+971)", value: "+971" },
  { label: "Saudi Arabia (+966)", value: "+966" },
];

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

function CheckIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

export function CountryCodeSelect({
  value,
  onChange,
  id = "countryCode",
  label = "Country code",
  className = "",
  buttonClassName = "",
  variant = "auth",
}: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selected = countryCodes.find((country) => country.value === value) ?? countryCodes[0];
  const isEmerald = variant === "emerald";
  const labelClassName = isEmerald ? "text-xs font-semibold text-gray-700 mb-1" : "text-[15px] font-bold text-gray-900";
  const buttonClassNameByVariant = isEmerald
    ? [
        "form-control form-control--select w-full inline-flex items-center justify-between gap-2 rounded-md border",
        "text-sm font-medium cursor-pointer truncate bg-emerald-50 text-emerald-800",
        "hover:bg-emerald-100 border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400",
      ].join(" ")
    : [
        "flex h-11 w-full items-center justify-between rounded-[5px]",
        "border border-[#b9d3ff] bg-white px-4 text-left",
        "text-[16px] font-medium text-gray-900 shadow-sm",
        "outline-none transition",
        open ? "border-[#6ea8ff] ring-2 ring-[#d9eaff]" : "hover:border-[#8bbcff]",
      ].join(" ");
  const iconClassName = isEmerald ? "flex items-center justify-center text-emerald-800" : "flex h-7 w-7 items-center justify-center text-gray-800";

  function updateDropdownPosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    function handlePositionChange() {
      updateDropdownPosition();
    }

    window.addEventListener("resize", handlePositionChange);
    window.addEventListener("scroll", handlePositionChange, true);

    return () => {
      window.removeEventListener("resize", handlePositionChange);
      window.removeEventListener("scroll", handlePositionChange, true);
    };
  }, [open]);

  const dropdownContainerClassName = isEmerald
    ? "rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
    : "rounded-md border border-gray-200 bg-white p-1.5 shadow-xl";

  const dropdownMenu =
    open && dropdownPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            className={dropdownContainerClassName}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999,
              ...(isEmerald ? {} : { maxHeight: 256, overflowY: "auto" }),
            } as CSSProperties}
          >
            {countryCodes.map((country, index) => {
              const isSelected = country.value === value && country.label === selected.label;

              return isEmerald ? (
                <button
                  key={`${country.label}-${index}`}
                  type="button"
                  onClick={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                  className={[
                    "w-full px-3 py-2 text-sm text-left flex items-center gap-2",
                    isSelected ? "bg-emerald-50 text-emerald-700" : "text-slate-700",
                    "hover:bg-emerald-100 hover:text-emerald-800",
                  ].join(" ")}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span
                    className={[
                      "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                      isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent",
                    ].join(" ")}
                  >
                    <CheckIcon />
                  </span>
                  <span className="truncate">{country.label}</span>
                </button>
              ) : (
                <button
                  key={`${country.label}-${index}`}
                  type="button"
                  onClick={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                  className={[
                    "w-full rounded-sm px-3 py-2 text-left text-xs font-medium transition",
                    isSelected ? "bg-[#d7e8ff] text-[#163d6d]" : "text-gray-800 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {country.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapperRef} className={["relative flex flex-col", isEmerald ? "" : "gap-1.5", className].join(" ")}>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>

      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => {
          if (!open) updateDropdownPosition();
          setOpen((current) => !current);
        }}
        className={[
          buttonClassNameByVariant,
          buttonClassName,
        ].join(" ")}
      >
        <span className="truncate">{selected.label}</span>

        <span className={iconClassName}>
          {isEmerald ? (
            open ? (
              <IoIosArrowDropup className="shrink-0" size={18} />
            ) : (
              <IoIosArrowDropdown className="shrink-0" size={18} />
            )
          ) : (
            <MdOutlineArrowDropDownCircle
              size={24}
              className={["transition-transform duration-200", open ? "rotate-180" : "rotate-0"].join(" ")}
            />
          )}
        </span>
      </button>

      {dropdownMenu}
    </div>
  );
}

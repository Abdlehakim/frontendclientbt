import { useEffect, useRef, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { CheckIcon } from "../../icons";

export default function SelectDropdown<T extends string>({
  label,
  value,
  onChange,
  options,
  getOptionLabel,
}: {
  label: string;
  value: string;
  onChange: (v: T) => void;
  options: readonly T[];
  getOptionLabel?: (v: T) => string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const display = (v: string) => {
    const matched = options.find((opt) => opt === v);
    if (matched && getOptionLabel) return getOptionLabel(matched);
    return v;
  };

  const shown = (value ?? "").trim() ? display((value ?? "").trim()) : "Choisir...";

  return (
    <div className="flex flex-col" ref={wrapRef}>
      <label className="mb-1 text-xs font-semibold text-gray-700">{label}</label>

      <button
        type="button"
        className="inline-flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-xs">{shown}</span>
        {open ? <IoIosArrowDropup className="shrink-0" size={18} /> : <IoIosArrowDropdown className="shrink-0" size={18} />}
      </button>

      {open ? (
        <div className="relative">
          <div
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-emerald-200 bg-white shadow-lg"
            role="listbox"
          >
            {options.map((opt) => {
              const selected = opt === value;
              const labelText = getOptionLabel ? getOptionLabel(opt) : opt;

              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs",
                    selected ? "bg-emerald-50 text-emerald-700" : "text-slate-700",
                    "hover:bg-emerald-100 hover:text-emerald-800",
                  ].join(" ")}
                  role="option"
                  aria-selected={selected}
                >
                  <span
                    className={[
                      "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                      selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent",
                    ].join(" ")}
                  >
                    <CheckIcon />
                  </span>
                  <span className=" text-xs">{labelText}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
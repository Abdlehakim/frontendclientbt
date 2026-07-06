import { useEffect, useRef, useState } from "react";
import { MdOutlineArrowDropDownCircle } from "react-icons/md";

type CountryCodeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
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

export function CountryCodeSelect({
  value,
  onChange,
  id = "countryCode",
  label = "Country code",
  className = "",
  buttonClassName = "h-12",
}: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = countryCodes.find((country) => country.value === value) ?? countryCodes[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
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

  return (
    <div ref={wrapperRef} className={["relative flex flex-col gap-1.5", className].join(" ")}>
      <label htmlFor={id} className="text-[15px] font-bold text-gray-900">
        {label}
      </label>

      <button
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          "flex w-full items-center justify-between rounded-[5px]",
          "border border-[#b9d3ff] bg-white px-4 text-left",
          "text-[16px] font-medium text-gray-900 shadow-sm",
          "outline-none transition",
          buttonClassName,
          open ? "border-[#6ea8ff] ring-2 ring-[#d9eaff]" : "hover:border-[#8bbcff]",
        ].join(" ")}
      >
        <span>{selected.label}</span>

        <span className="flex h-7 w-7 items-center justify-center text-gray-800">
          <MdOutlineArrowDropDownCircle
            size={24}
            className={["transition-transform duration-200", open ? "rotate-180" : "rotate-0"].join(" ")}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-1.5 shadow-xl">
          {countryCodes.map((country, index) => {
            const isSelected = country.value === value && country.label === selected.label;

            return (
              <button
                key={`${country.label}-${index}`}
                type="button"
                onClick={() => {
                  onChange(country.value);
                  setOpen(false);
                }}
                className={[
                  "w-full rounded-sm px-3.5 py-2.5 text-left text-[15px] font-medium transition",
                  isSelected ? "bg-[#d7e8ff] text-[#163d6d]" : "text-gray-800 hover:bg-gray-100",
                ].join(" ")}
              >
                {country.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

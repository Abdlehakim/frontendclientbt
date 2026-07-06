type CountryCodeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  className?: string;
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
}: CountryCodeSelectProps) {
  return (
    <div className={["flex flex-col gap-1.5", className].join(" ")}>
      <label htmlFor={id} className="text-[15px] font-bold text-gray-900">
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[5px] border border-[#b9d3ff] bg-white px-4 text-[16px] font-medium text-gray-900 shadow-sm outline-none transition focus:border-[#6ea8ff] focus:ring-2 focus:ring-[#d9eaff]"
      >
        {countryCodes.map((country, index) => (
          <option key={`${country.label}-${index}`} value={country.value}>
            {country.label}
          </option>
        ))}
      </select>
    </div>
  );
}

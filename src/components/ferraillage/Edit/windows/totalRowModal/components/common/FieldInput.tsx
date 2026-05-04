export default function FieldInput({
  label,
  value,
  onChange,
  inputClass,
  placeholder,
  inputMode = "decimal",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputClass: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
  className?: string;
}) {
  return (
    <div className={["flex flex-col", className].join(" ")}>
      <label className="mb-1 text-sm font-semibold text-gray-700">{label}</label>
      <input
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </div>
  );
}
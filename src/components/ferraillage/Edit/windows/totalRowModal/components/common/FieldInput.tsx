export default function FieldInput({
  label,
  value,
  onChange,
  inputClass,
  placeholder,
  type = "text",
  step,
  inputMode = "decimal",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputClass: string;
  placeholder?: string;
  type?: "text" | "number";
  step?: number | string;
  inputMode?: "decimal" | "numeric" | "text";
  className?: string;
}) {
  return (
    <div className={["flex flex-col", className].join(" ")}>
      <label className="mb-1 text-xs font-semibold text-gray-700">{label}</label>
      <input
        className={[inputClass, type === "number" ? "input-no-spinner" : ""].join(" ").trim()}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        inputMode={inputMode}
      />
    </div>
  );
}

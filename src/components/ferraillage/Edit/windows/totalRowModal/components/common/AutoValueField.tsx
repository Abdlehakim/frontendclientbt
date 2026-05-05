import type { CSSProperties } from "react";

export default function AutoValueField({
  label,
  value,
  inputClass,
  style,
}: {
  label: string;
  value: string;
  inputClass: string;
  style: CSSProperties;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-semibold text-gray-700 truncate">{label}</label>
      <input
        className={[inputClass, "font-semibold"].join(" ")}
        value={value}
        readOnly
        aria-readonly="true"
        style={style}
      />
    </div>
  );
}
import type { CSSProperties } from "react";

export default function AutoResultFields({
  inputClass,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  style,
}: {
  inputClass: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  style: CSSProperties;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-semibold text-gray-700">{leftLabel}</label>
        <input
          className={[inputClass, "font-semibold"].join(" ")}
          value={leftValue}
          readOnly
          aria-readonly="true"
          style={style}
        />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-sm font-semibold text-gray-700">{rightLabel}</label>
        <input
          className={[inputClass, "font-semibold"].join(" ")}
          value={rightValue}
          readOnly
          aria-readonly="true"
          style={style}
        />
      </div>
    </div>
  );
}
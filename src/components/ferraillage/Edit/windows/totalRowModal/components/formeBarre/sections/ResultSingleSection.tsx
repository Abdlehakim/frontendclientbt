import AutoValueField from "../../common/AutoValueField";

export default function ResultSingleSection({
  inputClass,
  qteValue,
  ntValue,
}: {
  inputClass: string;
  qteValue: string;
  ntValue: string;
}) {
  const blueAutoStyle = {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
    color: "#1E40AF",
  } as const;

  return (
    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
      <AutoValueField
        label="Q. Fer (m)"
        value={qteValue}
        inputClass={inputClass}
        style={blueAutoStyle}
      />
      <AutoValueField
        label="N.T.Barres façonnées"
        value={ntValue}
        inputClass={inputClass}
        style={blueAutoStyle}
      />
    </div>
  );
}

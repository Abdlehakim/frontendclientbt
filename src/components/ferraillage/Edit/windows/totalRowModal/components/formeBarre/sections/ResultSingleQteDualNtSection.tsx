import AutoValueField from "../../common/AutoValueField";

export default function ResultSingleQteDualNtSection({
  inputClass,
  qteValue,
  ntA,
  ntB,
}: {
  inputClass: string;
  qteValue: string;
  ntA: string;
  ntB: string;
}) {
  const blueAutoStyle = {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
    color: "#1E40AF",
  } as const;

  return (
    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-3">
      <AutoValueField
        label="Q. Fer (m)"
        value={qteValue}
        inputClass={inputClass}
        style={blueAutoStyle}
      />
      <AutoValueField
        label="N.T.B façonnées / a"
        value={ntA}
        inputClass={inputClass}
        style={blueAutoStyle}
      />
      <AutoValueField
        label="N.T.B façonnées / b"
        value={ntB}
        inputClass={inputClass}
        style={blueAutoStyle}
      />
    </div>
  );
}

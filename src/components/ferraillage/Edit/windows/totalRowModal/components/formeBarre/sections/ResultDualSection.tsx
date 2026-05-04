import AutoValueField from "../../common/AutoValueField";

export default function ResultDualSection({
  inputClass,
  qteLabelA,
  qteLabelB,
  ntLabelA,
  ntLabelB,
  qteA,
  qteB,
  ntA,
  ntB,
}: {
  inputClass: string;
  qteLabelA: string;
  qteLabelB: string;
  ntLabelA: string;
  ntLabelB: string;
  qteA: string;
  qteB: string;
  ntA: string;
  ntB: string;
}) {
  const blueAutoStyle = {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
    color: "#1E40AF",
  } as const;

  return (
    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2 xl:grid-cols-4">
      <AutoValueField label={qteLabelA} value={qteA} inputClass={inputClass} style={blueAutoStyle} />
      <AutoValueField label={ntLabelA} value={ntA} inputClass={inputClass} style={blueAutoStyle} />
      <AutoValueField label={qteLabelB} value={qteB} inputClass={inputClass} style={blueAutoStyle} />
      <AutoValueField label={ntLabelB} value={ntB} inputClass={inputClass} style={blueAutoStyle} />
    </div>
  );
}

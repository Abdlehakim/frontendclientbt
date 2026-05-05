import AutoValueField from "../../common/AutoValueField";
import { getSlabAxisLabels } from "../../../config/formeBarreLabels";

export default function ResultSingleQteDualNtSection({
  inputClass,
  normalizedDesignation,
  qteValue,
  ntA,
  ntB,
}: {
  inputClass: string;
  normalizedDesignation: string;
  qteValue: string;
  ntA: string;
  ntB: string;
}) {
  const slabAxisLabels = getSlabAxisLabels(normalizedDesignation);
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
        label={slabAxisLabels.ntParallelALabel}
        value={ntA}
        inputClass={inputClass}
        style={blueAutoStyle}
      />
      <AutoValueField
        label={slabAxisLabels.ntParallelBLabel}
        value={ntB}
        inputClass={inputClass}
        style={blueAutoStyle}
      />
    </div>
  );
}

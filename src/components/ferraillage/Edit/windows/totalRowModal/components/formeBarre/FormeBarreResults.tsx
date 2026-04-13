import type { FormeBarreResult } from "../../hooks/useFormeBarreResult";
import ResultDualSection from "./sections/ResultDualSection";
import ResultSingleSection from "./sections/ResultSingleSection";

export default function FormeBarreResults({
  inputClass,
  result,
}: {
  inputClass: string;
  result: FormeBarreResult;
}) {
  if (result.kind === "dual") {
    return (
      <div className="sm:col-span-2">
        <ResultDualSection
          inputClass={inputClass}
          qteLabelA={result.qteLabelA}
          qteLabelB={result.qteLabelB}
          ntLabelA={result.ntLabelA}
          ntLabelB={result.ntLabelB}
          qteA={result.qteA}
          qteB={result.qteB}
          ntA={result.ntA}
          ntB={result.ntB}
        />
      </div>
    );
  }

  return (
    <div className="sm:col-span-2">
      <ResultSingleSection
        inputClass={inputClass}
        qteValue={result.qteValue}
        ntValue={result.ntValue}
      />
    </div>
  );
}


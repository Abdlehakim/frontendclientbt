import type { FormeState } from "../../types";
import FieldInput from "../common/FieldInput";
import type { FormeBarrePatch, SlabAutoValuesView, SlabView } from "./FormeBarreFields.types";

export default function SlabLinearMetricInputs({
  x,
  slab,
  slabAutoValues,
  inputClass,
  onPatch,
}: {
  x: FormeState;
  slab: SlabView;
  slabAutoValues: SlabAutoValuesView;
  inputClass: string;
  onPatch: FormeBarrePatch;
}) {
  if (slab.isSlabSurfacePerM2SpacingMode) {
    return (
      <>
        <FieldInput
          label="Surface totale (m²)"
          value={x.slabSurfaceStr ?? "0"}
          onChange={(value) => onPatch({ slabSurfaceStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 24,5"
        />
        <FieldInput
          label="Périmètre"
          value={slabAutoValues.slabPerimetreStr}
          onChange={(value) => onPatch({ slabPerimetreStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 18"
        />
        <FieldInput
          label="Ancrage / mètre linéaire"
          value={slabAutoValues.slabAncrageLineaireStr}
          onChange={(value) => onPatch({ slabAncrageLineaireStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,4"
        />
      </>
    );
  }

  if (slab.slabSurfacePerM2Mode) {
    return (
      <>
        <FieldInput
          label="Périmètre"
          value={slabAutoValues.slabPerimetreStr}
          onChange={(value) => onPatch({ slabPerimetreStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,4"
        />

        <FieldInput
          label="Ancrage / mètre linéaire"
          value={slabAutoValues.slabAncrageLineaireStr}
          onChange={(value) => onPatch({ slabAncrageLineaireStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,4"
        />
      </>
    );
  }

  return (
    <FieldInput
      label="Ancrage (m)"
      value={x.ancrageStr}
      onChange={(value) => onPatch({ ancrageStr: value })}
      inputClass={inputClass}
      placeholder="Ex: 0,4"
    />
  );
}

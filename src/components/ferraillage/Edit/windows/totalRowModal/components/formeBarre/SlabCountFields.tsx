import type { FormeState } from "../../types";
import { SLAB_SPACING_MODES } from "../../config/formeBarreOptions";
import { getSlabSpacingModeLabel } from "../../config/formeBarreLabels";
import FieldInput from "../common/FieldInput";
import SelectDropdown from "../common/SelectDropdown";
import type { FormeBarrePatch, SlabView } from "./FormeBarreFields.types";

export default function SlabCountFields({
  x,
  slab,
  inputClass,
  onPatch,
}: {
  x: FormeState;
  slab: SlabView;
  inputClass: string;
  onPatch: FormeBarrePatch;
}) {
  const spacingModeOptions = slab.isSlabSurfacePerM2SpacingMode
    ? (["ESPACEMENT"] as const)
    : SLAB_SPACING_MODES;
  const showDiffNbBarSplitInputs =
    slab.slabEffectiveSpacingModeValue === "NB_CADRE" &&
    (slab.slabDiffSharedActive || slab.slabDiffDualActive);
  const showSharedNbBarInput =
    !showDiffNbBarSplitInputs &&
    (slab.showSlabSharedNbCadreInput || slab.showSlabModeAndSharedNbBarRow);
  const showDualNbBarInputs =
    showDiffNbBarSplitInputs ||
    slab.showSlabDualNbCadreInputs ||
    slab.showSlabModeAndDualNbBarRow;

  return (
    <>
      {showSharedNbBarInput ? (
        <div className="sm:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="flex flex-col">
            <SelectDropdown
              label="Mode de calcul"
              value={slab.slabSpacingModeValue}
              onChange={(value) => onPatch({ slabSpacingMode: value })}
              options={spacingModeOptions}
              getOptionLabel={getSlabSpacingModeLabel}
            />
          </div>

          <FieldInput
            label="Nb. Barres a et b"
            value={x.slabNbCadreAStr ?? "0"}
            onChange={(value) =>
              onPatch({
                slabNbCadreAStr: value,
                slabNbCadreBStr: value,
              })
            }
            inputClass={inputClass}
            placeholder="Ex: 10"
            inputMode="numeric"
          />
        </div>
      ) : null}

      {showDualNbBarInputs ? (
        <div className="sm:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="flex flex-col">
            <SelectDropdown
              label="Mode de calcul"
              value={slab.slabSpacingModeValue}
              onChange={(value) => onPatch({ slabSpacingMode: value })}
              options={spacingModeOptions}
              getOptionLabel={getSlabSpacingModeLabel}
            />
          </div>

          <FieldInput
            label="Nb. Barres /a"
            value={x.slabNbCadreAStr ?? "0"}
            onChange={(value) => onPatch({ slabNbCadreAStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 10"
            inputMode="numeric"
          />
          <FieldInput
            label="Nb. Barres /b"
            value={x.slabNbCadreBStr ?? "0"}
            onChange={(value) => onPatch({ slabNbCadreBStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 10"
            inputMode="numeric"
          />
        </div>
      ) : null}
    </>
  );
}


import type { FormeState } from "../../types";
import {
  SLAB_SPACING_MODES,
  SLAB_SPACING_RELATIONS,
} from "../../config/formeBarreOptions";
import {
  getSlabSpacingModeLabel,
  getSlabSpacingRelationLabel,
} from "../../config/formeBarreLabels";
import FieldInput from "../common/FieldInput";
import SelectDropdown from "../common/SelectDropdown";
import type { FormeBarrePatch, SlabView } from "./FormeBarreFields.types";

export default function SlabSpacingFields({
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
  const isNbBarMode = slab.slabEffectiveSpacingModeValue === "NB_CADRE";

  if (slab.showSlabSharedSpacingInput) {
    return (
      <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex flex-col">
          <SelectDropdown
            label="Mode de calcul"
            value={slab.slabSpacingModeValue}
            onChange={(v) => onPatch({ slabSpacingMode: v })}
            options={spacingModeOptions}
            getOptionLabel={getSlabSpacingModeLabel}
          />
        </div>

        <div className="flex flex-col">
          <SelectDropdown
            label="Re. Es."
            value={slab.slabSpacingRelationValue}
            onChange={(v) => onPatch({ slabSpacingRelation: v })}
            options={SLAB_SPACING_RELATIONS}
            getOptionLabel={getSlabSpacingRelationLabel}
          />
        </div>

        <FieldInput
          label="Es. a et b"
          value={x.slabEspacementAStr ?? "0"}
          onChange={(value) =>
            onPatch({
              slabEspacementAStr: value,
              slabEspacementBStr: value,
            })
          }
          inputClass={inputClass}
          placeholder="Ex: 0,2"
        />
      </div>
    );
  }

  if (slab.showSlabDualSpacingInputs) {
    return (
      <>
        {slab.showSlabSpacingMode ? (
          <>
            <div className="flex flex-col">
              <SelectDropdown
                label="Mode de calcul"
                value={slab.slabSpacingModeValue}
                onChange={(v) => onPatch({ slabSpacingMode: v })}
                options={spacingModeOptions}
                getOptionLabel={getSlabSpacingModeLabel}
              />
            </div>
            <div className="flex flex-col">
              <SelectDropdown
                label="Re. Es."
                value={slab.slabSpacingRelationValue}
                onChange={(v) => onPatch({ slabSpacingRelation: v })}
                options={SLAB_SPACING_RELATIONS}
                getOptionLabel={getSlabSpacingRelationLabel}
              />
            </div>
          </>
        ) : null}

        <FieldInput
          label="Es. a"
          value={x.slabEspacementAStr ?? "0"}
          onChange={(value) => onPatch({ slabEspacementAStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,2"
        />
        <FieldInput
          label="Es. b"
          value={x.slabEspacementBStr ?? "0"}
          onChange={(value) => onPatch({ slabEspacementBStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,2"
        />
      </>
    );
  }

  if (slab.showSlabSpacingMode && !isNbBarMode) {
    return (
      <>
        <div className="flex flex-col">
          <SelectDropdown
            label="Mode de calcul"
            value={slab.slabSpacingModeValue}
            onChange={(v) => onPatch({ slabSpacingMode: v })}
            options={spacingModeOptions}
            getOptionLabel={getSlabSpacingModeLabel}
          />
        </div>
        <div className="flex flex-col">
          <SelectDropdown
            label="Re. Es."
            value={slab.slabSpacingRelationValue}
            onChange={(v) => onPatch({ slabSpacingRelation: v })}
            options={SLAB_SPACING_RELATIONS}
            getOptionLabel={getSlabSpacingRelationLabel}
          />
        </div>
      </>
    );
  }

  return null;
}

import type { FormeState } from "../../types";
import {
  SLAB_CALC_METHODS,
  SLAB_RELATIONS,
} from "../../config/formeBarreOptions";
import {
  getSlabAxisLabels,
  getSlabCalcMethodLabel,
  getSlabRelationLabel,
} from "../../config/formeBarreLabels";
import FieldInput from "../common/FieldInput";
import SelectDropdown from "../common/SelectDropdown";
import type { FormeBarreBaseView, FormeBarrePatch, SlabView } from "./FormeBarreFields.types";
import SlabNappeSelect from "./SlabNappeSelect";

export default function SlabHeaderFields({
  x,
  base,
  slab,
  inputClass,
  onPatch,
}: {
  x: FormeState;
  base: FormeBarreBaseView;
  slab: SlabView;
  inputClass: string;
  onPatch: FormeBarrePatch;
}) {
  const resetSpacingPatch = {
    slabSpacingMode: "ESPACEMENT",
    slabSpacingRelation: "EA_EQ_EB",
  } as const;
  const slabAxisLabels = getSlabAxisLabels(base.normalizedDesignation);
  const slabCalcMethodOptions = base.isSlabSurfacePerM2SpacingDesignation
    ? SLAB_CALC_METHODS
    : (["SURFACE_TOTAL"] as const);
  const slabRelationOptions = slab.isSlabSurfacePerM2SpacingMode
    ? (["ab_equal_same_if", "ab_equal_diff_if"] as const)
    : SLAB_RELATIONS;

  return (
    <>
      <div className="flex flex-col">
        <SlabNappeSelect
          designation={base.normalizedDesignation}
          value={slab.slabNappeShown}
          onChange={(v) => onPatch({ barreCategorie: v })}
        />
      </div>

      <div className="flex flex-col">
        <SelectDropdown
          label="Méthode de calcul"
          value={slab.slabCalcMethodValue}
          onChange={(v) => onPatch({ slabCalcMethod: v })}
          options={slabCalcMethodOptions}
          getOptionLabel={getSlabCalcMethodLabel}
        />
      </div>

      {slab.showSlabRelationField && slab.showSlabCombinedLengthRow ? (
        <>
          <div className="flex flex-col">
            <SelectDropdown
              label={slabAxisLabels.relationFieldLabel}
              value={slab.slabRelationValue}
              onChange={(v) =>
                onPatch({
                  slabRelation: v,
                  ...resetSpacingPatch,
                })
              }
              options={slabRelationOptions}
              getOptionLabel={(value) => getSlabRelationLabel(value, base.normalizedDesignation)}
            />
          </div>

          <FieldInput
            label={slabAxisLabels.lengthSharedLabel}
            value={x.slabLongueurAStr ?? "0"}
            onChange={(value) =>
              onPatch({
                slabLongueurAStr: value,
                slabLongueurBStr: value,
              })
            }
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
        </>
      ) : slab.showSlabRelationField ? (
        <div className="flex flex-col sm:col-span-2">
          <SelectDropdown
            label={slabAxisLabels.relationFieldLabel}
            value={slab.slabRelationValue}
            onChange={(v) =>
              onPatch({
                slabRelation: v,
                ...resetSpacingPatch,
              })
            }
            options={slabRelationOptions}
            getOptionLabel={(value) => getSlabRelationLabel(value, base.normalizedDesignation)}
          />
        </div>
      ) : null}

      {slab.showSlabSeparateLengthRow ? (
        <>
          <FieldInput
            label={slabAxisLabels.lengthALabel}
            value={x.slabLongueurAStr ?? "0"}
            onChange={(value) => onPatch({ slabLongueurAStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
          <FieldInput
            label={slabAxisLabels.lengthBLabel}
            value={x.slabLongueurBStr ?? "0"}
            onChange={(value) => onPatch({ slabLongueurBStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
        </>
      ) : null}
    </>
  );
}

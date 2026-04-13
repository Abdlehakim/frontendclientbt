import type { FormeState } from "../../types";
import {
  SLAB_CALC_METHODS,
  SLAB_NAPPES,
  SLAB_RELATIONS,
} from "../../config/formeBarreOptions";
import {
  getNappeLabel,
  getSlabCalcMethodLabel,
  getSlabRelationLabel,
} from "../../config/formeBarreLabels";
import FieldInput from "../common/FieldInput";
import SelectDropdown from "../common/SelectDropdown";
import type { FormeBarrePatch, SlabView } from "./FormeBarreFields.types";

export default function SlabHeaderFields({
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
  const resetSpacingPatch = {
    slabSpacingMode: "ESPACEMENT",
    slabSpacingRelation: "EA_EQ_EB",
  } as const;

  return (
    <>
      <div className="flex flex-col">
        <SelectDropdown
          label="Type de nappe"
          value={slab.slabNappeShown}
          onChange={(v) => onPatch({ barreCategorie: v })}
          options={SLAB_NAPPES}
          getOptionLabel={getNappeLabel}
        />
      </div>

      <div className="flex flex-col">
        <SelectDropdown
          label="Méthode de calcul"
          value={slab.slabCalcMethodValue}
          onChange={(v) => onPatch({ slabCalcMethod: v })}
          options={SLAB_CALC_METHODS}
          getOptionLabel={getSlabCalcMethodLabel}
        />
      </div>

      {slab.showSlabCombinedLengthRow ? (
        <>
          <div className="flex flex-col">
            <SelectDropdown
              label="Re. entre a et b"
              value={slab.slabRelationValue}
              onChange={(v) =>
                onPatch({
                  slabRelation: v,
                  ...resetSpacingPatch,
                })
              }
              options={SLAB_RELATIONS}
              getOptionLabel={getSlabRelationLabel}
            />
          </div>

          <FieldInput
            label="L. Barre a ou b (m)"
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
      ) : (
        <div className="flex flex-col sm:col-span-2">
          <SelectDropdown
            label="Re. entre a et b"
            value={slab.slabRelationValue}
            onChange={(v) =>
              onPatch({
                slabRelation: v,
                ...resetSpacingPatch,
              })
            }
            options={SLAB_RELATIONS}
            getOptionLabel={getSlabRelationLabel}
          />
        </div>
      )}

      {slab.showSlabSeparateLengthRow ? (
        <>
          <FieldInput
            label="L. Barre a (m)"
            value={x.slabLongueurAStr ?? "0"}
            onChange={(value) => onPatch({ slabLongueurAStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
          <FieldInput
            label="L. Barre b (m)"
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


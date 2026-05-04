import type { FormeState } from "../../types";
import FieldInput from "../common/FieldInput";
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
  return (
    <>
      {slab.showSlabSharedNbCadreInput || slab.showSlabModeAndSharedNbBarRow ? (
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
          className="sm:col-span-2"
        />
      ) : null}

      {slab.showSlabDualNbCadreInputs || slab.showSlabModeAndDualNbBarRow ? (
        <>
          <FieldInput
            label="Nb. Barres a"
            value={x.slabNbCadreAStr ?? "0"}
            onChange={(value) => onPatch({ slabNbCadreAStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 10"
            inputMode="numeric"
          />
          <FieldInput
            label="Nb. Barres b"
            value={x.slabNbCadreBStr ?? "0"}
            onChange={(value) => onPatch({ slabNbCadreBStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 10"
            inputMode="numeric"
          />
        </>
      ) : null}
    </>
  );
}


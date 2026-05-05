import type { FormeState } from "../../types";
import type {
  FormeBarreBaseView,
  FormeBarrePatch,
  SlabAutoValuesView,
  SlabView,
} from "./FormeBarreFields.types";
import SlabCountFields from "./SlabCountFields";
import SlabDiameterFields from "./SlabDiameterFields";
import SlabHeaderFields from "./SlabHeaderFields";
import SlabSpacingFields from "./SlabSpacingFields";

export default function SlabFields({
  x,
  base,
  slab,
  slabAutoValues,
  safeMms,
  inputClass,
  onPatch,
}: {
  x: FormeState;
  base: FormeBarreBaseView;
  slab: SlabView;
  slabAutoValues: SlabAutoValuesView;
  safeMms: number[];
  inputClass: string;
  onPatch: FormeBarrePatch;
}) {
  return (
    <>
      <SlabHeaderFields x={x} base={base} slab={slab} inputClass={inputClass} onPatch={onPatch} />
      <SlabDiameterFields
        x={x}
        base={base}
        slab={slab}
        slabAutoValues={slabAutoValues}
        safeMms={safeMms}
        inputClass={inputClass}
        onPatch={onPatch}
      />
      <SlabSpacingFields x={x} slab={slab} inputClass={inputClass} onPatch={onPatch} />
      <SlabCountFields x={x} slab={slab} inputClass={inputClass} onPatch={onPatch} />
    </>
  );
}


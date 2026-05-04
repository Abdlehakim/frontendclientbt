import type { FormeState } from "../../types";
import DiametreField from "../common/DiametreField";
import FieldInput from "../common/FieldInput";
import type {
  FormeBarreBaseView,
  FormeBarrePatch,
  SlabAutoValuesView,
  SlabView,
} from "./FormeBarreFields.types";
import SlabLinearMetricInputs from "./SlabLinearMetricInputs";

export default function SlabDiameterFields({
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
  const linearMetricInputs = (
    <SlabLinearMetricInputs
      x={x}
      slab={slab}
      slabAutoValues={slabAutoValues}
      inputClass={inputClass}
      onPatch={onPatch}
    />
  );

  return (
    <>
      {slab.showSlabCombinedLengthAnchorDiaRow ? (
        <>
          {linearMetricInputs}
          <DiametreField
            label="Di. a et b"
            mms={safeMms}
            value={base.diametreValue}
            onChange={(v) => onPatch({ diametreMm: v })}
          />
        </>
      ) : null}

      {slab.showSlabCombinedLengthAnchorDualDiaRow ? (
        <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {linearMetricInputs}
          <DiametreField
            label="Di. Fer a"
            mms={safeMms}
            value={slab.slabDiametreAValue}
            onChange={(v) => onPatch({ slabDiametreAMm: v })}
          />
          <DiametreField
            label="Di. Fer b"
            mms={safeMms}
            value={slab.slabDiametreBValue}
            onChange={(v) => onPatch({ slabDiametreBMm: v })}
          />
        </div>
      ) : null}

      {slab.showSlabSeparateLengthAnchorSharedDiaRow ? (
        <>
          {linearMetricInputs}
          <DiametreField
            label="Di. a et b"
            mms={safeMms}
            value={base.diametreValue}
            onChange={(v) => onPatch({ diametreMm: v })}
          />
        </>
      ) : null}

      {slab.showSlabSeparateLengthAnchorDualDiaRow ? (
        <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {linearMetricInputs}
          <DiametreField
            label="Di. Fer a"
            mms={safeMms}
            value={slab.slabDiametreAValue}
            onChange={(v) => onPatch({ slabDiametreAMm: v })}
          />
          <DiametreField
            label="Di. Fer b"
            mms={safeMms}
            value={slab.slabDiametreBValue}
            onChange={(v) => onPatch({ slabDiametreBMm: v })}
          />
        </div>
      ) : null}

      {!slab.showSlabCombinedLengthAnchorDiaRow &&
      !slab.showSlabCombinedLengthAnchorDualDiaRow &&
      !slab.showSlabSeparateLengthAnchorSharedDiaRow &&
      !slab.showSlabSeparateLengthAnchorDualDiaRow ? (
        linearMetricInputs
      ) : null}

      {slab.showSlabSharedDiaAndCount &&
      !slab.showSlabCombinedLengthAnchorDiaRow &&
      !slab.showSlabSeparateLengthAnchorSharedDiaRow ? (
        <>
          <DiametreField
            label="Di. a et b"
            mms={safeMms}
            value={base.diametreValue}
            onChange={(v) => onPatch({ diametreMm: v })}
          />
          {!slab.hideEarlySlabCountFieldsForSurfacePerM2 ? (
            <FieldInput
              label="Nb. Barres a et b"
              value={x.nBarreStr}
              onChange={(value) => onPatch({ nBarreStr: value })}
              inputClass={inputClass}
              placeholder="Ex: 4"
              inputMode="numeric"
            />
          ) : null}
        </>
      ) : null}

      {slab.showSlabDualDiaAndCount &&
      !slab.showSlabCombinedLengthAnchorDualDiaRow &&
      !slab.showSlabSeparateLengthAnchorDualDiaRow ? (
        <>
          <DiametreField
            label="Di. Fer a"
            mms={safeMms}
            value={slab.slabDiametreAValue}
            onChange={(v) => onPatch({ slabDiametreAMm: v })}
          />
          {!slab.hideEarlySlabCountFieldsForSurfacePerM2 ? (
            <FieldInput
              label="Nb. Barres a"
              value={x.slabNBarreAStr ?? "0"}
              onChange={(value) => onPatch({ slabNBarreAStr: value })}
              inputClass={inputClass}
              placeholder="Ex: 4"
              inputMode="numeric"
            />
          ) : null}
          <DiametreField
            label="Di. Fer b"
            mms={safeMms}
            value={slab.slabDiametreBValue}
            onChange={(v) => onPatch({ slabDiametreBMm: v })}
          />
          {!slab.hideEarlySlabCountFieldsForSurfacePerM2 ? (
            <FieldInput
              label="Nb. Barres b"
              value={x.slabNBarreBStr ?? "0"}
              onChange={(value) => onPatch({ slabNBarreBStr: value })}
              inputClass={inputClass}
              placeholder="Ex: 4"
              inputMode="numeric"
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

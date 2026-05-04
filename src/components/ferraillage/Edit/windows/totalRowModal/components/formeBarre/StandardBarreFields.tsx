import type { FormeState } from "../../types";
import DiametreField from "../common/DiametreField";
import FieldInput from "../common/FieldInput";
import type { FormeBarreBaseView, FormeBarrePatch } from "./FormeBarreFields.types";

export default function StandardBarreFields({
  x,
  base,
  safeMms,
  inputClass,
  onPatch,
}: {
  x: FormeState;
  base: FormeBarreBaseView;
  safeMms: number[];
  inputClass: string;
  onPatch: FormeBarrePatch;
}) {
  return (
    <>
      <DiametreField
        label="Di. Fer"
        mms={safeMms}
        value={base.diametreValue}
        onChange={(v) => onPatch({ diametreMm: v })}
      />

      <FieldInput
        label="N.barre"
        value={x.nBarreStr}
        onChange={(value) => onPatch({ nBarreStr: value })}
        inputClass={inputClass}
        placeholder="Ex: 4"
        inputMode="numeric"
      />

      {base.showBarreOptions ? (
        <FieldInput
          label="L. de barre (m)"
          value={x.longueurStr}
          onChange={(value) => onPatch({ longueurStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 6,5"
          type="number"
          step="0.01"
        />
      ) : (
        <FieldInput
          label="Attente barre (m)"
          value={x.attenteStr}
          onChange={(value) => onPatch({ attenteStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,6"
        />
      )}

      {base.showAncrageField ? (
        <FieldInput
          label="Ancrage (m)"
          value={x.ancrageStr}
          onChange={(value) => onPatch({ ancrageStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,4"
        />
      ) : null}
    </>
  );
}


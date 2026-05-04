import type { FormeState } from "../../types";
import {
  SEMELLE_NAPPES,
  SEMELLE_RELATIONS,
} from "../../config/formeBarreOptions";
import {
  getNappeLabel,
  getSemelleRelationLabel,
} from "../../config/formeBarreLabels";
import DiametreField from "../common/DiametreField";
import FieldInput from "../common/FieldInput";
import SelectDropdown from "../common/SelectDropdown";
import type { FormeBarreBaseView, FormeBarrePatch, SemelleView } from "./FormeBarreFields.types";

export default function SemelleFields({
  x,
  base,
  semelle,
  safeMms,
  inputClass,
  onPatch,
}: {
  x: FormeState;
  base: FormeBarreBaseView;
  semelle: SemelleView;
  safeMms: number[];
  inputClass: string;
  onPatch: FormeBarrePatch;
}) {
  return (
    <>
      <div className="flex flex-col">
        <SelectDropdown
          label="Type de nappe"
          value={semelle.semelleNappeShown}
          onChange={(v) => onPatch({ barreCategorie: v })}
          options={SEMELLE_NAPPES}
          getOptionLabel={getNappeLabel}
        />
      </div>

      {!semelle.isChaise && !semelle.showSemelleRelationAndSharedLengthRow ? (
        <div className="flex flex-col sm:col-span-2">
          <SelectDropdown
            label="Re. entre a et b"
            value={semelle.semelleRelationValue}
            onChange={(v) => onPatch({ semelleRelation: v })}
            options={SEMELLE_RELATIONS}
            getOptionLabel={getSemelleRelationLabel}
          />
        </div>
      ) : null}

      {semelle.showSemelleRelationAndSharedLengthRow ? (
        <>
          <div className="flex flex-col">
            <SelectDropdown
              label="Re. entre a et b"
              value={semelle.semelleRelationValue}
              onChange={(v) => onPatch({ semelleRelation: v })}
              options={SEMELLE_RELATIONS}
              getOptionLabel={getSemelleRelationLabel}
            />
          </div>

          <FieldInput
            label="L. Barre a ou b (m)"
            value={x.semelleLongueurAStr ?? "0"}
            onChange={(value) =>
              onPatch({
                semelleLongueurAStr: value,
                semelleLongueurBStr: value,
              })
            }
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
        </>
      ) : null}

      {semelle.showSemelleCombinedLengthAnchorDiaRow ? (
        <>
          <FieldInput
            label="Ancrage (m)"
            value={x.ancrageStr}
            onChange={(value) => onPatch({ ancrageStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 0,4"
          />

          <DiametreField
            label="Di. a et b"
            mms={safeMms}
            value={base.diametreValue}
            onChange={(v) => onPatch({ diametreMm: v })}
          />
        </>
      ) : null}

      {semelle.showInlineLengthAndAncrageRow ? (
        <FieldInput
          label="Ancrage (m)"
          value={x.ancrageStr}
          onChange={(value) => onPatch({ ancrageStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,4"
          className="sm:col-span-2"
        />
      ) : null}

      {semelle.showInlineDiffLengthAndAncrageRow ? (
        <>
          <FieldInput
            label="L. Barre a (m)"
            value={x.semelleLongueurAStr ?? "0"}
            onChange={(value) => onPatch({ semelleLongueurAStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
          <FieldInput
            label="L. Barre b (m)"
            value={x.semelleLongueurBStr ?? "0"}
            onChange={(value) => onPatch({ semelleLongueurBStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
          <FieldInput
            label="Ancrage (m)"
            value={x.ancrageStr}
            onChange={(value) => onPatch({ ancrageStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 0,4"
            className="sm:col-span-2"
          />
        </>
      ) : null}
    </>
  );
}


import SelectDropdown from "../common/SelectDropdown";
import FieldInput from "../common/FieldInput";
import DiametreField from "../common/DiametreField";
import {
  SEMELLE_NAPPES,
  SEMELLE_RELATIONS,
  type SemelleNappe,
  type SemelleRelation,
} from "../../config/formeBarreOptions";
import {
  getNappeLabel,
  getSemelleRelationLabel,
} from "../../config/formeBarreLabels";

export default function SemelleHeaderSection({
  semelleNappeShown,
  semelleRelationValue,
  isChaise,
  showSemelleRelationAndSharedLengthRow,
  showSemelleCombinedLengthAnchorDiaRow,
  showInlineLengthAndAncrageRow,
  showInlineDiffLengthAndAncrageRow,
  diametreValue,
  safeMms,
  inputClass,
  semelleLongueurAStr,
  semelleLongueurBStr,
  ancrageStr,
  onPatch,
}: {
  semelleNappeShown: SemelleNappe;
  semelleRelationValue: SemelleRelation;
  isChaise: boolean;
  showSemelleRelationAndSharedLengthRow: boolean;
  showSemelleCombinedLengthAnchorDiaRow: boolean;
  showInlineLengthAndAncrageRow: boolean;
  showInlineDiffLengthAndAncrageRow: boolean;
  diametreValue: number;
  safeMms: number[];
  inputClass: string;
  semelleLongueurAStr: string;
  semelleLongueurBStr: string;
  ancrageStr: string;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div className="flex flex-col sm:col-span-2">
        <SelectDropdown
          label="Type de nappe"
          value={semelleNappeShown}
          onChange={(v) => onPatch({ barreCategorie: v })}
          options={SEMELLE_NAPPES}
          getOptionLabel={getNappeLabel}
        />
      </div>

      {!isChaise && !showSemelleRelationAndSharedLengthRow ? (
        <div className="flex flex-col sm:col-span-2">
          <SelectDropdown
            label="Re. entre a et b"
            value={semelleRelationValue}
            onChange={(v) => onPatch({ semelleRelation: v })}
            options={SEMELLE_RELATIONS}
            getOptionLabel={getSemelleRelationLabel}
          />
        </div>
      ) : null}

      {showSemelleRelationAndSharedLengthRow ? (
        <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
          <SelectDropdown
            label="Re. entre a et b"
            value={semelleRelationValue}
            onChange={(v) => onPatch({ semelleRelation: v })}
            options={SEMELLE_RELATIONS}
            getOptionLabel={getSemelleRelationLabel}
          />

          <FieldInput
            label="L. Barre a ou b (m)"
            value={semelleLongueurAStr}
            onChange={(value) =>
              onPatch({
                semelleLongueurAStr: value,
                semelleLongueurBStr: value,
              })
            }
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
        </div>
      ) : null}

      {showSemelleCombinedLengthAnchorDiaRow ? (
        <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
          <FieldInput
            label="Ancrage (m)"
            value={ancrageStr}
            onChange={(value) => onPatch({ ancrageStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 0,4"
          />

          <DiametreField
            label="Di. a et b"
            mms={safeMms}
            value={diametreValue}
            onChange={(v) => onPatch({ diametreMm: v })}
          />
        </div>
      ) : null}

      {showInlineLengthAndAncrageRow ? (
        <FieldInput
          label="Ancrage (m)"
          value={ancrageStr}
          onChange={(value) => onPatch({ ancrageStr: value })}
          inputClass={inputClass}
          placeholder="Ex: 0,4"
          className="sm:col-span-2"
        />
      ) : null}

      {showInlineDiffLengthAndAncrageRow ? (
        <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-3">
          <FieldInput
            label="L. Barre a (m)"
            value={semelleLongueurAStr}
            onChange={(value) => onPatch({ semelleLongueurAStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />

          <FieldInput
            label="L. Barre b (m)"
            value={semelleLongueurBStr}
            onChange={(value) => onPatch({ semelleLongueurBStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />

          <FieldInput
            label="Ancrage (m)"
            value={ancrageStr}
            onChange={(value) => onPatch({ ancrageStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 0,4"
          />
        </div>
      ) : null}
    </>
  );
}
import type { FormeState } from "../../types";
import {
  SEMELLE_NAPPES,
  SEMELLE_RELATIONS,
  SLAB_SPACING_MODES,
  SLAB_SPACING_RELATIONS,
} from "../../config/formeBarreOptions";
import {
  getNappeLabel,
  getSemelleRelationLabel,
  getSlabSpacingModeLabel,
  getSlabSpacingRelationLabel,
} from "../../config/formeBarreLabels";
import DiametreField from "../common/DiametreField";
import FieldInput from "../common/FieldInput";
import SelectDropdown from "../common/SelectDropdown";
import type { FormeBarreBaseView, FormeBarrePatch, SemelleView } from "./FormeBarreFields.types";

function SemelleRelationField({
  value,
  onChange,
  className = "",
}: {
  value: SemelleView["semelleRelationValue"];
  onChange: (value: SemelleView["semelleRelationValue"]) => void;
  className?: string;
}) {
  return (
    <div className={["flex flex-col", className].join(" ").trim()}>
      <SelectDropdown
        label="Re. entre a et b"
        value={value}
        onChange={onChange}
        options={SEMELLE_RELATIONS}
        getOptionLabel={getSemelleRelationLabel}
      />
    </div>
  );
}

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
  const showSharedLengthRow =
    semelle.semelleEqualSharedActive || semelle.semelleEqualDualActive;
  const showSeparateLengthRow =
    semelle.semelleDiffSharedActive || semelle.semelleDiffDualActive;
  const showSharedDiameterRow =
    semelle.semelleEqualSharedActive || semelle.semelleDiffSharedActive;
  const showDualDiameterRow =
    semelle.semelleEqualDualActive || semelle.semelleDiffDualActive;
  const isSharedSemelleRelation =
    semelle.semelleEqualSharedActive || semelle.semelleDiffSharedActive;
  const isDualSemelleRelation =
    semelle.semelleEqualDualActive || semelle.semelleDiffDualActive;
  const spacingModeValue = (x.slabSpacingMode ?? "ESPACEMENT") as "ESPACEMENT" | "NB_CADRE";
  const spacingRelationValue = (x.slabSpacingRelation ?? "EA_EQ_EB") as "EA_EQ_EB" | "EA_NE_EB";
  const showSharedCountField =
    spacingModeValue === "NB_CADRE" &&
    isSharedSemelleRelation;
  const showDualCountFields =
    spacingModeValue === "NB_CADRE" &&
    isDualSemelleRelation;
  const showSharedLengthAnchorSharedDiaRow = semelle.semelleEqualSharedActive;
  const showSharedSpacingInput =
    spacingModeValue === "ESPACEMENT" && spacingRelationValue === "EA_EQ_EB";
  const showDualSpacingInputs =
    spacingModeValue === "ESPACEMENT" && spacingRelationValue === "EA_NE_EB";

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

      {semelle.isChaise ? (
        <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <FieldInput
            label="L. Barre (m)"
            value={x.longueurStr}
            onChange={(value) => onPatch({ longueurStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 2,4"
          />
          <DiametreField
            label="Diamètre"
            mms={safeMms}
            value={base.diametreValue}
            onChange={(v) => onPatch({ diametreMm: v })}
          />
          <FieldInput
            label="Nb. Barres"
            value={x.nBarreStr}
            onChange={(value) => onPatch({ nBarreStr: value })}
            inputClass={inputClass}
            placeholder="Ex: 4"
            inputMode="numeric"
          />
        </div>
      ) : (
        <>
          {showSharedLengthRow ? (
            <>
              <SemelleRelationField
                value={semelle.semelleRelationValue}
                onChange={(value) => onPatch({ semelleRelation: value })}
              />

              {showSharedLengthAnchorSharedDiaRow ? (
                <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                </div>
              ) : (
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
              )}
            </>
          ) : (
            <SemelleRelationField
              value={semelle.semelleRelationValue}
              onChange={(value) => onPatch({ semelleRelation: value })}
            />
          )}

          {showSeparateLengthRow ? (
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
            </>
          ) : null}

          {showSharedDiameterRow && !showSharedLengthAnchorSharedDiaRow ? (
            <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            </div>
          ) : null}

          {showDualDiameterRow ? (
            <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <FieldInput
                label="Ancrage (m)"
                value={x.ancrageStr}
                onChange={(value) => onPatch({ ancrageStr: value })}
                inputClass={inputClass}
                placeholder="Ex: 0,4"
              />
              <DiametreField
                label="Di. Fer a"
                mms={safeMms}
                value={semelle.semelleDiametreAValue}
                onChange={(v) => onPatch({ semelleDiametreAMm: v })}
              />
              <DiametreField
                label="Di. Fer b"
                mms={safeMms}
                value={semelle.semelleDiametreBValue}
                onChange={(v) => onPatch({ semelleDiametreBMm: v })}
              />
            </div>
          ) : null}

          {isSharedSemelleRelation ? (
            <>
              <div className="sm:col-span-2 grid gap-2 [grid-template-columns:1fr_1fr]">
                <div className="flex flex-col">
                  <SelectDropdown
                    label="Mode de calcul"
                    value={spacingModeValue}
                    onChange={(value) => onPatch({ slabSpacingMode: value })}
                    options={SLAB_SPACING_MODES}
                    getOptionLabel={getSlabSpacingModeLabel}
                  />
                </div>

                {showSharedCountField ? (
                  <FieldInput
                    label="Nb. Barres a et b"
                    value={x.nBarreStr}
                    onChange={(value) => onPatch({ nBarreStr: value })}
                    inputClass={inputClass}
                    placeholder="Ex: 4"
                    inputMode="numeric"
                  />
                ) : (
                  <div aria-hidden="true" />
                )}
              </div>

              {showSharedSpacingInput ? (
                <div className="sm:col-span-2 grid gap-2 [grid-template-columns:1fr_1fr]">
                  <div className="flex flex-col">
                    <SelectDropdown
                      label="Re. Es."
                      value={spacingRelationValue}
                      onChange={(value) => onPatch({ slabSpacingRelation: value })}
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
              ) : showDualSpacingInputs ? (
                <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="flex flex-col">
                    <SelectDropdown
                      label="Re. Es."
                      value={spacingRelationValue}
                      onChange={(value) => onPatch({ slabSpacingRelation: value })}
                      options={SLAB_SPACING_RELATIONS}
                      getOptionLabel={getSlabSpacingRelationLabel}
                    />
                  </div>

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
                </div>
              ) : null}
            </>
          ) : isDualSemelleRelation ? (
            <>
              <div className="sm:col-span-2 grid gap-2 [grid-template-columns:1fr_1fr_1fr]">
                <div className="flex flex-col">
                  <SelectDropdown
                    label="Mode de calcul"
                    value={spacingModeValue}
                    onChange={(value) => onPatch({ slabSpacingMode: value })}
                    options={SLAB_SPACING_MODES}
                    getOptionLabel={getSlabSpacingModeLabel}
                  />
                </div>

                {showDualCountFields ? (
                  <FieldInput
                    label="Nb. Barres a"
                    value={x.semelleNBarreAStr ?? "0"}
                    onChange={(value) => onPatch({ semelleNBarreAStr: value })}
                    inputClass={inputClass}
                    placeholder="Ex: 4"
                    inputMode="numeric"
                  />
                ) : (
                  <div aria-hidden="true" />
                )}

                {showDualCountFields ? (
                  <FieldInput
                    label="Nb. Barres b"
                    value={x.semelleNBarreBStr ?? "0"}
                    onChange={(value) => onPatch({ semelleNBarreBStr: value })}
                    inputClass={inputClass}
                    placeholder="Ex: 4"
                    inputMode="numeric"
                  />
                ) : (
                  <div aria-hidden="true" />
                )}
              </div>

              {showSharedSpacingInput ? (
                <div className="sm:col-span-2 grid gap-2 [grid-template-columns:1fr_1fr]">
                  <div className="flex flex-col">
                    <SelectDropdown
                      label="Re. Es."
                      value={spacingRelationValue}
                      onChange={(value) => onPatch({ slabSpacingRelation: value })}
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
              ) : showDualSpacingInputs ? (
                <div className="sm:col-span-2 grid gap-2 [grid-template-columns:1fr_1fr_1fr]">
                  <div className="flex flex-col">
                    <SelectDropdown
                      label="Re. Es."
                      value={spacingRelationValue}
                      onChange={(value) => onPatch({ slabSpacingRelation: value })}
                      options={SLAB_SPACING_RELATIONS}
                      getOptionLabel={getSlabSpacingRelationLabel}
                    />
                  </div>

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
                </div>
              ) : null}
            </>
          ) : showSharedSpacingInput ? (
            <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="flex flex-col">
                <SelectDropdown
                  label="Mode de calcul"
                  value={spacingModeValue}
                  onChange={(value) => onPatch({ slabSpacingMode: value })}
                  options={SLAB_SPACING_MODES}
                  getOptionLabel={getSlabSpacingModeLabel}
                />
              </div>

              <div className="flex flex-col">
                <SelectDropdown
                  label="Re. Es."
                  value={spacingRelationValue}
                  onChange={(value) => onPatch({ slabSpacingRelation: value })}
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
          ) : showDualSpacingInputs ? (
            <>
              <div className="flex flex-col">
                <SelectDropdown
                  label="Mode de calcul"
                  value={spacingModeValue}
                  onChange={(value) => onPatch({ slabSpacingMode: value })}
                  options={SLAB_SPACING_MODES}
                  getOptionLabel={getSlabSpacingModeLabel}
                />
              </div>

              <div className="flex flex-col">
                <SelectDropdown
                  label="Re. Es."
                  value={spacingRelationValue}
                  onChange={(value) => onPatch({ slabSpacingRelation: value })}
                  options={SLAB_SPACING_RELATIONS}
                  getOptionLabel={getSlabSpacingRelationLabel}
                />
              </div>

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
          ) : (
            <div className="flex flex-col">
              <SelectDropdown
                label="Mode de calcul"
                value={spacingModeValue}
                onChange={(value) => onPatch({ slabSpacingMode: value })}
                options={SLAB_SPACING_MODES}
                getOptionLabel={getSlabSpacingModeLabel}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

import { useEffect, useRef } from "react";
import type { FormeState } from "../types";
import FieldInput from "./common/FieldInput";
import DiametreField from "./common/DiametreField";
import SelectDropdown from "./common/SelectDropdown";
import BarreSteelSection from "./formeBarreSections/BarreSteelSection";
import ResultSingleSection from "./formeBarreSections/ResultSingleSection";
import ResultDualSection from "./formeBarreSections/ResultDualSection";

import {
  SLAB_CALC_METHODS,
  SLAB_NAPPES,
  SLAB_RELATIONS,
  SLAB_SPACING_MODES,
  SLAB_SPACING_RELATIONS,
  SEMELLE_NAPPES,
  SEMELLE_RELATIONS,
} from "../config/formeBarreOptions";

import {
  fmt,
  getNappeLabel,
  getSemelleRelationLabel,
  getSlabCalcMethodLabel,
  getSlabRelationLabel,
  getSlabSpacingModeLabel,
  getSlabSpacingRelationLabel,
} from "../config/formeBarreLabels";

import { useFormeBarreBaseState } from "../hooks/useFormeBarreBaseState";
import { useSemelleState } from "../hooks/useSemelleState";
import { useSlabState } from "../hooks/useSlabState";
import { useBarreAutoValues } from "../hooks/useBarreAutoValues";
import { useSemelleAutoValues } from "../hooks/useSemelleAutoValues";
import { useSlabAutoValues } from "../hooks/useSlabAutoValues";

type FormeStateWithSlabExtras = FormeState & {
  slabPerimetreStr?: string;
  slabAncrageLineaireStr?: string;
};

export default function FormeBarre({
  x,
  designation,
  safeMms,
  inputClass,
  twoColGrid,
  nbStr,
  hauteurStr,
  barreLitIndex,
  onPatch,
}: {
  x: FormeState;
  designation: string;
  safeMms: number[];
  inputClass: string;
  twoColGrid: string;
  nbStr: string;
  hauteurStr: string;
  barreLitIndex: number | null;
  onPatch: (patch: Partial<FormeState>) => void;
}) {
  const base = useFormeBarreBaseState({
    designation,
    safeMms,
    x,
    barreLitIndex,
  });

  const semelle = useSemelleState({
    isSemelle: base.isSemelle,
    x,
    fallbackDiametreValue: base.fallbackDiametreValue,
  });

  const slab = useSlabState({
    isSlab: base.isSlab,
    isDallePleine: base.isDallePleine,
    x,
    fallbackDiametreValue: base.fallbackDiametreValue,
  });

  const prevDesignationRef = useRef<string>(base.normalizedDesignation);

  useEffect(() => {
    if (prevDesignationRef.current === base.normalizedDesignation) return;
    prevDesignationRef.current = base.normalizedDesignation;

    const resetPatch: Partial<FormeStateWithSlabExtras> = {
      barreCategorie: "",
      semelleRelation: "ab_equal_same_if",
      semelleLongueurAStr: "0",
      semelleLongueurBStr: "0",
      semelleNBarreAStr: "0",
      semelleNBarreBStr: "0",
      semelleDiametreAMm: null,
      semelleDiametreBMm: null,

      slabCalcMethod: "SURFACE_TOTAL",
      slabSurfaceStr: "0",
      slabQtePerM2Str: "0",
      slabRelation: "ab_equal_same_if",
      slabSpacingMode: "ESPACEMENT",
      slabSpacingRelation: "EA_EQ_EB",
      slabLongueurAStr: "0",
      slabLongueurBStr: "0",
      slabDiametreAMm: null,
      slabDiametreBMm: null,
      slabNBarreAStr: "0",
      slabNBarreBStr: "0",
      slabEspacementAStr: "0",
      slabEspacementBStr: "0",
      slabNbCadreAStr: "0",
      slabNbCadreBStr: "0",
      slabPerimetreStr: "0",
      slabAncrageLineaireStr: "0",

      diametreMm: base.fallbackDiametreValue,
      nBarreStr: "0",
      longueurStr: "0",
      attenteStr: "0",
      ancrageStr: "0",
    };

    onPatch(resetPatch);
  }, [base.normalizedDesignation, base.fallbackDiametreValue, onPatch]);

  useEffect(() => {
    if (base.isSemelle && !(x.barreCategorie ?? "").trim()) {
      onPatch({ barreCategorie: "Nappe inférieur" });
    }
  }, [base.isSemelle, x.barreCategorie, onPatch]);

  useEffect(() => {
    if (base.isSlab && !(x.barreCategorie ?? "").trim()) {
      onPatch({ barreCategorie: "Nappe inférieur" });
    }
  }, [base.isSlab, x.barreCategorie, onPatch]);

  useEffect(() => {
    if (base.isSemelle && !(x.semelleRelation ?? "").trim()) {
      onPatch({ semelleRelation: "ab_equal_same_if" });
    }
  }, [base.isSemelle, x.semelleRelation, onPatch]);

  useEffect(() => {
    if (!base.isSlab) return;

    const patch: Partial<FormeState> = {};

    if (!(x.slabCalcMethod ?? "").trim()) patch.slabCalcMethod = "SURFACE_TOTAL";
    if (!(x.slabRelation ?? "").trim()) patch.slabRelation = "ab_equal_same_if";
    if (!(x.slabSpacingMode ?? "").trim()) patch.slabSpacingMode = "ESPACEMENT";
    if (
      !(
        (x.slabSpacingRelation ?? "").trim() === "EA_EQ_EB" ||
        (x.slabSpacingRelation ?? "").trim() === "EA_NE_EB"
      )
    ) {
      patch.slabSpacingRelation = "EA_EQ_EB";
    }

    if (Object.keys(patch).length > 0) onPatch(patch);
  }, [
    base.isSlab,
    x.slabCalcMethod,
    x.slabRelation,
    x.slabSpacingMode,
    x.slabSpacingRelation,
    onPatch,
  ]);

  const slabAutoValues = useSlabAutoValues({
    x,
    nbStr,
    isSlab: base.isSlab,
    slabDiffSharedActive: slab.slabDiffSharedActive,
    showSlabSharedSpacingInput: slab.showSlabSharedSpacingInput,
    showSlabDualSpacingInputs: slab.showSlabDualSpacingInputs,
    showSlabModeAndSharedNbBarRow: slab.showSlabModeAndSharedNbBarRow,
    showSlabSharedNbCadreInput: slab.showSlabSharedNbCadreInput,
    showSlabModeAndDualNbBarRow: slab.showSlabModeAndDualNbBarRow,
    showSlabDualNbCadreInputs: slab.showSlabDualNbCadreInputs,
    slabSurfacePerM2Mode: slab.slabSurfacePerM2Mode,
    slabEffectiveSpacingModeValue: slab.slabEffectiveSpacingModeValue,
  });

  const semelleAncrage = base.isSemelle && semelle.isChaise ? "0" : x.ancrageStr;

  const effectiveAncrageStr =
    base.showBarreOptions && !base.isSemelle && !base.isSlab
      ? base.barreCategorieValue === "Acier inférieur" ||
        base.barreCategorieValue === "Acier supérieur"
        ? x.ancrageStr
        : "0"
      : x.ancrageStr;

  const barreAuto = useBarreAutoValues({
    x,
    nbStr,
    hauteurStr,
    isSlab: base.isSlab,
    slabQte: slabAutoValues.auto.qte,
    slabNt: slabAutoValues.auto.nt,
    isSemelle: base.isSemelle,
    isChaise: semelle.isChaise,
    semelleEqualSharedActive: semelle.semelleEqualSharedActive,
    semelleEqualDualActive: semelle.semelleEqualDualActive,
    semelleDiffSharedActive: semelle.semelleDiffSharedActive,
    semelleDiffDualActive: semelle.semelleDiffDualActive,
    showBarreOptions: base.showBarreOptions,
    effectiveAncrageStr,
    semelleAncrage,
  });

  const semelleAuto = useSemelleAutoValues({
    active: semelle.semelleDualActive,
    equalDual: semelle.semelleEqualDualActive,
    nbStr,
    nBarreAStr: x.semelleNBarreAStr,
    nBarreBStr: x.semelleNBarreBStr,
    longueurAStr: x.semelleLongueurAStr,
    longueurBStr: x.semelleLongueurBStr,
    ancrageStr: semelle.isChaise ? "0" : x.ancrageStr,
    semelleDiametreAValue: semelle.semelleDiametreAValue,
    semelleDiametreBValue: semelle.semelleDiametreBValue,
  });

  const renderSlabLinearMetricInputs = () => {
    if (slab.slabSurfacePerM2Mode) {
      return (
        <>
          <FieldInput
            label="Périmètre"
            value={slabAutoValues.slabPerimetreStr}
            onChange={(value) =>
              onPatch({ slabPerimetreStr: value } as Partial<FormeStateWithSlabExtras>)
            }
            inputClass={inputClass}
            placeholder="Ex: 0,4"
          />
          <FieldInput
            label="Ancrage / mètre linéaire"
            value={slabAutoValues.slabAncrageLineaireStr}
            onChange={(value) =>
              onPatch({
                slabAncrageLineaireStr: value,
              } as Partial<FormeStateWithSlabExtras>)
            }
            inputClass={inputClass}
            placeholder="Ex: 0,4"
          />
        </>
      );
    }

    return (
      <FieldInput
        label="Ancrage (m)"
        value={x.ancrageStr}
        onChange={(value) => onPatch({ ancrageStr: value })}
        inputClass={inputClass}
        placeholder="Ex: 0,4"
      />
    );
  };

  return (
    <div className={twoColGrid}>
      {base.isSemelle ? (
        <>
          <div className="flex flex-col sm:col-span-2">
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
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
              <SelectDropdown
                label="Re. entre a et b"
                value={semelle.semelleRelationValue}
                onChange={(v) => onPatch({ semelleRelation: v })}
                options={SEMELLE_RELATIONS}
                getOptionLabel={getSemelleRelationLabel}
              />

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
            </div>
          ) : null}

          {semelle.showSemelleCombinedLengthAnchorDiaRow ? (
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-3">
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
              />
            </div>
          ) : null}
        </>
      ) : null}

      {base.isSlab ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <SelectDropdown
              label="Type de nappe"
              value={slab.slabNappeShown}
              onChange={(v) => onPatch({ barreCategorie: v })}
              options={SLAB_NAPPES}
              getOptionLabel={getNappeLabel}
            />

            <SelectDropdown
              label="Méthode de calcul"
              value={slab.slabCalcMethodValue}
              onChange={(v) => onPatch({ slabCalcMethod: v })}
              options={SLAB_CALC_METHODS}
              getOptionLabel={getSlabCalcMethodLabel}
            />
          </div>

          <div className="flex flex-col sm:col-span-2">
            <SelectDropdown
              label="Re. entre a et b"
              value={slab.slabRelationValue}
              onChange={(v) =>
                onPatch({
                  slabRelation: v,
                  slabSpacingMode: "ESPACEMENT",
                  slabSpacingRelation: "EA_EQ_EB",
                })
              }
              options={SLAB_RELATIONS}
              getOptionLabel={getSlabRelationLabel}
            />
          </div>

          {slab.showSlabCombinedLengthRow ? (
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
              className="sm:col-span-2"
            />
          ) : null}

          {slab.showSlabSeparateLengthRow ? (
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
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
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
            {renderSlabLinearMetricInputs()}
          </div>

          {slab.showSlabSharedDiaAndCount ? (
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
              <DiametreField
                label="Di. a et b"
                mms={safeMms}
                value={base.diametreValue}
                onChange={(v) => onPatch({ diametreMm: v })}
              />
              {!base.isDallePleine ? (
                <FieldInput
                  label="Nb. Barres a et b"
                  value={x.nBarreStr}
                  onChange={(value) => onPatch({ nBarreStr: value })}
                  inputClass={inputClass}
                  placeholder="Ex: 4"
                  inputMode="numeric"
                />
              ) : null}
            </div>
          ) : null}

          {slab.showSlabDualDiaAndCount ? (
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-4">
              <DiametreField
                label="Di. Fer a"
                mms={safeMms}
                value={slab.slabDiametreAValue}
                onChange={(v) => onPatch({ slabDiametreAMm: v })}
              />
              {!slab.hideEarlySlabDualCountFieldsForDallePleine ? (
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
              {!slab.hideEarlySlabDualCountFieldsForDallePleine ? (
                <FieldInput
                  label="Nb. Barres b"
                  value={x.slabNBarreBStr ?? "0"}
                  onChange={(value) => onPatch({ slabNBarreBStr: value })}
                  inputClass={inputClass}
                  placeholder="Ex: 4"
                  inputMode="numeric"
                />
              ) : null}
            </div>
          ) : null}

          {slab.showSlabSpacingMode ? (
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
              <SelectDropdown
                label="Mode de calcul"
                value={slab.slabSpacingModeValue}
                onChange={(v) => onPatch({ slabSpacingMode: v })}
                options={SLAB_SPACING_MODES}
                getOptionLabel={getSlabSpacingModeLabel}
              />
              <SelectDropdown
                label="Re. Es."
                value={slab.slabSpacingRelationValue}
                onChange={(v) => onPatch({ slabSpacingRelation: v })}
                options={SLAB_SPACING_RELATIONS}
                getOptionLabel={getSlabSpacingRelationLabel}
              />
            </div>
          ) : null}

          {slab.showSlabSharedSpacingInput ? (
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
              className="sm:col-span-2"
            />
          ) : null}

          {slab.showSlabDualSpacingInputs ? (
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
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
            </div>
          ) : null}
        </>
      ) : null}

      {base.showBarreOptions && !base.isSemelle && !base.isSlab ? (
        <BarreSteelSection
          showLitField={base.showLitField}
          barreCategorieValue={base.barreCategorieValue}
          litValue={base.litValue}
          inputClass={inputClass}
          onChange={(value) => onPatch({ barreCategorie: value })}
        />
      ) : null}

      {!base.isSemelle && !base.isSlab ? (
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
      ) : null}

      {semelle.semelleDualActive ? (
        <ResultDualSection
          inputClass={inputClass}
          qteLabelA={semelleAuto.qteLabelA}
          qteLabelB={semelleAuto.qteLabelB}
          ntLabelA={semelleAuto.ntLabelA}
          ntLabelB={semelleAuto.ntLabelB}
          qteA={fmt(semelleAuto.dual.qteA)}
          qteB={fmt(semelleAuto.dual.qteB)}
          ntA={fmt(semelleAuto.dual.ntA)}
          ntB={fmt(semelleAuto.dual.ntB)}
        />
      ) : (
        <ResultSingleSection
          inputClass={inputClass}
          qteValue={fmt(barreAuto.qte)}
          ntValue={fmt(barreAuto.nt)}
        />
      )}
    </div>
  );
}
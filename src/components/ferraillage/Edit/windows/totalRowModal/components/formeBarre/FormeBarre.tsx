import type { FormeState } from "../../types";
import { useBarreAutoValues } from "../../hooks/useBarreAutoValues";
import { useFormeBarreBaseState } from "../../hooks/useFormeBarreBaseState";
import { useFormeBarreDefaults } from "../../hooks/useFormeBarreDefaults";
import { useFormeBarreResult } from "../../hooks/useFormeBarreResult";
import { useSemelleAutoValues } from "../../hooks/useSemelleAutoValues";
import { useSemelleSpacingCountSync } from "../../hooks/useSemelleSpacingCountSync";
import { useSemelleState } from "../../hooks/useSemelleState";
import { useSlabAutoValues } from "../../hooks/useSlabAutoValues";
import { useSlabState } from "../../hooks/useSlabState";
import { shouldUseSimpleBarreLayout } from "../../state/barreModes";
import BarreSteelSection from "./sections/BarreSteelSection";
import FormeBarreResults from "./FormeBarreResults";
import SemelleFields from "./SemelleFields";
import SlabFields from "./SlabFields";
import SlabNappeSelect from "./SlabNappeSelect";
import StandardBarreFields from "./StandardBarreFields";

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
    isSlabSurfacePerM2SpacingDesignation: base.isSlabSurfacePerM2SpacingDesignation,
    designation,
    x,
    fallbackDiametreValue: base.fallbackDiametreValue,
  });

  const simpleBarreMode = {
    designation,
    forme: x.forme,
    typeDeNappe: x.barreCategorie,
  };
  const shouldRenderSimpleBarreLayout = shouldUseSimpleBarreLayout(simpleBarreMode);
  const shouldRenderSlabLayout = base.isSlab && !shouldRenderSimpleBarreLayout;
  const effectiveIsSlab = base.isSlab && !shouldRenderSimpleBarreLayout;
  const effectiveShowBarreOptions = base.showBarreOptions || shouldRenderSimpleBarreLayout;
  const standardBarreBase = shouldRenderSimpleBarreLayout
    ? {
        ...base,
        isSlab: false,
        showBarreOptions: true,
        barreCategorieValue: "Acier de renfort" as const,
        showLitField: false,
        litValue: "",
        showAncrageField: false,
      }
    : base;

  useFormeBarreDefaults({
    x,
    isSemelle: base.isSemelle,
    isSlab: base.isSlab,
    isSlabSurfacePerM2SpacingDesignation: base.isSlabSurfacePerM2SpacingDesignation,
    fallbackDiametreValue: base.fallbackDiametreValue,
    normalizedDesignation: base.normalizedDesignation,
    onPatch,
  });

  useSemelleSpacingCountSync({
    x,
    isSemelle: base.isSemelle,
    isChaise: semelle.isChaise,
    semelleEqualSharedActive: semelle.semelleEqualSharedActive,
    semelleEqualDualActive: semelle.semelleEqualDualActive,
    semelleDiffSharedActive: semelle.semelleDiffSharedActive,
    semelleDiffDualActive: semelle.semelleDiffDualActive,
    onPatch,
  });

  const slabAutoValues = useSlabAutoValues({
    x,
    nbStr,
    isSlab: effectiveIsSlab,
    slabDiffSharedActive: slab.slabDiffSharedActive,
    slabDiffDualActive: slab.slabDiffDualActive,
    showSlabSharedSpacingInput: slab.showSlabSharedSpacingInput,
    showSlabDualSpacingInputs: slab.showSlabDualSpacingInputs,
    showSlabModeAndSharedNbBarRow: slab.showSlabModeAndSharedNbBarRow,
    showSlabSharedNbCadreInput: slab.showSlabSharedNbCadreInput,
    showSlabModeAndDualNbBarRow: slab.showSlabModeAndDualNbBarRow,
    showSlabDualNbCadreInputs: slab.showSlabDualNbCadreInputs,
    slabSurfacePerM2Mode: slab.slabSurfacePerM2Mode,
    isSlabSurfacePerM2SpacingMode: slab.isSlabSurfacePerM2SpacingMode,
    slabEffectiveSpacingModeValue: slab.slabEffectiveSpacingModeValue,
  });

  const semelleAncrage = base.isSemelle && semelle.isChaise ? "0" : x.ancrageStr;

  const effectiveAncrageStr =
    effectiveShowBarreOptions && !base.isSemelle && !effectiveIsSlab
      ? standardBarreBase.showAncrageField
        ? x.ancrageStr
        : "0"
      : x.ancrageStr;

  const barreAuto = useBarreAutoValues({
    x,
    nbStr,
    hauteurStr,
    normalizedDesignation: shouldRenderSimpleBarreLayout ? "longrines" : base.normalizedDesignation,
    isSlab: effectiveIsSlab,
    slabQte: slabAutoValues.auto.qte,
    slabNt: slabAutoValues.auto.nt,
    isSemelle: base.isSemelle,
    isChaise: semelle.isChaise,
    semelleEqualSharedActive: semelle.semelleEqualSharedActive,
    semelleEqualDualActive: semelle.semelleEqualDualActive,
    semelleDiffSharedActive: semelle.semelleDiffSharedActive,
    semelleDiffDualActive: semelle.semelleDiffDualActive,
    showBarreOptions: effectiveShowBarreOptions,
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

  const result = useFormeBarreResult({
    x,
    nbStr,
    base: standardBarreBase,
    semelle,
    slab,
    barreAuto,
    semelleAuto,
  });

  return (
    <div className={twoColGrid}>
      {base.isSemelle ? (
        <SemelleFields
          x={x}
          base={base}
          semelle={semelle}
          safeMms={safeMms}
          inputClass={inputClass}
          onPatch={onPatch}
        />
      ) : null}

      {shouldRenderSlabLayout ? (
        <SlabFields
          x={x}
          base={base}
          slab={slab}
          slabAutoValues={slabAutoValues}
          safeMms={safeMms}
          inputClass={inputClass}
          onPatch={onPatch}
        />
      ) : null}

      {shouldRenderSimpleBarreLayout ? (
        <div className="flex flex-col sm:col-span-2">
          <SlabNappeSelect
            designation={designation}
            value={slab.slabNappeShown}
            onChange={(value) => onPatch({ barreCategorie: value })}
          />
        </div>
      ) : null}

      {base.showBarreOptions && !base.isSemelle && !base.isSlab ? (
        <div className="sm:col-span-2">
          <BarreSteelSection
            showLitField={base.showLitField}
            barreCategorieValue={base.barreCategorieValue}
            litValue={base.litValue}
            inputClass={inputClass}
            onChange={(value) => onPatch({ barreCategorie: value })}
          />
        </div>
      ) : null}

      {!base.isSemelle && (!base.isSlab || shouldRenderSimpleBarreLayout) ? (
        <StandardBarreFields
          x={x}
          base={standardBarreBase}
          safeMms={safeMms}
          inputClass={inputClass}
          onPatch={onPatch}
        />
      ) : null}

      <FormeBarreResults
        inputClass={inputClass}
        normalizedDesignation={base.normalizedDesignation}
        result={result}
      />
    </div>
  );
}

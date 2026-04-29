import type { FormeState } from "../../types";
import { useBarreAutoValues } from "../../hooks/useBarreAutoValues";
import { useFormeBarreBaseState } from "../../hooks/useFormeBarreBaseState";
import { useFormeBarreDefaults } from "../../hooks/useFormeBarreDefaults";
import { useFormeBarreResult } from "../../hooks/useFormeBarreResult";
import { useSemelleAutoValues } from "../../hooks/useSemelleAutoValues";
import { useSemelleState } from "../../hooks/useSemelleState";
import { useSlabAutoValues } from "../../hooks/useSlabAutoValues";
import { useSlabState } from "../../hooks/useSlabState";
import BarreSteelSection from "./sections/BarreSteelSection";
import FormeBarreResults from "./FormeBarreResults";
import SemelleFields from "./SemelleFields";
import SlabFields from "./SlabFields";
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
    isDallePleine: base.isDallePleine,
    x,
    fallbackDiametreValue: base.fallbackDiametreValue,
  });

  useFormeBarreDefaults({
    x,
    isSemelle: base.isSemelle,
    isSlab: base.isSlab,
    fallbackDiametreValue: base.fallbackDiametreValue,
    normalizedDesignation: base.normalizedDesignation,
    onPatch,
  });

  const slabAutoValues = useSlabAutoValues({
    x,
    nbStr,
    isSlab: base.isSlab,
    slabDiffSharedActive: slab.slabDiffSharedActive,
    slabDiffDualActive: slab.slabDiffDualActive,
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
      ? base.showAncrageField
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

  const result = useFormeBarreResult({
    x,
    nbStr,
    base,
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

      {base.isSlab ? (
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

      {!base.isSemelle && !base.isSlab ? (
        <StandardBarreFields
          x={x}
          base={base}
          safeMms={safeMms}
          inputClass={inputClass}
          onPatch={onPatch}
        />
      ) : null}

      <FormeBarreResults inputClass={inputClass} result={result} />
    </div>
  );
}

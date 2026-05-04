import type { FormeState } from "../types";
import { formatDiametreLabel } from "../config/formeBarreLabels";
import {
  SEMELLE_NAPPES,
  type SemelleNappe,
} from "../config/formeBarreOptions";

function isSemelleNappe(value: string): value is SemelleNappe {
  return (SEMELLE_NAPPES as readonly string[]).includes(value);
}

export function useSemelleState({
  isSemelle,
  x,
  fallbackDiametreValue,
}: {
  isSemelle: boolean;
  x: FormeState;
  fallbackDiametreValue: number;
}) {
  const rawBarreCategorie = (x.barreCategorie ?? "").trim();

  const semelleNappeShown: SemelleNappe =
    isSemelle && isSemelleNappe(rawBarreCategorie)
      ? rawBarreCategorie
      : "Nappe inférieur";

  const semelleRelationValue = (x.semelleRelation ?? "ab_equal_same_if") as
    | "ab_equal_same_if"
    | "ab_equal_diff_if"
    | "ab_diff_same_if"
    | "ab_diff_diff_if";

  const isChaise = isSemelle && semelleNappeShown === "Chaise";

  const semelleEqualSharedActive =
    isSemelle && !isChaise && semelleRelationValue === "ab_equal_same_if";
  const semelleEqualDualActive =
    isSemelle && !isChaise && semelleRelationValue === "ab_equal_diff_if";
  const semelleDiffSharedActive =
    isSemelle && !isChaise && semelleRelationValue === "ab_diff_same_if";
  const semelleDiffDualActive =
    isSemelle && !isChaise && semelleRelationValue === "ab_diff_diff_if";

  const semelleDualActive = semelleEqualDualActive || semelleDiffDualActive;

  const showSemelleCombinedLengthAnchorDiaRow = semelleEqualSharedActive;

  const showInlineLengthAndAncrageRow =
    isSemelle &&
    !isChaise &&
    (semelleEqualSharedActive || semelleEqualDualActive) &&
    !showSemelleCombinedLengthAnchorDiaRow;

  const showInlineDiffLengthAndAncrageRow =
    isSemelle && !isChaise && (semelleDiffSharedActive || semelleDiffDualActive);

  const showStandaloneAncrageField =
    !isChaise &&
    !showInlineLengthAndAncrageRow &&
    !showInlineDiffLengthAndAncrageRow;

  const showSemelleRelationAndSharedLengthRow =
    !isChaise &&
    (showSemelleCombinedLengthAnchorDiaRow || showInlineLengthAndAncrageRow);

  const semelleDiametreAValue =
    (x.semelleDiametreAMm ?? x.diametreMm ?? fallbackDiametreValue) as number;
  const semelleDiametreBValue =
    (x.semelleDiametreBMm ?? x.diametreMm ?? fallbackDiametreValue) as number;

  return {
    semelleNappeShown,
    semelleRelationValue,
    isChaise,
    semelleEqualSharedActive,
    semelleEqualDualActive,
    semelleDiffSharedActive,
    semelleDiffDualActive,
    semelleDualActive,
    showSemelleCombinedLengthAnchorDiaRow,
    showInlineLengthAndAncrageRow,
    showInlineDiffLengthAndAncrageRow,
    showStandaloneAncrageField,
    showSemelleRelationAndSharedLengthRow,
    semelleDiametreAValue,
    semelleDiametreBValue,
    semelleDiamLabelA: formatDiametreLabel(semelleDiametreAValue),
    semelleDiamLabelB: formatDiametreLabel(semelleDiametreBValue),
  };
}
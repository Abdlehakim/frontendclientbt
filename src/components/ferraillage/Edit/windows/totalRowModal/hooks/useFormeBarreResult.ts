import type { FormeState } from "../types";
import { fmt, formatDiametreLabel } from "../config/formeBarreLabels";
import type { useBarreAutoValues } from "./useBarreAutoValues";
import type { useFormeBarreBaseState } from "./useFormeBarreBaseState";
import type { useSemelleAutoValues } from "./useSemelleAutoValues";
import type { useSemelleState } from "./useSemelleState";
import type { useSlabState } from "./useSlabState";
import {
  computeSlabCrossSpacingParts,
  computeSlabDiffSharedSpacingNTA,
  computeSlabDiffSharedSpacingNTB,
} from "../calculations/slabCalculations";

export type FormeBarreResult =
  | {
      kind: "dual";
      qteLabelA: string;
      qteLabelB: string;
      ntLabelA: string;
      ntLabelB: string;
      qteA: string;
      qteB: string;
      ntA: string;
      ntB: string;
    }
  | {
      kind: "single";
      qteValue: string;
      ntValue: string;
    }
  | {
      kind: "single-qte-dual-nt";
      qteValue: string;
      ntA: string;
      ntB: string;
    };

function parseNum(value: string | undefined | null): number {
  return Number(String(value ?? "0").replace(",", ".")) || 0;
}

export function useFormeBarreResult({
  x,
  nbStr,
  base,
  semelle,
  slab,
  barreAuto,
  semelleAuto,
}: {
  x: FormeState;
  nbStr: string;
  base: ReturnType<typeof useFormeBarreBaseState>;
  semelle: ReturnType<typeof useSemelleState>;
  slab: ReturnType<typeof useSlabState>;
  barreAuto: ReturnType<typeof useBarreAutoValues>;
  semelleAuto: ReturnType<typeof useSemelleAutoValues>;
}): FormeBarreResult {
  const nbMultiplier = parseNum(nbStr);

  if (semelle.semelleDualActive) {
    return {
      kind: "dual",
      qteLabelA: semelleAuto.qteLabelA,
      qteLabelB: semelleAuto.qteLabelB,
      ntLabelA: semelleAuto.ntLabelA,
      ntLabelB: semelleAuto.ntLabelB,
      qteA: fmt(semelleAuto.dual.qteA),
      qteB: fmt(semelleAuto.dual.qteB),
      ntA: fmt(semelleAuto.dual.ntA),
      ntB: fmt(semelleAuto.dual.ntB),
    };
  }

  const slabDualResultActive =
    base.isSlab &&
    (slab.showSlabCombinedLengthAnchorDualDiaRow ||
      slab.showSlabSeparateLengthAnchorDualDiaRow ||
      (slab.showSlabDualDiaAndCount && !slab.hideEarlySlabDualCountFieldsForDallePleine));

  if (!slabDualResultActive) {
    const slabDiffSharedSpacingResultActive =
      base.isSlab &&
      slab.slabDiffSharedActive &&
      (slab.showSlabSharedSpacingInput || slab.showSlabDualSpacingInputs);

    if (slabDiffSharedSpacingResultActive) {
      const spacingBStr = slab.showSlabDualSpacingInputs
        ? x.slabEspacementBStr
        : x.slabEspacementAStr;

      return {
        kind: "single-qte-dual-nt",
        qteValue: fmt(barreAuto.qte),
        ntA: fmt(
          computeSlabDiffSharedSpacingNTA(
            x.slabLongueurAStr ?? "0",
            x.slabEspacementAStr ?? "0",
          ) * nbMultiplier,
        ),
        ntB: fmt(
          computeSlabDiffSharedSpacingNTB(
            x.slabLongueurBStr ?? "0",
            spacingBStr ?? "0",
          ) * nbMultiplier,
        ),
      };
    }

    return {
      kind: "single",
      qteValue: fmt(barreAuto.qte),
      ntValue: fmt(barreAuto.nt),
    };
  }

  const slabDiamLabelA = formatDiametreLabel(slab.slabDiametreAValue);
  const slabDiamLabelB = formatDiametreLabel(slab.slabDiametreBValue);

  const equalDualSharedSpacingPerSide =
    base.isSlab &&
    slab.slabEqualDualActive &&
    slab.slabSpacingRelationValue === "EA_EQ_EB";

  const equalDualSeparateSpacingPerSide =
    base.isSlab &&
    slab.slabEqualDualActive &&
    slab.slabSpacingRelationValue === "EA_NE_EB";

  const diffDualSpacingPerSide =
    base.isSlab &&
    slab.slabDiffDualActive &&
    (slab.showSlabSharedSpacingInput || slab.showSlabDualSpacingInputs);

  const diffDualSpacingBStr = slab.showSlabDualSpacingInputs
    ? x.slabEspacementBStr
    : x.slabEspacementAStr;

  const diffDualParts = diffDualSpacingPerSide
    ? computeSlabCrossSpacingParts(
        nbStr,
        x.slabLongueurAStr ?? "0",
        x.slabLongueurBStr ?? "0",
        x.slabEspacementAStr ?? "0",
        diffDualSpacingBStr ?? "0",
        x.ancrageStr ?? "0",
      )
    : null;

  const sharedNtEachBase = equalDualSharedSpacingPerSide
    ? parseNum(x.slabLongueurAStr) / parseNum(x.slabEspacementAStr)
    : 0;

  const sharedNtEach = sharedNtEachBase * nbMultiplier;

  const sharedQteEach = equalDualSharedSpacingPerSide
    ? sharedNtEach * (parseNum(x.slabLongueurAStr) + parseNum(x.ancrageStr))
    : 0;

  const separateNtABase = equalDualSeparateSpacingPerSide
    ? parseNum(x.slabLongueurAStr) / parseNum(x.slabEspacementAStr)
    : 0;

  const separateNtBBase = equalDualSeparateSpacingPerSide
    ? parseNum(x.slabLongueurAStr) / parseNum(x.slabEspacementBStr)
    : 0;

  const separateNtA = separateNtABase * nbMultiplier;
  const separateNtB = separateNtBBase * nbMultiplier;

  const separateQteA = equalDualSeparateSpacingPerSide
    ? separateNtA * (parseNum(x.slabLongueurAStr) + parseNum(x.ancrageStr))
    : 0;

  const separateQteB = equalDualSeparateSpacingPerSide
    ? separateNtB * (parseNum(x.slabLongueurAStr) + parseNum(x.ancrageStr))
    : 0;

  return {
    kind: "dual",
    qteLabelA: slabDiamLabelA ? `Q. Fer ${slabDiamLabelA} (m)` : "Q. Fer a (m)",
    qteLabelB: slabDiamLabelB ? `Q. Fer ${slabDiamLabelB} (m)` : "Q. Fer b (m)",
    ntLabelA: slabDiamLabelA ? `N.T.Barre ${slabDiamLabelA}` : "N.T.Barre a",
    ntLabelB: slabDiamLabelB ? `N.T.Barre ${slabDiamLabelB}` : "N.T.Barre b",
    qteA: fmt(
      diffDualParts
        ? diffDualParts.qteA
        : equalDualSharedSpacingPerSide
        ? sharedQteEach
        : equalDualSeparateSpacingPerSide
          ? separateQteA
          : barreAuto.qte,
    ),
    qteB: fmt(
      diffDualParts
        ? diffDualParts.qteB
        : equalDualSharedSpacingPerSide
        ? sharedQteEach
        : equalDualSeparateSpacingPerSide
          ? separateQteB
          : barreAuto.qte,
    ),
    ntA: fmt(
      diffDualParts
        ? diffDualParts.ntA
        : equalDualSharedSpacingPerSide
        ? sharedNtEach
        : equalDualSeparateSpacingPerSide
          ? separateNtA
          : barreAuto.nt,
    ),
    ntB: fmt(
      diffDualParts
        ? diffDualParts.ntB
        : equalDualSharedSpacingPerSide
        ? sharedNtEach
        : equalDualSeparateSpacingPerSide
          ? separateNtB
          : barreAuto.nt,
    ),
  };
}

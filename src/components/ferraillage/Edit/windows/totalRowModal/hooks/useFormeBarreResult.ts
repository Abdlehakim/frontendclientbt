import type { FormeState } from "../types";
import { fmt, formatDiametreLabel } from "../config/formeBarreLabels";
import type { useBarreAutoValues } from "./useBarreAutoValues";
import type { useFormeBarreBaseState } from "./useFormeBarreBaseState";
import type { useSemelleAutoValues } from "./useSemelleAutoValues";
import type { useSemelleState } from "./useSemelleState";
import type { useSlabState } from "./useSlabState";

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
    };

function parseNum(value: string | undefined | null): number {
  return Number(String(value ?? "0").replace(",", ".")) || 0;
}

export function useFormeBarreResult({
  x,
  base,
  semelle,
  slab,
  barreAuto,
  semelleAuto,
}: {
  x: FormeState;
  base: ReturnType<typeof useFormeBarreBaseState>;
  semelle: ReturnType<typeof useSemelleState>;
  slab: ReturnType<typeof useSlabState>;
  barreAuto: ReturnType<typeof useBarreAutoValues>;
  semelleAuto: ReturnType<typeof useSemelleAutoValues>;
}): FormeBarreResult {
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

  const sharedNtEach = equalDualSharedSpacingPerSide
    ? parseNum(x.slabLongueurAStr) / parseNum(x.slabEspacementAStr)
    : 0;

  const sharedQteEach = equalDualSharedSpacingPerSide
    ? sharedNtEach * (parseNum(x.slabLongueurAStr) + parseNum(x.ancrageStr))
    : 0;

  const separateNtA = equalDualSeparateSpacingPerSide
    ? parseNum(x.slabLongueurAStr) / parseNum(x.slabEspacementAStr)
    : 0;

  const separateNtB = equalDualSeparateSpacingPerSide
    ? parseNum(x.slabLongueurAStr) / parseNum(x.slabEspacementBStr)
    : 0;

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
      equalDualSharedSpacingPerSide
        ? sharedQteEach
        : equalDualSeparateSpacingPerSide
          ? separateQteA
          : barreAuto.qte,
    ),
    qteB: fmt(
      equalDualSharedSpacingPerSide
        ? sharedQteEach
        : equalDualSeparateSpacingPerSide
          ? separateQteB
          : barreAuto.qte,
    ),
    ntA: fmt(
      equalDualSharedSpacingPerSide
        ? sharedNtEach
        : equalDualSeparateSpacingPerSide
          ? separateNtA
          : barreAuto.nt,
    ),
    ntB: fmt(
      equalDualSharedSpacingPerSide
        ? sharedNtEach
        : equalDualSeparateSpacingPerSide
          ? separateNtB
          : barreAuto.nt,
    ),
  };
}

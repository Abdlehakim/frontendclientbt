import type { FormeState } from "../types";
import {
  fmt,
  formatDiametreLabel,
  getDualDiameterResultLabels,
} from "../config/formeBarreLabels";
import type { useBarreAutoValues } from "./useBarreAutoValues";
import type { useFormeBarreBaseState } from "./useFormeBarreBaseState";
import type { useSemelleAutoValues } from "./useSemelleAutoValues";
import type { useSemelleState } from "./useSemelleState";
import type { useSlabState } from "./useSlabState";
import {
  computeSlabSurfacePerM2SpacingMetrics,
  computeSlabSurfacePerM2SplitMetrics,
  computeSlabCrossSpacingParts,
  computeSlabDiffSharedSpacingNTA,
  computeSlabDiffSharedSpacingNTB,
  computeSlabEqualDualCountPartMetrics,
  computeSlabEqualDualSpacingPartMetrics,
  computeSlabSplitCountPartMetrics,
  computeSlabNTFromSharedCount,
  computeSlabQuantityFromSplitCounts,
} from "../calculations/slabCalculations";
import { safeNumber } from "../utils";

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
  return safeNumber(String(value ?? "0").replace(",", "."));
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
      (slab.showSlabDualDiaAndCount && !slab.hideEarlySlabCountFieldsForSurfacePerM2));

  const slabSurfacePerM2DualMetrics =
    base.isSlab && slab.isSlabSurfacePerM2SpacingMode && slab.slabEqualDualActive
      ? (() => {
          const metrics = computeSlabSurfacePerM2SpacingMetrics({
            surfaceStr: x.slabSurfaceStr ?? "0",
            perimetreStr: x.slabPerimetreStr ?? "0",
            ancrageLineaireStr: x.slabAncrageLineaireStr ?? "0",
            spacingRelation: slab.slabSpacingRelationValue,
            spacingAStr: x.slabEspacementAStr ?? "0",
            spacingBStr: x.slabEspacementBStr ?? "0",
          });

          return computeSlabSurfacePerM2SplitMetrics({
            qA: metrics.qA,
            qB: metrics.qB,
            ancrageM: metrics.ancrageM,
            multiplier: nbMultiplier,
            commercialBarLengthM: metrics.cutLenM,
          });
        })()
      : null;

  const slabDiamLabelA = formatDiametreLabel(slab.slabDiametreAValue);
  const slabDiamLabelB = formatDiametreLabel(slab.slabDiametreBValue);
  const slabDualLabels = getDualDiameterResultLabels(
    slabDiamLabelA,
    slabDiamLabelB,
    base.normalizedDesignation,
  );

  if (slabSurfacePerM2DualMetrics) {
    return {
      kind: "dual",
      qteLabelA: slabDualLabels.qteLabelA,
      qteLabelB: slabDualLabels.qteLabelB,
      ntLabelA: slabDualLabels.ntLabelA,
      ntLabelB: slabDualLabels.ntLabelB,
      qteA: fmt(slabSurfacePerM2DualMetrics.qtyA),
      qteB: fmt(slabSurfacePerM2DualMetrics.qtyB),
      ntA: fmt(slabSurfacePerM2DualMetrics.ntA),
      ntB: fmt(slabSurfacePerM2DualMetrics.ntB),
    };
  }

  if (!slabDualResultActive) {
    const slabDiffSharedCountResultActive =
      base.isSlab &&
      slab.slabDiffSharedActive &&
      slab.slabEffectiveSpacingModeValue === "NB_CADRE";

    if (slabDiffSharedCountResultActive) {
      const countA = parseNum(x.slabNbCadreAStr);
      const countB = parseNum(x.slabNbCadreBStr);

      return {
        kind: "single-qte-dual-nt",
        qteValue: fmt(
          computeSlabQuantityFromSplitCounts(
            nbStr,
            countA,
            countB,
            x.slabLongueurAStr ?? "0",
            x.slabLongueurBStr ?? "0",
            x.ancrageStr ?? "0",
          ),
        ),
        ntA: fmt(computeSlabNTFromSharedCount(nbStr, countA)),
        ntB: fmt(computeSlabNTFromSharedCount(nbStr, countB)),
      };
    }

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
          computeSlabDiffSharedSpacingNTB(
            x.slabLongueurBStr ?? "0",
            spacingBStr ?? "0",
          ) * nbMultiplier,
        ),
        ntB: fmt(
          computeSlabDiffSharedSpacingNTA(
            x.slabLongueurAStr ?? "0",
            x.slabEspacementAStr ?? "0",
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

  const equalDualSpacingPerSide =
    base.isSlab &&
    slab.slabEqualDualActive &&
    slab.slabEffectiveSpacingModeValue === "ESPACEMENT";

  const equalDualParts = equalDualSpacingPerSide
    ? computeSlabEqualDualSpacingPartMetrics(
        nbStr,
        x.slabLongueurAStr ?? "0",
        x.slabEspacementAStr ?? "0",
        x.slabEspacementBStr ?? "0",
        x.ancrageStr ?? "0",
        slab.slabSpacingRelationValue,
      )
    : null;

  const equalDualCountParts =
    base.isSlab &&
    slab.slabEqualDualActive &&
    slab.slabEffectiveSpacingModeValue === "NB_CADRE"
      ? computeSlabEqualDualCountPartMetrics(
          nbStr,
          parseNum(x.slabNbCadreAStr),
          parseNum(x.slabNbCadreBStr),
          x.slabLongueurAStr ?? "0",
          x.ancrageStr ?? "0",
        )
      : null;

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

  const diffDualCountParts =
    base.isSlab &&
    slab.slabDiffDualActive &&
    slab.slabEffectiveSpacingModeValue === "NB_CADRE"
      ? computeSlabSplitCountPartMetrics(
          nbStr,
          parseNum(x.slabNbCadreAStr),
          parseNum(x.slabNbCadreBStr),
          x.slabLongueurAStr ?? "0",
          x.slabLongueurBStr ?? "0",
          x.ancrageStr ?? "0",
        )
      : null;

  return {
    kind: "dual",
    qteLabelA: slabDualLabels.qteLabelA,
    qteLabelB: slabDualLabels.qteLabelB,
    ntLabelA: slabDualLabels.ntLabelA,
    ntLabelB: slabDualLabels.ntLabelB,
    qteA: fmt(
      equalDualCountParts
        ? equalDualCountParts.qteA
        : equalDualParts
        ? equalDualParts.qteA
        : diffDualCountParts
        ? diffDualCountParts.qteA
        : diffDualParts
        ? diffDualParts.qteA
        : barreAuto.qte,
    ),
    qteB: fmt(
      equalDualCountParts
        ? equalDualCountParts.qteB
        : equalDualParts
        ? equalDualParts.qteB
        : diffDualCountParts
        ? diffDualCountParts.qteB
        : diffDualParts
        ? diffDualParts.qteB
        : barreAuto.qte,
    ),
    ntA: fmt(
      equalDualCountParts
        ? equalDualCountParts.ntA
        : equalDualParts
        ? equalDualParts.ntA
        : diffDualCountParts
        ? diffDualCountParts.ntA
        : diffDualParts
        ? diffDualParts.ntA
        : barreAuto.nt,
    ),
    ntB: fmt(
      equalDualCountParts
        ? equalDualCountParts.ntB
        : equalDualParts
        ? equalDualParts.ntB
        : diffDualCountParts
        ? diffDualCountParts.ntB
        : diffDualParts
        ? diffDualParts.ntB
        : barreAuto.nt,
    ),
  };
}

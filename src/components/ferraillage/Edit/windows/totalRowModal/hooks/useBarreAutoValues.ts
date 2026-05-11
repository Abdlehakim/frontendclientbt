import { useMemo } from "react";
import type { FormeState } from "../types";
import {
  computeBarreNT,
  computeBarreNTStandard,
  computeBarreQteLongueur,
  computeFinalBarreQte,
} from "../calculations/barreCalculations";
import {
  computeSemelleNTDual,
  computeSemelleNTEqualShared,
  computeSemelleNTSharedCount,
  computeSemelleNTSharedSpacing,
  computeSemelleNTDiffShared,
  computeSemelleQteDiffDual,
  computeSemelleQteDiffShared,
  computeSemelleQteEqualDual,
  computeSemelleQteEqualShared,
} from "../calculations/semelleCalculations";
import { isCountBasedBarreNTDesignationValue } from "../state/guards";

export function useBarreAutoValues({
  x,
  nbStr,
  hauteurStr,
  normalizedDesignation,
  isSlab,
  slabQte,
  slabNt,
  isSemelle,
  isChaise,
  semelleEqualSharedActive,
  semelleEqualDualActive,
  semelleDiffSharedActive,
  semelleDiffDualActive,
  showBarreOptions,
  showAncrageField,
  semelleAncrage,
}: {
  x: FormeState;
  nbStr: string;
  hauteurStr: string;
  normalizedDesignation: string;
  isSlab: boolean;
  slabQte: number;
  slabNt: number;
  isSemelle: boolean;
  isChaise: boolean;
  semelleEqualSharedActive: boolean;
  semelleEqualDualActive: boolean;
  semelleDiffSharedActive: boolean;
  semelleDiffDualActive: boolean;
  showBarreOptions: boolean;
  showAncrageField: boolean;
  semelleAncrage: string;
}) {
  const usesCountBasedBarreNT = isCountBasedBarreNTDesignationValue(normalizedDesignation);

  const qte = useMemo(() => {
    if (isSlab) return slabQte;

    if (isSemelle) {
      if (isChaise) {
        return computeBarreQteLongueur(nbStr, x.nBarreStr, x.longueurStr, "0");
      }

      if (semelleEqualSharedActive) {
        return computeSemelleQteEqualShared(
          nbStr,
          x.nBarreStr,
          x.semelleLongueurAStr ?? "",
          semelleAncrage,
        );
      }

      if (semelleEqualDualActive) {
        return computeSemelleQteEqualDual(
          nbStr,
          x.semelleNBarreAStr ?? "",
          x.semelleNBarreBStr ?? "",
          x.semelleLongueurAStr ?? "",
          semelleAncrage,
        );
      }

      if (semelleDiffSharedActive) {
        return computeSemelleQteDiffShared(
          nbStr,
          x.nBarreStr,
          x.semelleLongueurAStr ?? "",
          x.semelleLongueurBStr ?? "",
          semelleAncrage,
        );
      }

      if (semelleDiffDualActive) {
        return computeSemelleQteDiffDual(
          nbStr,
          x.semelleNBarreAStr ?? "",
          x.semelleNBarreBStr ?? "",
          x.semelleLongueurAStr ?? "",
          x.semelleLongueurBStr ?? "",
          semelleAncrage,
        );
      }
    }

    if (!isSemelle) {
      return computeFinalBarreQte({
        nbStr,
        nBarreStr: x.nBarreStr,
        hauteurStr,
        longueurStr: x.longueurStr,
        attenteStr: x.attenteStr,
        ancrageStr: x.ancrageStr,
        showBarreOptions,
        showAncrageField,
      });
    }

    return 0;
  }, [
    isSlab,
    slabQte,
    isSemelle,
    isChaise,
    semelleEqualSharedActive,
    semelleEqualDualActive,
    semelleDiffSharedActive,
    semelleDiffDualActive,
    showBarreOptions,
    showAncrageField,
    nbStr,
    x.nBarreStr,
    x.longueurStr,
    x.attenteStr,
    x.ancrageStr,
    x.semelleLongueurAStr,
    x.semelleLongueurBStr,
    x.semelleNBarreAStr,
    x.semelleNBarreBStr,
    semelleAncrage,
    hauteurStr,
  ]);

  const nt = useMemo(() => {
    if (isSlab) return slabNt;
    if (isChaise) return computeBarreNT(nbStr, x.nBarreStr);

    const useSemelleSharedSpacingNt =
      semelleEqualSharedActive && x.slabSpacingMode === "ESPACEMENT";
    const useSemelleSharedCountNt =
      semelleEqualSharedActive && x.slabSpacingMode === "NB_CADRE";

    if (useSemelleSharedSpacingNt) {
      return computeSemelleNTSharedSpacing(
        nbStr,
        x.semelleLongueurAStr ?? "",
        x.slabEspacementAStr ?? "",
        semelleAncrage,
        (x.slabSpacingRelation ?? "EA_EQ_EB") === "EA_NE_EB" ? (x.slabEspacementBStr ?? "") : undefined,
      );
    }

    if (useSemelleSharedCountNt) {
      return computeSemelleNTSharedCount(nbStr, x.nBarreStr);
    }

    if (semelleEqualSharedActive) return computeSemelleNTEqualShared(nbStr, x.nBarreStr);
    if (semelleDiffSharedActive) return computeSemelleNTDiffShared(nbStr, x.nBarreStr);

    if (semelleEqualDualActive || semelleDiffDualActive) {
      return computeSemelleNTDual(
        nbStr,
        x.semelleNBarreAStr ?? "",
        x.semelleNBarreBStr ?? "",
      );
    }

    if (usesCountBasedBarreNT) {
      return computeBarreNT(nbStr, x.nBarreStr);
    }

    return computeBarreNTStandard(
      nbStr,
      x.nBarreStr,
      hauteurStr,
      x.attenteStr,
      x.ancrageStr,
    );
  }, [
    isSlab,
    slabNt,
    isChaise,
    semelleEqualSharedActive,
    semelleDiffSharedActive,
    semelleEqualDualActive,
    semelleDiffDualActive,
    usesCountBasedBarreNT,
    nbStr,
    hauteurStr,
    x.nBarreStr,
    x.attenteStr,
    x.ancrageStr,
    x.semelleLongueurAStr,
    x.semelleNBarreAStr,
    x.semelleNBarreBStr,
    x.slabSpacingMode,
    x.slabSpacingRelation,
    x.slabEspacementAStr,
    x.slabEspacementBStr,
    semelleAncrage,
  ]);

  return { qte, nt };
}

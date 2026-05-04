import { useMemo } from "react";
import type { FormeState } from "../types";
import {
  computeBarreNT,
  computeBarreNTLongueurDesignation,
  computeBarreNTStandard,
  computeBarreQteLongueur,
  computeBarreQteStandard,
} from "../calculations/barreCalculations";
import {
  computeSemelleNTDual,
  computeSemelleNTEqualShared,
  computeSemelleNTSharedSpacing,
  computeSemelleNTDiffShared,
  computeSemelleQteDiffDual,
  computeSemelleQteDiffShared,
  computeSemelleQteEqualDual,
  computeSemelleQteEqualShared,
} from "../calculations/semelleCalculations";

export function useBarreAutoValues({
  x,
  nbStr,
  hauteurStr,
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
  effectiveAncrageStr,
  semelleAncrage,
}: {
  x: FormeState;
  nbStr: string;
  hauteurStr: string;
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
  effectiveAncrageStr: string;
  semelleAncrage: string;
}) {
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

    if (showBarreOptions) {
      return computeBarreQteLongueur(
        nbStr,
        x.nBarreStr,
        x.longueurStr,
        effectiveAncrageStr,
      );
    }

    return computeBarreQteStandard(
      nbStr,
      x.nBarreStr,
      hauteurStr,
      x.attenteStr,
      x.ancrageStr,
    );
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
    nbStr,
    x.nBarreStr,
    x.longueurStr,
    x.attenteStr,
    x.ancrageStr,
    x.semelleLongueurAStr,
    x.semelleLongueurBStr,
    x.semelleNBarreAStr,
    x.semelleNBarreBStr,
    effectiveAncrageStr,
    semelleAncrage,
    hauteurStr,
  ]);

  const nt = useMemo(() => {
    if (isSlab) return slabNt;
    if (isChaise) return computeBarreNT(nbStr, x.nBarreStr);

    const useSemelleSharedSpacingNt =
      semelleEqualSharedActive &&
      x.slabSpacingMode === "ESPACEMENT" &&
      (x.slabSpacingRelation ?? "EA_EQ_EB") === "EA_EQ_EB";

    if (useSemelleSharedSpacingNt) {
      return computeSemelleNTSharedSpacing(
        nbStr,
        x.semelleLongueurAStr ?? "",
        x.slabEspacementAStr ?? "",
        semelleAncrage,
      );
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

    if (showBarreOptions) {
      return computeBarreNTLongueurDesignation(
        nbStr,
        x.longueurStr,
        effectiveAncrageStr,
      );
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
    showBarreOptions,
    nbStr,
    hauteurStr,
    x.nBarreStr,
    x.longueurStr,
    x.attenteStr,
    x.ancrageStr,
    x.semelleLongueurAStr,
    x.semelleNBarreAStr,
    x.semelleNBarreBStr,
    x.slabSpacingMode,
    x.slabSpacingRelation,
    x.slabEspacementAStr,
    effectiveAncrageStr,
    semelleAncrage,
  ]);

  return { qte, nt };
}

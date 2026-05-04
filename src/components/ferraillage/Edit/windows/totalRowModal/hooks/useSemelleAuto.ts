import { useMemo } from "react";
import {
  computeSemelleDualA,
  computeSemelleDualB,
  computeSemelleNTDual,
} from "../calculations/semelleCalculations";
import { computeBarreNT } from "../calculations/barreCalculations";

export function useSemelleDualAuto(params: {
  active: boolean;
  equalDual: boolean;
  nbStr: string;
  nBarreAStr?: string;
  nBarreBStr?: string;
  longueurAStr?: string;
  longueurBStr?: string;
  ancrageStr: string;
}) {
  const {
    active,
    equalDual,
    nbStr,
    nBarreAStr = "",
    nBarreBStr = "",
    longueurAStr = "",
    longueurBStr = "",
    ancrageStr,
  } = params;

  const qteA = useMemo(() => {
    if (!active) return 0;
    return computeSemelleDualA(
      nbStr,
      nBarreAStr,
      longueurAStr,
      ancrageStr,
      equalDual,
    );
  }, [active, nbStr, nBarreAStr, longueurAStr, ancrageStr, equalDual]);

  const qteB = useMemo(() => {
    if (!active) return 0;
    return computeSemelleDualB(
      nbStr,
      nBarreBStr,
      longueurAStr,
      longueurBStr,
      ancrageStr,
      equalDual,
    );
  }, [active, nbStr, nBarreBStr, longueurAStr, longueurBStr, ancrageStr, equalDual]);

  const ntA = useMemo(() => {
    if (!active) return 0;
    return computeBarreNT(nbStr, nBarreAStr);
  }, [active, nbStr, nBarreAStr]);

  const ntB = useMemo(() => {
    if (!active) return 0;
    return computeBarreNT(nbStr, nBarreBStr);
  }, [active, nbStr, nBarreBStr]);

  const ntTotal = useMemo(() => {
    if (!active) return 0;
    return computeSemelleNTDual(nbStr, nBarreAStr, nBarreBStr);
  }, [active, nbStr, nBarreAStr, nBarreBStr]);

  return {
    qteA,
    qteB,
    ntA,
    ntB,
    ntTotal,
  };
}
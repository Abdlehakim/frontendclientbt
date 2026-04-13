import { useEffect, useRef } from "react";
import type { FormeState } from "../types";

export function useFormeBarreDefaults({
  x,
  isSemelle,
  isSlab,
  fallbackDiametreValue,
  normalizedDesignation,
  onPatch,
}: {
  x: FormeState;
  isSemelle: boolean;
  isSlab: boolean;
  fallbackDiametreValue: number;
  normalizedDesignation: string;
  onPatch: (patch: Partial<FormeState>) => void;
}) {
  const prevDesignationRef = useRef<string>(normalizedDesignation);

  useEffect(() => {
    if (prevDesignationRef.current === normalizedDesignation) return;
    prevDesignationRef.current = normalizedDesignation;

    onPatch({
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

      diametreMm: fallbackDiametreValue,
      nBarreStr: "0",
      longueurStr: "0",
      attenteStr: "0",
      ancrageStr: "0",
    });
  }, [normalizedDesignation, fallbackDiametreValue, onPatch]);

  useEffect(() => {
    if (isSemelle && !(x.barreCategorie ?? "").trim()) {
      onPatch({ barreCategorie: "Nappe inférieure" });
    }
  }, [isSemelle, x.barreCategorie, onPatch]);

  useEffect(() => {
    if (isSlab && !(x.barreCategorie ?? "").trim()) {
      onPatch({ barreCategorie: "Nappe inférieure" });
    }
  }, [isSlab, x.barreCategorie, onPatch]);

  useEffect(() => {
    if (isSemelle && !(x.semelleRelation ?? "").trim()) {
      onPatch({ semelleRelation: "ab_equal_same_if" });
    }
  }, [isSemelle, x.semelleRelation, onPatch]);

  useEffect(() => {
    if (!isSlab) return;

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
    isSlab,
    x.slabCalcMethod,
    x.slabRelation,
    x.slabSpacingMode,
    x.slabSpacingRelation,
    onPatch,
  ]);
}


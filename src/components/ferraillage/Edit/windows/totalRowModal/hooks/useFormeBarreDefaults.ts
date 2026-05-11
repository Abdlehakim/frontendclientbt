import { useEffect, useRef } from "react";
import type { FormeState } from "../types";
import { normalizeTypeDeNappe } from "../config/formeBarreOptions";
import { normalizeSlabSurfacePerM2Relation } from "../state/guards";

export function useFormeBarreDefaults({
  x,
  isSemelle,
  isSlab,
  isSlabSurfacePerM2SpacingDesignation,
  fallbackDiametreValue,
  normalizedDesignation,
  onPatch,
}: {
  x: FormeState;
  isSemelle: boolean;
  isSlab: boolean;
  isSlabSurfacePerM2SpacingDesignation: boolean;
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
      slabSpacingMode: isSemelle ? "NB_CADRE" : "ESPACEMENT",
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
  }, [normalizedDesignation, fallbackDiametreValue, isSemelle, onPatch]);

  useEffect(() => {
    if (isSemelle && !(x.barreCategorie ?? "").trim()) {
      onPatch({ barreCategorie: "Nappe inférieure" });
    }
  }, [isSemelle, x.barreCategorie, onPatch]);

  useEffect(() => {
    if (!isSlab) return;

    const rawTypeDeNappe = (x.barreCategorie ?? "").trim();
    const normalizedTypeDeNappe = normalizeTypeDeNappe(rawTypeDeNappe, normalizedDesignation);

    if (rawTypeDeNappe !== normalizedTypeDeNappe) {
      onPatch({ barreCategorie: normalizedTypeDeNappe });
    }
  }, [isSlab, x.barreCategorie, normalizedDesignation, onPatch]);

  useEffect(() => {
    if (isSemelle && !(x.semelleRelation ?? "").trim()) {
      onPatch({ semelleRelation: "ab_equal_same_if" });
    }
  }, [isSemelle, x.semelleRelation, onPatch]);

  useEffect(() => {
    if (!isSemelle) return;

    const patch: Partial<FormeState> = {};

    if (!(x.slabSpacingMode ?? "").trim()) patch.slabSpacingMode = "NB_CADRE";
    if (
      !(
        (x.slabSpacingRelation ?? "").trim() === "EA_EQ_EB" ||
        (x.slabSpacingRelation ?? "").trim() === "EA_NE_EB"
      )
    ) {
      patch.slabSpacingRelation = "EA_EQ_EB";
    }

    if (Object.keys(patch).length > 0) onPatch(patch);
  }, [isSemelle, x.slabSpacingMode, x.slabSpacingRelation, onPatch]);

  useEffect(() => {
    if (!isSlab) return;

    const patch: Partial<FormeState> = {};
    const isSlabSurfacePerM2SpacingMode =
      isSlabSurfacePerM2SpacingDesignation &&
      (x.slabCalcMethod ?? "SURFACE_TOTAL") === "SURFACE_TOTAL_PER_M2";

    if (!(x.slabCalcMethod ?? "").trim() || !isSlabSurfacePerM2SpacingDesignation) {
      if ((x.slabCalcMethod ?? "SURFACE_TOTAL") !== "SURFACE_TOTAL") {
        patch.slabCalcMethod = "SURFACE_TOTAL";
      } else if (!(x.slabCalcMethod ?? "").trim()) {
        patch.slabCalcMethod = "SURFACE_TOTAL";
      }
    }
    if (isSlabSurfacePerM2SpacingMode) {
      const nextRelation = normalizeSlabSurfacePerM2Relation(x.slabRelation);
      if (x.slabRelation !== nextRelation) patch.slabRelation = nextRelation;
    } else if (!(x.slabRelation ?? "").trim()) {
      patch.slabRelation = "ab_equal_same_if";
    }
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
    isSlabSurfacePerM2SpacingDesignation,
    onPatch,
  ]);
}

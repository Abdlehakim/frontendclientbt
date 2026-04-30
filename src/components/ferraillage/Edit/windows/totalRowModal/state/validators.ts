import type { FormeState } from "../types";
import { parseNonNegativeNumber, parsePositiveInt, parsePositiveNumber } from "../utils";
import {
  asSemelleRelation,
  asString,
  asTrimmedString,
  normalizeSlabSpacingRelationValue,
} from "./guards";

export function isSemelleBarreValid(source: Partial<FormeState>) {
  const nappe = asTrimmedString(source.barreCategorie, "") || "Nappe inférieure";

  if (nappe === "Chaise") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.longueurStr)) != null
    );
  }

  const relation = asSemelleRelation(source.semelleRelation);

  if (relation === "ab_equal_same_if") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null
    );
  }

  if (relation === "ab_equal_diff_if") {
    return (
      parsePositiveInt(asString(source.semelleNBarreAStr)) != null &&
      parsePositiveInt(asString(source.semelleNBarreBStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null
    );
  }

  if (relation === "ab_diff_same_if") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurBStr)) != null
    );
  }

  return (
    parsePositiveInt(asString(source.semelleNBarreAStr)) != null &&
    parsePositiveInt(asString(source.semelleNBarreBStr)) != null &&
    parsePositiveNumber(asString(source.semelleLongueurAStr)) != null &&
    parsePositiveNumber(asString(source.semelleLongueurBStr)) != null
  );
}

export function isSlabBarreValid(
  source: Partial<FormeState>,
  options?: { isSlabSurfacePerM2SpacingDesignation?: boolean },
) {
  const calcMethod = source.slabCalcMethod === "SURFACE_TOTAL_PER_M2" ? "SURFACE_TOTAL_PER_M2" : "SURFACE_TOTAL";

  if (calcMethod === "SURFACE_TOTAL_PER_M2") {
    if (options?.isSlabSurfacePerM2SpacingDesignation) {
      if (parsePositiveNumber(asString(source.slabSurfaceStr)) == null) return false;
      if (parsePositiveNumber(asString(source.slabEspacementAStr)) == null) return false;
      if (parseNonNegativeNumber(asString(source.slabPerimetreStr)) == null) return false;
      if (parseNonNegativeNumber(asString(source.slabAncrageLineaireStr)) == null) return false;

      const spacingRelation = normalizeSlabSpacingRelationValue(source.slabSpacingRelation);
      if (spacingRelation === "EA_NE_EB") {
        return parsePositiveNumber(asString(source.slabEspacementBStr)) != null;
      }

      return true;
    }

    return (
      parsePositiveNumber(asString(source.slabSurfaceStr)) != null &&
      parsePositiveNumber(asString(source.slabQtePerM2Str)) != null
    );
  }

  return parsePositiveNumber(asString(source.slabSurfaceStr)) != null;
}
